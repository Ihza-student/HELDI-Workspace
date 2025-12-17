import { useState } from 'react'

function LandingPage({ onSelectTool }) {
    const [theme, setTheme] = useState('dark') // 'dark' | 'light'

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark')
    }

    return (
        <div className={`landing-container theme-${theme}`}>
            <div className="landing-header">
                <h1>Personal Tools</h1>
                <button onClick={toggleTheme} className="btn-theme-toggle">
                    {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
                </button>
            </div>

            <div className="tools-grid">
                <button className="tool-card" onClick={() => onSelectTool('invoice-b2b')}>
                    <span className="tool-icon">📄</span>
                    <span className="tool-name">Invoice B2B</span>
                </button>
                {/* Placeholder for future tools */}
                {/* <div className="tool-card disabled">
            <span className="tool-icon">🔜</span>
            <span className="tool-name">Coming Soon</span>
        </div> */}
            </div>

            <div className="landing-footer">
                <p>© 2025 Heldi Personal Tools</p>
            </div>
        </div>
    )
}

export default LandingPage
