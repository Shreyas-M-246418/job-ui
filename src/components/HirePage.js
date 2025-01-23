import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../utils/config';
import '../styles/HirePage.css';
import { webLlmService } from '../services/webLlmService';
import WebLLMInitializer from '../components/WebLLMInitializer';

const HirePage = () => {
  const { getToken } = useAuth();
  const [formData, setFormData] = useState({
    companyName: '',
    location: '',
    domain: '',
    workType: '',
    employmentType: '',
    userType: '',
    title: '',
    description: '',
    salaryRange: '',
    applyLink: '',
    careerLink: '',
  });

  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiProgress, setAiProgress] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setAiProgress('Analyzing job details...');

      // Get career page content through proxy if URL is provided
      let careerPageContent = '';
      if (formData.careerLink) {
        try {
          const token = getToken();
          const response = await axios.get(
            `${API_BASE_URL}/api/proxy-career-page?url=${encodeURIComponent(formData.careerLink)}`,
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );
          careerPageContent = response.data.content;
        } catch (error) {
          console.error('Error fetching career page:', error);
          // Continue with job creation even if career page fetch fails
        }
      }

      // Analyze job with combined description and career page content
      const analysisResult = await analyzeJob({
        ...formData,
        description: `${formData.description}\n\n${careerPageContent}`.trim()
      });

      const jobData = {
        ...formData,
        companySummary: analysisResult.companySummary,
        isSpam: analysisResult.isSpam
      };

      const token = getToken();
      await axios.post(`${API_BASE_URL}/api/jobs`, jobData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      navigate('/jobs');
    } catch (error) {
      console.error('Error creating job:', error);
      // Handle error appropriately
    } finally {
      setIsSubmitting(false);
      setAiProgress('');
    }
  };

  const analyzeJob = async (jobData) => {
    try {
      setIsAnalyzing(true);
      setAiProgress('Analyzing job posting...'); // Optional: Add progress indicator
      
      // Get company summary using Web LLM
      const summary = await webLlmService.generateCompanySummary(jobData.description);
      setAiProgress('Checking for spam...'); // Optional: Update progress
      
      // Check for spam using Web LLM
      const spamCheck = await webLlmService.detectSpam(
        jobData.description,
        jobData.companyName,
        jobData.salary
      );
      
      return {
        companySummary: summary,
        isSpam: spamCheck.isSpam,
        spamExplanation: spamCheck.explanation
      };
    } catch (error) {
      console.error('Error analyzing job:', error);
      throw error;
    } finally {
      setIsAnalyzing(false);
      setAiProgress(''); // Optional: Clear progress indicator
    }
  };

  return (
    <div className="hire-page">
      <WebLLMInitializer />
      <div className="hire-card">
        <div className="hire-card-header">
          <h2>Creating New Job</h2>
          <button className="close-button" onClick={() => navigate('/jobs')}>
            ×
          </button>
        </div>
        
        <div className="hire-card-content">
          <div className="form-grid">
            {/* Left Column */}
            <div className="form-column">
              <div className="form-group">
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Company Name"
                />
              </div>

              <div className="form-group">
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Location"
                />
              </div>

              <div className="form-group split">
                <select
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  className="form-select"
                >
                  
                  <option value="">Domain</option>
                  <option value="Frontend">Frontend</option>
                  <option value="Backend">Backend</option>
                  <option value="Full Stack">Full Stack</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Mobile">Mobile</option>
                  <option value="UI/UX">UI/UX</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Machine Learning">Machine Learning</option>
                </select>

                <select
                  name="workType"
                  value={formData.workType}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">Work Type</option>
                  <option value="remote">Remote</option>
                  <option value="on site">Onsite</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <div className="form-group">
                <select
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">Employment Type</option>
                  <option value="full time">Full Time</option>
                  <option value="part time">Part Time</option>
                  <option value="internship">Internship</option>
                </select>
              </div>

              <div className="form-group">
                <select
                  name="userType"
                  value={formData.userType}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">User Type</option>
                  <option value="student">Student</option>
                  <option value="professional">Professional</option>
                  <option value="fresher">Fresher</option>
                </select>
                <span className="helper-text">
                  Choose the user type to find the most suitable candidates
                </span>
              </div>

              <div className="form-group">
                <input
                  type="text"
                  name="applyLink"
                  value={formData.applyLink}
                  onChange={handleChange}
                  placeholder="Enter Apply link"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <input
                  type="url"
                  name="careerLink"
                  value={formData.careerLink}
                  onChange={handleChange}
                  placeholder="Enter Company's Career/About Page URL"
                  className="form-input"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="form-column">
              <div className="form-group">
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter Job Title"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter Job Description"
                  className="form-textarea"
                />
                <span className="helper-text right">500-1000 words</span>
              </div>

              <div className="form-group">
                <input
                  type="text"
                  name="salaryRange"
                  value={formData.salaryRange}
                  onChange={handleChange}
                  placeholder="Enter expected Salary Range"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <button onClick={handleSubmit} className="create-button">
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {(isSubmitting || isAnalyzing) && ( 
        <div className="loading">
          <div className="loader"></div>
          <p className="ai-progress">{aiProgress}</p>
        </div>
      )}
    </div>
  );
};

export default HirePage;