import React from 'react'
import { Outlet, Link } from 'react-router-dom'
import { useAuth } from '../pages/auth/auth_context.jsx'

export default function TopBar() {
    const { user, loading } = useAuth()

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/auth/login'
    }

    return ( 
        <>
            <div className="TopBar">
                <h1>
                    <Link to="/">Голосовой Патруль Альфа-Центавра</Link>
                </h1>
                <div className="topbar-actions">
                    {!loading && !user && (
                        <Link to="/auth/login">
                            <button type="button" className="topbar-btn">Войти</button>
                        </Link>
                    )}

                    {!loading && user && (
                        <>
                            <span className="topbar-user">{user.name}</span>
                            {user.role === 'admin' && (
                                <Link to="/auth/users">
                                    <button type="button" className="topbar-btn">Пользователи</button>
                                </Link>
                            )}
                            <button type="button" className="topbar-btn logout-btn" onClick={handleLogout}>
                                Выйти
                            </button>
                        </>
                    )}
                </div>
            </div>
            <div className="otherdata">
                <Outlet/>
            </div>
        </>
    )
}
