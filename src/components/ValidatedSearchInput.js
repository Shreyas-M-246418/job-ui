import React, { useState } from 'react';
import { validateAlphaInput } from '../utils/inputValidation';

const ValidatedSearchInput = ({ 
  placeholder, 
  value, 
  onChange, 
  pattern, 
  title,
  allowSlash = false 
}) => {
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const originalValue = e.target.value;
    const validatedValue = validateAlphaInput(originalValue);
    
    if (originalValue !== validatedValue) {
      setError('Only letters, spaces' + (allowSlash ? ', "/" and "\\"' : ' ') + 'are allowed');
      // Clear error message after 3 seconds
      setTimeout(() => setError(''), 3000);
    } else {
      setError('');
    }
    
    onChange(e);
  };

  return (
    <div className="search-input-container">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        className={`search-input ${error ? 'input-error' : ''}`}
        pattern={allowSlash ? "[A-Za-z\\s/\\\\]+" : "[A-Za-z\\s/\\\\]+"}
        title={title}
      />
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default ValidatedSearchInput; 