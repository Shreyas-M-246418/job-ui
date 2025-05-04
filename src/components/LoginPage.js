import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../utils/config';
import { useAuth } from '../contexts/AuthContext';
import '../styles/LoginPage.css';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [githubAuthUrl, setGithubAuthUrl] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();

  useEffect(() => {
    // Check if user is already logged in
    if (user) {
      navigate('/');
      return;
    }

    // Get GitHub auth URL
    const fetchAuthUrl = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/auth/github`);
        setGithubAuthUrl(response.data.url);
      } catch (error) {
        console.error('Error fetching auth URL:', error);
        setError('Failed to initialize authentication. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAuthUrl();
  }, [navigate, user]);

  // Handle GitHub callback
  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get('code');
      
      if (code) {
        try {
          setLoading(true);
          setError('');
          
          const response = await axios.post(`${API_BASE_URL}/auth/github/callback`, { code });
          
          if (response.data.token && response.data.user) {
            await login(response.data.user, response.data.token);
            
            // Redirect to the page they were trying to access or home
            const redirectTo = urlParams.get('redirect') || '/';
            navigate(redirectTo);
          } else {
            setError('Authentication failed. Please try again.');
          }
        } catch (error) {
          console.error('Login error:', error);
          setError('Authentication failed. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    };

    handleCallback();
  }, [location, login, navigate]);

  const handleGitHubLogin = () => {
    if (githubAuthUrl) {
      window.location.href = githubAuthUrl;
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Welcome to Job UI</h1>
        <p>Please log in to continue</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <button 
          className="github-login-button" 
          onClick={handleGitHubLogin}
          disabled={loading || !githubAuthUrl}
        >
          {loading ? 'Loading...' : 'Login with GitHub'}
        </button>
      </div>
    </div>
  );
};

export default LoginPage; 