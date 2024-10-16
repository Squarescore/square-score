import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import axios from 'axios';

import { doc, getDoc, setDoc, writeBatch, arrayUnion, serverTimestamp, arrayRemove, updateDoc} from 'firebase/firestore';

import { db, auth } from '../../Universal/firebase'; // Ensure the path is correct


import 'react-datepicker/dist/react-datepicker.css';
import { v4 as uuidv4 } from 'uuid';
import {Sparkles,Landmark, Eye, User, Repeat, PencilRuler   } from 'lucide-react';

import Navbar from '../../Universal/Navbar';
import DateSettings, { formatDate } from './DateSettings';
import SecuritySettings from './SecuritySettings';
import SelectStudentsDW from './SelectStudentsDW';
import PreviewMCQ from './previewMCQ';
import CustomExpandingFormatSelector from './ExpandingFormatSelector';

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
  const [contentDropdownOpen, setContentDropdownOpen] = useState(false);
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
      await setDoc(assignmentRef, assignmentData);
      
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
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
      <Navbar userType="teacher" />
      <style>{dropdownContentStyle}{loaderStyle}</style>
      <div style={{ marginTop: '30px', width: '800px', marginLeft: 'auto', marginRight: 'auto', fontFamily: "'montserrat', sans-serif",  }}>
     
              
    
        
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








        
        <div style={{ width: '100%', height: 'auto', marginTop: '-200px', border: '10px solid transparent', borderRadius: '30px', padding: '20px' }}>
          <div style={{ width: '800px', marginLeft: 'auto', marginRight: 'auto', marginTop: '30px' }}>
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
      border: '2px solid #eeeeee',
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
              <div style={{ marginBottom: '0px', width: '790px', height: '200px', borderRadius: '10px',  border: '2px solid #eeeeee',}}>
                <div style={{ width: '730px', marginLeft: '20px', height: '80px', borderBottom: '2px solid #eeeeee', display: 'flex', position: 'relative', alignItems: 'center', borderRadius: '0px', padding: '10px' }}>
                  <h1 style={{ fontSize: '30px', color: 'black', width: '300px', paddingLeft: '0px' ,
      fontFamily: "'montserrat', sans-serif",}}>Timer:</h1>
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



                
                <div style={{ display: 'flex', alignItems: 'center', height: '80px', width: '750px', marginLeft: '20px',  position: 'relative', marginTop: '0px', paddingBottom: '20px' }}>
          <label style={{ fontSize: '30px', color: 'black', marginLeft: '10px', marginRight: '38px', fontFamily: "'montserrat', sans-serif", fontWeight: 'bold', marginTop: '20px' }}>Feedback: </label>
          <div style={{ marginLeft: 'auto', marginRight: '10px', marginTop: '20px' }}>
            <input
              type="checkbox"
              className="greenSwitch"
              checked={feedback}
              onChange={() => setFeedback(!feedback)}
            />
          </div>
       
