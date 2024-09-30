import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, writeBatch, arrayUnion, serverTimestamp } from 'firebase/firestore';

import { CalendarCog, SquareDashedMousePointer, Sparkles, GlobeLock, EyeOff, Landmark, Eye, User  } from 'lucide-react';
import { db } from './firebase'; // Ensure the path is correct
import TeacherPreview from './PreviewSAQ';
import { setDoc, updateDoc } from 'firebase/firestore';
import './SwitchGreen.css';
import SelectStudents from './SelectStudents';
import Navbar from './Navbar';
import CustomDateTimePicker from './CustomDateTimePicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import { arrayRemove } from 'firebase/firestore';
import { useLocation } from 'react-router-dom';
import { auth } from './firebase';
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
  const [showPreview, setShowPreview] = useState(false);
  const [className, setClassName] = useState('');
  const [assignmentName, setAssignmentName] = useState('');
  const [timer, setTimer] = useState('10');
  const [halfCredit, setHalfCredit] = useState(false);
  const [securityDropdownOpen, setSecurityDropdownOpen] = useState(false);
  const [saveAndExit, setSaveAndExit] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [lockdown, setLockdown] = useState(false);
  const location = useLocation();
  const [scaleMin, setScaleMin] = useState('0');
  const [scaleMax, setScaleMax] = useState('2');
  const [teacherId, setTeacherId] = useState(null);
  const [contentDropdownOpen, setContentDropdownOpen] = useState(false);
  const [studentsDropdownOpen, setStudentsDropdownOpen] = useState(false);
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
  const [assignDate, setAssignDate] = useState(new Date());

  const [dueDate, setDueDate] = useState(new Date(new Date().getTime() + 48 * 60 * 60 * 1000)); // 48 hours from now

  const [sourceOption, setSourceOption] = useState(null);
  const [sourceText, setSourceText] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [questionBank, setQuestionBank] = useState('10');
  const [questionStudent, setQuestionStudent] = useState('5');
  const [timerOn, setTimerOn] = useState(false);
  const [additionalInstructions, setAdditionalInstructions] = useState(['']);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [showAdditionalInstructions, setShowAdditionalInstructions] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [questionsGenerated, setQuestionsGenerated] = useState(false);

  const [draftId, setDraftId] = useState(null);

  
  useEffect(() => {
    // Set due date to 48 hours after assign date whenever assign date changes
    setDueDate(new Date(assignDate.getTime() + 48 * 60 * 60 * 1000));
  }, [assignDate]);
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
  
      // Get the current user's UID (teacher ID)
      const user = auth.currentUser;
      if (user) {
        setTeacherId(user.uid);
      } else {
        console.error("No authenticated user found");
      }
    };
    fetchTeacherId();
 

    // Check if we're loading from a draft
    if (assignmentId && assignmentId.startsWith('DRAFT')) {
      setDraftId(assignmentId.slice(5)); // Remove 'DRAFT' prefix
      loadDraft(assignmentId.slice(5));
    }
  }, [classId, assignmentId]);


  const loadDraft = async (draftId) => {
    const draftRef = doc(db, 'drafts', draftId);
    const draftDoc = await getDoc(draftRef);
    if (draftDoc.exists) {
      const data = draftDoc.data();
      setAssignmentName(data.assignmentName || '');
      setTimer(data.timer || '0');
      setTimerOn(data.timerOn || false);
      setHalfCredit(data.halfCredit || false);
      setScaleMin(data.scale?.min || '0');
      setScaleMax(data.scale?.max || '2');
      
      const loadedAssignDate = data.assignDate ? new Date(data.assignDate) : new Date();
      setAssignDate(loadedAssignDate);
      
      if (data.dueDate) {
        setDueDate(new Date(data.dueDate));
      } else {
        setDueDate(new Date(loadedAssignDate.getTime() + 48 * 60 * 60 * 1000));
      }
  
      setSelectedStudents(new Set(data.selectedStudents || []));
      setSaveAndExit(data.saveAndExit || true);
      setLockdown(data.lockdown || false);
      setQuestionBank(data.questionBank || '10');
      setQuestionStudent(data.questionStudent || '5');
  
      // Load generated questions if they exist
      if (data.questions && Object.keys(data.questions).length > 0) {
        const loadedQuestions = Object.entries(data.questions).map(([id, questionData]) => ({
          questionId: id,
          ...questionData
        }));
        setGeneratedQuestions(loadedQuestions);
        setQuestionsGenerated(true);
        setSourceOption('text');
        setSourceText("Questions have already been generated. Click 'Preview Questions' to view or regenerate.");
      } else {
        setGeneratedQuestions([]);
        setQuestionsGenerated(false);
        setSourceText('');
      }
    }
  };
  useEffect(() => {
    if (location.state && location.state.questions) {
      setGeneratedQuestions(location.state.questions);
    }
  }, [location]);

  const saveDraft = async () => {
    const draftData = {
      classId,
      assignmentName,
      timer: timerOn ? timer : '0',
      timerOn,
      halfCredit,
      scale: {
        min: scaleMin,
        max: scaleMax,
      },
      assignDate: formatDate(assignDate),
      dueDate: formatDate(dueDate),
      selectedStudents: Array.from(selectedStudents),
      saveAndExit,
      lockdown,
      questionBank,
      questionStudent,
      createdAt: serverTimestamp(),
    };
  
    // Only include questions if they have been generated
    if (generatedQuestions.length > 0) {
      draftData.questions = {};
      generatedQuestions.forEach((question, index) => {
        const questionId = `question${index + 1}`;
        draftData.questions[questionId] = {
          question: question.question,
          expectedResponse: question.expectedResponse
        };
      });
    }
  
    const newDraftId = draftId || `${classId}+${Date.now()}+SAQ`;
    const draftRef = doc(db, 'drafts', newDraftId);
    
    await setDoc(draftRef, draftData);
  
    // Update the class document with the new draft ID
    const classRef = doc(db, 'classes', classId);
    await updateDoc(classRef, {
      [`assignment(saq)`]: arrayUnion(newDraftId)
    });
  
    setDraftId(newDraftId);
    
    navigate(`/class/${classId}/Assignments`, {
      state: { showDrafts: true, newDraftId: newDraftId }
    });
  };
  

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

 const convertToDateTime = (date) => {
  return formatDate(new Date(date));
};
    
