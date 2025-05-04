import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ResumeBuilderPage.css';
import axios from 'axios';
import { API_BASE_URL } from '../utils/config';

const ResumeBuilderPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resumeContent, setResumeContent] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
    education: [{ school: '', degree: '', field: '', graduationYear: '' }],
    experience: [{ company: '', position: '', startDate: '', endDate: '', description: '' }],
    skills: '',
    projects: '',
    certifications: '',
    languages: '',
    interests: ''
  });

  const handleChange = (e, index = null, field = null) => {
    const { name, value } = e.target;
    
    if (index !== null && field) {
      const updatedArray = [...formData[field]];
      updatedArray[index] = { ...updatedArray[index], [name]: value };
      setFormData({ ...formData, [field]: updatedArray });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const addItem = (field) => {
    const newItem = {};
    
    if (field === 'education') {
      newItem.school = '';
      newItem.degree = '';
      newItem.field = '';
      newItem.graduationYear = '';
    } else if (field === 'experience') {
      newItem.company = '';
      newItem.position = '';
      newItem.startDate = '';
      newItem.endDate = '';
      newItem.description = '';
    } else if (field === 'projects') {
      newItem.name = '';
      newItem.description = '';
      newItem.technologies = '';
    }
    
    setFormData({
      ...formData,
      [field]: [...formData[field], newItem]
    });
  };

  const removeItem = (field, index) => {
    const updatedArray = [...formData[field]];
    updatedArray.splice(index, 1);
    setFormData({ ...formData, [field]: updatedArray });
  };

  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const generateResume = async () => {
    try {
      setIsGenerating(true);
      setCurrentStep(5); // Move to step 5 to show loading animation
      
      console.log('Sending resume data to server:', formData);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/generate-resume`,
        formData,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      console.log('Server response:', response.data);

      if (response.data && response.data.resume) {
        setResumeContent(response.data.resume);
      } else {
        throw new Error('No resume content received from server');
      }
    } catch (error) {
      console.error('Error generating resume:', error);
      
      let errorMessage = 'Failed to generate resume. Please try again.';
      
      if (error.response) {
        console.error('Server error response:', error.response.data);
        errorMessage = `Server error: ${error.response.data.error || error.response.statusText || 'Unknown error'}`;
      } else if (error.request) {
        console.error('No response received:', error.request);
        errorMessage = 'No response from server. Please check your connection and try again.';
      } else {
        console.error('Request setup error:', error.message);
        errorMessage = `Error: ${error.message}`;
      }
      
      alert(errorMessage);
      setCurrentStep(4); // Go back to step 4 if there's an error
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadResume = (format) => {
    const blob = new Blob([resumeContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${formData.fullName.replace(/\s+/g, '_')}_Resume.${format}`;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="resume-step">
            <h3>Personal Information</h3>
            <div className="form-group">
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Full Name"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone Number"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Location"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <textarea
                name="summary"
                value={formData.summary}
                onChange={handleChange}
                placeholder="Professional Summary"
                className="form-textarea"
                rows="4"
              />
            </div>
            <div className="step-buttons">
              <button onClick={nextStep} className="next-button">Next</button>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="resume-step">
            <h3>Education</h3>
            {formData.education.map((edu, index) => (
              <div key={index} className="form-section">
                <div className="form-group">
                  <input
                    type="text"
                    name="school"
                    value={edu.school}
                    onChange={(e) => handleChange(e, index, 'education')}
                    placeholder="School/University"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    name="degree"
                    value={edu.degree}
                    onChange={(e) => handleChange(e, index, 'education')}
                    placeholder="Degree"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    name="field"
                    value={edu.field}
                    onChange={(e) => handleChange(e, index, 'education')}
                    placeholder="Field of Study"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    name="graduationYear"
                    value={edu.graduationYear}
                    onChange={(e) => handleChange(e, index, 'education')}
                    placeholder="Graduation Year"
                    className="form-input"
                  />
                </div>
                {index > 0 && (
                  <button 
                    onClick={() => removeItem('education', index)} 
                    className="remove-button"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button onClick={() => addItem('education')} className="add-button">
              Add Education
            </button>
            <div className="step-buttons">
              <button onClick={prevStep} className="prev-button">Previous</button>
              <button onClick={nextStep} className="next-button">Next</button>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="resume-step">
            <h3>Experience</h3>
            {formData.experience.map((exp, index) => (
              <div key={index} className="form-section">
                <div className="form-group">
                  <input
                    type="text"
                    name="company"
                    value={exp.company}
                    onChange={(e) => handleChange(e, index, 'experience')}
                    placeholder="Company"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    name="position"
                    value={exp.position}
                    onChange={(e) => handleChange(e, index, 'experience')}
                    placeholder="Position"
                    className="form-input"
                  />
                </div>
                <div className="form-group split">
                  <input
                    type="text"
                    name="startDate"
                    value={exp.startDate}
                    onChange={(e) => handleChange(e, index, 'experience')}
                    placeholder="Start Date"
                    className="form-input"
                  />
                  <input
                    type="text"
                    name="endDate"
                    value={exp.endDate}
                    onChange={(e) => handleChange(e, index, 'experience')}
                    placeholder="End Date"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <textarea
                    name="description"
                    value={exp.description}
                    onChange={(e) => handleChange(e, index, 'experience')}
                    placeholder="Job Description"
                    className="form-textarea"
                    rows="4"
                  />
                </div>
                {index > 0 && (
                  <button 
                    onClick={() => removeItem('experience', index)} 
                    className="remove-button"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button onClick={() => addItem('experience')} className="add-button">
              Add Experience
            </button>
            <div className="step-buttons">
              <button onClick={prevStep} className="prev-button">Previous</button>
              <button onClick={nextStep} className="next-button">Next</button>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="resume-step">
            <h3>Additional Information</h3>
            <div className="form-group">
              <textarea
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="Skills (comma separated)"
                className="form-textarea"
                rows="3"
              />
            </div>
            <div className="form-group">
              <textarea
                name="projects"
                value={formData.projects}
                onChange={handleChange}
                placeholder="Projects (comma separated)"
                className="form-textarea"
                rows="3"
              />
            </div>
            <div className="form-group">
              <textarea
                name="certifications"
                value={formData.certifications}
                onChange={handleChange}
                placeholder="Certifications"
                className="form-textarea"
                rows="2"
              />
            </div>
            <div className="form-group">
              <textarea
                name="languages"
                value={formData.languages}
                onChange={handleChange}
                placeholder="Languages"
                className="form-textarea"
                rows="2"
              />
            </div>
            <div className="form-group">
              <textarea
                name="interests"
                value={formData.interests}
                onChange={handleChange}
                placeholder="Interests"
                className="form-textarea"
                rows="2"
              />
            </div>
            <div className="step-buttons">
              <button onClick={prevStep} className="prev-button">Previous</button>
              <button 
                onClick={generateResume} 
                className="generate-button"
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Generate Resume'}
              </button>
            </div>
          </div>
        );
      
      case 5:
        return (
          <div className="resume-step">
            <h3>Your Resume</h3>
            {isGenerating ? (
              <div className="generating">
                <div className="loader"></div>
                <p>Generating your resume...</p>
              </div>
            ) : (
              <>
                <div className="resume-preview">
                  <pre>{resumeContent}</pre>
                </div>
                <div className="download-buttons">
                  <button onClick={() => downloadResume('txt')} className="download-button">
                    Download as Text
                  </button>
                  <button onClick={() => downloadResume('doc')} className="download-button">
                    Download as Word
                  </button>
                  <button onClick={() => downloadResume('pdf')} className="download-button">
                    Download as PDF
                  </button>
                </div>
                <div className="step-buttons">
                  <button onClick={() => setCurrentStep(1)} className="edit-button">
                    Edit Resume
                  </button>
                  <button onClick={() => navigate('/display-jobs')} className="done-button">
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="resume-builder-page">
      <div className="resume-builder-card">
        <div className="resume-builder-header">
          <h2>Resume Builder</h2>
          <button className="closee-button" onClick={() => navigate('/display-jobs')}>
            ×
          </button>
        </div>
        <div className="resume-builder-content">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(currentStep / 5) * 100}%` }}
            ></div>
          </div>
          <div className="steps-indicator">
            <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>1</div>
            <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>2</div>
            <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>3</div>
            <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>4</div>
            <div className={`step ${currentStep >= 5 ? 'active' : ''}`}>5</div>
          </div>
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilderPage; 