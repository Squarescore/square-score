import React, { useState } from 'react';
import { Sparkles, FileText, Eye } from 'lucide-react';

const SourcePreviewToggle = ({
  sourceText,
  onSourceChange,
  additionalInstructions,
  onAdditionalInstructionsChange,
  onPreviewClick,
  onGenerateClick,
  generating,
  generatedQuestions
}) => {
  const [showSource, setShowSource] = useState(true);

  if (!generatedQuestions || generatedQuestions.length === 0) {
    return (
      <div style={{ width: '100%', marginTop: '20px' }}>
        <textarea
          placeholder="Paste source here. No source? No problem - just type in your topic."
          value={sourceText}
          onChange={(e) => onSourceChange(e.target.value)}
          style={{
            width: '640px',
            height: '100px',
            marginTop: '30px',
            fontSize: '16px',
            border: '4px solid #f4f4f4',
            background: 'white',
            padding: '20px 20px',
            outline: 'none',
            borderRadius: '10px 10px 0px 0px',
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
              background: '#F6F6F6',
              marginTop: '-20px',
              paddingRight: '16%',
              fontFamily: "'montserrat', sans-serif",
              borderRadius: '0px 0px 10px 10px',
              border: '4px solid #d8D8D8',
              outline: 'none'
            }}
            type="text"
            placeholder="Additional Instructions"
            value={additionalInstructions}
            onChange={(e) => onAdditionalInstructionsChange(e.target.value)}
          />
          <p style={{ 
            fontSize: '12px', 
            marginTop: '-6px', 
            marginLeft: '10px', 
            color: 'lightgrey', 
            position: 'absolute', 
            right: '20px' 
          }}>- optional</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginTop: '20px' }}>
          <button
            onClick={onGenerateClick}
            disabled={generating || !sourceText?.trim()}
            style={{
              width: '190px',
              fontWeight: '600',
              height: '50px',
              fontFamily: "'montserrat', sans-serif",
              fontSize: '24px',
              backgroundColor: generating ? '#f4f4f4' : '#F5B6FF',
              color: 'grey',
              borderRadius: '10px',
              border: generating ? '3px solid lightgrey' : '3px solid #E441FF',
              cursor: generating ? 'default' : 'pointer'
            }}
          >
            {generating ? 'Generating...' : (
              <div style={{ display: 'flex', marginTop: '6px', marginLeft: '5px' }}> 
                <Sparkles size={30} color="#E441FF" strokeWidth={2} />
                <h1 style={{
                  fontSize: '25px',  
                  marginTop: '-0px', 
                  fontWeight: '600',
                  marginLeft: '8px', 
                  color: '#E441FF', 
                  fontFamily: "'montserrat', sans-serif"
                }}>Generate</h1>
              </div>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', marginTop: '0px' }}>
      <div style={{ display: 'flex' }}>
        <button
          onClick={() => setShowSource(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            height: '45px',
            borderRadius: '10px',
            border: '3px solid',
            backgroundColor: showSource ? '#F5B6FF' : 'white',
            borderColor: showSource ? '#E441FF' : '#d1d1d1',
            padding: '0px 10px',
            color: showSource ? '#E441FF' : '#9ca3af',
            cursor: 'pointer',
            fontFamily: "'montserrat', sans-serif",
            fontWeight: '600',
            fontSize: '16px',
            marginRight: '16px'
          }}
        >
          <FileText size={24} style={{ marginRight: '10px' }} />
          <span>Source</span>
        </button>
        
        <button
          onClick={() => {
            setShowSource(false);
            onPreviewClick();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            height: '45px',
            borderRadius: '10px',
            border: '3px solid',
            backgroundColor: !showSource ? '#F4F4F4' : 'white',
            borderColor: !showSource ? '#DFDFDF' : '#d1d1d1',
            padding: '0px 10px',
            color: !showSource ? '#A5A5A5' : '#9ca3af',
            cursor: 'pointer',
            fontFamily: "'montserrat', sans-serif",
            fontWeight: '600',
            fontSize: '16px'
          }}
        >
          <Eye size={24} style={{ marginRight: '8px' }} />
          <span>Preview Questions</span>
        </button>
      </div>

      {showSource && (
        <div style={{ marginTop: '16px' }}>
          <textarea
            placeholder="Paste source here. No source? No problem - just type in your topic."
            value={sourceText}
            onChange={(e) => onSourceChange(e.target.value)}
            style={{
              width: '640px',
              height: '100px',
              fontSize: '16px',
              border: '4px solid #f4f4f4',
              background: 'white',
              padding: '20px 20px',
              outline: 'none',
              borderRadius: '10px',
              resize: 'vertical'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default SourcePreviewToggle;