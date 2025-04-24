import React, { useEffect, useState } from 'react';
import TransformerService from '../services/transformerService';

const ModelInitializer = ({ onInitialized }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeModel = async () => {
      try {
        await TransformerService.initialize((progress) => {
          setStatus(progress.status);
          const percentage = progress.progress ? (progress.progress).toFixed(2) : 0;
          setProgress(percentage);
        });
        setIsInitialized(true);
        onInitialized();
      } catch (error) {
        console.error('Error initializing model:', error);
        setStatus('Error initializing model');
      }
    };

    initializeModel();
  }, [onInitialized]);

  if (isInitialized) return null;

  return (
    <div className="loading">
      <div className="loader"></div>
      <div className="loading-content">
        <p>{status}</p>
        {progress > 0 && <p>{progress}%</p>}
      </div>
    </div>
  );
};

export default ModelInitializer; 