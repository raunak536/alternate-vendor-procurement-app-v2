// Backend API base URL
const API_BASE_URL = 'http://localhost:8000'

// Mock data for vendors with procurement-specific attributes
export const mockVendors = [
  {
    id: 1,
    name: 'PharmaSource Global',
    source: 'INT',
    isCurrentPartner: true,
    isPreferred: true,
    unitPrice: 12,
    totalEstCost: 6000,
    availableQty: 50000,
    region: 'India',
    leadTime: '2 Weeks',
    suitabilityScore: 95,
    certifications: ['GMP', 'ISO 9001'],
    shelfLife: '24 Months',
    packaging: 'Tripled wrapped (two plastic sleeve + one foil) (25/pack)',
    storage: 'RT (2 - 25 deg C)',
    locking: 'Standard',
    internalHistory: {
      partnerSince: 2018,
      lifetimeSpend: 1200000
    },
    riskAssessment: {
      level: 'Low Risk',
      description: 'Verified partner with consistent history.'
    },
    website: 'www.pharmasourceglobal.com',
    lat: 19.0760,
    lng: 72.8777
  },
  {
    id: 2,
    name: 'BioChem Solutions Ltd',
    source: 'EXT',
    isCurrentPartner: false,
    isPreferred: false,
    isBestValue: true,
    unitPrice: 8.50,
    totalEstCost: 4250,
    availableQty: 100000,
    region: 'India',
    leadTime: '4 Weeks',
    suitabilityScore: 94,
    certifications: ['ISO 9001'],
    shelfLife: '36 Months',
    packaging: 'Standard Box (50/pack)',
    storage: 'RT (2 - 25 deg C)',
    locking: 'Standard',
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
    unitPrice: 9.50,
    totalEstCost: 4750,
    availableQty: 20000,
    region: 'Asia Pacific',
    leadTime: '6 Weeks',
    suitabilityScore: 91,
    certifications: ['GMP'],
    shelfLife: '24 Months',
    packaging: 'Bag (25/pack)',
    storage: 'RT (Up to 25 deg C)',
    locking: 'Standard',
    internalHistory: null,
    riskAssessment: {
      level: 'Medium Risk',
      description: 'Good specs, but longer lead time.'
    },
    website: 'www.genericapimakers.com',
    lat: 22.3193,
    lng: 114.1694
  },
  {
    id: 4,
    name: 'Canada Health Imports',
    source: 'INT',
    isCurrentPartner: true,
    isPreferred: false,
    unitPrice: 12.80,
    totalEstCost: 6400,
    availableQty: 6000,
    region: 'Europe',
    leadTime: '2 Weeks',
    suitabilityScore: 89,
    certifications: ['US FDA'],
    shelfLife: '24 Months',
    packaging: 'Drum (25/pack)',
    storage: 'RT (2-8 deg C)',
    locking: 'Standard',
    internalHistory: {
      partnerSince: 2020,
      lifetimeSpend: 210000
    },
    riskAssessment: {
      level: 'Low Risk',
      description: 'Established partner with good track record.'
    },
    website: 'www.canadahealthimports.com',
    lat: 45.4215,
    lng: -75.6972
  },
  {
    id: 5,
    name: 'Reliable Compounds',
    source: 'INT',
    isCurrentPartner: true,
    isPreferred: false,
    isFastest: true,
    unitPrice: 14,
    totalEstCost: 7000,
    availableQty: 25000,
    region: 'North America',
    leadTime: '1 Week',
    suitabilityScore: 88,
    certifications: ['GMP', 'ISO 9001', 'US FDA'],
    shelfLife: '18 Months',
    packaging: 'Vacuum sealed (10/pack)',
    storage: 'RT (2 - 25 deg C)',
    locking: 'Premium',
    internalHistory: {
      partnerSince: 2021,
      lifetimeSpend: 350000
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
    unitPrice: 7.50,
    totalEstCost: 3750,
    availableQty: 30000,
    region: 'India',
    leadTime: '5 Weeks',
    suitabilityScore: 86,
    certifications: ['GMP', 'WHO GMP'],
    shelfLife: '24 Months',
    packaging: 'Standard Box (100/pack)',
    storage: 'RT (Up to 30 deg C)',
    locking: 'Standard',
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
    unitPrice: 13.50,
    totalEstCost: 6750,
    availableQty: 8000,
    region: 'Europe',
    leadTime: '3 Weeks',
    suitabilityScore: 92,
    certifications: ['GMP', 'ISO 9001', 'EU GMP', 'FDA Approved'],
    shelfLife: '30 Months',
    packaging: 'Triple wrapped (25/pack)',
    storage: 'RT (2 - 25 deg C)',
    locking: 'Premium',
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
    unitPrice: 11.80,
    totalEstCost: 5900,
    availableQty: 4000,
    region: 'Asia Pacific',
    leadTime: '4 Weeks',
    suitabilityScore: 84,
    certifications: ['GMP', 'TGA Approved'],
    shelfLife: '24 Months',
    packaging: 'Standard Box (50/pack)',
    storage: 'RT (Up to 25 deg C)',
    locking: 'Standard',
    internalHistory: null,
    riskAssessment: null,
    website: 'www.chemsupplyau.com.au',
    lat: -33.8688,
    lng: 151.2093
  },
  {
    id: 9,
    name: 'Tokyo Pharma Supply',
    source: 'EXT',
    isCurrentPartner: false,
    isPreferred: false,
    unitPrice: 15.20,
    totalEstCost: 7600,
    availableQty: 15000,
    region: 'Asia Pacific',
    leadTime: '3 Weeks',
    suitabilityScore: 90,
    certifications: ['GMP', 'ISO 9001', 'PMDA'],
    shelfLife: '36 Months',
    packaging: 'Vacuum sealed (20/pack)',
    storage: 'RT (2 - 25 deg C)',
    locking: 'Premium',
    internalHistory: null,
    riskAssessment: {
      level: 'Low Risk',
      description: 'High quality Japanese manufacturer.'
    },
    website: 'www.tokyopharmasupply.jp',
    lat: 35.6762,
    lng: 139.6503
  },
  {
    id: 10,
    name: 'Nordic BioMed',
    source: 'EXT',
    isCurrentPartner: false,
    isPreferred: false,
    unitPrice: 16.00,
    totalEstCost: 8000,
    availableQty: 5000,
    region: 'Europe',
    leadTime: '2 Weeks',
    suitabilityScore: 87,
    certifications: ['GMP', 'ISO 9001', 'EU GMP'],
    shelfLife: '24 Months',
    packaging: 'Cold chain (10/pack)',
    storage: 'RT (2 - 8 deg C)',
    locking: 'Premium',
    internalHistory: null,
    riskAssessment: {
      level: 'Low Risk',
      description: 'Premium Scandinavian supplier.'
    },
    website: 'www.nordicbiomed.se',
    lat: 59.3293,
    lng: 18.0686
  },
  {
    id: 11,
    name: 'Mumbai Chemicals Ltd',
    source: 'EXT',
    isCurrentPartner: false,
    isPreferred: false,
    unitPrice: 6.80,
    totalEstCost: 3400,
    availableQty: 80000,
    region: 'India',
    leadTime: '5 Weeks',
    suitabilityScore: 82,
    certifications: ['GMP'],
    shelfLife: '18 Months',
    packaging: 'Bulk bag (100/pack)',
    storage: 'RT (Up to 30 deg C)',
    locking: 'Standard',
    internalHistory: null,
    riskAssessment: {
      level: 'Medium Risk',
      description: 'Budget option with longer lead time.'
    },
    website: 'www.mumbaichemicals.in',
    lat: 19.0760,
    lng: 72.8777
  },
  {
    id: 12,
    name: 'Brazil Pharma Export',
    source: 'EXT',
    isCurrentPartner: false,
    isPreferred: false,
    unitPrice: 10.50,
    totalEstCost: 5250,
    availableQty: 12000,
    region: 'North America',
    leadTime: '4 Weeks',
    suitabilityScore: 83,
    certifications: ['GMP', 'ANVISA'],
    shelfLife: '24 Months',
    packaging: 'Standard Box (50/pack)',
    storage: 'RT (2 - 25 deg C)',
    locking: 'Standard',
    internalHistory: null,
    riskAssessment: {
      level: 'Medium Risk',
      description: 'South American supplier with good capacity.'
    },
    website: 'www.brazilpharmaexport.com.br',
    lat: -23.5505,
    lng: -46.6333
  }
]

// Dashboard statistics
export const dashboardStats = {
  networkStatus: {
    activeVendors: 142,
    internalApproved: 85,
    externalWatchlist: 57,
    topCountries: [
      { name: 'India', vendors: 42, flag: '🇮🇳' },
      { name: 'China', vendors: 28, flag: '🇨🇳' },
      { name: 'Germany', vendors: 18, flag: '🇩🇪' },
      { name: 'USA', vendors: 24, flag: '🇺🇸' },
      { name: 'Japan', vendors: 12, flag: '🇯🇵' }
    ]
  },
  skuCoverage: {
    totalSkus: 2847,
    categoriesCount: 12,
    lastUpdated: '2 hours ago',
    categories: [
      { name: 'Lab Consumables', skus: 642 },
      { name: 'APIs & Intermediates', skus: 518 },
      { name: 'Packaging Materials', skus: 423 },
      { name: 'Excipients', skus: 389 },
      { name: 'Solvents & Chemicals', skus: 356 },
      { name: 'Others', skus: 519 }
    ]
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

// Helper to convert API vendor data to frontend format with mock data for missing fields
function transformApiVendor(vendor, index) {
  // Use raw price string from JSON - clean URL citations if present
  let priceDisplay = 'NA'
  if (vendor.price && vendor.price !== 'NA') {
    // Remove inline URL citations like "value [https://url.com]"
    priceDisplay = vendor.price.replace(/\s*\[https?:\/\/[^\]]+\]\s*$/i, '').trim()
  }
  
  // Parse certifications - show NA if not present
  let certifications = []
  if (vendor.certifications && Array.isArray(vendor.certifications)) {
    // Handle certifications that might have inline URLs like "USP, EP [url]"
    certifications = vendor.certifications.map(cert => {
      if (typeof cert === 'string') {
        return cert.replace(/\s*\[.*?\]\s*$/, '').trim()
      }
      return cert
    })
  } else if (typeof vendor.certifications === 'string' && vendor.certifications !== 'NA') {
    // Handle string certifications with possible inline URL
    const certStr = vendor.certifications.replace(/\s*\[.*?\]\s*$/, '')
    certifications = certStr.split(',').map(c => c.trim()).filter(Boolean)
  } else if (vendor.quality_certifications && vendor.quality_certifications !== 'NA') {
    certifications = vendor.quality_certifications.split(',').map(c => c.trim())
  }

  // Use suitability_score from backend if available, otherwise fallback
  const suitabilityScore = vendor.suitability_score ?? (95 - (index * 3))

  // Fixed fields that we handle specifically
  const fixedFields = [
    'id', 'vendor_name', 'region', 'product_description', 'product_url',
    'availability_status', 'certifications', 'price', 'source_urls',
    'crawled_data', 'crawled_at', 'extracted_info', 'suitability_score'
  ]

  // Build base vendor object
  const transformedVendor = {
    id: vendor.id || index + 1,
    name: vendor.vendor_name,
    source: 'EXT', // External vendors from deep research
    isCurrentPartner: false,
    isPreferred: index === 0, // First vendor as preferred (after sorting by score)
    isBestValue: false, // Cannot determine without parsing price
    unitPrice: null, // Not parsed for API vendors - use raw price string instead
    unitPriceDisplay: priceDisplay, // Raw price string from JSON
    totalEstCost: null, // Cannot calculate without parsed unit price
    availableQty: null, // NA - not in API data
    region: vendor.region || 'NA',
    leadTime: 'NA', // Not available from deep research
    suitabilityScore: suitabilityScore, // Score from backend scoring module
    certifications: certifications,
    internalHistory: null,
    riskAssessment: null, // NA - no internal risk data for external vendors
    website: vendor.product_url || '',
    lat: null,
    lng: null,
    // Original API data preserved for details view
    _apiData: vendor
  }

  // Copy all dynamic attributes from the API response (these are SKU-specific comparison attributes)
  // They will be displayed dynamically in the vendor card
  Object.entries(vendor).forEach(([key, value]) => {
    if (!fixedFields.includes(key) && value !== null && value !== undefined) {
      // Clean up values that have inline URL citations like "value [url]"
      if (typeof value === 'string') {
        // Extract just the value, removing the [url] citation
        const cleanValue = value.replace(/\s*\[https?:\/\/[^\]]+\]\s*$/i, '').trim()
        // Also remove markdown-style links like ([text](url))
        const finalValue = cleanValue.replace(/\s*\(\[.*?\]\(https?:\/\/[^)]+\)\)\s*$/i, '').trim()
        transformedVendor[key] = finalValue || value
      } else {
        transformedVendor[key] = value
      }
    }
  })

  return transformedVendor
}

