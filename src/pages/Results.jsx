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
  
  // Version state
  const [selectedVersion, setSelectedVersion] = useState(null)
  const [availableVersions, setAvailableVersions] = useState([])
  const [versionDate, setVersionDate] = useState('')
  
  // Filter states
  const [filters, setFilters] = useState({
    currentPartnerOnly: false,
    source: ['INT', 'EXT'],
    certifications: [],
    locations: [],
    minSuitability: 0
  })

  // Fetch vendors when query, filters, or version change
  useEffect(() => {
    if (query) {
      setLoading(true)
      api.getVendors(query, filters, selectedVersion).then(data => {
        setVendors(data.vendors || data)
        // Update version info if available
        if (data.availableVersions) {
          setAvailableVersions(data.availableVersions)
          setSelectedVersion(prev => prev || data.version || data.currentVersion)
          setVersionDate(data.last_updated || '')
        }
        setLoading(false)
      })
    }
  }, [query, filters, selectedVersion])

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
  // Top recommendations: suitability >= 50, Other recommendations: suitability < 50
  const topVendors = sortedVendors.filter(v => v.suitabilityScore >= 50)
  const otherVendors = sortedVendors.filter(v => v.suitabilityScore < 50)

  // Compute consistent comparison attributes from ALL vendors dynamically
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
            <h3 className="filter-title">Filters</h3>

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
              <div className="filter-checkbox">
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
              <div className="filter-checkbox">
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
                <div className="filter-checkbox" key={cert}>
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
                <div className="filter-checkbox" key={loc}>
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
                <div className="slider-track">
                  <div className="slider-fill" style={{ width: `${filters.minSuitability}%` }}></div>
                </div>
              </div>
              <div className="suitability-labels">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="results-main">
          <div className="results-header">
            <div className="results-title-section">
              <h1>({vendors.length}) Results for: {query}</h1>
              <p className="results-subtitle">Top recommendations based on price, suitability, and delivery speed.</p>
            </div>
            <div className="results-controls">
              {/* Version Toggle */}
              {availableVersions.length > 0 && (
                <div className="version-dropdown">
                  <label>Version:</label>
                  <select 
                    value={selectedVersion || ''} 
                    onChange={(e) => setSelectedVersion(e.target.value)}
                  >
                    {availableVersions.map((versionObj) => {
                      // Handle both object format {version, date, vendorCount} and simple version number
                      const versionNum = typeof versionObj === 'object' ? versionObj.version : versionObj
                      return (
                        <option key={versionNum} value={versionNum}>
                          v{versionNum}
                        </option>
                      )
                    })}
                  </select>
                  {versionDate && (
                    <span className="version-date">
                      Last updated: {new Date(versionDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
              <div className="sort-dropdown">
                <label>Sort by:</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="suitability">Suitability Score</option>
                  <option value="price">Price (Low to High)</option>
                  <option value="leadTime">Lead Time</option>
                </select>
              </div>
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
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div className="ai-content">
                  <span className="ai-label">AI Input-Cost Analysis</span>
                  <p>
                    {renderHighlightedRecommendation(aiAnalysis.recommendation, aiAnalysis.highlightVendor)}
                  </p>
                </div>
              </div>
            )}

            {/* Vendor Cards */}
            {loading ? (
              <div className="loading">
                <div className="loading-spinner"></div>
                <p>Loading vendors...</p>
              </div>
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
  
  // Helper to display value or NA - handles objects, arrays, and primitives
  const displayValue = (value, suffix = '') => {
    if (value === null || value === undefined || value === 'NA' || value === '') {
      return 'NA'
    }
    // Handle object values by joining their values
    if (typeof value === 'object' && !Array.isArray(value)) {
      const stringified = Object.values(value).join('; ')
      return suffix ? `${stringified} ${suffix}` : stringified
    }
    // Handle arrays
    if (Array.isArray(value)) {
      return value.join(', ')
    }
    return suffix ? `${value} ${suffix}` : value
  }

  // Map region/country to appropriate flag emoji
  const getCountryFlag = (region) => {
    if (!region) return '🌍'
    const regionLower = region.toLowerCase()
    
    // Direct country matches
    if (regionLower.includes('india')) return '🇮🇳'
    if (regionLower.includes('usa') || regionLower.includes('united states') || regionLower.includes('us')) return '🇺🇸'
    if (regionLower.includes('china')) return '🇨🇳'
    if (regionLower.includes('germany')) return '🇩🇪'
    if (regionLower.includes('uk') || regionLower.includes('united kingdom') || regionLower.includes('britain')) return '🇬🇧'
    if (regionLower.includes('japan')) return '🇯🇵'
    if (regionLower.includes('switzerland')) return '🇨🇭'
    if (regionLower.includes('france')) return '🇫🇷'
    if (regionLower.includes('canada')) return '🇨🇦'
    if (regionLower.includes('australia')) return '🇦🇺'
    if (regionLower.includes('korea')) return '🇰🇷'
    if (regionLower.includes('singapore')) return '🇸🇬'
    if (regionLower.includes('ireland')) return '🇮🇪'
    if (regionLower.includes('netherlands')) return '🇳🇱'
    if (regionLower.includes('belgium')) return '🇧🇪'
    if (regionLower.includes('italy')) return '🇮🇹'
    if (regionLower.includes('spain')) return '🇪🇸'
    if (regionLower.includes('brazil')) return '🇧🇷'
    if (regionLower.includes('mexico')) return '🇲🇽'
    
    // Regional matches
    if (regionLower.includes('europe')) return '🇪🇺'
    if (regionLower.includes('asia')) return '🌏'
    if (regionLower.includes('america')) return '🌎'
    
    return '🌍' // Default globe
  }

  // Navigate to vendor detail page
  const handleViewDetails = () => {
    navigate(`/vendor/${vendor.id}?q=${encodeURIComponent(searchQuery || '')}`)
  }

  return (
    <div className={`vendor-card ${vendor.isCurrentPartner ? 'current-partner' : ''}`}>
      {/* Card Header */}
      <div className="card-header-row">
        <div className="vendor-info">
          <div className="vendor-name-row">
            <h3 className="vendor-name">{vendor.name}</h3>
            <div className="vendor-tags">
              <span className={`source-tag ${vendor.source?.toLowerCase()}`}>{vendor.source}</span>
              {vendor.isManufacturerDirect !== undefined && (
                <span className={`type-tag ${vendor.isManufacturerDirect ? 'manufacturer' : 'distributor'}`}>
                  {vendor.isManufacturerDirect ? 'Manufacturer' : 'Vendor / Distributor'}
                </span>
              )}
              {vendor.isCurrentPartner && (
                <span className="partner-tag">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  CURRENT PARTNER
                </span>
              )}
            </div>
          </div>
        </div>
        <button className="view-details-link" onClick={handleViewDetails}>
          View Details →
        </button>
      </div>

      {/* Card Content */}
      <div className="card-content">
        {/* Left: Price & Packaging */}
        <div className="card-left">
          {vendor.unitPrice ? (
            <div className="price-block">
              <span className="price-value">${vendor.unitPrice.toFixed(2)}</span>
              <span className="price-unit">/ {vendor.unitPriceDisplay || vendor.packaging || 'unit'}</span>
            </div>
          ) : vendor.unitPriceDisplay ? (
            <div className="price-block">
              <span className="price-value">{vendor.unitPriceDisplay}</span>
            </div>
          ) : vendor.price ? (
            <div className="price-block">
              <span className="price-value">{vendor.price}</span>
            </div>
          ) : (
            <div className="price-block no-price">
              <span className="price-value">Price on Request</span>
            </div>
          )}
        </div>

        {/* Middle: Product Details */}
        <div className="card-middle">
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Region & Origin</span>
              <span className="detail-value">
                <span className="flag-icon">{getCountryFlag(vendor.region)}</span> {displayValue(vendor.region)}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Shelf Life</span>
              <span className="detail-value">{displayValue(vendor.shelfLife)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Storage</span>
              <span className="detail-value">{displayValue(vendor.storage)}</span>
            </div>
            {/* Always show Manufacturer - use vendor name if direct, manufacturerName if distributor */}
            <div className="detail-item">
              <span className="detail-label">Manufacturer</span>
              <span className="detail-value">
                {vendor.isManufacturerDirect === true 
                  ? vendor.name 
                  : displayValue(vendor.manufacturerName) || vendor.name}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Avail. Qty</span>
              <span className="detail-value">{vendor.availableQty ? vendor.availableQty.toLocaleString() : 'NA'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Packaging</span>
              <span className="detail-value">{displayValue(vendor.packaging)}</span>
            </div>
          </div>
        </div>

        {/* Right: Score & Actions */}
        <div className="card-right">
          <div className="score-block">
            <span className="score-value">{vendor.suitabilityScore}%</span>
            <span className="score-label">Suitability Score</span>
          </div>
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

      {/* Internal History Footer */}
      {vendor.internalHistory && (
        <div className="internal-history-row">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Internal History • Partner Since {vendor.internalHistory.partnerSince} • Lifetime Spend: {formatCurrency(vendor.internalHistory.lifetimeSpend)}</span>
        </div>
      )}

      {/* Certification Badges */}
      {vendor.certifications && vendor.certifications.length > 0 && (
        <div className="cert-badges-row">
          {vendor.certifications.map(cert => (
            <span key={cert} className="cert-badge">{cert}</span>
          ))}
        </div>
      )}
    </div>
  )
}

export default Results
