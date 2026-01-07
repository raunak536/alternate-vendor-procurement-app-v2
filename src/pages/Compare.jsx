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

  // Helper to display value or NA
  const displayValue = (value, suffix = '') => {
    if (value === null || value === undefined || value === 'NA' || value === '') {
      return 'NA'
    }
    return suffix ? `${value} ${suffix}` : value
  }

  if (loading) {
    return (
      <div className="compare-page">
        <Header showSearch searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <div className="compare-loading">
          <div className="loading-spinner"></div>
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
      
      <div className="compare-container">
        {/* Header */}
        <div className="compare-header">
          <div className="compare-title-section">
            <h1>Compare Vendors</h1>
            <p className="compare-subtitle">Review selected vendors side by side to support informed decision-making</p>
          </div>
          <div className="compare-actions">
            <button className="action-btn secondary" onClick={handleExport} disabled={exporting}>
              {exporting ? (
                <>
                  <div className="btn-spinner"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export PDF
                </>
              )}
            </button>
            <button className="action-btn primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              Share Comparison
            </button>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="comparison-table-wrapper" ref={comparisonRef}>
          <table className="comparison-table">
            <thead>
              <tr>
                <th className="attribute-col">Vendor</th>
                {selectedVendors.map(vendor => (
                  <th key={vendor.id} className="vendor-col">
                    <a href={`/vendor/${vendor.id}?q=${encodeURIComponent(productName)}`} className="vendor-name-link">
                      {vendor.name}
                    </a>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Source Row */}
              <tr>
                <td className="attribute-col">
                  <span className="attr-name">Source</span>
                  <span className="attr-info">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4M12 8h.01" />
                    </svg>
                  </span>
                </td>
                {selectedVendors.map(vendor => (
                  <td key={vendor.id} className="vendor-col">
                    <span className={`source-tag ${vendor.source?.toLowerCase()}`}>{vendor.source}</span>
                  </td>
                ))}
              </tr>

              {/* Suitability Score Row */}
              <tr>
                <td className="attribute-col">
                  <span className="attr-name">Suitability Score</span>
                  <span className="attr-info">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4M12 8h.01" />
                    </svg>
                  </span>
                </td>
                {selectedVendors.map(vendor => (
                  <td key={vendor.id} className="vendor-col">
                    <span className="score-value">{vendor.suitabilityScore}%</span>
                  </td>
                ))}
              </tr>

              {/* Price Row */}
              <tr>
                <td className="attribute-col">
                  <span className="attr-name">Price (Per Unit)</span>
                </td>
                {selectedVendors.map(vendor => (
                  <td key={vendor.id} className="vendor-col">
                    {vendor.unitPriceDisplay || 'NA'}
                  </td>
                ))}
              </tr>

              {/* Available Quantity Row */}
              <tr>
                <td className="attribute-col">
                  <span className="attr-name">Available Quantity</span>
                </td>
                {selectedVendors.map(vendor => (
                  <td key={vendor.id} className="vendor-col">
                    {vendor.availableQty ? `${vendor.availableQty.toLocaleString()} plates` : 'NA'}
                  </td>
                ))}
              </tr>

              {/* Minimum Order Row */}
              <tr>
                <td className="attribute-col">
                  <span className="attr-name">Minimum Order</span>
                </td>
                {selectedVendors.map(vendor => (
                  <td key={vendor.id} className="vendor-col">
                    {vendor.minOrder || '100 Units'}
                  </td>
                ))}
              </tr>

              {/* Internal History Row */}
              <tr>
                <td className="attribute-col">
                  <span className="attr-name">Internal History</span>
                  <span className="attr-info">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4M12 8h.01" />
                    </svg>
                  </span>
                </td>
                {selectedVendors.map(vendor => (
                  <td key={vendor.id} className="vendor-col">
                    {vendor.internalHistory ? (
                      <div className="history-info">
                        <div>Spend: ${((vendor.internalHistory.lifetimeSpend || 0) / 1000000).toFixed(1)}M</div>
                        <div className="history-sub">Partner Since: {vendor.internalHistory.partnerSince} ({new Date().getFullYear() - vendor.internalHistory.partnerSince} years and {new Date().getMonth() + 1} months)</div>
                      </div>
                    ) : (
                      <span className="na-text">No internal history</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Lead Time Row */}
              <tr>
                <td className="attribute-col">
                  <span className="attr-name">Lead Time</span>
                </td>
                {selectedVendors.map(vendor => (
                  <td key={vendor.id} className="vendor-col">
                    <span className="lead-time-value">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="1" y="3" width="15" height="13" />
                        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                        <circle cx="5.5" cy="18.5" r="2.5" />
                        <circle cx="18.5" cy="18.5" r="2.5" />
                      </svg>
                      {displayValue(vendor.leadTime)}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Region Row */}
              <tr>
                <td className="attribute-col">
                  <span className="attr-name">Region</span>
                </td>
                {selectedVendors.map(vendor => (
                  <td key={vendor.id} className="vendor-col">
                    <span className="region-value">
                      <span className="flag-icon">🇮🇳</span>
                      {displayValue(vendor.region)}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Shelf Life Row */}
              <tr>
                <td className="attribute-col">
                  <span className="attr-name">Shelf Life</span>
                </td>
                {selectedVendors.map(vendor => (
                  <td key={vendor.id} className="vendor-col">
                    <span className="shelf-value">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      {displayValue(vendor.shelfLife) || 'NA'}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Packaging Row */}
              <tr>
                <td className="attribute-col">
                  <span className="attr-name">Packaging</span>
                </td>
                {selectedVendors.map(vendor => (
                  <td key={vendor.id} className="vendor-col">
                    {displayValue(vendor.packaging) || 'Standard Box (50/pack)'}
                  </td>
                ))}
              </tr>

              {/* Certifications Row */}
              <tr>
                <td className="attribute-col">
                  <span className="attr-name">Certifications</span>
                </td>
                {selectedVendors.map(vendor => (
                  <td key={vendor.id} className="vendor-col">
                    <div className="cert-tags">
                      {vendor.certifications && vendor.certifications.length > 0 ? (
                        vendor.certifications.map(cert => (
                          <span key={cert} className="cert-tag">{cert}</span>
                        ))
                      ) : (
                        <span className="na-text">NA</span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Compare
