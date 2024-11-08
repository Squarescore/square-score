import React from 'react';
import { PencilRuler, SendHorizonal } from 'lucide-react';

const ActionButton = ({ onClick, icon: Icon, text, disabled, styles }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      height: '43px',
      padding: '0 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      borderRadius: '10px',
      border: `3px solid ${styles.borderColor}`,
      backgroundColor: styles.backgroundColor || 'white',
      color: disabled ? '#9ca3af' : styles.color,
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontWeight: '600',
      fontSize: '14px',
      transition: 'all 0.3s ease',
      opacity: disabled ? 0.5 : 1,
      ...styles.custom
    }}
  >
    <Icon size={20} />
    <span>{text}</span>
  </button>
);

const Stepper = ({ 
  currentStep, 
  setCurrentStep, 
  steps, 
  isPreviewAccessible, 
  visitedSteps,
  onSaveDraft,
  onPublish,
  isPublishDisabled 
}) => {
  const handleStepClick = (index) => {
    if (index === 3 && !isPreviewAccessible) return;
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

  const containerStyles = {
    display: 'flex',
    justifyContent: 'center',
    boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)',
    padding: "10px",
    alignItems: 'center',
    background: 'white',
    marginTop: '120px',
    marginBottom: '40px',
    position: 'relative',
    borderRadius: '10px',
    width: '900px',
    margin: '120px auto 40px'
  };

  const stepsContainerStyles = {
    display: 'flex',
    justifyContent: 'center',
    position: 'relative',
    flex: 1
  };

  return (
    <div style={containerStyles}>
      {/* Publish Button (left of Preview) */}
      <div style={{ 
        position: 'absolute', 
        right: '10px',
        zIndex: 20
      }}>
        <ActionButton
          onClick={onPublish}
          icon={SendHorizonal}
          text="Publish"
          disabled={isPublishDisabled}
          styles={{
            borderColor: '#00D409',
            color: '#00D409',
            backgroundColor: 'white'
          }}
        />
      </div>

      {/* Draft Button (right of Settings) */}
      <div style={{ 
        position: 'absolute', 
        left: '10px',
        zIndex: 20
      }}>
        <ActionButton
          onClick={onSaveDraft}
          icon={PencilRuler}
          text="Save Draft"
          styles={{
            borderColor: '#d1d1d1',
            color: 'grey',
            backgroundColor: 'white'
          }}
        />
      </div>

      <div style={stepsContainerStyles}>
        {steps.map((step, index) => (
          <div
            key={index}
            style={stepStyles(step, index)}
            onClick={() => handleStepClick(index)}
          >
            <span>{step.name}</span>
            {index < steps.length - 1 && (
              <div style={OuterTriangleStyles(step, index)}>
                <div style={triangleStyles(step, index)} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
export const usePublishState = (assignmentName, generatedQuestions) => {
  const isPublishDisabled = !assignmentName || generatedQuestions.length === 0;
  
  return {
    isPublishDisabled,
    publishDisabledConditions: {
      assignmentName: !assignmentName,
      questionsGenerated: generatedQuestions.length === 0
    }
  };
};
export default Stepper;