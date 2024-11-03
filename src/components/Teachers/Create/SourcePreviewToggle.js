import React, { useState } from 'react';
import { Sparkles, FileText, Landmark } from 'lucide-react';

const styles = {
  // ... all existing styles remain the same ...
  container: {
    width: '100%'
  },
  textarea: {
    width: '640px',
    height: '100px',
    marginTop: '30px',
    fontSize: '16px',
    border: '4px solid #f4f4f4',
    background: 'white',
    padding: '20px 20px',
    outline: 'none',
    display: 'block',
    borderRadius: '10px 10px 0px 0px',
    resize: 'vertical'
  },
  instructionsWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '11px',
    position: 'relative'
  },
  instructionsInput: {
    width: '80%',
    height: '20px',
    padding: '1.5%',
    fontWeight: '600',
    fontSize: '14px',
    background: '#F6F6F6',
    marginTop: '-20px',
    paddingRight: '16%',
    fontFamily: "'montserrat', sans-serif",
    borderRadius: '0px 0px 10px 10px',
    border: '4px solid #d8D8D8',
    outline: 'none'
  },
  optionalText: {
    fontSize: '12px',
    marginTop: '-6px',
    marginLeft: '10px',
    color: 'lightgrey',
    position: 'absolute',
    right: '20px'
  },
  generateButtonContainer: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '20px',
    marginBottom: '20px'
  },
  generateButton: (isGenerating) => ({
    width: '190px',
    fontWeight: '600',
    height: '50px',
    fontFamily: "'montserrat', sans-serif",
    fontSize: '24px',
    backgroundColor: isGenerating ? '#f4f4f4' : '#F5B6FF',
    color: 'grey',
    borderRadius: '10px',
    border: isGenerating ? '3px solid lightgrey' : '3px solid #E441FF',
    cursor: isGenerating ? 'default' : 'pointer'
  }),
  generateButtonContent: {
    display: 'flex',
    marginTop: '6px',
    marginLeft: '5px'
  },
  generateButtonText: {
    fontSize: '25px',
    marginTop: '-0px',
    fontWeight: '600',
    marginLeft: '8px',
    color: '#E441FF',
    fontFamily: "'montserrat', sans-serif"
  },
  progressContainer: {
    width: '300px',
    marginLeft: '20px'
  },
  progressBar: {
    height: '20px',
    backgroundColor: '#e0e0e0',
    borderRadius: '10px',
    overflow: 'hidden'
  },
  progressFill: (progress) => ({
    width: `${Math.min(progress, 100)}%`,
    height: '100%',
    backgroundColor: '#020CFF',
    transition: 'width 0.1s ease-in-out'
  }),
  progressText: {
    textAlign: 'center',
    marginTop: '5px',
    fontSize: '14px',
    color: '#666'
  },
  toggleContainer: {
    display: 'flex'
  },
  buttonBase: {
    display: 'flex',
    alignItems: 'center',
    height: '45px',
    borderRadius: '10px',
    border: '3px solid',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    fontFamily: "'montserrat', sans-serif",
    fontWeight: '600',
    fontSize: '16px',
    marginRight: '16px',
    padding: '0px 10px'
  },
  sourceButton: (isActive) => ({
    backgroundColor: isActive ? '#F5B6FF' : 'white',
    borderColor: isActive ? '#E441FF' : '#d1d1d1',
    color: isActive ? '#E441FF' : '#9ca3af',
    width: isActive ? 'auto' : '120px'
  }),
  previewButton: (isActive) => ({
    backgroundColor: isActive ? '#F4F4F4' : 'white',
    borderColor: isActive ? '#DFDFDF' : '#d1d1d1',
    color: isActive ? '#A5A5A5' : '#9ca3af'
  })
};

export const SourcePreviewToggle = ({
  sourceText = '',  // Add default value
  onSourceChange,
  additionalInstructions = '',  // Add default value
  onAdditionalInstructionsChange,
  onPreviewClick,
  onGenerateClick,
  generating = false,  // Add default value
  generatedQuestions = [],  // Add default value
  progress = 0,  // Add default value
  progressText = ''  // Add default value
}) => {
  const [showSource, setShowSource] = useState(false);

  const handleTextChange = (e) => {
    if (onSourceChange) {  // Add null check
      onSourceChange(e.target.value);
    }
  };

  const handleInstructionsChange = (e) => {
    if (onAdditionalInstructionsChange) {  // Add null check
      onAdditionalInstructionsChange(e.target.value);
    }
  };

  const ProgressBar = () => (
    <div style={styles.progressContainer}>
      <div style={styles.progressBar}>
        <div style={styles.progressFill(progress)} />
      </div>
      <div style={styles.progressText}>{progressText}</div>
    </div>
  );

  const GenerateButton = () => (
    <button
      onClick={onGenerateClick}
      disabled={generating || !sourceText?.trim()}
      style={styles.generateButton(generating)}
    >
      {generating ? 'Generating...' : (
        <div style={styles.generateButtonContent}>
          <Sparkles size={30} color="#E441FF" strokeWidth={2} />
          <h1 style={styles.generateButtonText}>Generate</h1>
        </div>
      )}
    </button>
  );

  const InitialView = () => (
    <div style={styles.container}>
      <textarea
        placeholder="Paste source here. No source? No problem - just type in your topic."
        value={sourceText}
        onChange={handleTextChange}
        onKeyDown={(e) => {
          if (e.key === 'Tab') {
            e.preventDefault();
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            const value = e.target.value;
            onSourceChange?.(value.substring(0, start) + '\t' + value.substring(end));
          }
        }}
        style={styles.textarea}
        spellCheck="false"
        autoComplete="off"
      />
      <div style={styles.instructionsWrapper}>
        <input
          style={styles.instructionsInput}
          type="text"
          placeholder="Additional Instructions"
          value={additionalInstructions}
          onChange={handleInstructionsChange}
        />
        <p style={styles.optionalText}>- optional</p>
      </div>

      <div style={styles.generateButtonContainer}>
        <GenerateButton />
        {generating && <ProgressBar />}
      </div>
    </div>
  );

  const ToggleView = () => (
    <div style={styles.container}>
      <div style={styles.toggleContainer}>
        <button
          onClick={() => setShowSource(true)}
          style={{...styles.buttonBase, ...styles.sourceButton(showSource)}}
        >
          <FileText size={24} style={{ marginRight: '10px' }} />
          <span>Source</span>
        </button>
        
        <button
          onClick={() => {
            setShowSource(false);
            onPreviewClick?.();  // Add optional chaining
          }}
          style={{...styles.buttonBase, ...styles.previewButton(!showSource)}}
        >
          <Landmark size={24} style={{ marginRight: '8px' }} />
          <span>Preview Question Bank</span>
        </button>
      </div>

      {showSource && <InitialView />}
    </div>
  );

  return !generatedQuestions?.length ? <InitialView /> : <ToggleView />;
};

export default SourcePreviewToggle;