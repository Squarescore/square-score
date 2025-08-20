import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, writeBatch, arrayUnion, serverTimestamp, arrayRemove, updateDoc, deleteDoc } from 'firebase/firestore';
import Navbar from '../../Universal/Navbar';
import SelectStudents from './SelectStudents';
import CustomDateTimePicker from './CustomDateTimePicker';
import 'react-datepicker/dist/react-datepicker.css';
import PreviewAMCQ from './previewAMCQ';
import axios from 'axios';
import { auth, db } from '../../Universal/firebase';
import { CalendarCog, SquareDashedMousePointer, Sparkles, GlobeLock, Eye, PencilRuler, SendHorizonal, ChevronDown, ChevronUp, CircleHelp, FileText, Landmark, SquareX, Settings, Sparkle, ChevronLast, ChevronLeft, ChevronRight  } from 'lucide-react';
import CustomExpandingFormatSelector from './ExpandingFormatSelector';
import SelectStudentsDW from './SelectStudentsDW';
import SecuritySettings from './SecuritySettings';
import DateSettings from './DateSettings';
import { 
  AssignmentName, 
  ChoicesPerQuestion, 
  FormatSection, 
  PreferencesSection, 
  TimerSection,
  FeedbackSelector,
  DateSettingsElement,
  SecuritySettingsElement
} from './Elements';
import { AssignmentActionButtons, usePublishState } from './AssignmentActionButtons';
import { safeClassUpdate } from '../../teacherDataHelpers';
import { v4 as uuidv4 } from 'uuid';
import Stepper from './Stepper'; // Import the Stepper component
import StepPreviewCards from './StepPreviewCards';
import { StepContainer } from './ContainerPost';
import SourcePreviewToggle from './SourcePreviewToggle';
import LoaderScreen from './LoaderScreen';
import { getFunctions, httpsCallable } from 'firebase/functions';
import SectorGenerationProgress from './SectorGenerationProgress';
import { GlassContainer } from '../../../styles';




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
  const [sectors, setSectors] = useState([]);
  const [currentSectorProgress, setCurrentSectorProgress] = useState(0);
  const [totalSectors, setTotalSectors] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const { classId, assignmentId } = useParams();
  const [progress, setProgress] = useState(0);
const [progressText, setProgressText] = useState('');
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [completedSectors, setCompletedSectors] = useState(new Set());
  const [showSectorProgress, setShowSectorProgress] = useState(false);

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



const identifySectors = async (text) => {
  try {
    const wordCount = text.trim().split(/\s+/).length;
    const functions = getFunctions();
    const identifySectorsFunction = httpsCallable(functions, 'identifySectors');
    
    const response = await identifySectorsFunction({
      text: text,
      wordCount: wordCount
    });

    console.log('Raw sectors response:', response);
    
    // The response.data might contain a nested structure from OpenAI
    let sectors;
    if (response.data.sectors) {
      sectors = response.data.sectors;
    } else if (Array.isArray(response.data)) {
      sectors = response.data;
    } else {
      // If the response contains a single object with sector information
      sectors = Object.values(response.data).filter(item => 
        item && typeof item === 'object' && 
        'sectorNumber' in item && 
        'sectorName' in item && 
        'sectorStart' in item && 
        'sectorEnd' in item
      );
    }

    if (!sectors || !Array.isArray(sectors) || sectors.length === 0) {
      throw new Error('Invalid sectors format in response');
    }

    // Validate each sector has required properties
    sectors = sectors.map((sector, index) => ({
      sectorNumber: sector.sectorNumber || index + 1,
      sectorName: sector.sectorName || `Sector ${index + 1}`,
      sectorStart: sector.sectorStart || 0,
      sectorEnd: sector.sectorEnd || 0
    }));

    console.log('Processed sectors:', sectors);

    // Update states and wait for them to complete
    await Promise.all([
      new Promise(resolve => {
        setSectors(sectors);
        setTimeout(resolve, 0);
      }),
      new Promise(resolve => {
        setTotalSectors(sectors.length);
        setTimeout(resolve, 0);
      })
    ]);

    return sectors;
  } catch (error) {
    console.error('Error identifying sectors:', error);
    console.error('Error details:', error.message);
    alert('Error identifying sectors. Please try again.');
    throw error;
  }
};

const generateQuestionsForSector = async (sectorText, sectorNumber) => {
  try {
    const functions = getFunctions();
    const generateSectorQuestionsFunction = httpsCallable(functions, 'generateSectorQuestions');
    
    // Convert selectedOptions to array of numbers if they're not already
    const choiceCounts = selectedOptions.map(opt => 
      typeof opt === 'number' ? opt : parseInt(opt.value || opt, 10)
    ).filter(count => !isNaN(count) && count >= 2 && count <= 5);

    if (choiceCounts.length === 0) {
      throw new Error('No valid choice counts selected');
    }
    
    const response = await generateSectorQuestionsFunction({
      sectorText: sectorText,
      sectorNumber: sectorNumber,
      choiceCounts: choiceCounts,
      minQuestionsPerDifficulty: 1 // At least one question per difficulty level
    });

    if (!response.data || !response.data.questions || !Array.isArray(response.data.questions)) {
      throw new Error('Invalid response format from question generation');
    }

    return response.data.questions;
  } catch (error) {
    console.error(`Error generating questions for sector ${sectorNumber}:`, error);
    alert(`Error generating questions for sector ${sectorNumber}. Please try again.`);
    throw error;
  }
};

