import { useEffect, useRef, useState } from 'react'
import Globe from 'react-globe.gl'
import './GlobeView.css'

function GlobeView({ vendors }) {
  const globeEl = useRef()
  const [selectedVendor, setSelectedVendor] = useState(null)

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.pointOfView({ altitude: 2.5 })
    }
  }, [])

  const markers = vendors.map(v => ({
    lat: v.lat,
    lng: v.lng,
    size: v.priority === 'High' ? 0.8 : v.priority === 'Medium' ? 0.5 : 0.3,
    color: v.purchasedLastYear ? '#667eea' : '#86868b',
    vendor: v
  }))

  return (
    <div className="globe-container">
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        backgroundColor="rgba(0,0,0,0)"
        pointsData={markers}
        pointAltitude={0.01}
        pointRadius="size"
        pointColor="color"
        pointLabel={d => `
          <div class="globe-tooltip">
            <strong>${d.vendor.name}</strong><br/>
            ${d.vendor.city}, ${d.vendor.location}<br/>
            <span style="color: #667eea">Spend: ${d.vendor.spend}</span><br/>
            Priority: ${d.vendor.priority}
          </div>
        `}
        onPointClick={(point) => setSelectedVendor(point.vendor)}
      />
      
      {selectedVendor && (
        <div className="vendor-info-card">
          <button className="close-btn" onClick={() => setSelectedVendor(null)}>×</button>
          <h3>{selectedVendor.name}</h3>
          <div className="info-row">
            <span className="label">Location:</span>
            <span>{selectedVendor.city}, {selectedVendor.location}</span>
          </div>
          <div className="info-row">
            <span className="label">Spend:</span>
            <span className="value-highlight">{selectedVendor.spend}</span>
          </div>
          <div className="info-row">
            <span className="label">Priority:</span>
            <span className={`priority-${selectedVendor.priority.toLowerCase()}`}>
              {selectedVendor.priority}
            </span>
          </div>
          <div className="info-row">
            <span className="label">Type:</span>
            <span>{selectedVendor.type}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default GlobeView

