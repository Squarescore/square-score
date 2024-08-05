import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, writeBatch, arrayUnion } from 'firebase/firestore';
import { db } from './firebase'; // Ensure the path is correct
import Navbar from './Navbar';
import SelectStudents from './SelectStudents';
import CustomDateTimePicker from './CustomDateTimePicker';
import 'react-datepicker/dist/react-datepicker.css';
import PreviewAMCQ from './PreviewAMCQ';
import axios from 'axios';

const dropdownContentStyle = `
  .dropdown-content {
    max-height: 0;
    opacity: 0;
    overflow: visible;
    transition: max-height 0.5s ease, opacity 0.5s ease, visibility 0.5s ease;
    visibility: hidden;
    position: relative;
    z-index: 90;
  }

  .dropdown-content.open {
    max-height: 1000px;
    opacity: 1;
    visibility: visible;
  }
`;

const loaderStyle = `
  .loader {
    height: 4px;
    width: 130px;
    --c: no-repeat linear-gradient(#020CFF 0 0);
    background: var(--c), var(--c), #627BFF;
    background-size: 60% 100%;
    animation: l16 3s infinite;
  }
  @keyframes l16 {
    0%   {background-position: -150% 0, -150% 0}
    66%  {background-position: 250% 0, -150% 0}
    100% {background-position: 250% 0, 250% 0}
  }
`;

const MCQA = () => {

  const [assignmentName, setAssignmentName] = useState('');
  const [timer, setTimer] = useState('');
  const [securityDropdownOpen, setSecurityDropdownOpen] = useState(false);
  const [contentDropdownOpen, setContentDropdownOpen] = useState(false);
  const [timerOn, setTimerOn] = useState(false);
  const [feedback, setFeedback] = useState('instant');
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([4]);
  const [saveAndExit, setSaveAndExit] = useState(true);
  const [lockdown, setLockdown] = useState(false);
  const [optionsCount, setOptionsCount] = useState(4);
  const [assignDate, setAssignDate] = useState(new Date());
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setHours(date.getHours() + 48);
    return date;
  })
  const [sourceOption, setSourceOption] = useState(null);
  const [sourceText, setSourceText] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [questionBank, setQuestionBank] = useState('');
  const [questionStudent, setQuestionStudent] = useState('');
  const [studentsDropdownOpen, setStudentsDropdownOpen] = useState(false);
  const [className, setClassName] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [showAdditionalInstructions, setShowAdditionalInstructions] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { classId, assignmentId } = useParams();
  const [progress, setProgress] = useState(0);
