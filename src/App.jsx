import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import LocaleLayout from './components/LocaleLayout.jsx'
import { PolicyProvider } from './context/PolicyContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { DEFAULT_LANGUAGE } from './i18n/languages.js'

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
const Challenge = lazy(() => import('./pages/Challenge.jsx'))
const TruckingStartup = lazy(() => import('./pages/TruckingStartup.jsx'))
const About = lazy(() => import('./pages/About.jsx'))
const Privacy = lazy(() => import('./pages/Privacy.jsx'))
const Terms = lazy(() => import('./pages/Terms.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-compass-line border-t-compass-blue" />
    </div>
  )
}

export default function App() {
  const location = useLocation()

  return (
    <ThemeProvider>
      <PolicyProvider>
        <Layout>
          {/* Keyed by pathname so navigating away from a page that crashed
              (or hitting "Go to Dashboard" from the fallback itself) remounts
              the boundary with a clean slate instead of staying stuck. */}
          <ErrorBoundary key={location.pathname}>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                {/* Bare root has no language segment yet — send it to the
                    default language. LocaleLayout below is what actually
                    resolves/persists the language for every real route. */}
                <Route path="/" element={<Navigate to={`/${DEFAULT_LANGUAGE}`} replace />} />
                <Route path="/:lang" element={<LocaleLayout />}>
                  <Route index element={<Landing />} />
                  <Route path="signup" element={<SignUp />} />
                  <Route path="login" element={<Login />} />
                  <Route path="reset-password" element={<ResetPassword />} />
                  <Route path="verify-email" element={<VerifyEmail />} />
                  <Route path="welcome" element={<Welcome />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="upload" element={<Upload />} />
                  <Route path="ai-review" element={<AIReview />} />
                  <Route path="score" element={<CoverageScore />} />
                  <Route path="gap-report" element={<GapReport />} />
                  <Route path="report" element={<Report />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="learning-center" element={<LearningCenter />} />
                  <Route path="tools" element={<Tools />} />
                  <Route path="challenge" element={<Challenge />} />
                  <Route path="trucking-startup" element={<TruckingStartup />} />
                  <Route path="about" element={<About />} />
                  <Route path="privacy" element={<Privacy />} />
                  <Route path="terms" element={<Terms />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </Layout>
      </PolicyProvider>
    </ThemeProvider>
  )
}
