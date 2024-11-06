import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import axios from 'axios';

import { doc, getDoc, setDoc, writeBatch, arrayUnion, serverTimestamp, arrayRemove, updateDoc, deleteDoc} from 'firebase/firestore';

import { db, auth } from '../../Universal/firebase'; // Ensure the path is correct
import { AssignmentActionButtons, usePublishState } from './AssignmentActionButtons';


import 'react-datepicker/dist/react-datepicker.css';
import { v4 as uuidv4 } from 'uuid';
import {Sparkles,Landmark, Eye, User, Repeat, PencilRuler, ChevronUp, ChevronDown, SendHorizonal, CircleHelp, FileText, Settings, SquareX   } from 'lucide-react';

import Navbar from '../../Universal/Navbar';
import DateSettings, { formatDate } from './DateSettings';
import SecuritySettings from './SecuritySettings';
import SelectStudentsDW from './SelectStudentsDW';
import PreviewMCQ from './previewMCQ';
import CustomExpandingFormatSelector from './ExpandingFormatSelector';
import { AssignmentName, ChoicesPerQuestion, FormatSection, PreferencesSection, QuestionCountSection, TimerSection, ToggleSwitch } from './Elements';
import SourcePreviewToggle from './SourcePreviewToggle';
import { safeClassUpdate } from '../../teacherDataHelpers';
import Loader from '../../Universal/Loader';

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



const MCQ = () => {
  const [teacherId, setTeacherId] = useState(null);
  const [assignmentName, setAssignmentName] = useState('');
  const [timer, setTimer] = useState('10');
  const [timerOn, setTimerOn] = useState(false);
  const [feedback, setFeedback] = useState(false);
  const [retype, setRetype] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([4]);
  const [saveAndExit, setSaveAndExit] = useState(true);
  const [lockdown, setLockdown] = useState(false);
  const [assignDate, setAssignDate] = useState(new Date());
  const [questionsGenerated, setQuestionsGenerated] = useState(false);

  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setHours(date.getHours() + 48);
    return date;
  })
  
  const [draftId, setDraftId] = useState(null);
  const [sourceText, setSourceText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [questionBank, setQuestionBank] = useState('10');
  const [questionStudent, setQuestionStudent] = useState('5');
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
  const navigate = useNavigate();

  const convertToDateTime = (date) => {
    return formatDate(new Date(date));
  };
  const [selectedFormat, setSelectedFormat] = useState('MCQ');
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);


