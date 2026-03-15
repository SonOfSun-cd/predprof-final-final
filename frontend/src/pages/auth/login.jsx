import React, { useState } from 'react'
import { useAuth } from './auth_context.jsx'
import { useNavigate, Link } from 'react-router-dom'

export default function Login() {
  const [Login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    try {
      await login(Login, password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка входа')
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">Вход</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Логин</label>
            <input
              type="text"
              placeholder="Введите логин"
              value={Login}
              onChange={(e) => setLogin(e.target.value)}
              required
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Пароль</label>
            <input
              type="password"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
            />
          </div>
          
          <button type="submit" className="form-button">
            Войти
          </button>
        </form>
      </div>
    </div>
  )
}
