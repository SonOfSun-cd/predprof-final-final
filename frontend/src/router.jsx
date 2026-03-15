import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Index from './pages/index.jsx'
import TopBar from './components/TopBar.jsx'
import { AuthProvider } from './pages/auth/auth_context.jsx'
import Login from './pages/auth/login.jsx'
import Users from './pages/auth/users.jsx'

function Router() {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: false }}>
      <AuthProvider>
        <Routes>
          <Route path="/*" element={<TopBar/>}>
            <Route path="" element={<Index/>}/>
            <Route path="auth/users" element={<Users/>}/>
          </Route>
          <Route path="/auth/login" element={<Login/>}/>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default Router
