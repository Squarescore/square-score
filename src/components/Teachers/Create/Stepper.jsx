import React from 'react';
import { Check, SquareCheck } from 'lucide-react';
import { PencilRuler, SendHorizonal } from 'lucide-react';
import CustomDropdownFormatSelector from './ExpandingFormatSelector';

const Step = ({ name, isComplete, isActive, onClick, disabled }) => {
  const stepStyles = {
    container: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      margin: '-10px',
      padding: '18px 0px',
      marginRight: '50px', 
      position: 'relative',

      cursor: disabled ? 'not-allowed' : 'pointer',
      borderBottom: isActive ? '2px solid #16a34a' : '2px solid transparent',
    },
    text: {
      fontSize: '14px',
      fontWeight: 500,
      color: isComplete ? '#16a34a' : '#9ca3af',
      opacity: disabled ? 0.5 : 1,
    },checkIconWhite: {
      color: 'white',
    },
    checkIcon: {
      color: '#16a34a',
    }
  };

  return (
    <div 
      onClick={disabled ? undefined : onClick}
      style={stepStyles.container}
    >
      
      {isComplete ? <SquareCheck size={14} style={stepStyles.checkIcon}/>: <SquareCheck size={14} style={stepStyles.checkIconWhite}/>}
      <span style={stepStyles.text}>
        {name}
      </span>
    </div>
  );
};

const ActionButtons = ({ onSaveDraft, onPublish, isPublishDisabled }) => {
  const buttonStyles = {
    container: {
      display: 'flex',
      gap: '8px',
    },
    baseButton: {
      height: '32px',
      padding: '0 12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      borderRadius: '6px',
      border: '1px solid #e5e7eb',
      fontSize: '14px',
      fontWeight: 600,
      transition: 'all 0.2s ease',
    },
    draft: {
      backgroundColor: '#f9fafb',
      
      fontFamily: "'Montserrat', sans-serif",
      color: '#4b5563',
      cursor: 'pointer',
    },
    publish: {
      border:  isPublishDisabled ? '1px solid lightgrey' : '1px solid #2BB514',
      fontFamily: "'Montserrat', sans-serif",
      backgroundColor: isPublishDisabled ? 'lightgrey' : '#2BB514',
      
      color: isPublishDisabled ? 'grey' : 'white',
      cursor: isPublishDisabled ? 'not-allowed' : 'pointer',
    }
  };

  return (
    <div style={buttonStyles.container}>
      <button
        onClick={onSaveDraft}
        style={{
          ...buttonStyles.baseButton,
          ...buttonStyles.draft
        }}
      >
        <PencilRuler size={15} />
        Draft
      </button>
      <button
        onClick={onPublish}
        disabled={isPublishDisabled}
        style={{
          ...buttonStyles.baseButton,
          ...buttonStyles.publish
        }}
      >
        Publish
        <SendHorizonal size={15} />
      </button>
    </div>
  );
};

const Stepper = ({
  currentStep,
  setCurrentStep,
  steps,
  isPreviewAccessible,
  visitedSteps,
  onSaveDraft,
  onPublish,
  isPublishDisabled,
  classId,
  selectedFormat,
  onFormatChange
}) => {
  const handleStepClick = (index) => {
    if (index === 3 && !isPreviewAccessible) return;
    setCurrentStep(index + 1);
  };

  const stepOrder = ['Settings', 'Select Students', 'Generate', 'Preview'];

  const styles = {
    wrapper: {
      width: '100%',
      position: 'fixed',
      top: 0,
      borderBottom: '1px solid #e5e7eb',
    },
    marginContainer: {
      marginLeft: '224px',
      marginRight: '224px',
    },
    mainContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '5px 20px',
      backgroundColor: 'white',
      width: '100%',
      maxWidth: '896px',
      marginLeft: 'auto',
      marginRight: 'auto',
    },
    dropdownContainer: {
      display: 'flex',
      alignItems: 'center',
      marginLeft: '-20px',
    },
    stepsContainer: {
      display: 'flex',
      justifyContent: 'center',
      flex: 1,
    },
    actionContainer: {
      position: 'relative',
      zIndex: 50,
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.marginContainer}>
        <div style={styles.mainContainer}>
          <div style={styles.dropdownContainer}>
            <CustomDropdownFormatSelector
              classId={classId}
              selectedFormat={selectedFormat}
              onFormatChange={onFormatChange}
            />
          </div>
          
          <div style={styles.stepsContainer}>
            {stepOrder.map((stepName, index) => (
              <Step
                key={stepName}
                name={stepName}
                isComplete={visitedSteps.includes(index + 1) || currentStep === index + 1}
                isActive={currentStep === index + 1}
                onClick={() => handleStepClick(index)}
                disabled={index === 3 && !isPreviewAccessible}
              />
            ))}
          </div>

          <div style={styles.actionContainer}>
            <ActionButtons
              onSaveDraft={onSaveDraft}
              onPublish={onPublish}
              isPublishDisabled={isPublishDisabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stepper;