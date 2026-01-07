import { useState } from 'react'
import Header from '../components/Header'
import './VendorTracker.css'

// Mock data for vendor evaluation tracking
const mockTrackerData = [
  {
    id: 1,
    vendorName: 'MilliporeSigma (Merck)',
    skuMaterial: 'TSA Plates',
    currentStatus: 'Newly Added',
    owner: { name: 'Ananya Desai', team: 'Procurement Team' },
    lastUpdated: '2025-12-16',
    comments: '-'
  },
  {
    id: 2,
    vendorName: 'Thermo Fisher Scientific',
    skuMaterial: 'TSA Plates',
    currentStatus: 'Technical Review',
    owner: { name: 'Rohan Iyer', team: 'QA Team' },
    lastUpdated: '2025-12-01',
    comments: '-'
  },
  {
    id: 3,
    vendorName: 'BioChem Solutions Ltd',
    skuMaterial: 'Proteina',
    currentStatus: 'Awaiting Documents',
    owner: { name: 'Arjun Mehra', team: 'QA Team' },
    lastUpdated: '2025-12-01',
    comments: '-'
  },
  {
    id: 4,
    vendorName: 'BioChem Solutions Ltd',
    skuMaterial: 'TSA Plates',
    currentStatus: 'Awaiting Documents',
    owner: { name: 'Arjun Mehra', team: 'QA Team' },
    lastUpdated: '2025-12-01',
    comments: '-'
  },
  {
    id: 5,
    vendorName: 'Cytiva',
    skuMaterial: 'Protein A Resin',
    currentStatus: 'Rejected',
    owner: { name: 'Priya Menon', team: 'Procurement Team' },
    lastUpdated: '2025-11-14',
    comments: '-'
  },
  {
    id: 6,
    vendorName: 'Thermo Fisher',
    skuMaterial: 'Syringe Filter 0.22 μm',
    currentStatus: 'Approved as Alternate',
    owner: { name: 'Kavya Deshpande', team: 'Procurement Team' },
    lastUpdated: '2025-11-05',
    comments: '-'
  },
  {
    id: 7,
    vendorName: 'Thermo Fisher Scientific',
    skuMaterial: 'PVDF Membrane',
    currentStatus: 'Approved as Alternate',
    owner: { name: 'Rohan Iyer', team: 'QA / MSAT / R&D' },
    lastUpdated: '2025-12-01',
    comments: '-'
  },
  {
    id: 8,
    vendorName: 'Sartorius',
    skuMaterial: 'Cell Culture Flask',
    currentStatus: 'Under Research',
    owner: { name: 'Ananya Desai', team: 'Procurement Team' },
    lastUpdated: '2025-12-10',
    comments: '-'
  },
  {
    id: 9,
    vendorName: 'Corning',
    skuMaterial: 'Polystyrene Petri Plates',
    currentStatus: 'Newly Added',
    owner: { name: 'Kavya Deshpande', team: 'Procurement Team' },
    lastUpdated: '2025-12-14',
    comments: '-'
  },
  {
    id: 10,
    vendorName: 'BD Biosciences',
    skuMaterial: 'Flow Cytometry Tubes',
    currentStatus: 'On Hold',
    owner: { name: 'Priya Menon', team: 'QA Team' },
    lastUpdated: '2025-11-20',
    comments: '-'
  }
]

// Workflow stages configuration
const workflowStages = [
  { id: 'overall', label: 'Overall', icon: 'grid', color: 'default' },
  { id: 'added', label: 'Added', icon: 'plus', color: 'blue' },
  { id: 'research', label: 'Under Research', icon: 'search', color: 'blue' },
  { id: 'review', label: 'Tech Review', icon: 'clipboard', color: 'blue' },
  { id: 'documents', label: 'Awaiting Documents', icon: 'file', color: 'blue' },
  { id: 'approved', label: 'Approved as Alternate', icon: 'check', color: 'green' },
  { id: 'rejected', label: 'Rejected / On hold', icon: 'x', color: 'red' }
]

