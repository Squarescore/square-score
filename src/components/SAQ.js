import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, writeBatch, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase'; // Ensure the path is correct
import TeacherPreview from './TeacherPreview';

import './SwitchGreen.css';
import SelectStudents from './SelectStudents';
import Navbar from './Navbar';
import CustomDateTimePicker from './CustomDateTimePicker';
import 'react-datepicker/dist/react-datepicker.css';
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

function CreateAssignment() {
  const [step, setStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [className, setClassName] = useState('');
  const [assignmentName, setAssignmentName] = useState('');
  const [timer, setTimer] = useState('');
  const [halfCredit, setHalfCredit] = useState(false);
  const [securityDropdownOpen, setSecurityDropdownOpen] = useState(false);
  const [saveAndExit, setSaveAndExit] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [lockdown, setLockdown] = useState(false);
  const [scaleMin, setScaleMin] = useState('0');
  const [scaleMax, setScaleMax] = useState('2');
  
  const [contentDropdownOpen, setContentDropdownOpen] = useState(false);
  const [studentsDropdownOpen, setStudentsDropdownOpen] = useState(false);
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
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
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [questionsGenerated, setQuestionsGenerated] = useState(false);

  const { classId, assignmentId } = useParams(); // Get assignmentId from params
  const navigate = useNavigate();
  const handlePreviewToggle = () => {
    setShowPreview(!showPreview);
  };
  
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
        }
      } else {
        console.error("Class not found:", classId);
      }
    };
    fetchClassName();
  }, [classId]);

  const handleRegenerate = async (newInstructions) => {
    setStep(5); // Move to loading screen
    try {
      const questions = await dummyFunction(sourceText, questionBank, newInstructions || additionalInstructions);
      setGeneratedQuestions(questions);
      setQuestionsGenerated(true);
    } catch (error) {
      console.error("Error generating questions:", error);
    }
    setStep(6);  // Move to preview screen
  };

  const assignToStudents = async () => {
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

  const convertToDateTime = (date) => {
    const dateOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    
    const timeOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    };
    
    const dateString = new Date(date).toLocaleDateString('en-US', dateOptions);
    const timeString = new Date(date).toLocaleTimeString('en-US', timeOptions);
    
    return `${dateString.replace(/,/g, '')} ${timeString}`;
  };

  const dummyFunction = async (sourceText, questionCount, additionalInstructions) => {
    try {
      const response = await axios.post('https://us-central1-square-score-ai.cloudfunctions.net/dummyFunction', {
        sourceText: sourceText,
        questionCount: questionCount
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
  
      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = response.data;
      console.log('API response data:', data);
  
      let questionsString = data.questions;
      if (typeof questionsString === 'string') {
        const jsonMatch = questionsString.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          questionsString = jsonMatch[1];
        }
        try {
          questionsString = questionsString.trim();
          const questions = JSON.parse(questionsString);
          
          if (Array.isArray(questions)) {
            const questionsWithIds = questions.map((question, index) => ({
              questionId: `${assignmentId}(question${index + 1})`,
              ...question
            }));
            console.log('Generated questions:', questionsWithIds);
            setGeneratedQuestions(questionsWithIds);
            setQuestionsGenerated(true);
            return questionsWithIds;
          } else {
            console.error("Parsed questions is not an array:", questions);
            return [];
          }
        } catch (error) {
          console.error('Error parsing questions JSON:', error);
          console.error('Questions JSON:', questionsString);
          throw error;
        }
      } else if (Array.isArray(data.questions)) {
        const questionsWithIds = data.questions.map((question, index) => ({
          questionId: `${assignmentId}(question${index + 1})`,
          ...question
        }));
        console.log('Generated questions:', questionsWithIds);
        return questionsWithIds;
      } else {
        console.error("Unexpected response format:", data);
        return [];
      }
    } catch (error) {
      console.error("Error calling generateQuestions function:", error);
      throw error;
    }
  };

  const saveAssignment = async () => {
    const assignmentData = {
      classId,
      assignmentName,
      timer: timerOn ? timer : 0,
      halfCredit,
      assignDate: convertToDateTime(assignDate),
      dueDate: convertToDateTime(dueDate),
      scale: {
        min: scaleMin,
        max: scaleMax,
      },
      selectedStudents: Array.from(selectedStudents),
      questionCount: {
        bank: questionBank,
        student: questionStudent,
      },
      createdAt: serverTimestamp(),
      questions: {},
      lockdown,
      saveAndExit
    };
  
    const assignmentRef = doc(db, 'assignments(saq)', assignmentId);
    
    const batch = writeBatch(db);
  
    batch.set(assignmentRef, assignmentData);
    generatedQuestions.forEach((question, index) => {
      const questionId = `${assignmentId}(question${index + 1})`;
      assignmentData.questions[questionId] = {
        question: question.question,
        expectedResponse: question.expectedResponse
      };
    });
  
    batch.update(assignmentRef, { questions: assignmentData.questions });
  
    await batch.commit();
  
    await assignToStudents();
    console.log('Assignment and questions saved to Firebase:', assignmentData);
  
    navigate(`/class/${classId}`);
    alert(`Success: ${assignmentName} published`);
  };
  
  const isFormValid = () => {
    return assignmentName !== '' && assignDate !== '' && dueDate !== '';
  };

  const renderForm = () => {
    return (
      <div style={{ marginTop: '100px', width: '800px', marginLeft: 'auto', marginRight: 'auto', fontFamily: "'Radio Canada', sans-serif" }}>
        <style>{loaderStyle} {dropdownContentStyle}</style>
        {showPreview && generatedQuestions.length > 0 && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{position: 'relative'}}>
              <button
                onClick={handlePreviewToggle}
                style={{
                  position: 'absolute',
                  top: '-30px',
                  right: '-30px',
                  zIndex: '990',
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer'
                }}
              >
                <img style={{width: '60px'}} src='/redcirclex.png'/>
              </button>
              <TeacherPreview 
                questionsWithIds={generatedQuestions}
                setQuestionsWithIds={setGeneratedQuestions}
              />
            </div>
          </div>
        )}
         <button
            onClick={handlePrevious}
            style={{
              position: 'absolute',
              width: '75px',
              height: '75px',
              padding: '10px 20px',
              left: '10%',
              top: '50%',
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
            <img src='/LeftGreenArrow.png' style={{width: '75px', transition: '.5s'}} />
          </button>
        <h1 style={{ marginLeft: '40px', fontFamily: "'Radio Canada', sans-serif", color: 'black', fontSize: '60px', display: 'flex' }}>
          Create (<h1 style={{ fontSize: '50px', marginTop: '10px', marginLeft: '0px', color: '#020CFF' }}> SAQ </h1>)
        </h1>
        <div style={{ width: '100%', padding: '20px', border: '10px solid transparent', borderRadius: '30px' , marginTop: '-50px'}}>
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

          <div style={{ marginBottom: '20px', width: '790px', height: '320px', borderRadius: '10px', border: '3px solid lightgrey' }}>
            <div style={{ width: '730px', marginLeft: '20px', height: '80px', borderBottom: '3px solid lightgrey', display: 'flex', position: 'relative', alignItems: 'center', borderRadius: '0px', padding: '10px' }}>
              <h1 style={{ fontSize: '30px', color: 'black', width: '300px', paddingLeft: '0px' }}>Timer:</h1>
             
              {timerOn ? (
                <div style={{display: 'flex', alignItems: 'center', position: 'relative', marginLeft: '30px'}}>  
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
                  <h1 style={{ marginLeft: '-5px',fontSize:'26px' }} >Minutes</h1>
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
                style={{marginLeft: 'auto'}}
                type="checkbox"
                className="greenSwitch"
                checked={timerOn}
                onChange={() => setTimerOn(!timerOn)}
              />
            </div>

            <div style={{ width: '730px', marginLeft: '20px', height: '80px', borderBottom: '3px solid lightgrey', display: 'flex', position: 'relative', alignItems: 'center', borderRadius: '0px', padding: '10px' }}>
              <h1 style={{ fontSize: '30px', color: 'black', width: '300px', paddingLeft: '0px' }}>Half Credit</h1>
              <input
                style={{marginLeft: '370px'}}
                type="checkbox"
                className="greenSwitch"
                checked={halfCredit}
                onChange={() => setHalfCredit(!halfCredit)}
              />
            </div>
            <div style={{ width: '750px', height: '80px', border: '3px solid transparent', display: 'flex', position: 'relative', alignItems: 'center', borderRadius: '10px', padding: '10px' }}>
              <h1 style={{ fontSize: '30px', color: 'black', width: '300px', paddingLeft: '20px' }}>Scale</h1>
              <div style={{marginLeft: 'auto', marginTop: '45px'}}>
                <input
                  type="number"
                  placeholder="0"
                  style={{
                    width: '50px',
                    height: '20px',
                    textAlign: 'center',
                    fontSize: '30px',
                    paddingLeft: '17px',
                    paddingTop: '15px',
                    paddingBottom: '15px',
                    borderRadius: '10px',
                    marginLeft: 'auto',
                    fontWeight: 'bold',
                    color: '#CC0000',
                    border: '4px solid #CC0000'
                  }}
                  value={scaleMin}
                  onChange={(e) => setScaleMin(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="2"
                  style={{
                    width: '50px',
                    height: '20px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    fontSize: '30px',
                    marginLeft: '40px',
                    paddingLeft: '17px',
                    paddingTop: '15px',
                    paddingBottom: '15px',
                    borderRadius: '10px',
                    color: '#009006',
                    border: '4px solid #009006'
                  }}
                  value={scaleMax}
                  onChange={(e) => setScaleMax(e.target.value)}
                />
                <h4 style={{ fontSize: '40px', color: 'grey', width: '30px', marginTop: '-55px', marginLeft: '90px' }}>-</h4>
              </div>
            </div>
          </div>

        {/* Timer Button and Settings */}
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

{/* Select Students */}
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

{/* Content Dropdown */}
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
    <h1 style={{ fontSize: '30px', marginLeft: '0px', marginRight: 'auto',  }}>Generate Questions</h1>
    <img
      src={contentDropdownOpen ? '/Up.png' : '/Down.png'}
      alt={contentDropdownOpen ? "Collapse" : "Expand"}
      style={{ width: '20px' }}
    />
  </button>

  <div className={`dropdown-content ${contentDropdownOpen ? 'open' : ''}`}>
    <div style={{ marginTop: '0px' }}>
      {/* Questions Section */}
      <div style={{width: '730px', background: 'lightgrey', height: '3px', marginLeft: '20px', marginTop: '20px'}}></div>
      <div style={{display: 'flex', alignItems: 'center', position: 'relative'}}>
      <h2 style={{ fontSize: '30px', color: 'black', marginBottom: '10px' , marginLeft: '20px'}}>Question Bank</h2>
      <input
        type="number"
        placeholder="10"
        value={questionBank}
        onChange={(e) => setQuestionBank(e.target.value)}
        style={{ width: '60px', fontWeight:'bold',marginBottom: '10px', marginTop: '25px',  marginLeft: 'auto', marginRight: '20px',padding: '10px', fontSize: '30px', border: '3px solid lightgrey', borderRadius: '10px' }}
      />
      </div>
      <div style={{display: 'flex', alignItems: 'center', position: 'relative'}}>
      <h2 style={{ fontSize: '30px', color: 'black', marginBottom: '10px', marginLeft: '20px' }}>Question Per Student</h2>
      
      <input
        type="number"
        placeholder="5"
        value={questionStudent}
        onChange={(e) => setQuestionStudent(e.target.value)}
        style={{ width: '60px', fontWeight:'bold',marginBottom: '10px', marginTop: '25px',  marginLeft: 'auto', marginRight: '20px',padding: '10px', fontSize: '30px', border: '3px solid lightgrey', borderRadius: '10px' }}
        />
        </div>

        <div style={{width: '730px', background: 'lightgrey', height: '3px', marginLeft: '20px', marginTop: '20px'}}></div>
      {/* Source Section */}
      <div style={{width: '740px', marginLeft: '20px', }}>
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
    {/* Generate Questions Button */}
    {questionBank && questionStudent && sourceOption && (
  (sourceOption === 'text' && sourceText)  || 
  (sourceOption === 'youtube' && youtubeLink)
) && Number(questionBank) >= Number(questionStudent) && (
  <div style={{ display: 'flex', alignItems: 'center', marginTop: '20px' }}>
    <button
      onClick={async () => {
        if (generatedQuestions.length > 0) {
          setShowPreview(true);
        } else {
          setGenerating(true);
          try {
            const questions = await dummyFunction(sourceText, questionBank);
            setGeneratedQuestions(questions);
            setShowPreview(true);
          } finally {
            setGenerating(false);
          }
        }
      }}
      disabled={generating}
      style={{
        width: '300px',
        fontWeight: 'bold',
        height: '50px',
        padding: '10px',
        fontSize: '24px',
        backgroundColor: generating ? 'lightgrey' : 
                        generatedQuestions.length > 0 ? '#4CAF50' : '#020CFF',
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
      {generating ? 'Generating...' : 
       generatedQuestions.length > 0 ? 'Preview Questions' : 'Generate Questions'}
    </button>
    {generating && (
      <div className="loader" style={{ marginLeft: '20px' }}></div>
    )}
  </div>
)}


    </div>
    </div>
</div>


</div>

{/* Security Dropdown */}
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


          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button
              onClick={() => console.log('Save Draft')}
              style={{
                width: '400px',
                position: 'fixed',
                right: '-180px',
                border: '15px solid #E01FFF',
                borderRadius: '30px',
                top: '-40px',
                padding: '10px',
                fontSize: '24px',
                backgroundColor: '#FBD3FF',
                color: '#E01FFF',
                cursor: 'pointer'
              }}
            >
              <h1 style={{fontSize: '35px', width: '200px',  marginTop: '100px'}}>Save as Draft</h1>
            </button>
            <button
              onClick={saveAssignment}
              disabled={!assignmentName || generatedQuestions.length === 0}
              style={{
                width: '795px',
                padding: '10px',
                fontWeight: 'bold',
                height: '60px',
                fontSize: '24px',
                backgroundColor: assignmentName && generatedQuestions.length > 0 ? '#020CFF' : '#A0A0A0',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: assignmentName && generatedQuestions.length > 0 ? 'pointer' : 'not-allowed',
                opacity: assignmentName && generatedQuestions.length > 0 ? 1 : 0.5,
              }}
            >
              Publish
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
      <Navbar userType="teacher" />
      {renderForm()}
    </div>
  );
}

export default CreateAssignment;