const formatDate = (date) => {
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  };
  
  const formattedDate = date.toLocaleString('en-US', options);
  
  // Remove commas and adjust the format
  return formattedDate
    .replace(',', '') // Remove the comma after the day of week
    .replace(',', '') // Remove the comma after the day
    .replace(' at ', ' ') // Remove 'at'
    .replace(/(\d{1,2}):(\d{2}):00/, '$1:$2') // Remove seconds
    .replace(' PM', ' PM ') // Add space before timezone
    .replace(' AM', ' AM '); // Add space before timezone
};
const GenerateSAQ = async (sourceText, questionCount, additionalInstructions, classId) => {
  try {
    const response = await axios.post('https://us-central1-square-score-ai.cloudfunctions.net/GenerateSAQ', {
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

    if (Array.isArray(data)) {
      const questionsWithIds = data.map((question, index) => ({
        questionId: `${assignmentId}(question${index + 1})`,
        ...question
      }));
      console.log('Generated questions:', questionsWithIds);
      setGeneratedQuestions(questionsWithIds);
      setQuestionsGenerated(true);
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
    // Remove 'DRAFT' prefix from assignmentId if it exists
    const finalAssignmentId = assignmentId.startsWith('DRAFT') ? assignmentId.slice(5) : assignmentId;

    const assignmentData = {
      classId,
      assignmentName,
      timer: timerOn ? timer : 0,
      halfCredit,
      assignDate: formatDate(assignDate),
    dueDate: formatDate(dueDate),
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
  
    const assignmentRef = doc(db, 'assignments(saq)', finalAssignmentId);
    
    const batch = writeBatch(db);
  
    batch.set(assignmentRef, assignmentData);
    generatedQuestions.forEach((question, index) => {
      const questionId = `${finalAssignmentId}(question${index + 1})`;
      assignmentData.questions[questionId] = {
        question: question.question,
        expectedResponse: question.expectedResponse
      };
    });
  
    batch.update(assignmentRef, { questions: assignmentData.questions });
  
    // Delete the draft document if it exists
    if (draftId) {
      const draftRef = doc(db, 'drafts', draftId);
      batch.delete(draftRef);
  
      // Update the class document
      const classRef = doc(db, 'classes', classId);
      batch.update(classRef, {
        [`assignment(saq)`]: arrayRemove(assignmentId) // Remove the draft ID (with DRAFT prefix)
      });
      batch.update(classRef, {
        [`assignment(saq)`]: arrayUnion(finalAssignmentId) // Add the final assignment ID
      });
    }
  
    await batch.commit();
  
    // Assign to students (this now works for both new and drafted assignments)
    await assignToStudents(finalAssignmentId);
  
    console.log('Assignment saved and draft deleted from Firebase:', assignmentData);
  
    const format = finalAssignmentId.split('+').pop(); // Get the format from the assignment ID

    navigate(`/class/${classId}`, {
      state: {
        successMessage: `Success: ${assignmentName} published`,
        assignmentId: finalAssignmentId,
        format: format
      }
    });
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
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 100
          }}>
            <div style={{position: 'relative'}}>
              <button
                onClick={handlePreviewToggle}
                style={{
                  position: 'absolute',
                  top: '0px',
                  right: '30px',
                  zIndex: '990',
                  height: '34px', 
                  width: '34px',
                  borderRadius: '6px',
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  
                }}
              >
                <div style={{marginTop: '-20px', marginLeft: '-9px', fontSize: '60px', fontWeight: 'bold'}}>
                <EyeOff size={40} color="#00B1A6" strokeWidth={3} /></div>
              </button>
              <TeacherPreview
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
       
        <h1 style={{ marginLeft: '0px',  fontFamily: "'Rajdhani', sans-serif", color: 'black', fontSize: '80px', display: 'flex', marginBottom: '-20px' }}>
          Create (<h1 style={{ fontSize: '70px', marginTop: '10px', marginLeft: '0px', color: '#020CFF' }}> SAQ </h1>)
        </h1>
        <div style={{ position: 'relative' }}>
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
      color: 'black',
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
      fontFamily: "'Radio Canada', sans-serif",
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
    fontFamily: "'Radio Canada', sans-serif",
  }}>
    {assignmentName.length}/25
  </span>
</div>

          <div style={{ marginBottom: '20px', width: '790px', height: '190px', borderRadius: '10px',  border: '4px solid #F4F4F4' }}>
         
         
         <div style={{display: 'flex', borderBottom: '4px solid #f4f4f4', width: '750px', marginLeft: '20px'}}>
            <div style={{ width: '390px',   marginLeft: '0px', height: '80px', display: 'flex', position: 'relative', alignItems: 'center', borderRadius: '0px', padding: '10px' }}>
              <h1 style={{ fontSize: '30px', color: 'black', width: '300px', paddingLeft: '0px' }}>Timer:</h1>
             
              {timerOn ? (
                <div style={{display: 'flex', alignItems: 'center',  position: 'absolute',
                  left: '120px',
                  height: '25px'}}>  
                  <input
                    type="number"
                    style={{
                      
                      height: '30px',
                      width: '65px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      border: '4px solid transparent',
                      outline: 'none',
                      borderRadius: '5px',
                      fontSize: '25px',
                      fontFamily: "'Radio Canada', sans-serif" 
                    }}
                    placeholder="10"
                    value={timer}
                    onChange={(e) => setTimer(e.target.value)}
                  />
                  <h1 style={{ marginLeft: '-5px',fontSize:'25px' ,  }} >Minutes</h1>
                </div>
              ) : (
                <span style={{
                  position: 'absolute',
                  left: '150px',
                  height: '25px',
                  
                  width: '50px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  marginTop: '0px',
                  fontSize: '25px',
                 
                  color: 'grey'
                }}>
                  Off
                </span>
              )}
              <input
                style={{marginLeft: 'auto', marginRight: '20px'}}
                type="checkbox"
                className="greenSwitch"
                checked={timerOn}
                onChange={() => setTimerOn(!timerOn)}
              />
            </div>
              < div style={{height: '50px', width: '4px', background: '#f4f4f4', marginTop: '25px'}}></div>
            <div style={{ width: '330px', marginLeft: '20px', height: '80px', display: 'flex', position: 'relative', alignItems: 'center', borderRadius: '0px', padding: '10px' }}>
              <h1 style={{ fontSize: '30px', color: 'black', width: '200px', paddingLeft: '0px' }}>Half Credit</h1>
              <input
                style={{marginLeft: '40px'}}
                type="checkbox"
                className="greenSwitch"
                checked={halfCredit}
                onChange={() => setHalfCredit(!halfCredit)}
              />
            </div>
            </div>





            <div style={{ width: '750px', height: '60px', border: '4px solid transparent', display: 'flex', position: 'relative', alignItems: 'center', borderRadius: '10px', padding: '10px' }}>
              <h1 style={{ fontSize: '30px', color: 'black', width: '300px', paddingLeft: '10px' }}> Grading Scale</h1>
              <div style={{marginLeft: 'auto', marginTop: '45px'}}>
                <input
                  type="number"
                  placeholder="0"
                  style={{
                    width: '40px',
                    height: '20px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    fontSize: '30px',
                    marginLeft: '40px',
                    paddingLeft: '15px',
                    paddingTop: '10px',
                    paddingBottom: '10px',
                    borderRadius: '10px',
                 
                    fontFamily: "'Radio Canada', sans-serif" ,
                    color: 'black',
                    border: '4px solid #CC0000'
                  }}
                  value={scaleMin}
                  onChange={(e) => setScaleMin(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="2"
                  style={{
                    width: '40px',
                    height: '20px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    fontSize: '30px',
                    marginLeft: '40px',
                    paddingLeft: '15px',
                    paddingTop: '10px',
                    
                    fontFamily: "'Radio Canada', sans-serif" ,
                    paddingBottom: '10px',
                    borderRadius: '10px',
                    color: 'black',
                    border: '4px solid #00B064'
                  }}
                  value={scaleMax}
                  onChange={(e) => setScaleMax(e.target.value)}
                />
                <h4 style={{ fontSize: '40px', color: 'black', width: '30px', marginTop: '-50px', marginLeft: '115px' }}>-</h4>
              </div>
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
    <CalendarCog size={40} color="#000000" />
    <h1 style={{ fontSize: '30px', marginLeft: '20px', marginRight: 'auto', fontFamily: "'Radio Canada', sans-serif" }}> Dates</h1>
    <img
      src={timeDropdownOpen ? '/Up.png' : '/Down.png'}
      alt={timeDropdownOpen ? "Collapse" : "Expand"}
      style={{ width: '20px' }}
    />
  </button>

  <div className={`dropdown-content ${timeDropdownOpen ? 'open' : ''}`}>
    <div style={{ marginTop: '0px', display: 'flex', height: '100px'  }}>
      {/* Assign and Due Dates */}
      <div style={{  position: 'relative', alignItems: 'center', background: '#f4f4f4', height: '80px',borderRadius:'10px', width: '350px', paddingLeft: '10px', marginLeft: '10px', marginTop: '10px' }}>
        <h1 style={{  marginLeft: '15px',marginBottom: '-10px', fontSize: '25px', marginTop: '10px', color: '#4B4B4B'}}>Assign on:</h1>
        <div style={{ marginLeft: '-30px', zIndex: '100'  }}>
          <CustomDateTimePicker
            selected={assignDate}
            onChange={(date) => setAssignDate(date)}
            label="Assign Date"
          />
        </div>
      </div>
      <div style={{  position: 'relative', alignItems: 'center', background: '#f4f4f4',  borderRadius:'10px',height: '80px', marginLeft: 'auto', width: '350px',paddingLeft: '10px', marginTop: '10px', marginRight: '20px'  }}>
        <h1 style={{ marginLeft: '15px',marginBottom: '-10px', fontSize: '25px',marginTop: '10px', color: '#4B4B4B'}}>Due on:</h1>
        <div style={{ marginLeft: '-30px'  }}>
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
    <SquareDashedMousePointer size={40} color="#000000" />
    <h1 style={{ fontSize: '30px', marginRight: 'auto', marginLeft: '20px' ,fontFamily: "'Radio Canada', sans-serif"}}>Select Students</h1>
    <img
      src={studentsDropdownOpen ? '/Up.png' : '/Down.png'}
      alt={studentsDropdownOpen ? "Collapse" : "Expand"}
      style={{ width: '20px' }}
    />
  </button>

  <div className={`dropdown-content ${studentsDropdownOpen ? 'open' : ''}`}>
    <div style={{ marginTop: '0px' }}>
      <SelectStudents
        classId={classId}
        selectedStudents={selectedStudents}
        setSelectedStudents={setSelectedStudents}
      />
    </div>
  </div>
</div>

{/* Content Dropdown */}
<div style={{ width: '770px', padding: '10px', marginTop: '20px',  border: '4px solid #F4F4F4', borderRadius: '10px', marginBottom: '20px', zIndex: '-1' }}>
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
    <h1 style={{ fontSize: '30px', marginLeft: '20px', marginRight: 'auto',  fontFamily: "'Radio Canada', sans-serif"}}>Generate Questions</h1>
    <img
      src={contentDropdownOpen ? '/Up.png' : '/Down.png'}
      alt={contentDropdownOpen ? "Collapse" : "Expand"}
      style={{ width: '20px' }}
    />
  </button>

  <div className={`dropdown-content ${contentDropdownOpen ? 'open' : ''}`}>
    <div style={{ marginTop: '0px' }}>
      {/* Questions Section */}
      <div style={{display: 'flex', alignItems: 'center', position: 'relative'}}>
      <h2 style={{ fontSize: '25px', color: '#808080', marginBottom: '10px' , marginLeft: '20px', zIndex: '-1'}}>Questions:</h2>
    
      <div style={{display: 'flex', marginLeft: 'auto'}}>
      <div style={{display: 'flex', }}>

        <div style={{marginTop: '25px', marginRight: '10px'}}> 
        <Landmark size={40} color="#000000" /></div>
      <input
        type="number"
        placeholder="10"
        value={questionBank}
        onChange={(e) => setQuestionBank(e.target.value)}
        style={{ width: '50px', fontWeight:'bold',marginBottom: '0px', textAlign: 'center' ,fontFamily: "'Radio Canada', sans-serif", marginTop: '25px', marginLeft: 'auto', marginRight: '20px',padding: '0px', paddingLeft: '15px', height: '35px', fontSize: '30px',  border: '4px solid #f4f4f4', borderRadius: '10px' }}
      />
      </div>
      </div>

      <div style={{display: 'flex', marginLeft: '30px'}}>
        <div style={{marginTop: '25px', marginRight: '10px'}}> 
        <User size={40} color="#000000" /></div>
      <input
        type="number"
        placeholder="5"
        value={questionStudent}
        onChange={(e) => setQuestionStudent(e.target.value)}
        style={{ width: '50px', fontWeight:'bold',marginBottom: '10px',fontFamily: "'Radio Canada', sans-serif",marginTop: '25px', textAlign: 'center' , marginLeft: 'auto', marginRight: '20px',padding: '0px', paddingLeft: '15px',fontSize: '30px', height: '35px', border: '4px solid #f4f4f4', borderRadius: '10px' }}
        />
        </div>

      </div>


        </div>
      


        <div style={{width: '730px', background: '#f4f4f4', height: '3px', marginLeft: '20px', marginTop: '20px'}}></div>

     
     
      {/* Source Section */}
      <div style={{ width: '740px', marginLeft: '20px', }}>
               
                   
               <textarea
                 placeholder="Paste source here. No source? No problem - just type in your topic."
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
    {/* Generate Questions Button */}
    {sourceText.trim() !== '' && Number(questionBank) > 0 && Number(questionStudent) > 0 && (
   <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    marginTop: '-10px', 
    marginBottom: '10px',
    // Add this to create a container for the button that will have the shadow
    padding: '4px',
    borderRadius: '14px', // Slightly larger than the button's border-radius
    transition: 'box-shadow 0.3s ease',
  }}
 
  >
    <button
      onClick={async () => {
        if (questionsGenerated) {
          setShowPreview(true);
        } else {
          setGenerating(true);
          try {
            const questions = await GenerateSAQ(sourceText, questionBank, additionalInstructions, classId, teacherId);
            setGeneratedQuestions(questions);
            setQuestionsGenerated(true);
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
                        generatedQuestions.length > 0 ? '#A6B4FF' : '#FFEF9C',
        color: 'white',
        borderRadius: '10px',
        border: generating ? '4px solid lightgrey' : 
                generatedQuestions.length > 0 ? '4px solid #020CFF' : '4px solid #FCAC18',
        cursor: generating ? 'default' : 'pointer',
        boxShadow: generating ? 'none' : '0 4px 6px rgba(0, 0, 0, 0.1)',
        transition: 'box-shadow 0.3s ease',
      }}
      onMouseEnter={(e) => {
        if (!generating) {
          e.currentTarget.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.2)';
        }
      }}
      onMouseLeave={(e) => {
        if (!generating) {
          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        }
      }}
    >
      {generating ? 'Generating...' : 
       generatedQuestions.length > 0 ? 
       <div style={{ display: 'flex', marginTop: '-4px' }}> 
       
           <Eye size={30} color="#020CFF" strokeWidth={3} />
           <h1 style={{
             fontSize: '25px',  
             marginTop: '0px', 
             color: '#020CFF', 
             marginLeft: '10px',
             fontFamily: "'Radio Canada', sans-serif",
           }}>Preview</h1>
         </div>
       : <div style={{ display: 'flex', marginTop: '-4px' }}> 
           <Sparkles size={30} color="#FCAC18" strokeWidth={3} />
           <h1 style={{
             fontSize: '25px',  
             marginTop: '0px', 
             marginLeft: '4px', 
             color: '#FCAC18', 
             fontFamily: "'Radio Canada', sans-serif",
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
    <GlobeLock size={40} color="#000000" />
    <h1 style={{ fontSize: '30px', marginLeft: '20px', marginRight: 'auto',fontFamily: "'Radio Canada', sans-serif" }}>Security</h1>
    <img
      src={securityDropdownOpen ? '/Up.png' : '/Down.png'}
      alt={securityDropdownOpen ? "Collapse" : "Expand"}
      style={{ width: '20px' }}
    />
  </button>

  <div className={`dropdown-content ${securityDropdownOpen ? 'open' : ''}`}>
    <div style={{ marginTop: '0px', display: 'flex' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0px' }}>
        <h1 style={{ fontSize: '24px', color: '#333333', marginLeft: '20px', flex: 1, width: '270px' }}>Save & Exit</h1>
        <input
          style={{ marginRight: '20px' }}
          type="checkbox"
          className="greenSwitch"
          checked={saveAndExit}
          onChange={() => setSaveAndExit(!saveAndExit)}
        />
      </div>
      
      < div style={{height: '50px', width: '4px', background: '#f4f4f4', marginTop: '5px'}}></div>

      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h1 style={{ fontSize: '25px', color: '#333333', marginLeft: '40px', flex: 1 , width: '270px'}}>Lockdown</h1>
        <input
          style={{ marginRight: '10px' }}
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
                 onClick={saveDraft}
              style={{
                width: '400px',
                position: 'fixed',
                right: '-80px',
                border: '10px solid #E01FFF',
                borderRadius: '20px',
                top: '-40px',
                background: 'white',
                padding: '10px',
                zIndex: '90',
                fontSize: '24px',
                cursor: 'pointer',
                boxShadow: '0px 2px 2px 0px rgba(0, 0, 0, 0.25)',
              }}
            >
              <h1 style={{fontSize: '45px', width: '400px',  marginTop: '100px', marginLeft: '-50px', marginBottom: '0px', fontFamily: "'Rajdhani', sans-serif", }}>Save as Draft</h1>
            </button>
            <button
              onClick={saveAssignment}
              disabled={!assignmentName || generatedQuestions.length === 0}
              style={{
                width: '790px',
                height: '50px',
                marginTop: '0px',
                border: '4px solid #020CFF',
                marginBottom: '40px',
                backgroundColor: '#A6B4FF',
                color: '#020CFF',
                borderRadius: '10px',
                fontSize: '20px',fontFamily: "'Radio Canada', sans-serif",  
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#768CFF'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#A6B4FF'}
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
