import React from 'react';

/**
 * A clean, minimalist loading spinner component
 */
const LoadingSpinner = ({ size = 'medium', fullPage = false, color = '#2D6A4F' }) => {
  // Size mappings
  const sizes = {
    small: { width: '25px', height: '25px', border: '3px' },
    medium: { width: '50px', height: '50px', border: '5px' },
    large: { width: '80px', height: '80px', border: '6px' }
  };
  
  const { width, height, border } = sizes[size] || sizes.medium;
  
  // Style for the spinner container
  const containerStyle = fullPage
    ? {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100%',
      }
    : {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
      };
    
  // Style for the spinner itself
  const spinnerStyle = {
    width,
    height,
    border: `${border} solid #f3f3f3`,
    borderTop: `${border} solid ${color}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  };
  
  return (
    <div className="spinner-container" style={containerStyle}>
      <div className="spinner" style={spinnerStyle}>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default LoadingSpinner;