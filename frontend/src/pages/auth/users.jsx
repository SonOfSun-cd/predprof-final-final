import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useAuth } from './auth_context.jsx'
import '../../styles.css'

export default function Users() {
  const { token, user: currentUser, loading: authLoading } = useAuth()
  const [users, setUsers] = useState([])
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [roleChanges, setRoleChanges] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [updatingUserId, setUpdatingUserId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!error && !success) return

    const timer = setTimeout(() => {
      setError('')
      setSuccess('')
    }, 5000)

    return () => clearTimeout(timer)
  }, [error, success])

  const loadUsers = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await axios.get('/api/auth/list_users')
      setUsers(response.data)
      setRoleChanges(
        Object.fromEntries(
          response.data.map((user) => [user.id ?? user.login, user.role ?? 'user'])
        )
      )
    } catch (err) {
      console.log(err)
      setError('Не удалось загрузить список пользователей')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (!token) {
      setLoading(false)
      setUsers([])
      setError('Пользователь не авторизован')
      return
    }

    loadUsers()
  }, [authLoading, token])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await axios.post('/api/auth/create_user', {
        name: name,
        surname: surname,
        login: login,
        password: password
      })
      setSuccess(response.data?.message || 'Пользователь успешно создан')
      setName('')
      setSurname('')
      setLogin('')
      setPassword('')
      await loadUsers()
    } catch (err) {
      console.log(err)
      setError('Не удалось создать пользователя')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRoleChange = (userKey, role) => {
    setRoleChanges((prev) => ({
      ...prev,
      [userKey]: role,
    }))
  }

  const handleRoleSubmit = async (user) => {
    const userKey = user.id ?? user.login
    const nextRole = roleChanges[userKey] ?? user.role ?? 'user'

    setUpdatingUserId(userKey)
    setError('')
    setSuccess('')

    try {
      await axios.post('/api/auth/change_role', {
        user_id: user.id,
        login: user.login,
        role: nextRole,
      })
      setUsers((prev) =>
        prev.map((item) =>
          (item.id ?? item.login) === userKey ? { ...item, role: nextRole } : item
        )
      )
      setSuccess('Статус пользователя обновлен')
    } catch (err) {
      console.log(err)
      setError('Не удалось обновить статус пользователя')
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleDeleteUser = (user) => {
  }

  return (
    <div className="app-container">
      <div className="users-container">
        <h1 className="page-title">Пользователи</h1>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="create-section">
          <h2 className="section-title">Создать пользователя</h2>
          
          <form onSubmit={handleSubmit} className="create-form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Имя</label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Фамилия</label>
                <input
                  type="text"
                  value={surname}
                  onChange={(event) => setSurname(event.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Логин</label>
                <input
                  type="text"
                  value={login}
                  onChange={(event) => setLogin(event.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Пароль</label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>
            <div className="form-button-group">
              <button
                type="submit"
                disabled={submitting}
                className="form-button full-width"
              >
                {submitting ? 'Создание...' : 'Создать пользователя'}
              </button>
            </div>
          </form>
        </div>

        <div className="users-section">
          <h2 className="section-title">Список пользователей</h2>
          
          {loading ? (
            <div className="loading">Загрузка...</div>
          ) : users.length === 0 ? (
            <div className="empty-state">Пользователи не найдены</div>
          ) : (
            <div className="table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Имя</th>
                    <th>Фамилия</th>
                    <th>Логин</th>
                    <th>Статус</th>
                    <th>Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const userKey = user.id ?? user.login
                    return (
                      <tr key={userKey}>
                        <td>{user.name || '-'}</td>
                        <td>{user.surname || '-'}</td>
                        <td>{user.login}</td>
                        <td>
                          <select
                            value={roleChanges[userKey] ?? user.role ?? 'user'}
                            onChange={(event) => handleRoleChange(userKey, event.target.value)}
                            disabled={currentUser?.login === user.login}
                            className="role-select"
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                        <td className="action-cell">
                          {currentUser?.login === user.login ? (
                            <span className="current-user">Это Вы!</span>
                          ) : (
                            <div className="action-buttons">
                              <button
                                type="button"
                                onClick={() => handleRoleSubmit(user)}
                                disabled={updatingUserId === userKey}
                                className="table-button"
                              >
                                {updatingUserId === userKey ? 'Сохранение...' : 'Сохранить'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(user)}
                                disabled={updatingUserId === userKey}
                                className="table-button delete-btn"
                              >
                                Удалить
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
