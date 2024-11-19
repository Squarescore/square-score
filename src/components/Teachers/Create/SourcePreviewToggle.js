import React, { useState } from 'react';
import { FileText, Landmark, Sparkles } from 'lucide-react';
import Loader from '../../Universal/Loader';
const SourcePreviewToggle = ({ 
  sourceText, 
  onSourceChange, 
  additionalInstructions, 
  onAdditionalInstructionsChange,
  onPreviewClick,
  onGenerateClick,
  generating,
  generatedQuestions,
  progress,
  progressText
}) => {
  const [showSource, setShowSource] = useState(false);
  
  // If questions have been generated, show success state
  if (generatedQuestions && generatedQuestions.length > 0) {
    return (
      <div style={{ width: '100%', padding: '20px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginTop: '0px',
          marginBottom: '20px'
        }}>
          <button
            style={{
              width: '400px',
              fontWeight: '600',
              height: '50px',
              fontFamily: "'montserrat', sans-serif",
              fontSize: '18px',
              backgroundColor: 'white',
              color: 'black',
              borderRadius: '10px',
              border: '3px solid white',
              display: 'flex',
              alignItems: 'center',
              marginLeft: '-30px',
              justifyContent: 'center',
              cursor: 'default'
            }}
          >
            <Sparkles size={24} style={{ marginRight: '10px', color: '#E441FF' }} />
            Questions Generated Successfully
          </button>
        </div>
        <div style={{
          borderRadius: '10px',
          marginTop: '20px'
        }}>
          <div style={{
            fontSize: '14px',
            color: '#666',
            marginBottom: '10px'
          }}>
            Source Text:
            <div style={{
              backgroundColor: 'white',
              border: '1px solid lightgrey',
              padding: '10px',
              height: '300px',
              width: '600px',
              borderRadius: '5px',
              marginTop: '5px'
            }}>
              {sourceText.substring(0, 1000)}...
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
      </div>
    );
  }

  // Original input state
  return (
    <div style={{ width: '100%' }}>
      <textarea
        placeholder="Paste source here. No source? No problem - just type in your topic."
        value={sourceText}
        onChange={(e) => onSourceChange(e.target.value)}
        style={{
          width: '640px',
          height: '200px',
          marginTop: '30px',
          fontSize: '16px',
          border: '1px solid lightgrey',
          background: 'white',
          padding: '20px 20px',
          outline: 'none',
          borderRadius: '10px',
          resize: 'vertical'
        }}
      />
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginTop: '11px', 
        position: 'relative' 
      }}>
        <input
          style={{
            width: '80%',
            height: '20px',
            padding: '1.5%',
            fontWeight: '600',
            fontSize: '14px',
            background: '#F4F4F4',
            marginTop: '0px',
            paddingRight: '16%',
            fontFamily: "'montserrat', sans-serif",
            borderRadius: ' 5px',
            border: '0px solid #d8D8D8',
            outline: 'none'
          }}
          type="text"
          placeholder="Additional Instructions"
          value={additionalInstructions}
          onChange={(e) => onAdditionalInstructionsChange(e.target.value)}
        />
        <p style={{ 
          fontSize: '12px', 
          marginTop: '10px', 
          marginLeft: '10px', 
          color: 'lightgrey', 
          position: 'absolute', 
          right: '30px' 
        }}>- optional</p>
      </div>

      {/* Generate Button */}
      <div style={{ display: 'flex', alignItems: 'center', marginTop: '20px', marginBottom: '10px' }}>
        <button
          onClick={onGenerateClick}
          disabled={generating || sourceText.trim() === ''}
          style={{
            width: '150px',
            fontWeight: '600',
            height: '40px',
            fontFamily: "'montserrat', sans-serif",
            fontSize: '20px',
            backgroundColor: generating ? '#f4f4f4' : 'white',
            color: 'grey',
            borderRadius: '5px',
            border: generating ? '1px solid lightgrey' : '1px solid lightgrey',
            cursor: generating ? 'default' : 'pointer',
          }}
        >
          {generating ? 'Generating...' : (
            <div style={{ display: 'flex', marginTop: '6px', marginLeft: '5px' }}> 
              <Sparkles size={20} color="#2BB514" strokeWidth={2} style={{marginTop: '2px'}} />
              <h1 style={{
                fontSize: '20px',  
                marginTop: '-0px', 
                fontWeight: '600',
                marginLeft: '8px', 
                color: '#2BB514', 
                fontFamily: "'montserrat', sans-serif",
              }}>Generate</h1>
            </div>
          )}
        </button>
        {generating && (
          <div style={{ width: '300px', marginLeft: '20px' }}>
         <Loader/> 
          </div>
        )}
      </div>
    </div>
  );
};

export default SourcePreviewToggle;