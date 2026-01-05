from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
from pathlib import Path

from scoring import calculate_suitability_score, rank_vendors

app = FastAPI()

# Load vendor data from JSON
VENDOR_DATA_PATH = Path(__file__).parent / "data" / "vendors.json"

# SKU to Category mapping from 20251216_Consumables_SKUs_Categorization.xlsx
# Maps SKU short text (lowercase) to category
SKU_CATEGORIES = {
    "tsa 3p irr neutralizers": "Media & Microbiology",
    "tsa 3p irr neutralizers plate": "Media & Microbiology",
    "funnel, mce white 0.45m mmhawg124": "Chromatography & Filtration",
    "hyaluronids activty elisa-k-6000-5x96 wl": "Lab Chemicals, Reagents and Kits",
    "e.coli hcdna kits; cat #: 4458435": "Lab Chemicals, Reagents and Kits",
    "proteina mix-n-go elisakit f600": "Lab Chemicals, Reagents and Kits",
    "pyrogent 5000 lysate": "Lab Chemicals, Reagents and Kits",
    "count tact irr 3px100": "Media & Microbiology",
    "pathhunterbioassaykit#93-0933": "Lab Chemicals, Reagents and Kits",
    "clean room moping system configuration": "Cleaning & Disinfection",
    "bucket less moping head": "Cleaning & Disinfection",
    "sds-mwanalysiskit#pn390953": "Lab Chemicals, Reagents and Kits",
    "sterile 70% ipa (triple pack) agme": "Cleaning & Disinfection",
    "8\"epdm gloves 32''long 9.75''hand size": "PPE & Cleanroom Garments",
    "8'epdm gloves 32''long 9.75''hand size": "PPE & Cleanroom Garments",
    "pyrotell lal 0.03 5ml/vial-g5003": "Lab Chemicals, Reagents and Kits",
    "fluid a acc. usp 579500sd-6p 500 ml": "Lab Chemicals, Reagents and Kits",
    "icr-swab 60515": "Media & Microbiology",
    "evo control 400 ,size 9''x9\" art.#142800": "Instrument Spares & Components",
    "multi-array 96-well (10 plate) l15xb-3": "Labware & Plastics",
    "recombinant human # 92-1282m": "Lab Chemicals, Reagents and Kits",
    "protein a kit 4g for recombinant f610": "Lab Chemicals, Reagents and Kits",
    "125ml petg erlenmeyer flasks": "Labware & Plastics",
}

def get_sku_category(sku_name):
    """Get category for a SKU based on mapping, with fuzzy matching."""
    sku_lower = sku_name.lower().strip()
    
    # Try exact match
    if sku_lower in SKU_CATEGORIES:
        return SKU_CATEGORIES[sku_lower]
    
    # Try partial match
    for sku_key, category in SKU_CATEGORIES.items():
        if sku_key in sku_lower or sku_lower in sku_key:
            return category
    
    # Default category
    return "Other"

def load_vendor_data():
    """Load vendor data from JSON file."""
    if VENDOR_DATA_PATH.exists():
        with open(VENDOR_DATA_PATH, 'r') as f:
            return json.load(f)
    return {"queries": {}}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/skus")
def get_skus(q: str = ""):
    """
    Get all available SKUs for autocomplete dropdown.
    Optionally filter by search query.
    Returns list of SKU names (query_text values from vendors.json).
    """
    vendor_data = load_vendor_data()
    queries = vendor_data.get("queries", {})
    
    # Build list of all SKUs with their query keys
    all_skus = []
    for query_key, query_data in queries.items():
        all_skus.append({
            "id": query_data.get("query_id", query_key),
            "name": query_data.get("query_text", query_key),
            "vendorCount": len(query_data.get("vendors", []))
        })
    
    # Filter by query if provided
    if q:
        q_lower = q.lower().strip()
        all_skus = [sku for sku in all_skus if q_lower in sku["name"].lower()]
    
    return {"skus": all_skus}


