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
import { CalendarCog, SquareDashedMousePointer, Sparkles, GlobeLock, Eye, PencilRuler, SendHorizonal, ChevronDown, ChevronUp, CircleHelp, FileText, Landmark, SquareX  } from 'lucide-react';
import CustomExpandingFormatSelector from './ExpandingFormatSelector';
import SelectStudentsDW from './SelectStudentsDW';
import SecuritySettings from './SecuritySettings';
import DateSettings from './DateSettings';
import { AssignmentName, ChoicesPerQuestion, FormatSection, PreferencesSection, TimerSection, ToggleSwitch } from './Elements';
import { AssignmentActionButtons, usePublishState } from './AssignmentActionButtons';
import { safeClassUpdate } from '../../teacherDataHelpers';
import { v4 as uuidv4 } from 'uuid';
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


const SourcePreviewToggle = ({ 
  sourceText, 
  onSourceChange, 
  additionalInstructions, 
  onAdditionalInstructionsChange,
  onPreviewClick,
  onGenerateClick,
  generating,
  generatedQuestions,
  progress,
  progressText
}) => {
  const [showSource, setShowSource] = useState(false);

  if (!generatedQuestions || generatedQuestions.length === 0) {
    return (
      <div style={{ width: '100%' }}>
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

        {/* Generate Button */}
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '20px', marginBottom: '20px' }}>
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
          {generating && (
            <div style={{ width: '300px', marginLeft: '20px' }}>
              <div style={{
                height: '20px',
                backgroundColor: '#e0e0e0',
                borderRadius: '10px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min(progress, 100)}%`,
                  height: '100%',
                  backgroundColor: '#020CFF',
                  transition: 'width 0.1s ease-in-out'
                }}></div>
              </div>
              <div style={{ textAlign: 'center', marginTop: '5px', fontSize: '14px', color: '#666' }}>
                {progressText}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const buttonBaseStyle = {
    display: 'flex',
    alignItems: 'center',
    height: '45px',
    borderRadius: '10px',
    border: '3px solid',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    fontFamily: "'montserrat', sans-serif",
    fontWeight: '600',
    fontSize: '16px',
    marginRight: '16px'
  };

  const activeSourceStyle = {
    ...buttonBaseStyle,
    backgroundColor: '#F5B6FF',
    borderColor: '#E441FF',
    padding: '0px 10px',
    color: '#E441FF'
  };

  const inactiveSourceStyle = {
    ...buttonBaseStyle,
    backgroundColor: 'white',
    borderColor: '#d1d1d1',
    width: '120px',
    
    padding: '0px 10px',
    color: '#9ca3af'
  };

  const activePreviewStyle = {
    ...buttonBaseStyle,
    backgroundColor: '#F4F4F4',
    borderColor: '#DFDFDF',
    
    padding: '0px 10px',
    color: '#A5A5A5'
  };

  const inactivePreviewStyle = {
    ...buttonBaseStyle,
    backgroundColor: 'white',
    borderColor: '#d1d1d1',
    color: '#9ca3af'
  };

  return (
    <div style={{ width: '100%', marginTop: '0px' }}>
      <div style={{ display: 'flex' }}>
        <button
          onClick={() => setShowSource(true)}
          style={showSource ? activeSourceStyle : inactiveSourceStyle}
        >
          <FileText size={24} style={{ marginRight: '10px',  }} />
          <span>Source</span>
        </button>
        
        <button
          onClick={() => {
            setShowSource(false);
            onPreviewClick();
          }}
          style={!showSource ? activePreviewStyle : inactivePreviewStyle}
        >
          <Landmark size={24} style={{ marginRight: '8px' }} />
          <span> Preview Question Bank</span>
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
        </div>
      )}
    </div>
  );
};
const MCQA = () => {
  const [questionsLoaded, setQuestionsLoaded] = useState(false);

  const [assignmentName, setAssignmentName] = useState('');
  const [timer, setTimer] = useState('60');
  const [securityDropdownOpen, setSecurityDropdownOpen] = useState(false);
  const [contentDropdownOpen, setContentDropdownOpen] = useState(false);
  const [timerOn, setTimerOn] = useState(false);
  const [feedback, setFeedback] = useState('instant');
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([4]);
  const [saveAndExit, setSaveAndExit] = useState(true);
  const [lockdown, setLockdown] = useState(false);
  const [questionsGenerated, setQuestionsGenerated] = useState(false);
  const [teacherId, setTeacherId] = useState(null);
  const [assignDate, setAssignDate] = useState(new Date());

  const [selectedFormat, setSelectedFormat] = useState('AMCQ');
  const [dueDate, setDueDate] = useState(new Date(new Date().getTime() + 48 * 60 * 60 * 1000)); // 48 hours from now

  
  const [draftId, setDraftId] = useState(null);
  const [sourceOption, setSourceOption] = useState(null);
  const [sourceText, setSourceText] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [questionBank, setQuestionBank] = useState('');
  const [questionStudent, setQuestionStudent] = useState('');
  const [studentsDropdownOpen, setStudentsDropdownOpen] = useState(false);
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
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Set due date to 48 hours after assign date whenever assign date changes
    setDueDate(new Date(assignDate.getTime() + 48 * 60 * 60 * 1000));
  }, [assignDate]);
  const toggleAdditionalInstructions = () => {
    setShowAdditionalInstructions(!showAdditionalInstructions);
    if (showAdditionalInstructions) {
      setAdditionalInstructions('');
    }
  };
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
        color: '#020CFF',
        fontWeight: '600'
      }}>
        Saving...
      </div>
    </div>
  );
  const handlePrevious = () => {
    navigate(-1);
  };

  const isReadyToPublish = () => {
    return (
      assignmentName !== '' &&
      assignDate.getTime() !== dueDate.getTime() &&
      generatedQuestions.length > 0
    );
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
  const ProgressBar = ({ progress, text }) => (
    <div style={{ width: '300px', marginLeft: '20px' }}>
      <div style={{
        height: '20px',
        backgroundColor: '#e0e0e0',
        borderRadius: '10px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${Math.min(progress, 100)}%`,
          height: '100%',
          backgroundColor: '#020CFF',
          transition: 'width 0.1s ease-in-out'
        }}></div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '5px', fontSize: '14px', color: '#666' }}>
        {text}
      </div>
    </div>
  );

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


  
  const parseQuestions = (response) => {
    let data = response.data;

    for (let i = 0; i < 2; i++) {  // Loop exactly twice
        // If data is an object with a 'questions' property, use that
        if (typeof data === 'object' && data !== null && data.questions) {
            data = data.questions;
        }

        // If data is a string, try to parse it
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (error) {
                console.error("Error parsing response. Full response text:", data);
                return [];
            }
        }

        // Ensure data is an array
        if (!Array.isArray(data)) {
            data = [data];
        }

        // Filter out any non-object elements
        data = data.filter(item => typeof item === 'object' && item !== null);

        if (data.length === 0) {
            console.error("Failed to parse response. Full response text:", response.data);
            return [];
        }

        // Clean the data by removing inner quotes (global replace)
        data = data.map(question => {
            for (let key in question) {
                if (typeof question[key] === 'string') {
                    // Remove all inner double quotes
                    question[key] = question[key].replace(/"/g, '');
                }
            }
            return question;
        });

        // After the first pass, set response.data to the cleaned data
        response.data = data;
    }

    return data;
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
      setShowPreview(true);
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
        setQuestionsLoaded(true);
      }
    }
  };

  const saveDraft = async () => {
    
    if (isSaving) return; // Prevent multiple clicks
    setIsSaving(true);
   
    const draftData = {
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
      createdAt: serverTimestamp(),
      questions: generatedQuestions,
      sourceOption,
      sourceText,
      youtubeLink,
      questionBank,
      questionStudent,
      additionalInstructions
    };
  
    const newDraftId = draftId || `${classId}+${Date.now()}+AMCQ`;
    const draftRef = doc(db, 'drafts', newDraftId);
    
    try {
      await setDoc(draftRef, draftData);



      await safeClassUpdate('addDraftToClass', { 
        classId, 
        assignmentId,
        assignmentName
      });

      // Update the class document with the new draft ID
      const classRef = doc(db, 'classes', classId);
      await updateDoc(classRef, {
        [`assignment(amcq)`]: arrayUnion(newDraftId)
      });
  
      setDraftId(newDraftId);
      
      navigate(`/class/${classId}/Assignments`, {
        state: { showDrafts: true, newDraftId: newDraftId }
      });
    } catch (error) {
      console.error("Error saving draft:", error);
      alert(`Error saving draft: ${error.message}. Please try again.`);
    } finally {
      setIsSaving(false);
    }
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

  const saveAssignment = async () => {
    if (isSaving) return; // Prevent multiple clicks
    setIsSaving(true);
    // Remove 'DRAFT' prefix from assignmentId if it exists
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
      
      format: 'AMCQ',
      assignmentName,
      timer: timerOn ? Number(timer) : 0,
      assignDate: formatDate(assignDate),
      dueDate: formatDate(dueDate),
      selectedOptions: selectedOptions.map(option => typeof option === 'object' ? option.value : option),
      selectedStudents: Array.from(selectedStudents),
      feedback,
      saveAndExit,
      lockdown,
      createdAt: serverTimestamp(),
      questions: generatedQuestions.map(formatQuestion)
    };
  
    try {
 
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
  return (
    <div style={{    position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,    overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#fcfcfc'}}>  <Navbar userType="teacher" />
      <style>{dropdownContentStyle}{loaderStyle}</style>
      <div style={{ marginTop: '150px', width: '800px', padding: '15px', marginLeft: 'auto', marginRight: 'auto', fontFamily: "'montserrat', sans-serif", background: 'white', borderRadius: '25px', 
               boxShadow: '1px 1px 10px 1px rgb(0,0,155,.1)', marginBottom: '40px' }}>
       
                 {isSaving && <LoaderScreen />}
        
        
         
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
      
    
     
      
      <div style={{ display: 'flex', alignItems: 'center', height: '80px', width: '700px', position: 'relative', marginTop: '-30px', paddingBottom: '20px' }}>
                  <label style={{ fontSize: '25px', color: 'black',  marginRight: '38px', marginTop: '13px', fontFamily: "'montserrat', sans-serif", fontWeight: '600', marginLeft: '0px' }}>Feedback: </label>
                  <div style={{ display: 'flex', justifyContent: 'space-around', width: '350px', marginLeft: 'auto', alignItems: 'center', marginTop: '20px', marginRight: '10px' }}>
                    <div
                      style={{
                        height: '40px',
                        lineHeight: '40px',
                        fontSize: '20px',
                        width: '120px',
                        textAlign: 'center',
                        transition: '.3s',
                        borderRadius: '10px',
                        fontWeight: feedback === 'instant' ? '600' : '500',
                        backgroundColor: feedback === 'instant' ? '#AEF2A3' : 'white',
                        color: feedback === 'instant' ? '#2BB514' : 'grey',
                        border: feedback === 'instant' ? '3px solid #2BB514' : '3px solid transparent',
                        cursor: 'pointer'
                      }}
                      onClick={() => setFeedback('instant')}
                    >
                      Instant
                    </div>
                    <div
                      style={{
                        height: '40px',
                        lineHeight: '40px',
                        fontSize: '20px',
                        marginLeft: 'auto',
                        width: '200px',
                        textAlign: 'center',
                        transition: '.3s',
                        borderRadius: '10px',
                        backgroundColor: feedback === 'at_completion' ? '#AEF2A3' : 'white',
                        fontWeight: feedback === 'at_completion' ? '600' : '500',
                        color: feedback === 'at_completion' ? '#2BB514' : 'grey',
                        border: feedback === 'at_completion' ? '3px solid #2BB514' : '3px solid transparent',
                        cursor: 'pointer'
                      }}
                      onClick={() => setFeedback('at_completion')}
                    >
                      At Completion
                    </div>
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

         










            {showPreview && generatedQuestions && generatedQuestions.length > 0 && (
              <div style={{ width: '100%', position: 'absolute', zIndex: 100, background: 'white', top: '70px', left: '0%' }}>
                <PreviewAMCQ
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
                <h1 style={{ fontSize: '16px', marginLeft: '10px', marginRight: 'auto', fontFamily: "'montserrat', sans-serif", color: 'lightgrey' }}>Generate Questions</h1>
            
              </div>

              <div >
                <div style={{ marginTop: '-30px' }}>
               
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

export default MCQA;
