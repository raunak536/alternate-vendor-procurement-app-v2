import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { api } from '../data/mockData'
import './Results.css'

function Results() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const query = searchParams.get('q') || ''
  
  const [searchQuery, setSearchQuery] = useState(query)
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedVendors, setSelectedVendors] = useState([])
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [sortBy, setSortBy] = useState('suitability')
  
  // Filter states
  const [filters, setFilters] = useState({
    currentPartnerOnly: false,
    source: ['INT', 'EXT'],
    certifications: [],
    locations: [],
    minSuitability: 0
  })

  // Fetch vendors when query or filters change
  useEffect(() => {
    if (query) {
      setLoading(true)
      api.getVendors(query, filters).then(data => {
        setVendors(data)
        setLoading(false)
      })
    }
  }, [query, filters])

  // Fetch AI analysis separately - always uses unfiltered data for accurate recommendations
  useEffect(() => {
    if (query) {
      api.getAIAnalysis(query, {}).then(setAiAnalysis)
    }
  }, [query])

  const handleSearch = (q) => {
    navigate(`/results?q=${encodeURIComponent(q)}`)
  }

  const toggleVendorSelection = (vendorId) => {
    setSelectedVendors(prev => 
      prev.includes(vendorId) 
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    )
  }

  const handleCompare = () => {
    if (selectedVendors.length >= 2) {
      navigate(`/compare?vendors=${selectedVendors.join(',')}&q=${encodeURIComponent(query)}`)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 2
    }).format(amount)
  }

  // Safely render recommendation text with highlighted vendor name (avoids XSS)
  const renderHighlightedRecommendation = (text, vendorName) => {
    if (!vendorName) return text
    
    // Split by all occurrences of vendor name (case-insensitive)
    const parts = text.split(new RegExp(`(${vendorName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
    
    return parts.map((part, index) => 
      part.toLowerCase() === vendorName.toLowerCase() ? (
        <a key={index} href="#" className="highlight-vendor" onClick={(e) => e.preventDefault()}>
          {part}
        </a>
      ) : (
        part
      )
    )
  }

  const sortedVendors = [...vendors].sort((a, b) => {
    switch(sortBy) {
      case 'price': 
        // Handle null unitPrice (API vendors) - put them at the end
        if (a.unitPrice === null && b.unitPrice === null) return 0
        if (a.unitPrice === null) return 1
        if (b.unitPrice === null) return -1
        return a.unitPrice - b.unitPrice
      case 'leadTime': return parseInt(a.leadTime) - parseInt(b.leadTime)
      default: return b.suitabilityScore - a.suitabilityScore
    }
  })

  // Split vendors into top recommendations and others
  const topVendors = sortedVendors.slice(0, 4)
  const otherVendors = sortedVendors.slice(4)

  // Compute consistent comparison attributes from ALL vendors dynamically
  // This ensures all tiles show the same attributes regardless of which SKU is searched
  const fixedFields = [
    'id', 'name', 'productName', 'source', 'isCurrentPartner', 'isPreferred', 'isBestValue', 'isFastest',
    'unitPrice', 'unitPriceDisplay', 'totalEstCost', 'availableQty', 'region', 'leadTime',
    'suitabilityScore', 'certifications', 'internalHistory', 'riskAssessment', 'website',
    'lat', 'lng', '_apiData', 'vendor_name', 'product_url', 'availability_status', 'price',
    'product_description', 'crawled_data', 'crawled_at', 'extracted_info', 'source_urls',
    'shelfLife', 'packaging', 'storage', 'locking', 'isManufacturerDirect', 'manufacturerName'
  ]

  // Get union of all dynamic attribute keys from all vendors
  const allDynamicKeys = [...new Set(
    sortedVendors.flatMap(vendor => 
      Object.keys(vendor).filter(key => !fixedFields.includes(key))
    )
  )]

  // Take first 4 as consistent comparison attributes for all tiles
  const comparisonAttributes = allDynamicKeys.slice(0, 4)

  return (
    <div className="results-page">
      <Header 
        showSearch 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={handleSearch}
      />
      
      <div className="results-layout">
        {/* Left Sidebar */}
        <aside className="filters-sidebar">
          <div className="filter-section">
            <div className="filter-header">
              <div className="filter-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="21" x2="4" y2="14" />
                  <line x1="4" y1="10" x2="4" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12" y2="3" />
                  <line x1="20" y1="21" x2="20" y2="16" />
                  <line x1="20" y1="12" x2="20" y2="3" />
                </svg>
              </div>
              <h3>FILTERS</h3>
            </div>

            <div className="filter-group">
              <h4>
                Relationship Status
                <svg className="info-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
              </h4>
              <div className="filter-checkbox">
                <input 
                  type="checkbox" 
                  id="currentPartner"
                  checked={filters.currentPartnerOnly}
                  onChange={(e) => setFilters(f => ({ ...f, currentPartnerOnly: e.target.checked }))}
                />
                <label htmlFor="currentPartner">Current Partner Only</label>
              </div>
            </div>

            <div className="filter-group">
              <h4>
                Source
                <svg className="info-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
              </h4>
              <div className="filter-checkbox filled">
                <input 
                  type="checkbox" 
                  id="sourceInt"
                  checked={filters.source.includes('INT')}
                  onChange={(e) => {
                    const newSource = e.target.checked 
                      ? [...filters.source, 'INT'] 
                      : filters.source.filter(s => s !== 'INT')
                    setFilters(f => ({ ...f, source: newSource }))
                  }}
                />
                <label htmlFor="sourceInt">Internal (INT)</label>
              </div>
              <div className="filter-checkbox filled">
                <input 
                  type="checkbox" 
                  id="sourceExt"
                  checked={filters.source.includes('EXT')}
                  onChange={(e) => {
                    const newSource = e.target.checked 
                      ? [...filters.source, 'EXT'] 
                      : filters.source.filter(s => s !== 'EXT')
                    setFilters(f => ({ ...f, source: newSource }))
                  }}
                />
                <label htmlFor="sourceExt">External (EXT)</label>
              </div>
            </div>

            <div className="filter-group">
              <h4>
                Certifications
                <svg className="info-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
              </h4>
              {['GMP', 'ISO 9001', 'US FDA', 'EU GMP'].map(cert => (
                <div className="filter-checkbox filled" key={cert}>
                  <input 
                    type="checkbox" 
                    id={`cert-${cert}`}
                    checked={filters.certifications.includes(cert)}
                    onChange={(e) => {
                      const newCerts = e.target.checked 
                        ? [...filters.certifications, cert] 
                        : filters.certifications.filter(c => c !== cert)
                      setFilters(f => ({ ...f, certifications: newCerts }))
                    }}
                  />
                  <label htmlFor={`cert-${cert}`}>{cert}</label>
                </div>
              ))}
            </div>

            <div className="filter-group">
              <h4>Location</h4>
              {['India', 'Asia Pacific', 'Europe', 'North America'].map(loc => (
                <div className="filter-checkbox filled" key={loc}>
                  <input 
                    type="checkbox" 
                    id={`loc-${loc}`}
                    checked={filters.locations.includes(loc)}
                    onChange={(e) => {
                      const newLocs = e.target.checked 
                        ? [...filters.locations, loc] 
                        : filters.locations.filter(l => l !== loc)
                      setFilters(f => ({ ...f, locations: newLocs }))
                    }}
                  />
                  <label htmlFor={`loc-${loc}`}>{loc}</label>
                </div>
              ))}
              <div className="filter-checkbox">
                <input 
                  type="checkbox" 
                  id="loc-other"
                  checked={filters.locations.includes('Other')}
                  onChange={(e) => {
                    const newLocs = e.target.checked 
                      ? [...filters.locations, 'Other'] 
                      : filters.locations.filter(l => l !== 'Other')
                    setFilters(f => ({ ...f, locations: newLocs }))
                  }}
                />
                <label htmlFor="loc-other">Other Regions</label>
              </div>
            </div>

            <div className="filter-group">
              <h4>
                Min. Suitability Score
                <svg className="info-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
              </h4>
              <div className="suitability-slider-container">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={filters.minSuitability}
                  onChange={(e) => setFilters(f => ({ ...f, minSuitability: +e.target.value }))}
                  className="suitability-slider"
                />
              </div>
              <div className="suitability-labels">
                <span>0%</span>
                <span className="current-value">{filters.minSuitability}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          <div className="filter-actions">
            <button className="reset-btn" onClick={() => setFilters({
              currentPartnerOnly: false,
              source: ['INT', 'EXT'],
              certifications: [],
              locations: [],
              minSuitability: 0
            })}>
              Reset
            </button>
            <button className="apply-btn">Apply</button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="results-main">
          <div className="results-header">
            <div className="results-title-section">
              <h1>({vendors.length}) Results for: {query}</h1>
              <p className="results-subtitle">Top recommendations based on price, suitability, and delivery speed.</p>
            </div>
            <div className="sort-dropdown">
              <label>Sort by:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="suitability">Suitability Score</option>
                <option value="price">Price (Low to High)</option>
                <option value="leadTime">Lead Time</option>
              </select>
            </div>
          </div>

          {/* Top Recommendations Section */}
          <section className="recommendations-section">
            <h2 className="section-title">
              <span className="section-marker"></span>
              Top Recommended Opportunities
            </h2>

            {/* AI Analysis Banner - only show for mock data, not API vendors */}
            {aiAnalysis && vendors.length > 0 && !vendors[0]._apiData && (
              <div className="ai-analysis-banner">
                <div className="ai-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <div className="ai-content">
                  <span className="ai-label">AI Input-Cost Analysis</span>
                  <p>
                    "{renderHighlightedRecommendation(aiAnalysis.recommendation, aiAnalysis.highlightVendor)}"
                  </p>
                </div>
              </div>
            )}

            {/* Vendor Cards */}
            {loading ? (
              <div className="loading">Loading vendors...</div>
            ) : (
              <div className="vendors-list">
                {topVendors.map(vendor => (
                  <VendorCard 
                    key={vendor.id}
                    vendor={vendor}
                    isSelected={selectedVendors.includes(vendor.id)}
                    onToggleSelect={() => toggleVendorSelection(vendor.id)}
                    formatCurrency={formatCurrency}
                    quantity={filters.estQuantity}
                    searchQuery={query}
                    comparisonAttributes={comparisonAttributes}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Other Recommendations */}
          {otherVendors.length > 0 && (
            <section className="other-section">
              <h2 className="section-title">
                <span className="section-marker"></span>
                Other Recommendations ({otherVendors.length})
              </h2>
              <div className="vendors-list">
                {otherVendors.map(vendor => (
                  <VendorCard 
                    key={vendor.id}
                    vendor={vendor}
                    isSelected={selectedVendors.includes(vendor.id)}
                    onToggleSelect={() => toggleVendorSelection(vendor.id)}
                    formatCurrency={formatCurrency}
                    searchQuery={query}
                    comparisonAttributes={comparisonAttributes}
                  />
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Compare Footer */}
      {selectedVendors.length >= 2 && (
        <div className="compare-footer">
          <span className="compare-count">{selectedVendors.length} Vendors Selected</span>
          <button className="compare-btn" onClick={handleCompare}>
            COMPARE SELECTED VENDORS →
          </button>
        </div>
      )}
    </div>
  )
}

function VendorCard({ vendor, isSelected, onToggleSelect, formatCurrency, searchQuery, comparisonAttributes = [] }) {
  const navigate = useNavigate()
  
  // Helper to display value or NA
  const displayValue = (value, suffix = '') => {
    if (value === null || value === undefined || value === 'NA' || value === '') {
      return 'NA'
    }
    return suffix ? `${value} ${suffix}` : value
  }

  // Navigate to vendor detail page
  const handleViewDetails = () => {
    navigate(`/vendor/${vendor.id}?q=${encodeURIComponent(searchQuery || '')}`)
  }

  // Format website URL for display
  const formatUrl = (url) => {
    if (!url) return null
    const cleaned = url.replace(/^(https?:\/\/)?(www\.)?/, '')
    return cleaned.length > 35 ? cleaned.slice(0, 35) + '...' : cleaned
  }

  // Convert snake_case to Title Case for display
  const formatLabel = (key) => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
  }

  // Use passed comparisonAttributes to ensure all vendor tiles show the same fields
  // This is dynamically computed from ALL vendors at the parent level
  const dynamicAttributes = comparisonAttributes.map(key => [key, vendor[key]])

  return (
    <div className={`vendor-card ${vendor.isCurrentPartner ? 'current-partner' : ''}`}>
      {vendor.isCurrentPartner && (
        <div className="partner-banner">
          <span className="partner-icon">⟲</span>
          CURRENT PARTNER
        </div>
      )}
      
      <div className="vendor-card-content">
        <div className="vendor-header">
          <div className="vendor-name-section">
            <h3 className="vendor-name">{vendor.name}</h3>
            <div className="vendor-badges">
              <span className={`source-badge ${vendor.source.toLowerCase()}`}>{vendor.source}</span>
              {vendor.isPreferred && <span className="tag-badge preferred">Preferred</span>}
              {vendor.isBestValue && <span className="tag-badge best-value">Best Value</span>}
              {vendor.isFastest && <span className="tag-badge fastest">Fastest</span>}
              {vendor.isManufacturerDirect !== undefined && (
                <span className={`tag-badge ${vendor.isManufacturerDirect ? 'manufacturer' : 'reseller'}`}>
                  {vendor.isManufacturerDirect ? 'Manufacturer' : 'Distributor'}
                </span>
              )}
            </div>
          </div>
          <div className="vendor-score">
            <span className="score-icon">☆</span>
            <span className="score-value">{vendor.suitabilityScore}%</span>
            <span className="score-label">Suitability</span>
          </div>
        </div>

        <div className="vendor-metrics">
          <div className="metric">
            <span className="metric-label">Price</span>
            <span className="metric-value">{vendor.unitPriceDisplay || 'NA'}</span>
          </div>
          
          <div className="metric">
            <span className="metric-label">Manufacturer Country</span>
            <span className="metric-value">{displayValue(vendor.region)}</span>
          </div>

          {/* Product URL shown in tile */}
          <div className="metric">
            <span className="metric-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              Product URL
            </span>
            {vendor.website ? (
              <a 
                href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="metric-value url-link"
                onClick={(e) => e.stopPropagation()}
              >
                {formatUrl(vendor.website)}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            ) : (
              <span className="metric-value na-text">NA</span>
            )}
          </div>

          {/* Certifications alongside product URL */}
          <div className="metric">
            <span className="metric-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              Certifications
            </span>
            <div className="cert-badges-inline">
              {vendor.certifications && vendor.certifications.length > 0 ? (
                vendor.certifications.map(cert => (
                  <span key={cert} className="cert-badge-small">{cert}</span>
                ))
              ) : (
                <span className="na-text">NA</span>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic attributes row - shows SKU-specific comparison attributes */}
        {dynamicAttributes.length > 0 && (
          <div className="vendor-details-row" style={{ gridTemplateColumns: `repeat(${Math.min(dynamicAttributes.length, 4)}, 1fr)` }}>
            {dynamicAttributes.map(([key, value]) => (
              <div className="detail-item" key={key}>
                <span className="detail-label">{formatLabel(key)}</span>
                <span className="detail-value">
                  {Array.isArray(value) ? value.join(', ') : displayValue(value)}
                </span>
              </div>
            ))}
          </div>
        )}

        {vendor.internalHistory && (
          <div className="internal-history">
            <span className="history-icon">↻</span>
            <span className="history-label">INTERNAL HISTORY:</span>
            <span>Partner Since: <strong>{vendor.internalHistory.partnerSince}</strong></span>
            <span className="history-separator">•</span>
            <span>Lifetime Spend: <strong>{formatCurrency(vendor.internalHistory.lifetimeSpend)}</strong></span>
          </div>
        )}

        <div className="vendor-actions">
          <button 
            className="view-details-btn"
            onClick={handleViewDetails}
          >
            View Details →
          </button>
          <label className="compare-checkbox">
            <input 
              type="checkbox" 
              checked={isSelected}
              onChange={onToggleSelect}
            />
            <span className="checkbox-custom"></span>
            Compare
          </label>
        </div>
      </div>
    </div>
  )
}

export default Results
