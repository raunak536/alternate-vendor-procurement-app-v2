import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Landing.css'

function Landing() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    if (query.length > 0) {
      fetch(`http://localhost:8000/search?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => setSuggestions(data))
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
    setQuery(item)
    setSuggestions([])
    navigate(`/results?q=${encodeURIComponent(item)}`)
  }

  return (
    <div className="landing">
      <div className="landing-content">
        <div className="agent-section">
          <img src="/assets/Biocon-Logo-Main.png" alt="Biocon Logo" className="biocon-logo" />
          <h1 className="lumos-header">Lumos AI</h1>
          <p className="lumos-subheader">Find the best supplier for your needs</p>
        </div>

        <form onSubmit={handleSearch} className="search-form">
          <div className="trolley-container">
            <svg className="trolley-icon" viewBox="0 0 100 100" fill="none">
              {/* Cart body */}
              <path d="M25 30 L30 60 L75 60 L82 30 Z" 
                    fill="url(#cartGradient)" 
                    stroke="#5568d3" 
                    strokeWidth="2.5" 
                    strokeLinejoin="round"/>
              
              {/* Cart basket lines */}
              <line x1="35" y1="35" x2="32" y2="55" stroke="#fff" strokeWidth="1.5" opacity="0.6"/>
              <line x1="45" y1="35" x2="42" y2="55" stroke="#fff" strokeWidth="1.5" opacity="0.6"/>
              <line x1="55" y1="35" x2="52" y2="55" stroke="#fff" strokeWidth="1.5" opacity="0.6"/>
              <line x1="65" y1="35" x2="62" y2="55" stroke="#fff" strokeWidth="1.5" opacity="0.6"/>
              <line x1="75" y1="35" x2="72" y2="55" stroke="#fff" strokeWidth="1.5" opacity="0.6"/>
              
              {/* Handle */}
              <path d="M20 30 L25 30" stroke="#5568d3" strokeWidth="3" strokeLinecap="round"/>
              <path d="M15 20 L20 30 L25 30" stroke="#5568d3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              
              {/* Wheels */}
              <circle cx="38" cy="70" r="6" fill="#5568d3" stroke="#5568d3" strokeWidth="2"/>
              <circle cx="38" cy="70" r="3" fill="#fff"/>
              <circle cx="67" cy="70" r="6" fill="#5568d3" stroke="#5568d3" strokeWidth="2"/>
              <circle cx="67" cy="70" r="3" fill="#fff"/>
              
              <defs>
                <linearGradient id="cartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#667eea" />
                  <stop offset="100%" stopColor="#764ba2" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="search-container">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What would you like to source?"
              className="search-input"
              autoFocus
            />
            <button type="submit" className="search-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
            {suggestions.length > 0 && (
              <div className="suggestions">
                {suggestions.map((sku, i) => (
                  <div key={i} className="suggestion-item" onClick={() => selectSuggestion(sku.item)}>
                    {sku.item}
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default Landing

