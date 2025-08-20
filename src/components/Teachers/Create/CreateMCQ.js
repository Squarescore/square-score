import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import axios from 'axios';

import { doc, getDoc, setDoc, writeBatch, arrayUnion, serverTimestamp, arrayRemove, updateDoc, deleteDoc} from 'firebase/firestore';

import { db, auth } from '../../Universal/firebase'; // Ensure the path is correct
import { AssignmentActionButtons, usePublishState } from './AssignmentActionButtons';


import 'react-datepicker/dist/react-datepicker.css';
import { v4 as uuidv4 } from 'uuid';
import {Sparkles,Landmark, Eye, User, Repeat, PencilRuler, ChevronUp, ChevronDown, SendHorizonal, CircleHelp, FileText, Settings, SquareX, SquareDashedMousePointer   } from 'lucide-react';

import Navbar from '../../Universal/Navbar';
import DateSettings, { formatDate } from './DateSettings';
import SecuritySettings from './SecuritySettings';
import SelectStudentsDW from './SelectStudentsDW';
import PreviewMCQ from './previewMCQ';
import CustomExpandingFormatSelector from './ExpandingFormatSelector';
import { 
  AssignmentName, 
  ChoicesPerQuestion, 
  FormatSection, 
  PreferencesSection, 
  QuestionCountSection, 
  TimerSection, 
  ToggleSwitch,
  DateSettingsElement,
  SecuritySettingsElement
} from './Elements';

import SourcePreviewToggle from './SourcePreviewToggle';
import Loader from '../../Universal/Loader';
import LoaderScreen from './LoaderScreen';
import Stepper from './Stepper';
import StepPreviewCards from './StepPreviewCards';
import { StepContainer } from './ContainerPost';




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

  const [currentStep, setCurrentStep] = useState(1);
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setHours(date.getHours() + 48);
    return date;
  })
  
  const [onViolation, setOnViolation] = useState('pause');
  const [visitedSteps, setVisitedSteps] = useState([]);
  const [draftId, setDraftId] = useState(null);
  const [sourceText, setSourceText] = useState('');
  const [questionBank, setQuestionBank] = useState('10');
  const [questionStudent, setQuestionStudent] = useState('5');
  const [className, setClassName] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { classId, assignmentId } = useParams();
  const [progress, setProgress] = useState(0);
const [progressText, setProgressText] = useState('');
  const navigate = useNavigate();

  const [selectedFormat, setSelectedFormat] = useState('MCQ');

