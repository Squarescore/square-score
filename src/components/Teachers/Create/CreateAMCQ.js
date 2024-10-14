import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, writeBatch, arrayUnion, serverTimestamp, arrayRemove, updateDoc } from 'firebase/firestore';
import Navbar from '../../Universal/Navbar';
import SelectStudents from './SelectStudents';
import CustomDateTimePicker from './CustomDateTimePicker';
import 'react-datepicker/dist/react-datepicker.css';
import PreviewAMCQ from './previewAMCQ';
import axios from 'axios';
import { auth,db } from '../../Universal/firebase';
import { CalendarCog, SquareDashedMousePointer, Sparkles, GlobeLock, Eye, PencilRuler  } from 'lucide-react';
import CustomExpandingFormatSelector from './ExpandingFormatSelector';
import SelectStudentsDW from './SelectStudentsDW';
import SecuritySettings from './SecuritySettings';
import DateSettings from './DateSettings';

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
    // Remove 'DRAFT' prefix from assignmentId if it exists
    const finalAssignmentId = assignmentId.startsWith('DRAFT') ? assignmentId.slice(5) : assignmentId;
  
    const formatQuestion = (question) => {
      const choiceKeys = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      const formattedQuestion = {
        questionId: question.questionId || `question_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
      console.log("Attempting to save assignment with data:", assignmentData);
      
      const assignmentRef = doc(db, 'assignments(Amcq)', finalAssignmentId);
      await setDoc(assignmentRef, assignmentData, { merge: true });
      
      console.log("Assignment saved successfully. Assigning to students...");
      
      await assignToStudents(finalAssignmentId);
      
      console.log("Assignment assigned to students successfully.");
  
      // Delete the draft document if it exists
      if (draftId) {
        const draftRef = doc(db, 'drafts', draftId);
        await setDoc(draftRef, {});
  
        // Update the class document
        const classRef = doc(db, 'classes', classId);
        await updateDoc(classRef, {
          [`assignments(Amcq)`]: arrayRemove(assignmentId) // Remove the draft ID (with DRAFT prefix)
        });
        await updateDoc(classRef, {
          [`assignments(Amcq)`]: arrayUnion(finalAssignmentId) // Add the final assignment ID
        });
      }
  
      const format = finalAssignmentId.split('+').pop(); // Get the format from the assignment ID
  
      navigate(`/class/${classId}`, {
        state: {
          successMessage: `Success: ${assignmentName} published`,
          assignmentId: finalAssignmentId,
          format: format
        }
      });
    } catch (error) {
      console.error("Error saving assignment:", error);
      console.error("Error details:", error.message);
      if (error.code) {
        console.error("Error code:", error.code);
      }
      alert(`Error publishing assignment: ${error.message}. Please try again.`);
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

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
      <Navbar userType="teacher" />
      <style>{dropdownContentStyle}{loaderStyle}</style>
      <div style={{ marginTop: '30px', width: '800px', marginLeft: 'auto', marginRight: 'auto', fontFamily: "'montserrat', sans-serif",  }}>
 
              
        <button
          onClick={handlePrevious}
          style={{
            position: 'fixed',
            width: '75px',
            height: '75px',
            padding: '10px 20px',
            left: '10%',
            top: '460px',
            bottom: '20px',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            border: 'none',
            fontSize: '30px',
            color: '#45B434',
            borderRadius: '10px',
            fontWeight: 'bold',
            fontFamily: "'montserrat', sans-serif",
            transition: '.5s',
            transform: 'scale(1)',
            opacity: '100%'
          }}
         
        >
        </button>
        
        <div style={{ marginLeft: '30px',  fontFamily: "'montserrat', sans-serif", color: 'black', fontSize: '60px', display: 'flex',marginTop: '130px', marginBottom: '180px', fontWeight: 'bold' }}>
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

        <div style={{ width: '100%', height: 'auto', marginTop: '-200px', border: '10px solid transparent', borderRadius: '20px', padding: '20px' }}>
          <div style={{ width: '810px', marginLeft: 'auto', marginRight: 'auto', marginTop: '30px' }}>
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
      color: 'grey',
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
      fontFamily: "'montserrat', sans-serif",
      fontWeight: 'bold',
      marginBottom: '20px'
    }}
    value={assignmentName}
    onChange={(e) => setAssignmentName(e.target.value)}
  />
  <span style={{
    position: 'absolute',
    right: '20px',
    bottom: '30px',
    fontSize: '14px',
    color: 'grey',
    fontFamily: "'montserrat', sans-serif",
  }}>
    {assignmentName.length}/25
  </span>
</div>
            <div style={{ width: '810px', display: 'flex' }}>
              <div style={{ marginBottom: '0px', width: '790px', height: '200px', borderRadius: '10px', border: '4px solid #F4F4F4' }}>
                <div style={{ width: '730px', marginLeft: '20px', height: '80px', borderBottom: '4px solid #f4f4f4', display: 'flex', position: 'relative', alignItems: 'center', borderRadius: '0px', padding: '10px' }}>
                  <h1 style={{ fontSize: '30px', color: 'black', width: '300px', paddingLeft: '0px' }}>Timer:</h1>
                  {timerOn ? (
                    <div style={{ display: 'flex', alignItems: 'center', position: 'relative', marginLeft: '30px' }}>
                      <input
                        type="number"
                        style={{
                          marginLeft: '-200px',
                          height: '30px',
                          width: '50px',
                          textAlign: 'center',
                          fontWeight: 'bold',
                          border: '4px solid transparent',
                          outline: 'none',
                          borderRadius: '5px',
                          fontSize: '30px',
                        }}
                        placeholder="10"
                        value={timer}
                        onChange={(e) => setTimer(e.target.value)}
                      />
                      <h1 style={{ marginLeft: '-5px', fontSize: '26px' }}>Minutes</h1>
                    </div>
                  ) : (
                    <span style={{
                      marginLeft: '-150px',
                      height: '30px',
                      width: '50px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      marginTop: '0px',
                      fontSize: '30px',
                      color: 'grey'
                    }}>
                      Off
                    </span>
                  )}
                  <input
                    style={{ marginLeft: 'auto' }}
                    type="checkbox"
                    className="greenSwitch"
                    checked={timerOn}
                    onChange={() => setTimerOn(!timerOn)}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', height: '80px', width: '750px', marginLeft: '20px', borderBottom: '0px solid lightgrey', position: 'relative', marginTop: '0px', paddingBottom: '20px' }}>
                  <label style={{ fontSize: '30px', color: 'black', marginLeft: '10px', marginRight: '38px', marginTop: '13px', fontFamily: "'montserrat', sans-serif", fontWeight: 'bold' }}>Feedback: </label>
                  <div style={{ display: 'flex', justifyContent: 'space-around', width: '500px', marginLeft: '100px', alignItems: 'center', marginTop: '20px' }}>
                    <div
                      style={{
                        height: '40px',
                        lineHeight: '40px',
                        fontSize: '20px',
                        width: '160px',
                        textAlign: 'center',
                        transition: '.3s',
                        borderRadius: '5px',
                        fontWeight: feedback === 'instant' ? 'bold' : '600',
                        backgroundColor: feedback === 'instant' ? '#AEF2A3' : 'white',
                        color: feedback === 'instant' ? '#2BB514' : 'grey',
                        border: feedback === 'instant' ? '4px solid #2BB514' : '4px solid transparent',
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
                        marginLeft: '20px',
                        width: '230px',
                        textAlign: 'center',
                        transition: '.3s',
                        borderRadius: '5px',
                        backgroundColor: feedback === 'at_completion' ? '#AEF2A3' : 'white',
                        fontWeight: feedback === 'at_completion' ? 'bold' : '600',
                        color: feedback === 'at_completion' ? '#2BB514' : 'grey',
                        border: feedback === 'at_completion' ? '4px solid #2BB514' : '4px solid transparent',
                        cursor: 'pointer'
                      }}
                      onClick={() => setFeedback('at_completion')}
                    >
                      At Completion
                    </div>
                  </div>
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

         










            {showPreview && generatedQuestions && generatedQuestions.length > 0 && (
              <div style={{ width: '100%', position: 'absolute', zIndex: 100, background: 'white', top: '70px', left: '0%' }}>
                <PreviewAMCQ
                  questions={generatedQuestions}
                  onBack={() => setShowPreview(false)}
                  onSave={handleSaveQuestions}
                />
              </div>
            )}

            <div style={{ width: '770px', padding: '10px', marginTop: '20px', border: '4px solid #F4F4F4', borderRadius: '10px', marginBottom: '20px', zIndex: '-10' }}>
              <button
                onClick={() => setContentDropdownOpen(!contentDropdownOpen)}
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
                <Sparkles size={40} color="#000000" />
                <h1 style={{ fontSize: '30px', marginLeft: '20px', marginRight: 'auto', fontFamily: "'montserrat', sans-serif" }}>Generate Questions</h1>
                <img
                  src={contentDropdownOpen ? '/Up.png' : '/Down.png'}
                  alt={contentDropdownOpen ? "Collapse" : "Expand"}
                  style={{ width: '20px' }}
                />
              </button>

              <div className={`dropdown-content ${contentDropdownOpen ? 'open' : ''}`}>
                <div style={{ marginTop: '10px' }}>
               

                  <div style={{ width: '750px', height: '80px', border: '4px solid transparent', display: 'flex', position: 'relative', alignItems: 'center', borderRadius: '10px', padding: '10px', marginLeft: '-10px' }}>
                  <h1 style={{ fontSize: '25px', color: 'black', width: '400px', paddingLeft: '20px' }}>Choices Per Question</h1>
                  <div style={{ marginLeft: 'auto', marginTop: '45px', display: 'flex', position: 'relative', alignItems: 'center' }}>
                    {[2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        onClick={() => {
                          if (selectedOptions.includes(num)) {
                            setSelectedOptions(selectedOptions.filter(n => n !== num));
                          } else {
                            setSelectedOptions([...selectedOptions, num]);
                          }
                        }}
                        style={{
                          width: '85px',
                          height: '40px',
                          marginLeft: '20px',
                          marginTop: '-45px',
                          backgroundColor: selectedOptions.includes(num) ? optionStyles[num].background : 'white',
                          border: selectedOptions.includes(num) ? `5px solid ${optionStyles[num].color}` : '4px solid lightgrey',
                          borderRadius: '105px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <h1 style={{
                          fontSize: '24px',fontFamily: "'montserrat', sans-serif",
                          color: selectedOptions.includes(num) ? optionStyles[num].color : 'black',
                          margin: 0,
                        }}>{num}</h1>
                      </button>
                    ))}
                  </div>
                </div>

              

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
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '-20px', marginBottom: '20px' }}>
  <button
    onClick={handleGenerateQuestions}
    disabled={generating || (sourceText.trim() === '' && generatedQuestions.length === 0)}
    style={{
      width: '180px',
      fontWeight: 'bold',
      height: '50px',
      padding: '10px',
      fontSize: '24px',
      backgroundColor: generating ? 'lightgrey' : 
                      generatedQuestions.length > 0 ? '#A6B4FF' : '#F5B6FF',
      color: 'white',
      borderRadius: '10px',
      border: generating ? '4px solid lightgrey' : 
              generatedQuestions.length > 0 ? '4px solid #020CFF' : '4px solid #E441FF',
      cursor: generating ? 'default' : 'pointer',
   
    }}
    onMouseEnter={(e) => {
      if (!generating) {
      }
    }}
    onMouseLeave={(e) => {
      if (!generating) {
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
    <ProgressBar progress={progress} text={progressText} />
  )}
</div>
                  </div>
                </div>
              </div>
              </div>
             




              <button
                 onClick={saveDraft}
                 style={{
                  width: '260px',
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



            {isReadyToPublish() && (
                <button
                  onClick={saveAssignment}
                  style={{
                    width: '790px',
                    height: '50px',
                    marginTop: '0px',
                    border: '4px solid #348900',
                    marginBottom: '40px',
                    backgroundColor: '#AEF2A3',
                    color: '#348900',
                    borderRadius: '10px',
                    fontSize: '20px',fontFamily: "'montserrat', sans-serif",  
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease',
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#45a049'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#AEF2A3'}
                >
                  Publish Assignment
                </button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MCQA;
