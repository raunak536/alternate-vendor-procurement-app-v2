import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { mockVendors } from '../data/mockData'
import GlobeView from '../components/GlobeView'
import './Results.css'

function Results() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const query = searchParams.get('q') || ''
  const [expandedId, setExpandedId] = useState(null)
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('list')

  useEffect(() => {
    if (query) {
      setLoading(true)
      fetch(`http://localhost:8000/vendors?sku=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
          setVendors(data)
          setLoading(false)
        })
    }
  }, [query])

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const formatSpend = (spend) => {
    const crores = spend / 10000000
    return `₹${crores.toFixed(2)} Cr`
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const formatTimeAgo = (timeAgo) => {
    if (!timeAgo) return null
    
    const parts = []
    if (timeAgo.years > 0) {
      parts.push(`${timeAgo.years} ${timeAgo.years === 1 ? 'year' : 'years'}`)
    }
    if (timeAgo.months > 0) {
      parts.push(`${timeAgo.months} ${timeAgo.months === 1 ? 'month' : 'months'}`)
    }
    
    if (parts.length === 0) {
      return 'This month'
    }
    
    return parts.join(', ') + ' ago'
  }

  return (
    <div className="results">
      <div className="results-header">
        <img src="/assets/Biocon-Logo-Main.png" alt="Biocon Logo" className="biocon-logo-header" />
        <button onClick={() => navigate('/')} className="back-button">
          ← Back
        </button>
        <div className="header-main">
          <div>
            <h1 className="results-title">Vendors by Spend</h1>
            {query && <p className="results-query">SKU: {query}</p>}
          </div>
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              List
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'globe' ? 'active' : ''}`}
              onClick={() => setViewMode('globe')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              Globe
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="vendors-list">
          {loading ? (
            <div className="loading">Loading vendors...</div>
          ) : vendors.length === 0 ? (
            <div className="no-results">No vendors found for this SKU</div>
          ) : (
            vendors.map((vendor, idx) => (
            <VendorTile
                key={idx}
              vendor={vendor}
                isExpanded={expandedId === idx}
                onToggle={() => toggleExpand(idx)}
                formatSpend={formatSpend}
                formatDate={formatDate}
                formatTimeAgo={formatTimeAgo}
            />
            ))
          )}
        </div>
      ) : (
        <GlobeView vendors={mockVendors} />
      )}
    </div>
  )
}

function VendorTile({ vendor, isExpanded, onToggle, formatSpend, formatDate, formatTimeAgo }) {
  const timeAgoStr = vendor.last_purchase_time_ago ? formatTimeAgo(vendor.last_purchase_time_ago) : null
  
  return (
    <div className={`vendor-tile ${isExpanded ? 'expanded' : ''}`}>
      <div className="tile-header" onClick={onToggle}>
        <div className="tile-main">
          <div className="vendor-name-row">
            <div className="vendor-name">{vendor.vendor_name}</div>
          </div>
          <div className="vendor-meta">
            <span className="vendor-spend">Total Spend: {formatSpend(vendor.total_spend)}</span>
            {vendor.last_purchase_date && (
              <>
                <span className="vendor-meta-separator">•</span>
                <span className="vendor-last-purchase">
                  Last Purchase: {formatDate(vendor.last_purchase_date)}
                  {timeAgoStr && <span className="time-ago"> ({timeAgoStr})</span>}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="expand-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d={isExpanded ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="tile-content">
          <div className="vendor-details">
            <div className="detail-row">
              <span className="detail-label">Vendor Code:</span>
              <span className="detail-value">{vendor.vendor_code}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Total Spent (FY23-FY25):</span>
              <span className="detail-value spend-highlight">{formatSpend(vendor.total_spend)}</span>
            </div>
            {vendor.last_purchase_date && (
              <>
                <div className="detail-row">
                  <span className="detail-label">Last Purchase Date:</span>
                  <span className="detail-value">
                    {formatDate(vendor.last_purchase_date)}
                    {timeAgoStr && <span className="time-ago-detail"> ({timeAgoStr})</span>}
                  </span>
                </div>
                {vendor.last_purchase_amount && (
                  <div className="detail-row">
                    <span className="detail-label">Last Purchase Amount:</span>
                    <span className="detail-value spend-highlight">{formatSpend(vendor.last_purchase_amount)}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Results


