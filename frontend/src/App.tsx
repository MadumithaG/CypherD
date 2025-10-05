import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import CreateWallet from './components/CreateWallet'
import Dashboard from './components/Dashboard'
import Login from './components/Login'
import Register from './components/Register'
import Header from './components/Header'

function ProtectedShell() {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return (
    <>
      <Header />
      <div className="pt-4">
        <Outlet />
      </div>
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* All authenticated routes get the Ledgerly header */}
      <Route element={<ProtectedShell />}>
        <Route path="/setup" element={<CreateWallet />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
    </Routes>
  )
}
