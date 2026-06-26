import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SiteProvider } from './context/SiteContext'
import ProtectedRoute from './components/ProtectedRoute'
import AttendanceGate from './components/AttendanceGate'
import DashboardLayout from './layouts/DashboardLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import EmployeeManagement from './pages/EmployeeManagement'
import EmployeeProfile from './pages/EmployeeProfile'
import SiteManagement from './pages/SiteManagement'
import SiteDetails from './pages/SiteDetails'
import SubmitDPR from './pages/SubmitDPR'
import Attendance from './pages/Attendance'
import EmployeeAttendanceLogs from './pages/EmployeeAttendanceLogs'
import LabourManagement from './pages/LabourManagement'
import InventoryManagement from './pages/InventoryManagement'
import SalaryManagement from './pages/SalaryManagement'
import EquipmentManagement from './pages/EquipmentManagement'
import ExpenseManagement from './pages/ExpenseManagement'
import ErrorBoundary from './components/ErrorBoundary'
import LeaveManagement from './pages/LeaveManagement'
import Reports from './pages/Reports'

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <AuthProvider>
        <SiteProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              } 
            >
              {/* Routes accessible without attendance */}
              <Route path="attendance" element={<Attendance />} />
              <Route path="my-profile" element={<EmployeeProfile isSelf={true} />} />
              <Route path="leave-requests" element={<LeaveManagement />} />

              {/* Attendance-gated routes */}
              <Route element={<AttendanceGate />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="employees" element={<EmployeeManagement />} />
                <Route path="employees/:id" element={<EmployeeProfile />} />
                <Route path="sites" element={<SiteManagement />} />
                <Route path="sites/:siteId" element={<SiteDetails />} />
                <Route path="sites/:siteId/dpr/new" element={<SubmitDPR />} />
                <Route path="attendance-logs" element={<EmployeeAttendanceLogs />} />
                <Route path="labour" element={<LabourManagement />} />
                <Route path="inventory" element={<InventoryManagement />} />
                <Route path="equipment" element={<EquipmentManagement />} />
                <Route path="expenses" element={<ExpenseManagement />} />
                <Route path="financials" element={<SalaryManagement />} />
                <Route path="reports" element={<Reports />} />
              </Route>
              
              <Route path="" element={<Navigate to="dashboard" replace />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </SiteProvider>
      </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App
