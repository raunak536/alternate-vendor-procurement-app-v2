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

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  // Load dashboard stats and all SKUs on mount
  useEffect(() => {
    api.getDashboard().then(setDashboard).catch(err => console.error('Dashboard error:', err))
    api.getAllSkus().then(setAllSkus).catch(err => console.error('SKUs error:', err))
  }, [])

  // Filter suggestions as user types
  useEffect(() => {
    if (query.length > 0) {
      const filtered = allSkus.filter(sku => 
        sku.name.toLowerCase().includes(query.toLowerCase())
      )
      setSuggestions(filtered)
    } else {
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

  // Category color mapping
  const getCategoryColor = (index) => {
    const colors = ['#3B82F6', '#6366F1', '#F97316', '#14B8A6', '#EAB308', '#8B5CF6']
    return colors[index % colors.length]
  }

  return (
    <div className="landing-page">
      <Header />
      
      <main className="landing-main">
        {/* Hero Section */}
        <div className="hero-section">
          <div className="hero-logo">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="6" fill="white" />
              <circle cx="12" cy="18" r="4" fill="white" />
              <circle cx="36" cy="18" r="4" fill="white" />
              <circle cx="18" cy="34" r="4" fill="white" />
              <circle cx="30" cy="34" r="4" fill="white" />
              <line x1="24" y1="24" x2="12" y2="18" stroke="white" strokeWidth="2" />
              <line x1="24" y1="24" x2="36" y2="18" stroke="white" strokeWidth="2" />
              <line x1="24" y1="24" x2="18" y2="34" stroke="white" strokeWidth="2" />
              <line x1="24" y1="24" x2="30" y2="34" stroke="white" strokeWidth="2" />
              {/* Sparkles */}
              <circle cx="40" cy="10" r="2" fill="white" opacity="0.8" />
              <circle cx="8" cy="28" r="1.5" fill="white" opacity="0.6" />
              <circle cx="42" cy="32" r="1.5" fill="white" opacity="0.7" />
            </svg>
          </div>
          
          <h1 className="hero-title">{getGreeting()}, Ananya</h1>
          <p className="hero-subtitle">Find the best supplier for your needs</p>
          
          {/* Search Card */}
          <div className="search-card" ref={searchRef}>
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-input-wrapper">
                <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={handleInputFocus}
                  placeholder="Search by material name, SKU, or CAS number..."
                  className="search-input"
                />
                <button type="submit" className="search-button">
                  SEARCH
                </button>
              </div>
            </form>
            
            {showDropdown && suggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {suggestions.map((item) => (
                  <div key={item.id} className="suggestion-item" onClick={() => selectSuggestion(item)}>
                    <div className="suggestion-name">{item.name}</div>
                    <div className="suggestion-meta">
                      <span className="suggestion-category">{item.category}</span>
                      {item.versionsCount > 1 && (
                        <span className="suggestion-version">v{item.currentVersion} ({item.versionsCount} versions)</span>
                      )}
                      {item.lastUpdated && (
                        <span className="suggestion-date">{new Date(item.lastUpdated).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dashboard Section */}
        {dashboard && (
          <div className="dashboard-section">
            <div className="dashboard-header">
              <div className="dashboard-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                <span>Procurement Intelligence Dashboard</span>
              </div>
              <div className="dashboard-divider"></div>
            </div>
            
            <div className="dashboard-grid">
              {/* Network Status Card */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3 className="card-title">Network Status</h3>
                  <div className="card-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                </div>
                
                <div className="card-stats">
                  <div className="stat-row">
                    <div className="stat-primary">
                      <span className="stat-number">{dashboard.networkStatus.activeVendors}</span>
                      <span className="stat-label">Active Vendors</span>
                    </div>
                    <div className="stat-badges">
                      <div className="stat-badge">
                        <span className="badge-label">Internal</span>
                        <span className="badge-value">{dashboard.networkStatus.internalApproved}</span>
                      </div>
                      <div className="stat-badge">
                        <span className="badge-label">External</span>
                        <span className="badge-value">{dashboard.networkStatus.externalWatchlist}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="card-breakdown">
                  <div className="breakdown-header">
                    <span>Countries</span>
                    <span>Vendors</span>
                  </div>
                  {dashboard.networkStatus.topCountries.map((country, idx) => (
                    <div key={idx} className="breakdown-row">
                      <div className="breakdown-name">
                        <span className="country-flag">{country.flag}</span>
                        <span>{country.name}</span>
                      </div>
                      <span className="breakdown-value">{country.vendors}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SKU Coverage Card */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3 className="card-title">SKU Coverage</h3>
                  <div className="card-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                  </div>
                </div>
                
                <div className="card-stats">
                  <div className="stat-row">
                    <div className="stat-primary">
                      <span className="stat-number">{dashboard.skuCoverage.totalSkus.toLocaleString()}</span>
                      <span className="stat-label">SKUs Indexed</span>
                    </div>
                    <div className="stat-badges">
                      <div className="stat-badge">
                        <span className="badge-label">Categories</span>
                        <span className="badge-value">{dashboard.skuCoverage.categoriesCount}</span>
                      </div>
                      <div className="stat-badge">
                        <span className="badge-label">Last Updated</span>
                        <span className="badge-value">{dashboard.skuCoverage.lastUpdated}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="card-breakdown">
                  <div className="breakdown-header">
                    <span>Category</span>
                    <span>SKUs</span>
                  </div>
                  {dashboard.skuCoverage.categories.slice(0, 5).map((cat, idx) => (
                    <div key={idx} className="breakdown-row">
                      <div className="breakdown-name">
                        <span 
                          className="category-dot" 
                          style={{ backgroundColor: getCategoryColor(idx) }}
                        ></span>
                        <span>{cat.name}</span>
                      </div>
                      <span className="breakdown-value">{cat.skus}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Chat Button */}
        <button className="chat-fab">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </main>
    </div>
  )
}

export default Landing
