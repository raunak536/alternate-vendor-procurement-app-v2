#!/usr/bin/env python3
"""
Vendor Research Pipeline CLI

A comprehensive CLI for running deep research on vendor products,
crawling product URLs, and querying crawled data using LLMs.

Usage:
    python pipeline.py research "TSA 3P IRR Neutralizers"
    python pipeline.py research "FBS"
    python pipeline.py crawl "tsa-3p-irr-neutralizers"
    python pipeline.py crawl "tsa-3p-irr-neutralizers" --vendor-id 1
    python pipeline.py query "tsa-3p-irr-neutralizers" --vendor-id 1 "What is the price?"
    python pipeline.py list
    python pipeline.py show "tsa-3p-irr-neutralizers"
"""

import argparse
import json
import os
import sys
import asyncio
import re
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List
import httpx

# Load environment variables
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / '.env')

from openai import OpenAI

# Data paths
DATA_DIR = Path(__file__).parent / "data"
VENDORS_JSON_PATH = DATA_DIR / "vendors.json"

# Ensure data directory exists
DATA_DIR.mkdir(exist_ok=True)

# OpenAI client setup
openai_api_key = os.getenv('OPENAI_API_KEY')
if not openai_api_key:
    print("Warning: OPENAI_API_KEY not found in environment variables")


def get_openai_client():
    """Get OpenAI client with extended timeouts for deep research."""
    return OpenAI(
        api_key=openai_api_key,
        timeout=httpx.Timeout(
            connect=120.0,  # Increased connection timeout
            read=7200.0,    # 2 hours for deep research
            write=120.0,    # Increased write timeout
            pool=120.0      # Increased pool timeout
        ),
        max_retries=3  # Auto-retry on transient errors
    )


def retry_with_backoff(func, max_retries=3, initial_delay=5):
    """
    Retry a function with exponential backoff.
    
    Args:
        func: The function to call (should be a lambda or callable)
        max_retries: Maximum number of retry attempts
        initial_delay: Initial delay in seconds between retries
    
    Returns:
        The result of the function call
    """
    import time
    
    last_exception = None
    for attempt in range(max_retries + 1):
        try:
            return func()
        except Exception as e:
            last_exception = e
            error_msg = str(e).lower()
            
            # Don't retry on certain errors
            if "invalid_api_key" in error_msg or "authentication" in error_msg:
                raise e
            
            if attempt < max_retries:
                delay = initial_delay * (2 ** attempt)  # Exponential backoff
                print(f"\n   ⚠️  Attempt {attempt + 1} failed: {e}")
                print(f"   ⏳ Retrying in {delay} seconds...")
                time.sleep(delay)
            else:
                raise last_exception


# === Prompts ===

QUERY_ENRICHMENT_PROMPT = """
You are an expert in biopharma procurement.

Your job is to rewrite the user query to make it clear, detailed, and suitable for finding vendors or suppliers.

Additionally, you must identify 3-5 key attributes that are critical for comparing this specific SKU/product across different vendors (e.g., storage conditions, purity, grade, thickness, material, etc., depending on the product).

Instructions:
- Expand any abbreviations or jargon (e.g., change "FBS" to "Fetal Bovine Serum")
- Add important details needed for procurement, such as specifications, grades, certification, intended use, and size/packaging, if mentioned; if missing, clearly mark as "open" or "not specified"
- Suggest alternate product names, synonyms, or catalog numbers, if relevant, to help widen the search scope
- Remove overly broad generalities (like "good price") or note them as open criteria
- Focus it for vendor/supplier research
- Explicitly list the "Key Comparison Attributes" that should be fetched for comparison.

Output Structure:
1. **Enriched Procurement Query**: The detailed query with bullet points for each key requirement.
2. **Key Comparison Attributes**: A list of the 3-5 critical parameters for this SKU.

If the user query isn't in English, reply in the same language.

Do NOT make up any details that aren't in the original query regarding the user's specific requirements, but DO use your domain knowledge to identify standard comparison attributes.

Your goal is to maximize the chances of finding the right suppliers and enable a detailed comparison.
"""

