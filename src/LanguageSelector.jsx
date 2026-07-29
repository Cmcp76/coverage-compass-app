// src/App.example.jsx
//
// REFERENCE ONLY — merge this routing pattern into your existing App.jsx.
// Every existing route moves one level deeper, under a /:lang segment
// handled by <LocaleLayout />. Screen components themselves don't change.

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LocaleLayout from './components/LocaleLayout';
import { DEFAULT_LANGUAGE } from './i18n/languages';

// Your existing page components — unchanged imports
import LandingPage from './pages/LandingPage';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import PasswordReset from './pages/PasswordReset';
import Dashboard from './pages/Dashboard';
import UploadPolicy from './pages/UploadPolicy';
import CoverageScore from './pages/CoverageScore';
import GapReport from './pages/GapReport';
import ProfessionalReport from './pages/ProfessionalReport';
import LearningCenter from './pages/LearningCenter';
import Tools from './pages/Tools';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root redirects to the detected/saved language — i18next's
            LanguageDetector already resolved i18n.language by the time this
            renders (see src/i18n/index.js), so this just reads it. */}
        <Route path="/" element={<Navigate to={`/${DEFAULT_LANGUAGE}`} replace />} />

        <Route path="/:lang" element={<LocaleLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="signup" element={<SignUp />} />
          <Route path="login" element={<Login />} />
          <Route path="password-reset" element={<PasswordReset />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="upload" element={<UploadPolicy />} />
          <Route path="score" element={<CoverageScore />} />
          <Route path="gap-report" element={<GapReport />} />
          <Route path="report" element={<ProfessionalReport />} />
          <Route path="learn/*" element={<LearningCenter />} />
          <Route path="tools/*" element={<Tools />} />
        </Route>

        {/* Anything unmatched — send to default-language home */}
        <Route path="*" element={<Navigate to={`/${DEFAULT_LANGUAGE}`} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
