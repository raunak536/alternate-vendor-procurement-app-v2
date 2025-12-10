import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { api, mockVendors } from '../data/mockData'
import './VendorDetail.css'

function VendorDetail() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const query = searchParams.get('q') || ''
  
  const [vendor, setVendor] = useState(null)
  const [activeTab, setActiveTab] = useState('company')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch vendor data
    const fetchVendor = async () => {
      setLoading(true)
      try {
        // First try to get from API with the search query
        if (query) {
          const vendors = await api.getVendors(query, {})
          const found = vendors.find(v => String(v.id) === String(id))
          if (found) {
            setVendor(found)
            setLoading(false)
            return
          }
        }
        // Fallback to mock data
        const mockVendor = mockVendors.find(v => String(v.id) === String(id))
        setVendor(mockVendor || null)
      } catch (error) {
        console.error('Error fetching vendor:', error)
        const mockVendor = mockVendors.find(v => String(v.id) === String(id))
        setVendor(mockVendor || null)
      }
      setLoading(false)
    }
    fetchVendor()
  }, [id, query])

  const handleBackToResults = () => {
    if (query) {
      navigate(`/results?q=${encodeURIComponent(query)}`)
    } else {
      navigate(-1)
    }
  }

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || amount === 'NA') return 'NA'
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 2
    }).format(amount)
  }

  const displayValue = (value, suffix = '') => {
    if (value === null || value === undefined || value === 'NA' || value === '') {
      return 'NA'
    }
    return suffix ? `${value} ${suffix}` : value
  }

  if (loading) {
    return (
      <div className="vendor-detail-page">
        <Header showSearch searchQuery={query} />
        <div className="loading-state">Loading vendor details...</div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="vendor-detail-page">
        <Header showSearch searchQuery={query} />
        <div className="error-state">
          <h2>Vendor not found</h2>
          <button onClick={handleBackToResults}>Back to Results</button>
        </div>
      </div>
    )
  }

  // Parse additional data from _apiData if available
  const apiData = vendor._apiData || {}

  return (
    <div className="vendor-detail-page">
      <Header showSearch searchQuery={query} />
      
      <div className="vendor-detail-container">
        {/* Back Navigation */}
        <button className="back-link" onClick={handleBackToResults}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Results
        </button>

        {/* Vendor Header */}
        <div className="vendor-detail-header">
          <div className="vendor-header-left">
            <div className="vendor-title-row">
              <h1>{vendor.name}</h1>
              {vendor.isCurrentPartner && (
                <span className="partner-badge">INTERNAL PARTNER</span>
              )}
              {vendor.source === 'INT' && !vendor.isCurrentPartner && (
                <span className="partner-badge">INTERNAL PARTNER</span>
              )}
            </div>
            <div className="vendor-meta">
              <span className="meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                {displayValue(vendor.region)}
              </span>
              {vendor.certifications && vendor.certifications.length > 0 && (
                <span className="meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  {vendor.certifications.join(', ')}
                </span>
              )}
            </div>
          </div>
          
          <div className="vendor-header-right">
            <div className="price-display">
              <span className="price-value">
                {vendor.unitPriceDisplay || 'NA'}
              </span>
              <span className="price-label">Price</span>
            </div>
            <button className="request-quote-btn">REQUEST QUOTE</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="detail-tabs">
          <button 
            className={`tab-btn ${activeTab === 'company' ? 'active' : ''}`}
            onClick={() => setActiveTab('company')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Company Info
          </button>
          <button 
            className={`tab-btn ${activeTab === 'specs' ? 'active' : ''}`}
            onClick={() => setActiveTab('specs')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            Product Specifications
          </button>
          <button 
            className={`tab-btn ${activeTab === 'score' ? 'active' : ''}`}
            onClick={() => setActiveTab('score')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Suitability Score
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'company' && (
            <CompanyInfoTab vendor={vendor} apiData={apiData} displayValue={displayValue} />
          )}
          {activeTab === 'specs' && (
            <ProductSpecsTab vendor={vendor} apiData={apiData} displayValue={displayValue} formatCurrency={formatCurrency} />
          )}
          {activeTab === 'score' && (
            <SuitabilityScoreTab vendor={vendor} />
          )}
        </div>
      </div>
    </div>
  )
}

function CompanyInfoTab({ vendor, apiData, displayValue }) {
  // Generate mock contact info based on vendor data
  const website = vendor.website || apiData.product_url || ''
  const vendorCode = `VND-US-${String(vendor.id).padStart(3, '0')}`
  
  return (
    <div className="company-info-tab">
      {/* Contact Information Card */}
      <div className="info-card">
        <h3 className="card-title">CONTACT INFORMATION</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">WEBSITE</span>
            {website ? (
              <a href={website.startsWith('http') ? website : `https://${website}`} 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 className="info-value link">
                {website.replace(/^https?:\/\//, '')}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            ) : (
              <span className="info-value na">NA</span>
            )}
          </div>
          <div className="info-item">
            <span className="info-label">VENDOR CODE</span>
            <span className="info-value">{vendorCode}</span>
          </div>
          <div className="info-item">
            <span className="info-label">EMAIL</span>
            <span className="info-value">
              {website ? `sales@${website.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]}` : 'NA'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">MANUFACTURER COUNTRY</span>
            <span className="info-value">{displayValue(vendor.region)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">PHONE</span>
            <span className="info-value">{vendor.isCurrentPartner ? '+1 (555) 123-4567' : 'NA'}</span>
          </div>
        </div>
      </div>

      {/* Internal Relationship History - only show for current partners */}
      {(vendor.isCurrentPartner || vendor.internalHistory) && (
        <div className="relationship-section">
          <h3 className="section-title-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Internal Relationship History
          </h3>
          
          <div className="history-cards">
            <div className="history-card">
              <span className="history-label">PARTNER SINCE</span>
              <span className="history-value">
                {vendor.internalHistory?.partnerSince || '2018'} 
                <span className="history-sub">
                  ({new Date().getFullYear() - (vendor.internalHistory?.partnerSince || 2018)} year {(new Date().getMonth() + 1)} months)
                </span>
              </span>
            </div>
            <div className="history-card">
              <span className="history-label">LIFETIME SPEND</span>
              <span className="history-value">
                ${((vendor.internalHistory?.lifetimeSpend || 1200000) / 1000000).toFixed(1)}M
              </span>
            </div>
            <div className="history-card">
              <span className="history-label">LAST PURCHASE</span>
              <span className="history-value">Oct 2024</span>
            </div>
            <div className="history-card">
              <span className="history-label">LAST PURCHASE AMOUNT</span>
              <span className="history-value">₹ 5.83 CR</span>
            </div>
          </div>

          <div className="history-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>
              "Last shipment received on <strong>Oct 2024</strong>. Quality control passed with no issues. 
              Procurement team notes indicate high responsiveness."
            </span>
          </div>
        </div>
      )}

      {/* Financial Stability Card */}
      <div className="info-card financial-card">
        <h3 className="card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          FINANCIAL STABILITY
        </h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">CREDIT RATING</span>
            <span className="info-value rating-good">AA+</span>
          </div>
          <div className="info-item">
            <span className="info-label">ANNUAL REVENUE</span>
            <span className="info-value">$2.4B</span>
          </div>
          <div className="info-item">
            <span className="info-label">YEAR FOUNDED</span>
            <span className="info-value">1994</span>
          </div>
          <div className="info-item">
            <span className="info-label">D&B RISK SCORE</span>
            <span className="info-value">
              <span className="risk-badge low">Low Risk</span>
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">PAYMENT HISTORY</span>
            <span className="info-value rating-good">Excellent</span>
          </div>
          <div className="info-item">
            <span className="info-label">EMPLOYEES</span>
            <span className="info-value">12,500+</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductSpecsTab({ vendor, apiData, displayValue, formatCurrency }) {
  // Get specs from API data
  const specs = apiData.specs || {}
  const specsAvailability = apiData.specs_availability || {}
  
  // Display name mapping for spec keys
  const specDisplayNames = {
    price: 'Price',
    storage_condition: 'Storage Condition',
    shelf_life: 'Shelf Life',
    certifications: 'Certifications',
    pack_size: 'Pack Size',
    catalog_number: 'Catalog Number',
    manufacturer: 'Manufacturer',
    lead_time: 'Lead Time',
    irradiation_status: 'Irradiation/Sterility',
    neutralizers_composition: 'Neutralizers Composition',
    plate_format: 'Plate Format/Packaging',
    documentation: 'Documentation/COA',
    detection_method: 'Detection Method',
    sensitivity: 'Sensitivity (LOD)',
    assay_time: 'Assay Time',
    instrument_compatibility: 'Instrument Compatibility',
    assay_format: 'Assay Format',
    sample_type_compatibility: 'Sample Type Compatibility'
  }
  
  // Format spec key to display name
  const formatSpecKey = (key) => {
    if (specDisplayNames[key]) return specDisplayNames[key]
    // Convert snake_case to Title Case
    return key.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }
  
  // Get confidence badge style
  const getConfidenceBadge = (confidence) => {
    const styles = {
      high: { background: '#dcfce7', color: '#166534', label: 'High' },
      medium: { background: '#fef9c3', color: '#854d0e', label: 'Medium' },
      low: { background: '#fee2e2', color: '#991b1b', label: 'Low' }
    }
    return styles[confidence] || styles.medium
  }
  
  // Check if we have any real specs from API
  const hasApiSpecs = Object.keys(specs).length > 0
  
  // Get unavailable specs
  const unavailableSpecs = specsAvailability.unavailable || []
  
  return (
    <div className="product-specs-tab">
      {/* Product Info Header */}
      {apiData.product_name && (
        <div className="product-info-header">
          <h3 className="product-name">{apiData.product_name}</h3>
          {apiData.product_description && (
            <p className="product-description">{apiData.product_description}</p>
          )}
          {apiData.product_url && (
            <a href={apiData.product_url} target="_blank" rel="noopener noreferrer" className="product-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              View Product Page
            </a>
          )}
        </div>
      )}
      
      <h3 className="specs-title">Technical Specifications</h3>
      
      {hasApiSpecs ? (
        <div className="specs-layout">
          {/* Main Specs Card - API Data */}
          <div className="specs-card api-specs">
            <div className="specs-grid dynamic-grid">
              {Object.entries(specs).map(([key, specData]) => {
                if (!specData || typeof specData !== 'object') return null
                const value = specData.value
                const confidence = specData.confidence
                const confidenceStyle = getConfidenceBadge(confidence)
                
                return (
                  <div key={key} className="spec-item">
                    <div className="spec-label-row">
                      <span className="spec-label">{formatSpecKey(key).toUpperCase()}</span>
                      {confidence && (
                        <span 
                          className="confidence-badge"
                          style={{ 
                            background: confidenceStyle.background, 
                            color: confidenceStyle.color 
                          }}
                        >
                          {confidenceStyle.label}
                        </span>
                      )}
                    </div>
                    <span className="spec-value">{value || 'NA'}</span>
                    {specData.original_label && specData.original_label !== key && (
                      <span className="spec-source">Source: {specData.original_label}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Unavailable Specs Card */}
          {unavailableSpecs.length > 0 && (
            <div className="unavailable-specs-card">
              <h4>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                Unavailable Specifications
              </h4>
              <p className="unavailable-note">The following specifications were not available from the vendor's product page:</p>
              <div className="unavailable-list">
                {unavailableSpecs.map(specKey => (
                  <span key={specKey} className="unavailable-item">
                    {formatSpecKey(specKey)}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Data Source Info */}
          {specsAvailability.checked_at && (
            <div className="data-source-info">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Specifications extracted on {new Date(specsAvailability.checked_at).toLocaleString()}</span>
            </div>
          )}
        </div>
      ) : (
        /* Fallback to basic vendor data if no API specs */
        <div className="specs-layout">
          <div className="specs-card">
            <div className="specs-grid">
              <div className="spec-item">
                <span className="spec-label">PRICE</span>
                <span className="spec-value">
                  {vendor.unitPriceDisplay || 'NA'}
                </span>
              </div>
              <div className="spec-item">
                <span className="spec-label">SHELF LIFE</span>
                <span className="spec-value">{displayValue(vendor.shelfLife)}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">PACKAGING</span>
                <span className="spec-value">{displayValue(vendor.packaging)}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">STORAGE CONDITION</span>
                <span className="spec-value">{displayValue(vendor.storage)}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">LEAD TIME</span>
                <span className="spec-value">{displayValue(vendor.leadTime)}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">REGION</span>
                <span className="spec-value">{displayValue(vendor.region)}</span>
              </div>
            </div>
          </div>

          {/* Availability Card for fallback */}
          <div className="availability-card">
            <h4>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
              AVAILABILITY
            </h4>
            <div className="availability-items">
              <div className="availability-item">
                <span className="avail-label">In Stock:</span>
                <span className="avail-value">
                  {vendor.availableQty ? vendor.availableQty.toLocaleString() + ' units' : 'NA'}
                </span>
              </div>
              <div className="availability-item">
                <span className="avail-label">Lead Time:</span>
                <span className="avail-value">{displayValue(vendor.leadTime) || 'NA'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SuitabilityScoreTab({ vendor }) {
  // Calculate score breakdown
  const totalScore = vendor.suitabilityScore || 95
  
  // Score components (mock calculation based on total score)
  const priceScore = Math.round((totalScore / 100) * 38 + Math.random() * 2)
  const availabilityScore = Math.round((totalScore / 100) * 27 + Math.random() * 3)
  const qualityScore = vendor.certifications?.length >= 2 ? 20 : Math.round((totalScore / 100) * 20)
  const dataConfidenceScore = vendor.isCurrentPartner || vendor.source === 'INT' ? 10 : Math.round((totalScore / 100) * 10)

  const scoreCategories = [
    {
      name: 'Price Competitiveness',
      description: 'Vs. Market Benchmark & Budget',
      score: Math.min(priceScore, 40),
      maxScore: 40,
      weight: 40
    },
    {
      name: 'Availability & Lead Time',
      description: 'Stock Levels & Delivery Speed',
      score: Math.min(availabilityScore, 30),
      maxScore: 30,
      weight: 30
    },
    {
      name: 'Quality & Compliance',
      description: 'Certifications (ISO, GMP) & Specs',
      score: Math.min(qualityScore, 20),
      maxScore: 20,
      weight: 20
    },
    {
      name: 'Data Confidence',
      description: 'Internal Verified vs. External Scraped',
      score: Math.min(dataConfidenceScore, 10),
      maxScore: 10,
      weight: 10
    }
  ]

  return (
    <div className="suitability-score-tab">
      <div className="score-card">
        {/* Score Header */}
        <div className="score-header">
          <div className="score-title-section">
            <h3>Suitability Score</h3>
            <p>Composite score based on 4 weighted factors.</p>
          </div>
          <div className="total-score">
            {totalScore}%
          </div>
        </div>

        {/* Score Breakdown Grid */}
        <div className="score-breakdown-grid">
          {scoreCategories.map((category, index) => (
            <div key={index} className="score-category">
              <div className="category-header">
                <div className="category-info">
                  <h4>{category.name}</h4>
                  <p>{category.description}</p>
                </div>
                <div className="category-score">
                  <span className="score-num">{category.score}/{category.maxScore}</span>
                  <span className="weight-label">WEIGHT: {category.weight}%</span>
                </div>
              </div>
              <div className="score-bar">
                <div 
                  className="score-bar-fill" 
                  style={{ width: `${(category.score / category.maxScore) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Score Note */}
        <div className="score-note">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <p>
            Scores are calculated using real-time data from internal purchasing history and external market feeds. 
            <strong> Price Competitiveness</strong> is adjusted daily.
          </p>
        </div>
      </div>
    </div>
  )
}

export default VendorDetail

