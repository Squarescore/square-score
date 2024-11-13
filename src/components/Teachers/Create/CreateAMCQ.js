import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, writeBatch, arrayUnion, serverTimestamp, arrayRemove, updateDoc, deleteDoc } from 'firebase/firestore';
import Navbar from '../../Universal/Navbar';
import SelectStudents from './SelectStudents';
import CustomDateTimePicker from './CustomDateTimePicker';
import 'react-datepicker/dist/react-datepicker.css';
import PreviewAMCQ from './previewAMCQ';
import axios from 'axios';
import { auth,db } from '../../Universal/firebase';
import { CalendarCog, SquareDashedMousePointer, Sparkles, GlobeLock, Eye, PencilRuler, SendHorizonal, ChevronDown, ChevronUp, CircleHelp, FileText, Landmark, SquareX, Settings, Sparkle, ChevronLast, ChevronLeft, ChevronRight  } from 'lucide-react';
import CustomExpandingFormatSelector from './ExpandingFormatSelector';
import SelectStudentsDW from './SelectStudentsDW';
import SecuritySettings from './SecuritySettings';
import DateSettings from './DateSettings';
import { AssignmentName, ChoicesPerQuestion, FormatSection, PreferencesSection, TimerSection, } from './Elements';
import { AssignmentActionButtons, usePublishState } from './AssignmentActionButtons';
import { safeClassUpdate } from '../../teacherDataHelpers';
import { v4 as uuidv4 } from 'uuid';
import Stepper from './Stepper'; // Import the Stepper component
import StepPreviewCards from './StepPreviewCards';
import { StepContainer } from './ContainerPost';
import SourcePreviewToggle from './SourcePreviewToggle';
import LoaderScreen from './LoaderScreen';




