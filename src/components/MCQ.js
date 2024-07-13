import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, writeBatch, arrayUnion } from 'firebase/firestore';
import { db } from './firebase'; // Ensure the path is correct
import TeacherPreview from './TeacherPreview';
import './SwitchGreen.css';
import SelectStudents from './SelectStudents';
import { v4 as uuidv4 } from 'uuid';
import Navbar from './Navbar';
import CustomDateTimePicker from './CustomDateTimePicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import Select from 'react-select';

function MCQ() {
  const [step, setStep] = useState(1);
  const [className, setClassName] = useState('');
  const [assignmentName, setAssignmentName] = useState('');
  const [timer, setTimer] = useState('');
  const [selectedOptions, setSelectedOptions] = useState([]);

  const [optionsCount, setOptionsCount] = useState(4);
  const [assignDate, setAssignDate] = useState(new Date());
  const [dueDate, setDueDate] = useState(new Date());
  const [sourceOption, setSourceOption] = useState(null);
  const [sourceText, setSourceText] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [questionBank, setQuestionBank] = useState('');
  const [questionStudent, setQuestionStudent] = useState('');
  const [timerOn, setTimerOn] = useState(false);
  const [additionalInstructions, setAdditionalInstructions] = useState(['']);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [showAdditionalInstructions, setShowAdditionalInstructions] = useState(false);
  const [feedback, setFeedback] = useState('instant');
  const { classId } = useParams();
  const navigate = useNavigate();
  const handleNext = () => setStep((prevStep) => prevStep + 1);
  const handleBack = () => setStep((prevStep) => prevStep - 1);
  const handlePrevious = () => {
    navigate(-1);
  };
  const toggleAdditionalInstructions = () => {
    setShowAdditionalInstructions(!showAdditionalInstructions);
    if (showAdditionalInstructions) {
      setAdditionalInstructions('');
    }
  };
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
  const options = [
    { value: '5', label: '5' },
    { value: '4', label: '4' },
    { value: '2', label: '2' },
    { value: 'torf', label: 'True or False' },
    
  ];
  const convertToDateTime = (date) => {
    return new Date(date).toString();
  };

  const generateQuestions = async (sourceText, questionCount, assignmentId) => {
    try {
      const response = await fetch('https://us-central1-squarescore-ai.cloudfunctions.net/generateQuestions', {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
      });
      const data = await response.json();
      if (data.success && data.questions) {
        return data.questions;
      } else {
        console.error("Unexpected response format:", data);
        return [];
      }
    } catch (error) {
      console.error("Error calling generateQuestions function:", error);
      return [];
    }
  };

  const saveAssignment = async () => {
    const assignmentId = `${classId}${uuidv4()}MCQ`;
    let generatedQuestions = [];
  
    if (sourceOption === 'text' && sourceText) {
      generatedQuestions = await generateQuestions(sourceText, questionBank, assignmentId);
    }
  
    const assignmentData = {
      classId,
      assignmentName,
      timer: timerOn ? timer : 0,
      assignDate: convertToDateTime(assignDate),
      dueDate: convertToDateTime(dueDate),
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
  };
  

  const isFormValid = () => {
    return assignmentName !== '' && assignDate !== '' && dueDate !== '';
  };
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      fontFamily: "'Radio Canada', sans-serif",
      fontSize: '16px',
      marginLeft: 'auto',
      marginTop: '-10px',
      marginRight: 'auto',
      width: '250px', // Reduce the width
       border: '3px solid #F4F4F4', // Set border to 3px light grey
      boxShadow: state.isFocused ? '0 0 0 1px #45B434' : provided.boxShadow, // Add box shadow when focused
      '&:hover': {
        border: '3px solid #45B434' // Change border color on hover
      }
    }),
    option: (provided) => ({
      ...provided,
      fontFamily: "'Radio Canada', sans-serif",
      fontSize: '16px'
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: 'lightgreen', // Light green background
      border: '3px solid green', // Green border
      borderRadius: '4px', // Optional: rounded corners
      display: 'flex',
      alignItems: 'center',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: 'green', // Green font color
      fontFamily: "'Radio Canada', sans-serif",
      fontSize: '16px',
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: 'green', // Green color for the remove icon
      '&:hover': {
        backgroundColor: 'lightgreen', // Keep the background color on hover
        color: 'darkgreen' ,
        cursor: 'pointer'
        // Darker green on hover for better visibility
      }
    })
  };
  
  
  
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div style={{ marginTop: '100px', width: '1000px', marginLeft: 'auto', marginRight: 'auto', fontFamily: "'Radio Canada', sans-serif" }}>
            <h1 style={{ marginLeft: '40px', fontFamily: "'Radio Canada', sans-serif", color: 'black', fontSize: '60px', display: 'flex' }}>
              Create (<h1 style={{ fontSize: '50px', marginTop: '10px', marginLeft: '0px', color: '#020CFF' }}> MCQ </h1>)<h1 style={{ fontSize: '30px', marginLeft: '30px', color: 'grey' }}>Step 2 - Settings</h1>
            </h1>
            <div style={{ width: '100%', height: '500px', marginTop: '-30px', border: '10px solid lightgrey', borderRadius: '30px' }}>
              <div style={{ width: '810px', marginLeft: 'auto', marginRight: 'auto', marginTop: '50px' }}>
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
                      width: '744px',
                      zIndex: '200',
                      height: '60px',
                      fontSize: '45px',
                      padding: '30px',
                       border: '3px solid #F4F4F4',
                      borderRadius: '10px',
                      fontFamily: "'Radio Canada', sans-serif",
                      fontWeight: 'bold',
                      color: 'black'
                    }}
                    value={assignmentName}
                    onChange={(e) => setAssignmentName(e.target.value)}
                  />
                </div>
                <div style={{ width: '810px', display: 'flex' }}>
                  <div style={{ width: '290px', height: '60px',  border: '3px solid #F4F4F4', borderRadius: '10px', marginTop: '25px', display: 'flex', marginRight:'20px' }}>
                    <h1 style={{ fontSize: '30px', color: 'grey', marginLeft: '30px', marginTop: '10px' }}>Timer</h1>
                    <input
                      style={{ marginTop: '15px', width: '60px', marginLeft: '20px' }}
                      type="checkbox"
                      className="greenSwitch"
                      checked={timerOn}
                      onChange={() => setTimerOn(!timerOn)}
                    />
                    {timerOn ? (
                      <input
                        type="number"
                        style={{
                          marginLeft: '10px',
                          height: '30px',
                          width: '50px',
                          textAlign: 'center',
                          marginTop: '12px',
                           border: '3px solid #F4F4F4',
                          borderRadius: '5px',
                          fontSize: '20px',
                        }}
                        placeholder="min"
                        value={timer}
                        onChange={(e) => setTimer(e.target.value)}
                      />
                    ) : (
                      <span style={{
                        marginLeft: '10px',
                        height: '30px',
                        width: '50px',
                        
                        textAlign: 'center',
                        marginTop: '20px',
                        fontSize: '20px',
                        color: 'grey'
                      }}>
                        Off
                      </span>
                    )}
                  </div>
                  <div style={{ width: '500px', borderRadius: '10px',  border: '3px solid #F4F4F4', display: 'flex', height: '60px', marginTop: '25px' }}>
                      <label style={{ fontSize: '30px', color: 'grey', marginLeft: '30px', marginRight: '38px', marginTop: '13px', fontFamily: "'Radio Canada', sans-serif", fontWeight: 'bold' }}>Feedback: </label>
                      <div style={{ display: 'flex', justifyContent: 'space-around', width: '300px', marginLeft: '-30px' , alignItems: 'center'}}>
                        <div
                          style={{
                           
                            height: '30px',
                            lineHeight: '30px',

                            width: '100px',
                            textAlign: 'center',
                            fontSize: '20px',
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
                            height: '30px',
                            lineHeight: '30px',

                         
                            fontSize: '20px',
                            width: '160px',
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
                </div>
                <div style={{ width: '100%', display: 'flex', marginTop: '20px', }}>
                  <div style={{ width: '270px',  border: '3px solid #F4F4F4', height: '160px', borderRadius: '10px' }}>
                    <h3 style={{ width: '100%', textAlign: 'center', fontSize: '23px', color: 'grey', marginTop: '15px', marginBottom: '25px' }}>Choices Per Question</h3>
                   
    <Select
      isMulti
      name="options"
      options={options}
      className="basic-multi-select"
      classNamePrefix="select"
      value={selectedOptions}
      onChange={setSelectedOptions}
      styles={customStyles} // Apply custom styles here
    />
  
                  </div>
                  <div style={{ width: '507px', marginLeft: '20px' }}>
                    <div style={{ width: '507px', borderRadius: '10px',  border: '3px solid #F4F4F4', display: 'flex', height: '66px' }}>
                      <label style={{ fontSize: '30px', color: 'grey', marginLeft: '20px', marginTop: '13px', fontFamily: "'Radio Canada', sans-serif", fontWeight: 'bold' }}>Assign: </label>
                      <CustomDateTimePicker
                        selected={assignDate}
                        onChange={(date) => setAssignDate(date)}
                      />
                    </div>
                    <div style={{ width: '507px', borderRadius: '10px',  border: '3px solid #F4F4F4', display: 'flex', height: '66px', marginTop: '22px' }}>
                      <label style={{ fontSize: '30px', color: 'grey', marginLeft: '20px', marginRight: '38px', marginTop: '13px', fontFamily: "'Radio Canada', sans-serif", fontWeight: 'bold' }}>Due: </label>
                      <CustomDateTimePicker
                        selected={dueDate}
                        onChange={(date) => setDueDate(date)}
                      />
                    </div>
                  
                  </div>
                </div>
                <button
                  onClick={isFormValid() ? handleNext : null}
                  style={{
                    position: 'fixed',
                    width: '75px',
                    height: '75px',
                    padding: '10px 20px',
                    right: '10%',
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
                    opacity: '100%' // Set default background color
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  <img src='/RightGreenArrow.png' style={{ width: '75px', transition: '.5s' }} />
                </button>
                <button
                  onClick={handlePrevious}
                  style={{
                    position: 'fixed',
                    width: '75px',
                    height: '75px',
                    padding: '10px 20px',
                    left: '8.5%',
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
                    opacity: '100%' // Set default background color
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
              </div>
            </div>
          </div>
        );
          case 2:
            return (
              <div style={{ marginTop: '100px', width: '1000px', marginLeft: 'auto', marginRight: 'auto', fontFamily: "'Radio Canada', sans-serif" }}>
                <h1 style={{ marginLeft: '40px', fontFamily: "'Radio Canada', sans-serif", color: 'black', fontSize: '60px', display: 'flex' }}>
                  Create (<h1 style={{ fontSize: '50px', marginTop: '10px', marginLeft: '0px', color: '#020CFF' }}> MCQ </h1>)<h1 style={{ fontSize: '30px', marginLeft: '30px', color: 'grey' }}>Step 3 - Select Students</h1>
                </h1>
                <div style={{ width: '100%', height: '500px', marginTop: '-30px', border: '10px solid lightgrey', borderRadius: '30px' }}>
                  <div style={{ width: '950px', marginLeft: 'auto', marginRight: 'auto', marginTop: '40px', borderBottom: '5px solid lightgrey', borderTop: '5px solid lightgrey' }}>
                    <SelectStudents
                      classId={classId}
                      selectedStudents={selectedStudents}
                      setSelectedStudents={setSelectedStudents}
                    />
                    <button
                      onClick={handleBack}
                      style={{
                        position: 'fixed',
                        width: '75px',
                        height: '75px',
                        padding: '10px 20px',
                        left: '8.5%',
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
                    <button
                      onClick={handleNext}
                      style={{
                        position: 'fixed',
                        width: '75px',
                        height: '75px',
                        padding: '10px 20px',
                        right: '10%',
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
                      <img src='/RightGreenArrow.png' style={{ width: '75px', transition: '.5s' }} />
                    </button>
                  </div>
                </div>
              </div>
            );
          case 3:
            return (
              <div style={{ marginTop: '100px', width: '1000px', marginLeft: 'auto', marginRight: 'auto', fontFamily: "'Radio Canada', sans-serif" }}>
                <h1 style={{ marginLeft: '40px', fontFamily: "'Radio Canada', sans-serif", color: 'black', fontSize: '60px', display: 'flex' }}>
                  Create (<h1 style={{ fontSize: '50px', marginTop: '10px', marginLeft: '0px', color: '#020CFF' }}> MCQ </h1>)<h1 style={{ fontSize: '30px', marginLeft: '30px', color: 'grey' }}>Step 4 - Add Source</h1>
                </h1>
                <div style={{ width: '100%', height: '545px', marginTop: '-30px', border: '10px solid lightgrey', borderRadius: '30px' }}>
                  <div style={{ width: '780px', marginLeft: 'auto', marginRight: 'auto', marginTop: '30px' }}>
                    <h2 style={{ fontSize: '40px', color: 'grey', width: '100%', textAlign: 'center' }}>Select Source Type</h2>
                    {['text', 'pdf', 'youtube'].map((option) => (
                      <button
                        key={option}
                        onClick={() => setSourceOption(option)}
                        style={{
                          width: '230px',
                          height: '60px',
                          borderRadius: '30px',
                          fontSize: '30px',
                          cursor: 'pointer',
                          fontFamily: "'Radio Canada', sans-serif",
                          border: `5px solid ${sourceOption === option ? '#73D87D' : 'lightgrey'}`,
                          backgroundColor: 'white',
                          fontWeight: 'bold',
                          marginLeft: option !== 'text' ? '45px' : '0',
                          transition: 'border-color 0.3s'
                        }}
                        onMouseEnter={(e) => {
                          if (sourceOption !== option) {
                            e.target.style.borderColor = 'grey';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (sourceOption !== option) {
                            e.target.style.borderColor = 'lightgrey';
                          }
                        }}
                      >
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </button>
                    ))}
                    <p style={{ width: '100%', textAlign: 'left', color: 'lightgrey', marginTop: '30px' }}>
                      SquareScore does not store your sources, nor does it use them to train any large language models
                    </p>
                    {sourceOption === 'text' && (
                      <div>
                        <textarea
                          style={{ width: '96%', height: '100px', padding: '2%', fontFamily: "'Radio Canada', sans-serif", borderRadius: '10px', border: '3px solid grey', outline: 'none' }}
                          placeholder="Paste source here"
                          value={sourceText}
                          onChange={(e) => setSourceText(e.target.value)}
                        />
                        <p style={{ width: '100%', textAlign: 'left', color: 'lightgrey' }}>Max 5000 words</p>
                      </div>
                    )}
                    {sourceOption === 'pdf' && (
                      <div style={{ marginTop: '70px', marginBottom: '50px' }}>
                        <input
                          type="file"
                          id="file-input"
                          onChange={(e) => {
                            const fileName = e.target.files[0] ? e.target.files[0].name : 'No file chosen';
                            document.getElementById('file-name').textContent = fileName;
                          }}
                          style={{ display: 'none' }}
                        />
                        <label htmlFor="file-input" style={{
                          backgroundColor: 'white',
                          fontSize: '30px',
                          padding: '10px 20px',
                          border: '3px solid grey',
                          borderRadius: '10px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}>
                          Choose File
                        </label>
                        <span id="file-name" style={{ marginLeft: '10px', fontSize: '20px', color: 'grey' }}>No file chosen</span>
                      </div>
                    )}
                    {sourceOption === 'youtube' && (
                      <input
                        style={{ width: '96%', height: '40px', padding: '2%', fontWeight: 'bold', fontSize: '20px', marginTop: '30px', marginBottom: '30px', fontFamily: "'Radio Canada', sans-serif", borderRadius: '10px', border: '3px solid grey', outline: 'none' }}
                        type="text"
                        placeholder="Paste YouTube link"
                        value={youtubeLink}
                        onChange={(e) => setYoutubeLink(e.target.value)}
                      />
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '-35px' }}>
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
                           border: '3px solid #F4F4F4',
                          outline: 'none'
                        }}
                        type='text'
                        placeholder="ex. only use chapter one"
                        value={additionalInstructions}
                        onChange={(e) => setAdditionalInstructions(e.target.value)}
                      />
                    )}
                  </div>
                  <button
                    onClick={handleBack}
                    style={{
                      position: 'fixed',
                      width: '75px',
                      height: '75px',
                      padding: '10px 20px',
                      left: '8.5%',
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
                  <button
                    onClick={handleNext}
                    style={{
                      position: 'fixed',
                      width: '75px',
                      height: '75px',
                      padding: '10px 20px',
                      right: '10%',
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
                    <img src='/RightGreenArrow.png' style={{ width: '75px', transition: '.5s' }} />
                  </button>
                </div>
              </div>
            );
          case 4:
            return (
              <div style={{ marginTop: '100px', width: '1000px', marginLeft: 'auto', marginRight: 'auto', fontFamily: "'Radio Canada', sans-serif" }}>
                <h1 style={{ marginLeft: '40px', fontFamily: "'Radio Canada', sans-serif", color: 'black', fontSize: '60px', display: 'flex' }}>
                  Create (<h1 style={{ fontSize: '50px', marginTop: '10px', marginLeft: '0px', color: '#020CFF' }}> MCQ </h1>)<h1 style={{ fontSize: '30px', marginLeft: '30px', color: 'grey' }}>Step 5 - Question Generation</h1>
                </h1>
                <div style={{ width: '100%', height: '350px', marginTop: '70px', border: '10px solid lightgrey', borderRadius: '30px' }}>
                  <div style={{ width: '780px', marginLeft: 'auto', marginRight: 'auto', marginTop: '50px', display: 'flex' }}>
                    <div style={{}}>
                      <h1 style={{ display: 'flex', fontSize: '26px', width: '190px', height: '30px', padding: '20px', backgroundColor: 'white', color: 'grey', marginBottom: '-35px', zIndex: '300', position: 'relative', marginLeft: '64px' }}>
                        Questions <p style={{ color: 'grey', marginTop: '6px', marginLeft: '8px', fontSize: '18px' }}>(Bank)</p>
                      </h1>
                      <input
                        style={{ width: '350px', height: '150px', border: '4px solid lightgrey', borderRadius: '10px', fontSize: '70px', zIndex: '200', fontWeight: 'bold', textAlign: 'center' }}
                        type="number"
                        placeholder="10"
                        value={questionBank}
                        onChange={(e) => setQuestionBank(e.target.value)}
                      />
                    </div>
                    <div style={{ marginLeft: 'auto ' }}>
                      <h1 style={{ display: 'flex', fontSize: '26px', width: '210px', height: '30px', padding: '20px', backgroundColor: 'white', color: 'grey', marginBottom: '-35px', zIndex: '300', position: 'relative', marginLeft: '55px' }}>
                        Questions <p style={{ color: 'grey', marginTop: '6px', marginLeft: '8px', fontSize: '18px' }}>(Student)</p>
                      </h1>
                      <input
                        type="number"
                        style={{ width: '350px', height: '150px', border: '4px solid lightgrey', borderRadius: '10px', fontSize: '70px', zIndex: '200', fontWeight: 'bold', textAlign: 'center' }}
                        placeholder="5"
                        value={questionStudent}
                        onChange={(e) => setQuestionStudent(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                {questionBank && questionStudent && Number(questionBank) >= Number(questionStudent) ? (
                  <button
                    onClick={async () => {
                      setStep(5); // Move to loading screen
                      const assignmentId = `${classId}${uuidv4()}MCQ`;
                      const generatedQuestions = await generateQuestions(sourceText, questionBank, assignmentId);
                      console.log("Generated questions:", generatedQuestions);
                      setStep(6); // Move to preview screen
                    }}
                    style={{
                      width: '400px',
                      height: '70px',
                      borderRadius: '10px',
                      fontSize: '26px',
                      fontFamily: "'Radio Canada', sans-serif",
                      fontWeight: 'bold',
                      border: '4px solid white',
                      color: 'white',
                      marginLeft: '248px',
                      marginTop: '10px',
                      backgroundColor: 'white',
                      transform: 'scale(1)',
                      cursor: 'pointer',
                      transition: '.2s',
                      opacity: '100%'
                    }}
                  >
                    <img 
                      style={{ width: '400px', marginLeft: '-10px', borderRadius: '15px', transition: '.2s' }}
                      onMouseEnter={(e) => {
                        e.target.style.opacity = '85%';
                        e.target.style.boxShadow = ' 0px 4px 4px 0px rgba(0, 0, 0, 0.25)';
                        e.target.style.transform = 'scale(1.005)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.opacity = '100%';
                        e.target.style.boxShadow = 'none';
                        e.target.style.transform = 'scale(1)';
                      }}
                      src='/GenerateQuestions.png' 
                    />
                  </button>
                ) : (
                  <p style={{ color: 'red', textAlign: 'center' }}>
                    Please fill in both fields. Questions (Bank) must be greater than or equal to Questions (Student).
                  </p>
                )}
                <button
                  onClick={handleBack}
                  style={{
                    position: 'fixed',
                    width: '75px',
                    height: '75px',
                    padding: '10px 20px',
                    left: '8.5%',
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
              </div>
            );
          case 5:
            return (
              <div style={{marginLeft: 'auto', marginRight: 'auto', marginTop: 'auto', marginBottom: 'auto'}}>
                <div className="lds-ripple"><div></div><div></div></div>
                <p>Generating questions...</p>
              </div>
            );
          case 6:
            return (
              <div style={{marginTop: '100px'}}>
                <h2>Preview Questions</h2>
                <div>
                  <p>Preview of generated questions...</p>
                </div>
                <button
                  onClick={handleBack}
                  style={{
                    position: 'fixed',
                    width: '75px',
                    height: '75px',
                    padding: '10px 20px',
                    left: '8.5%',
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
                <button
                  onClick={handleNext}
                  style={{
                    position: 'fixed',
                    width: '75px',
                    height: '75px',
                    padding: '10px 20px',
                    right: '10%',
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
                  <img src='/RightGreenArrow.png' style={{ width: '75px', transition: '.5s' }} />
                </button>
              </div>
            );
          case 7:
            return (
              <div>
                <h2>Review & Publish</h2>
                <div>
                  <p>Name: {assignmentName}</p>
                  <p>Timer: {timer}</p>
                
                  <p>Feedback: {feedback}</p>
                  <p>Assign Date: {convertToDateTime(assignDate)}</p>
                  <p>Due Date: {convertToDateTime(dueDate)}</p>
                  <p>Selected Students: {[...selectedStudents].join(', ')}</p>
                  <p>Source: {sourceOption === 'youtube' ? youtubeLink : sourceText}</p>
                  <p>Question Bank: {questionBank}</p>
                  <p>Questions per Student: {questionStudent}</p>
                </div>
                <button onClick={handleBack}>Back</button>
                <button onClick={saveAssignment}>Publish</button>
              </div>
            );
          default:
            return null;
        }
      };
    
      return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
          <Navbar userType="teacher"  />
          <button style={{
            position: 'fixed', top: -70, right: -70, backgroundColor: '#FBD3FF',
            borderRadius: '200px',
            height: '300px', width: '300px', border: '15px solid #E01FFF',
            transform: 'scale(1)',
            transition: '.3s',
            opacity: '100%'
          }}
            onMouseEnter={(e) => {
              e.target.style.opacity = '85%';
              e.target.style.boxShadow = '5px 2px 8px 2px #BC9AEF'
              e.target.style.transform = 'scale(1.01)';
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = '100%';
              e.target.style.boxShadow = '5px 2px 8px 2px lightgrey';
              e.target.style.transform = 'scale(1)';
            }}
            onClick={() => console.log('Save Draft')}
          >
            <h1 style={{
              fontSize: '35px',
              width: '200px',
              marginTop: '100px',
              boxShadow: 'none',
              marginLeft: '10px',
              color: '#E01FFF',
              fontFamily: "'Radio Canada', sans-serif", cursor: 'pointer'
            }}>Save as Draft</h1>
          </button>
          {renderStep()}
        </div>
      );
    }
    

export default MCQ;