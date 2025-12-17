import { useState } from 'react'
import Login from './components/Login'
import LandingPage from './components/LandingPage'
import InvoiceB2B from './components/InvoiceB2B'
import './index.css'

function App() {
  const [currentPage, setCurrentPage] = useState('login') // 'login' | 'landing' | 'invoice-b2b'
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleLogin = () => {
    setIsAuthenticated(true)
    setCurrentPage('landing')
  }

  const handleToolSelection = (tool) => {
    setCurrentPage(tool)
  }

  const handleBackToLanding = () => {
    setCurrentPage('landing')
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <>
      {currentPage === 'landing' && (
        <LandingPage onSelectTool={handleToolSelection} />
      )}
      {currentPage === 'invoice-b2b' && (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <div className="no-print" style={{ padding: '10px 20px', background: '#333', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Invoice B2B Tool</span>
            <button onClick={handleBackToLanding} style={{ background: 'transparent', border: '1px solid white', color: 'white', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
              Back to Dashboard
            </button>
          </div>
          <InvoiceB2B />
        </div>
      )}
    </>
  )
}

export default App
