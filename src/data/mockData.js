// Mock data for vendors with procurement-specific attributes
export const mockVendors = [
  {
    id: 1,
    name: 'PharmaSource Global',
    source: 'INT',
    isCurrentPartner: true,
    isPreferred: true,
    unitPrice: 1250,
    totalEstCost: 625000,
    availableQty: 1000,
    region: 'North America',
    leadTime: '2 Weeks',
    suitabilityScore: 95,
    certifications: ['GMP', 'ISO 9001', 'Internal Approved'],
    internalHistory: {
      partnerSince: 2018,
      lifetimeSpend: 12400000
    },
    riskAssessment: {
      level: 'Low Risk',
      description: 'Verified partner with consistent history.'
    },
    website: 'www.pharmasourceglobal.com',
    lat: 40.7128,
    lng: -74.0060
  },
  {
    id: 2,
    name: 'BioChem Solutions Ltd',
    source: 'EXT',
    isCurrentPartner: false,
    isPreferred: false,
    isBestValue: true,
    unitPrice: 1100,
    totalEstCost: 550000,
    availableQty: 5000,
    region: 'Europe',
    leadTime: '4 Weeks',
    suitabilityScore: 94,
    certifications: ['GMP', 'ISO 9001', 'EU GMP'],
    internalHistory: null,
    riskAssessment: null,
    website: 'www.biochemsolutions.eu',
    lat: 52.5200,
    lng: 13.4050
  },
  {
    id: 3,
    name: 'Generic API Makers Inc.',
    source: 'EXT',
    isCurrentPartner: false,
    isPreferred: false,
    unitPrice: 950,
    totalEstCost: 475000,
    availableQty: 500,
    region: 'Asia',
    leadTime: '6 Weeks',
    suitabilityScore: 91,
    certifications: ['GMP', 'ISO 9001'],
    internalHistory: null,
    riskAssessment: null,
    website: 'www.genericapimakers.com',
    lat: 22.3193,
    lng: 114.1694
  },
  {
    id: 4,
    name: 'Fuji Film',
    source: 'INT',
    isCurrentPartner: true,
    isPreferred: false,
    unitPrice: 1280,
    totalEstCost: 640000,
    availableQty: 600,
    region: 'North America',
    leadTime: '2 Weeks',
    suitabilityScore: 89,
    certifications: ['GMP', 'ISO 9001', 'FDA Approved'],
    internalHistory: {
      partnerSince: 2020,
      lifetimeSpend: 2100000
    },
    riskAssessment: {
      level: 'Low Risk',
      description: 'Established partner with good track record.'
    },
    website: 'www.fujifilm.com',
    lat: 35.6762,
    lng: 139.6503
  },
  {
    id: 5,
    name: 'Reliable Compounds',
    source: 'INT',
    isCurrentPartner: true,
    isPreferred: false,
    isFastest: true,
    unitPrice: 1400,
    totalEstCost: 700000,
    availableQty: 2500,
    region: 'North America',
    leadTime: '1 Week',
    suitabilityScore: 88,
    certifications: ['GMP', 'ISO 9001', 'US FDA'],
    internalHistory: {
      partnerSince: 2021,
      lifetimeSpend: 3500000
    },
    riskAssessment: {
      level: 'Low Risk',
      description: 'Fast delivery partner.'
    },
    website: 'www.reliablecompounds.com',
    lat: 34.0522,
    lng: -118.2437
  },
  {
    id: 6,
    name: 'MedChem India',
    source: 'EXT',
    isCurrentPartner: false,
    isPreferred: false,
    unitPrice: 850,
    totalEstCost: 425000,
    availableQty: 3000,
    region: 'Asia',
    leadTime: '5 Weeks',
    suitabilityScore: 86,
    certifications: ['GMP', 'WHO GMP'],
    internalHistory: null,
    riskAssessment: {
      level: 'Medium Risk',
      description: 'New vendor, requires additional verification.'
    },
    website: 'www.medchemindia.in',
    lat: 19.0760,
    lng: 72.8777
  },
  {
    id: 7,
    name: 'EuroPharma GmbH',
    source: 'EXT',
    isCurrentPartner: false,
    isPreferred: false,
    unitPrice: 1350,
    totalEstCost: 675000,
    availableQty: 800,
    region: 'Europe',
    leadTime: '3 Weeks',
    suitabilityScore: 92,
    certifications: ['GMP', 'ISO 9001', 'EU GMP', 'FDA Approved'],
    internalHistory: null,
    riskAssessment: {
      level: 'Low Risk',
      description: 'Well-established European manufacturer.'
    },
    website: 'www.europharma.de',
    lat: 48.1351,
    lng: 11.5820
  },
  {
    id: 8,
    name: 'ChemSupply Australia',
    source: 'EXT',
    isCurrentPartner: false,
    isPreferred: false,
    unitPrice: 1180,
    totalEstCost: 590000,
    availableQty: 400,
    region: 'Oceania',
    leadTime: '4 Weeks',
    suitabilityScore: 84,
    certifications: ['GMP', 'TGA Approved'],
    internalHistory: null,
    riskAssessment: null,
    website: 'www.chemsupplyau.com.au',
    lat: -33.8688,
    lng: 151.2093
  }
]