DEEP_RESEARCH_PROMPT = """
You are a domain expert in biopharma procurement working for a large, global biopharma company.

Task:
Given the enriched user query (which includes "Key Comparison Attributes"), identify 3–5 *established, global* alternate vendors that supply the product.

PRIORITY VENDOR WEBSITES TO SEARCH:
- Fisher Scientific: https://www.fishersci.com/us/en/home.html
- Sigma-Aldrich (MilliporeSigma): https://www.sigmaaldrich.com/IN/en
- Thermo Fisher Scientific: https://www.thermofisher.com
- VWR/Avantor: https://www.vwr.com
- BD (Becton Dickinson): https://www.bd.com
- Sartorius: https://www.sartorius.com
- Corning: https://www.corning.com

Instructions:
- Output MUST be a valid JSON array of objects. No markdown formatting, no code blocks, just raw JSON.
- CRITICAL: Only include **well-established, global vendors** (e.g., Thermo Fisher, Merck/MilliporeSigma, Sartorius, VWR/Avantor, Corning, BD, etc.). Do NOT include small, local, or unknown distributors unless they are the primary manufacturer for a niche critical product. Large biopharma companies minimize risk by avoiding small/unknown vendors.
- Only include vendors you are confident actually supply the specific product requested. No hallucination.

CRITICAL - PRODUCT AVAILABILITY VERIFICATION:
- Before including a vendor, VERIFY that the product is actually available and in stock on the vendor's website.
- Check for "out of stock", "discontinued", "unavailable", "not available in your region" indicators.
- If a product page exists but shows the product is unavailable, DO NOT include it. This creates trust issues with end users.
- Only include products that appear to be actively available for purchase.
- Add a field "availability_status" with value "available", "limited", or "unverified" for each vendor.

CRITICAL - INLINE SOURCE CITATIONS:
Every piece of information MUST have a single source URL in square brackets at the end of the value.
Format: "value [https://exact-source-url.com/page]"

Rules for citations:
1. Use the MOST SPECIFIC URL where that exact info was found (e.g., the exact product page section, specs tab, or datasheet URL)
2. If exact URL unavailable, use the product page URL where the info appears
3. Only ONE URL per field - pick the best/most specific source
4. NO markdown links - just plain text with URL in square brackets
5. Example formats:
   - "price": "$125.00 / 100 pack [https://www.vendor.com/product/123]"
   - "storage_condition": "2-8°C, protect from light [https://www.vendor.com/product/123/specs]"
   - "certifications": "USP, EP, GMP [https://www.vendor.com/product/123/compliance]"

- For each vendor object, include the following keys:
    - "vendor_name": Name of the vendor (no URL needed).
    - "region": Region/country if available (no URL needed).
    - "product_description": Product basics with catalog code [source_url].
    - "product_url": A direct URL to the product page (CRITICAL: this allows us to scrape for more info later). MUST be a working URL. No brackets needed - this IS the URL.
    - "availability_status": "available", "limited", or "unverified" (no URL needed - derived from product_url).
    - "certifications": Comma-separated list of certifications [source_url]. If unknown, set to "NA".
    - "price": Raw price string with currency and package size [source_url]. If unavailable, set to "NA".
    - [Key Comparison Attributes]: Dynamic keys for attributes from the input (e.g., "storage_condition", "purity", "shelf_life"). Use snake_case. Each value MUST include [source_url].
        - For "storage_condition", look for: "store at", "storage", "temperature", "protect from light"
        - For "certifications", look for: "compliance", "monograph", "USP", "EP", "GMP"
        - For "shelf_life", look for: "expiry", "shelf life", "stability"

- Limit your results to just the 3–5 most relevant or credible vendors.
- ACCURACY IS PARAMOUNT. If any info provided is wrong, the user will lose trust. Prefer "NA" over guessing.
- SPEND MORE EFFORT ON SEARCHING: Dig into technical specifications, tabs like "Specifications", "Documents", or "SDS/COA" on vendor pages to find key attributes, prices, certifications, storage conditions, etc.
- Ensure the JSON is valid and parseable.
"""


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


def parse_deep_research_response(response_text: str) -> List[Dict[str, Any]]:
    """Parse the JSON array from deep research response."""
    # Try to find JSON array in the response
    text = response_text.strip()
    
    # If it starts with [, try direct parse
    if text.startswith('['):
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
    
    # Try to extract JSON array from markdown code blocks
    json_match = re.search(r'```(?:json)?\s*(\[[\s\S]*?\])\s*```', text)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass
    
    # Try to find array anywhere in text
    array_match = re.search(r'\[[\s\S]*\]', text)
    if array_match:
        try:
            return json.loads(array_match.group(0))
        except json.JSONDecodeError:
            pass
    
    raise ValueError(f"Could not parse JSON from response:\n{text[:500]}...")