const generateQuestions = async () => {
  try {
    if (!sourceText.trim()) {
      alert('Please enter source text before generating questions.');
      return;
    }

    if (selectedOptions.length === 0) {
      alert('Please select at least one choice count option.');
      return;
    }

    // Reset all states first
    setGenerating(true);
    setProgress(0);
    setProgressText('0%');
    setGeneratedQuestions([]);
    setShowPreview(false);
    setCompletedSectors(new Set());
    setShowSectorProgress(false); // Start with progress screen hidden

    // Wait for state updates to complete
    await new Promise(resolve => setTimeout(resolve, 0));

    console.log('Starting sector identification...');
    // First identify sectors
    const identifiedSectors = await identifySectors(sourceText);
    if (!Array.isArray(identifiedSectors)) {
      throw new Error('Invalid sectors response');
    }

    console.log('Sectors identified, showing progress screen...');
    // Show sector progress screen AFTER sectors are identified
    setShowSectorProgress(true);
    // Give time for the progress screen to appear
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('Processing sectors...');
    // Process all sectors in parallel
    const sectorPromises = identifiedSectors.map((sector, index) => {
      const words = sourceText.trim().split(/\s+/);
      const sectorText = words.slice(
        Math.max(0, sector.sectorStart - 1), 
        Math.min(words.length, sector.sectorEnd)
      ).join(' ');

      return generateQuestionsForSector(sectorText, sector.sectorNumber)
        .then(questions => {
          // Update progress after each sector completes
          const progress = ((index + 1) / identifiedSectors.length) * 100;
          setProgress(progress);
          setProgressText(`${Math.round(progress)}%`);
          setCurrentSectorProgress(index + 1);
          // Mark this sector as completed
          setCompletedSectors(prev => new Set([...prev, sector.sectorNumber]));
          return questions;
        })
        .catch(error => {
          console.error(`Error processing sector ${index + 1}:`, error);
          return []; // Return empty array for failed sectors
        });
    });

    // Wait for all sectors to complete
    const sectorResults = await Promise.all(sectorPromises);
    
    // Combine all questions
    const allQuestions = sectorResults.flat();

    if (allQuestions.length === 0) {
      throw new Error('No questions were successfully generated');
    }
    
    // Sort questions by sector and then by difficulty score
    const sortedQuestions = allQuestions.sort((a, b) => {
      if (a.sectorNumber !== b.sectorNumber) {
        return a.sectorNumber - b.sectorNumber;
      }
      return a.difficultyScore - b.difficultyScore;
    });

    // Ensure we show the progress screen for at least 1 second after completion
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Generation complete, transitioning to preview...');
    // Final state updates
    await Promise.all([
      new Promise(resolve => {
        setGeneratedQuestions(sortedQuestions);
        setTimeout(resolve, 0);
      }),
      new Promise(resolve => {
        setShowSectorProgress(false);
        setTimeout(resolve, 0);
      }),
      new Promise(resolve => {
        setShowPreview(true);
        setTimeout(resolve, 0);
      }),
      new Promise(resolve => {
        setCurrentStep(4);
        setTimeout(resolve, 0);
      })
    ]);
  } catch (error) {
    console.error('Error in generateQuestions:', error);
    alert(`Error generating questions: ${error.message}. Please try again.`);
    setShowSectorProgress(false);
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
        questions: generatedQuestions.map(formatQuestion),
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

  // Format questions consistently
  const formatQuestion = (question) => {
    const formattedQuestion = {
      questionId: question.questionId || uuidv4(),
      question: question.question || '',
      difficultyScore: question.difficultyScore || 1.0,
      sectorNumber: question.sectorNumber || 1,
      correctChoice: question.correctChoice || '', // Use correctChoice consistently
      choices: question.choices || [],
      explanations: question.explanations || [], // Keep explanations array as is
    };
    
    // Ensure we have the correct choice
    if (!formattedQuestion.correctChoice && question.correct) {
      formattedQuestion.correctChoice = question.correct;
    }
    
    // Ensure explanations array exists and matches choices length
    if (!formattedQuestion.explanations.length && formattedQuestion.choices.length) {
      formattedQuestion.explanations = formattedQuestion.choices.map(() => '');
    }
    
    // Remove any legacy fields that aren't needed
    delete formattedQuestion.difficulty; // We use difficultyScore instead
    delete formattedQuestion.correct; // We use correctChoice consistently
    
    return formattedQuestion;
  };

  const saveAssignment = async () => {
    if (isSaving) return;
    setIsSaving(true);
    
    try {
      const finalAssignmentId = assignmentId.startsWith('DRAFT') ? assignmentId.slice(5) : assignmentId;
      const batch = writeBatch(db);
  
      // Create assignment data
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
  
      // Save assignment document
      const assignmentRef = doc(db, 'assignments', finalAssignmentId);
      batch.set(assignmentRef, assignmentData);
  
      // Add assignment to class document - matching CreateAssignment.js pattern
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
          format: 'AMCQ'
        }
      });
    } catch (error) {
      console.error("Error saving assignment:", error);
      alert(`Error saving assignment: ${error.message}. Please try again.`);
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

     <FeedbackSelector
       value={feedback}
       onChange={setFeedback}
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

    {generating && showSectorProgress && (
      <>
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(5px)',
          zIndex: 999
        }} />
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          maxWidth: '800px',
          zIndex: 1000,
        }}>
          <SectorGenerationProgress
            sectors={sectors}
            completedSectors={completedSectors}
          />
        </div>
      </>
    )}

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
       sectors={sectors}
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
