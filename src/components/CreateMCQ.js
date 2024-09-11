import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, writeBatch, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase'; // Ensure the path is correct
import Navbar from './Navbar';
import SelectStudents from './SelectStudents';
import CustomDateTimePicker from './CustomDateTimePicker';
import 'react-datepicker/dist/react-datepicker.css';
import PreviewMCQ from './previewMCQ';
import axios from 'axios';
import { auth } from './firebase';
import { updateDoc } from 'firebase/firestore';
import { arrayRemove } from 'firebase/firestore';
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

const MCQ = () => {
  const [teacherId, setTeacherId] = useState(null);
  const [assignmentName, setAssignmentName] = useState('');
  const [timer, setTimer] = useState('10');
  const [securityDropdownOpen, setSecurityDropdownOpen] = useState(false);
  const [contentDropdownOpen, setContentDropdownOpen] = useState(false);
  const [timerOn, setTimerOn] = useState(false);
  const [feedback, setFeedback] = useState(false);
  const [retype, setRetype] = useState(false);
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([4]);
  const [saveAndExit, setSaveAndExit] = useState(true);
  const [lockdown, setLockdown] = useState(false);
  const [optionsCount, setOptionsCount] = useState(4);
  const [assignDate, setAssignDate] = useState(new Date());
  const [questionsGenerated, setQuestionsGenerated] = useState(false);

  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setHours(date.getHours() + 48);
    return date;
  })
  
  const [draftId, setDraftId] = useState(null);
  const [sourceOption, setSourceOption] = useState(null);
  const [sourceText, setSourceText] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  
  const [questionBank, setQuestionBank] = useState('10');
  const [questionStudent, setQuestionStudent] = useState('5');
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
const [questionCount, setQuestionCount] = useState(0);
  const navigate = useNavigate();

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

  const ProgressBar = ({ progress, text }) => (
    <div style={{ width: '300px', marginLeft: '20px' }}>
      <div style={{
        height: '20px',
        backgroundColor: '#e0e0e0',
        borderRadius: '10px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          backgroundColor: '#020CFF',
          transition: 'width 0.5s ease-in-out'
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
              questionId: `${assignmentId}(question${index + 1})`,
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
  const saveDraft = async () => {
    const draftData = {
      classId,
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
    };
  
    const newDraftId = draftId || `${classId}+${Date.now()}+MCQ`;
    const draftRef = doc(db, 'drafts', newDraftId);
    
    try {
      await setDoc(draftRef, draftData);
  
      const classRef = doc(db, 'classes', classId);
      await updateDoc(classRef, {
        [`assignment(mcq)`]: arrayUnion(newDraftId)
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

   
  const saveAssignment = async () => {

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
      assignmentId: finalAssignmentId, 
      classId,
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
    
      questions: generatedQuestions.map(formatQuestion),
    
      additionalInstructions
    };
  
    try {
      console.log("Attempting to save assignment with data:", assignmentData);
      
      const assignmentRef = doc(db, 'assignments(mcq)', finalAssignmentId);
      await setDoc(assignmentRef, assignmentData, { merge: true });
      
      console.log("Assignment saved successfully. Assigning to students...");
      
      await assignToStudents(finalAssignmentId);
      
      console.log("Assignment assigned to students successfully.");
  
      if (draftId) {
        const draftRef = doc(db, 'drafts', draftId);
        await setDoc(draftRef, {});
  
        const classRef = doc(db, 'classes', classId);
        await updateDoc(classRef, {
          [`assignment(mcq)`]: arrayRemove(assignmentId)
        });
        await updateDoc(classRef, {
          [`assignment(mcq)`]: arrayUnion(finalAssignmentId)
        });
      }
  
      navigate(`/class/${classId}`, {
        state: {
          successMessage: `Success: ${assignmentName} published`,
          assignmentId: finalAssignmentId,
          format: 'MCQ'
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

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
      <Navbar userType="teacher" />
      <style>{dropdownContentStyle}{loaderStyle}</style>
      <div style={{ marginTop: '30px', width: '800px', marginLeft: 'auto', marginRight: 'auto', fontFamily: "'Radio Canada', sans-serif",  }}>
      <button
                 onClick={saveDraft}
              style={{
                width: '400px',
                position: 'fixed',
                right: '-80px',
                zIndex: '4',
                border: '15px solid #E01FFF',
                borderRadius: '30px',
                top: '-40px',
                background: 'white',
                padding: '10px',
                fontSize: '24px',
                cursor: 'pointer'
              }}
            >
              <h1 style={{fontSize: '45px', width: '400px',  marginTop: '100px', marginLeft: '-50px', marginBottom: '0px', fontFamily: "'Rajdhani', sans-serif", }}>Save as Draft</h1>
            </button>
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
            fontFamily: "'Radio Canada', sans-serif",
            transition: '.5s',
            transform: 'scale(1)',
            opacity: '100%'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.04)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
          }}
        >
          <img src='/LeftGreenArrow.png' style={{ width: '75px', transition: '.5s' }} />
        </button>
        
        <h1 style={{ marginLeft: '30px',  fontFamily: "'Rajdhani', sans-serif", color: 'black', fontSize: '80px', display: 'flex', marginBottom: '100px' }}>
          Create (<h1 style={{ fontSize: '70px', marginTop: '10px', marginLeft: '0px', color: '#009006',display:'flex' }}> MCQ </h1>)
        </h1>
        <div style={{ width: '100%', height: 'auto', marginTop: '-200px', border: '10px solid transparent', borderRadius: '30px', padding: '20px' }}>
          <div style={{ width: '810px', marginLeft: 'auto', marginRight: 'auto', marginTop: '30px' }}>
          <div style={{ position: 'relative' }}>
  {assignmentName && (
    <h1 style={{
      position: 'absolute',
      left: '30px',
      top: '-25px',
      zIndex: '300',
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
      fontFamily: "'Radio Canada', sans-serif",
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
    fontFamily: "'Radio Canada', sans-serif",
  }}>
    {assignmentName.length}/25
  </span>
</div>
            <div style={{ width: '810px', display: 'flex' }}>
              <div style={{ marginBottom: '20px', width: '790px', height: '320px', borderRadius: '10px', border: '4px solid #F4F4F4' }}>
                <div style={{ width: '730px', marginLeft: '20px', height: '80px', borderBottom: '4px solid lightgrey', display: 'flex', position: 'relative', alignItems: 'center', borderRadius: '0px', padding: '10px' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', height: '80px', width: '750px', marginLeft: '20px', borderBottom: '4px solid lightgrey', position: 'relative', marginTop: '0px', paddingBottom: '20px' }}>
          <label style={{ fontSize: '30px', color: 'black', marginLeft: '10px', marginRight: '38px', fontFamily: "'Radio Canada', sans-serif", fontWeight: 'bold', marginTop: '20px' }}>Feedback: </label>
          <div style={{ marginLeft: 'auto', marginRight: '10px', marginTop: '20px' }}>
            <input
              type="checkbox"
              className="greenSwitch"
              checked={feedback}
              onChange={() => setFeedback(!feedback)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', height: '80px', width: '750px', marginLeft: '20px', borderBottom: '0px solid lightgrey', position: 'relative', marginTop: '0px', paddingBottom: '20px' }}>
          <label style={{ fontSize: '30px', color: 'black', marginLeft: '10px', marginRight: '38px', fontFamily: "'Radio Canada', sans-serif", fontWeight: 'bold' }}>Retype: </label>
          <div style={{ marginLeft: 'auto', marginRight: '10px' }}>
            <input
              type="checkbox"
              className="greenSwitch"
              checked={retype}
              onChange={() => setRetype(!retype)}
            />
          </div>
        </div>
              
              </div>
            </div>
            <div style={{ width: '770px', padding: '10px', border: '4px solid #F4F4F4', borderRadius: '10px' }}>
              <button
                onClick={() => setTimeDropdownOpen(!timeDropdownOpen)}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '30px',
                  backgroundColor: 'white',
                  color: 'black',
                  border: 'none',
                  cursor: 'pointer',
                  height: '50px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <img style={{ width: '40px' }} src='/clock.png' />
                <h1 style={{ fontSize: '30px', marginLeft: '20px', marginRight: 'auto' }}> Dates</h1>
                <img
                  src={timeDropdownOpen ? '/Up.png' : '/Down.png'}
                  alt={timeDropdownOpen ? "Collapse" : "Expand"}
                  style={{ width: '20px' }}
                />
              </button>

              <div className={`dropdown-content ${timeDropdownOpen ? 'open' : ''}`}>
                <div style={{ marginTop: '10px' }}>
                  {/* Assign and Due Dates */}
                  <div style={{ marginTop: '10px', display: 'flex', position: 'relative', alignItems: 'center' }}>
                    <h1 style={{ marginLeft: '20px' }}>Assign on:</h1>
                    <div style={{ marginLeft: 'auto', marginRight: '20px' }}>
                      <CustomDateTimePicker
                        selected={assignDate}
                        onChange={(date) => setAssignDate(date)}
                        label="Assign Date"
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: '10px', display: 'flex', position: 'relative', alignItems: 'center' }}>
                    <h1 style={{ marginLeft: '20px' }}>Due on:</h1>
                    <div style={{ marginLeft: 'auto', marginRight: '20px' }}>
                      <CustomDateTimePicker
                        selected={dueDate}
                        onChange={(date) => setDueDate(date)}
                        label="Due Date"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ width: '770px', padding: '10px', marginTop: '20px', border: '4px solid #F4F4F4', borderRadius: '10px', marginBottom: '20px' }}>
              <button
                onClick={() => setStudentsDropdownOpen(!studentsDropdownOpen)}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '30px',
                  height: '50px',
                  backgroundColor: 'white',
                  color: 'black',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <img style={{ width: '40px' }} src='/select.png' />
                <h1 style={{ fontSize: '30px', marginRight: 'auto', marginLeft: '20px' }}>Select Students</h1>
                <img
                  src={studentsDropdownOpen ? '/Up.png' : '/Down.png'}
                  alt={studentsDropdownOpen ? "Collapse" : "Expand"}
                  style={{ width: '20px' }}
                />
              </button>

              <div className={`dropdown-content ${studentsDropdownOpen ? 'open' : ''}`}>
                <div style={{ marginTop: '10px' }}>
                  <SelectStudents
                    classId={classId}
                    selectedStudents={selectedStudents}
                    setSelectedStudents={setSelectedStudents}
                  />
                </div>
              </div>
            </div>
            {showPreview && generatedQuestions && generatedQuestions.length > 0 && (
              <div style={{ width: '100%', position: 'absolute', zIndex: 100000, background: 'white', top: '70px', left: '0%' }}>
                <PreviewMCQ
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
                  height: '50px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <img style={{ width: '30px', marginRight: '20px', marginLeft: '5px' }} src='/idea.png' />
                <h1 style={{ fontSize: '30px', marginLeft: '0px', marginRight: 'auto' }}>Generate Questions</h1>
                <img
                  src={contentDropdownOpen ? '/Up.png' : '/Down.png'}
                  alt={contentDropdownOpen ? "Collapse" : "Expand"}
                  style={{ width: '20px' }}
                />
              </button>

              <div className={`dropdown-content ${contentDropdownOpen ? 'open' : ''}`}>
                <div style={{ marginTop: '0px' }}>
                  {/* Questions Section */}
                  <div style={{ width: '730px', background: 'lightgrey', height: '3px', marginLeft: '20px', marginTop: '20px' }}></div>
                  

                  <div style={{display: 'flex', alignItems: 'center', position: 'relative'}}>
      <h2 style={{ fontSize: '30px', color: 'black', marginBottom: '10px' , marginLeft: '20px'}}>Question Bank</h2>
      <input
        type="number"
        placeholder="10"
        value={questionBank}
        onChange={(e) => setQuestionBank(e.target.value)}
        style={{ width: '60px', fontWeight:'bold',marginBottom: '10px', marginTop: '25px',  marginLeft: 'auto', marginRight: '20px',padding: '10px', fontSize: '30px',  border: '4px solid #F4F4F4', borderRadius: '10px' }}
      />
      </div>
      <div style={{display: 'flex', alignItems: 'center', position: 'relative'}}>
      <h2 style={{ fontSize: '30px', color: 'black', marginBottom: '10px', marginLeft: '20px' }}>Question Per Student</h2>
      
      <input
        type="number"
        placeholder="5"
        value={questionStudent}
        onChange={(e) => setQuestionStudent(e.target.value)}
        style={{ width: '60px', fontWeight:'bold',marginBottom: '10px', marginTop: '25px',  marginLeft: 'auto', marginRight: '20px',padding: '10px', fontSize: '30px',  border: '4px solid #F4F4F4', borderRadius: '10px' }}
        />
        </div>

        <div style={{ width: '730px', background: 'lightgrey', height: '3px', marginLeft: '20px', marginTop: '20px' }}></div>
                  
                  <div style={{ width: '750px', height: '80px', border: '4px solid transparent', display: 'flex', position: 'relative', alignItems: 'center', borderRadius: '10px', padding: '10px', marginLeft: '-15px' }}>
                  <h1 style={{ fontSize: '30px', color: 'black', width: '400px', paddingLeft: '20px' }}>Choices Per Question</h1>
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
                          fontSize: '24px',
                          color: selectedOptions.includes(num) ? optionStyles[num].color : 'black',
                          margin: 0,
                        }}>{num}</h1>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ width: '730px', background: 'lightgrey', height: '3px', marginLeft: '20px', marginTop: '0px' }}></div>
                

                  <div style={{ width: '740px', marginLeft: '20px', }}>
               
                   
                      <textarea
                        placeholder="Paste source here"
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
                          fontFamily: "'Radio Canada', sans-serif",
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
                    {sourceText.trim() !== '' && Number(questionBank) >= Number(questionStudent) && (
                      <div style={{ display: 'flex', alignItems: 'center', marginTop: '20px' }}>
                        <button
                          onClick={handleGenerateQuestions}
                          disabled={generating}
                          style={{
                            width: '300px',
                            fontWeight: 'bold',
                            height: '50px',
                            padding: '10px',
                            fontSize: '24px',
                            backgroundColor: generating ? 'lightgrey' : generatedQuestions.length > 0 ? '#4CAF50' : '#020CFF',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: generating ? 'default' : 'pointer',
                            transition: 'box-shadow 0.3s ease, background-color 0.3s ease',
                            boxShadow: generating ? 'none' : '0 4px 6px rgba(0, 0, 0, 0.1)',
                          }}
                          onMouseEnter={(e) => {
                            if (!generating) {
                              e.target.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.2)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!generating) {
                              e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                            }
                          }}
                        >
                          {generating ? 'Generating...' : generatedQuestions.length > 0 ? 'Preview Questions' : 'Generate Questions'}
                        </button>
                        {generating && (
      <div className="loader" style={{ marginLeft: '20px' }}></div>
    )}
                      </div>
                    )}
                  </div>
                </div>
                
              </div>
              </div>



              
              <div style={{ width: '770px', padding: '10px', marginTop: '20px', border: '4px solid #F4F4F4', borderRadius: '10px', marginBottom: '20px' }}>
                <button
                  onClick={() => setSecurityDropdownOpen(!securityDropdownOpen)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '30px',
                    backgroundColor: 'white',
                    color: 'black',
                    border: 'none',
                    cursor: 'pointer',
                    height: '50px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <img style={{ width: '40px' }} src='/astrid.png' />
                  <h1 style={{ fontSize: '30px', marginLeft: '20px', marginRight: 'auto' }}>Security</h1>
                  <img
                    src={securityDropdownOpen ? '/Up.png' : '/Down.png'}
                    alt={securityDropdownOpen ? "Collapse" : "Expand"}
                    style={{ width: '20px' }}
                  />
                </button>

                <div className={`dropdown-content ${securityDropdownOpen ? 'open' : ''}`}>
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                      <h1 style={{ fontSize: '30px', color: 'black', marginLeft: '20px', flex: 1 }}>Save & Exit</h1>
                      <input
                        style={{ marginRight: '20px' }}
                        type="checkbox"
                        className="greenSwitch"
                        checked={saveAndExit}
                        onChange={() => setSaveAndExit(!saveAndExit)}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <h1 style={{ fontSize: '30px', color: 'black', marginLeft: '20px', flex: 1 }}>Lockdown</h1>
                      <input
                        style={{ marginRight: '20px' }}
                        type="checkbox"
                        className="greenSwitch"
                        checked={lockdown}
                        onChange={() => setLockdown(!lockdown)}
                      />
                    </div>
                 
                </div>
              </div>
             
            </div>
            {isReadyToPublish() && (
                <button
                  onClick={saveAssignment}
                  style={{
                    width: '770px',
                    height: '50px',
                    marginTop: '20px',
                    marginBottom: '40px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease',
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#45a049'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#4CAF50'}
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

export default MCQ;
