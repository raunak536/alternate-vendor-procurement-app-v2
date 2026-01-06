#!/usr/bin/env python3
"""
Vendor Research Pipeline CLI - V2

A 4-phase pipeline for vendor research in biopharma procurement:
  Phase 1: ENRICHMENT - Expand query + identify comparison attributes
  Phase 2: DISCOVERY  - Deep research to find at least 5 vendors (natural language)
  Phase 3: PARSE      - Convert discovery to structured JSON
  Phase 4: EXTRACTION - Extract specs from each vendor's product page

Usage:
    python pipeline.py research "<your product query>"     # Full pipeline
    python pipeline.py discover "<your product query>"     # Discovery only
    python pipeline.py extract "<query-id>"                # Extract specs
    python pipeline.py extract "<query-id>" --vendor-id 1
    python pipeline.py fetch-spec "<query-id>" --vendor-id 1 --spec "price"
    python pipeline.py list
    python pipeline.py show "<query-id>"

TSA 3P IRR Neutralizers
E.coli HcDNA kits; Cat #: 4458435
PROTEINA MIX-N-GO ELISAKIT F600

"""

import argparse
import json
import os
import sys
import re
import time
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List
import httpx

# Load environment variables
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / '.env')

from openai import OpenAI

# Local imports
from spec_library import BIOPHARMA_SPECS, format_specs_for_prompt, get_default_specs

# Data paths
DATA_DIR = Path(__file__).parent / "data"
VENDORS_JSON_PATH = DATA_DIR / "vendors.json"

# Ensure data directory exists
DATA_DIR.mkdir(exist_ok=True)

# OpenAI client setup
openai_api_key = os.getenv('OPENAI_API_KEY')
if not openai_api_key:
    print("Warning: OPENAI_API_KEY not found in environment variables")

# =============================================================================
# PRICING - OpenAI Model Costs (per 1M tokens, as of Jan 2025)
# =============================================================================
MODEL_PRICING = {
    # GPT-4.1 series
    "gpt-4.1-2025-04-14": {"input": 2.00, "output": 8.00},
    "gpt-4.1": {"input": 2.00, "output": 8.00},
    # GPT-4o series
    "gpt-4o": {"input": 2.50, "output": 10.00},
    "gpt-4o-mini": {"input": 0.15, "output": 0.60},
    # Deep research models (estimated based on compute)
    "o4-mini-deep-research": {"input": 2.00, "output": 8.00},
    "o3-mini": {"input": 1.10, "output": 4.40},
    # Fallback
    "default": {"input": 2.50, "output": 10.00}
}

def calculate_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    """Calculate cost in USD for a given model and token counts."""
    pricing = MODEL_PRICING.get(model, MODEL_PRICING["default"])
    input_cost = (input_tokens / 1_000_000) * pricing["input"]
    output_cost = (output_tokens / 1_000_000) * pricing["output"]
    return round(input_cost + output_cost, 6)

def format_cost(cost: float) -> str:
    """Format cost as string with appropriate precision."""
    if cost < 0.01:
        return f"${cost:.4f}"
    return f"${cost:.2f}"


def get_openai_client():
    """Get OpenAI client with extended timeouts for deep research."""
    return OpenAI(
        api_key=openai_api_key,
        timeout=httpx.Timeout(
            connect=120.0,
            read=7200.0,    # 2 hours for deep research
            write=120.0,
            pool=120.0
        ),
        max_retries=3
    )


def retry_with_backoff(func, max_retries=3, initial_delay=5):
    """Retry a function with exponential backoff."""
    last_exception = None
    for attempt in range(max_retries + 1):
        try:
            return func()
        except Exception as e:
            last_exception = e
            error_msg = str(e).lower()
            
            if "invalid_api_key" in error_msg or "authentication" in error_msg:
                raise e
            
            if attempt < max_retries:
                delay = initial_delay * (2 ** attempt)
                print(f"\n   ⚠️  Attempt {attempt + 1} failed: {e}")
                print(f"   ⏳ Retrying in {delay} seconds...")
                time.sleep(delay)
            else:
                raise last_exception


def slugify(text: str) -> str:
    """Convert text to URL-friendly slug."""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text


def load_vendors_data() -> Dict[str, Any]:
    """Load existing vendors data from JSON file."""
    if VENDORS_JSON_PATH.exists():
        with open(VENDORS_JSON_PATH, 'r') as f:
            return json.load(f)
    return {"queries": {}}


def save_vendors_data(data: Dict[str, Any]) -> None:
    """Save vendors data to JSON file."""
    with open(VENDORS_JSON_PATH, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"✓ Data saved to {VENDORS_JSON_PATH}")


def get_next_version(query_data: Dict[str, Any]) -> int:
    """Get the next version number for a query."""
    versions = query_data.get("versions", [])
    if not versions:
        return 1
    return max(v.get("version", 0) for v in versions) + 1


