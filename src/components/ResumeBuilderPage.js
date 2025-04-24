import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ResumeBuilderPage.css';
import TransformerService from '../services/transformerService';
import ModelInitializer from './ModelInitializer';
import { TextStreamer } from "@huggingface/transformers";

const ResumeBuilderPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModelInitialized, setIsModelInitialized] = useState(false);
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
      // Handle nested array fields (education, experience, projects)
      const updatedArray = [...formData[field]];
      updatedArray[index] = { ...updatedArray[index], [name]: value };
      setFormData({ ...formData, [field]: updatedArray });
    } else {
      // Handle simple fields
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
      
      // Format the data for the prompt
      const educationText = formData.education.map(edu => 
        `${edu.school} - ${edu.degree} in ${edu.field} (${edu.graduationYear})`
      ).join('\n');
      
      const experienceText = formData.experience.map(exp => 
        `${exp.position} at ${exp.company} (${exp.startDate} - ${exp.endDate})\n${exp.description}`
      ).join('\n\n');
      
      const projectsText = formData.projects;
      
      const prompt = `Create a professional resume for the following person:
      
Name: ${formData.fullName}
Email: ${formData.email}
Phone: ${formData.phone}
Location: ${formData.location}
Summary: ${formData.summary}

Education:
${educationText}

Experience:
${experienceText}

Projects:
${projectsText}

Skills: ${formData.skills}
Certifications: ${formData.certifications}
Languages: ${formData.languages}
Interests: ${formData.interests}

Please format this as a professional resume with appropriate sections and formatting.`;

      const { tokenizer, model } = await TransformerService.initialize();
      
      // Convert input to tensor with correct data type
      const inputs = await tokenizer(prompt, { 
        return_tensors: "pt",
        padding: true,
        truncation: true,
        max_length: 2048
      });

      let generatedText = '';
      
      try {
        // First attempt: Try with streaming
        const streamer = new TextStreamer(tokenizer, {
          skip_prompt: true,
          skip_special_tokens: true,
          callback_function: (token) => {
            generatedText += token;
          }
        });

        const generationConfig = {
          ...inputs,
          max_new_tokens: 2000,
          do_sample: false,
          streamer,
          stopping_criteria: TransformerService.stopping_criteria,
          pad_token_id: tokenizer.pad_token_id,
          eos_token_id: tokenizer.eos_token_id,
        };

        await model.generate(generationConfig);
      } catch (modelError) {
        console.error('Streaming generation failed, trying non-streaming approach:', modelError);
        
        // Second attempt: Try without streaming
        const generationConfig = {
          ...inputs,
          max_new_tokens: 2000,
          do_sample: false,
          pad_token_id: tokenizer.pad_token_id,
          eos_token_id: tokenizer.eos_token_id,
        };

        const output = await model.generate(generationConfig);

        // Handle different possible output formats
        if (output && typeof output === 'object') {
          if (Array.isArray(output)) {
            generatedText = tokenizer.decode(output[0], { skip_special_tokens: true });
          } else if (output.sequences) {
            generatedText = tokenizer.decode(output.sequences[0], { skip_special_tokens: true });
          } else if (output.output_ids) {
            generatedText = tokenizer.decode(output.output_ids[0], { skip_special_tokens: true });
          } else {
            // If we can't find the expected output format, try to decode the entire output
            generatedText = tokenizer.decode(output, { skip_special_tokens: true });
          }
        } else {
          throw new Error('Unexpected model output format');
        }
      }

      if (!generatedText) {
        throw new Error('Failed to generate resume content');
      }

      setResumeContent(generatedText);
      setCurrentStep(5); // Move to the final step
    } catch (error) {
      console.error('Error generating resume:', error);
      alert('Failed to generate resume. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadResume = (format) => {
    // Create a Blob with the resume content
    const blob = new Blob([resumeContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create a link element and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `${formData.fullName.replace(/\s+/g, '_')}_Resume.${format}`;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
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
              <button onClick={generateResume} className="generate-button">
                Generate Resume
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
      <ModelInitializer onInitialized={() => setIsModelInitialized(true)} />
      {isModelInitialized && (
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
      )}
    </div>
  );
};

export default ResumeBuilderPage; 