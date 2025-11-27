import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { mockVendors } from '../data/mockData'
import './Compare.css'

function Compare() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const vendorIds = (searchParams.get('vendors') || '').split(',').map(Number).filter(Boolean)
  
  const [quantity, setQuantity] = useState(500)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Get selected vendors from mock data
  const selectedVendors = mockVendors.filter(v => vendorIds.includes(v.id))

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const handleBack = () => {
    navigate(-1)
  }

  const handleExport = () => {
    // Placeholder for export functionality
    alert('Export comparison functionality would be implemented here')
  }

  const handleSelectVendor = (vendorId) => {
    // Placeholder for vendor selection
    alert(`Vendor ${vendorId} selected for procurement`)
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
      
      <main className="compare-main">
        <div className="compare-header">
          <button className="back-link" onClick={handleBack}>
            ← Back to Results
          </button>
          <div className="compare-actions">
            <button className="export-btn" onClick={handleExport}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export Comparison
            </button>
          </div>
        </div>

        <div className="compare-title-row">
          <h1>Vendor Comparison</h1>
          <div className="quantity-input">
            <span>Calculation based on Qty:</span>
            <input 
              type="number" 
              value={quantity}
              onChange={(e) => setQuantity(+e.target.value)}
            />
            <span className="unit">kg</span>
          </div>
        </div>

        <div className="comparison-table">
          {/* Header Row */}
          <div className="table-row header-row">
            <div className="attribute-column">
              <span className="attribute-label">ATTRIBUTES</span>
            </div>
            {selectedVendors.map(vendor => (
              <div key={vendor.id} className="vendor-column">
                <div className="vendor-header-card">
                  <div className="vendor-badges">
                    <span className={`source-badge ${vendor.source.toLowerCase()}`}>{vendor.source}</span>
                    {vendor.isPreferred && <span className="preferred-badge">Preferred</span>}
                  </div>
                  <h3 className="vendor-name">{vendor.name}</h3>
                  <button 
                    className="select-vendor-btn"
                    onClick={() => handleSelectVendor(vendor.id)}
                  >
                    SELECT VENDOR
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Total Est. Cost Row */}
          <div className="table-row">
            <div className="attribute-column">
              <div className="attribute-content">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M2 9h20" />
                </svg>
                <div>
                  <span className="attribute-name">Total Est. Cost</span>
                  <span className="attribute-sub">(Unit Price × {quantity} kg)</span>
                </div>
              </div>
            </div>
            {selectedVendors.map(vendor => (
              <div key={vendor.id} className="vendor-column">
                <div className="cost-display">
                  <span className="cost-primary">{formatCurrency(vendor.unitPrice * quantity)}</span>
                  <span className="cost-unit">@{formatCurrency(vendor.unitPrice)} / kg</span>
                </div>
              </div>
            ))}
          </div>

          {/* Available Qty Row */}
          <div className="table-row">
            <div className="attribute-column">
              <span className="attribute-name">Available Qty</span>
            </div>
            {selectedVendors.map(vendor => (
              <div key={vendor.id} className="vendor-column">
                <span className="data-value">{vendor.availableQty.toLocaleString()} kg</span>
              </div>
            ))}
          </div>

          {/* Internal History Row */}
          <div className="table-row">
            <div className="attribute-column">
              <span className="attribute-name">Internal History</span>
            </div>
            {selectedVendors.map(vendor => (
              <div key={vendor.id} className="vendor-column">
                {vendor.internalHistory ? (
                  <div className="history-data">
                    <span>Spend: <strong>{formatCurrency(vendor.internalHistory.lifetimeSpend)}</strong></span>
                    <span>Partner: <strong>{vendor.internalHistory.partnerSince}</strong></span>
                  </div>
                ) : (
                  <span className="no-data">No internal history</span>
                )}
              </div>
            ))}
          </div>

          {/* Suitability Score Row */}
          <div className="table-row">
            <div className="attribute-column">
              <div className="attribute-content">
                <span className="attribute-name">Suitability Score</span>
                <svg className="info-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
              </div>
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

          {/* Lead Time Row */}
          <div className="table-row">
            <div className="attribute-column">
              <span className="attribute-name">Lead Time</span>
            </div>
            {selectedVendors.map(vendor => (
              <div key={vendor.id} className="vendor-column">
                <span className="data-value">{vendor.leadTime}</span>
              </div>
            ))}
          </div>

          {/* Region Row */}
          <div className="table-row">
            <div className="attribute-column">
              <span className="attribute-name">Region</span>
            </div>
            {selectedVendors.map(vendor => (
              <div key={vendor.id} className="vendor-column">
                <span className="data-value">{vendor.region}</span>
              </div>
            ))}
          </div>

          {/* Certifications Row */}
          <div className="table-row">
            <div className="attribute-column">
              <span className="attribute-name">Certifications</span>
            </div>
            {selectedVendors.map(vendor => (
              <div key={vendor.id} className="vendor-column">
                <div className="cert-badges">
                  {vendor.certifications.slice(0, 3).map(cert => (
                    <span key={cert} className="cert-badge">{cert}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* AI Risk Assessment Row */}
          <div className="table-row">
            <div className="attribute-column">
              <div className="attribute-content">
                <span className="attribute-name">AI Risk Assessment</span>
                <svg className="info-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
              </div>
            </div>
            {selectedVendors.map(vendor => (
              <div key={vendor.id} className="vendor-column">
                {vendor.riskAssessment ? (
                  <div className={`risk-badge ${vendor.riskAssessment.level.toLowerCase().replace(' ', '-')}`}>
                    <span className="risk-icon">✓</span>
                    <span className="risk-text">{vendor.riskAssessment.level}: {vendor.riskAssessment.description}</span>
                  </div>
                ) : (
                  <span className="no-data">—</span>
                )}
              </div>
            ))}
          </div>

          {/* Company Website Row */}
          <div className="table-row">
            <div className="attribute-column">
              <span className="attribute-name">Company Website</span>
            </div>
            {selectedVendors.map(vendor => (
              <div key={vendor.id} className="vendor-column">
                <a href={`https://${vendor.website}`} target="_blank" rel="noopener noreferrer" className="website-link">
                  {vendor.website}
                </a>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Compare