def run_deep_research(query: str) -> Dict[str, Any]:
    """
    Run deep research on a product query.
    
    Args:
        query: The product search query
        
    Returns:
        Dictionary with query data and vendor results
    """
    import time
    
    client = get_openai_client()
    
    # Track total time and tokens
    start_time = time.time()
    total_tokens = {
        "input_tokens": 0,
        "output_tokens": 0,
        "total_tokens": 0
    }
    
    # Step 1: Enrich the query
    print(f"\n{'='*60}")
    print(f"🔍 Running deep research for: {query}")
    print(f"{'='*60}")
    print("\n📝 Step 1/2: Enriching query...")
    
    def make_enrichment_call():
        return client.responses.create(
            instructions=QUERY_ENRICHMENT_PROMPT,
            model="gpt-4.1-2025-04-14",
            input=query
        )
    
    enrichment_response = retry_with_backoff(make_enrichment_call, max_retries=2, initial_delay=5)
    enriched_query = enrichment_response.output[0].content[0].text
    
    # Track enrichment tokens
    if hasattr(enrichment_response, 'usage') and enrichment_response.usage:
        total_tokens["input_tokens"] += getattr(enrichment_response.usage, 'input_tokens', 0)
        total_tokens["output_tokens"] += getattr(enrichment_response.usage, 'output_tokens', 0)
        total_tokens["total_tokens"] += getattr(enrichment_response.usage, 'total_tokens', 0)
    
    print(f"\n--- Enriched Query ---\n{enriched_query}\n")
    
    # Step 2: Run deep research (always synchronous for reliability)
    print(f"🌐 Step 2/2: Running deep research...")
    print("   This may take 3-10 minutes. Will auto-retry on connection errors...")
    
    # Use retry with backoff for resilience against connection errors
    def make_deep_research_call():
        return client.responses.create(
            model="o4-mini-deep-research",
            instructions=DEEP_RESEARCH_PROMPT,
            reasoning={"summary": "auto"},
            input=enriched_query,
            tools=[{"type": "web_search"}],
            background=False,  # Always run synchronously for reliability
            timeout=7200
        )
    
    response = retry_with_backoff(make_deep_research_call, max_retries=3, initial_delay=10)
    
    # Track deep research tokens
    if hasattr(response, 'usage') and response.usage:
        total_tokens["input_tokens"] += getattr(response.usage, 'input_tokens', 0)
        total_tokens["output_tokens"] += getattr(response.usage, 'output_tokens', 0)
        total_tokens["total_tokens"] += getattr(response.usage, 'total_tokens', 0)
    
    # Calculate total time taken
    end_time = time.time()
    time_taken_seconds = round(end_time - start_time, 2)
    
    # Parse the response
    vendors = parse_deep_research_response(response.output_text)
    
    # Create query entry with structured data
    query_id = slugify(query)
    query_entry = {
        "query_id": query_id,
        "query_text": query,
        "enriched_query": enriched_query,
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "research_model": "o4-mini-deep-research",
        "time_taken_seconds": time_taken_seconds,
        "tokens_used": total_tokens,
        "vendors": []
    }
    
    # Structure each vendor with consistent fields
    for i, vendor in enumerate(vendors, 1):
        structured_vendor = {
            "id": i,
            "vendor_name": vendor.get("vendor_name", "Unknown"),
            "region": vendor.get("region"),
            "product_description": vendor.get("product_description"),
            "product_url": vendor.get("product_url"),
            "availability_status": vendor.get("availability_status", "unverified"),
            "certifications": vendor.get("certifications"),
            "price": vendor.get("price"),
            # Crawled data placeholder
            "crawled_data": None,
            "crawled_at": None,
            # Query results placeholder
            "extracted_info": {},
        }
        
        # Add dynamic fields (comparison attributes)
        # Skip source_urls since each field now has inline citations
        skip_keys = {"source_urls"}
        for key, value in vendor.items():
            if key not in structured_vendor and key not in skip_keys:
                structured_vendor[key] = value
        
        query_entry["vendors"].append(structured_vendor)
    
    print(f"\n✓ Found {len(vendors)} vendors")
    return query_entry


