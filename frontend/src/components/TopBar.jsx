import React from 'react'
import { Outlet, Link } from 'react-router-dom'
import { useAuth } from '../pages/auth/auth_context.jsx'

export default function TopBar() {
    const { user, loading } = useAuth()

    return ( 
        <>
            <div className="TopBar">
                <h1>
                    <Link to="/">Голосовой Патруль Альфа-Центавра</Link>
                </h1>
                <div>
                    {!loading && !user && (
                        <Link to="/auth/login">
                            <button type="button">Войти</button>
                        </Link>
                    )}

                    {!loading && user && (
                        <>
                            <span>{user.name}</span>
                            {user.role === 'admin' && (
                                <Link to="/auth/users">
                                    <button type="button">Пользователи</button>
                                </Link>
                            )}
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
