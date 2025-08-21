import React from 'react';
import { Check, CircleSlash, SquareCheck, X } from 'lucide-react';
import { PencilRuler, SendHorizonal } from 'lucide-react';
import CustomDropdownFormatSelector from './ExpandingFormatSelector';
import { GlassContainer } from '../../../styles';

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
    },
    text: {
      fontSize: '14px',
      fontWeight: 500,
      color: isComplete ? '#16a34a' : '#9ca3af',
      opacity: disabled ? 0.5 : 1,
    },
    checkIconWhite: {
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
      {isActive ? (
        <div>
        <GlassContainer
          variant="green"
          size={0}
                    enableRotation={true}
          contentStyle={{
            padding: '5px 15px',
   
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '14px',
            fontWeight: "500",
            color: '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>
              {name}
            </span>
            {isComplete ? <Check size={14} style={stepStyles.checkIcon}/> : <SquareCheck size={14} style={stepStyles.checkIconWhite}/>}
         
          </div>
        </GlassContainer>
        </div>
      ) : (
        <>
        <span style={stepStyles.text}>
            {name}
          </span>
          {isComplete ? <Check size={14} style={stepStyles.checkIcon}/> : <SquareCheck size={14} style={stepStyles.checkIconWhite}/>}
        
        </>
      )}
    </div>
  );
};

const ActionButtons = ({ onSaveDraft, onPublish, isPublishDisabled }) => {
  const buttonStyles = {
    container: {
      display: 'flex',
      gap: '8px',
    }
  };

  const handleSaveDraft = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await onSaveDraft();
      // No need to handle navigation here as it's now handled in the saveDraft function
    } catch (error) {
      console.error("Error in save draft action:", error);
      // Optionally show an error message to the user
      alert('Failed to save draft. Please try again.');
    }
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isPublishDisabled) {
      try {
        await onPublish();
      } catch (error) {
        console.error("Error in publish action:", error);
      }
    }
  };

  return (
    <div style={buttonStyles.container}>
     <div 
      onClick={handleSaveDraft}
      style={{
          padding: '5px 15px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '.9rem',
          fontWeight: "500",
          borderRadius: '30px',
          color: 'grey',
          cursor: ' pointer' ,
          border: '1px solid #ddd' ,
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <PencilRuler size={15} />
          Draft
        </div>
      </div>

      <GlassContainer
        variant={isPublishDisabled ? "clear" : "green"}
        size={0}
        onClick={handlePublish}
        style={{
          cursor: isPublishDisabled ? 'not-allowed' : 'pointer'
        }}
        contentStyle={{
          padding: '5px 15px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '14px',
          fontWeight: "600",
          color: isPublishDisabled ? '#858585' : '#16a34a',
       
          boxSizing: 'border-box',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          Publish
          {isPublishDisabled ? (
            <CircleSlash size={15} />
          ) : (
            <SendHorizonal size={15} />
          )}
        </div>
      </GlassContainer>
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
      zIndex: '1' ,
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