import React from 'react';

/**
 * A reusable modal dialog component with a modern, minimalist design
 */
const ModalDialog = ({ 
  isOpen, 
  title, 
  message, 
  primaryAction, 
  secondaryAction,
  primaryLabel = 'Confirm',
  secondaryLabel = 'Cancel',
  children,
  onClose 
}) => {
  if (!isOpen) return null;
  
  // Close the modal when clicking outside
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  return (
    <div 
      className="modal-backdrop" 
      onClick={handleBackdropClick}
    >
      <div 
        className="modal-content slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>{title}</h3>
          <button 
            className="btn-ghost"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0 8px',
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>
        
        <div className="modal-body">
          {message && <p>{message}</p>}
          {children}
        </div>
        
        <div className="modal-footer">
          {secondaryAction && (
            <button 
              className="btn btn-secondary"
              onClick={secondaryAction}
            >
              {secondaryLabel}
            </button>
          )}
          {primaryAction && (
            <button 
              className="btn"
              onClick={primaryAction}
            >
              {primaryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalDialog;