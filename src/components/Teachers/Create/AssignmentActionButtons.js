import React from 'react';
import { PencilRuler, SendHorizonal } from 'lucide-react';

const styles = {
  container: {
    display: 'flex',
    width: '830px',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: '-10px',
    marginBottom: '100px'
  },
  baseButton: {
    height: '60px',
    marginTop: '0px',
    marginBottom: '40px',
    padding: '5px 5px',
    boxShadow: '1px 1px 5px 1px rgb(0,0,155,.1)',
    borderRadius: '10px',
    fontSize: '20px',
    fontFamily: "'montserrat', sans-serif",
    display: 'flex',
    transition: 'all 0.3s ease'
  },
  draftButton: {
    width: '270px',
    border: '3px solid white',
    backgroundColor: 'white',
    color: 'grey',
    fontWeight: '600',
    cursor: 'pointer'
  },
  publishButton: (disabled) => ({
    width: '480px',
    marginLeft: '30px',
    border: '3px solid white',
    backgroundColor: 'white',
    opacity: disabled ? '0%' : '100%',
    color: disabled ? 'lightgrey' : '#00D409',
    fontWeight: 'bold',
    cursor: disabled ? 'default' : 'pointer'
  }),
  buttonText: {
    fontSize: '25px',
    marginTop: '7px',
    marginLeft: '15px',
    background: 'transparent',
    fontWeight: '600'
  },
  icon: {
    marginLeft: '5px',
    marginTop: '7px',
    background: 'transparent'
  },
  publishIcon: {
    marginLeft: 'auto',
    marginTop: '5px',
    background: 'transparent'
  }
};

export const AssignmentActionButtons = ({ 
  onSaveDraft, 
  onPublish, 
  isPublishDisabled,
  publishDisabledConditions = {
    assignmentName: true,
    questionsGenerated: true
  }
}) => {
  return (
    <div style={styles.container}>
      {/* Save Draft Button */}
      <button
        onClick={onSaveDraft}
        style={{
          ...styles.baseButton,
          ...styles.draftButton
        }}
      >
        <PencilRuler 
          size={30} 
          style={styles.icon}
        />
        <h1 style={styles.buttonText}>
          Save As Draft
        </h1>
      </button>

      {/* Publish Button */}
      <button
        onClick={onPublish}
        disabled={isPublishDisabled}
        style={{
          ...styles.baseButton,
          ...styles.publishButton(isPublishDisabled)
        }}
      >
        <h1 style={styles.buttonText}>
          Publish
        </h1>
        <SendHorizonal 
          size={40} 
          style={styles.publishIcon}
        />
      </button>
    </div>
  );
};

// Optional - Create a hook to manage the publish button state
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

export default AssignmentActionButtons;