"""
Vendor Suitability Scoring Module

Scoring based primarily on spec data completeness (90%) with recommendation score (10%).
"""

from typing import Dict, Any, List

# Fields that are not specs and should be excluded from spec counting
# These are metadata, display fields, and discovery-related fields - NOT actual product specs
NON_SPEC_FIELDS = {
    # Core identifiers
    'id', 'name', 'vendor_name', 'product_name', 'product_url', 'product_description',
    # Discovery metadata
    'confidence', 'discovery_confidence', 
    'recommendation_score', 'recommendation_reason',
    'concerns', 'discovery_concerns',
    'specs_availability',  # This is metadata about what specs are available, not a spec itself
    # Computed/display fields
    'suitability_score', 'source', 'website', 'region', 'crawled_at', 'crawled_data',
    'extracted_info', 'source_urls', 'availability_status', 'specs', '_apiData',
    # Frontend display flags
    'isCurrentPartner', 'isPreferred', 'isBestValue', 'isFastest', 'isManufacturerDirect',
    'manufacturerName', 'manufacturer_country',
    # Pricing and availability (these are separate from specs)
    'unitPrice', 'unitPriceDisplay', 'totalEstCost', 'availableQty',
    'leadTime', 'certifications', 'internalHistory', 'riskAssessment', 'lat', 'lng',
    # Version tracking
    'version', 'version_date', 'last_updated', 'query_id', 'query_text',
    # Any other metadata
    'enriched_query', 'comparison_attributes', 'vendors', 'current_version'
}


def _has_valid_value(value: Any) -> bool:
    """Check if a value is present and not 'NA' or empty."""
    if value is None:
        return False
    if isinstance(value, str):
        return value.strip() not in ("", "NA", "N/A", "n/a", "Not Available", "Not available", "Unknown", "unknown")
    if isinstance(value, list):
        return len(value) > 0
    return True


def _count_specs(vendor: Dict[str, Any]) -> tuple:
    """
    Count total specs and valid (non-NA) specs for a vendor.
    Returns (total_specs, valid_specs)
    """
    total_specs = 0
    valid_specs = 0
    
    # Check nested specs format first
    specs = vendor.get("specs", {})
    if specs and isinstance(specs, dict):
        for spec_key, spec_data in specs.items():
            total_specs += 1
            if isinstance(spec_data, dict):
                value = spec_data.get("value")
            else:
                value = spec_data
            if _has_valid_value(value):
                valid_specs += 1
    
    # Also check flat format fields (excluding non-spec fields)
    for key, value in vendor.items():
        if key not in NON_SPEC_FIELDS and key not in specs:
            # This is a spec stored in flat format
            total_specs += 1
            if _has_valid_value(value):
                valid_specs += 1
    
    return total_specs, valid_specs


def calculate_suitability_score(vendor: Dict[str, Any]) -> int:
    """
    Calculate suitability score (0-100) based on:
    - 90% from spec data completeness (% of non-NA specs)
    - 10% from recommendation_score if available (otherwise uses 50% baseline)
    """
    # Calculate spec completeness (90% weight)
    total_specs, valid_specs = _count_specs(vendor)
    
    if total_specs > 0:
        spec_completeness = valid_specs / total_specs
    else:
        spec_completeness = 0.0
    
    spec_score = spec_completeness * 90  # 90% weight
    
    # Get recommendation score (10% weight)
    # If recommendation_score exists (0-1), use it; otherwise default to 0.5
    rec_score_raw = vendor.get("recommendation_score", 0.5)
    if isinstance(rec_score_raw, (int, float)):
        rec_score = rec_score_raw * 10  # 10% weight, scaled from 0-1 to 0-10
    else:
        rec_score = 5  # Default 50% of the 10% weight
    
    total_score = int(round(spec_score + rec_score))
    return min(max(total_score, 0), 100)  # Clamp to 0-100


def rank_vendors(vendors: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Add scores and sort vendors by score descending."""
    for vendor in vendors:
        vendor["suitability_score"] = calculate_suitability_score(vendor)
    return sorted(vendors, key=lambda v: v["suitability_score"], reverse=True)
