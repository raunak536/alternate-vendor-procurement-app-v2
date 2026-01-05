import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { api } from '../data/mockData'
import './Landing.css'

function Landing() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [allSkus, setAllSkus] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [dashboard, setDashboard] = useState(null)
  const searchRef = useRef(null)
  const navigate = useNavigate()

  // Load dashboard stats and all SKUs on mount
  useEffect(() => {
    api.getDashboard().then(setDashboard).catch(err => console.error('Dashboard error:', err))
    api.getAllSkus().then(setAllSkus).catch(err => console.error('SKUs error:', err))
  }, [])

  // Filter suggestions as user types
  useEffect(() => {
    if (query.length > 0) {
      // Filter all SKUs based on query
      const filtered = allSkus.filter(sku => 
        sku.name.toLowerCase().includes(query.toLowerCase())
      )
      setSuggestions(filtered)
    } else {
      // Show all SKUs when no query
      setSuggestions(allSkus)
    }
  }, [query, allSkus])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/results?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const selectSuggestion = (item) => {
    setQuery(item.name)
    setShowDropdown(false)
    navigate(`/results?q=${encodeURIComponent(item.name)}`)
  }

  const handleInputFocus = () => {
    setShowDropdown(true)
  }

  return (
    <div className="landing-page">
      <Header />
      
      <main className="landing-main">
        <div className="hero-section">
          <h1 className="hero-title">INTELLIGENT PROCUREMENT</h1>
          <p className="hero-subtitle">AI-Powered Vendor Discovery & Risk Analysis</p>
          
          <form onSubmit={handleSearch} className="search-form" ref={searchRef}>
            <div className="search-container">
              <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={handleInputFocus}
                placeholder="Search SKU from database..."
                className="search-input"
              />
              <button type="submit" className="search-button">
                SEARCH
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            {showDropdown && suggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {suggestions.map((item) => (
                  <div key={item.id} className="suggestion-item" onClick={() => selectSuggestion(item)}>
                    <div className="suggestion-name">{item.name}</div>
                    <div className="suggestion-meta">
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
                  <div className="stat-top">
                    <div className="stat-main">
                      <span className="stat-number">{dashboard.networkStatus.activeVendors}</span>
                      <span className="stat-label">Active Vendors</span>
                    </div>
                    <div className="stat-meta">
                      <span className="stat-meta-item">{dashboard.networkStatus.internalApproved} Internal</span>
                      <span className="stat-meta-item">{dashboard.networkStatus.externalWatchlist} External</span>
                    </div>
                  </div>
                  <div className="country-breakdown">
                    <div className="breakdown-header">
                      <span>Manufacturer Country</span>
                      <span>Vendors</span>
                    </div>
                    {dashboard.networkStatus.topCountries.map((country, idx) => (
                      <div key={idx} className="breakdown-row">
                        <span className="country-name">
                          <span className="country-flag">{country.flag}</span>
                          {country.name}
                        </span>
                        <span className="country-count">{country.vendors}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="dashboard-card sku-coverage-card">
                <div className="card-header">
                  <span className="card-label">SKU COVERAGE</span>
                  <svg className="card-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                </div>
                <div className="sku-stats">
                  <div className="stat-top">
                    <div className="stat-main">
                      <span className="stat-number">{dashboard.skuCoverage.totalSkus.toLocaleString()}</span>
                      <span className="stat-label">SKUs Indexed</span>
                    </div>
                    <div className="stat-meta">
                      <span className="stat-meta-item">{dashboard.skuCoverage.categoriesCount} Categories</span>
                      <span className="stat-meta-item">Updated {dashboard.skuCoverage.lastUpdated}</span>
                    </div>
                  </div>
                  <div className="sku-breakdown">
                    <div className="breakdown-header">
                      <span>Category</span>
                      <span>SKUs</span>
                    </div>
                    {dashboard.skuCoverage.categories.slice(0, 5).map((cat, idx) => (
                      <div key={idx} className="breakdown-row">
                        <span className="category-name">{cat.name}</span>
                        <span className="category-count">{cat.skus}</span>
                      </div>
                    ))}
                  </div>
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