// Add to state declarations
const [isSaving, setIsSaving] = useState(false)

  

 
 

  const handlePrevious = () => {
    if (currentStep === 1) {
      navigate(-1);
    } else {
      setCurrentStep(prev => Math.max(prev - 1, 1));
    }
  };
  const { isPublishDisabled, publishDisabledConditions } = usePublishState(
    assignmentName, 
    generatedQuestions
  );


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
  
  const nextStep = () => {
    if (currentStep === 3 && questionsGenerated) {
      alert('Please generate questions before proceeding to Preview.');
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };
  
 
  const handleGenerateQuestions = () => {
    if (generatedQuestions.length > 0) {
      setCurrentStep(4);
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
        
      onViolation: lockdown ? onViolation : null, 
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
        
      onViolation: lockdown ? onViolation : null, 
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
      
      setOnViolation(data.onViolation || 'pause');
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
        setCurrentStep(4); 
        
      }
    }
  };

  useEffect(() => {
    // Whenever currentStep changes, add it to visitedSteps if not already present
    setVisitedSteps(prev => {
      if (!prev.includes(currentStep)) {
        return [...prev, currentStep];
      }
      return prev;
    });
  }, [currentStep]);

  const steps = [
    {
      name: 'Settings',
      backgroundColor: '#AEF2A3',
      borderColor: '#2BB514',
      textColor: '#2BB514',
      condition: assignmentName.trim() !== '', // Example condition

    },
    {
      name: 'Select Students',
      
      backgroundColor: '#FFECA8',
      borderColor: '#FF8800',
      textColor: '#CE7C00',
      condition: selectedStudents.size > -1, // Example condition

    },
    {
      name: 'Generate Questions',
      
      backgroundColor: '#F8CFFF',
      borderColor: '#E01FFF',
      condition: sourceText.trim() !== '',

      textColor: '#E01FFF'
    },
    {
      name: 'Preview',
      
      backgroundColor: '#C7CFFF',
      borderColor: '#020CFF',
      condition: true, // Always accessible
 
      textColor: '#020CFF'
    }
  ];

  const StepContainerConfig = {
    settings: {
      width: '550px',
      titleWidth: '512px'
    },
    students: {
      width: '600px',
      titleWidth: '562px'
    },
    generate: {
      width: '710px',
      titleWidth: '672px'
    },
    preview: {
      width: '800px',
      titleWidth: '780px'
    }
  };



  const isFormValid = () => {
    return assignmentName !== '' && assignDate !== '' && dueDate !== '';
  };



  return (
    <div style={{    position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,    overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#white'}}>  <Navbar userType="teacher" />
    
      {isSaving && <LoaderScreen />}












      <div style={{marginTop: '100px'}}>
 
 <div style={{marginTop: '100px'}}>
 <Stepper
   currentStep={currentStep}
   setCurrentStep={setCurrentStep}
   steps={steps}
   isPreviewAccessible={questionsGenerated}
   visitedSteps={visitedSteps}
   onSaveDraft={saveDraft}
   onPublish={saveAssignment}
   isPublishDisabled={isPublishDisabled}
   classId={classId}
   selectedFormat={selectedFormat}
   onFormatChange={setSelectedFormat}
 />
 </div>
 
   
     {currentStep === 1 && (
 
 
 <div style={{width: '900px',  height: '500px',marginLeft: 'auto', marginRight: 'auto', marginTop: '50px', position: 'relative'}}>
 
 
 
 <StepPreviewCards
   currentStep={currentStep}
   canProgress={isFormValid()}
   onNextStep={nextStep}
   onPrevStep={handlePrevious}
   assignmentName={assignmentName}
   hasGeneratedQuestions={generatedQuestions.length > 0}
 />
 
 
 
 
 
 
 
 
 <StepContainer
           title="Settings" 
           icon={Settings}
           color="#2BB514"
           
           backgroundColor="#A6FF98"
           width={StepContainerConfig.settings.width}
           titleWidth={StepContainerConfig.settings.titleWidth}
         >
         
    <PreferencesSection>
    <AssignmentName
      value={assignmentName}
      onChange={setAssignmentName}
    />
    
 
    <DateSettingsElement
           assignDate={assignDate}
           setAssignDate={setAssignDate}
           dueDate={dueDate}
           setDueDate={setDueDate}
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
    
      
              <ChoicesPerQuestion
     selectedOptions={selectedOptions}
     onChange={setSelectedOptions}
   />
    
 
 <SecuritySettingsElement
   saveAndExit={saveAndExit}
   setSaveAndExit={setSaveAndExit}
   lockdown={lockdown}
   setLockdown={setLockdown}
   onViolation={onViolation}
   setOnViolation={setOnViolation}
 />
  </PreferencesSection>
 
 
            
         

 
 </StepContainer>
 
 
 
 
 
  </div>
     )}
 
     {currentStep === 2 && (
       <div style={{width: '900px',  height: '500px',marginLeft: 'auto', marginRight: 'auto', marginTop: '50px', position: 'relative'}}>
 
 
 <StepPreviewCards
   currentStep={currentStep}
   canProgress={isFormValid()}
   onNextStep={nextStep}
   onPrevStep={handlePrevious}
   assignmentName={assignmentName}
   hasGeneratedQuestions={generatedQuestions.length > 0}
 />
 
 <StepContainer 
           title="Select Students" 
           icon={SquareDashedMousePointer}
           color="#FFAE00"
           
           backgroundColor="#FFEFB9"
           width={StepContainerConfig.students.width}
           titleWidth={StepContainerConfig.students.titleWidth}
         >
       <SelectStudentsDW
         classId={classId}
         selectedStudents={selectedStudents}
         setSelectedStudents={setSelectedStudents}
       />
 
     </StepContainer>
       </div>
     )}
 
     {currentStep === 3 && (
      <div style={{width: '900px', height: '500px',marginLeft: 'auto', marginRight: 'auto', marginTop: '50px', position: 'relative'}}>
 
 <StepPreviewCards
 currentStep={currentStep}
 canProgress={isFormValid()}
 onNextStep={nextStep}
 onPrevStep={handlePrevious}
 assignmentName={assignmentName}
 hasGeneratedQuestions={generatedQuestions.length > 0}
 />
 <StepContainer 
           title="Generate Questions" 
           icon={Sparkles}
           color="#E01FFF"
           
           backgroundColor="#F7C4FF"
           width={StepContainerConfig.generate.width}
           titleWidth={StepContainerConfig.generate.titleWidth}
         >
        
 
 
 
     
 
           
 
               <div style={{ width: '700px', marginLeft: '10px', marginTop: '-40px'}}>
            
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
 </StepContainer>
 
 
 </div>
     )}
 
     {currentStep === 4 && (
        <div style={{width: '900px',  height: '500px',marginLeft: 'auto', marginRight: 'auto', marginTop: '50px', position: 'relative'}}>
 
        <StepPreviewCards
        currentStep={currentStep}
        canProgress={isFormValid()}
        onNextStep={nextStep}
        onPrevStep={handlePrevious}
        assignmentName={assignmentName}
        hasGeneratedQuestions={generatedQuestions.length > 0}
        />
      {/* Step 4: Preview */}
      <PreviewMCQ
        questions={generatedQuestions}
        onBack={() => setCurrentStep(3)} // Navigate back to Generate Questions
        onSave={handleSaveQuestions}
        assignmentId={draftId || assignmentId} // Pass assignmentId for saving
        showCloseButton={false} // Hide the close button in stepper flow
      />
    
    </div>
  )}
      
</div>










































     </div>
  
  );
};

export default MCQ;
