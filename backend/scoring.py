"""
Vendor Suitability Scoring Module

Simple scoring based on data completeness.
TODO: Enhance with more sophisticated logic later.
"""

from typing import Dict, Any, List


def _has_valid_value(value: Any) -> bool:
    """Check if a value is present and not 'NA'."""
    return value and value != "NA"


def _get_spec_value(vendor: Dict[str, Any], spec_key: str) -> Any:
    """
    Get a spec value from vendor data. Handles both:
    - New nested format: specs[key]['value']
    - Old flat format: vendor[key]
    """
    specs = vendor.get("specs", {})
    if spec_key in specs and isinstance(specs[spec_key], dict):
        return specs[spec_key].get("value")
    # Fallback to flat format
    return vendor.get(spec_key)


def calculate_suitability_score(vendor: Dict[str, Any]) -> int:
    """
    Calculate a simple suitability score (0-100) based on data completeness.
    
    If vendor has a recommendation_score (0-1), use that as base (converted to 0-100).
    Otherwise, calculate based on data completeness.
    """
    # If vendor has recommendation_score from discovery, use it as base
    if "recommendation_score" in vendor:
        return int(vendor["recommendation_score"] * 100)
    
    score = 50  # Base score
    
    # +10 for each key field that has valid data (not NA)
    if _has_valid_value(_get_spec_value(vendor, "price")):
        score += 10
    if _has_valid_value(_get_spec_value(vendor, "certifications")):
        score += 10
    if _has_valid_value(_get_spec_value(vendor, "shelf_life")) or _has_valid_value(_get_spec_value(vendor, "storage_condition")):
        score += 10
    if _has_valid_value(_get_spec_value(vendor, "irradiation_status")):
        score += 10
    if _has_valid_value(_get_spec_value(vendor, "pack_size")) or _has_valid_value(_get_spec_value(vendor, "plate_format")):
        score += 10
    
    return min(score, 100)


def rank_vendors(vendors: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Add scores and sort vendors by score descending."""
    for vendor in vendors:
        vendor["suitability_score"] = calculate_suitability_score(vendor)
    return sorted(vendors, key=lambda v: v["suitability_score"], reverse=True)
