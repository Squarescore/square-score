import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, writeBatch, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { deleteDoc } from 'firebase/firestore';
import { CalendarCog, SquareDashedMousePointer, Sparkles, GlobeLock, EyeOff, Landmark, Eye, User, PencilRuler, SendHorizonal, Folder, SquareX  } from 'lucide-react';
import { db } from '../../Universal/firebase'; // Ensure the path is correct
import TeacherPreview from './PreviewSAQ';
import { setDoc, updateDoc } from 'firebase/firestore';
import '../../Universal/SwitchGreen.css';
import SelectStudents from './SelectStudents';
import Navbar from '../../Universal/Navbar';
import CustomDateTimePicker from './CustomDateTimePicker';
import DateSettings, { formatDate } from './DateSettings';
import SecuritySettings from './SecuritySettings';
import SelectStudentsDW from './SelectStudentsDW';


import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import { arrayRemove } from 'firebase/firestore';
import { useLocation } from 'react-router-dom';
import { auth } from '../../Universal/firebase';
import CustomExpandingFormatSelector from './ExpandingFormatSelector';
import AnimationAll from '../../Universal/AnimationAll';

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
  const [assignmentData, setAssignmentData] = useState(null);

  const [dueDate, setDueDate] = useState(new Date(new Date().getTime() + 48 * 60 * 60 * 1000)); // 48 hours from now
  const [timerOn, setTimerOn] = useState(false);
  
  const [assignmentType, setAssignmentType] = useState('');
  const [isAdaptive, setIsAdaptive] = useState(false);
  const [sourceOption, setSourceOption] = useState(null);
  const [sourceText, setSourceText] = useState('');
  const [questionBank, setQuestionBank] = useState('10');
  const [questionStudent, setQuestionStudent] = useState('5');
  const [additionalInstructions, setAdditionalInstructions] = useState(['']);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [showAdditionalInstructions, setShowAdditionalInstructions] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [questionsGenerated, setQuestionsGenerated] = useState(false);

  const [draftId, setDraftId] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('SAQ');
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);






  useEffect(() => {
    if (location.state) {
      const { assignmentType, isAdaptive } = location.state;
      setAssignmentType(assignmentType);
      setIsAdaptive(isAdaptive);
    }
  }, [location.state]);
  
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
      setSaveAndExit(data.saveAndExit !== undefined ? data.saveAndExit : true);
      setLockdown(data.lockdown || false);
      setQuestionBank(data.questionBank || '10');
      setQuestionStudent(data.questionStudent || '5');
      setAssignmentType(data.assignmentType || 'SAQ');
      setIsAdaptive(data.isAdaptive || false);
      setAdditionalInstructions(data.additionalInstructions || '');
  
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
        setSourceText(data.sourceText || '');
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
      assignmentType,
      isAdaptive,
      sourceText,
      questions: generatedQuestions.reduce((acc, question) => {
        acc[question.questionId] = {
          question: question.question,
          rubric: question.rubric
        };
        return acc;
      }, {}),
    };
  
    const draftRef = doc(db, 'drafts', assignmentId);
    await setDoc(draftRef, draftData);
  
    // Update the class document with the new draft ID
    const classRef = doc(db, 'classes', classId);
    await updateDoc(classRef, {
      [`assignment(${assignmentType.toLowerCase()})`]: arrayUnion(assignmentId)
    });
  
    navigate(`/class/${classId}/Assignments`, {
      state: { showDrafts: true, newDraftId: assignmentId }
    });
  };
  const saveAssignment = async () => {
    const finalAssignmentId = assignmentId.startsWith('DRAFT') ? assignmentId.slice(5) : assignmentId;
  
    const assignmentData = {
      classId,
      assignmentName,
      timer: timerOn ? Number(timer) : 0,
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
      saveAndExit,
      assignmentType,
      isAdaptive,
      additionalInstructions,
    };
    generatedQuestions.forEach((question, index) => {
      assignmentData.questions[`question${index + 1}`] = {
        question: question.question,
        rubric: question.rubric
      };
    });
    const collectionName = `assignments(${assignmentType.toLowerCase()})`;
    const assignmentRef = doc(db, collectionName, finalAssignmentId);
    await setDoc(assignmentRef, assignmentData);
  
    // Update the class document
    const classRef = doc(db, 'classes', classId);
    await updateDoc(classRef, {
      [`assignment(${assignmentType.toLowerCase()})`]: arrayUnion(finalAssignmentId)
    });
  
    // Remove the draft if it exists
    if (draftId) {
      const draftRef = doc(db, 'drafts', draftId);
      await deleteDoc(draftRef);
    }
  
    // Assign to students
    await assignToStudents(finalAssignmentId);
  
    navigate(`/class/${classId}`, {
      state: {
        successMessage: `Success: ${assignmentName} published`,
        assignmentId: finalAssignmentId,
        format: assignmentType
      }
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

  const isFormValid = () => {
    return assignmentName !== '' && assignDate !== '' && dueDate !== '';
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
                <div style={{marginTop: '-10px', marginLeft: '-9px', fontSize: '60px', fontWeight: 'bold'}}>
                <SquareX size={40} color="#D800FB" strokeWidth={3} /></div>
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
       









                <div style={{marginLeft: '30px'}}>
       <div style={{ marginLeft: '0px',  fontFamily: "'montserrat', sans-serif", color: 'black', fontSize: '60px', display: 'flex',marginTop: '60px', marginBottom: '40px', fontWeight: 'bold' }}>
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

        <div style={{ position: 'relative' }}>
        <div style={{ position: 'relative' }}>
  {assignmentName && (
    <h1 style={{
      position: 'absolute',
      left: '30px',
      top: '-25px',
      zIndex: '20',
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
      border: '2px solid #eeeeee',
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

          <div style={{ marginBottom: '20px', width: '790px', height: '190px', borderRadius: '10px',  border: '2px solid #eeeeee' }}>
         
         
         <div style={{display: 'flex', borderBottom: '2px solid #eeeeee', width: '750px', marginLeft: '20px'}}>
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
                      fontFamily: "'montserrat', sans-serif" 
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
                 
                    fontFamily: "'montserrat', sans-serif" ,
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
                    
                    fontFamily: "'montserrat', sans-serif" ,
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
<div style={{ width: '770px', padding: '10px', marginTop: '20px',  border: '2px solid #eeeeee', borderRadius: '10px', marginBottom: '20px', zIndex: '-1' }}>
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
        style={{ width: '50px', fontWeight:'bold',marginBottom: '0px', textAlign: 'center' ,fontFamily: "'montserrat', sans-serif", marginTop: '25px', marginLeft: 'auto', marginRight: '20px',padding: '0px', paddingLeft: '15px', height: '35px', fontSize: '30px',  border: '2px solid #eeeeee', borderRadius: '10px' }}
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
        style={{ width: '50px', fontWeight:'bold',marginBottom: '10px',fontFamily: "'montserrat', sans-serif",marginTop: '25px', textAlign: 'center' , marginLeft: 'auto', marginRight: '20px',padding: '0px', paddingLeft: '15px',fontSize: '30px', height: '35px', border: '2px solid #eeeeee', borderRadius: '10px' }}
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
                          fontFamily: "'montserrat', sans-serif",
                          borderRadius: '10px',
                           border: '2px solid #eeeeee',
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
    marginTop: '10px', 
    marginBottom: '20px',
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



          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
           


            <button
               onClick={saveDraft}
             
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
  width: '530px',
  height: '60px',
  marginTop: '0px',
  border: '4px solid ',
  marginBottom: '40px',
  
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
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
      <Navbar userType="teacher" />
      {renderForm()}
    </div>
  );
}

export default CreateAssignment;
