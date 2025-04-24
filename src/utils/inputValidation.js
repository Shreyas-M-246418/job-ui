export const validateAlphaInput = (value) => {
    // Allow letters, spaces, forward slashes and backslashes
    return value.replace(/[^a-zA-Z\s/\\]/g, '');
  }; 