const MCQA = () => {
  const [questionsLoaded, setQuestionsLoaded] = useState(false);

  const [assignmentName, setAssignmentName] = useState('');
  const [timer, setTimer] = useState('60');
  const [timerOn, setTimerOn] = useState(false);
  const [feedback, setFeedback] = useState('instant');
  const [selectedOptions, setSelectedOptions] = useState([4]);
  const [saveAndExit, setSaveAndExit] = useState(true);
  const [lockdown, setLockdown] = useState(false);
  const [questionsGenerated, setQuestionsGenerated] = useState(false);
  const [teacherId, setTeacherId] = useState(null);
  const [assignDate, setAssignDate] = useState(new Date());

  const [selectedFormat, setSelectedFormat] = useState('AMCQ');
  const [dueDate, setDueDate] = useState(new Date(new Date().getTime() + 48 * 60 * 60 * 1000)); // 48 hours from now

  const [currentStep, setCurrentStep] = useState(1);
  const [visitedSteps, setVisitedSteps] = useState([]);
  const [onViolation, setOnViolation] = useState('pause');
  const [draftId, setDraftId] = useState(null);
  const [sourceOption, setSourceOption] = useState(null);
  const [sourceText, setSourceText] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [questionBank, setQuestionBank] = useState('');
  const [questionStudent, setQuestionStudent] = useState('');
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
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Set due date to 48 hours after assign date whenever assign date changes
    setDueDate(new Date(assignDate.getTime() + 48 * 60 * 60 * 1000));
  }, [assignDate]);


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



  const nextStep = () => {
    if (currentStep === 3 && questionsGenerated) {
      alert('Please generate questions before proceeding to Preview.');
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };
  
  // Fetch class name effect
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
  const baseUrl = 'https://us-central1-square-score-ai.cloudfunctions.net';
  const maxRetries = 3;
  const progressIncrement = 0.5;

  try {
    setGenerating(true);
    setProgress(0);
    setProgressText('0%');
    setGeneratedQuestions([]);

    // Function to update progress (unchanged)
    const updateProgress = (start, end) => {
      let currentProgress = start;
      const interval = setInterval(() => {
        if (currentProgress < end) {
          currentProgress += progressIncrement;
          setProgress(currentProgress);
          setProgressText(`${Math.round(currentProgress)}%`);
        } else {
          clearInterval(interval);
        }
      }, 100);
      return interval;
    };
    const generateQuestionsForDifficulty = async (difficulty) => {
      let attempt = 1;
      const endpoint = `${baseUrl}/GenerateAMCQ${difficulty}`;
      
      while (attempt <= maxRetries) {
        try {
          const response = await axios.post(endpoint, {
            sourceText,
            selectedOptions,
            additionalInstructions,
            classId,
            teacherId,
          });
          console.log(`${difficulty} Questions Response:`, response.data);
          
          // Extract questions from the nested structure
          const questions = response.data.questions.questions;
          
          if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error('Invalid API response: No questions generated');
          }
          return questions; // Return the array of questions
        } catch (error) {
          console.error(`Error in generate${difficulty}Questions, attempt ${attempt}:`, error);
          if (attempt === maxRetries) {
            throw new Error(`Failed to generate ${difficulty.toLowerCase()} questions after ${maxRetries} attempts`);
          } else {
            attempt++;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
    };

    const progressInterval = updateProgress(0, 90);

    const [easyQuestions, mediumQuestions, hardQuestions] = await Promise.all([
      generateQuestionsForDifficulty('Easy'),
      generateQuestionsForDifficulty('Medium'),
      generateQuestionsForDifficulty('Hard'),
    ]);

    clearInterval(progressInterval);
    setProgress(100);
    setProgressText('100%');

    // Combine all questions into a single flattened array
    const allQuestions = [...easyQuestions, ...mediumQuestions, ...hardQuestions];

    // Shuffle the combined array

    setGeneratedQuestions(allQuestions);
    setShowPreview(true);
  } catch (error) {
    console.error('Error in generateQuestions:', error);
    alert('An error occurred while generating questions. Please try again.');
  } finally {
    setGenerating(false);
  }
};
  const handleGenerateQuestions = () => {
    if (questionsLoaded || generatedQuestions.length > 0) {
     
      setCurrentStep(4);
    } else if (sourceText.trim() !== '') {
      generateQuestions();
    }
  };
  const handleSaveQuestions = () => {
    setGeneratedQuestions(generatedQuestions);
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
      setTimer(data.timer?.toString() || '60');
      setTimerOn(data.timerOn || false);
      setFeedback(data.feedback || 'instant');
      setSelectedOptions(data.selectedOptions || [4]);
      
      const loadedAssignDate = data.assignDate ? new Date(data.assignDate) : new Date();
      setAssignDate(loadedAssignDate);
      
      if (data.dueDate) {
        setDueDate(new Date(data.dueDate));
      } else {
        setDueDate(new Date(loadedAssignDate.getTime() + 48 * 60 * 60 * 1000));
      }
      setLockdown(data.lockdown || false);
      setOnViolation(data.onViolation || 'pause');
      setSelectedStudents(new Set(data.selectedStudents || []));
      setSaveAndExit(data.saveAndExit !== undefined ? data.saveAndExit : true);
      setLockdown(data.lockdown || false);
      setSourceOption(data.sourceOption || null);
      setSourceText(data.sourceText || '');
      setYoutubeLink(data.youtubeLink || '');
      setQuestionBank(data.questionBank || '');
      setQuestionStudent(data.questionStudent || '');
      setAdditionalInstructions(data.additionalInstructions || '');

      // Load generated questions
      if (data.questions && data.questions.length > 0) {
        setGeneratedQuestions(data.questions);
        setQuestionsGenerated(true);
        setCurrentStep(4); 
        setQuestionsLoaded(true);

      }
    }
  };

  const saveDraft = async () => {
    if (isSaving) return;
    setIsSaving(true);
    
    try {
      const newDraftId = draftId || `${classId}+${Date.now()}+AMCQ`;
      const batch = writeBatch(db);
  
      // Save draft document
      const draftRef = doc(db, 'drafts', newDraftId);
      batch.set(draftRef, {
        classId,
        assignmentName,
        timer: timerOn ? Number(timer) : 0,
        timerOn,
        feedback,
        selectedOptions,
        assignDate: formatDate(assignDate),
        dueDate: formatDate(dueDate),
        selectedStudents: Array.from(selectedStudents),
        saveAndExit,
        lockdown,
        onViolation: lockdown ? onViolation : null,
        createdAt: serverTimestamp(),
        questions: generatedQuestions,
        sourceOption,
        sourceText,
        youtubeLink,
        questionBank,
        questionStudent,
        format: 'AMCQ',
        additionalInstructions
      });
  
      // Update class document - add to drafts array
      const classRef = doc(db, 'classes', classId);
      batch.update(classRef, {
        drafts: arrayUnion({
          id: newDraftId,
          name: assignmentName
        })
      });
  
      // Commit all operations in a single batch
      await batch.commit();
      
      setDraftId(newDraftId);
      
      navigate(`/class/${classId}/Assignments`, {
        state: { 
          showDrafts: true, 
          newDraftId: newDraftId 
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

  const saveAssignment = async () => {
    if (isSaving) return; // Prevent multiple clicks
    setIsSaving(true);
    // Remove 'DRAFT' prefix from assignmentId if it exists
    const batch = writeBatch(db);
    const finalAssignmentId = assignmentId.startsWith('DRAFT') ? assignmentId.slice(5) : assignmentId;

    const formatQuestion = (question) => {
      const choiceKeys = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      const formattedQuestion = {
        questionId: question.questionId ||  uuidv4(),
        question: question.question || question.question || '',
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
    };
  
    const assignmentData = {
      classId,
      lockdown,
      onViolation: lockdown ? onViolation : null, 
      format: 'AMCQ',
      assignmentName,
      timer: timerOn ? Number(timer) : 0,
      assignDate: formatDate(assignDate),
      dueDate: formatDate(dueDate),
      selectedOptions: selectedOptions.map(option => typeof option === 'object' ? option.value : option),
      selectedStudents: Array.from(selectedStudents),
      feedback,
      saveAndExit,
      createdAt: serverTimestamp(),
      questions: generatedQuestions.map(formatQuestion)
    };
  
    try {
 
      const assignmentRef = doc(db, 'assignments', finalAssignmentId);
      await setDoc(assignmentRef, assignmentData);

      // Add assignment to class via Cloud Function
      const classRef = doc(db, 'classes', classId);
      batch.update(classRef, {
        assignments: arrayUnion({
          id: finalAssignmentId,
          name: assignmentName
        })
      });

      // If publishing from a draft, remove the draft
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
      await assignToStudents(finalAssignmentId);

      // Navigate with success message
      navigate(`/class/${classId}`, {
        state: {
          successMessage: `Success: ${assignmentName} published`,
          assignmentId: finalAssignmentId,
          format: 'AMCQ'
        }
      });
    } catch (error) {
      console.error("Error saving draft:", error);
      alert(`Error saving draft: ${error.message}. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };



  const isFormValid = () => {
    return assignmentName !== '' && assignDate !== '' && dueDate !== '';
  };

  const optionStyles = {
    2: { background: '#A3F2ED', color: '#00645E' },
    3: { background: '#AEF2A3', color: '#006428' },
    4: { background: '#F8CFFF', color: '#E01FFF' },
    5: { background: '#FFECA8', color: '#CE7C00' }
  };
  const { isPublishDisabled, publishDisabledConditions } = usePublishState(
    assignmentName, 
    generatedQuestions
  );
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
      borderColor: '#FFD13B',
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
  return (
    <div style={{    position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,    overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#white'}}>  <Navbar userType="teacher" />








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
   
 
  
   
   <div style={{ display: 'flex', alignItems: 'center', height: '30px', width: '502px', position: 'relative', marginTop: '0px', paddingBottom: '30px', marginLeft: 'auto',  }}>
               <label style={{ fontSize: '16px', color: 'grey',  marginRight: '38px', marginTop: '18px', fontFamily: "'montserrat', sans-serif", fontWeight: '600', marginLeft: '0px' }}>Feedback: </label>
             
             
             
          
             
             
             
             
             
               <div style={{ display: 'flex', borderRadius: '5px', justifyContent: 'space-around', width: '210px', marginLeft: 'auto', alignItems: 'center', marginTop: '20px', marginRight: '15px', background:'#f4f4f4', height: '28px' }}>
                 <div
                   style={{
                    
                    marginLeft: '4px',
                    height: '20px',
                    lineHeight: '20px',
                    fontSize: '12px',
                     width: '80px',
                     textAlign: 'center',
                     transition: '.3s',
                     borderRadius: '3px',
                     fontWeight: feedback === 'instant' ? '600' : '500',
                     backgroundColor: feedback === 'instant' ? 'white' : '#f4f4f4',
                     color: feedback === 'instant' ? 'black' : 'grey',
                     cursor: 'pointer',
                     
                     boxShadow:feedback === 'instant' ? '1px 1px 5px 1px rgb(0,0,155,.03)': 'none' ,
                   }}
                   onClick={() => setFeedback('instant')}
                 >
                   Instant
                 </div>
                 <div
                   style={{
                     height: '20px',
                     lineHeight: '20px',
                     fontSize: '12px',
                     marginLeft: 'auto',
                    
                     marginRight: '4px',
                     width: '120px',
                     textAlign: 'center',
                     transition: '.3s',
                     borderRadius: '3px',
                     backgroundColor: feedback === 'at_completion' ? 'white' : 'transparent',
                     fontWeight: feedback === 'at_completion' ? '600' : '500',
                     color: feedback === 'at_completion' ? 'black' : 'grey',
                     cursor: 'pointer',
                     boxShadow:feedback === 'at_completion' ? '1px 1px 5px 1px rgb(0,0,155,.03)': 'none' ,
                   }}
                   onClick={() => setFeedback('at_completion')}
                 >
                   At Completion
                 </div>
               </div>
             </div>

             <ChoicesPerQuestion
    selectedOptions={selectedOptions}
    onChange={setSelectedOptions}
  />
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
     <PreviewAMCQ
       questions={generatedQuestions}
       onBack={() => setCurrentStep(3)} // Navigate back to Generate Questions
       onSave={handleSaveQuestions}
       assignmentId={draftId || assignmentId} // Pass assignmentId for saving
       showCloseButton={false} // Hide the close button in stepper flow
     />
   
   </div>
 )}
     






    {/* Navigation Buttons */}
  
  </div>

  
                 {isSaving && <LoaderScreen />}
        
        
         
    

 



    </div>
  );
};

export default MCQA;