function VendorTracker() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStage, setSelectedStage] = useState('overall')
  const [sortConfig, setSortConfig] = useState({ key: 'lastUpdated', direction: 'desc' })

  // Calculate counts for each stage
  const stageCounts = {
    overall: mockTrackerData.length,
    added: mockTrackerData.filter(v => v.currentStatus === 'Newly Added').length,
    research: mockTrackerData.filter(v => v.currentStatus === 'Under Research').length,
    review: mockTrackerData.filter(v => v.currentStatus === 'Technical Review').length,
    documents: mockTrackerData.filter(v => v.currentStatus === 'Awaiting Documents').length,
    approved: mockTrackerData.filter(v => v.currentStatus === 'Approved as Alternate').length,
    rejected: mockTrackerData.filter(v => ['Rejected', 'On Hold'].includes(v.currentStatus)).length
  }

  // Filter data based on search and stage
  const filteredData = mockTrackerData.filter(vendor => {
    const matchesSearch = !searchQuery || 
      vendor.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.skuMaterial.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStage = selectedStage === 'overall' || (
      (selectedStage === 'added' && vendor.currentStatus === 'Newly Added') ||
      (selectedStage === 'research' && vendor.currentStatus === 'Under Research') ||
      (selectedStage === 'review' && vendor.currentStatus === 'Technical Review') ||
      (selectedStage === 'documents' && vendor.currentStatus === 'Awaiting Documents') ||
      (selectedStage === 'approved' && vendor.currentStatus === 'Approved as Alternate') ||
      (selectedStage === 'rejected' && ['Rejected', 'On Hold'].includes(vendor.currentStatus))
    )
    
    return matchesSearch && matchesStage
  })

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (sortConfig.key === 'lastUpdated') {
      const dateA = new Date(a.lastUpdated)
      const dateB = new Date(b.lastUpdated)
      return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA
    }
    const aVal = a[sortConfig.key] || ''
    const bVal = b[sortConfig.key] || ''
    if (sortConfig.direction === 'asc') {
      return aVal.localeCompare ? aVal.localeCompare(bVal) : aVal - bVal
    }
    return bVal.localeCompare ? bVal.localeCompare(aVal) : bVal - aVal
  })

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const getStatusClass = (status) => {
    switch(status) {
      case 'Newly Added': return 'status-added'
      case 'Under Research': return 'status-research'
      case 'Technical Review': return 'status-review'
      case 'Awaiting Documents': return 'status-documents'
      case 'Approved as Alternate': return 'status-approved'
      case 'Rejected': return 'status-rejected'
      case 'On Hold': return 'status-onhold'
      default: return ''
    }
  }

  const renderStageIcon = (stage) => {
    switch(stage.icon) {
      case 'grid':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        )
      case 'plus':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        )
      case 'search':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
            <path d="M11 8v6M8 11h6" />
          </svg>
        )
      case 'clipboard':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            <path d="m12 16 2 2 4-4" />
          </svg>
        )
      case 'file':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        )
      case 'check':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
          </svg>
        )
      case 'x':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="9" x2="15" y2="15" />
            <line x1="15" y1="9" x2="9" y2="15" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className="tracker-page">
      <Header />
      
      <main className="tracker-main">
        {/* Page Header */}
        <div className="tracker-header">
          <div className="tracker-title-section">
            <button className="back-to-previous">
              ← Back to Previous Page
            </button>
            <h1>Vendor Evaluation Tracker</h1>
            <p>Track the evaluation progress of vendors across each review stage</p>
          </div>
          
          <div className="tracker-search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search by Vendor, material name, SKU"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Workflow Pipeline */}
        <div className="workflow-pipeline">
          {workflowStages.map((stage, index) => (
            <div key={stage.id} className="workflow-stage-wrapper">
              <button
                className={`workflow-stage ${selectedStage === stage.id ? 'active' : ''} ${stage.color}`}
                onClick={() => setSelectedStage(stage.id)}
              >
                <div className="stage-icon">
                  {renderStageIcon(stage)}
                </div>
                <div className="stage-info">
                  <span className="stage-label">{stage.label}</span>
                  <span className="stage-count">({stageCounts[stage.id]})</span>
                </div>
              </button>
              {index < workflowStages.length - 1 && (
                <div className="stage-connector">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Data Table */}
        <div className="tracker-table-container">
          <table className="tracker-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('vendorName')}>
                  <div className="th-content">
                    Vendor Name
                    <span className="sort-icon">
                      {sortConfig.key === 'vendorName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </span>
                  </div>
                </th>
                <th>
                  <div className="th-content">
                    SKU / Material
                    <button className="filter-btn">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                      </svg>
                    </button>
                  </div>
                </th>
                <th>
                  <div className="th-content">
                    Current Status
                    <button className="filter-btn">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                      </svg>
                    </button>
                  </div>
                </th>
                <th>
                  <div className="th-content">
                    Owner
                    <button className="filter-btn">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                      </svg>
                    </button>
                  </div>
                </th>
                <th onClick={() => handleSort('lastUpdated')}>
                  <div className="th-content">
                    Last Updated
                    <span className="sort-icon active">
                      {sortConfig.key === 'lastUpdated' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </span>
                  </div>
                </th>
                <th>Comments</th>
                <th>History</th>
                <th>Edit</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map(vendor => (
                <tr key={vendor.id}>
                  <td className="vendor-name-cell">{vendor.vendorName}</td>
                  <td>{vendor.skuMaterial}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(vendor.currentStatus)}`}>
                      {vendor.currentStatus}
                    </span>
                  </td>
                  <td>
                    <div className="owner-cell">
                      <span className="owner-name">{vendor.owner.name}</span>
                      <span className="owner-team">{vendor.owner.team}</span>
                    </div>
                  </td>
                  <td>{vendor.lastUpdated}</td>
                  <td className="comments-cell">{vendor.comments}</td>
                  <td>
                    <button className="action-btn history-btn" title="View History">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                    </button>
                  </td>
                  <td>
                    <button className="action-btn edit-btn" title="Edit">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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

export default VendorTracker