def save_query_with_versioning(query_key: str, query_entry: Dict[str, Any]) -> int:
    """
    Save a query entry with versioning support.
    Returns the version number assigned.
    """
    data = load_vendors_data()
    
    if query_key not in data["queries"]:
        # New query - initialize with versions array
        data["queries"][query_key] = {
            "query_id": query_entry["query_id"],
            "query_text": query_entry["query_text"],
            "versions": [],
            "current_version": 1
        }
    elif "versions" not in data["queries"][query_key]:
        # Migrate old format to new versioned format
        old_data = data["queries"][query_key].copy()
        data["queries"][query_key] = {
            "query_id": old_data.get("query_id", query_entry["query_id"]),
            "query_text": old_data.get("query_text", query_entry["query_text"]),
            "versions": [],
            "current_version": 0
        }
        # If old data had vendors/results, save it as version 1
        if "vendors" in old_data or "enriched_query" in old_data:
            old_data["version"] = 1
            old_data["version_date"] = old_data.get("last_updated", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
            data["queries"][query_key]["versions"].append(old_data)
            data["queries"][query_key]["current_version"] = 1
    
    # Get next version number
    version_num = get_next_version(data["queries"][query_key])
    
    # Add version metadata to entry
    query_entry["version"] = version_num
    query_entry["version_date"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Append to versions array
    data["queries"][query_key]["versions"].append(query_entry)
    data["queries"][query_key]["current_version"] = version_num
    data["queries"][query_key]["last_updated"] = query_entry["version_date"]
    
    save_vendors_data(data)
    return version_num


def parse_json_response(response_text: str) -> dict:
    """Parse JSON from LLM response, handling markdown code blocks."""
    text = response_text.strip()
    
    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    
    # Try extracting from markdown code block
    if "```" in text:
        match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass
    
    # Try finding JSON object/array anywhere
    for pattern in [r'\{[\s\S]*\}', r'\[[\s\S]*\]']:
        match = re.search(pattern, text)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass
    
    raise ValueError(f"Could not parse JSON from response:\n{text[:500]}...")


# =============================================================================
# PROMPTS
# =============================================================================

ENRICHMENT_PROMPT = """You are an expert in biopharma procurement.

Rewrite the user query to be clear and detailed for vendor research. Also identify the key specs that matter for comparing this specific product type.

USER QUERY: {query}

BASE ATTRIBUTES (always include these):
{base_specs}

OUTPUT FORMAT (valid JSON only):
{{
    "enriched_query": "Detailed procurement query with expanded abbreviations, product type, intended use, and key requirements...",
    "comparison_attributes": [
        // MUST include ALL base attributes listed above, plus 2-4 additional product-specific attributes
        {{
            "key": "<attribute_key_in_snake_case>",
            "display_name": "<Human Readable Name>",
            "description": "<What this attribute measures or represents>",
            "look_for": ["<term1>", "<term2>", "<term3>", "<term4>"]
        }}
    ]
}}

INSTRUCTIONS:
1. Expand any abbreviations or acronyms in the query to their full form
2. Add relevant context about product category and typical use cases
3. ALWAYS include ALL the base attributes listed above in your comparison_attributes
4. Add 2-4 ADDITIONAL attributes specific to this product type beyond the base attributes
5. Use snake_case for attribute keys
6. Include relevant search aliases in look_for (terms vendors might use for the same thing)
7. Total comparison_attributes should be 8-12 (base attributes + product-specific ones)

The base attributes are critical for all biopharma procurement comparisons. Add product-specific attributes on top of them."""


DISCOVERY_PROMPT = """You are a domain expert in biopharma procurement researching alternate MANUFACTURERS (not just vendors/resellers).

CONTEXT:
We are procuring for a large Indian biopharma company. We need to find alternate MANUFACTURERS for the product below.
These are critical, high-value SKUs worth millions of dollars - quality and reliability are paramount.

PRODUCT QUERY:
{enriched_query}

ATTRIBUTES THAT WILL BE EXTRACTED LATER:
{attributes_list}

YOUR TASK:
Find at least 10 alternate MANUFACTURERS that produce this EXACT product or very close equivalents.

CRITICAL RULE - UNIQUE MANUFACTURERS ONLY:
- You MAY search vendor/reseller websites (VWR, Fisher Scientific, etc.) to discover products - that's fine
- BUT each MANUFACTURER must appear only ONCE in your results
- If you find Corning products on VWR's website, report it as Corning (the manufacturer) - do NOT also report Corning from Fisher Scientific's website
- Example of WRONG result: Reporting Corning flask found on VWR, then same Corning flask found on Fisher Scientific - this is duplicate manufacturer
- Example of CORRECT result: Reporting Corning, Thermo Fisher, Greiner Bio-One, Eppendorf, Sarstedt - DIFFERENT manufacturers (even if you found some via reseller websites)

MANUFACTURER REQUIREMENTS:
Only include ESTABLISHED, REPUTABLE manufacturers:
- Must be well-known, tier-1 or tier-2 global biopharma suppliers
- Must have proven track record in biopharma/life sciences industry
- Must have proper quality certifications (ISO, FDA registered, etc.)
- NO small unknown players, regional-only suppliers, or unverified manufacturers
- NO random suppliers from obscure marketplaces or trading platforms


URL VERIFICATION - ABSOLUTELY CRITICAL:
- ONLY include products where you have VERIFIED the URL loads a valid product page
- Do NOT include URLs that might be outdated, broken, or lead to 404 errors
- Do NOT guess or construct URLs - only use URLs you have actually verified exist
- If you cannot verify a URL works and shows the actual product, DO NOT include that result
- Prefer manufacturer's direct website over third-party reseller pages
- If a manufacturer's website is difficult to navigate or doesn't have direct product links, it's better to skip than provide a broken link

NEVER USE PLACEHOLDER OR EXAMPLE URLs - THIS IS A SERIOUS ERROR:
- NEVER output placeholder URLs like "https://exact-product-page-url" or "https://example.com/product"
- NEVER output template URLs like "https://vendor.com/product-page" or "[URL]" or "URL_HERE"
- NEVER make up fake URLs that look real but don't exist
- If you cannot find a real, working URL for a product, DO NOT include that manufacturer in results
- Every URL must be a REAL URL you actually found during your research
- It is better to return 10 manufacturers with real URLs than 20 manufacturers with fake/placeholder URLs

URL REGION PREFERENCE (only after verification):
When the same product exists on multiple regional sites, prefer in this order:
1. Global sites (.com without regional path)
2. US sites (/US/en, /us/en, .com/us)
3. India sites (/IN/en, /in/en)
4. Other regional sites only if the above are unavailable

FOR EACH MANUFACTURER, REPORT:
- Vendor name
- Product name (exact name as shown on manufacturer's site)
- Direct product page URL (MUST be verified working - the specific product page, NOT homepage or search results)
- Brief product description
- Confidence level (high/medium/low) that this is an EXACT match
- URL verification status: Confirm you have verified this URL loads the product page
- Recommendation score (0.0 to 1.0) - how strongly you recommend this manufacturer
  - 0.9-1.0: Excellent match from tier-1 manufacturer with verified working URL
  - 0.7-0.8: Good match from established manufacturer with verified URL
  - 0.5-0.6: Acceptable match, consider as alternative
  - Below 0.5: Weak match, only if no better options
- Recommendation reason (1-2 sentences explaining why - include manufacturer reputation)
- Any concerns (out of stock, discontinued, regional restrictions, etc.)

IMPORTANT:
- Find at least 10 DIFFERENT MANUFACTURERS (not 10 vendors selling same manufacturer's product)
- EXACT MATCH is critical - do not pad results with loosely related products
- ONLY established, reputable manufacturers - no unknown or small players
- URL MUST WORK - if you cannot verify the link, do not include the result
- Quality over quantity - 10 verified results from reputable manufacturers is better than 20 unverified results
- Write naturally as a research report - do NOT use rigid JSON format
- Do NOT extract detailed specs - just find manufacturers and their verified product URLs
- Do NOT include inline citations with brackets - just list URLs clearly"""


PARSE_DISCOVERY_PROMPT = """Convert this vendor research report into structured JSON.

RESEARCH REPORT:
{raw_discovery}

OUTPUT FORMAT (valid JSON only):
{{
    "vendors": [
        {{
            "vendor_name": "Full vendor name",
            "product_name": "Exact product name as shown on vendor site",
            "product_url": "THE ACTUAL URL FROM THE REPORT - must be a real URL like https://www.thermofisher.com/order/catalog/product/12345",
            "product_description": "Brief description of the product",
            "confidence": "high/medium/low",
            "recommendation_score": 0.85,
            "recommendation_reason": "Brief explanation for the score",
            "concerns": "Any noted issues, or null if none"
        }}
    ]
}}

CRITICAL URL RULES - READ CAREFULLY:
- product_url MUST be the ACTUAL URL from the research report, NOT a placeholder
- NEVER output placeholder URLs like "https://exact-product-page-url" or "https://example.com"
- NEVER output template text like "THE ACTUAL URL FROM THE REPORT" - use the real URL
- If a vendor in the report does not have a real, specific URL, SKIP that vendor entirely
- Every URL must start with https:// and be a complete, real product page URL

INSTRUCTIONS:
1. Extract ALL vendors mentioned that have valid product URLs (direct product pages, not homepages or search results)
2. Include the exact product_name as mentioned in the report for each vendor
3. Exclude any vendors marked as unavailable, discontinued, or unreliable
4. SKIP any vendor that does not have a real, complete URL - do not use placeholders
5. Normalize vendor names consistently (e.g., "Sigma-Aldrich" and "MilliporeSigma" should both be "MilliporeSigma (Sigma-Aldrich)")
6. Keep descriptions concise but informative
7. Preserve the confidence level and any concerns mentioned
8. Extract recommendation_score as a decimal between 0.0 and 1.0 (if not explicitly mentioned, infer from confidence: high=0.85, medium=0.65, low=0.45)
9. Extract recommendation_reason - the explanation for why this score was given. If not explicitly stated, generate a brief reason based on confidence level and any noted strengths/concerns
10. Set concerns to null if no issues were noted"""


SPEC_AVAILABILITY_PROMPT = """Check which product specs are available on this page.

PRODUCT URL: {product_url}

SPECS TO CHECK:
{specs_list}

Visit the product page and identify which specs have actual values displayed.

OUTPUT FORMAT (valid JSON only):
{{
    "available_specs": ["<spec_keys_that_are_visible>"],
    "unavailable_specs": ["<spec_keys_not_found>"],
    "page_title": "Product page title if found",
    "notes": "Any relevant observations about the page"
}}

INSTRUCTIONS:
1. Use web search to access the product page
2. For each spec, check if the information is actually visible on the page
3. Be conservative - only mark as "available" if you can clearly see the data
4. Note if the page requires login, shows "request quote", or has regional restrictions"""


EXTRACTION_PROMPT = """Extract product specs from this vendor page.

PRODUCT URL: {product_url}

SPECS TO EXTRACT:
{specs_with_aliases}

INSTRUCTIONS:
1. Use web search to access the product page at the given URL
2. For each spec, find the matching information on the page
3. Vendor pages use different labels - match by MEANING not exact text
4. Use the "look_for" hints to find the right data
5. Extract the actual VALUE, not the label
6. Note what label the vendor used (for traceability)
7. If information is not found, set value to "Not found"
8. IMPORTANT: If you find the manufacturer name, also determine the manufacturer's country of origin (where the company is headquartered)

OUTPUT FORMAT (valid JSON only):
{{
    "results": {{
        "<spec_key>": {{
            "value": "<extracted value>",
            "original_label": "<label the vendor used>",
            "confidence": "high/medium/low"
        }}
    }},
    "manufacturer_country": "<country of origin of the manufacturer, e.g., USA, Germany, Japan, etc.>",
    "page_title": "Product page title",
    "extraction_notes": "Any relevant observations"
}}

IMPORTANT:
- For prices, include currency AND quantity/unit
- For temperatures, include units (e.g., "2-8°C" not just "2-8")
- Set confidence to "low" if the information seems ambiguous or unclear
- Do NOT guess or make up values - use "Not found" if uncertain
- For manufacturer_country, use your knowledge of major biopharma manufacturers to determine country of origin"""


# =============================================================================
# PHASE 1: ENRICHMENT
# =============================================================================

def run_enrichment(query: str) -> Dict[str, Any]:
    """
    Phase 1: Enrich the user query and identify comparison attributes.
    
    Args:
        query: Raw user query
        
    Returns:
        dict with enriched_query and comparison_attributes
    """
    print("\n📝 Phase 1: Enriching query...")
    
    client = get_openai_client()
    
    # Format base specs from library for inclusion in prompt
    base_specs_formatted = format_specs_for_prompt(get_default_specs())
    
    prompt = ENRICHMENT_PROMPT.format(query=query, base_specs=base_specs_formatted)
    
    def make_call():
        return client.responses.create(
            model="gpt-4.1-2025-04-14",
            input=prompt
        )
    
    response = retry_with_backoff(make_call, max_retries=2, initial_delay=5)
    
    result = parse_json_response(response.output_text)
    
    # Track token usage
    tokens = {}
    if hasattr(response, 'usage') and response.usage:
        tokens = {
            "input": getattr(response.usage, 'input_tokens', 0),
            "output": getattr(response.usage, 'output_tokens', 0),
            "total": getattr(response.usage, 'total_tokens', 0)
        }
    
    result["tokens_used"] = tokens
    result["model"] = "gpt-4.1-2025-04-14"
    
    print(f"   ✓ Enriched query generated")
    print(f"   ✓ {len(result.get('comparison_attributes', []))} comparison attributes identified")
    
    return result


# =============================================================================
# PHASE 2: DISCOVERY
# =============================================================================

def run_discovery(enriched_query: str, comparison_attributes: List[Dict]) -> Dict[str, Any]:
    """
    Phase 2: Run deep research to discover vendors.
    
    Args:
        enriched_query: The enriched query from Phase 1
        comparison_attributes: List of attributes to consider
        
    Returns:
        dict with raw_response, market_summary, time_taken, tokens
    """
    print("\n🌐 Phase 2: Running deep research...")
    print("   This may take 3-10 minutes. Will auto-retry on connection errors...")
    
    client = get_openai_client()
    start_time = time.time()
    
    # Format attributes for the prompt
    attrs_list = "\n".join([
        f"- {attr['display_name']}: {attr['description']}"
        for attr in comparison_attributes
    ])
    
    prompt = DISCOVERY_PROMPT.format(
        enriched_query=enriched_query,
        attributes_list=attrs_list
    )
    
    def make_call():
        return client.responses.create(
            model="o4-mini-deep-research",
            input=prompt,
            tools=[{"type": "web_search"}],
            reasoning={"summary": "auto"},
            background=False,
            timeout=7200
        )
    
    response = retry_with_backoff(make_call, max_retries=3, initial_delay=10)
    
    end_time = time.time()
    time_taken = round(end_time - start_time, 2)
    
    tokens = {}
    if hasattr(response, 'usage') and response.usage:
        tokens = {
            "input": getattr(response.usage, 'input_tokens', 0),
            "output": getattr(response.usage, 'output_tokens', 0),
            "total": getattr(response.usage, 'total_tokens', 0)
        }
    
    print(f"   ✓ Discovery complete ({time_taken}s)")
    
    return {
        "raw_response": response.output_text,
        "model": "o4-mini-deep-research",
        "time_taken_seconds": time_taken,
        "tokens_used": tokens,
        "completed_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }


# =============================================================================
# PHASE 3: PARSE DISCOVERY
# =============================================================================

def parse_discovery(raw_discovery: str) -> Dict[str, Any]:
    """
    Phase 3: Parse natural language discovery into structured JSON.
    
    Args:
        raw_discovery: Raw text from deep research
        
    Returns:
        dict with vendors list and token info
    """
    print("\n🔧 Phase 3: Parsing discovery results...")
    
    client = get_openai_client()
    
    prompt = PARSE_DISCOVERY_PROMPT.format(raw_discovery=raw_discovery)
    
    def make_call():
        return client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=2000
        )
    
    response = retry_with_backoff(make_call, max_retries=2, initial_delay=5)
    
    result = parse_json_response(response.choices[0].message.content)
    
    # Add token info
    if hasattr(response, 'usage') and response.usage:
        result["tokens_used"] = {
            "input": response.usage.prompt_tokens,
            "output": response.usage.completion_tokens,
            "total": response.usage.total_tokens
        }
    
    print(f"   ✓ Parsed {len(result.get('vendors', []))} vendors")
    
    return result


# =============================================================================
# PHASE 4: SPEC EXTRACTION
# =============================================================================

def discover_available_specs(product_url: str, comparison_attributes: List[Dict]) -> Dict[str, Any]:
    """
    Check which specs are available on a product page.
    
    Args:
        product_url: URL of the product page
        comparison_attributes: List of specs to check
        
    Returns:
        dict with available_specs and unavailable_specs lists
    """
    client = get_openai_client()
    
    specs_list = "\n".join([
        f"- {attr['key']} ({attr['display_name']}): {attr['description']}"
        for attr in comparison_attributes
    ])
    
    prompt = SPEC_AVAILABILITY_PROMPT.format(
        product_url=product_url,
        specs_list=specs_list
    )
    
    def make_call():
        return client.responses.create(
            model="gpt-4o",
            input=prompt,
            tools=[{"type": "web_search"}]
        )
    
    response = retry_with_backoff(make_call, max_retries=2, initial_delay=5)
    
    return parse_json_response(response.output_text)


def extract_specs(product_url: str, specs_to_extract: List[Dict], model: str = "gpt-4o") -> Dict[str, Any]:
    """
    Extract specific specs from a product page.
    
    Args:
        product_url: URL of the product page
        specs_to_extract: List of spec definitions with look_for aliases
        model: Model to use (default gpt-4o for accuracy)
        
    Returns:
        dict with results for each spec
    """
    client = get_openai_client()
    
    # Format specs with aliases for the prompt
    specs_formatted = []
    for spec in specs_to_extract:
        aliases = ", ".join(spec.get("look_for", [])[:6])
        specs_formatted.append(
            f"- {spec['key']} ({spec['display_name']}): {spec['description']}\n"
            f"  Look for: {aliases}"
        )
    
    prompt = EXTRACTION_PROMPT.format(
        product_url=product_url,
        specs_with_aliases="\n".join(specs_formatted)
    )
    
    def make_call():
        return client.responses.create(
            model=model,
            input=prompt,
            tools=[{"type": "web_search"}]
        )
    
    response = retry_with_backoff(make_call, max_retries=2, initial_delay=5)
    
    result = parse_json_response(response.output_text)
    
    # Add metadata
    tokens = {}
    if hasattr(response, 'usage') and response.usage:
        tokens = {
            "input": getattr(response.usage, 'input_tokens', 0),
            "output": getattr(response.usage, 'output_tokens', 0),
            "total": getattr(response.usage, 'total_tokens', 0)
        }
    
    result["model"] = model
    result["tokens_used"] = tokens
    result["extracted_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    return result


def extract_single_spec(product_url: str, spec_key: str, spec_definition: Dict = None) -> Dict[str, Any]:
    """
    Extract a single spec from a product page (on-demand).
    
    Args:
        product_url: URL of the product page
        spec_key: Key of the spec to extract
        spec_definition: Optional spec definition; if not provided, uses library
        
    Returns:
        dict with extracted spec value
    """
    if spec_definition is None:
        spec_definition = BIOPHARMA_SPECS.get(spec_key)
        if not spec_definition:
            return {
                "value": None,
                "error": f"Unknown spec key: {spec_key}",
                "confidence": "low"
            }
    
    result = extract_specs(product_url, [spec_definition])
    
    if "results" in result and spec_key in result["results"]:
        return result["results"][spec_key]
    
    return {
        "value": "Not found",
        "confidence": "low",
        "model": result.get("model"),
        "extracted_at": result.get("extracted_at")
    }


# =============================================================================
# ORCHESTRATION
# =============================================================================

def run_full_pipeline(query: str, extract_specs_flag: bool = True) -> Dict[str, Any]:
    """
    Run the full 4-phase pipeline.
    
    Args:
        query: User's product query
        extract_specs_flag: Whether to run Phase 4 extraction
        
    Returns:
        Complete query entry with all data
    """
    total_start = time.time()
    
    # Track tokens and costs per step
    step_stats = {
        "enrichment": {"model": None, "input_tokens": 0, "output_tokens": 0, "cost": 0.0},
        "discovery": {"model": None, "input_tokens": 0, "output_tokens": 0, "cost": 0.0},
        "parsing": {"model": None, "input_tokens": 0, "output_tokens": 0, "cost": 0.0},
        "extraction": {"model": None, "input_tokens": 0, "output_tokens": 0, "cost": 0.0, "vendor_count": 0}
    }
    
    print(f"\n{'='*60}")
    print(f"🔍 Running full pipeline for: {query}")
    print(f"{'='*60}")
    
    # Phase 1: Enrichment
    enrichment = run_enrichment(query)
    enriched_query = enrichment["enriched_query"]
    comparison_attributes = enrichment["comparison_attributes"]
    
    # Track enrichment tokens
    step_stats["enrichment"]["model"] = enrichment.get("model", "gpt-4.1-2025-04-14")
    if enrichment.get("tokens_used"):
        step_stats["enrichment"]["input_tokens"] = enrichment["tokens_used"].get("input", 0)
        step_stats["enrichment"]["output_tokens"] = enrichment["tokens_used"].get("output", 0)
        step_stats["enrichment"]["cost"] = calculate_cost(
            step_stats["enrichment"]["model"],
            step_stats["enrichment"]["input_tokens"],
            step_stats["enrichment"]["output_tokens"]
        )
    
    print(f"\n--- Enriched Query ---\n{enriched_query[:500]}...")
    
    # Phase 2: Discovery
    discovery = run_discovery(enriched_query, comparison_attributes)
    
    # Track discovery tokens
    step_stats["discovery"]["model"] = discovery.get("model", "o4-mini-deep-research")
    if discovery.get("tokens_used"):
        step_stats["discovery"]["input_tokens"] = discovery["tokens_used"].get("input", 0)
        step_stats["discovery"]["output_tokens"] = discovery["tokens_used"].get("output", 0)
        step_stats["discovery"]["cost"] = calculate_cost(
            step_stats["discovery"]["model"],
            step_stats["discovery"]["input_tokens"],
            step_stats["discovery"]["output_tokens"]
        )
    
    # Phase 3: Parse
    parsed = parse_discovery(discovery["raw_response"])
    
    # Track parsing tokens
    step_stats["parsing"]["model"] = "gpt-4o-mini"
    if parsed.get("tokens_used"):
        step_stats["parsing"]["input_tokens"] = parsed["tokens_used"].get("input", 0)
        step_stats["parsing"]["output_tokens"] = parsed["tokens_used"].get("output", 0)
        step_stats["parsing"]["cost"] = calculate_cost(
            step_stats["parsing"]["model"],
            step_stats["parsing"]["input_tokens"],
            step_stats["parsing"]["output_tokens"]
        )
    
    # Build query entry structure
    query_id = slugify(query)
    query_entry = {
        "query_id": query_id,
        "query_text": query,
        "enriched_query": enriched_query,
        "comparison_attributes": comparison_attributes,
        "discovery": {
            "model": discovery["model"],
            "completed_at": discovery["completed_at"],
            "time_taken_seconds": discovery["time_taken_seconds"],
            "tokens_used": discovery["tokens_used"],
            "raw_response": discovery["raw_response"]
        },
        "vendors": [],
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    # Structure vendors
    for i, vendor in enumerate(parsed.get("vendors", []), 1):
        structured_vendor = {
            "id": i,
            "vendor_name": vendor.get("vendor_name", "Unknown"),
            "product_name": vendor.get("product_name"),
            "product_url": vendor.get("product_url"),
            "product_description": vendor.get("product_description"),
            "discovery_confidence": vendor.get("confidence", "medium"),
            "recommendation_score": vendor.get("recommendation_score", 0.5),
            "recommendation_reason": vendor.get("recommendation_reason"),
            "discovery_concerns": vendor.get("concerns"),
            "specs_availability": None,
            "specs": {}
        }
        query_entry["vendors"].append(structured_vendor)
    
    print(f"\n✓ Found {len(query_entry['vendors'])} vendors")
    
    # Phase 4: Extraction (optional)
    if extract_specs_flag and query_entry["vendors"]:
        print("\n📊 Phase 4: Extracting specs from vendor pages...")
        step_stats["extraction"]["model"] = "gpt-4o"
        
        for vendor in query_entry["vendors"]:
            product_url = vendor.get("product_url")
            if not product_url:
                print(f"   [{vendor['id']}] {vendor['vendor_name']}: No product URL")
                continue
            
            print(f"   [{vendor['id']}] {vendor['vendor_name']}...")
            
            try:
                # Extract all comparison attributes
                extraction = extract_specs(product_url, comparison_attributes)
                
                # Track extraction tokens
                if extraction.get("tokens_used"):
                    step_stats["extraction"]["input_tokens"] += extraction["tokens_used"].get("input", 0)
                    step_stats["extraction"]["output_tokens"] += extraction["tokens_used"].get("output", 0)
                    step_stats["extraction"]["vendor_count"] += 1
                
                # Store results
                results = extraction.get("results", {})
                available = []
                unavailable = []
                
                for attr in comparison_attributes:
                    key = attr["key"]
                    if key in results:
                        spec_result = results[key]
                        value = spec_result.get("value")
                        
                        if value and value != "Not found":
                            available.append(key)
                            vendor["specs"][key] = {
                                "value": value,
                                "original_label": spec_result.get("original_label"),
                                "confidence": spec_result.get("confidence", "medium"),
                                "extracted_at": extraction.get("extracted_at"),
                                "model": extraction.get("model")
                            }
                        else:
                            unavailable.append(key)
                
                vendor["specs_availability"] = {
                    "checked_at": extraction.get("extracted_at"),
                    "available": available,
                    "unavailable": unavailable
                }
                
                # Store manufacturer country if found
                if extraction.get("manufacturer_country"):
                    vendor["manufacturer_country"] = extraction["manufacturer_country"]
                
                print(f"       ✓ Extracted {len(available)} specs")
                
            except Exception as e:
                print(f"       ⚠️ Error: {e}")
                vendor["specs_availability"] = {
                    "checked_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "error": str(e)
                }
        
        # Calculate extraction cost
        step_stats["extraction"]["cost"] = calculate_cost(
            step_stats["extraction"]["model"],
            step_stats["extraction"]["input_tokens"],
            step_stats["extraction"]["output_tokens"]
        )
    
    # Calculate totals
    total_input_tokens = sum(s["input_tokens"] for s in step_stats.values())
    total_output_tokens = sum(s["output_tokens"] for s in step_stats.values())
    total_cost = sum(s["cost"] for s in step_stats.values())
    total_time = round(time.time() - total_start, 2)
    
    # Build comprehensive pipeline stats
    query_entry["pipeline_stats"] = {
        "total_time_seconds": total_time,
        "total_tokens": {
            "input": total_input_tokens,
            "output": total_output_tokens,
            "total": total_input_tokens + total_output_tokens
        },
        "total_cost_usd": total_cost,
        "steps": {
            "enrichment": {
                "model": step_stats["enrichment"]["model"],
                "input_tokens": step_stats["enrichment"]["input_tokens"],
                "output_tokens": step_stats["enrichment"]["output_tokens"],
                "cost_usd": step_stats["enrichment"]["cost"]
            },
            "discovery": {
                "model": step_stats["discovery"]["model"],
                "input_tokens": step_stats["discovery"]["input_tokens"],
                "output_tokens": step_stats["discovery"]["output_tokens"],
                "cost_usd": step_stats["discovery"]["cost"]
            },
            "parsing": {
                "model": step_stats["parsing"]["model"],
                "input_tokens": step_stats["parsing"]["input_tokens"],
                "output_tokens": step_stats["parsing"]["output_tokens"],
                "cost_usd": step_stats["parsing"]["cost"]
            },
            "extraction": {
                "model": step_stats["extraction"]["model"],
                "input_tokens": step_stats["extraction"]["input_tokens"],
                "output_tokens": step_stats["extraction"]["output_tokens"],
                "cost_usd": step_stats["extraction"]["cost"],
                "vendors_processed": step_stats["extraction"]["vendor_count"]
            }
        }
    }
    
    return query_entry


def run_discovery_only(query: str) -> Dict[str, Any]:
    """Run only Phases 1-3 (discovery without extraction)."""
    return run_full_pipeline(query, extract_specs_flag=False)


# =============================================================================
# CLI COMMANDS
# =============================================================================

def cmd_research(args):
    """Handle the 'research' command - full pipeline."""
    query = args.query
    
    try:
        query_entry = run_full_pipeline(query, extract_specs_flag=True)
        
        # Save with versioning (don't overwrite existing versions)
        query_key = query.lower().strip()
        version_num = save_query_with_versioning(query_key, query_entry)
        
        # Print summary
        print(f"\n{'='*60}")
        print("📊 Research Results Summary")
        print(f"{'='*60}")
        print(f"Query ID: {query_entry['query_id']}")
        print(f"Version: {version_num}")
        print(f"Vendors found: {len(query_entry['vendors'])}")
        
        stats = query_entry.get('pipeline_stats', {})
        
        # Print detailed token and cost breakdown
        print(f"\n{'='*60}")
        print("💰 Token Usage & Cost Breakdown")
        print(f"{'='*60}")
        
        steps = stats.get('steps', {})
        for step_name, step_data in steps.items():
            if step_data.get("input_tokens", 0) > 0 or step_data.get("output_tokens", 0) > 0:
                print(f"\n  📍 {step_name.upper()}")
                print(f"     Model: {step_data.get('model', 'N/A')}")
                print(f"     Input tokens:  {step_data.get('input_tokens', 0):,}")
                print(f"     Output tokens: {step_data.get('output_tokens', 0):,}")
                print(f"     Cost: {format_cost(step_data.get('cost_usd', 0))}")
                if step_name == 'extraction' and step_data.get('vendors_processed'):
                    print(f"     Vendors processed: {step_data['vendors_processed']}")
        
        total_tokens = stats.get('total_tokens', {})
        print(f"\n  {'─'*40}")
        print(f"  📊 TOTALS")
        print(f"     Total input tokens:  {total_tokens.get('input', 0):,}")
        print(f"     Total output tokens: {total_tokens.get('output', 0):,}")
        print(f"     Total tokens:        {total_tokens.get('total', 0):,}")
        print(f"     Total cost:          {format_cost(stats.get('total_cost_usd', 0))}")
        print(f"     Total time:          {stats.get('total_time_seconds', 0)}s")
        
        print(f"\n{'='*60}")
        print("Vendors:")
        for v in query_entry["vendors"]:
            specs_count = len(v.get("specs", {}))
            print(f"  [{v['id']}] {v['vendor_name']} ({specs_count} specs extracted)")
        
        print(f"\n💡 View details: python pipeline.py show \"{query_entry['query_id']}\"")
        print(f"💡 List versions: python pipeline.py versions \"{query_entry['query_id']}\"")
        
    except Exception as e:
        print(f"\n❌ Error during research: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


def cmd_discover(args):
    """Handle the 'discover' command - discovery only, no extraction."""
    query = args.query
    
    try:
        query_entry = run_discovery_only(query)
        
        # Save with versioning
        query_key = query.lower().strip()
        version_num = save_query_with_versioning(query_key, query_entry)
        
        print(f"\n{'='*60}")
        print("📊 Discovery Results Summary")
        print(f"{'='*60}")
        print(f"Query ID: {query_entry['query_id']}")
        print(f"Version: {version_num}")
        print(f"Vendors found: {len(query_entry['vendors'])}")
        
        print("\nVendors:")
        for v in query_entry["vendors"]:
            print(f"  [{v['id']}] {v['vendor_name']} - {v.get('discovery_confidence', 'N/A')} confidence")
            if v.get("product_url"):
                print(f"       URL: {v['product_url'][:60]}...")
        
        print(f"\n💡 Extract specs: python pipeline.py extract \"{query_entry['query_id']}\"")
        
    except Exception as e:
        print(f"\n❌ Error during discovery: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


def cmd_versions(args):
    """Handle the 'versions' command - list all versions of a query."""
    query_id = args.query_id
    
    data = load_vendors_data()
    
    # Find the query
    query_data = None
    for key, entry in data["queries"].items():
        if entry.get("query_id") == query_id or query_id.lower() in key:
            query_data = entry
            break
    
    if not query_data:
        print(f"❌ Query not found: {query_id}")
        sys.exit(1)
    
    versions = query_data.get("versions", [])
    if not versions:
        print(f"❌ No versions found for: {query_id}")
        sys.exit(1)
    
    print(f"\n{'='*60}")
    print(f"📋 Versions for: {query_data.get('query_text', query_id)}")
    print(f"{'='*60}\n")
    
    print(f"Current version: {query_data.get('current_version', 'N/A')}")
    print(f"Total versions: {len(versions)}\n")
    
    for v in versions:
        is_current = v.get("version") == query_data.get("current_version")
        marker = " ← current" if is_current else ""
        
        print(f"  Version {v.get('version', '?')}{marker}")
        print(f"    Date: {v.get('version_date', 'N/A')}")
        print(f"    Vendors: {len(v.get('vendors', []))}")
        
        stats = v.get('pipeline_stats', {})
        if stats.get('total_cost_usd'):
            print(f"    Cost: {format_cost(stats['total_cost_usd'])}")
        print()


def cmd_extract(args):
    """Handle the 'extract' command - extract specs for existing query."""
    query_id = args.query_id
    vendor_id = args.vendor_id
    
    data = load_vendors_data()
    
    # Find the query
    query_entry = None
    query_key = None
    for key, entry in data["queries"].items():
        if entry["query_id"] == query_id or query_id.lower() in key:
            query_entry = entry
            query_key = key
            break
    
    if not query_entry:
        print(f"❌ Query not found: {query_id}")
        print("Available queries:")
        for entry in data["queries"].values():
            print(f"  • {entry['query_id']}")
        sys.exit(1)
    
    comparison_attributes = query_entry.get("comparison_attributes", get_default_specs())
    
    # Filter vendors if specific ID provided
    vendors_to_process = query_entry["vendors"]
    if vendor_id:
        vendors_to_process = [v for v in vendors_to_process if v["id"] == vendor_id]
        if not vendors_to_process:
            print(f"❌ Vendor ID {vendor_id} not found")
            sys.exit(1)
    
    print(f"\n{'='*60}")
    print(f"📊 Extracting specs for: {query_entry['query_id']}")
    print(f"{'='*60}")
    
    for vendor in vendors_to_process:
        product_url = vendor.get("product_url")
        if not product_url:
            print(f"\n[{vendor['id']}] {vendor['vendor_name']}: No product URL")
            continue
        
        print(f"\n[{vendor['id']}] {vendor['vendor_name']}")
        print(f"   URL: {product_url[:60]}...")
        
        try:
            extraction = extract_specs(product_url, comparison_attributes)
            
            results = extraction.get("results", {})
            available = []
            unavailable = []
            
            for attr in comparison_attributes:
                key = attr["key"]
                if key in results:
                    spec_result = results[key]
                    value = spec_result.get("value")
                    
                    if value and value != "Not found":
                        available.append(key)
                        vendor["specs"][key] = {
                            "value": value,
                            "original_label": spec_result.get("original_label"),
                            "confidence": spec_result.get("confidence", "medium"),
                            "extracted_at": extraction.get("extracted_at"),
                            "model": extraction.get("model")
                        }
                        print(f"   ✓ {key}: {value[:50]}...")
            else:
                        unavailable.append(key)
                        print(f"   ✗ {key}: Not found")
            
            vendor["specs_availability"] = {
                "checked_at": extraction.get("extracted_at"),
                "available": available,
                "unavailable": unavailable
            }
            
        except Exception as e:
            print(f"   ⚠️ Error: {e}")
    
    # Update and save
    query_entry["last_updated"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    data["queries"][query_key] = query_entry
    save_vendors_data(data)
    

def cmd_fetch_spec(args):
    """Handle the 'fetch-spec' command - fetch single spec on-demand."""
    query_id = args.query_id
    vendor_id = args.vendor_id
    spec_key = args.spec
    
    data = load_vendors_data()
    
    # Find query and vendor
    query_entry = None
    query_key = None
    for key, entry in data["queries"].items():
        if entry["query_id"] == query_id or query_id.lower() in key:
            query_entry = entry
            query_key = key
            break
    
    if not query_entry:
        print(f"❌ Query not found: {query_id}")
        sys.exit(1)
    
    vendor = None
    for v in query_entry["vendors"]:
        if v["id"] == vendor_id:
            vendor = v
            break
    
    if not vendor:
        print(f"❌ Vendor ID {vendor_id} not found")
        sys.exit(1)
    
    product_url = vendor.get("product_url")
    if not product_url:
        print(f"❌ No product URL for vendor [{vendor_id}]")
        sys.exit(1)
    
    print(f"\n{'='*60}")
    print(f"🔍 Fetching: {spec_key}")
    print(f"   Vendor: {vendor['vendor_name']}")
    print(f"   URL: {product_url}")
    print(f"{'='*60}\n")
    
    result = extract_single_spec(product_url, spec_key)
    
    print(f"Value: {result.get('value')}")
    print(f"Confidence: {result.get('confidence')}")
    
    if result.get("value") and result["value"] != "Not found":
        # Save to vendor specs
        if "specs" not in vendor:
            vendor["specs"] = {}
        vendor["specs"][spec_key] = result
        
        query_entry["last_updated"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        data["queries"][query_key] = query_entry
        save_vendors_data(data)
        print(f"\n✓ Saved to vendor specs")


def cmd_list(args):
    """Handle the 'list' command."""
    data = load_vendors_data()
    
    if not data["queries"]:
        print("No queries found. Run a research first:")
        print("  python pipeline.py research \"Your product query\"")
        return
    
    print(f"\n{'='*60}")
    print("📋 Saved Queries")
    print(f"{'='*60}\n")
    
    for key, entry in data["queries"].items():
        vendor_count = len(entry.get("vendors", []))
        specs_extracted = sum(
            len(v.get("specs", {})) 
            for v in entry.get("vendors", [])
        )
        
        print(f"• {entry['query_id']}")
        print(f"  Query: {entry['query_text']}")
        print(f"  Vendors: {vendor_count} ({specs_extracted} total specs extracted)")
        print(f"  Updated: {entry.get('last_updated', 'N/A')}")
        print()


def cmd_show(args):
    """Handle the 'show' command."""
    query_id = args.query_id
    version_num = getattr(args, 'version', None)
    
    data = load_vendors_data()
    
    query_data = None
    for key, entry in data["queries"].items():
        if entry.get("query_id") == query_id or query_id.lower() in key:
            query_data = entry
            break
    
    if not query_data:
        print(f"❌ Query not found: {query_id}")
        sys.exit(1)
    
    # Get the specific version or current version
    versions = query_data.get("versions", [])
    if versions:
        if version_num:
            query_entry = next((v for v in versions if v.get("version") == version_num), None)
            if not query_entry:
                print(f"❌ Version {version_num} not found")
                sys.exit(1)
        else:
            # Get current version
            current_ver = query_data.get("current_version", 1)
            query_entry = next((v for v in versions if v.get("version") == current_ver), versions[-1])
    else:
        # Old format - no versions
        query_entry = query_data
    
    print(f"\n{'='*60}")
    print(f"📄 Query Details: {query_entry.get('query_id', query_data.get('query_id'))}")
    if query_entry.get("version"):
        print(f"   Version: {query_entry['version']} ({query_entry.get('version_date', 'N/A')})")
    print(f"{'='*60}\n")
    
    print(f"Original Query: {query_entry.get('query_text', query_data.get('query_text'))}")
    print(f"Last Updated: {query_entry.get('last_updated', 'N/A')}")
    
    # Discovery info
    discovery = query_entry.get("discovery", {})
    if discovery:
        print(f"\nDiscovery:")
        print(f"  Model: {discovery.get('model', 'N/A')}")
        print(f"  Time: {discovery.get('time_taken_seconds', 'N/A')}s")
        tokens = discovery.get("tokens_used", {})
        if tokens:
            print(f"  Tokens: {tokens.get('total', 'N/A')} total")
    
    # Pipeline stats
    stats = query_entry.get("pipeline_stats", {})
    if stats.get("total_cost_usd"):
        print(f"\nPipeline Stats:")
        print(f"  Total Time: {stats.get('total_time_seconds', 'N/A')}s")
        print(f"  Total Cost: {format_cost(stats['total_cost_usd'])}")
        total_tokens = stats.get('total_tokens', {})
        print(f"  Total Tokens: {total_tokens.get('total', 'N/A'):,}")
    
    # Comparison attributes
    attrs = query_entry.get("comparison_attributes", [])
    if attrs:
        print(f"\nComparison Attributes ({len(attrs)}):")
        for attr in attrs:
            print(f"  • {attr['display_name']} ({attr['key']})")
    
    # Vendors
    print(f"\n{'='*60}")
    print("Vendors")
    print(f"{'='*60}\n")
    
    for vendor in query_entry.get("vendors", []):
        print(f"[{vendor['id']}] {vendor['vendor_name']}")
        if vendor.get("product_name"):
            print(f"    Product: {vendor['product_name']}")
        print(f"    Confidence: {vendor.get('discovery_confidence', 'N/A')}")
        print(f"    Recommendation: {vendor.get('recommendation_score', 'N/A')} - {vendor.get('recommendation_reason', 'N/A')}")
        print(f"    URL: {vendor.get('product_url', 'N/A')}")
        
        if vendor.get("manufacturer_country"):
            print(f"    Manufacturer Country: {vendor['manufacturer_country']}")
        
        if vendor.get("discovery_concerns"):
            print(f"    Concerns: {vendor['discovery_concerns']}")
        
        specs = vendor.get("specs", {})
        if specs:
            print(f"    Specs ({len(specs)}):")
            for key, spec in specs.items():
                value = spec.get("value", "N/A")
                conf = spec.get("confidence", "")
                print(f"      • {key}: {value[:60]}{'...' if len(str(value)) > 60 else ''} [{conf}]")
        else:
            print(f"    Specs: None extracted")
        
        print()


def cmd_export(args):
    """Handle the 'export' command."""
    query_id = args.query_id
    output_file = args.output
    
    data = load_vendors_data()
    
    query_entry = None
    for key, entry in data["queries"].items():
        if entry["query_id"] == query_id or query_id.lower() in key:
            query_entry = entry.copy()
            break
    
    if not query_entry:
        print(f"❌ Query not found: {query_id}")
        sys.exit(1)
    
    # Optionally strip raw discovery response to reduce size
    if not args.include_raw:
        if "discovery" in query_entry and "raw_response" in query_entry["discovery"]:
            query_entry["discovery"]["raw_response"] = "[STRIPPED - use --include-raw to include]"
    
    output_path = Path(output_file)
    with open(output_path, 'w') as f:
        json.dump(query_entry, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Exported to {output_path}")


# =============================================================================
# MAIN
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Vendor Research Pipeline CLI - V2",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python pipeline.py research "Your Product Query Here"    # Full pipeline
  python pipeline.py discover "Another Product"            # Discovery only (no extraction)
  python pipeline.py extract "your-product-query-here"     # Extract specs for all vendors
  python pipeline.py extract "your-product-query-here" --vendor-id 1  # Extract for one vendor
  python pipeline.py fetch-spec "query-id" --vendor-id 1 --spec "price"  # Fetch single spec
  python pipeline.py list                                  # List all saved queries
  python pipeline.py show "query-id"                       # Show details for a query
  python pipeline.py export "query-id" -o output.json      # Export to JSON
        """
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # Research command (full pipeline)
    research_parser = subparsers.add_parser(
        "research", 
        help="Run full pipeline: discover vendors + extract specs"
    )
    research_parser.add_argument("query", help="The product search query")
    research_parser.set_defaults(func=cmd_research)
    
    # Discover command (phases 1-3 only)
    discover_parser = subparsers.add_parser(
        "discover",
        help="Discover vendors only (skip spec extraction)"
    )
    discover_parser.add_argument("query", help="The product search query")
    discover_parser.set_defaults(func=cmd_discover)
    
    # Extract command
    extract_parser = subparsers.add_parser(
        "extract",
        help="Extract specs for an existing query"
    )
    extract_parser.add_argument("query_id", help="The query ID to extract specs for")
    extract_parser.add_argument(
        "--vendor-id", 
        type=int,
        help="Specific vendor ID (optional, extracts all if not specified)"
    )
    extract_parser.set_defaults(func=cmd_extract)
    
    # Fetch-spec command (single spec on-demand)
    fetch_parser = subparsers.add_parser(
        "fetch-spec",
        help="Fetch a single spec on-demand"
    )
    fetch_parser.add_argument("query_id", help="The query ID")
    fetch_parser.add_argument("--vendor-id", type=int, required=True, help="Vendor ID")
    fetch_parser.add_argument("--spec", required=True, help="Spec key to fetch")
    fetch_parser.set_defaults(func=cmd_fetch_spec)
    
    # List command
    list_parser = subparsers.add_parser("list", help="List all saved queries")
    list_parser.set_defaults(func=cmd_list)
    
    # Show command
    show_parser = subparsers.add_parser("show", help="Show details for a query")
    show_parser.add_argument("query_id", help="The query ID to show")
    show_parser.add_argument("--version", type=int, help="Specific version number (default: current)")
    show_parser.set_defaults(func=cmd_show)
    
    # Versions command
    versions_parser = subparsers.add_parser("versions", help="List all versions of a query")
    versions_parser.add_argument("query_id", help="The query ID to list versions for")
    versions_parser.set_defaults(func=cmd_versions)
    
    # Export command
    export_parser = subparsers.add_parser("export", help="Export query data to JSON")
    export_parser.add_argument("query_id", help="The query ID to export")
    export_parser.add_argument("-o", "--output", default="export.json", help="Output file")
    export_parser.add_argument(
        "--include-raw",
        action="store_true",
        help="Include raw discovery response (can be large)"
    )
    export_parser.set_defaults(func=cmd_export)
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    args.func(args)


if __name__ == "__main__":
    main()

