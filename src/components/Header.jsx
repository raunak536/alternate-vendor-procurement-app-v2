import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './Header.css'

function Header({ showSearch = false, searchQuery = '', onSearchChange, onSearch }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [recentSearches, setRecentSearches] = useState([])

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 6))
    }
  }, [])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(searchQuery)
    } else if (searchQuery.trim()) {
      // Save to recent searches
      const searches = [searchQuery.trim(), ...recentSearches.filter(s => s !== searchQuery.trim())].slice(0, 6)
      localStorage.setItem('recentSearches', JSON.stringify(searches))
      setRecentSearches(searches)
      navigate(`/results?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleRecentSearch = (query) => {
    navigate(`/results?q=${encodeURIComponent(query)}`)
  }

  // Get current date formatted
  const formatDate = () => {
    const date = new Date()
    const day = date.getDate()
    const suffix = (day === 1 || day === 21 || day === 31) ? 'st' : 
                   (day === 2 || day === 22) ? 'nd' : 
                   (day === 3 || day === 23) ? 'rd' : 'th'
    return `${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long' })} ${day}${suffix}, ${date.getFullYear()}`
  }

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  // Default recent searches for demo
  const defaultSearches = [
    'Polystyrene Petri Plates',
    'Protein A Resin',
    'HPLC Grade Acetonitrile',
    'CHO Cell Culture Media',
    'Mannitol USP',
    'Type I Glass Vials'
  ]
  const displaySearches = recentSearches.length > 0 ? recentSearches : defaultSearches

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="app-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo" onClick={() => navigate('/')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="sidebar-brand">
            <span className="brand-biocon">Biocon</span>
            <span className="brand-biologics">Biologics</span>
          </span>
        </div>

        <div className="sidebar-menu-label">Menu</div>
        
        <nav className="sidebar-nav">
          <button 
            className={`sidebar-nav-btn ${isActive('/') && location.pathname === '/' ? 'active' : ''}`}
            onClick={() => navigate('/')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Home</span>
          </button>
          
          <button 
            className={`sidebar-nav-btn ${isActive('/results') || isActive('/vendor') ? 'active' : ''}`}
            onClick={() => navigate('/results')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <span>SKU Coverage</span>
          </button>
          
          <button 
            className={`sidebar-nav-btn ${isActive('/compare') ? 'active' : ''}`}
            onClick={() => navigate('/compare')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
            <span>Evaluation Tracker</span>
          </button>
        </nav>

        {/* Recent Searches */}
        <div className="sidebar-recent">
          <div className="recent-header">
            <span>Recent Search</span>
            <button className="recent-edit-btn" title="Edit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
          <div className="recent-list">
            {displaySearches.map((search, index) => (
              <button 
                key={index} 
                className="recent-item"
                onClick={() => handleRecentSearch(search)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>{search}</span>
              </button>
            ))}
          </div>
        </div>

        {/* User Profile */}
        <div className="sidebar-user">
          <img 
            src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&h=100&fit=crop&crop=face" 
            alt="Ananya Desai" 
            className="user-avatar"
          />
          <div className="user-info">
            <span className="user-name">Ananya Desai</span>
            <span className="user-role">Procurement Team</span>
          </div>
          <button className="logout-btn" title="Logout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Top Header */}
      <header className="app-header">
        <div className="header-left">
          {showSearch && location.pathname.includes('/vendor') && (
            <button className="back-btn" onClick={() => navigate(-1)}>
              ← Back to Results
            </button>
          )}
          {!showSearch && (
            <>
              <button className="header-menu-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </button>
              <span className="header-date">{formatDate()}</span>
            </>
          )}
        </div>

        {showSearch && (
          <form className="header-search" onSubmit={handleSearchSubmit}>
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder={searchQuery || 'TSA Plates'}
              className="header-search-input"
            />
          </form>
        )}

        <div className="header-right">
          <button className="header-icon-btn notification-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="notification-dot"></span>
          </button>
          <button className="header-icon-btn settings-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>
    </div>
  )
}

export default Header
