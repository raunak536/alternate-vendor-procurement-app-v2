import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { api } from '../data/mockData'
import './Compare.css'

function Compare() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const vendorIds = (searchParams.get('vendors') || '').split(',').map(Number).filter(Boolean)
  const productName = searchParams.get('q') || 'TSA Plates'
  
  const [searchQuery, setSearchQuery] = useState(productName)
  const [allVendors, setAllVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const comparisonRef = useRef(null)
  
  // Filter states (same as Results page for consistency)
  const [filters, setFilters] = useState({
    currentPartnerOnly: false,
    source: ['INT', 'EXT'],
    certifications: [],
    locations: [],
    minSuitability: 0
  })
  
  // Fetch vendors when component mounts
  useEffect(() => {
    if (productName) {
      setLoading(true)
      api.getVendors(productName, {}).then(data => {
        // Handle both object response (with vendors array) and direct array
        setAllVendors(data.vendors || data)
        setLoading(false)
      })
    }
  }, [productName])
  
  // Get selected vendors from fetched data
  const selectedVendors = allVendors.filter(v => vendorIds.includes(v.id))

  // Get all dynamic attributes across all selected vendors
  const fixedFields = [
    'id', 'name', 'productName', 'source', 'isCurrentPartner', 'isPreferred', 'isBestValue', 'isFastest',
    'unitPrice', 'unitPriceDisplay', 'totalEstCost', 'availableQty', 'region', 'leadTime',
    'suitabilityScore', 'certifications', 'internalHistory', 'riskAssessment', 'website',
    'lat', 'lng', '_apiData', 'vendor_name', 'product_url', 'availability_status', 'price',
    'product_description', 'crawled_data', 'crawled_at', 'extracted_info', 'source_urls',
    'shelfLife', 'packaging', 'storage', 'locking', 'isManufacturerDirect', 'url'
  ]
  
  // Collect all unique dynamic attribute keys from all selected vendors
  const dynamicAttributeKeys = [...new Set(
    selectedVendors.flatMap(vendor => 
      Object.keys(vendor).filter(key => 
        !fixedFields.includes(key) && 
        vendor[key] !== null && 
        vendor[key] !== undefined && 
        vendor[key] !== 'NA' &&
        vendor[key] !== ''
      )
    )
  )]

  // Convert snake_case to Title Case for display
  const formatLabel = (key) => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
  }

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'NA'
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 2
    }).format(amount)
  }

  // Helper to display value or NA
  const displayValue = (value, suffix = '') => {
    if (value === null || value === undefined || value === 'NA') {
      return 'NA'
    }
    return suffix ? `${value} ${suffix}` : value
  }

  const handleBack = () => {
    navigate(-1)
  }

  const handleExport = async () => {
    if (!comparisonRef.current) return
    
    setExporting(true)
    
    try {
      // Dynamically import html2pdf
      const html2pdf = (await import('html2pdf.js')).default
      
      const element = comparisonRef.current
      const vendorNames = selectedVendors.map(v => v.name).join(' vs ')
      
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `${productName}_Vendor_Comparison_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a3', 
          orientation: 'landscape' 
        },
        pagebreak: { mode: 'avoid-all' }
      }
      
      await html2pdf().set(opt).from(element).save()
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Error exporting PDF. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="compare-page">
        <Header showSearch searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <div className="compare-empty">
          <p>Loading vendors...</p>
        </div>
      </div>
    )
  }

  if (selectedVendors.length < 2) {
    return (
      <div className="compare-page">
        <Header showSearch searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <div className="compare-empty">
          <p>Please select at least 2 vendors to compare.</p>
          <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    )
  }

  return (
    <div className="compare-page">
      <Header showSearch searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      
      <div className="compare-layout">
        {/* Left Sidebar - Same filters as Results */}
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
        <main className="compare-main">
          <div className="compare-header">
            <button className="back-link" onClick={handleBack}>
              ← Back to Results
            </button>
            <div className="compare-actions">
              <button className="export-btn" onClick={handleExport} disabled={exporting}>
                {exporting ? (
                  <>
                    <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                    </svg>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Export Comparison
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="compare-title-row">
            <h1>{productName} / Vendor Comparison</h1>
          </div>

          <div className="comparison-table" ref={comparisonRef}>
            {/* Header Row */}
            <div className="table-row header-row">
              <div className="attribute-column">
                <span className="attribute-label">ATTRIBUTES</span>
              </div>
              {selectedVendors.map(vendor => (
                <div key={vendor.id} className="vendor-column">
                  <div className="vendor-header-card">
                    {vendor.isCurrentPartner && (
                      <div className="current-partner-tag">
                        <span className="partner-icon">⟲</span>
                        CURRENT PARTNER
                      </div>
                    )}
                    <div className="vendor-badges">
                      <span className={`source-badge ${vendor.source.toLowerCase()}`}>{vendor.source}</span>
                      {vendor.isPreferred && <span className="preferred-badge">Preferred</span>}
                    </div>
                    <h3 className="vendor-name">{vendor.name}</h3>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Row */}
            <div className="table-row">
              <div className="attribute-column">
                <span className="attribute-name">Price</span>
              </div>
              {selectedVendors.map(vendor => (
                <div key={vendor.id} className="vendor-column">
                  <span className="data-value">
                    {vendor.unitPriceDisplay || 'NA'}
                  </span>
                </div>
              ))}
            </div>

            {/* URL Row */}
            <div className="table-row">
              <div className="attribute-column">
                <span className="attribute-name">Product URL</span>
              </div>
              {selectedVendors.map(vendor => (
                <div key={vendor.id} className="vendor-column">
                  {(vendor.url || vendor.website || vendor.product_url) ? (
                    <a 
                      href={vendor.url || vendor.website || vendor.product_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="website-link"
                    >
                      {vendor.url || vendor.website || vendor.product_url}
                    </a>
                  ) : (
                    <span className="no-data">NA</span>
                  )}
                </div>
              ))}
            </div>

            {/* Suitability Score Row */}
            <div className="table-row">
              <div className="attribute-column">
                <span className="attribute-name">Suitability Score</span>
              </div>
              {selectedVendors.map(vendor => (
                <div key={vendor.id} className="vendor-column">
                  <div className="score-display">
                    <div className="score-bar">
                      <div 
                        className="score-fill" 
                        style={{ width: `${vendor.suitabilityScore}%` }}
                      ></div>
                    </div>
                    <span className="score-value">{vendor.suitabilityScore}%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Manufacturer Country Row */}
            <div className="table-row">
              <div className="attribute-column">
                <span className="attribute-name">Manufacturer Country</span>
              </div>
              {selectedVendors.map(vendor => (
                <div key={vendor.id} className="vendor-column">
                  <span className="data-value">{vendor.region}</span>
                </div>
              ))}
            </div>

            {/* Certifications Row - Always shown */}
            <div className="table-row">
              <div className="attribute-column">
                <span className="attribute-name">Certifications</span>
              </div>
              {selectedVendors.map(vendor => (
                <div key={vendor.id} className="vendor-column">
                  <div className="cert-badges">
                    {vendor.certifications && vendor.certifications.length > 0 ? (
                      vendor.certifications.map(cert => (
                        <span key={cert} className="cert-badge">{cert}</span>
                      ))
                    ) : (
                      <span className="no-data">NA</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Dynamic Attribute Rows - Based on SKU-specific comparison attributes */}
            {dynamicAttributeKeys.map(attrKey => (
              <div className="table-row" key={attrKey}>
                <div className="attribute-column">
                  <span className="attribute-name">{formatLabel(attrKey)}</span>
                </div>
                {selectedVendors.map(vendor => (
                  <div key={vendor.id} className="vendor-column">
                    <span className="data-value">
                      {vendor[attrKey] !== null && vendor[attrKey] !== undefined && vendor[attrKey] !== ''
                        ? (Array.isArray(vendor[attrKey]) 
                            ? vendor[attrKey].join(', ') 
                            : vendor[attrKey])
                        : <span className="no-data">NA</span>
                      }
                    </span>
                  </div>
                ))}
              </div>
            ))}

            {/* Fallback rows for mock data (when no dynamic attributes) */}
            {dynamicAttributeKeys.length === 0 && (
              <>
                <div className="table-row">
                  <div className="attribute-column">
                    <span className="attribute-name">Shelf Life</span>
                  </div>
                  {selectedVendors.map(vendor => (
                    <div key={vendor.id} className="vendor-column">
                      <span className="data-value">{vendor.shelfLife || 'NA'}</span>
                    </div>
                  ))}
                </div>

                <div className="table-row">
                  <div className="attribute-column">
                    <span className="attribute-name">Packaging</span>
                  </div>
                  {selectedVendors.map(vendor => (
                    <div key={vendor.id} className="vendor-column">
                      <span className="data-value">{vendor.packaging || 'NA'}</span>
                    </div>
                  ))}
                </div>

                <div className="table-row">
                  <div className="attribute-column">
                    <span className="attribute-name">Storage Condition</span>
                  </div>
                  {selectedVendors.map(vendor => (
                    <div key={vendor.id} className="vendor-column">
                      <span className="data-value">{vendor.storage || 'NA'}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Compare