@app.get("/dashboard-stats")
def get_dashboard_stats():
    """
    Get real dashboard statistics from vendor data.
    Returns vendor count, SKU count, and other stats.
    """
    vendor_data = load_vendor_data()
    queries = vendor_data.get("queries", {})
    
    # Count unique vendors and total products
    unique_vendors = set()
    total_products = 0
    country_counts = {}
    category_counts = {}
    
    for query_data in queries.values():
        vendors = query_data.get("vendors", [])
        total_products += len(vendors)
        
        # Get category for this SKU
        sku_name = query_data.get("query_text", "")
        category = get_sku_category(sku_name)
        category_counts[category] = category_counts.get(category, 0) + 1
        
        for vendor in vendors:
            vendor_name = vendor.get("vendor_name", "")
            if vendor_name:
                unique_vendors.add(vendor_name)
            # Count by manufacturer country
            country = vendor.get("manufacturer_country", "")
            if country and country.lower() != "unknown":
                # Normalize country names (merge USA and United States)
                if country in ["USA", "United States", "US", "U.S.", "U.S.A."]:
                    country = "United States"
                country_counts[country] = country_counts.get(country, 0) + 1
    
    # Sort countries by count and get top 5 (excluding Unknown)
    sorted_countries = sorted(country_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    
    # Sort categories by count
    sorted_categories = sorted(category_counts.items(), key=lambda x: x[1], reverse=True)
    
    # Map country names to flags
    country_flags = {
        "United States": "🇺🇸",
        "USA": "🇺🇸",
        "United Kingdom": "🇬🇧",
        "UK": "🇬🇧",
        "Germany": "🇩🇪",
        "China": "🇨🇳",
        "India": "🇮🇳",
        "Japan": "🇯🇵",
        "France": "🇫🇷",
        "Netherlands": "🇳🇱",
        "Switzerland": "🇨🇭",
        "Canada": "🇨🇦",
        "Australia": "🇦🇺",
        "Unknown": "🌍"
    }
    
    top_countries = [
        {
            "name": country,
            "vendors": count,
            "flag": country_flags.get(country, "🌍")
        }
        for country, count in sorted_countries
    ]
    
    # Build category list for SKU coverage
    categories_list = [
        {
            "name": category,
            "skus": count
        }
        for category, count in sorted_categories
    ]
    
    return {
        "networkStatus": {
            "activeVendors": len(unique_vendors),
            "internalApproved": 0,  # No internal vendors in external data
            "externalWatchlist": len(unique_vendors),
            "topCountries": top_countries
        },
        "skuCoverage": {
            "totalSkus": len(queries),
            "categoriesCount": len(category_counts),
            "lastUpdated": "Live data",
            "categories": categories_list
        }
    }


@app.get("/alternate-vendors")
def get_alternate_vendors(q: str = ""):
    """
    Search for alternate vendors based on a product query.
    Returns vendor data from deep research results stored in JSON.
    Each vendor includes a suitability_score (0-100) calculated based on
    data completeness and quality indicators.
    """
    if not q:
        return {"vendors": [], "query": "", "found": False}
    
    # Normalize the query
    q_normalized = q.lower().strip()
    
    # Load vendor data
    vendor_data = load_vendor_data()
    queries = vendor_data.get("queries", {})
    
    # Try exact match first
    if q_normalized in queries:
        query_data = queries[q_normalized]
        # Add suitability scores and rank vendors
        scored_vendors = rank_vendors(query_data["vendors"])
        return {
            "vendors": scored_vendors,
            "query": query_data["query_text"],
            "query_id": query_data["query_id"],
            "last_updated": query_data["last_updated"],
            "found": True
        }
    
    # Try partial match
    for stored_query, query_data in queries.items():
        if q_normalized in stored_query or stored_query in q_normalized:
            # Add suitability scores and rank vendors
            scored_vendors = rank_vendors(query_data["vendors"])
            return {
                "vendors": scored_vendors,
                "query": query_data["query_text"],
                "query_id": query_data["query_id"],
                "last_updated": query_data["last_updated"],
                "found": True
            }
    
    # No match found
    return {"vendors": [], "query": q, "found": False}