// Dashboard statistics
export const dashboardStats = {
  networkStatus: {
    activeVendors: 142,
    internalApproved: 85,
    externalWatchlist: 57
  },
  riskAlerts: [
    {
      level: 'HIGH RISK',
      region: 'South East Asia',
      description: 'Heavy rains impacting logistics routes in Vietnam & Thailand. Expect 2-3 week delays for chemical precursors.',
      affectedVendors: 12
    },
    {
      level: 'MODERATE',
      region: 'Eastern Europe',
      description: 'Energy price fluctuations causing temporary production slowdowns in non-contracted facilities.',
      affectedVendors: 5
    }
  ]
}

// Mock API service to simulate backend calls
export const api = {
  // Search for products/SKUs
  async searchProducts(query) {
    await new Promise(r => setTimeout(r, 300))
    const products = [
      { id: 1, name: 'Amoxicillin API', casNumber: '26787-78-0', category: 'Antibiotics' },
      { id: 2, name: 'Amoxicillin Trihydrate', casNumber: '61336-70-7', category: 'Antibiotics' },
      { id: 3, name: 'Amoxicillin Sodium', casNumber: '34642-77-8', category: 'Antibiotics' },
      { id: 4, name: 'Paracetamol API', casNumber: '103-90-2', category: 'Analgesics' },
      { id: 5, name: 'Ibuprofen API', casNumber: '15687-27-1', category: 'NSAIDs' }
    ]
    return products.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.casNumber.includes(query)
    )
  },

  // Get vendors for a product with filters
  async getVendors(productQuery, filters = {}) {
    await new Promise(r => setTimeout(r, 500))
    let vendors = [...mockVendors]
    
    // Apply filters
    if (filters.source) {
      vendors = vendors.filter(v => filters.source.includes(v.source))
    }
    if (filters.minReliability) {
      vendors = vendors.filter(v => v.suitabilityScore >= filters.minReliability * 20)
    }
    if (filters.certifications?.length) {
      vendors = vendors.filter(v => 
        filters.certifications.some(c => v.certifications.includes(c))
      )
    }
    if (filters.priceRange) {
      vendors = vendors.filter(v => 
        v.unitPrice >= filters.priceRange[0] && v.unitPrice <= filters.priceRange[1]
      )
    }
    if (filters.showCurrentPartner) {
      vendors = vendors.filter(v => v.isCurrentPartner)
    }
    
    // Sort by suitability score
    vendors.sort((a, b) => b.suitabilityScore - a.suitabilityScore)
    
    return vendors
  },

  // Get AI analysis/recommendation - always uses full unfiltered vendor list for accurate analysis
  async getAIAnalysis(productQuery, costInputs) {
    await new Promise(r => setTimeout(r, 200))
    
    // Always use unfiltered vendor data for accurate recommendations
    const allVendors = [...mockVendors]
    
    // Find the true best value vendor (lowest cost) from ALL vendors
    const bestValue = allVendors.find(v => v.isBestValue) || 
      allVendors.reduce((best, v) => v.unitPrice < best.unitPrice ? v : best, allVendors[0])
    
    // Find the current partner with highest spend
    const currentPartners = allVendors.filter(v => v.isCurrentPartner)
    const current = currentPartners.length > 0 
      ? currentPartners.reduce((best, v) => 
          (v.internalHistory?.lifetimeSpend || 0) > (best.internalHistory?.lifetimeSpend || 0) ? v : best, 
          currentPartners[0])
      : null
    
    if (!bestValue || !current) {
      return null
    }
    
    // Calculate savings based on user's quantity input
    const quantity = costInputs?.quantity || 500
    const currentCost = current.unitPrice * quantity
    const bestValueCost = bestValue.unitPrice * quantity
    const savings = currentCost - bestValueCost
    const savingsPercent = Math.round((savings / currentCost) * 100)
    
    // Calculate lead time difference
    const currentLeadWeeks = parseInt(current.leadTime) || 2
    const bestValueLeadWeeks = parseInt(bestValue.leadTime) || 4
    const leadTimeDiff = bestValueLeadWeeks - currentLeadWeeks
    
    const leadTimeNote = leadTimeDiff > 0 
      ? `, though lead time increases by ${leadTimeDiff} week${leadTimeDiff > 1 ? 's' : ''}`
      : leadTimeDiff < 0 
        ? `, with lead time ${Math.abs(leadTimeDiff)} week${Math.abs(leadTimeDiff) > 1 ? 's' : ''} faster`
        : ''
    
    return {
      recommendation: `Based on current input-cost assumptions, switching to ${bestValue.name} could yield a ${savingsPercent}% savings (approx. $${(savings/1000).toFixed(0)},000)${leadTimeNote}.`,
      highlightVendor: bestValue.name
    }
  },

  // Get dashboard data
  async getDashboard() {
    await new Promise(r => setTimeout(r, 200))
    return dashboardStats
  }
}
