#!/usr/bin/env python3
"""
Biopharma Spec Library

Reusable spec definitions for vendor comparison in biopharma procurement.
Each spec includes semantic aliases to help LLMs find information even when
vendors use different terminology.
"""

# Core spec definitions used across biopharma products
# These are general specs applicable to most products - product-specific specs
# should be added dynamically by the enrichment phase
BIOPHARMA_SPECS = {
    "price": {
        "key": "price",
        "display_name": "Price",
        "description": "Unit price with currency and quantity",
        "look_for": [
            "price", "list price", "unit price", "cost", "USD", "EUR", "GBP",
            "£", "$", "€", "per pack", "per kit", "per unit", "each"
        ]
    },
    "storage_condition": {
        "key": "storage_condition",
        "display_name": "Storage",
        "description": "Temperature and storage requirements",
        "look_for": [
            "storage", "store at", "temperature", "refrigerate", "freeze",
            "-20", "-80", "2-8", "room temp", "ambient", "protect from light",
            "keep dry", "cold chain", "frozen", "°C", "°F"
        ]
    },
    "shelf_life": {
        "key": "shelf_life",
        "display_name": "Shelf Life",
        "description": "Product stability period",
        "look_for": [
            "shelf life", "expiry", "expiration", "stability", "valid for",
            "best before", "months from receipt", "weeks from manufacture",
            "use by", "dating"
        ]
    },
    "certifications": {
        "key": "certifications",
        "display_name": "Certifications",
        "description": "Regulatory and quality certifications",
        "look_for": [
            "certification", "compliance", "USP", "EP", "GMP", "ISO", "RUO",
            "IVD", "CE", "FDA", "research use only", "for research use",
            "JP", "BP", "monograph", "pharmacopeial"
        ]
    },
    "pack_size": {
        "key": "pack_size",
        "display_name": "Pack Size",
        "description": "Quantity per package",
        "look_for": [
            "pack size", "quantity", "unit size", "contents", "per pack",
            "per kit", "reactions", "tests", "plates", "vials", "tubes",
            "preps", "preparations", "wells", "assays"
        ]
    },
    "catalog_number": {
        "key": "catalog_number",
        "display_name": "Catalog #",
        "description": "Product catalog or SKU number",
        "look_for": [
            "catalog", "cat #", "cat no", "SKU", "product code", "item number",
            "part number", "ref", "product number", "order number"
        ]
    },
    "manufacturer": {
        "key": "manufacturer",
        "display_name": "Manufacturer",
        "description": "Product manufacturer or brand",
        "look_for": [
            "manufacturer", "brand", "made by", "produced by", "supplier",
            "distributed by", "marketed by"
        ]
    },
    "lead_time": {
        "key": "lead_time",
        "display_name": "Lead Time",
        "description": "Delivery timeline and availability",
        "look_for": [
            "lead time", "delivery", "ships", "shipping", "in stock",
            "available", "backordered", "dispatch", "processing time",
            "business days", "weeks"
        ]
    }
}


def get_spec(spec_key: str) -> dict:
    """Get a spec definition by key."""
    return BIOPHARMA_SPECS.get(spec_key)


def get_specs_for_keys(keys: list) -> list:
    """Get spec definitions for a list of keys."""
    return [BIOPHARMA_SPECS[k] for k in keys if k in BIOPHARMA_SPECS]


def format_specs_for_prompt(specs: list) -> str:
    """
    Format a list of spec definitions for inclusion in an LLM prompt.
    
    Args:
        specs: List of spec dicts with key, display_name, description, look_for
        
    Returns:
        Formatted string for prompt inclusion
    """
    lines = []
    for spec in specs:
        aliases = ", ".join(spec.get("look_for", [])[:8])  # Limit aliases
        lines.append(
            f"- {spec['key']} ({spec['display_name']}): {spec['description']}\n"
            f"  Look for: {aliases}"
        )
    return "\n".join(lines)


def get_default_specs() -> list:
    """Get the default set of specs for general product comparison.
    
    These are the base specs that should be included for ALL products.
    Product-specific specs are added dynamically by the enrichment phase.
    """
    default_keys = [
        "price", "storage_condition", "shelf_life", "certifications",
        "pack_size", "catalog_number", "manufacturer", "lead_time"
    ]
    return get_specs_for_keys(default_keys)


if __name__ == "__main__":
    # Demo usage
    print("Available specs:")
    for key, spec in BIOPHARMA_SPECS.items():
        print(f"  {key}: {spec['display_name']}")
    
    print("\nDefault specs formatted for prompt:")
    print(format_specs_for_prompt(get_default_specs()))

