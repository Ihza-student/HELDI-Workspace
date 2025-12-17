import { useState } from 'react'
import '../index.css' // We will add styles here

function Login({ onLogin }) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)

    const handleSubmit = (e) => {
        e.preventDefault()
        if (username === 'heldi' && password === 'Akupercaya1x') {
            onLogin()
        } else {
            setError('Invalid Username or Password')
        }
    }

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>Personal Tools Login</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn-primary">Login</button>
                </form>
            </div>
        </div>
    )
}

export default Login
