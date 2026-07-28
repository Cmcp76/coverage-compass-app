import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import { PolicyProvider } from './context/PolicyContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'

const Landing = lazy(() => import('./pages/Landing.jsx'))
const SignUp = lazy(() => import('./pages/SignUp.jsx'))
const Login = lazy(() => import('./pages/Login.jsx'))
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'))
const VerifyEmail = lazy(() => import('./pages/VerifyEmail.jsx'))
const Welcome = lazy(() => import('./pages/Welcome.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const Upload = lazy(() => import('./pages/Upload.jsx'))
const AIReview = lazy(() => import('./pages/AIReview.jsx'))
const CoverageScore = lazy(() => import('./pages/CoverageScore.jsx'))
const GapReport = lazy(() => import('./pages/GapReport.jsx'))
const Report = lazy(() => import('./pages/Report.jsx'))
const Reports = lazy(() => import('./pages/Reports.jsx'))
const Notifications = lazy(() => import('./pages/Notifications.jsx'))
const LearningCenter = lazy(() => import('./pages/LearningCenter.jsx'))
const Tools = lazy(() => import('./pages/Tools.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-compass-line border-t-compass-blue" />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <PolicyProvider>
        <Layout>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/ai-review" element={<AIReview />} />
              <Route path="/score" element={<CoverageScore />} />
              <Route path="/gap-report" element={<GapReport />} />
              <Route path="/report" element={<Report />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/learning-center" element={<LearningCenter />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Layout>
      </PolicyProvider>
    </ThemeProvider>
  )
}
