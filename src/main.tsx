import React from 'react'
import ReactDOM from 'react-dom/client'
<<<<<<< HEAD
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import {
  OnboardingLayout,
  DashboardLayout,
  VideoLayout,
  ReportLayout,
  AccountLayout,
} from './App'
import { ProtectedRoute } from './components/ProtectedRoute'
=======
import App from './App'
>>>>>>> origin/develop

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<OnboardingLayout />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />} />
            <Route path="/video/:videoId" element={<VideoLayout />} />
            <Route path="/report/:videoId" element={<ReportLayout />} />
            <Route path="/account" element={<AccountLayout />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
)

