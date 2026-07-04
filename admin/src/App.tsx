
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MainLayout } from './components/layout/MainLayout'

// Instant Static Loading (Better for SPAs where tab switching needs to be 0ms snappy)
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Grievances from './pages/Grievances'
import GrievanceDetails from './pages/GrievanceDetails'
import Reports from './pages/Reports'
import StaffManagement from './pages/StaffManagement'
import AdminManagement from './pages/AdminManagement'
import DepartmentManagement from './pages/DepartmentManagement'
import EscalationManagement from './pages/EscalationManagement'
import AnnouncementManagement from './pages/AnnouncementManagement'
import Feedback from './pages/Feedback'
import SupportManagement from './pages/SupportManagement'
import ManageTips from './pages/ManageTips'
import CategoryManagement from './pages/CategoryManagement'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import DeviceRestriction from './components/auth/DeviceRestriction'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AppLoader from './components/ui/AppLoader'
import ErrorBoundary from './components/ui/ErrorBoundary'

function App() {
  const [loading, setLoading] = useState(() => {
    // If they already saw the splash screen in this browser session, skip the long loader
    return !sessionStorage.getItem('hasSeenSplash')
  })

  useEffect(() => {
    if (!loading) return

    // Simulate initial load time, shortened for better UX
    const timer = setTimeout(() => {
      setLoading(false)
      sessionStorage.setItem('hasSeenSplash', 'true')
    }, 2800) // Reduced from 3600 to 2800ms

    return () => clearTimeout(timer)
  }, [loading])

  return (
    <ErrorBoundary>
      <DeviceRestriction>
        <ToastProvider>
          <AuthProvider>
            {/* The AppLoader overlay sits on top while the background initializes and loads concurrently */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  key="app-loader"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="fixed inset-0 z-[200]"
                >
                  <AppLoader />
                </motion.div>
              )}
            </AnimatePresence>

            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />

                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<MainLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="grievances" element={<Grievances />} />
                    <Route path="grievances/:id" element={<GrievanceDetails />} />
                    <Route path="reports" element={<Reports />} />

                    <Route path="management" element={<Navigate to="/management/staff" replace />} />
                    <Route path="management/staff" element={<StaffManagement />} />
                    <Route path="management/admin" element={<AdminManagement />} />
                    <Route path="management/departments" element={<DepartmentManagement />} />
                    <Route path="management/escalation" element={<EscalationManagement />} />
                    <Route path="management/announcements" element={<AnnouncementManagement />} />
                    <Route path="management/support" element={<SupportManagement />} />
                    <Route path="management/categories" element={<CategoryManagement />} />
                    <Route path="management/tips" element={<ManageTips />} />
                    <Route path="feedback" element={<Feedback />} />
                  </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          </AuthProvider>
        </ToastProvider>
      </DeviceRestriction>
    </ErrorBoundary>
  )
}

export default App
