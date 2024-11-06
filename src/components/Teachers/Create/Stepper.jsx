// Stepper.jsx
import React from 'react';

const Stepper = ({ currentStep, setCurrentStep, steps, isPreviewAccessible, visitedSteps }) => {
  const handleStepClick = (index) => {
    if (index === 3 && !isPreviewAccessible) return; // Prevent navigating to Preview if not accessible
    setCurrentStep(index + 1);
  };

  const stepStyles = (step, index) => {
    const isActive = currentStep === index + 1;
    const isCompleted = visitedSteps.includes(index + 1);
    return {
      display: 'flex',
      alignItems: 'center',
      cursor: (index === 3 && !isPreviewAccessible) ? 'not-allowed' : 'pointer',
      backgroundColor: isActive || isCompleted ? step.backgroundColor : '#f0f0f0',
      border: isActive || isCompleted ? `3px solid ${step.borderColor}` : '3px solid #d1d1d1',
      borderRadius: '10px',
      padding: '10px 20px',
      marginRight: '-7px',
      position: 'relative',
      color: isActive || isCompleted ? step.textColor : '#9ca3af',
      fontWeight: isActive || isCompleted ? '600' : '500',
      transition: 'background-color 0.3s, border 0.3s, color 0.3s',
    };
  };

  const triangleStyles = (step, index) => {
    return {
      width: '0',
      height: '0',
      borderTop: '15px solid transparent',
      borderBottom: '15px solid transparent',
      borderLeft: `15px solid ${currentStep > index + 1 ? step.backgroundColor : '#f0f0f0'}`,
      position: 'absolute',
      right: '4px',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 12,
    };
  };
  const OuterTriangleStyles = (step, index) => {
    return {
      width: '0',
      height: '0',
      borderTop: '19px solid transparent',
      borderBottom: '19px solid transparent',
      borderLeft: `19px solid ${currentStep > index + 1 ? step.borderColor : 'grey'}`,
      position: 'absolute',
      right: '-18px',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 1,
    };
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '120px', marginBottom: '40px' }}>
      {steps.map((step, index) => (
        <div
          key={index}
          style={stepStyles(step, index)}
          onClick={() => handleStepClick(index)}
        >
          <span>{step.name}</span>
          {/* Add triangle except for the last step */}
          {index < steps.length - 1 && <div style={OuterTriangleStyles(step, index)}><div style={triangleStyles(step, index)}></div></div>}
        </div>
      ))}
    </div>
  );
};

export default Stepper;
