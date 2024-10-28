import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, setDoc,updateDoc, writeBatch, arrayUnion, serverTimestamp } from 'firebase/firestore';

import { CalendarCog, SquareDashedMousePointer, Sparkles, GlobeLock, PencilRuler, Eye, SendHorizonal, SquareX, ChevronUp, ChevronDown,  } from 'lucide-react';
import { db } from '../../Universal/firebase';  // Ensure the path is correct
import TeacherPreviewASAQ from './PreviewASAQ';
import { auth } from '../../Universal/firebase';
import '../../Universal//SwitchGreen.css';
import SelectStudents from './SelectStudents';
import Navbar from '../../Universal/Navbar';
import CustomDateTimePicker from './CustomDateTimePicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import DateSettings, { formatDate } from './DateSettings';
import SecuritySettings from './SecuritySettings';
import SelectStudentsDW from './SelectStudentsDW';

import CustomExpandingFormatSelector from './ExpandingFormatSelector';
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
  
  const [assignmentType, setAssignmentType] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('ASAQ');
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
  const location = useLocation();
  
  const [isAdaptive, setIsAdaptive] = useState(true);
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

  const GenerateASAQ = async (sourceText, questionCount, additionalInstructions, classId) => {
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
        // Remove the "Questions: " prefix if it exists
        questionsString = questionsString.replace(/^Questions:\s*/, '');
        
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
  useEffect(() => {
    if (location.state) {
      const { assignmentType, isAdaptive } = location.state;
      setAssignmentType(assignmentType);
      setIsAdaptive(isAdaptive);
    }
  }, [location.state]);
  const saveAssignment = async () => {
    const finalAssignmentId = assignmentId.startsWith('DRAFT') ? assignmentId.slice(5) : assignmentId;
  
    const assignmentData = {
      classId,
      assignmentName,
      timer: timerOn ? timer : 0,
      halfCredit,
      assignmentType,
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
    generatedQuestions.forEach((question, index) => {
      assignmentData.questions[`question${index + 1}`] = {
        question: question.question,
        rubric: question.rubric
      };
    });
      const collectionName = `assignments(Asaq)`;
      const assignmentRef = doc(db, collectionName, finalAssignmentId);
      await setDoc(assignmentRef, assignmentData);
    
      // Update the class document
      const classRef = doc(db, 'classes', classId);
      await updateDoc(classRef, {
        [`assignment(${assignmentType.toLowerCase()})`]: arrayUnion(finalAssignmentId)
      });
    
      // Remove the draft if it exists
 
    
      // Assign to students
      await assignToStudents(finalAssignmentId);
    
      navigate(`/class/${classId}`, {
        state: {
          successMessage: `Success: ${assignmentName} published`,
          assignmentId: finalAssignmentId,
          format: 'ASAQ'
        }
      });
    };
  
  
  

  const renderForm = () => {
    return (
      <div style={{ marginTop: '150px', width: '860px', padding: '15px', marginLeft: 'auto', marginRight: 'auto', fontFamily: "'montserrat', sans-serif", background: 'white', borderRadius: '25px', 
        boxShadow: '1px 1px 10px 1px rgb(0,0,155,.1)'}}>
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
                  color: '#D800FB',
                  fontSize: '24px',
                  cursor: 'pointer'
                }}
              >
                <SquareX size={50} style={{ marginTop: '30px', marginRight: '40px'}}/>
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
        
        <div style={{marginLeft: '30px'}}>
        <div style={{ marginLeft: '0px',  fontFamily: "'montserrat', sans-serif", color: 'black', fontSize: '60px', display: 'flex',marginTop: '20px', marginBottom: '40px', fontWeight: 'bold' }}>
        Create
     
        <CustomExpandingFormatSelector
  classId={classId}
  selectedFormat={selectedFormat}
  onFormatChange={(newFormat) => {
    setSelectedFormat(newFormat);
    // Any additional logic you want to run when the format changes
  }}
/>
          
        </div>
        <div style={{ width: '100%', padding: '20px', border: '10px solid transparent', borderRadius: '30px' , marginTop: '-30px', marginLeft: '-30px'}}>
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
      border: ' 2px solid #f4f4f4',
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
    right: '50px',
    bottom: '30px',
    fontSize: '14px',
    color: 'grey',
    fontFamily: "'montserrat', sans-serif",
  }}>
    {assignmentName.length}/25
  </span>
