import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, writeBatch, arrayUnion } from 'firebase/firestore';
import { db } from './firebase'; // Ensure the path is correct
import Navbar from './Navbar';
import SelectStudents from './SelectStudents';
import CustomDateTimePicker from './CustomDateTimePicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import PreviewAMCQ from './previewAMCQ';
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

const AMCQ = () => {
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
    const [dueDate, setDueDate] = useState(new Date());
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
    
    const { classId } = useParams();
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
  
   

    const generateQuestions = async (previousQuestions = []) => {
      const baseUrl = 'https://us-central1-square-score-ai.cloudfunctions.net';
      
      try {
        console.log(`Generating questions. Current count: ${previousQuestions.length}`);
        const endpoint = previousQuestions.length > 0 ? '/GenerateAMCQstep2' : '/GenerateAMCQstep1';
        console.log(`Using endpoint: ${endpoint}`);
    
        const response = await axios.post(`${baseUrl}${endpoint}`, {
          sourceText,
          selectedOptions,
          additionalInstructions,
          previousQuestions
        });
        
        let questions;
        try {
          if (Array.isArray(response.data)) {
            questions = response.data;
          } else {
            questions = JSON.parse(response.data);
          }
          console.log(`Generated ${questions.length} new questions`);
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          console.log('Raw response data:', response.data);
          throw new Error('Failed to parse response from API call');
        }
        
        return questions;
      } catch (error) {
        console.error('Error generating questions:', error);
        if (error.response) {
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
        }
        throw error;
      }
    }
    
    const handleGenerateQuestions = async () => {
      if (generatedQuestions.length > 0) {
        console.log('Questions already generated. Showing preview.');
        setShowPreview(true);
      } else {
        try {
          setGenerating(true);
          let allQuestions = [];
          
          console.log('Starting question generation process');
          while (allQuestions.length < 40) {
            console.log(`Current question count: ${allQuestions.length}`);
            const newQuestions = await generateQuestions(allQuestions);
            allQuestions = [...allQuestions, ...newQuestions];
            
            console.log(`Total questions after this batch: ${allQuestions.length}`);
            
            // If we've generated more than 40 questions, trim the excess
            if (allQuestions.length > 40) {
              console.log(`Trimming excess questions. Current count: ${allQuestions.length}`);
              allQuestions = allQuestions.slice(0, 40);
            }
            
            // Update the state with the current batch of questions
            setGeneratedQuestions(allQuestions);
            console.log(`Updated state with ${allQuestions.length} questions`);
            
            // If we've reached 40 questions, break the loop
            if (allQuestions.length === 40) {
              console.log('Reached 40 questions. Stopping generation.');
              break;
            }
          }
          
          console.log('Question generation complete. Showing preview.');
          setShowPreview(true);
        } catch (error) {
          console.error('Error in handleGenerateQuestions:', error);
          // Handle the error (e.g., show an error message to the user)
        } finally {
          setGenerating(false);
          console.log('Generation process finished.');
        }
      }
    };





    const saveAssignment = async () => {
      const assignmentId = assignmentId;
      let generatedQuestions = [];
  
      if (sourceOption === 'text' && sourceText) {
        generatedQuestions = await handleGenerateQuestions(sourceText, questionBank, assignmentId);
      }
  
      const assignmentData = {
        classId,
        assignmentName,
        timer: timerOn ? timer : 0,
        assignDate: assignDate.toString(),
        dueDate: dueDate.toString(),
        optionsCount,
        selectedStudents: Array.from(selectedStudents),
        questions: generatedQuestions,
        questionCount: {
          bank: questionBank,
          student: questionStudent,
        },
        feedback,
        selectedOptions: selectedOptions.map(option => option.value), // Save the selected options
      };
  
      const assignmentRef = doc(db, 'ASSIGNMENTS(MCQ)', assignmentId);
      await setDoc(assignmentRef, assignmentData);
      await assignToStudents(assignmentId);
      alert(`Assignment ${assignmentName} saved successfully!`);
      navigate(`/class/${classId}`);
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
        <div style={{ marginTop: '30px', width: '800px', marginLeft: 'auto', marginRight: 'auto', fontFamily: "'Radio Canada', sans-serif" }}>
          <h1 style={{ marginLeft: '40px', fontFamily: "'Radio Canada', sans-serif", color: 'black', fontSize: '110px', display: 'flex' }}>
            Create (<h1 style={{ fontSize: '110px', marginTop: '10px', marginLeft: '0px', color: '#009006', display: 'flex' }}> MCQ<h1 style={{ fontSize: '110px', marginTop: '-10px', marginLeft: '0px', color: '#FCCA18', display: 'flex' }}>*</h1> </h1>)
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
                    border: '3px solid lightgrey',
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
                <div style={{ marginBottom: '20px', width: '790px', height: '320px', borderRadius: '10px', border: '3px solid lightgrey' }}>
                  <div style={{ width: '730px', marginLeft: '20px', height: '80px', borderBottom: '3px solid lightgrey', display: 'flex', position: 'relative', alignItems: 'center', borderRadius: '0px', padding: '10px' }}>
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
                            border: '3px solid transparent',
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
                  <div style={{ display: 'flex', alignItems: 'center', height: '80px', width: '750px', marginLeft: '20px', borderBottom: '3px solid lightgrey', position: 'relative', marginTop: '0px', paddingBottom: '20px' }}>
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
                  <div style={{ width: '750px', height: '80px', border: '3px solid transparent', display: 'flex', position: 'relative', alignItems: 'center', borderRadius: '10px', padding: '10px' }}>
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
                            border: selectedOptions.includes(num) ? `5px solid ${optionStyles[num].color}` : '3px solid lightgrey',
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
              <div style={{ width: '770px', padding: '10px', border: '3px solid lightgrey', borderRadius: '10px' }}>
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
  
              <div style={{ width: '770px', padding: '10px', marginTop: '20px', border: '3px solid lightgrey', borderRadius: '10px', marginBottom: '20px' }}>
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
  
              <div style={{ width: '770px', padding: '10px', marginTop: '20px', border: '3px solid lightgrey', borderRadius: '10px', marginBottom: '20px' }}>
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
                            border: '3px solid lightgrey',
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
                            border: '3px solid lightgrey',
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
                            border: '3px solid lightgrey',
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
                         <button onClick={handleGenerateQuestions} disabled={generating}
      
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
                            <div className="loader" style={{ marginLeft: '20px' }}></div>
                          )}
                        </div>
                      )}
                         {showPreview && generatedQuestions && generatedQuestions.length > 0 && (
        <PreviewAMCQ
          questions={generatedQuestions}
          onBack={() => setShowPreview(false)}
          onSave={() => console.log('Saving questions...')}
        />
      )}
              </div>
                    </div>
                  </div>
                </div>
  
                <div style={{ width: '770px', padding: '10px', marginTop: '20px', border: '3px solid lightgrey', borderRadius: '10px', marginBottom: '20px' }}>
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
                </div>
  
             
            </div>
          </div>
        </div>
      </div>
    );
  };

export default AMCQ;
