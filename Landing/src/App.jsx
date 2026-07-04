import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import StudentApp from './pages/StudentApp';
import StaffApp from './pages/StaffApp';
import AdminPortal from './pages/AdminPortal';
import TeamNexus from './pages/TeamNexus';
import ScrollToTop from './components/ScrollToTop';
import TeamNexusBadge from './components/TeamNexusBadge';
import HomeButton from './components/HomeButton';
import Navigation from './components/Navigation';

function AppContent() {
  const location = useLocation();
  
  return (
    <>
      <ScrollToTop />
      <TeamNexusBadge />
      <HomeButton />
      <Routes key={location.pathname}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/student" element={<StudentApp />} />
        <Route path="/staff" element={<StaffApp />} />
        <Route path="/admin" element={<AdminPortal />} />
        <Route path="/team" element={<TeamNexus />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
