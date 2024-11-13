import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, writeBatch, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { deleteDoc } from 'firebase/firestore';
import { CalendarCog, SquareDashedMousePointer, Sparkles, GlobeLock, EyeOff, Landmark, Eye, User, PencilRuler, SendHorizonal, Folder, SquareX, ChevronUp, ChevronDown, FileText, CircleHelp, Settings  } from 'lucide-react';
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
import Stepper from './Stepper';
import StepPreviewCards from './StepPreviewCards';
import SourcePreviewToggle from './SourcePreviewToggle';
import { StepContainer } from './ContainerPost';
import LoaderScreen from './LoaderScreen';

function CreateAssignment() {
  const [showPreview, setShowPreview] = useState(false);
  const [className, setClassName] = useState('');
  const [assignmentName, setAssignmentName] = useState('');
  const [timer, setTimer] = useState('10');
  const [halfCredit, setHalfCredit] = useState(false);
  const [saveAndExit, setSaveAndExit] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [lockdown, setLockdown] = useState(false);
  const location = useLocation();
  const [scaleMin, setScaleMin] = useState('0');
  const [scaleMax, setScaleMax] = useState('2');
  const [teacherId, setTeacherId] = useState(null);
  const [assignDate, setAssignDate] = useState(new Date());

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
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [questionsGenerated, setQuestionsGenerated] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [visitedSteps, setVisitedSteps] = useState([]);
  const [onViolation, setOnViolation] = useState('pause');
  
  const [draftId, setDraftId] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('SAQ');

  const [isSaving, setIsSaving] = useState(false);

  


  useEffect(() => {
    if (location.state) {
      const { assignmentType, isAdaptive } = location.state;
      setAssignmentType(assignmentType);
      setIsAdaptive(isAdaptive);
    }
  }, [location.state]);
  useEffect(() => {
    // Whenever currentStep changes, add it to visitedSteps if not already present
    setVisitedSteps(prev => {
      if (!prev.includes(currentStep)) {
        return [...prev, currentStep];
      }
      return prev;
    });
  }, [currentStep]);

  const handlePrevious = () => {
    if (currentStep === 1) {
      navigate(-1);
    } else {
      setCurrentStep(prev => Math.max(prev - 1, 1));
    }
  };
  useEffect(() => {
    // Set due date to 48 hours after assign date whenever assign date changes
    setDueDate(new Date(assignDate.getTime() + 48 * 60 * 60 * 1000));
  }, [assignDate]);
  const { classId, assignmentId } = useParams(); // Get assignmentId from params
  const navigate = useNavigate();
  const handlePreviewToggle = () => {
    setShowPreview(!showPreview);
  };

  const nextStep = () => {
    if (currentStep === 3 && showPreview && generatedQuestions.length > 0) {
      alert('Please generate questions before proceeding to Preview.');
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
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
      setOnViolation(data.onViolation || 'pause');
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

  const { isPublishDisabled, publishDisabledConditions } = usePublishState(
    assignmentName, 
    generatedQuestions
  );
// In CreateAssignment.js
const saveAssignment = async () => {
  if (isSaving) return;
  setIsSaving(true);

  try {
    const finalAssignmentId = assignmentId.startsWith('DRAFT') ? assignmentId.slice(5) : assignmentId;
    const batch = writeBatch(db);

    // Save assignment document
    const assignmentRef = doc(db, 'assignments', finalAssignmentId);
    batch.set(assignmentRef, {
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
      onViolation: lockdown ? onViolation : null, 
      saveAndExit,
      isAdaptive,
      additionalInstructions,
    });

    // Update class document directly - add to assignments array
    const classRef = doc(db, 'classes', classId);
    batch.update(classRef, {
      assignments: arrayUnion({
        id: finalAssignmentId,
        name: assignmentName
      })
    });

    // If publishing from a draft, handle draft cleanup
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

    // Assign to selected students
    const selectedStudentIds = Array.from(selectedStudents);
    selectedStudentIds.forEach(studentUid => {
      const studentRef = doc(db, 'students', studentUid);
      batch.update(studentRef, {
        assignmentsToTake: arrayUnion(finalAssignmentId)
      });
    });

    // Commit all operations in a single batch
    await batch.commit();

    navigate(`/class/${classId}`, {
      state: {
        successMessage: `Success: ${assignmentName} published`,
        assignmentId: finalAssignmentId,
        format: 'SAQ'
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
      onViolation: lockdown ? onViolation : null, 
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
      format: 'SAQ'
    });

    // Update class document - add to drafts array
    const classRef = doc(db, 'classes', classId);
    batch.update(classRef, {
      drafts: arrayUnion({
        id: finalDraftId,
        name: assignmentName
      })
    });

    // Commit all operations in a single batch
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
      setCurrentStep(4);
    } else {
      setGenerating(true);
      try {
        const questions = await GenerateSAQ(sourceText, questionBank, additionalInstructions, classId, teacherId);
        setGeneratedQuestions(questions);
        setQuestionsGenerated(true);
        setCurrentStep(4);
      } catch (error) {
        console.error("Error generating questions:", error);
        // You might want to add error handling/user feedback here
      } finally {
        setGenerating(false);
      }
    }
  };


  
  const steps = [
    {
      name: 'Settings',
      backgroundColor: 'white',
      borderColor: 'white',
      textColor: 'black',
      condition: assignmentName.trim() !== '', // Example condition

    },
    {
      name: 'Select Students',
      
      backgroundColor: 'white',
      borderColor: 'white',
      textColor: 'black',
      condition: selectedStudents.size > -1, // Example condition

    },
    {
      name: 'Generate Questions',
      
      backgroundColor: 'white',
      borderColor: 'white',
      condition: sourceText.trim() !== '',

      textColor: 'black'
    },
    {
      name: 'Preview',
      
      backgroundColor: 'white',
      borderColor: 'white',
      condition: true, // Always accessible
 
      textColor: 'black'
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


    const isStepCompleted = (stepNumber) => {
      const step = steps.find((s) => s.number === stepNumber);
      if (!step) return false;
      return step.condition;
    };
    const handleStepClick = (stepNumber) => {
      // Only allow navigation if the step is completed or it's the current step
      if (isStepCompleted(stepNumber - 1) || stepNumber === currentStep) {
        setCurrentStep(stepNumber);
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
          color="black"
          
          backgroundColor="white"
          width={StepContainerConfig.settings.width}
          titleWidth={StepContainerConfig.settings.titleWidth}
        >
        

        
   <PreferencesSection>
   <AssignmentName
     value={assignmentName}
     onChange={setAssignmentName}
   />
   

   <DateSettings
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
   
 
  
   <QuestionCountSection
        bankCount={questionBank}
        studentCount={questionStudent}
        onBankChange={setQuestionBank}
        onStudentChange={setQuestionStudent}
      />

          
<ToggleSwitch
        label="Half Credit"
        value={halfCredit}
        onChange={setHalfCredit}
      />
      

      <div style={{ width: '500px', height: '30px', border: '4px solid transparent', display: 'flex', position: 'relative', alignItems: 'center', borderRadius: '10px', padding: '0px' , marginTop: '-30px', marginBottom: '50px'}}>
              <h1 style={{ fontSize: '16px', color: 'grey', width: '300px', fontWeight: '600', marginLeft: '-5px' }}> Grading Scale</h1>
              <div style={{marginLeft: 'auto', marginTop: '45px', background: '#f4f4f4',height: '28px', display: 'flex', borderRadius: '5px'}}>
                <input
                  type="number"
                  placeholder="0"
                  style={{
                    width: '30px',
                    height: '18px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    fontSize: '16px',
                    marginLeft: '2px',
                    borderRadius: '5px',
                 marginTop: '2px',
                    fontFamily: "'montserrat', sans-serif" ,
                    color: 'black',
                    border: '2px solid #f4f4f4'
                  }}
                  value={scaleMin}
                  onChange={(e) => setScaleMin(e.target.value)}
                />
                     <h4 style={{ fontSize: '20px', color: 'GREY', width: '20px', marginTop: '0px', marginLeft: '0px', textAlign: 'center' }}>-</h4>
            
                <input
                  type="number"
                  placeholder="2"
                  style={{
                    width: '30px',
                    height: '18px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    fontSize: '16px',
                    marginLeft: '2px',
                    borderRadius: '5px',
                    marginRight: '2px',
                 marginTop: '2px',
                    fontFamily: "'montserrat', sans-serif" ,
                    color: 'black',
                    border: '2px solid #f4f4f4'
              
                  }}
                  value={scaleMax}
                  onChange={(e) => setScaleMax(e.target.value)}
                />
             </div>
            </div>
 </PreferencesSection>


           
        


 <SecuritySettings
  saveAndExit={saveAndExit}
  setSaveAndExit={setSaveAndExit}
  lockdown={lockdown}
  setLockdown={setLockdown}
  onViolation={onViolation}
  setOnViolation={setOnViolation}
/>




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
          color="black"   widt
          
          backgroundColor="white"
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
          color="black"
          
          backgroundColor="white"
          width={StepContainerConfig.generate.width}
          titleWidth={StepContainerConfig.generate.titleWidth}
        >
       


     

              <div style={{ width: '700px', marginLeft: '10px', marginTop: '-40px'}}>
           

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
     <TeacherPreview
        questionsWithIds={generatedQuestions}
        setQuestionsWithIds={setGeneratedQuestions}
        sourceText={sourceText}
        questionCount={questionBank}
        classId={classId}
        teacherId={teacherId} // Hide the close button in stepper flow
     />
 
   </div>
 )}



 
</div>      </div>
    );
  };

  

export default CreateAssignment;
