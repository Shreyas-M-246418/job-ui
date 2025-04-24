import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../utils/config';
import '../styles/HirePage.css';
import TransformerService from '../services/transformerService';
import ModelInitializer from './ModelInitializer';

const HirePage = () => {
  const { getToken } = useAuth();
  const [formData, setFormData] = useState({
    companyName: '',
    location: '',
    domain: '',
    customDomain: '',
    skillsRequired: '',
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
  const [isModelInitialized, setIsModelInitialized] = useState(false);

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
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              timeout: 30000
            }
          );
          careerPageContent = response.data.content || '';
        } catch (error) {
          console.error('Error fetching career page:', error);
        }
      }

      // Combine job description with career page content
      const combinedDescription = `
        Job Description:
        ${formData.description}
        
        Career Page Information:
        ${careerPageContent}
      `.trim();

      // Proceed with job analysis with combined content
      const analysisResult = await TransformerService.generateCompanySummary(combinedDescription);
      const spamCheck = await TransformerService.detectSpam(
        combinedDescription,
        formData.companyName,
        formData.salaryRange
      );

      // Use custom domain if provided, otherwise use selected domain
      const finalDomain = formData.customDomain ? formData.customDomain : formData.domain;

      const jobData = {
        ...formData,
        domain: finalDomain,
        companySummary: analysisResult,
        isSpam: spamCheck.isSpam,
        spamExplanation: spamCheck.explanation
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
      alert('Failed to create job. Please try again.');
    } finally {
      setIsSubmitting(false);
      setAiProgress('');
    }
  };

  return (
    <div className="hire-page">
      <ModelInitializer onInitialized={() => setIsModelInitialized(true)} />
      {isModelInitialized && (
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
                  <div className="domain-container">
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
                      <option value="custom">Other (specify)</option>
                    </select>
                    {formData.domain === 'custom' && (
                      <input
                        type="text"
                        name="customDomain"
                        value={formData.customDomain}
                        onChange={handleChange}
                        className="form-input custom-domain-input"
                        placeholder="Enter custom domain"
                      />
                    )}
                  </div>

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
                    name="skillsRequired"
                    value={formData.skillsRequired}
                    onChange={handleChange}
                    placeholder="Skills Required (comma separated)"
                    className="form-input"
                  />
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
      )}
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