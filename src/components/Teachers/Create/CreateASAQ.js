import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, setDoc,updateDoc, writeBatch, arrayUnion, serverTimestamp, getDoc, arrayRemove } from 'firebase/firestore';

import { CalendarCog, SquareDashedMousePointer, Sparkles, GlobeLock, PencilRuler, Eye, SendHorizonal, SquareX, ChevronUp, ChevronDown, Settings,  } from 'lucide-react';
import { db } from '../../Universal/firebase';  // Ensure the path is correct
import TeacherPreviewASAQ from './PreviewASAQ';
import { auth } from '../../Universal/firebase';
import '../../Universal//SwitchGreen.css';
import Navbar from '../../Universal/Navbar';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import DateSettings, { formatDate } from './DateSettings';
import SecuritySettings from './SecuritySettings';
import SelectStudentsDW from './SelectStudentsDW';
import { AssignmentActionButtons, usePublishState } from './AssignmentActionButtons';
import { v4 as uuidv4 } from 'uuid';
import { AssignmentName, FormatSection, PreferencesSection, QuestionCountSection, TimerSection, ToggleSwitch} from './Elements';

import SourcePreviewToggle from './SourcePreviewToggle';
import StepPreviewCards from './StepPreviewCards';
import { StepContainer } from './ContainerPost';
import Stepper from './Stepper';
import LoaderScreen from './LoaderScreen';

