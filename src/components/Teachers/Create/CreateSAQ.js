import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, writeBatch, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { deleteDoc } from 'firebase/firestore';
import { CalendarCog, SquareDashedMousePointer, Sparkles, GlobeLock, EyeOff, Landmark, Eye, User, PencilRuler, SendHorizonal, Folder, SquareX, ChevronUp, ChevronDown, FileText, CircleHelp  } from 'lucide-react';
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

import { v4 as uuidv4 } from 'uuid'; // Add this import at the top
import { AssignmentActionButtons, usePublishState } from './AssignmentActionButtons';

import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import { arrayRemove } from 'firebase/firestore';
import { useLocation } from 'react-router-dom';
import { auth } from '../../Universal/firebase';
import CustomExpandingFormatSelector from './ExpandingFormatSelector';
import AnimationAll from '../../Universal/AnimationAll';
import { AssignmentName, FormatSection, PreferencesSection, QuestionCountSection, TimerSection, ToggleSwitch } from './Elements';
import { safeClassUpdate, safeTeacherDataUpdate } from '../../teacherDataHelpers';

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

const SourcePreviewToggle = ({
  sourceText,
  onSourceChange,
  additionalInstructions,
  onAdditionalInstructionsChange,
  onPreviewClick,
  onGenerateClick,
  generating,
  generatedQuestions,
  questionBank,
  questionStudent,
  setQuestionBank,
  setQuestionStudent
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
            disabled={generating || sourceText.trim() === ''}
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
              cursor: generating ? 'default' : 'pointer',
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
                  fontFamily: "'montserrat', sans-serif",
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

  const [isSaving, setIsSaving] = useState(false);

  const LoaderScreen = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999
    }}>
      <div className="loader" style={{ marginBottom: '20px' }}></div>
      <div style={{
        fontFamily: "'montserrat', sans-serif",
        fontSize: '20px',
        color: 'lightgrey',
        fontWeight: '600'
      }}>
        Saving...
      </div>
    </div>
  );
  


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



  const saveAssignment = async () => {


    if (isSaving) return; // Prevent multiple clicks
    setIsSaving(true);

    try {


      const finalAssignmentId = assignmentId.startsWith('DRAFT') ? assignmentId.slice(5) : assignmentId;

      const assignmentData = {
        classId,
        format: 'SAQ',
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
        questions: generatedQuestions.reduce((acc, question) => {
          acc[question.questionId] = {
            question: question.question,
            rubric: question.rubric
          };
          return acc;
        }, {}),
        lockdown,
        saveAndExit,
        isAdaptive,
        additionalInstructions,
      };

      // Save to assignments collection
      const assignmentRef = doc(db, 'assignments', finalAssignmentId);
      await setDoc(assignmentRef, assignmentData);

      // Add assignment to class via Cloud Function
      await safeClassUpdate('addAssignmentToClass', { 
        classId, 
        assignmentId: finalAssignmentId, 
        assignmentName
      });

      // If publishing from a draft, remove the draft
      if (draftId) {
        const draftRef = doc(db, 'drafts', draftId);
        await deleteDoc(draftRef);

        // Move draft to assignment via Cloud Function
        await safeClassUpdate('moveDraftToAssignment', { 
          classId, 
          draftId, 
          assignmentId: finalAssignmentId, 
          assignmentName, 
        });
      }

      // Assign to students
      await assignToStudents(finalAssignmentId);

      // Navigate with success message
      navigate(`/class/${classId}`, {
        state: {
          successMessage: `Success: ${assignmentName} published`,
          assignmentId: finalAssignmentId,
          format: 'SAQ'
        }
      });
    } catch (error) {
      console.error("Error saving draft:", error);
      alert(`Error saving draft: ${error.message}. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };
  const saveDraft = async () => {
    if (isSaving) return; // Prevent multiple clicks
    setIsSaving(true);
    try {
      // Remove 'DRAFT' prefix if it exists
      const finalDraftId = assignmentId.startsWith('DRAFT') ? assignmentId.slice(5) : assignmentId;
  
      const draftData = {
        classId,
        assignmentName,
        timer: timerOn ? Number(timer) : 0,
        timerOn,
        halfCredit,
        assignDate: formatDate(assignDate),
        dueDate: formatDate(dueDate),
        scale: {
          min: scaleMin,
          max: scaleMax,
        },
        selectedStudents: Array.from(selectedStudents),
        saveAndExit,
        lockdown,
        questionBank,
        questionStudent,
        createdAt: serverTimestamp(),
        isAdaptive,
        sourceText,
        additionalInstructions,
        questions: generatedQuestions.reduce((acc, question) => {
          acc[question.questionId] = {
            question: question.question,
            rubric: question.rubric
          };
          return acc;
        }, {}),
        format: 'SAQ' // Add format field
      };
  
      // Save draft to drafts collection
      const draftRef = doc(db, 'drafts', finalDraftId);
      await setDoc(draftRef, draftData);
  
      // Add draft to class via Cloud Function
      await safeClassUpdate('addDraftToClass', { 
        classId, 
        assignmentId: finalDraftId, // Use draftId instead of assignmentId
        assignmentName 
      });
  
      // Navigate back to Assignments with indication to show drafts
      navigate(`/class/${classId}/Assignments`, {
        state: { 
          showDrafts: true, 
          newDraftId: finalDraftId 
        }
      });
  
    } catch (error) {
      console.error("Error saving assignment:", error);
      alert(`Error publishing assignment: ${error.message}. Please try again.`);
    } finally {
      setIsSaving(false);
    }
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
      const questionsWithIds = data.map(question => ({
        questionId: uuidv4(), // Generate UUID for each question
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

  const handleGenerateClick = async () => {
    if (generatedQuestions.length > 0) {
      setShowPreview(true);
    } else {
      setGenerating(true);
      try {
        const questions = await GenerateSAQ(sourceText, questionBank, additionalInstructions, classId, teacherId);
        setGeneratedQuestions(questions);
        setQuestionsGenerated(true);
        setShowPreview(true);
      } catch (error) {
        console.error("Error generating questions:", error);
        // You might want to add error handling/user feedback here
      } finally {
        setGenerating(false);
      }
    }
  };
    return (
      <div style={{    position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,    overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fcfcfc'}}>  <Navbar userType="teacher" />
        <style>{dropdownContentStyle}</style>
        <div style={{ marginTop: '150px', width: '800px', padding: '15px', marginLeft: 'auto', marginRight: 'auto', fontFamily: "'montserrat', sans-serif", background: 'white', borderRadius: '25px', 
               boxShadow: '1px 1px 10px 1px rgb(0,0,155,.1)', marginBottom: '40px' }}>
       
       {isSaving && <LoaderScreen />}


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

                
                <div style={{marginTop: '85px', marginLeft: '-9px', fontSize: '60px', fontWeight: 'bold'}}>
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
       









                <div style={{marginLeft: '0px'}}>
        
              
        
        <div style={{ marginLeft: '0px', color: '#2BB514', margin: '-15px', padding: '10px 10px 10px 70px',  border: '10px solid #2BB514', borderRadius: '30px 30px 0px 0px', fontFamily: "'montserrat', sans-serif",  fontSize: '40px', display: 'flex', width: '730px', background: '#AEF2A3', marginBottom: '180px', fontWeight: 'bold' }}>
        Create Assignment
     
    <button style={{background: 'transparent', border: 'none', marginBottom: '-5px', marginLeft: 'auto'}}
    onClick={handlePrevious}>
<SquareX size={45} color="#2BB514"/>

    </button>
  
    
        </div>



        <div style={{ width: '100%', height: 'auto', marginTop: '-200px', border: '10px solid transparent', borderRadius: '20px', padding: '20px' }}>
        
        
   <PreferencesSection>
      <AssignmentName 
        value={assignmentName}
        onChange={setAssignmentName}
      />
      
      <FormatSection
        classId={classId}
        selectedFormat={selectedFormat}
        onFormatChange={(newFormat) => {
          setSelectedFormat(newFormat);
          // Any additional format change logic
        }}
      />

      <TimerSection
        timerOn={timerOn}
        timer={timer}
        onTimerChange={setTimer}
        onToggle={() => setTimerOn(!timerOn)}
      />
      
    
      
      <ToggleSwitch
        label="Half Credit"
        value={halfCredit}
        onChange={setHalfCredit}
      />
      

      <div style={{ width: '700px', height: '60px', border: '4px solid transparent', display: 'flex', position: 'relative', alignItems: 'center', borderRadius: '10px', padding: '0px' , marginTop: '-30px', marginBottom: '50px'}}>
              <h1 style={{ fontSize: '25px', color: 'black', width: '300px', fontWeight: '600', marginLeft: '-5px' }}> Grading Scale</h1>
              <div style={{marginLeft: 'auto', marginTop: '45px'}}>
                <input
                  type="number"
                  placeholder="0"
                  style={{
                    width: '30px',
                    height: '12px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    fontSize: '25px',
                    marginLeft: '40px',
                    paddingLeft: '15px',
                    paddingTop: '10px',
                    paddingBottom: '10px',
                    borderRadius: '10px',
                 
                    fontFamily: "'montserrat', sans-serif" ,
                    color: 'black',
                    border: '2px solid #f4f4f4'
                  }}
                  value={scaleMin}
                  onChange={(e) => setScaleMin(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="2"
                  style={{
                    width: '30px',
                    height: '12px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    fontSize: '25px',
                    marginLeft: '40px',
                    paddingLeft: '15px',
                    paddingTop: '10px',
                    
                    marginRight: '20px',
                    fontFamily: "'montserrat', sans-serif" ,
                    paddingBottom: '10px',
                    borderRadius: '10px',
                    color: 'black',
                    
                    border: '2px solid #f4f4f4'
                  }}
                  value={scaleMax}
                  onChange={(e) => setScaleMax(e.target.value)}
                />
                <h4 style={{ fontSize: '40px', color: 'black', width: '30px', marginTop: '-50px', marginLeft: '107px' }}>-</h4>
              </div>
            </div>

      
    </PreferencesSection>

        
        
        
    <div style={{ width: '700px', marginLeft: '25px', marginTop: '30px', marginBottom: '-20px' }}>
         
     

    <DateSettings
          assignDate={assignDate}
          setAssignDate={setAssignDate}
          dueDate={dueDate}
          setDueDate={setDueDate}
        />
           
            <SelectStudentsDW
          classId={classId}
          selectedStudents={selectedStudents}
          setSelectedStudents={setSelectedStudents}
        />
          

          <SecuritySettings
          saveAndExit={saveAndExit}
          setSaveAndExit={setSaveAndExit}
          lockdown={lockdown}
          setLockdown={setLockdown}
        />

{/* Content Dropdown */}
<div style={{ width: '700px', padding: '0px', marginTop: '20px',  borderRadius: '10px', marginBottom: '20px', zIndex: '-10' }}>
  <div
                style={{
                  width: '100%',
                  marginLeft: '0px',
                  fontSize: '30px',
                  backgroundColor: 'white',
                  color: 'black',
                  border: 'none',
                  height: '30px',
                  marginTop: '-10px',
                  
                  marginBottom: '-10px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <CircleHelp size={20} color="lightgrey" />
                <h1 style={{ fontSize: '16px', marginLeft: '5px', marginRight: 'auto', fontFamily: "'montserrat', sans-serif", color: 'lightgrey', fontWeight: '600' }}>Generate Questions</h1>
            
              </div>
  <div >
    <div style={{ marginTop: '0px', marginLeft: '0px' }}>
      {/* Questions Section */}
    
             
      <QuestionCountSection
        bankCount={questionBank}
        studentCount={questionStudent}
        onBankChange={setQuestionBank}
        onStudentChange={setQuestionStudent}
      />

      <SourcePreviewToggle 
  sourceText={sourceText}
  onSourceChange={setSourceText}
  additionalInstructions={additionalInstructions}
  onAdditionalInstructionsChange={setAdditionalInstructions}
  onPreviewClick={handlePreviewToggle}
  onGenerateClick={handleGenerateClick}
  generating={generating}
  generatedQuestions={generatedQuestions}
  questionBank={questionBank}
  questionStudent={questionStudent}
  setQuestionBank={setQuestionBank}
  setQuestionStudent={setQuestionStudent}
/>


        </div>
      

</div>


</div>



          </div>
        </div>
      
        </div>
        
      </div>


      <div style={{display: 'flex',   width: '830px',marginLeft: 'auto', marginRight: 'auto', marginTop: '-10px', marginBottom:'100px'}}>
              <button
                 onClick={saveDraft}
                 style={{
                  width: '270px',
                  marginTop: '0px',
                  height: '60px',
                  border: '3px solid white',
                  marginBottom: '40px',
                  backgroundColor: 'white',
                  padding: ' 5px 5px',
                  boxShadow: '1px 1px 5px 1px rgb(0,0,155,.1)',
                  color: 'grey',
                  borderRadius: '10px',
                  fontSize: '20px',fontFamily: "'montserrat', sans-serif",  
                  fontWeight: '600',
                  display: 'flex',
                  cursor: 'pointer',
                  transition: 'border-color 0.3s ease',
                }}
              
              >
               <PencilRuler size={30} style={{marginLeft: '5px', marginTop: '7px', background: 'transparent'}} /> <h1 style={{fontSize: '25px', marginTop: '7px', marginLeft: '15px',background: 'transparent', fontWeight: '600'}}>Save As Draft</h1>
              </button>



              <button
              onClick={saveAssignment}
              disabled={!assignmentName || generatedQuestions.length === 0}
style={{
  width: '480px',
  height: '60px',
  marginTop: '0px',
  border: '3px solid ',
  marginBottom: '40px',
  backgroundColor: 'white',
  padding: ' 5px 5px',
  boxShadow: '1px 1px 5px 1px rgb(0,0,155,.1)',
  borderRadius: '10px',
   marginLeft: '30px',
  opacity: (!assignmentName || generatedQuestions.length === 0) ? '0%' : '100%',
  color: (!assignmentName || generatedQuestions.length === 0) ? 'lightgrey' : '#00D409',
  borderColor: 'white',
  fontSize: '20px',
  fontFamily: "'montserrat', sans-serif",  
  fontWeight: 'bold',
  cursor: (!assignmentName || generatedQuestions.length === 0) ? 'default' : 'pointer',
  display: 'flex',
  transition: 'background-color 0.3s ease',
}}

            >
              <h1 style={{fontSize: '25px', marginTop: '10px', marginLeft: '15px',background: 'transparent'}}>Publish</h1>
              <SendHorizonal size={40} style={{marginLeft: 'auto', marginTop: '5px', background: 'transparent'}} /> 
            </button>
         
          </div>


      </div>
    );
  };

  

export default CreateAssignment;
