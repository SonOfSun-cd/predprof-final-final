import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useAuth } from './auth_context.jsx'

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

  return (
    <div>
      <h1>Пользователи</h1>
      <h2>Список пользователей</h2>

      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <table>
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
            {users.length === 0 ? (
              <tr>
                <td colSpan="5">Пользователи не найдены</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id ?? user.login}>
                  <td>{user.name}</td>
                  <td>{user.surname}</td>
                  <td>{user.login}</td>
                  <td>
                    <select
                      value={roleChanges[user.id ?? user.login] ?? user.role ?? 'user'}
                      onChange={(event) => handleRoleChange(user.id ?? user.login, event.target.value)}
                      disabled={currentUser?.login === user.login}
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td>
                    {currentUser?.login === user.login ? (
                      <span>Это Вы!</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRoleSubmit(user)}
                        disabled={updatingUserId === (user.id ?? user.login)}
                      >
                        {updatingUserId === (user.id ?? user.login) ? 'Сохранение...' : 'Сохранить статус'}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      <h2>Создать пользователя</h2>

      <form onSubmit={handleSubmit}>
        <table>
          <thead>
            <tr>
              <th>Имя</th>
              <th>Фамилия</th>
              <th>Логин</th>
              <th>Пароль</th>
              <th>Действие</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </td>
              <td>
                <input
                  id="surname"
                  type="text"
                  value={surname}
                  onChange={(event) => setSurname(event.target.value)}
                  required
                />
              </td>
              <td>
                <input
                  id="login"
                  type="text"
                  value={login}
                  onChange={(event) => setLogin(event.target.value)}
                  required
                />
              </td>
              <td>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </td>
              <td>
                <button type="submit" disabled={submitting}>
                  {submitting ? 'Создание...' : 'Создать пользователя'}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </form>
    </div>
  )
}