function SAQA() {
  const [showPreview, setShowPreview] = useState(false);
  const [assignmentName, setAssignmentName] = useState('');
  const [timer, setTimer] = useState('60');
  const [halfCredit, setHalfCredit] = useState(false);
  const [saveAndExit, setSaveAndExit] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [lockdown, setLockdown] = useState(false);
  
  const [onViolation, setOnViolation] = useState('pause');
  const [assignmentType, setAssignmentType] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('ASAQ');
  const [teacherId, setTeacherId] = useState(null);
  const [assignDate, setAssignDate] = useState(new Date());
  const [dueDate, setDueDate] = useState(new Date());
  
  const [visitedSteps, setVisitedSteps] = useState([]);
  const [sourceText, setSourceText] = useState('');
  const [questionBank, setQuestionBank] = useState('40');
  const [timerOn, setTimerOn] = useState(false);
  const location = useLocation();
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [draftId, setDraftId] = useState(null);
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
      const user = auth.currentUser;
      if (user) {
        setTeacherId(user.uid);
      } else {
        console.error("No authenticated user found");
      }
    };
    fetchTeacherId();
  
    // Add draft loading logic
    if (assignmentId && assignmentId.startsWith('DRAFT')) {
      const draftIdWithoutPrefix = assignmentId.slice(5); // Remove 'DRAFT' prefix
      setDraftId(draftIdWithoutPrefix);
      loadDraft(draftIdWithoutPrefix); // Load the draft data
    }
  }, [classId, assignmentId]);

  const nextStep = () => {
    if (currentStep === 3 && showPreview && generatedQuestions.length > 0) {
      alert('Please generate questions before proceeding to Preview.');
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
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
              questionId: uuidv4(),
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
    if (isSaving) return;
    setIsSaving(true);
  
    try {
      const finalAssignmentId = assignmentId.startsWith('DRAFT') ? assignmentId.slice(5) : assignmentId;
      const batch = writeBatch(db);
  
      // Format the questions
      const formattedQuestions = {};
      generatedQuestions.forEach((question, index) => {
        formattedQuestions[`question${index + 1}`] = {
          question: question.question,
          rubric: question.rubric,
          difficulty: question.difficulty
        };
      });
  
      // Create assignment document
      const assignmentRef = doc(db, 'assignments', finalAssignmentId);
      batch.set(assignmentRef, {
        classId,
        format: 'ASAQ',
        assignmentName,
        timer: timerOn ? Number(timer) : 0,
        halfCredit,
        assignmentType,
        assignDate: convertToDateTime(assignDate),
        dueDate: convertToDateTime(dueDate),
        selectedStudents: Array.from(selectedStudents),
        questionCount: {
          bank: questionBank,
        },
        createdAt: serverTimestamp(),
        questions: formattedQuestions,
        
      onViolation: lockdown ? onViolation : null, 
        lockdown,
        saveAndExit,
        isAdaptive
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
          format: 'ASAQ'
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
      // Generate a new draft ID if none exists
      const finalDraftId = draftId || `${classId}+${Date.now()}+ASAQ`;
      const batch = writeBatch(db);
  
      // Save draft document
      const draftRef = doc(db, 'drafts', finalDraftId);
      batch.set(draftRef, {
        classId,
        format: 'ASAQ',
        assignmentName,
        timer: timerOn ? Number(timer) : 0,
        halfCredit,
        assignmentType,
        assignDate: convertToDateTime(assignDate),
        dueDate: convertToDateTime(dueDate),
        selectedStudents: Array.from(selectedStudents),
        questionCount: {
          bank: questionBank,
        },
        createdAt: serverTimestamp(),
        questions: generatedQuestions.reduce((acc, question, index) => {
          acc[`question${index + 1}`] = {
            question: question.question,
            rubric: question.rubric
          };
          return acc;
        }, {}),
        
      onViolation: lockdown ? onViolation : null, 
        lockdown,
        saveAndExit,
        isAdaptive,
        sourceText,
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
  
  // Load draft helper function
  const loadDraft = async (draftId) => {
    const draftRef = doc(db, 'drafts', draftId);
    const draftDoc = await getDoc(draftRef);
    
    if (draftDoc.exists) {
      const data = draftDoc.data();
      setAssignmentName(data.assignmentName || '');
      setTimer(data.timer?.toString() || '60');
      setTimerOn(data.timerOn || false);
      setHalfCredit(data.halfCredit || false);
      
      // Handle dates
      if (data.assignDate) {
        setAssignDate(new Date(data.assignDate));
      }
      if (data.dueDate) {
        setDueDate(new Date(data.dueDate));
      }
      
      setOnViolation(data.onViolation || 'pause');
      setSelectedStudents(new Set(data.selectedStudents || []));
      setQuestionBank(data.questionBank?.toString() || '40');
      setSaveAndExit(data.saveAndExit !== undefined ? data.saveAndExit : true);
      setLockdown(data.lockdown || false);
      setIsAdaptive(data.isAdaptive || true);
      setSourceText(data.sourceText || '');
      setAdditionalInstructions(data.additionalInstructions || '');
      
      if (data.questions) {
        const questionsArray = Object.entries(data.questions).map(([id, questionData]) => ({
          questionId: id,
          ...questionData
        }));
        setGeneratedQuestions(questionsArray);
        setQuestionsGenerated(true);
      }
    }
  };

  
  const isFormValid = () => {
    return assignmentName !== '' && assignDate !== '' && dueDate !== '';
  };
  
  
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

  const { isPublishDisabled, publishDisabledConditions } = usePublishState(
    assignmentName, 
    generatedQuestions
  );
  
  const handleGenerateClick = async () => {
    if (generatedQuestions.length > 0) {
      setCurrentStep(4);
    } else {
      setGenerating(true);
      try {
        const questions = await GenerateASAQ(sourceText, questionBank, additionalInstructions, classId, teacherId);
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

 
    return (
      <div style={{    position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,    overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#white'}}> 
        <Navbar userType="teacher" />
      
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
   
 
  


          
<ToggleSwitch
        label="Half Credit"
        value={halfCredit}
        onChange={setHalfCredit}
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
          color="#FFAE00"   widt
          
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
      <div style={{width: '730px', padding: '15px', top:'-60px', position: 'absolute' , left:' 50%', transform: 'translatex(-50%) ', zIndex: '10', fontFamily: "'montserrat', sans-serif", background: 'white', borderRadius: '25px', height: '450px',
        boxShadow: '1px 1px 10px 1px rgb(0,0,155,.1)', marginBottom: '40px' }}>
      
      
      <div style={{ marginLeft: '0px', color: '#E01FFF', margin: '-15px', padding: '10px 10px 10px 20px',  border: '10px solid #E01FFF', borderRadius: '30px 30px 0px 0px', fontFamily: "'montserrat', sans-serif",  fontSize: '40px', display: 'flex', width: '710px', background: '#F8CAFF', marginBottom: '180px', fontWeight: 'bold' }}>
       
       
 <Sparkles size={40} strokeWidth={2.5} style={{marginRight: '10px', marginTop: '5px'}}/>
        Generate Questions
        
        </div>
        
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


          <div >
            <div style={{ marginTop: '-30px' }}>
       

      

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
  setQuestionBank={setQuestionBank}
/>



            </div>
          </div>
          </div>
  
          </div>

    
         
          </div></div>
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
     <TeacherPreviewASAQ
        questionsWithIds={generatedQuestions}
        setQuestionsWithIds={setGeneratedQuestions}
        sourceText={sourceText}
        questionCount={questionBank}
        classId={classId}
        teacherId={teacherId} // Hide the close button in stepper flow
     />
 
   </div>
 )}



 
</div>      
























      </div>
    );
  };



export default SAQA;