def cmd_research(args):
    """Handle the 'research' command."""
    query = args.query
    
    try:
        query_entry = run_deep_research(query)
        
        # Load existing data and add new query
        data = load_vendors_data()
        query_key = query.lower().strip()
        data["queries"][query_key] = query_entry
        
        # Save to file
        save_vendors_data(data)
        
        # Print summary
        print(f"\n{'='*60}")
        print("📊 Research Results Summary")
        print(f"{'='*60}")
        print(f"Query ID: {query_entry['query_id']}")
        print(f"Vendors found: {len(query_entry['vendors'])}")
        
        # Show time and token usage
        time_taken = query_entry.get('time_taken_seconds', 0)
        tokens = query_entry.get('tokens_used', {})
        print(f"\n⏱️  Time taken: {time_taken} seconds ({time_taken/60:.1f} minutes)")
        print(f"🪙 Tokens used: {tokens.get('total_tokens', 'N/A')} total")
        print(f"   └─ Input: {tokens.get('input_tokens', 'N/A')}, Output: {tokens.get('output_tokens', 'N/A')}")
        
        print("\nVendors:")
        for v in query_entry["vendors"]:
            price_str = v.get("price") or "N/A"
            print(f"  [{v['id']}] {v['vendor_name']} - {price_str}")
        
        print(f"\n💡 Next steps:")
        print(f"   • Crawl product URLs: python pipeline.py crawl \"{query_entry['query_id']}\"")
        print(f"   • View details: python pipeline.py show \"{query_entry['query_id']}\"")
        
    except Exception as e:
        print(f"\n❌ Error during research: {e}")
        sys.exit(1)


async def crawl_url(url: str) -> Optional[Dict[str, Any]]:
    """
    Crawl a URL using Crawl4AI and return the markdown content.
    
    Args:
        url: The URL to crawl
        
    Returns:
        Dictionary with markdown content and metadata, or None if failed
    """
    try:
        from crawl4ai import AsyncWebCrawler, CrawlerRunConfig
        
        config = CrawlerRunConfig(
            word_count_threshold=10,
            remove_overlay_elements=True,
        )
        
        async with AsyncWebCrawler() as crawler:
            result = await crawler.arun(url=url, config=config)
            
            if result.success:
                return {
                    "url": url,
                    "markdown": result.markdown,
                    "title": result.metadata.get("title", ""),
                    "crawled_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "word_count": len(result.markdown.split()) if result.markdown else 0
                }
            else:
                print(f"   ⚠️  Failed to crawl {url}: {result.error_message}")
                return None
                
    except ImportError:
        print("❌ Error: crawl4ai not installed. Install with: pip install crawl4ai")
        return None
    except Exception as e:
        print(f"   ⚠️  Error crawling {url}: {e}")
        return None