const [progressText, setProgressText] = useState('');
const [questionCount, setQuestionCount] = useState(0);
  const navigate = useNavigate();

  const toggleAdditionalInstructions = () => {
    setShowAdditionalInstructions(!showAdditionalInstructions);
    if (showAdditionalInstructions) {
      setAdditionalInstructions('');
    }
  };

  const handlePrevious = () => {
    navigate(-1);
  };

  const isReadyToPublish = () => {
    return (
      assignmentName !== '' &&
      assignDate.getTime() !== dueDate.getTime() &&
      generatedQuestions.length > 0
    );
  };

  // Fetch class name effect
  useEffect(() => {
    const fetchClassName = async () => {
      const classDocRef = doc(db, 'classes', classId);
      const classDoc = await getDoc(classDocRef);
      if (classDoc.exists) {
        const data = classDoc.data();
        if (data && data.name) {
          setClassName(data.name);
        } else {
          console.error("Class data is missing or incomplete:", classId);
        }
      } else {
        console.error("Class not found:", classId);
      }
    };
    fetchClassName();
  }, [classId]);

  // Ensure at least one option is always selected
  useEffect(() => {
    if (selectedOptions.length === 0) {
      setSelectedOptions([4]);
    }
  }, [selectedOptions]);

  const ProgressBar = ({ progress, text }) => (
    <div style={{ width: '300px', marginLeft: '20px' }}>
      <div style={{
        height: '20px',
        backgroundColor: '#e0e0e0',
        borderRadius: '10px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          backgroundColor: '#020CFF',
          transition: 'width 0.5s ease-in-out'
        }}></div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '5px', fontSize: '14px', color: '#666' }}>
        {text}
      </div>
    </div>
  );

  const assignToStudents = async (assignmentId) => {
    const selectedStudentIds = Array.from(selectedStudents);
    const batch = writeBatch(db);
    selectedStudentIds.forEach(studentUid => {
      const studentRef = doc(db, 'students', studentUid);
      batch.update(studentRef, {
        assignmentsToTake: arrayUnion(assignmentId)
      });
    });
    await batch.commit();
  };
  const parseQuestions = (response) => {
    let data = response.data;
    if (typeof data === 'string') {
      // Extract only the JSON array part if there's a preamble
      const match = data.match(/\[[\s\S]*\]/);
      if (match) {
        data = match[0];
      }
    }
    return Array.isArray(data) ? data : JSON.parse(data);
  };
  const generateQuestions = async () => {
    const baseUrl = 'https://us-central1-square-score-ai.cloudfunctions.net';
    
    try {
      setGenerating(true);
      setProgress(0);
      setProgressText('0%');
  
      const animateProgress = async (start, end, duration) => {
        const startTime = Date.now();
        return new Promise(resolve => {
          const animate = () => {
            const elapsedTime = Date.now() - startTime;
            const progress = Math.min(end, start + ((elapsedTime / duration) * (end - start)));
            setProgress(progress);
            setProgressText(`${Math.round(progress)}%`);
  
            if (progress < end && generating) {
              requestAnimationFrame(animate);
            } else {
              resolve();
            }
          };
          requestAnimationFrame(animate);
        });
      };
  
      // Animate to 24% over 20 seconds
      await animateProgress(0, 24, 20000);
  
      // Generate initial questions
      const response = await axios.post(`${baseUrl}/GenerateAMCQstep1`, {
        sourceText,
        selectedOptions,
        additionalInstructions
      });
      
      let questions = parseQuestions(response);
      
      setGeneratedQuestions(questions);
      setQuestionCount(questions.length);
      setProgress(25);
      setProgressText('25%');
  
      // Generate additional questions three times
      for (let i = 1; i <= 3; i++) {
        await animateProgress(25 * i, 25 * i + 24, 20000);
        await generateAdditionalQuestions(i + 1);
      }
  
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating questions:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
    } finally {
      setGenerating(false);
      setProgress(100);
      setProgressText('100%');
    }
  };
  
  const generateAdditionalQuestions = async (step) => {
    const baseUrl = 'https://us-central1-square-score-ai.cloudfunctions.net';
    
    try {
      const response = await axios.post(`${baseUrl}/GenerateAMCQstep2`, {
        sourceText,
        selectedOptions,
        additionalInstructions,
        previousQuestions: generatedQuestions
      });
      
      let newQuestions = parseQuestions(response);
      
      setGeneratedQuestions(prevQuestions => [...prevQuestions, ...newQuestions]);
      setQuestionCount(prevCount => prevCount + newQuestions.length);
      
      const newProgress = step * 25;
      setProgress(newProgress);
      setProgressText(`${newProgress}%`);
    } catch (error) {
      console.error('Error generating additional questions:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
    }
  };
  const handleGenerateQuestions = () => {
    if (generatedQuestions.length > 0) {
      setShowPreview(true);
    } else {
      generateQuestions();
    }
  };

  const handleSaveQuestions = () => {
    setGeneratedQuestions(generatedQuestions);
  };

  const calculateScore = (difficulty, isCorrect, streak) => {
    let score = 0;
    switch (difficulty) {
      case 'hard':
        score = isCorrect ? 3 : -1;
        break;
      case 'medium':
        score = isCorrect ? 2 : -2;
        break;
      case 'easy':
        score = isCorrect ? 1 : -1;
        break;
      default:
        break;
    }

    if (isCorrect) {
      score += 0.5 * streak;
    }

    return score;
  };

  const saveAssignment = async () => {
    const assignmentData = {
      classId,
      assignmentName,
      timer: timerOn ? Number(timer) : 0,
      assignDate: assignDate.toString(),
      dueDate: dueDate.toString(),
      optionsCount,
      selectedStudents: Array.from(selectedStudents),
      questions: generatedQuestions,
      feedback,
      selectedOptions: selectedOptions.map(option => typeof option === 'object' ? option.value : option),
      saveAndExit,
      lockdown
    };
  
    // Check for undefined values
    for (const [key, value] of Object.entries(assignmentData)) {
      if (value === undefined) {
        console.error(`Field ${key} is undefined`);
        alert(`Error: ${key} is not defined. Please check all fields.`);
        return;
      }
    }
  
    try {
      console.log("Attempting to save assignment with data:", assignmentData);
      
      const assignmentRef = doc(db, 'assignments(Amcq)', assignmentId);
      await setDoc(assignmentRef, assignmentData, { merge: true });
      
      console.log("Assignment saved successfully. Assigning to students...");
      
      await assignToStudents(assignmentId);
      
      console.log("Assignment assigned to students successfully.");
      const format = assignmentId.split('+').pop(); // Get the format from the assignment ID

      navigate(`/class/${classId}`, {
        state: {
          successMessage: `Success: ${assignmentName} published`,
          assignmentId: assignmentId,
          format: format}
        });
    } catch (error) {
      console.error("Error saving assignment:", error);
      console.error("Error details:", error.message);
      if (error.code) {
        console.error("Error code:", error.code);
      }
      alert(`Error publishing assignment: ${error.message}. Please try again.`);
    }
  };

  const isFormValid = () => {
    return assignmentName !== '' && assignDate !== '' && dueDate !== '';
  };

  const optionStyles = {
    2: { background: '#A3F2ED', color: '#00645E' },
    3: { background: '#AEF2A3', color: '#006428' },
    4: { background: '#F8CFFF', color: '#E01FFF' },
    5: { background: '#FFECA8', color: '#CE7C00' }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
      <Navbar userType="teacher" />
      <style>{dropdownContentStyle}{loaderStyle}</style>
      <div style={{ marginTop: '30px', width: '800px', marginLeft: 'auto', marginRight: 'auto', fontFamily: "'Radio Canada', sans-serif" }}>
        <button
          onClick={handlePrevious}
          style={{
            position: 'fixed',
            width: '75px',
            height: '75px',
            padding: '10px 20px',
            left: '10%',
            top: '460px',
            bottom: '20px',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            border: 'none',
            fontSize: '30px',
            color: '#45B434',
            borderRadius: '10px',
            fontWeight: 'bold',
            fontFamily: "'Radio Canada', sans-serif",
            transition: '.5s',
            transform: 'scale(1)',
            opacity: '100%'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.04)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
          }}
        >
          <img src='/LeftGreenArrow.png' style={{ width: '75px', transition: '.5s' }} />
        </button>
        <h1 style={{ marginLeft: '40px', fontFamily: "'Radio Canada', sans-serif", color: 'black', fontSize: '70px', display: 'flex', marginBottom: '100px' }}>
          Create - <h1 style={{ fontSize: '70px', marginTop: '0px', marginLeft: '10px', color: '#009006', display: 'flex' }}> MCQ<h1 style={{ fontSize: '70px', marginTop: '-10px', marginLeft: '0px', color: '#FCCA18', display: 'flex' }}>*</h1> </h1>
        </h1>
        <div style={{ width: '100%', height: 'auto', marginTop: '-200px', border: '10px solid transparent', borderRadius: '30px', padding: '20px' }}>
          <div style={{ width: '810px', marginLeft: 'auto', marginRight: 'auto', marginTop: '30px' }}>
            <div style={{ position: 'relative' }}>
              {assignmentName && (
                <h1 style={{
                  position: 'relative',
                  left: '30px',
                  zIndex: '300',
                  width: '80px',
                  marginTop: '-12px',
                  textAlign: 'center',
                  backgroundColor: 'white',
                  padding: '0 5px',
                  fontSize: '20px',
                  color: 'grey',
                  marginBottom: '-12px'
                }}>
                  Name
                </h1>
              )}
              <input
                type="text"
                placeholder="Name"
                style={{
                  width: '755px',
                  height: '60px',
                  fontSize: '35px',
                  padding: '10px',
                  paddingLeft: '25px',
                  outline: 'none',
                  border: '4px solid #F4F4F4',
                  borderRadius: '10px',
                  fontFamily: "'Radio Canada', sans-serif",
                  fontWeight: 'bold',
                  marginBottom: '20px'
                }}
                value={assignmentName}
                onChange={(e) => setAssignmentName(e.target.value)}
              />
            </div>
            <div style={{ width: '810px', display: 'flex' }}>
              <div style={{ marginBottom: '20px', width: '790px', height: '320px', borderRadius: '10px', border: '4px solid #F4F4F4' }}>
                <div style={{ width: '730px', marginLeft: '20px', height: '80px', borderBottom: '6px solid lightgrey', display: 'flex', position: 'relative', alignItems: 'center', borderRadius: '0px', padding: '10px' }}>
                  <h1 style={{ fontSize: '30px', color: 'black', width: '300px', paddingLeft: '0px' }}>Timer:</h1>
                  {timerOn ? (
                    <div style={{ display: 'flex', alignItems: 'center', position: 'relative', marginLeft: '30px' }}>
                      <input
                        type="number"
                        style={{
                          marginLeft: '-200px',
                          height: '30px',
                          width: '50px',
                          textAlign: 'center',
                          fontWeight: 'bold',
                          border: '6px solid transparent',
                          outline: 'none',
                          borderRadius: '5px',
                          fontSize: '30px',
                        }}
                        placeholder="10"
                        value={timer}
                        onChange={(e) => setTimer(e.target.value)}
                      />
                      <h1 style={{ marginLeft: '-5px', fontSize: '26px' }}>Minutes</h1>
                    </div>
                  ) : (
                    <span style={{
                      marginLeft: '-150px',
                      height: '30px',
                      width: '50px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      marginTop: '0px',
                      fontSize: '30px',
                      color: 'grey'
                    }}>
                      Off
                    </span>
                  )}
                  <input
                    style={{ marginLeft: 'auto' }}
                    type="checkbox"
                    className="greenSwitch"
                    checked={timerOn}
                    onChange={() => setTimerOn(!timerOn)}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', height: '80px', width: '750px', marginLeft: '20px', borderBottom: '6px solid lightgrey', position: 'relative', marginTop: '0px', paddingBottom: '20px' }}>
                  <label style={{ fontSize: '30px', color: 'black', marginLeft: '10px', marginRight: '38px', marginTop: '13px', fontFamily: "'Radio Canada', sans-serif", fontWeight: 'bold' }}>Feedback: </label>
                  <div style={{ display: 'flex', justifyContent: 'space-around', width: '500px', marginLeft: '100px', alignItems: 'center', marginTop: '20px' }}>
                    <div
                      style={{
                        height: '40px',
                        lineHeight: '40px',
                        fontSize: '25px',
                        width: '160px',
                        textAlign: 'center',
                        transition: '.3s',
                        borderRadius: '5px',
                        fontWeight: feedback === 'instant' ? 'bold' : 'normal',
                        backgroundColor: feedback === 'instant' ? '#AEF2A3' : 'white',
                        color: feedback === 'instant' ? '#2BB514' : 'black',
                        border: feedback === 'instant' ? '4px solid #2BB514' : '4px solid transparent',
                        cursor: 'pointer'
                      }}
                      onClick={() => setFeedback('instant')}
                    >
                      Instant
                    </div>
                    <div
                      style={{
                        height: '40px',
                        lineHeight: '40px',
                        fontSize: '25px',
                        marginLeft: '20px',
                        width: '260px',
                        textAlign: 'center',
                        transition: '.3s',
                        borderRadius: '5px',
                        backgroundColor: feedback === 'at_completion' ? '#AEF2A3' : 'white',
                        fontWeight: feedback === 'at_completion' ? 'bold' : 'normal',
                        color: feedback === 'at_completion' ? '#2BB514' : 'black',
                        border: feedback === 'at_completion' ? '4px solid #2BB514' : '4px solid transparent',
                        cursor: 'pointer'
                      }}
                      onClick={() => setFeedback('at_completion')}
                    >
                      At Completion
                    </div>
                  </div>
                </div>
                <div style={{ width: '750px', height: '80px', border: '6px solid transparent', display: 'flex', position: 'relative', alignItems: 'center', borderRadius: '10px', padding: '10px' }}>
                  <h1 style={{ fontSize: '30px', color: 'black', width: '400px', paddingLeft: '20px' }}>Choices Per Question</h1>
                  <div style={{ marginLeft: 'auto', marginTop: '45px', display: 'flex', position: 'relative', alignItems: 'center' }}>
                    {[2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        onClick={() => {
                          if (selectedOptions.includes(num)) {
                            setSelectedOptions(selectedOptions.filter(n => n !== num));
                          } else {
                            setSelectedOptions([...selectedOptions, num]);
                          }
                        }}
                        style={{
                          width: '85px',
                          height: '40px',
                          marginLeft: '20px',
                          marginTop: '-45px',
                          backgroundColor: selectedOptions.includes(num) ? optionStyles[num].background : 'white',
                          border: selectedOptions.includes(num) ? `5px solid ${optionStyles[num].color}` : '6px solid lightgrey',
                          borderRadius: '105px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <h1 style={{
                          fontSize: '24px',
                          color: selectedOptions.includes(num) ? optionStyles[num].color : 'black',
                          margin: 0,
                        }}>{num}</h1>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ width: '770px', padding: '10px', border: '4px solid #F4F4F4', borderRadius: '10px' }}>
              <button
                onClick={() => setTimeDropdownOpen(!timeDropdownOpen)}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '30px',
                  backgroundColor: 'white',
                  color: 'black',
                  border: 'none',
                  cursor: 'pointer',
                  height: '50px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <img style={{ width: '40px' }} src='/clock.png' />
                <h1 style={{ fontSize: '30px', marginLeft: '20px', marginRight: 'auto' }}> Dates</h1>
                <img
                  src={timeDropdownOpen ? '/Up.png' : '/Down.png'}
                  alt={timeDropdownOpen ? "Collapse" : "Expand"}
                  style={{ width: '20px' }}
                />
              </button>

              <div className={`dropdown-content ${timeDropdownOpen ? 'open' : ''}`}>
                <div style={{ marginTop: '10px' }}>
                  {/* Assign and Due Dates */}
                  <div style={{ marginTop: '10px', display: 'flex', position: 'relative', alignItems: 'center' }}>
                    <h1 style={{ marginLeft: '20px' }}>Assign on:</h1>
                    <div style={{ marginLeft: 'auto', marginRight: '20px' }}>
                      <CustomDateTimePicker
                        selected={assignDate}
                        onChange={(date) => setAssignDate(date)}
                        label="Assign Date"
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: '10px', display: 'flex', position: 'relative', alignItems: 'center' }}>
                    <h1 style={{ marginLeft: '20px' }}>Due on:</h1>
                    <div style={{ marginLeft: 'auto', marginRight: '20px' }}>
                      <CustomDateTimePicker
                        selected={dueDate}
                        onChange={(date) => setDueDate(date)}
                        label="Due Date"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ width: '770px', padding: '10px', marginTop: '20px', border: '4px solid #F4F4F4', borderRadius: '10px', marginBottom: '20px' }}>
              <button
                onClick={() => setStudentsDropdownOpen(!studentsDropdownOpen)}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '30px',
                  height: '50px',
                  backgroundColor: 'white',
                  color: 'black',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <img style={{ width: '40px' }} src='/select.png' />
                <h1 style={{ fontSize: '30px', marginRight: 'auto', marginLeft: '20px' }}>Select Students</h1>
                <img
                  src={studentsDropdownOpen ? '/Up.png' : '/Down.png'}
                  alt={studentsDropdownOpen ? "Collapse" : "Expand"}
                  style={{ width: '20px' }}
                />
              </button>

              <div className={`dropdown-content ${studentsDropdownOpen ? 'open' : ''}`}>
                <div style={{ marginTop: '10px' }}>
                  <SelectStudents
                    classId={classId}
                    selectedStudents={selectedStudents}
                    setSelectedStudents={setSelectedStudents}
                  />
                </div>
              </div>
            </div>
            {showPreview && generatedQuestions && generatedQuestions.length > 0 && (
              <div style={{ width: '100%', position: 'absolute', zIndex: 100000, background: 'white', top: '70px', left: '0%' }}>
                <PreviewAMCQ
                  questions={generatedQuestions}
                  onBack={() => setShowPreview(false)}
                  onSave={handleSaveQuestions}
                />
              </div>
            )}

            <div style={{ width: '770px', padding: '10px', marginTop: '20px', border: '4px solid #F4F4F4', borderRadius: '10px', marginBottom: '20px' }}>
              <button
                onClick={() => setContentDropdownOpen(!contentDropdownOpen)}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '30px',
                  backgroundColor: 'white',
                  color: 'black',
                  border: 'none',
                  height: '50px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <img style={{ width: '30px', marginRight: '20px', marginLeft: '5px' }} src='/idea.png' />
                <h1 style={{ fontSize: '30px', marginLeft: '0px', marginRight: 'auto' }}>Generate Questions</h1>
                <img
                  src={contentDropdownOpen ? '/Up.png' : '/Down.png'}
                  alt={contentDropdownOpen ? "Collapse" : "Expand"}
                  style={{ width: '20px' }}
                />
              </button>

              <div className={`dropdown-content ${contentDropdownOpen ? 'open' : ''}`}>
                <div style={{ marginTop: '0px' }}>
                  {/* Questions Section */}
                  <div style={{ width: '730px', background: 'lightgrey', height: '3px', marginLeft: '20px', marginTop: '20px' }}></div>
                  {/* Source Section */}
                  <div style={{ width: '740px', marginLeft: '20px', }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', marginTop: '30px' }}>
                      {['text', 'pdf', 'youtube'].map((option) => (
                        <button
                          key={option}
                          onClick={() => setSourceOption(option)}
                          style={{
                            width: '30%',
                            padding: '10px',
                            fontWeight: 'BOLD',
                            fontSize: '20px',
                            backgroundColor: sourceOption === option ? 'black' : 'lightgrey',
                            color: sourceOption === option ? 'white' : 'grey',
                            marginBottom: '20px',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer'
                          }}
                        >
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </button>
                      ))}
                    </div>
                    {sourceOption === 'text' && (
                      <textarea
                        placeholder="Paste source here"
                        value={sourceText}
                        onChange={(e) => setSourceText(e.target.value)}
                        style={{
                          width: '688px',
                          height: '100px',
                          fontSize: '16px',
                          background: '#F1F1F1',
                          borderLeft: '10px solid #f1f1f1',
                          borderBottom: '20px solid #f1f1f1',
                          borderTop: '0px solid #f1f1f1',
                          outline: 'none', padding: '20px',
                          borderRadius: '10px',
                          resize: 'vertical'
                        }}
                      />
                    )}
                    {sourceOption === 'pdf' && (
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          // Handle PDF file upload
                        }}
                        style={{
                          width: '100%',
                          padding: '10px',
                          fontSize: '16px',
                          border: '4px solid #F4F4F4',
                          borderRadius: '10px'
                        }}
                      />
                    )}
                    {sourceOption === 'youtube' && (
                      <input
                        type="text"
                        placeholder="Paste YouTube link"
                        value={youtubeLink}
                        onChange={(e) => setYoutubeLink(e.target.value)}
                        style={{
                          width: '715px',
                          padding: '10px',
                          fontSize: '16px',
                          border: '4px solid #F4F4F4',
                          borderRadius: '10px'
                        }}
                      />
                    )}

                    {/* Additional Instructions Section */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '-15px' }}>
                      <h1 style={{ marginTop: '20px', color: 'grey', display: 'flex', fontSize: '25px', alignItems: 'center' }}>
                        Additional instructions
                        <p style={{ fontSize: '20px', marginTop: '20px', marginLeft: '10px', color: 'lightgrey' }}>- optional</p>
                      </h1>
                      <button
                        onClick={toggleAdditionalInstructions}
                        style={{
                          marginRight: 'auto',
                          backgroundColor: 'transparent',
                          border: 'none',
                          marginTop: '0px',
                          fontSize: '30px',
                          marginLeft: '20px',
                          color: 'grey',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        {showAdditionalInstructions ? '-' : '+'}
                      </button>
                    </div>
                    {showAdditionalInstructions && (
                      <input
                        style={{
                          width: '96%',
                          height: '20px',
                          padding: '2%',
                          fontWeight: 'bold',
                          fontSize: '14px',
                          marginTop: '-20px',
                          fontFamily: "'Radio Canada', sans-serif",
                          borderRadius: '10px',
                          border: '4px solid #F4F4F4',
                          outline: 'none'
                        }}
                        type='text'
                        placeholder="ex. only use chapter one"
                        value={additionalInstructions}
                        onChange={(e) => setAdditionalInstructions(e.target.value)}
                      />
                    )}
                    {/* Generate Questions Button */}
                    {sourceOption && (
                      (sourceOption === 'text' && sourceText) ||
                      (sourceOption === 'youtube' && youtubeLink)
                    ) && Number(questionBank) >= Number(questionStudent) && (
                      <div style={{ display: 'flex', alignItems: 'center', marginTop: '20px' }}>
                        <button
                          onClick={handleGenerateQuestions}
                          disabled={generating}
                          style={{
                            width: '300px',
                            fontWeight: 'bold',
                            height: '50px',
                            padding: '10px',
                            fontSize: '24px',
                            backgroundColor: generating ? 'lightgrey' : generatedQuestions.length > 0 ? '#4CAF50' : '#020CFF',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: generating ? 'default' : 'pointer',
                            transition: 'box-shadow 0.3s ease, background-color 0.3s ease',
                            boxShadow: generating ? 'none' : '0 4px 6px rgba(0, 0, 0, 0.1)',
                          }}
                          onMouseEnter={(e) => {
                            if (!generating) {
                              e.target.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.2)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!generating) {
                              e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                            }
                          }}
                        >
                          {generating ? 'Generating...' : generatedQuestions.length > 0 ? 'Preview Questions' : 'Generate Questions'}
                        </button>
                        {generating && (
                          <ProgressBar progress={progress} text={progressText} />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              </div>
              <div style={{ width: '770px', padding: '10px', marginTop: '20px', border: '4px solid #F4F4F4', borderRadius: '10px', marginBottom: '20px' }}>
                <button
                  onClick={() => setSecurityDropdownOpen(!securityDropdownOpen)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '30px',
                    backgroundColor: 'white',
                    color: 'black',
                    border: 'none',
                    cursor: 'pointer',
                    height: '50px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <img style={{ width: '40px' }} src='/astrid.png' />
                  <h1 style={{ fontSize: '30px', marginLeft: '20px', marginRight: 'auto' }}>Security</h1>
                  <img
                    src={securityDropdownOpen ? '/Up.png' : '/Down.png'}
                    alt={securityDropdownOpen ? "Collapse" : "Expand"}
                    style={{ width: '20px' }}
                  />
                </button>

                <div className={`dropdown-content ${securityDropdownOpen ? 'open' : ''}`}>
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                      <h1 style={{ fontSize: '30px', color: 'black', marginLeft: '20px', flex: 1 }}>Save & Exit</h1>
                      <input
                        style={{ marginRight: '20px' }}
                        type="checkbox"
                        className="greenSwitch"
                        checked={saveAndExit}
                        onChange={() => setSaveAndExit(!saveAndExit)}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <h1 style={{ fontSize: '30px', color: 'black', marginLeft: '20px', flex: 1 }}>Lockdown</h1>
                      <input
                        style={{ marginRight: '20px' }}
                        type="checkbox"
                        className="greenSwitch"
                        checked={lockdown}
                        onChange={() => setLockdown(!lockdown)}
                      />
                    </div>
                 
                </div>
              </div>
              {isReadyToPublish() && (
                <button
                  onClick={saveAssignment}
                  style={{
                    width: '770px',
                    height: '50px',
                    marginTop: '20px',
                    marginBottom: '40px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease',
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#45a049'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#4CAF50'}
                >
                  Publish Assignment
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MCQA;