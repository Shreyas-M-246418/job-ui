import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/DisplayJobsPage.css';
import JobDetails from './JobDetails';
import { validateAlphaInput } from '../utils/inputValidation';
import ValidatedSearchInput from './ValidatedSearchInput';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DisplayJobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    userType: [],
    domain: [],
    customDomain: '',
    employmentType: [],
    workType: []
  });
  const domains = [
    'Frontend',
    'Backend',
    'Full Stack',
    'DevOps',
    'Mobile',
    'UI/UX',
    'Data Science',
    'Machine Learning'
  ];
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/public/jobs`);
        // Sort jobs by createdAt date in descending order (newest first)
        const sortedJobs = response.data.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setJobs(sortedJobs);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching jobs:', error);
        setError('Failed to load jobs');
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const handleJobClick = (job) => {
    setSelectedJob(job);
    setShowFullScreen(true);
  };

  const handleCloseFullScreen = () => {
    setSelectedJob(null);
    setShowFullScreen(false);
  };

  const handleFilterChange = (e, field) => {
    const value = field === 'search' || field === 'location' || field === 'customDomain'
      ? validateAlphaInput(e.target.value)
      : e.target.value;
    
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUserTypeChange = (e) => {
    setFilters({
      ...filters,
      userType: [e.target.value]
    });
  };

  const handleDomainChange = (e) => {
    const value = e.target.value;
    setFilters(prev => ({
      ...prev,
      domain: e.target.checked 
        ? [...prev.domain, value]
        : prev.domain.filter(item => item !== value)
    }));
  };

  const handleClearFilter = (filterName) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: []
    }));
  };

  const clearFilters = () => {
    // Reset all filter states
    setFilters({
      search: '',
      location: '',
      userType: [],
      domain: [],
      customDomain: '',
      employmentType: [],
      workType: []
    });

    // Reset radio buttons
    const radioInputs = document.querySelectorAll('input[type="radio"]');
    radioInputs.forEach(input => {
      input.checked = false;
    });

    // Reset checkboxes
    const checkboxInputs = document.querySelectorAll('input[type="checkbox"]');
    checkboxInputs.forEach(input => {
      input.checked = false;
    });
  };

  const handleEmploymentTypeChange = (e) => {
    const value = e.target.value;
    setFilters(prev => ({
      ...prev,
      employmentType: e.target.checked 
        ? [...prev.employmentType, value]
        : prev.employmentType.filter(item => item !== value)
    }));
  };

  const handleWorkTypeChange = (e) => {
    const value = e.target.value;
    setFilters(prev => ({
      ...prev,
      workType: e.target.checked 
        ? [...prev.workType, value]
        : prev.workType.filter(item => item !== value)
    }));
  };

  const filteredJobs = jobs.filter(job => {
    // Filter by title/company name/skills
    const searchMatch = !filters.search || 
      job.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      job.companyName?.toLowerCase().includes(filters.search.toLowerCase()) ||
      (job.skillsRequired && job.skillsRequired.toLowerCase().includes(filters.search.toLowerCase()));

    // Filter by location
    const locationMatch = job.location.toLowerCase().includes(filters.location.toLowerCase());

    // Filter by user type
    const userTypeMatch = filters.userType.length === 0 || 
      filters.userType.includes(job.userType?.toLowerCase());

    // Filter by domain
    const domainMatch = filters.domain.length === 0 ||
      filters.domain.includes(job.domain) ||
      (filters.customDomain && job.domain.toLowerCase().includes(filters.customDomain.toLowerCase()));

    // Filter by employment type
    const employmentTypeMatch = filters.employmentType.length === 0 ||
      filters.employmentType.includes(job.employmentType?.toLowerCase());

    // Filter by work type
    const workTypeMatch = filters.workType.length === 0 ||
      filters.workType.includes(job.workType?.toLowerCase());

    // Return true only if all conditions match
    return searchMatch && 
           locationMatch && 
           userTypeMatch && 
           domainMatch && 
           employmentTypeMatch && 
           workTypeMatch;
  });

  if (loading) return (
    <div className="loading">
      <div className="loader"></div>
    </div>
  );
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="page-container">
      <div className="search-filters">
        <div className="search-bar">
          <ValidatedSearchInput
            placeholder="Title, Company, or Skills"
            value={filters.search}
            onChange={(e) => handleFilterChange(e, 'search')}
            pattern="[A-Za-z\s,]+"
            title="Only letters, spaces and commas are allowed"
            allowSlash={false}
          />
          <ValidatedSearchInput
            placeholder="Location"
            value={filters.location}
            onChange={(e) => handleFilterChange(e, 'location')}
            pattern="[A-Za-z\s]+"
            title="Only letters, spaces and slashes are allowed"
          />
          <div className="filter-dropdown">
            <button className={`filter-button ${filters.userType.length > 0 ? 'has-selection' : ''}`}>
              User Type {filters.userType.length > 0 && `(${filters.userType.length})`}
            </button>
            <div className="dropdown-content">
              <label>
                <input
                  type="radio"
                  name="userType"
                  value="fresher"
                  checked={filters.userType.includes('fresher')}
                  onChange={(e) => handleUserTypeChange(e)}
                />
                Fresher
              </label>
              <label>
                <input
                  type="radio"
                  name="userType"
                  value="professional"
                  checked={filters.userType.includes('professional')}
                  onChange={(e) => handleUserTypeChange(e)}
                />
                Professional
              </label>
              <label>
                <input
                  type="radio"
                  name="userType"
                  value="student"
                  checked={filters.userType.includes('student')}
                  onChange={(e) => handleUserTypeChange(e)}
                />
                College Student
              </label>
              <button className="clear-filter" onClick={() => handleClearFilter('userType')}>
                Clear
              </button>
            </div>
          </div>
          <div className="filter-dropdown">
            <button className={`filter-button ${filters.domain.length > 0 || filters.customDomain ? 'has-selection' : ''}`}>
              Domain {filters.domain.length > 0 && `(${filters.domain.length})`}
            </button>
            <div className="dropdown-content">
              {domains.map(domain => (
                <label key={domain}>
                  <input
                    type="checkbox"
                    value={domain}
                    checked={filters.domain.includes(domain)}
                    onChange={(e) => handleDomainChange(e)}
                  />
                  {domain}
                </label>
              ))}
              <div className="custom-domain-input">
                <input
                  type="text"
                  placeholder="Custom domain"
                  value={filters.customDomain}
                  onChange={(e) => handleFilterChange(e, 'customDomain')}
                />
              </div>
              <button className="clear-filter" onClick={() => {
                handleClearFilter('domain');
                setFilters(prev => ({...prev, customDomain: ''}));
              }}>
                Clear
              </button>
            </div>
          </div>
          <button onClick={clearFilters} className="clear-all-btn">
            clear all
          </button>
        </div>
      </div>
      
      <div className="main-content">
        <div className="filters-sidebar">
          <div className="filter-section">
            <h3>Employment Type</h3>
            {['Full time', 'Internship', 'Part time'].map(type => (
              <label 
                key={type} 
                className="employment-type-label"
                data-type={type.toLowerCase()}
              >
                <input
                  type="checkbox"
                  className="employment-type-checkbox"
                  data-type={type.toLowerCase()}
                  value={type.toLowerCase()}
                  checked={filters.employmentType.includes(type.toLowerCase())}
                  onChange={(e) => handleEmploymentTypeChange(e)}
                />
                {type}
              </label>
            ))}
          </div>
          <div className="filter-section">
            <h3>Work Type</h3>
            {['On site', 'Remote', 'Hybrid', 'Field Work'].map(type => (
              <label key={type}>
                <input
                  type="checkbox"
                  value={type.toLowerCase()}
                  checked={filters.workType.includes(type.toLowerCase())}
                  onChange={(e) => handleWorkTypeChange(e)}
                />
                {type}
              </label>
            ))}
          </div>
          <div className="filter-section">
            <h3>Resume Tools</h3>
            <button 
              className="resume-builder-button"
              onClick={() => navigate('/resume-builder')}
            >
              Create Resume
            </button>
          </div>
        </div>
        
        <div className="jobs-container">
          <div className="jobs-header">
            <h1>Available Jobs</h1>
            <p className="results-count">
              {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'} found
            </p>
          </div>
          <div className="jobs-grid">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="job-card"
                data-employment-type={job.employmentType?.toLowerCase()}
                onClick={() => handleJobClick(job)}
              >
                <div className="employment-type-badge" data-type={job.employmentType?.toLowerCase()}>
                  {job.employmentType}
                </div>
                <h3>{job.title}</h3>
                <p>{job.description}</p>
                <div className="job-details">
                  {job.location && <span className="location">{job.location}</span>}
                  {job.salary && <span className="salary">{job.salary}</span>}
                </div>
                {job.skillsRequired && (
                  <div className="skills-required">
                    <span className="skills-label">Skills:</span> {job.skillsRequired}
                  </div>
                )}
              </div>
            ))}
          </div>
          {showFullScreen && selectedJob && (
            <JobDetails job={selectedJob} onClose={handleCloseFullScreen} />
          )}
        </div>
      </div>
    </div>
  );
};

export default DisplayJobsPage;