def cmd_crawl(args):
    """Handle the 'crawl' command."""
    query_id = args.query_id
    vendor_id = args.vendor_id
    
    # Load data
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
    
    print(f"\n{'='*60}")
    print(f"🕷️  Crawling product URLs for: {query_entry['query_id']}")
    print(f"{'='*60}")
    
    # Filter vendors if specific ID provided
    vendors_to_crawl = query_entry["vendors"]
    if vendor_id:
        vendors_to_crawl = [v for v in vendors_to_crawl if v["id"] == vendor_id]
        if not vendors_to_crawl:
            print(f"❌ Vendor ID {vendor_id} not found")
            sys.exit(1)
    
    # Crawl each vendor's product URL
    async def crawl_all():
        for vendor in vendors_to_crawl:
            url = vendor.get("product_url")
            if not url or url == "NA":
                print(f"\n[{vendor['id']}] {vendor['vendor_name']}: No product URL")
                continue
            
            print(f"\n[{vendor['id']}] {vendor['vendor_name']}")
            print(f"   URL: {url}")
            
            result = await crawl_url(url)
            if result:
                vendor["crawled_data"] = {
                    "markdown": result["markdown"],
                    "title": result["title"],
                    "word_count": result["word_count"]
                }
                vendor["crawled_at"] = result["crawled_at"]
                print(f"   ✓ Crawled successfully ({result['word_count']} words)")
            else:
                vendor["crawled_data"] = None
                vendor["crawled_at"] = None
    
    # Run async crawl
    asyncio.run(crawl_all())
    
    # Update the query entry's last_updated
    query_entry["last_updated"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Save updated data
    data["queries"][query_key] = query_entry
    save_vendors_data(data)
    
    # Summary
    crawled_count = sum(1 for v in vendors_to_crawl if v.get("crawled_data"))
    print(f"\n✓ Successfully crawled {crawled_count}/{len(vendors_to_crawl)} vendors")
    print(f"\n💡 Next: Query the crawled data:")
    print(f"   python pipeline.py query \"{query_entry['query_id']}\" --vendor-id 1 \"What is the price?\"")


def query_crawled_data(markdown: str, question: str, vendor_name: str) -> str:
    """
    Query crawled markdown data using OpenAI.
    
    Args:
        markdown: The crawled markdown content
        question: The user's question
        vendor_name: The vendor name for context
        
    Returns:
        The answer from the LLM
    """
    client = get_openai_client()
    
    prompt = f"""You are analyzing product information from a vendor's product page.

Vendor: {vendor_name}

Product Page Content (Markdown):
---
{markdown[:15000]}  # Truncate to avoid token limits
---

Question: {question}

Instructions:
- Answer the question based ONLY on the information in the product page content above
- Be concise and specific
- If the information is not available in the content, say "Not found in crawled data"
- For prices, include currency and any associated quantities/units
- For certifications, list all that are mentioned

Answer:"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_tokens=500
    )
    
    return response.choices[0].message.content.strip()


def cmd_query(args):
    """Handle the 'query' command."""
    query_id = args.query_id
    vendor_id = args.vendor_id
    question = args.question
    save_result = args.save
    
    # Load data
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
        sys.exit(1)
    
    # Find the vendor
    vendor = None
    for v in query_entry["vendors"]:
        if v["id"] == vendor_id:
            vendor = v
            break
    
    if not vendor:
        print(f"❌ Vendor ID {vendor_id} not found")
        print("Available vendors:")
        for v in query_entry["vendors"]:
            print(f"  [{v['id']}] {v['vendor_name']}")
        sys.exit(1)
    
    # Check if crawled data exists
    if not vendor.get("crawled_data") or not vendor["crawled_data"].get("markdown"):
        print(f"❌ No crawled data for vendor [{vendor_id}] {vendor['vendor_name']}")
        print(f"   Run: python pipeline.py crawl \"{query_id}\" --vendor-id {vendor_id}")
        sys.exit(1)
    
    print(f"\n{'='*60}")
    print(f"🔎 Querying vendor: {vendor['vendor_name']}")
    print(f"   Question: {question}")
    print(f"{'='*60}\n")
    
    # Query the LLM
    answer = query_crawled_data(
        vendor["crawled_data"]["markdown"],
        question,
        vendor["vendor_name"]
    )
    
    print(f"📝 Answer:\n{answer}\n")
    
    # Optionally save the result
    if save_result:
        # Store in extracted_info with question as key
        question_key = slugify(question)[:50]
        if "extracted_info" not in vendor:
            vendor["extracted_info"] = {}
        vendor["extracted_info"][question_key] = {
            "question": question,
            "answer": answer,
            "extracted_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        # Update and save
        query_entry["last_updated"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        data["queries"][query_key] = query_entry
        save_vendors_data(data)
        print(f"✓ Answer saved to vendor's extracted_info")


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
        crawled = sum(1 for v in entry.get("vendors", []) if v.get("crawled_data"))
        
        print(f"• {entry['query_id']}")
        print(f"  Query: {entry['query_text']}")
        print(f"  Vendors: {vendor_count} ({crawled} crawled)")
        print(f"  Updated: {entry.get('last_updated', 'N/A')}")
        print()


def cmd_show(args):
    """Handle the 'show' command."""
    query_id = args.query_id
    
    data = load_vendors_data()
    
    # Find the query
    query_entry = None
    for key, entry in data["queries"].items():
        if entry["query_id"] == query_id or query_id.lower() in key:
            query_entry = entry
            break
    
    if not query_entry:
        print(f"❌ Query not found: {query_id}")
        sys.exit(1)
    
    print(f"\n{'='*60}")
    print(f"📄 Query Details: {query_entry['query_id']}")
    print(f"{'='*60}\n")
    
    print(f"Original Query: {query_entry['query_text']}")
    print(f"Last Updated: {query_entry.get('last_updated', 'N/A')}")
    print(f"Model: {query_entry.get('research_model', 'N/A')}")
    
    # Show time and token usage if available
    time_taken = query_entry.get('time_taken_seconds')
    tokens = query_entry.get('tokens_used', {})
    if time_taken:
        print(f"Time Taken: {time_taken} seconds ({time_taken/60:.1f} minutes)")
    if tokens:
        print(f"Tokens Used: {tokens.get('total_tokens', 'N/A')} total (Input: {tokens.get('input_tokens', 'N/A')}, Output: {tokens.get('output_tokens', 'N/A')})")
    
    if query_entry.get("enriched_query"):
        print(f"\n--- Enriched Query ---")
        print(query_entry["enriched_query"][:500])
        if len(query_entry.get("enriched_query", "")) > 500:
            print("...")
    
    print(f"\n{'='*60}")
    print("Vendors")
    print(f"{'='*60}\n")
    
    for vendor in query_entry.get("vendors", []):
        print(f"[{vendor['id']}] {vendor['vendor_name']}")
        print(f"    Region: {vendor.get('region', 'N/A')}")
        print(f"    Price: {vendor.get('price', 'N/A')}")
        print(f"    Product URL: {vendor.get('product_url', 'N/A')}")
        print(f"    Certifications: {vendor.get('certifications', 'N/A')}")
        
        if vendor.get("crawled_data"):
            word_count = vendor["crawled_data"].get("word_count", 0)
            print(f"    Crawled: ✓ ({word_count} words)")
        else:
            print(f"    Crawled: ✗")
        
        if vendor.get("extracted_info"):
            print(f"    Extracted Info: {len(vendor['extracted_info'])} queries")
            for key, info in vendor["extracted_info"].items():
                print(f"      • {info['question']}: {info['answer'][:100]}...")
        print()


def cmd_export(args):
    """Handle the 'export' command - export query data to a clean JSON."""
    query_id = args.query_id
    output_file = args.output
    include_markdown = args.include_markdown
    
    data = load_vendors_data()
    
    # Find the query
    query_entry = None
    for key, entry in data["queries"].items():
        if entry["query_id"] == query_id or query_id.lower() in key:
            query_entry = entry.copy()
            break
    
    if not query_entry:
        print(f"❌ Query not found: {query_id}")
        sys.exit(1)
    
    # Optionally strip markdown to reduce file size
    if not include_markdown:
        for vendor in query_entry.get("vendors", []):
            if vendor.get("crawled_data"):
                vendor["crawled_data"]["markdown"] = "[STRIPPED - use --include-markdown to include]"
    
    # Write to file
    output_path = Path(output_file)
    with open(output_path, 'w') as f:
        json.dump(query_entry, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Exported to {output_path}")


def main():
    parser = argparse.ArgumentParser(
        description="Vendor Research Pipeline CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python pipeline.py research "TSA 3P IRR Neutralizers"
  python pipeline.py research "FBS"
  python pipeline.py crawl "tsa-3p-irr-neutralizers"
  python pipeline.py crawl "tsa-3p-irr-neutralizers" --vendor-id 1
  python pipeline.py query "tsa-3p-irr-neutralizers" --vendor-id 1 "What is the price?"
  python pipeline.py list
  python pipeline.py show "tsa-3p-irr-neutralizers"
  python pipeline.py export "tsa-3p-irr-neutralizers" -o output.json
        """
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # Research command
    research_parser = subparsers.add_parser("research", help="Run deep research on a product query")
    research_parser.add_argument("query", help="The product search query")
    research_parser.set_defaults(func=cmd_research)
    
    # Crawl command
    crawl_parser = subparsers.add_parser("crawl", help="Crawl product URLs for a query")
    crawl_parser.add_argument("query_id", help="The query ID to crawl vendors for")
    crawl_parser.add_argument(
        "--vendor-id", 
        type=int,
        help="Specific vendor ID to crawl (optional, crawls all if not specified)"
    )
    crawl_parser.set_defaults(func=cmd_crawl)
    
    # Query command
    query_parser = subparsers.add_parser("query", help="Query crawled data using LLM")
    query_parser.add_argument("query_id", help="The query ID")
    query_parser.add_argument("--vendor-id", type=int, required=True, help="Vendor ID to query")
    query_parser.add_argument("question", help="The question to ask about the crawled data")
    query_parser.add_argument(
        "--save", 
        action="store_true",
        help="Save the answer to the vendor's extracted_info"
    )
    query_parser.set_defaults(func=cmd_query)
    
    # List command
    list_parser = subparsers.add_parser("list", help="List all saved queries")
    list_parser.set_defaults(func=cmd_list)
    
    # Show command
    show_parser = subparsers.add_parser("show", help="Show details for a query")
    show_parser.add_argument("query_id", help="The query ID to show")
    show_parser.set_defaults(func=cmd_show)
    
    # Export command
    export_parser = subparsers.add_parser("export", help="Export query data to JSON file")
    export_parser.add_argument("query_id", help="The query ID to export")
    export_parser.add_argument("-o", "--output", default="export.json", help="Output file path")
    export_parser.add_argument(
        "--include-markdown",
        action="store_true",
        help="Include full crawled markdown (can be large)"
    )
    export_parser.set_defaults(func=cmd_export)
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    args.func(args)


if __name__ == "__main__":
    main()