</div>
          <div style={{ marginBottom: '20px', width: '790px', height: '200px', borderRadius: '10px',  border: ' 2px solid #f4f4f4' }}>
            <div style={{ width: '730px', marginLeft: '20px', height: '80px', borderBottom: ' 2px solid #f4f4f4', display: 'flex', position: 'relative', alignItems: 'center', borderRadius: '0px', padding: '10px' }}>
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
                      fontFamily: "'montserrat', sans-serif",
                      border: '4px solid transparent',
                      outline: 'none',
                      borderRadius: '5px',
                      fontWeight: '600',
                      fontSize: '30px',
                    }}
                    placeholder="10"
                    value={timer}
                    onChange={(e) => setTimer(e.target.value)}
                  />
                  <h1 style={{ marginLeft: '-5px',
                  fontWeight: '600',fontSize:'26px' }} >Minutes</h1>
                </div>
              ) : (
                <span style={{
                  marginLeft: '-150px',
                  height: '30px',
                  width: '50px',
                  fontWeight: '600',
                  textAlign: 'center',
                  marginTop: '0px',
                  fontSize: '30px',  fontFamily: "'montserrat', sans-serif",
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




          <SelectStudentsDW
          classId={classId}
          selectedStudents={selectedStudents}
          setSelectedStudents={setSelectedStudents}
        />
 
          <DateSettings
          assignDate={assignDate}
          setAssignDate={setAssignDate}
          dueDate={dueDate}
          setDueDate={setDueDate}
        />


          <SecuritySettings
          saveAndExit={saveAndExit}
          setSaveAndExit={setSaveAndExit}
          lockdown={lockdown}
          setLockdown={setLockdown}
        />
















 
{/* Content Dropdown */}
<div style={{ width: '770px', padding: '10px', marginTop: '20px',  border: ' 2px solid #f4f4f4', borderRadius: '10px', marginBottom: '20px' }}>
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

<Sparkles size={40} color="#000000" />
  
  
<h1 style={{ fontSize: '30px', marginLeft: '20px', marginRight: 'auto',  fontFamily: "'montserrat', sans-serif"}}>Generate Questions</h1>
{contentDropdownOpen ? <ChevronUp style={{color: 'grey'}}/> : <ChevronDown style={{color: 'grey'}}/>}
            
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
                      <h1 style={{ marginTop: '20px', color: 'grey', display: 'flex', fontSize: '25px', alignItems: 'center',   fontWeight: '600', }}>
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
                           border: ' 2px solid #f4f4f4',
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
        width: '180px',
        fontWeight: 'bold',
        height: '50px',
        padding: '10px',
        fontSize: '24px',
        backgroundColor: generating ? 'lightgrey' : 
                        generatedQuestions.length > 0 ? '#FCD3FF' : '#FCD3FF',
        color: 'white',
        borderRadius: '10px',
        border: generating ? '4px solid lightgrey' : 
                generatedQuestions.length > 0 ? '4px solid #D800FB' : '4px solid #D800FB',
        cursor: generating ? 'default' : 'pointer',
        transition: 'box-shadow 0.3s ease',
      }}
     
    >
    {generating ? 'Generating...' : 
       generatedQuestions.length > 0 ? 
       <div style={{ display: 'flex', marginTop: '-4px' }}> 
       
           <Eye size={30} color="#D800FB" strokeWidth={2.5} />
           <h1 style={{
             fontSize: '25px',  
             marginTop: '0px', 
             color: '#D800FB', 
             marginLeft: '10px',
             fontFamily: "'montserrat', sans-serif",
           }}>Preview</h1>
         </div>
       : <div style={{ display: 'flex', marginTop: '-4px' }}> 
           <Sparkles size={30} color="#E441FF" strokeWidth={3} />
           <h1 style={{
             fontSize: '25px',  
             marginTop: '0px', 
             marginLeft: '4px', 
             color: '#E441FF', 
             fontFamily: "'montserrat', sans-serif",
           }}>Generate</h1>
         </div>}
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




          <div style={{ display: 'flex', justifyContent: 'space-between', width: '796px',height: '50px' }}>
         
          <button
              
             
              style={{
                width: '270px',
                height: '60px',
                marginTop: '0px',
                border: '4px solid lightgrey',
                marginBottom: '40px',
                backgroundColor: '#f4f4f4',
                color: 'grey',
                borderRadius: '10px',
                fontSize: '20px',fontFamily: "'montserrat', sans-serif",  
                fontWeight: 'bold',
                display: 'flex',
                cursor: 'pointer',
                transition: 'border-color 0.3s ease',
              }}
              onMouseEnter={(e) => e.target.style.borderColor = 'grey'}
              onMouseLeave={(e) => e.target.style.borderColor = 'lightgrey'}
            >
             <PencilRuler size={40} style={{marginLeft: '0px', marginTop: '5px', background: 'transparent'}} /> <h1 style={{fontSize: '25px', marginTop: '10px', marginLeft: '15px',background: 'transparent'}}>Save As Draft</h1>
            </button>
            <button
              onClick={saveAssignment}
              disabled={!assignmentName || generatedQuestions.length === 0}
style={{
  width: '480px',
  height: '60px',
  marginTop: '0px',
  border: '4px solid ',
  marginBottom: '40px',
  marginLeft: '0px',
  opacity: (!assignmentName || generatedQuestions.length === 0) ? '0%' : '100%',
  backgroundColor: (!assignmentName || generatedQuestions.length === 0) ? '#f4f4f4' : '#A6FFAF',
  color: (!assignmentName || generatedQuestions.length === 0) ? 'lightgrey' : '#00D409',
  
  borderColor: (!assignmentName || generatedQuestions.length === 0) ? 'lightgrey' : '#00D409',
  borderRadius: '10px',
  fontSize: '20px',
  fontFamily: "'montserrat', sans-serif",  
  fontWeight: 'bold',
  cursor: (!assignmentName || generatedQuestions.length === 0) ? 'default' : 'pointer',
  display: 'flex',
  transition: 'background-color 0.3s ease',
}}
onMouseEnter={(e) => {
  if (assignmentName && generatedQuestions.length > 0) {
    e.target.style.borderColor = '#2BB514';
  }
}}
onMouseLeave={(e) => {
  if (assignmentName && generatedQuestions.length > 0) {
    e.target.style.borderColor = '#00D409';
  }
}}
            >
              <h1 style={{fontSize: '25px', marginTop: '10px', marginLeft: '15px',background: 'transparent'}}>Publish</h1>
              <SendHorizonal size={40} style={{marginLeft: 'auto', marginTop: '5px', background: 'transparent'}} /> 
            </button>
          </div>
        </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#fcfcfc'
    }}> <Navbar userType="teacher" />
      {renderForm()}
    </div>
  );
}

export default SAQA;