// Add to state declarations
const [isSaving, setIsSaving] = useState(false)
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
      zIndex: 99
    }}>
      <Loader/>
      <div style={{
        fontFamily: "'montserrat', sans-serif",
        fontSize: '16px',
        marginTop: '20px',
        color: 'lightgrey ',

        fontWeight: '600'
      }}>
        Saving...
      </div>
    </div>
  );
  

 
  const toggleAdditionalInstructions = () => {
    setShowAdditionalInstructions(!showAdditionalInstructions);
    if (showAdditionalInstructions) {
      setAdditionalInstructions('');
    }
  };

  const handlePrevious = () => {
    navigate(-1);
  };
  const { isPublishDisabled, publishDisabledConditions } = usePublishState(
    assignmentName, 
    generatedQuestions
  );
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
  
  const generateQuestions = async () => {
    try {
      setGenerating(true);
      setProgress(0);
      setProgressText('Starting generation...');
  
      const response = await axios.post('https://us-central1-square-score-ai.cloudfunctions.net/GenerateMCQ', {
        sourceText: sourceText,
        selectedOptions: selectedOptions,
        additionalInstructions: additionalInstructions,
        classId: classId,
        teacherId: teacherId,
        questionCount: parseInt(questionBank),
        feedback: feedback
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
              questionId: uuidv4(),
              ...question
            }));
            console.log('Generated questions:', questionsWithIds);
            setGeneratedQuestions(questionsWithIds);
            setQuestionsGenerated(true);
            setShowPreview(true);
          } else {
            console.error("Parsed questions is not an array:", questions);
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
        setGeneratedQuestions(questionsWithIds);
        setQuestionsGenerated(true);
        setShowPreview(true);
      } else {
        console.error("Unexpected response format:", data);
      }
    } catch (error) {
      console.error("Error calling generateQuestions function:", error);
      alert(`Error generating questions: ${error.message}. Please try again.`);
    } finally {
      setGenerating(false);
      setProgress(100);
      setProgressText('Generation complete!');
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
  

    // Check if we're loading from a draft
    if (assignmentId && assignmentId.startsWith('DRAFT')) {
      setDraftId(assignmentId.slice(5)); // Remove 'DRAFT' prefix
      loadDraft(assignmentId.slice(5));
    }
  }, [classId, assignmentId]);




  const saveAssignment = async () => {
    if (isSaving) return;
    setIsSaving(true);
  
    try {
      const finalAssignmentId = assignmentId.startsWith('DRAFT') ? assignmentId.slice(5) : assignmentId;
      const batch = writeBatch(db);
  
      // Format questions with proper structure
      const formattedQuestions = generatedQuestions.map(question => {
        const choiceKeys = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const formattedQuestion = {
          questionId: question.questionId || `question_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          question: question.question || '',
          difficulty: question.difficulty || 'medium',
          correct: question.correct || '',
          choices: question.choices || choiceKeys.filter(key => question[key]).length
        };
  
        // Add individual choice texts and explanations
        choiceKeys.forEach(key => {
          if (question[key]) {
            formattedQuestion[key] = question[key];
            formattedQuestion[`explanation_${key}`] = question[`explanation_${key}`] || '';
          }
        });
  
        return formattedQuestion;
      });
  
      // Create assignment document
      const assignmentRef = doc(db, 'assignments', finalAssignmentId);
      batch.set(assignmentRef, {
        classId,
        format: 'MCQ',
        assignmentName,
        timer: timerOn ? Number(timer) : 0,
        timerOn,
        feedback,
        retype,
        assignDate: formatDate(assignDate),
        dueDate: formatDate(dueDate),
        selectedStudents: Array.from(selectedStudents),
        questionBank: Number(questionBank),
        questionStudent: Number(questionStudent),
        saveAndExit,
        lockdown,
        createdAt: serverTimestamp(),
        questions: formattedQuestions,
        additionalInstructions
      });
  
      // Update class document - add to assignments array
      const classRef = doc(db, 'classes', classId);
      batch.update(classRef, {
        assignments: arrayUnion({
          id: finalAssignmentId,
          name: assignmentName
        })
      });
  
      // If publishing from draft, handle cleanup
      if (draftId) {
        // Remove from drafts array
        batch.update(classRef, {
          drafts: arrayRemove({
            id: draftId,
            name: assignmentName
          })
        });
        
        // Delete draft document
        const draftRef = doc(db, 'drafts', draftId);
        batch.delete(draftRef);
      }
  
      // Assign to students
      const selectedStudentIds = Array.from(selectedStudents);
      selectedStudentIds.forEach(studentUid => {
        const studentRef = doc(db, 'students', studentUid);
        batch.update(studentRef, {
          assignmentsToTake: arrayUnion(finalAssignmentId)
        });
      });
  
      // Commit all operations atomically
      await batch.commit();
  
      navigate(`/class/${classId}`, {
        state: {
          successMessage: `Success: ${assignmentName} published`,
          assignmentId: finalAssignmentId,
          format: 'MCQ'
        }
      });
    } catch (error) {
      console.error("Error saving assignment:", error);
      alert(`Error publishing assignment: ${error.message}. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };
  
  const saveDraft = async () => {
    if (isSaving) return;
    setIsSaving(true);
  
    try {
      const finalDraftId = assignmentId.startsWith('DRAFT') ? assignmentId.slice(5) : assignmentId;
      const batch = writeBatch(db);
  
      // Save draft document
      const draftRef = doc(db, 'drafts', finalDraftId);
      batch.set(draftRef, {
        classId,
        format: 'MCQ',
        assignmentName,
        timer: timerOn ? Number(timer) : 0,
        timerOn,
        feedback,
        retype,
        assignDate: formatDate(assignDate),
        dueDate: formatDate(dueDate),
        selectedStudents: Array.from(selectedStudents),
        questionBank: Number(questionBank),
        questionStudent: Number(questionStudent),
        saveAndExit,
        lockdown,
        createdAt: serverTimestamp(),
        questions: generatedQuestions,
        additionalInstructions
      });
  
      // Update class document - add to drafts array
      const classRef = doc(db, 'classes', classId);
      batch.update(classRef, {
        drafts: arrayUnion({
          id: finalDraftId,
          name: assignmentName
        })
      });
  
      // Commit all operations atomically
      await batch.commit();
  
      navigate(`/class/${classId}/Assignments`, {
        state: { 
          showDrafts: true, 
          newDraftId: finalDraftId 
        }
      });
    } catch (error) {
      console.error("Error saving draft:", error);
      alert(`Error saving draft: ${error.message}. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };



  const loadDraft = async (draftId) => {
    const draftRef = doc(db, 'drafts', draftId);
    const draftDoc = await getDoc(draftRef);
    if (draftDoc.exists) {
      const data = draftDoc.data();
      setAssignmentName(data.assignmentName || '');
      setTimer(data.timer?.toString() || '');
      setTimerOn(data.timerOn || false);
      setFeedback(data.feedback || false);
      setRetype(data.retype || false);
      const loadedAssignDate = data.assignDate ? new Date(data.assignDate) : new Date();
      setAssignDate(loadedAssignDate);
      
      if (data.dueDate) {
        setDueDate(new Date(data.dueDate));
      } else {
        setDueDate(new Date(loadedAssignDate.getTime() + 48 * 60 * 60 * 1000));
      }
  
      setSelectedStudents(new Set(data.selectedStudents || []));
      setQuestionBank(data.questionBank?.toString() || '');
      setQuestionStudent(data.questionStudent?.toString() || '');
      setSaveAndExit(data.saveAndExit || true);
      setLockdown(data.lockdown || false);
      setAdditionalInstructions(data.additionalInstructions || '');
  
      if (data.questions && data.questions.length > 0) {
        setGeneratedQuestions(data.questions);
        setQuestionsGenerated(true);
        
      }
    }
  };

  const optionStyles = {
    2: { background: '#A3F2ED', color: '#00645E' },
    3: { background: '#AEF2A3', color: '#006428' },
    4: { background: '#F8CFFF', color: '#E01FFF' },
    5: { background: '#FFECA8', color: '#CE7C00' }
  };
  const FormatOption = ({ format, onClick, isAlternate }) => (
    <div 
      style={{
        padding: '5px 10px',
        width: '100px',
        textAlign: 'center',
        fontSize: '35px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        opacity: '50%',
        justifyContent: 'center',
        color: format.color,
        backgroundColor: 'white',
        borderRadius: '5px',
        margin: '2px',
        transition: 'all 0.3s ease',
      }}
      onClick={() => onClick(format.value)}
    >
      {format.label}
      {format.hasAsterisk && (
        <span style={{
          marginLeft: '2px',
          color: '#FCCA18',
          fontWeight: 'bold'
        }}>*</span>
      )}
    </div>
  );







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
      {isSaving && <LoaderScreen />}

      <div style={{ marginTop: '150px', width: '800px', padding: '15px', marginLeft: 'auto', marginRight: 'auto', fontFamily: "'montserrat', sans-serif", background: 'white', borderRadius: '25px', 
               boxShadow: '1px 1px 10px 1px rgb(0,0,155,.1)', marginBottom: '40px' }}>
       
              
        
       <div style={{ marginLeft: '0px', color: '#2BB514', margin: '-15px', padding: '10px 10px 10px 60px',  border: '10px solid #2BB514', borderRadius: '30px 30px 0px 0px', fontFamily: "'montserrat', sans-serif",  fontSize: '40px', display: 'flex', width: '740px', background: '#AEF2A3', marginBottom: '180px', fontWeight: 'bold' }}>
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
        label="Feedback"
        value={feedback}
        onChange={setFeedback}
      />
      <ToggleSwitch
        label="Retype"
        value={retype}
        onChange={setRetype}
      />
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

         

            {showPreview && generatedQuestions && generatedQuestions.length > 0 && (
              <div style={{ width: '100%', position: 'absolute', zIndex: 100, background: 'white', top: '70px', left: '0%' }}>
                <PreviewMCQ
                  questions={generatedQuestions}
                  onBack={() => setShowPreview(false)}
                  onSave={handleSaveQuestions}
                />
              </div>
            )}






<div style={{ width: '700px', padding: '0px', marginTop: '20px',  borderRadius: '10px', marginBottom: '20px', zIndex: '-10' }}>
              <div
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '30px',
                  backgroundColor: 'white',
                  color: 'black',
                  border: 'none',
                  height: '30px',
                  marginTop: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <CircleHelp size={20} color="lightgrey" />
                <h1 style={{ fontSize: '16px', marginLeft: '10px', marginRight: 'auto', fontFamily: "'montserrat', sans-serif", color: 'lightgrey', fontWeight: '600' }}>Generate Questions</h1>
            
              </div>


              <div >
                <div style={{ marginTop: '-20px' }}>
                  {/* Questions Section */}
               

        
          
                
      <QuestionCountSection
        bankCount={questionBank}
        studentCount={questionStudent}
        onBankChange={setQuestionBank}
        onStudentChange={setQuestionStudent}
      />

                <ChoicesPerQuestion
        selectedOptions={selectedOptions}
        onChange={setSelectedOptions}
      />

                <div style={{ width: '700px', marginLeft: '10px', }}>
                <SourcePreviewToggle
      sourceText={sourceText}
      onSourceChange={setSourceText}
      additionalInstructions={additionalInstructions}
      onAdditionalInstructionsChange={setAdditionalInstructions}
      onPreviewClick={handleGenerateQuestions}
      onGenerateClick={handleGenerateQuestions}
      generating={generating}
      generatedQuestions={generatedQuestions}
      progress={progress}
      progressText={progressText}
    />
  
  
  

                  </div>
                </div>
                
              </div>
              </div>

            
         </div>
       </div>
     </div>



     <AssignmentActionButtons
        onSaveDraft={saveDraft}
        onPublish={saveAssignment}
        isPublishDisabled={isPublishDisabled}
        publishDisabledConditions={publishDisabledConditions}
      />

     </div>
  
  );
};

export default MCQ;
