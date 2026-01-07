import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Results from './pages/Results'
import Compare from './pages/Compare'
import VendorDetail from './pages/VendorDetail'
import VendorTracker from './pages/VendorTracker'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/results" element={<Results />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/vendor/:id" element={<VendorDetail />} />
        <Route path="/tracker" element={<VendorTracker />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