<div style={{width: '4px', background: '#f4f4f4', height: '50px', marginTop: '20px'}}></div>
        <div style={{ display: 'flex', alignItems: 'center', height: '80px', width: '350px', marginLeft: '20px', position: 'relative', paddingBottom: '20px',  marginTop: '20px'  }}>
          <label style={{ fontSize: '30px', color: 'black', marginLeft: '10px', marginRight: '38px', fontFamily: "'montserrat', sans-serif", fontWeight: 'bold' ,  marginTop: '20px' }}>Retype: </label>
          <div style={{ marginLeft: 'auto', marginRight: '10px',  marginTop: '20px'  }}>
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
                <PreviewMCQ
                  questions={generatedQuestions}
                  onBack={() => setShowPreview(false)}
                  onSave={handleSaveQuestions}
                />
              </div>
            )}

            <div style={{ width: '770px', padding: '10px', marginTop: '20px', border: '2px solid #eeeeee', borderRadius: '10px', marginBottom: '20px', zIndex: '-10' }}>
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
                
              <Sparkles size={40} color="#000000" />    
                <h1 style={{ fontSize: '30px', marginLeft: '20px', marginRight: 'auto' , fontFamily: "'montserrat', sans-serif", }}>Generate Questions</h1>
                <img
                  src={contentDropdownOpen ? '/Up.png' : '/Down.png'}
                  alt={contentDropdownOpen ? "Collapse" : "Expand"}
                  style={{ width: '20px' }}
                />
              </button>

              <div className={`dropdown-content ${contentDropdownOpen ? 'open' : ''}`}>
                <div style={{ marginTop: '0px' }}>
                  {/* Questions Section */}
               

                  <div style={{display: 'flex', alignItems: 'center', position: 'relative'}}>
      <h2 style={{ fontSize: '25px', color: '#808080', marginBottom: '10px' , marginLeft: '20px', zIndex: '-1'}}>Questions:</h2>
    
      <div style={{display: 'flex', marginLeft: 'auto'}}>
      <div style={{display: 'flex', }}>

        <div style={{marginTop: '25px', marginRight: '10px'}}> 
        <Landmark size={40} color="#000000" /></div>
      <input
        type="number"
        placeholder="10"
        value={questionBank}
        onChange={(e) => setQuestionBank(e.target.value)}
        style={{ width: '50px', fontWeight:'bold',marginBottom: '0px', textAlign: 'center' ,fontFamily: "'montserrat', sans-serif", marginTop: '25px', marginLeft: 'auto', marginRight: '20px',padding: '0px', paddingLeft: '15px', height: '35px', fontSize: '30px',  border: '2px solid #eeeeee', borderRadius: '10px' }}
      />
      </div>
      </div>

      <div style={{display: 'flex', marginLeft: '30px'}}>
        <div style={{marginTop: '25px', marginRight: '10px'}}> 
        <User size={40} color="#000000" /></div>
      <input
        type="number"
        placeholder="5"
        value={questionStudent}
        onChange={(e) => setQuestionStudent(e.target.value)}
        style={{ width: '50px', fontWeight:'bold',marginBottom: '10px',fontFamily: "'montserrat', sans-serif",marginTop: '25px', textAlign: 'center' , marginLeft: 'auto', marginRight: '20px',padding: '0px', paddingLeft: '15px',fontSize: '30px', height: '35px', border: '2px solid #eeeeee', borderRadius: '10px' }}
        />
        </div>

     

        </div>
      



        <div style={{ width: '730px', background: '#f4f4f4', height: '3px', marginLeft: '20px', marginTop: '20px' }}></div>
                  
                  <div style={{ width: '750px', height: '80px', border: '4px solid transparent', display: 'flex', position: 'relative', alignItems: 'center', borderRadius: '10px', padding: '10px', marginLeft: '-15px' }}>
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
                          border: selectedOptions.includes(num) ? `5px solid ${optionStyles[num].color}` : '2px solid #eeeeee',
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
                          background: '#f4f4f4',
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
                          border: '2px solid #eeeeee',
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
                      <div style={{ display: 'flex', alignItems: 'center', marginTop: '0px', marginBottom: '20px' }}>
                        <button
                          onClick={handleGenerateQuestions}
                          disabled={generating}
                          style={{
                            width: '180px',
                            fontWeight: 'bold',
                            height: '50px',
                            marginTop: '-20px',
                            padding: '10px',
                            fontSize: '24px',
                            backgroundColor: generating ? 'lightgrey' : 
                                            generatedQuestions.length > 0 ? '#A6B4FF' : '#F5B6FF',
                            color: 'white',
                            borderRadius: '10px',
                            border: generating ? '4px solid lightgrey' : 
                                    generatedQuestions.length > 0 ? '4px solid #020CFF' : '4px solid #E441FF',
                            cursor: generating ? 'default' : 'pointer',
                           
                            transition: 'box-shadow 0.3s ease',
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
                          <div className="loader" style={{ marginLeft: '20px' }}></div>
                        )}
                      </div>
                    )}
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
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#7BE06A'}
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

export default MCQ;
