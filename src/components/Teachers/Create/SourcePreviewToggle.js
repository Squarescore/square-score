import React, { useState, useEffect } from 'react';
import { FileText, Landmark, Sparkles, Youtube, FileUp, Link2, BookText, ListOrdered, ChevronUp, ChevronDown, Plus, X, Trash2, CirclePlus } from 'lucide-react';
import Loader from '../../Universal/Loader';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import { GlassContainer } from '../../../styles';

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
  const [selectedFormat, setSelectedFormat] = useState('text');
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const [expandedVideoIndex, setExpandedVideoIndex] = useState(null);
  const [currentYoutubeLink, setCurrentYoutubeLink] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  // Maintain separate content for each format
  const [formatContent, setFormatContent] = useState({
    text: '',
    youtube: '',
    pdf: ''
  });

  const handleFormatChange = (format) => {
    setSelectedFormat(format);
    setError('');
    onSourceChange(formatContent[format]);
  };

  const handleYouTubeLink = async (link) => {
    try {
      if (!link.includes('youtube.com/') && !link.includes('youtu.be/')) {
        return;
      }
      
      setIsProcessing(true);
      setError('');
      
      const functions = getFunctions(getApp());
      const getYouTubeInfo = httpsCallable(functions, 'getYouTubeInfo');
      
      const result = await getYouTubeInfo({ youtubeLink: link });
      
      const newVideo = {
        title: result.data.title,
        text: result.data.text,
        link: link
      };

      setYoutubeVideos(prev => [...prev, newVideo]);
      
      // Combine all video texts
      const allVideoTexts = [...youtubeVideos, newVideo].map(v => v.text).join('\n\n');
      
      onSourceChange(allVideoTexts);
      setFormatContent(prev => ({
        ...prev,
        youtube: allVideoTexts
      }));
      
      // Keep processing true for a moment to show completion
      setTimeout(() => {
        setIsProcessing(false);
        setCurrentYoutubeLink('');
        setIsAddingNew(false);
      }, 1000);
      
    } catch (err) {
      console.error('YouTube processing error:', err);
      setError('Failed to process YouTube video. Please check the link and ensure the video has English captions.');
      setIsProcessing(false);
    }
  };

  // Add this function to reset animation state
  const handleAddAnotherVideo = () => {
    setIsAddingNew(true);
    setIsProcessing(false);
  };

  const handlePDFUpload = async (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      try {
        setIsProcessing(true);
        setError('');
        const formData = new FormData();
        formData.append('pdf', file);
        
        const response = await fetch('/api/processPDF', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error('Failed to process PDF');
        }
        
        const data = await response.json();
        // Update both the main sourceText and the pdf format content
        onSourceChange(data.text);
        setFormatContent(prev => ({
          ...prev,
          pdf: data.text
        }));
        setFile(file);
      } catch (err) {
        setError('Failed to process PDF. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    } else {
      setError('Please upload a valid PDF file.');
    }
  };

  // Handle text input changes
  const handleTextChange = (text) => {
    onSourceChange(text);
    setFormatContent(prev => ({
      ...prev,
      text: text
    }));
  };

  const handleDeleteVideo = (video) => {
    const newVideos = youtubeVideos.filter(v => v !== video);
    setYoutubeVideos(newVideos);
    
    // Update source text and format content
    const allVideoTexts = newVideos.map(v => v.text).join('\n\n');
    onSourceChange(allVideoTexts);
    setFormatContent(prev => ({
      ...prev,
      youtube: allVideoTexts
    }));
  };

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
          <h1
            style={{
              width: '400px',
              top:'0px',
              position: 'absolute',
              right: '-50px',
              fontWeight: '400',
              height: '50px',
              fontFamily: "'montserrat', sans-serif",
              fontSize: '1rem',
              color: 'grey',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            Questions Generated Successfully
          </h1>
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
              padding: '15px',
              height: '300px',
              width: '600px',
              borderRadius: '20px',
              marginTop: '5px',
              overflowY: 'auto'
            }}>
              {sourceText}
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
                borderRadius: '50px',
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

  // Format selection buttons
  const FormatButtons = () => (
    <div style={{ 
      display: 'flex', 
      gap: '10px', 
      marginBottom: '20px',
      width: '302px',
      marginLeft: 'auto',
      marginTop: '-20px',
      marginRight: '10px',
    }}>
      {['text', 'youtube', 'pdf'].map((format) => {
        const isSelected = selectedFormat === format;
        const Icon = format === 'text' ? FileText : format === 'youtube' ? Youtube : FileUp;
        const label = format.charAt(0).toUpperCase() + format.slice(1);
        
        return isSelected ? (
          <div>
          <GlassContainer
            key={format}
            variant="green"
            size={0}
            onClick={() => handleFormatChange(format)}
            contentStyle={{
              padding: '5px 15px',
              fontFamily: "'Montserrat', sans-serif",
              fontSize: '14px',
              fontWeight: "500",
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Icon size={16} />
              {label}
            </div>
          </GlassContainer>
          </div>
        ) : (
          <button
            key={format}
            onClick={() => handleFormatChange(format)}
            style={{
              padding: '5px 15px',
              borderRadius: '50px',
              border: '1px solid #ddd',
              background: 'white',
              color: 'grey',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontFamily: "'Montserrat', sans-serif",
              fontSize: '14px'
            }}
          >
            <Icon size={16} />
            {label}
          </button>
        );
      })}
    </div>
  );

  // Original input state
  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <style>
        {`
          @keyframes lightFirst {
            0% { transform: scale(1); opacity: 0.3; background: transparent; }
            10% { transform: scale(1.2); opacity: 1; background: #16a34a; }
            15% { transform: scale(1); opacity: 1; background: #16a34a; }
            80% { transform: scale(1); opacity: 1; background: #16a34a; }
            90% { transform: scale(1); opacity: 0.3; background: transparent; }
            100% { transform: scale(1); opacity: 0.3; background: transparent; }
          }

          @keyframes lightSecond {
            0%, 15% { transform: scale(1); opacity: 0.3; background: transparent; }
            25% { transform: scale(1.2); opacity: 1; background: #16a34a; }
            30% { transform: scale(1); opacity: 1; background: #16a34a; }
            80% { transform: scale(1); opacity: 1; background: #16a34a; }
            90% { transform: scale(1); opacity: 0.3; background: transparent; }
            100% { transform: scale(1); opacity: 0.3; background: transparent; }
          }

          @keyframes lightThird {
            0%, 30% { transform: scale(1); opacity: 0.3; background: transparent; }
            40% { transform: scale(1.2); opacity: 1; background: #16a34a; }
            45% { transform: scale(1); opacity: 1; background: #16a34a; }
            80% { transform: scale(1); opacity: 1; background: #16a34a; }
            90% { transform: scale(1); opacity: 0.3; background: transparent; }
            100% { transform: scale(1); opacity: 0.3; background: transparent; }
          }

          @keyframes lightFourth {
            0%, 45% { transform: scale(1); opacity: 0.3; background: transparent; }
            55% { transform: scale(1.2); opacity: 1; background: #16a34a; }
            60% { transform: scale(1); opacity: 1; background: #16a34a; }
            80% { transform: scale(1); opacity: 1; background: #16a34a; }
            90% { transform: scale(1); opacity: 0.3; background: transparent; }
            100% { transform: scale(1); opacity: 0.3; background: transparent; }
          }
        `}
      </style>
      <FormatButtons />
      
      {selectedFormat === 'text' && (
        <textarea
          placeholder="Paste source here. No source? No problem - just type in your topic."
          value={sourceText}
          onChange={(e) => handleTextChange(e.target.value)}
          style={{
            width: '640px',
            height: '200px',
            marginTop: '10px',
            fontSize: '16px',
            border: '1px solid lightgrey',
            background: 'white',
            padding: '20px 20px',
            outline: 'none',
            borderRadius: '10px',
            resize: 'vertical'
          }}
        />
      )}

      {selectedFormat === 'youtube' && (
        <div style={{ width: '98%', minHeight: '200px' }}>
          {/* Input Section - Only show when no videos or not in "Add Another" mode */}
          {!youtubeVideos.length && !isAddingNew && (
            <div style={{display: 'flex', alignItems: 'center'}}>
              <h1 style={{fontSize: '1rem', color: 'grey', fontWeight: '500'}}>Youtube Link</h1>
              <input
                type="text"
                placeholder="Paste URL here"
                value={currentYoutubeLink}
                onChange={(e) => {
                  setCurrentYoutubeLink(e.target.value);
                  handleYouTubeLink(e.target.value);
                }}
                style={{
                  width: '70%',
                  height: '30px',
                  marginTop: '10px',
                  marginLeft: 'auto',
                  marginRight: '-0px',
                  fontSize: '16px',
                  border: '1px solid lightgrey',
                  background: 'white',
                  padding: '5px 15px',
                  outline: 'none',
                  borderRadius: '50px'
                }}
              />
            </div>
          )}

          {/* Video List */}
          {youtubeVideos.length > 0 && (
            <div style={{
              marginTop: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '15px'
            }}>
              {youtubeVideos.map((video, index) => (
                <div key={index} style={{
                  borderRadius: '10px',
                  background: 'white',
                  border: '1px solid #ddd',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '15px',
                    gap: '10px',
                    borderBottom: expandedVideoIndex === index ? '1px solid #ddd' : 'none',
                    transition: 'all 0.2s ease',
                    backgroundColor: expandedVideoIndex === index ? '#f9f9f9' : 'white'
                  }}>
                    <div 
                      onClick={() => setExpandedVideoIndex(expandedVideoIndex === index ? null : index)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        flex: 1,
                        cursor: 'pointer',
                        minWidth: 0 // Add this to allow flex child to shrink
                      }}
                    >
                      <Youtube size={16} color="#666" />
                      <span style={{ 
                        color: '#333',
                        fontWeight: '500',
                        fontFamily: "'Montserrat', sans-serif",
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        flex: 1,
                        paddingRight: '10px'
                      }}>
                        {video.title}
                      </span>
                      {expandedVideoIndex === index ? (
                        <ChevronUp size={16} color="#666" style={{ flexShrink: 0 }} />
                      ) : (
                        <ChevronDown size={16} color="#666" style={{ flexShrink: 0 }} />
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleDeleteVideo(video)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        color: '#666',
                        opacity: 0.7,
                        transition: 'opacity 0.2s ease',
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = 0.7}
                    >
                      <Trash2 size={16} color="#c63e3e" />
                    </button>
                  </div>
                  
                  {expandedVideoIndex === index && (
                    <div style={{
                      padding: '15px',
                      fontSize: '.8rem',
                      lineHeight: '1.5',
                      color: '#333',
                      fontFamily: "'Montserrat', sans-serif",
                      backgroundColor: '#f9f9f9'
                    }}>
                      {video.text}
                    </div>
                  )}
                </div>
              ))}

              {/* Add More Button */}
              {!isAddingNew ? (
                <button
                  onClick={handleAddAnotherVideo}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'left',
                    gap: '8px',
                    padding: '5px 12px',
                    background: 'white',
                    border: '1px dashed white',
                    borderRadius: '10px',
                    color: '#666',
                    cursor: 'pointer',
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: '0.9rem',
                    transition: 'all 0.2s ease',
                    ':hover': {
                      borderColor: '#16a34a',
                      color: '#16a34a'
                    }
                  }}
                >
                  <Plus size={16} />
                  Add Another Video
                </button>
              ) : (
                <div style={{
                  padding: '5px 15px',
                  borderRadius: '10px',
                  background: 'white'
                }}>
                  <div style={{display: 'flex', alignItems: 'center'}}>
                    <h1 style={{fontSize: '1rem', color: 'grey', fontWeight: '500'}}>Youtube Link</h1>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginLeft: 'auto'
                    }}>
                      <input
                        type="text"
                        placeholder="Paste URL here"
                        value={currentYoutubeLink}
                        onChange={(e) => {
                          setCurrentYoutubeLink(e.target.value);
                          handleYouTubeLink(e.target.value);
                        }}
                        style={{
                          width: '300px',
                          height: '30px',
                          fontSize: '16px',
                          border: '1px solid lightgrey',
                          background: 'white',
                          padding: '5px 15px',
                          outline: 'none',
                          borderRadius: '50px'
                        }}
                      />
                      <button
                        onClick={() => {
                          setIsAddingNew(false);
                          setCurrentYoutubeLink('');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '5px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          color: '#666'
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Processing Animation */}
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            marginTop: '30px',
            marginBottom: '30px',
            padding: '20px',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.5)'
          }}>
            <Link2 
              size={40} 
              color={currentYoutubeLink.trim() ? "#16a34a" : "#858585"}
              strokeWidth={1.5}
            />
            {[1, 2, 3, 4].map((_, index) => (
              <GlassContainer
                key={index}
                variant={isProcessing ? "green" : "clear"}
                size={0}
                style={{
                  animation: isProcessing ? `light${['First', 'Second', 'Third', 'Fourth'][index]} 4s infinite` : 'none',
                }}
                contentStyle={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  padding: 0
                }}
              />
            ))}
            <CirclePlus
              size={30} 
              color="#858585"
              strokeWidth={1.5}
            />
          </div>
        </div>
      )}

      {selectedFormat === 'pdf' && (
        <div style={{ width: '97%' }}>
          <input
            type="file"
            accept=".pdf"
            onChange={handlePDFUpload}
            style={{ display: 'none' }}
            id="pdf-upload"
          />
          <label
            htmlFor="pdf-upload"
            style={{
              width: '100%',
              height: '200px',
              marginTop: '10px',
              border: '2px dashed lightgrey',
              background: 'white',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '10px',
              cursor: 'pointer'
            }}
          >
            <FileUp size={40} color="grey" />
            <span style={{ 
              marginTop: '10px',
              color: 'grey',
              fontSize: '16px',
              fontFamily: "'Montserrat', sans-serif"
            }}>
              {file ? file.name : 'Click to upload PDF'}
            </span>
          </label>
          {isProcessing && (
            <div style={{ marginTop: '20px' }}>
              <Loader />
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{
          color: '#c63e3e',
          marginTop: '10px',
          fontSize: '14px',
          fontFamily: "'Montserrat', sans-serif"
        }}>
          {error}
        </div>
      )}

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
            fontWeight: '500',
            fontSize: '14px',
            background: '#F4F4F4',
            marginTop: '0px',
            paddingRight: '16%',
            paddingLeft: '20px',
            fontFamily: "'montserrat', sans-serif",
            borderRadius: ' 50px',
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
        <GlassContainer
          variant={(!formatContent[selectedFormat] || generating) ? 'grey' : 'green'}
          size={0}
          onClick={() => {
            if (!generating && formatContent[selectedFormat]) {
              onGenerateClick();
            }
          }}
          style={{
            cursor: (!formatContent[selectedFormat] || generating) ? 'not-allowed' : 'pointer',
          }}
          contentStyle={{
            padding: '0px 15px',
            height: '35px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '1rem',
            fontWeight: "500",
            color: (!formatContent[selectedFormat] || generating) ? '#858585' : '#16a34a'
          }}
        >
          {generating ? 'Processing...' : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '8px'
            }}> 
              <Sparkles 
                size={18} 
                strokeWidth={1.5}
                color={(!formatContent[selectedFormat] || generating) ? '#858585' : '#16a34a'}
              />
              <span>Generate</span>
            </div>
          )}
        </GlassContainer>
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