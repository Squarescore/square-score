import React from 'react';
import { Settings, SquareDashedMousePointer, Sparkles, Eye } from 'lucide-react';

const StepContainer = ({ title, icon, color, backgroundColor, children, width = '550px', titleWidth }) => {
    const Icon = icon;
    
    return (
      <div style={{
        width: width,
        padding: '15px',
        fontFamily: "'montserrat', sans-serif",
        background: 'white',
        borderRadius: '25px',
        boxShadow: '1px 1px 10px 1px rgb(0,0,155,.05)',
        
        border: `1px solid lightgrey`,
        position: 'absolute',
        top: '-120px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100
      }}>
        <div style={{
          color: 'black',
          margin: '-15px',
          padding: '10px 10px 10px 40px',
          border: `10px solid transparent`,
          
          marginLeft: '-25px',
          borderRadius: '30px 30px 0px 0px',
          fontSize: '30px',
          display: 'flex',
          width: titleWidth || `${parseInt(width) - 38}px`, // Default to container width - padding if titleWidth not provided
          
          marginBottom: '30px',
          fontWeight: '600'
        }}>
          <Icon size={30} strokeWidth={2} style={{ marginRight: '10px', marginTop: '5px' }}/>
          {title}
        </div>
        {children}
      </div>
    );
  };
// Modified Source Preview component for after generation
const PostGenerationView = ({ sourceText, additionalInstructions, onEditClick }) => {
  return (
    <div style={{ width: '100%', padding: '20px' }}>
      <div style={{
        backgroundColor: '#f8f8f8',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '20px'
      }}>
        <h3 style={{ 
          color: '#E441FF',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Sparkles size={24} style={{ marginRight: '10px' }}/>
          Questions Generated Successfully!
        </h3>
        <div style={{
          fontSize: '14px',
          color: '#666',
          marginBottom: '10px'
        }}>
          Source Text Preview:
          <div style={{
            backgroundColor: 'white',
            padding: '10px',
            borderRadius: '5px',
            marginTop: '5px'
          }}>
            {sourceText.substring(0, 200)}...
          </div>
        </div>
        {additionalInstructions && (
          <div style={{
            fontSize: '14px',
            color: '#666'
          }}>
            Additional Instructions:
            <div style={{
              backgroundColor: 'white',
              padding: '10px',
              borderRadius: '5px',
              marginTop: '5px'
            }}>
              {additionalInstructions}
            </div>
          </div>
        )}
      </div>
      <button
        onClick={onEditClick}
        style={{
          backgroundColor: '#F5B6FF',
          border: '2px solid #E441FF',
          borderRadius: '8px',
          padding: '8px 16px',
          color: '#E441FF',
          fontWeight: '600',
          cursor: 'pointer'
        }}
      >
        Edit Source
      </button>
    </div>
  );
};

// Modified Stepper component with proper step validation
export const useStepValidation = (currentStep, formData) => {
  const validateStep = (step) => {
    switch (step) {
      case 1: // Settings
        return formData.assignmentName.trim() !== '';
      case 2: // Select Students
        return formData.assignmentName.trim() !== '' && formData.selectedStudents.size > 0;
      case 3: // Generate Questions
        return formData.assignmentName.trim() !== '' && formData.selectedStudents.size > 0;
      case 4: // Preview
        return formData.assignmentName.trim() !== '' && 
               formData.selectedStudents.size > 0 && 
               formData.generatedQuestions.length > 0;
      default:
        return false;
    }
  };

  const canAccessStep = (targetStep) => {
    // Can always go back
    if (targetStep < currentStep) return true;
    
    // Must validate all previous steps
    for (let step = 1; step < targetStep; step++) {
      if (!validateStep(step)) return false;
    }
    return true;
  };

  return { validateStep, canAccessStep };
};

export {
  StepContainer,
  PostGenerationView
};