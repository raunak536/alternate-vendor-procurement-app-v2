import { useNavigate } from 'react-router-dom'
import './Header.css'

function Header({ showSearch = false, searchQuery = '', onSearchChange, onSearch }) {
  const navigate = useNavigate()

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(searchQuery)
    } else if (searchQuery.trim()) {
      navigate(`/results?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="logo-container" onClick={() => navigate('/')}>
          <div className="logo-icon">B</div>
          <span className="logo-text">Biocon Procure AI</span>
        </div>
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
            placeholder="Search chemical, material, SKU..."
            className="header-search-input"
          />
        </form>
      )}

      <div className="header-right">
        <button className="header-icon-btn notification-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="notification-dot"></span>
        </button>
        <button className="header-icon-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </button>
        <button className="header-icon-btn profile-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
      </div>
    </header>
  )
}

export default Header

