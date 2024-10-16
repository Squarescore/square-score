import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, writeBatch, arrayUnion, serverTimestamp } from 'firebase/firestore';

import { CalendarCog, SquareDashedMousePointer, Sparkles, GlobeLock,  } from 'lucide-react';
import { db } from '../../Universal/firebase';  // Ensure the path is correct
import TeacherPreviewASAQ from './PreviewASAQ';
import { auth } from '../../Universal/firebase';
import '../../Universal//SwitchGreen.css';
import SelectStudents from './SelectStudents';
import Navbar from '../../Universal/Navbar';
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

function SAQA() {
  const [showPreview, setShowPreview] = useState(false);
  const [assignmentName, setAssignmentName] = useState('');
  const [timer, setTimer] = useState('60');
  const [halfCredit, setHalfCredit] = useState(false);
  const [securityDropdownOpen, setSecurityDropdownOpen] = useState(false);
  const [saveAndExit, setSaveAndExit] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [lockdown, setLockdown] = useState(false);
  
  const [teacherId, setTeacherId] = useState(null);
  const [contentDropdownOpen, setContentDropdownOpen] = useState(false);
  const [studentsDropdownOpen, setStudentsDropdownOpen] = useState(false);
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
  const [assignDate, setAssignDate] = useState(new Date());
  const [dueDate, setDueDate] = useState(new Date());
  const [sourceOption, setSourceOption] = useState(null);
  const [sourceText, setSourceText] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('10');
  const [questionBank, setQuestionBank] = useState('40');
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
    const fetchTeacherId = async () => {
     
  
      // Get the current user's UID (teacher ID)
      const user = auth.currentUser;
      if (user) {
        setTeacherId(user.uid);
      } else {
        console.error("No authenticated user found");
      }
    };
    fetchTeacherId();
  }, [classId]);

 

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

  const GenerateASAQ = async (sourceText, questionCount, additionalInstructions,  classId) => {
    try {
      const response = await axios.post('https://us-central1-square-score-ai.cloudfunctions.net/GenerateASAQ', {
        sourceText: sourceText,
        questionCount: questionCount,
        additionalInstructions: additionalInstructions,
        classId: classId,
        teacherId: teacherId
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
     
      selectedStudents: Array.from(selectedStudents),
      questionCount: {
        bank: questionBank,
        
      },
      createdAt: serverTimestamp(),
      questions: {},
      lockdown,
      saveAndExit
    };
  
    const assignmentRef = doc(db, 'assignments(Asaq)', assignmentId);
    
    const batch = writeBatch(db);
  
    batch.set(assignmentRef, assignmentData);
    generatedQuestions.forEach((question, index) => {
      const questionId = `${assignmentId}(question${index + 1})`;
      assignmentData.questions[questionId] = {
        question: question.question,
        rubric: question.rubric
      };
    });
  
    batch.update(assignmentRef, { questions: assignmentData.questions });
  
    await batch.commit();
  
    await assignToStudents();
    console.log('Assignment and questions saved to Firebase:', assignmentData);
    const format = assignmentId.split('+').pop();
    navigate(`/class/${classId}`, {
      state: {
        successMessage: `Success: ${assignmentName} published`,
        assignmentId: assignmentId
      }
    });
  };
  

  const renderForm = () => {
    return (
      <div style={{ marginTop: '100px', width: '800px', marginLeft: 'auto', marginRight: 'auto', fontFamily: "'montserrat', sans-serif" }}>
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
              <TeacherPreviewASAQ
            questionsWithIds={generatedQuestions}
            setQuestionsWithIds={setGeneratedQuestions}
            sourceText={sourceText}
            questionCount={questionBank}
            classId={classId}
            teacherId={teacherId}
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
              fontFamily: "'montserrat', sans-serif",
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
        <h1 style={{ marginLeft: '40px', fontFamily: "'montserrat', sans-serif", color: 'black', fontSize: '60px', display: 'flex' }}>
          Create (<h1 style={{ fontSize: '50px', marginTop: '10px', marginLeft: '0px', color: '#020CFF' }}> SAQ*</h1>)
        </h1>
        <div style={{ width: '100%', padding: '20px', border: '10px solid transparent', borderRadius: '30px' , marginTop: '-50px'}}>
        <div style={{ position: 'relative' }}>
  {assignmentName && (
    <h1 style={{
      position: 'absolute',
      left: '30px',
      top: '-25px',
      zIndex: '300',
      width: '80px',
      textAlign: 'center',
      backgroundColor: 'white',
      padding: '0 5px',
      fontSize: '20px',
      color: 'grey',
    }}>
      Name
    </h1>
  )}
  <input
    type="text"
    placeholder="Name"
    maxLength={25}
    style={{
      width: '755px',
      height: '60px',
      fontSize: '35px',
      padding: '10px',
      paddingLeft: '25px',
      outline: 'none',
      border: '4px solid #F4F4F4',
      borderRadius: '10px',
      fontFamily: "'montserrat', sans-serif",
      fontWeight: 'bold',
      marginBottom: '20px'
    }}
    value={assignmentName}
    onChange={(e) => setAssignmentName(e.target.value)}
  />
  <span style={{
    position: 'absolute',
    right: '10px',
    bottom: '30px',
    fontSize: '14px',
    color: 'grey',
    fontFamily: "'montserrat', sans-serif",
  }}>
    {assignmentName.length}/25
  </span>
</div>
          <div style={{ marginBottom: '20px', width: '790px', height: '200px', borderRadius: '10px',  border: '4px solid #F4F4F4' }}>
            <div style={{ width: '730px', marginLeft: '20px', height: '80px', borderBottom: '4px solid lightgrey', display: 'flex', position: 'relative', alignItems: 'center', borderRadius: '0px', padding: '10px' }}>
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
                      border: '4px solid transparent',
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

            <div style={{ width: '730px', marginLeft: '20px', height: '80px', display: 'flex', position: 'relative', alignItems: 'center', borderRadius: '0px', padding: '10px' }}>
              <h1 style={{ fontSize: '30px', color: 'black', width: '300px', paddingLeft: '0px' }}>Half Credit</h1>
              <input
                style={{marginLeft: '370px'}}
                type="checkbox"
                className="greenSwitch"
                checked={halfCredit}
                onChange={() => setHalfCredit(!halfCredit)}
              />
            </div>
           
          </div>

        {/* Timer Button and Settings */}
<div style={{ width: '770px', padding: '10px',  border: '4px solid #F4F4F4', borderRadius: '10px' }}>
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
    <h1 style={{ fontSize: '30px', marginLeft: '20px', marginRight: 'auto',fontFamily: "'montserrat', sans-serif" }}> Dates</h1>
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
<div style={{ width: '770px', padding: '10px', marginTop: '20px',  border: '4px solid #F4F4F4', borderRadius: '10px', marginBottom: '20px' }}>
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
    <h1 style={{ fontSize: '30px', marginRight: 'auto', marginLeft: '20px', fontFamily: "'montserrat', sans-serif" }}>Select Students</h1>
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
<div style={{ width: '770px', padding: '10px', marginTop: '20px',  border: '4px solid #F4F4F4', borderRadius: '10px', marginBottom: '20px' }}>
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
    <h1 style={{ fontSize: '30px', marginLeft: '0px', marginRight: 'auto', fontFamily: "'montserrat', sans-serif" }}>Generate Questions</h1>
    <img
      src={contentDropdownOpen ? '/Up.png' : '/Down.png'}
      alt={contentDropdownOpen ? "Collapse" : "Expand"}
      style={{ width: '20px' }}
    />
  </button>

  <div className={`dropdown-content ${contentDropdownOpen ? 'open' : ''}`}>
    <div style={{ marginTop: '0px' }}>
      {/* Questions Section */}
    
      {/* Source Section */}
      <div style={{ width: '740px', marginLeft: '20px', }}>
               
                   
               <textarea
                 placeholder="Paste source here"
                 value={sourceText}
                 onChange={(e) => setSourceText(e.target.value)}
                 style={{
                   width: '688px',
                   height: '100px',
                   marginTop: '30px',
                   fontSize: '16px',
                   background: '#F4F4F4',
                   padding: '20px 20px',
                   border: 'none',
                   outline: 'none',
                   borderRadius: '10px',
                   resize: 'vertical'
                 }}
               />
             

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
                          fontFamily: "'montserrat', sans-serif",
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
    {/* Generate Questions Button */}
  {/* Generate Questions Button */}
  {sourceText.trim() !== '' && (
  <div style={{ display: 'flex', alignItems: 'center', marginTop: '20px' }}>
    <button
      onClick={async () => {
        if (generatedQuestions.length > 0) {
          setShowPreview(true);
        } else {
          setGenerating(true);
          try {
            const questions = await GenerateASAQ(sourceText, questionBank, additionalInstructions, classId, teacherId);
     
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
<div style={{ width: '770px', padding: '10px', marginTop: '20px',  border: '4px solid #F4F4F4', borderRadius: '10px', marginBottom: '20px' }}>
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
    <h1 style={{ fontSize: '30px', marginLeft: '20px', marginRight: 'auto',fontFamily: "'montserrat', sans-serif" }}>Security</h1>
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

export default SAQA;
