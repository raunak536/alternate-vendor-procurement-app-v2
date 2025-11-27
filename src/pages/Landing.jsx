import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { api } from '../data/mockData'
import './Landing.css'

function Landing() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.getDashboard().then(setDashboard)
  }, [])

  useEffect(() => {
    if (query.length > 1) {
      api.searchProducts(query).then(setSuggestions)
    } else {
      setSuggestions([])
    }
  }, [query])

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/results?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const selectSuggestion = (item) => {
    setQuery(item.name)
    setSuggestions([])
    navigate(`/results?q=${encodeURIComponent(item.name)}`)
  }

  return (
    <div className="landing-page">
      <Header />
      
      <main className="landing-main">
        <div className="hero-section">
          <h1 className="hero-title">INTELLIGENT PROCUREMENT</h1>
          <p className="hero-subtitle">AI-Powered Vendor Discovery & Risk Analysis</p>
          
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-container">
              <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search chemical, material, SKU, or CAS number..."
                className="search-input"
                autoFocus
              />
              <button type="submit" className="search-button">
                SEARCH
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            {suggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {suggestions.map((item) => (
                  <div key={item.id} className="suggestion-item" onClick={() => selectSuggestion(item)}>
                    <div className="suggestion-name">{item.name}</div>
                    <div className="suggestion-meta">
                      <span className="suggestion-cas">{item.casNumber}</span>
                      <span className="suggestion-category">{item.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </form>
        </div>

        {dashboard && (
          <div className="dashboard-section">
            <div className="dashboard-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              <span>PROCUREMENT INTELLIGENCE DASHBOARD</span>
            </div>
            <div className="dashboard-divider"></div>
            
            <div className="dashboard-grid">
              <div className="dashboard-card network-card">
                <div className="card-header">
                  <span className="card-label">NETWORK STATUS</span>
                  <svg className="card-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="network-stats">
                  <div className="stat-main">
                    <span className="stat-number">{dashboard.networkStatus.activeVendors}</span>
                    <span className="stat-label">Active Vendors</span>
                  </div>
                  <div className="stat-breakdown">
                    <div className="stat-row">
                      <span>Internal (Approved)</span>
                      <span className="stat-value">{dashboard.networkStatus.internalApproved}</span>
                    </div>
                    <div className="stat-row">
                      <span>External (Watchlist)</span>
                      <span className="stat-value">{dashboard.networkStatus.externalWatchlist}</span>
                    </div>
                    <div className="stat-bar">
                      <div 
                        className="stat-bar-internal" 
                        style={{ width: `${(dashboard.networkStatus.internalApproved / dashboard.networkStatus.activeVendors) * 100}%` }}
                      ></div>
                      <div 
                        className="stat-bar-external" 
                        style={{ width: `${(dashboard.networkStatus.externalWatchlist / dashboard.networkStatus.activeVendors) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="dashboard-card risk-card">
                <div className="card-header">
                  <span className="card-label">GLOBAL SUPPLY WATCH</span>
                  <svg className="card-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
                <h3 className="risk-title">Regional Risk Analysis</h3>
                <div className="risk-alerts">
                  {dashboard.riskAlerts.map((alert, idx) => (
                    <div key={idx} className={`risk-alert ${alert.level === 'HIGH RISK' ? 'high' : 'moderate'}`}>
                      <div className="alert-header">
                        <span className="alert-icon">⚠</span>
                        <span className={`alert-level ${alert.level === 'HIGH RISK' ? 'high' : 'moderate'}`}>
                          {alert.level}: {alert.region}
                        </span>
                      </div>
                      <p className="alert-description">{alert.description}</p>
                      <div className="alert-affected">
                        AFFECTED: {alert.affectedVendors} VENDORS
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default Landing
