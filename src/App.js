import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import DisplayJobsPage from './components/DisplayJobsPage';
import JobsPage from './components/JobsPage';
import LoginSignupPage from './components/LoginSignupPage';
import Logout from './components/Logout';
import GitHubCallback from './components/GitHubCallback';
import HirePage from './components/HirePage';
import ResumeBuilderPage from './components/ResumeBuilderPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';
import axios from 'axios';
import { API_BASE_URL } from './utils/config';

const AuthenticatedNav = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleDirectLogin = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/github`);
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Error initiating GitHub login:', error);
    }
  };

  return (
    <nav className="top-navbar">
      <div className="nav-left">
        <a href="/display-jobs" className="nav-brand">
          <img src="/jobhub-logo.jpg" alt="JobHub" className="nav-logo" />
        </a>
      </div>
      <div className="nav-right">
        {!user ? (
          <button onClick={handleDirectLogin} className="login-button">
            <svg className="nav-github-icon" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            Login
          </button>
        ) : (
          <a href="/logout" className="login-button">
            Logout
          </a>
        )}
      </div>
    </nav>
  );
};

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? children : <Navigate to="/login-signup" />;
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="app-container">
          <AuthenticatedNav />
          <Routes>
            <Route path="/" element={<Navigate to="/display-jobs" />} />
            <Route path="/display-jobs" element={<DisplayJobsPage />} />
            <Route
              path="/jobs"
              element={
                <PrivateRoute>
                  <JobsPage />
                </PrivateRoute>
              }
            />
            <Route path="/logout" element={<Logout />} />
            <Route path="/auth/github/callback" element={<GitHubCallback />} />
            <Route
              path="/hire"
              element={
                <PrivateRoute>
                  <HirePage />
                </PrivateRoute>
              }
            />
            <Route
              path="/resume-builder"
              element={<ResumeBuilderPage />}
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