// Mock API service to simulate backend calls
export const api = {
  // Search for products/SKUs
  async searchProducts(query) {
    await new Promise(r => setTimeout(r, 300))
    const products = [
      { id: 1, name: 'TSA Plates', casNumber: '—', category: 'Lab Consumables' },
      { id: 2, name: 'Amoxicillin API', casNumber: '26787-78-0', category: 'Antibiotics' },
      { id: 3, name: 'Amoxicillin Trihydrate', casNumber: '61336-70-7', category: 'Antibiotics' },
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
    // First try to fetch from real API for alternate vendors
    try {
      const response = await fetch(`${API_BASE_URL}/alternate-vendors?q=${encodeURIComponent(productQuery)}`)
      if (response.ok) {
        const data = await response.json()
        if (data.found && data.vendors.length > 0) {
          // Transform API vendors to frontend format
          let vendors = data.vendors.map((v, i) => transformApiVendor(v, i))
          
          // Apply frontend filters
          if (filters.source?.length) {
            vendors = vendors.filter(v => filters.source.includes(v.source))
          }
          if (filters.minSuitability) {
            vendors = vendors.filter(v => v.suitabilityScore >= filters.minSuitability)
          }
          if (filters.certifications?.length) {
            vendors = vendors.filter(v => 
              filters.certifications.some(c => v.certifications.includes(c))
            )
          }
          if (filters.priceRange) {
            vendors = vendors.filter(v => 
              v.unitPrice !== null && 
              v.unitPrice >= filters.priceRange[0] && 
              v.unitPrice <= filters.priceRange[1]
            )
          }
          if (filters.currentPartnerOnly) {
            vendors = vendors.filter(v => v.isCurrentPartner)
          }
          if (filters.locations?.length) {
            vendors = vendors.filter(v => filters.locations.includes(v.region))
          }
          
          // Sort by suitability score
          vendors.sort((a, b) => b.suitabilityScore - a.suitabilityScore)
          
          return vendors
        }
      }
    } catch (error) {
      console.log('Backend API not available, using mock data:', error.message)
    }
    
    // Fallback to mock data
    await new Promise(r => setTimeout(r, 500))
    let vendors = [...mockVendors]
    
    // Apply filters
    if (filters.source?.length) {
      vendors = vendors.filter(v => filters.source.includes(v.source))
    }
    if (filters.minSuitability) {
      vendors = vendors.filter(v => v.suitabilityScore >= filters.minSuitability)
    }
    if (filters.certifications?.length) {
      vendors = vendors.filter(v => 
        filters.certifications.some(c => v.certifications.includes(c))
      )
    }
    if (filters.priceRange) {
      vendors = vendors.filter(v => 
        v.unitPrice !== null && 
        v.unitPrice >= filters.priceRange[0] && 
        v.unitPrice <= filters.priceRange[1]
      )
    }
    if (filters.currentPartnerOnly) {
      vendors = vendors.filter(v => v.isCurrentPartner)
    }
    if (filters.locations?.length) {
      vendors = vendors.filter(v => filters.locations.includes(v.region))
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
    // Only consider vendors with numeric unitPrice (mock vendors)
    const vendorsWithPrice = allVendors.filter(v => v.unitPrice !== null)
    const bestValue = vendorsWithPrice.find(v => v.isBestValue) || 
      (vendorsWithPrice.length > 0 ? vendorsWithPrice.reduce((best, v) => v.unitPrice < best.unitPrice ? v : best, vendorsWithPrice[0]) : null)
    
    // Find the current partner with highest spend
    const currentPartners = allVendors.filter(v => v.isCurrentPartner && v.unitPrice !== null)
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
      recommendation: `Based on current input-cost assumptions, switching to ${bestValue.name} could yield a ${savingsPercent}% savings (approx. $${savings.toLocaleString()})${leadTimeNote}.`,
      highlightVendor: bestValue.name
    }
  },

  // Get dashboard data
  async getDashboard() {
    await new Promise(r => setTimeout(r, 200))
    return dashboardStats
  }
}
