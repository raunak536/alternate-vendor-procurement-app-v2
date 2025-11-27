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
    estUnitCost: 1250,
    estQuantity: 500,
    priceBenchmark: true,
    suggestSubstitutes: false,
    showCurrentPartner: false,
    source: ['INT', 'EXT'],
    priceRange: [500, 5000],
    certifications: [],
    minReliability: 0
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
      api.getAIAnalysis(query, { 
        unitCost: filters.estUnitCost, 
        quantity: filters.estQuantity 
      }).then(setAiAnalysis)
    }
  }, [query, filters.estUnitCost, filters.estQuantity])

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
      navigate(`/compare?vendors=${selectedVendors.join(',')}`)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0
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
      case 'price': return a.unitPrice - b.unitPrice
      case 'leadTime': return parseInt(a.leadTime) - parseInt(b.leadTime)
      default: return b.suitabilityScore - a.suitabilityScore
    }
  })

  // Split vendors into top recommendations and others
  const topVendors = sortedVendors.slice(0, 4)
  const otherVendors = sortedVendors.slice(4)

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
          <div className="filter-section cost-adjustments">
            <div className="filter-header">
              <h3>Input Cost Adjustments</h3>
              <button className="collapse-btn">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              </button>
            </div>
            
            <div className="filter-field">
              <label>EST. UNIT COST ($)</label>
              <input 
                type="number" 
                value={filters.estUnitCost}
                onChange={(e) => setFilters(f => ({ ...f, estUnitCost: +e.target.value }))}
              />
            </div>
            
            <div className="filter-field">
              <label>EST. QUANTITY NEEDED</label>
              <input 
                type="number" 
                value={filters.estQuantity}
                onChange={(e) => setFilters(f => ({ ...f, estQuantity: +e.target.value }))}
              />
            </div>
            
            <div className="filter-toggle">
              <span>Price Benchmark: INT vs EXT</span>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={filters.priceBenchmark}
                  onChange={(e) => setFilters(f => ({ ...f, priceBenchmark: e.target.checked }))}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

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

            <div className="filter-checkbox">
              <input 
                type="checkbox" 
                id="suggestSubs"
                checked={filters.suggestSubstitutes}
                onChange={(e) => setFilters(f => ({ ...f, suggestSubstitutes: e.target.checked }))}
              />
              <div>
                <label htmlFor="suggestSubs">Suggest Substitutes</label>
                <p className="filter-hint">Automatically find alt. materials if quantity is insufficient.</p>
              </div>
            </div>

            <div className="filter-group">
              <h4>Relationship Status</h4>
              <div className="filter-checkbox">
                <input 
                  type="checkbox" 
                  id="currentPartner"
                  checked={filters.showCurrentPartner}
                  onChange={(e) => setFilters(f => ({ ...f, showCurrentPartner: e.target.checked }))}
                />
                <label htmlFor="currentPartner">Show Current Partner</label>
              </div>
            </div>

            <div className="filter-group">
              <h4>Source</h4>
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
                Price Range
                <svg className="info-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
              </h4>
              <div className="price-range-inputs">
                <span className="price-label">${filters.priceRange[0]}</span>
                <div className="slider-container">
                  <input 
                    type="range" 
                    min="500" 
                    max="2000" 
                    step="50"
                    value={filters.priceRange[0]}
                    onChange={(e) => setFilters(f => ({ ...f, priceRange: [+e.target.value, f.priceRange[1]] }))}
                    className="price-slider"
                  />
                </div>
                <span className="price-label">${filters.priceRange[1].toLocaleString()}</span>
              </div>
              <div className="benchmark-note">
                Benchmark: $1,050/kg (Global Avg)
              </div>
            </div>

            <div className="filter-group">
              <h4>Certifications</h4>
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
              <h4>
                Min. Reliability Score
                <svg className="info-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
              </h4>
              <div className="reliability-buttons">
                {[1, 2, 3, 4, 5].map(score => (
                  <button 
                    key={score}
                    className={`reliability-btn ${filters.minReliability >= score ? 'active' : ''}`}
                    onClick={() => setFilters(f => ({ ...f, minReliability: score }))}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="filter-actions">
            <button className="reset-btn" onClick={() => setFilters({
              estUnitCost: 1250,
              estQuantity: 500,
              priceBenchmark: true,
              suggestSubstitutes: false,
              showCurrentPartner: false,
              source: ['INT', 'EXT'],
              priceRange: [500, 5000],
              certifications: [],
              minReliability: 0
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
              <button className="back-link" onClick={() => navigate('/')}>
                ← Back to Results
              </button>
              <h1>{vendors.length} Results for: {query}</h1>
              <p className="results-subtitle">Top recommendations based on price, reliability, and delivery speed.</p>
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
              TOP RECOMMENDED OPPORTUNITIES
            </h2>

            {/* AI Analysis Banner */}
            {aiAnalysis && (
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
                OTHER RECOMMENDATIONS ({otherVendors.length})
              </h2>
              <div className="vendors-list">
                {otherVendors.map(vendor => (
                  <VendorCard 
                    key={vendor.id}
                    vendor={vendor}
                    isSelected={selectedVendors.includes(vendor.id)}
                    onToggleSelect={() => toggleVendorSelection(vendor.id)}
                    formatCurrency={formatCurrency}
                    quantity={filters.estQuantity}
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

function VendorCard({ vendor, isSelected, onToggleSelect, formatCurrency, quantity }) {
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
            <span className="metric-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M2 9h20" />
              </svg>
              Total Est. Cost
            </span>
            <span className="metric-value primary">{formatCurrency(vendor.unitPrice * quantity)}</span>
            <span className="metric-sub">@ {formatCurrency(vendor.unitPrice)} / kg</span>
          </div>
          
          <div className="metric">
            <span className="metric-label">Available Qty</span>
            <span className="metric-value">{vendor.availableQty.toLocaleString()} kg</span>
          </div>
          
          <div className="metric">
            <span className="metric-label">Region</span>
            <span className="metric-value">{vendor.region}</span>
          </div>
          
          <div className="metric">
            <span className="metric-label">Delivery</span>
            <span className="metric-value">{vendor.leadTime}</span>
          </div>
        </div>

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
          <button className="view-details-btn">View Details</button>
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
