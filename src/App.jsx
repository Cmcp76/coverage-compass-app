import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import { PolicyProvider } from './context/PolicyContext.jsx'
import Landing from './pages/Landing.jsx'
import SignUp from './pages/SignUp.jsx'
import Login from './pages/Login.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import VerifyEmail from './pages/VerifyEmail.jsx'
import Welcome from './pages/Welcome.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Upload from './pages/Upload.jsx'
import AIReview from './pages/AIReview.jsx'
import CoverageScore from './pages/CoverageScore.jsx'
import GapReport from './pages/GapReport.jsx'
import Report from './pages/Report.jsx'
import Reports from './pages/Reports.jsx'
import Notifications from './pages/Notifications.jsx'
import LearningCenter from './pages/LearningCenter.jsx'
import Tools from './pages/Tools.jsx'

export default function App() {
  return (
    <PolicyProvider>
      <Layout>
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
        </Routes>
      </Layout>
    </PolicyProvider>
  )
}
