import React, { useState, useEffect, useCallback, useRef  } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../Universal/firebase';
import Navbar from '../../../Universal/Navbar';
import Tooltip from './ToolTip';
import axios from 'axios';
import { SquareCheck, SquareX, SquareSlash, Square, User, MessageSquareMore, Plus, Minus, YoutubeIcon, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, Flag } from 'lucide-react';
import ResponsiveText from './ResponsiveText';

function TeacherStudentResults() {
    const { assignmentId, studentUid } = useParams();
    const [assignmentName, setAssignmentName] = useState('');
    const [results, setResults] = useState(null);
    const [studentName, setStudentName] = useState('');
    const [correctCount, setCorrectCount] = useState(0);
    const [contentHeight, setContentHeight] = useState('auto');
    const [partialCount, setPartialCount] = useState(0);
    const [incorrectCount, setIncorrectCount] = useState(0);
    const navigate = useNavigate();
    const [isRegrading, setIsRegrading] = useState(false);
    const [halfCredit, setHalfCredit] = useState(false);
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(null);
    const questionRefs = React.useRef([]);
    const [useSlider, setUseSlider] = useState(false);
    const [debouncedFeedback, setDebouncedFeedback] = useState({});
    const debouncedUpdateRef = useRef(null);
    const [classId, setClassId] = useState(null);
    const [feedbackStates, setFeedbackStates] = useState({});
    const textareaRefs = useRef({});

    const pendingUpdateRef = useRef(null);
    const getGradeColors = (grade) => {
        if (grade === undefined || grade === null || grade === 0) return { color: '#858585', background: 'white' };
        if (grade < 50) return { color: '#FF0000', background: '#FFCBCB' };
        if (grade < 70) return { color: '#FF4400', background: '#FFC6A8' };
        if (grade < 80) return { color: '#EFAA14', background: '#FFF4DC' };
        if (grade < 90) return { color: '#9ED604', background: '#EDFFC1' };
        if (grade > 99) return { color: '#E01FFF', background: '#F7C7FF' };
        return { color: '#2BB514', background: '#D3FFCC' };
      };
      
    // Add cleanup effect
    useEffect(() => {
      // Cleanup function that runs before component unmounts or re-renders
      return () => {
        // If there's a pending update in the debounce timer, execute it immediately
        if (debouncedUpdateRef.current) {
          debouncedUpdateRef.current.flush();
        }
    
        // If there's a pending firestore update, execute it immediately
        if (pendingUpdateRef.current) {
          pendingUpdateRef.current();
        }
      };
    }, []);
    
    // Modify handleFeedbackChange to track pending updates
    const handleFeedbackChange = (index, newFeedback) => {
      // Update local state immediately
      setFeedbackStates(prev => ({
        ...prev,
        [index]: newFeedback
      }));
    
      // Cancel any existing debounced update
      if (debouncedUpdateRef.current) {
        debouncedUpdateRef.current.cancel();
      }
    
      // Create the update function
      const updateFunction = async () => {
        try {
          const updatedQuestions = results.questions.map((q, i) => 
            i === index ? { ...q, feedback: newFeedback } : q
          );
    
          const hasFlaggedQuestions = updatedQuestions.some(q => q.flagged);
    
          await updateDoc(doc(db, 'grades', `${assignmentId}_${studentUid}`), {
            questions: updatedQuestions,
            hasFlaggedQuestions
          });
    
          setResults(prev => ({
            ...prev,
            questions: updatedQuestions,
            hasFlaggedQuestions
          }));
    
          // Clear the pending update reference after successful update
          pendingUpdateRef.current = null;
        } catch (error) {
          console.error('Error updating feedback:', error);
        }
      };
    
      // Store the update function in the ref
      pendingUpdateRef.current = updateFunction;
    
      // Create a debounced version that clears the pending ref after execution
      debouncedUpdateRef.current = debounce(() => {
        updateFunction();
      }, 1000);
    
      // Execute the debounced update
      debouncedUpdateRef.current();
    };
    
    // Modify the debounce function to include a flush method
    const debounce = (func, wait) => {
        let timeout;
        let lastArgs;
        let lastThis;
      
        const debouncedFunction = (...args) => {
          lastArgs = args;
          lastThis = this;
      
          const later = () => {
            func.apply(lastThis, lastArgs);
            timeout = null;
            lastArgs = null;
            lastThis = null;
          };
      
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
        };
      
        debouncedFunction.cancel = () => {
          clearTimeout(timeout);
          timeout = null;
          lastArgs = null;
          lastThis = null;
        };
      
        debouncedFunction.flush = () => {
          if (timeout) {
            func.apply(lastThis, lastArgs);
            debouncedFunction.cancel();
          }
        };
      
        return debouncedFunction;
      };
      
      // Update the cleanup effect
      useEffect(() => {
        return () => {
          // Safely check if the debounced update ref exists and has a flush method
          if (debouncedUpdateRef.current?.flush) {
            debouncedUpdateRef.current.flush();
          }
      
          // If there's a pending update, execute it immediately
          if (pendingUpdateRef.current) {
            pendingUpdateRef.current();
          }
        };
      }, []);
      
      // Update how we create the debounced update reference
      useEffect(() => {
        const debouncedUpdate = debounce((index, newScore, newFeedback) => {
          updateGradeAndFeedback(index, newScore, newFeedback);
        }, 1000);
      
        debouncedUpdateRef.current = debouncedUpdate;
      
        return () => {
          if (debouncedUpdateRef.current?.cancel) {
            debouncedUpdateRef.current.cancel();
          }
        };
      }, []);



    const scrollToQuestion = (index) => {
        setActiveQuestionIndex(index);
        questionRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const handleQuestionClick = (questionId) => {
        navigate(`/class/${classId}/assignment/${assignmentId}/TeacherResults/`, {
          state: {
            targetTab: 'questionBank',
            targetQuestionId: questionId,
            openQuestionResults: true
          }
        });
      };

    const contentRef = useRef(null);
    const [isMapCollapsed, setIsMapCollapsed] = useState(false);

    const stickyRef = useRef(null);
    const containerRef = useRef(null);

    const getQuestionIcon = (score, scaleMax, scaleMin) => {
        if (score === scaleMax) {
            return <SquareCheck size={20} color="#00d12a" />;
        } else if (score === scaleMin) {
            return <SquareX size={20} color="#FF0000" />;
        } else {
            return <SquareSlash size={20} color="#FFD13B" />;
        }
    };

    useEffect(() => {
        const checkContentHeight = () => {
          if (contentRef.current) {
            const windowHeight = window.innerHeight;
            const contentHeight = contentRef.current.scrollHeight;
            setUseSlider(contentHeight > windowHeight - 230); // 230 = 180 (top) + 50 (header)
          }
        };
    
        checkContentHeight();
        window.addEventListener('resize', checkContentHeight);
        return () => window.removeEventListener('resize', checkContentHeight);
      }, [results]);

    // Debounce Feedback Updates
    useEffect(() => {
        debouncedUpdateRef.current = debounce((index, newScore, newFeedback) => {
            updateGradeAndFeedback(index, newScore, newFeedback);
        }, 5000);

        // Cleanup function
        return () => {
            if (debouncedUpdateRef.current) {
                debouncedUpdateRef.current.cancel();
            }
        };
    }, []);

    useEffect(() => {
        // Initialize feedback states from results
        if (results?.questions) {
          const initialFeedback = {};
          results.questions.forEach((question, index) => {
            initialFeedback[index] = question.feedback || '';
          });
          setFeedbackStates(initialFeedback);
        }
      }, [results]);

    // Initialize feedback states and set initial heights
    useEffect(() => {
        if (results?.questions) {
          const initialFeedback = {};
          results.questions.forEach((question, index) => {
            initialFeedback[index] = question.feedback || '';
          });
          setFeedbackStates(initialFeedback);
      
          // Set initial heights after a short delay to ensure content is rendered
          setTimeout(() => {
            results.questions.forEach((_, index) => {
              const textarea = textareaRefs.current[index];
              if (textarea) {
                textarea.style.height = '24px'; // Set to one line initially
                textarea.style.height = textarea.value ? `${textarea.scrollHeight}px` : '24px';
              }
            });
          }, 0);
        }
      }, [results]);


    // Fetch Results on Component Mount
    useEffect(() => {
        const fetchResults = async () => {
            try {
                const gradeDocRef = doc(db, 'grades', `${assignmentId}_${studentUid}`);
                const gradeDoc = await getDoc(gradeDocRef);
    
                if (gradeDoc.exists()) {
                    const data = gradeDoc.data();
                    setResults(data);
                    setAssignmentName(data.assignmentName);
                    
                    setClassId(data.classId);
                    const correct = data.questions.filter(q => q.score === data.scaleMax).length;
                    const partial = data.questions.filter(q => q.score > data.scaleMin && q.score < data.scaleMax).length;
                    const incorrect = data.questions.filter(q => q.score === data.scaleMin).length;
                    
                    setCorrectCount(correct);
                    setPartialCount(partial);
                    setIncorrectCount(incorrect);
                    
                    const studentDocRef = doc(db, 'students', studentUid);
                    const studentDoc = await getDoc(studentDocRef);
                    
                    if (studentDoc.exists()) {
                        const studentData = studentDoc.data();
                        setStudentName(`${studentData.firstName} ${studentData.lastName}`);
                        console.log("Student Name:", `${studentData.firstName} ${studentData.lastName}`); // Added log statement
                    } else {
                        console.log("Student document does not exist");
                    }
                }
            } catch (error) {
                console.error('Error fetching results:', error);
            }
        };
    
        fetchResults();
    }, [assignmentId, studentUid]);

    // Handle Regrading Assignment
    const handleRegrade = async () => {
        if (window.confirm("Are you sure you want to regrade this assignment? This will replace the current grades.")) {
            setIsRegrading(true);
            try {
                const questionsToGrade = results.questions.map(q => ({
                    question: q.question,
                    rubric: q.rubric,
                    studentResponse: q.studentResponse
                }));

                const response = await axios.post('https://us-central1-square-score-ai.cloudfunctions.net/GradeSAQ', {
                  questions: questionsToGrade,
                  halfCreditEnabled: halfCredit,
                  classId: classId 
                });

                if (response.status === 200) {
                    const newGrades = response.data;
                    
                    const newTotalScore = newGrades.reduce((sum, grade) => sum + grade.score, 0);
                    const maxRawScore = results.questions.length * 2;
                    const newScaledScore = ((newTotalScore / maxRawScore) * (results.scaleMax - results.scaleMin)) + results.scaleMin;
                    const newPercentageScore = ((newScaledScore - results.scaleMin) / (results.scaleMax - results.scaleMin)) * 100;

                    const updatedQuestions = results.questions.map((q, index) => ({
                        ...q,
                        score: newGrades[index].score,
                        feedback: newGrades[index].feedback,
                        flagged: false, // Reset flag after regrading
                    }));

                    // Determine if any questions are still flagged
                    const hasFlaggedQuestions = updatedQuestions.some(q => q.flagged);

                    const gradeDocRef = doc(db, 'grades', `${assignmentId}_${studentUid}`);
                    await updateDoc(gradeDocRef, {
                        questions: updatedQuestions,
                        rawTotalScore: newTotalScore,
                        scaledScore: newScaledScore,
                        percentageScore: newPercentageScore,
                        hasFlaggedQuestions: hasFlaggedQuestions,
                        halfCreditEnabled: halfCredit
                    });

                    setResults(prevResults => ({
                        ...prevResults,
                        questions: updatedQuestions,
                        rawTotalScore: newTotalScore,
                        scaledScore: newScaledScore,
                        percentageScore: newPercentageScore,
                        hasFlaggedQuestions: hasFlaggedQuestions,
                        halfCreditEnabled: halfCredit
                    }));

                    const newCorrectCount = updatedQuestions.filter(q => q.score === results.scaleMax).length;
                    const newPartialCount = halfCredit ? updatedQuestions.filter(q => q.score > results.scaleMin && q.score < results.scaleMax).length : 0;
                    const newIncorrectCount = updatedQuestions.filter(q => q.score === results.scaleMin).length;
                    
                    setCorrectCount(newCorrectCount);
                    setPartialCount(newPartialCount);
                    setIncorrectCount(newIncorrectCount);

                    alert("Assignment regraded successfully!");
                }
            } catch (error) {
                console.error("Error regrading assignment:", error);
                alert("An error occurred while regrading the assignment. Please try again.");
            } finally {
                setIsRegrading(false);
            }
        }
    };

    // Function to update a student's grade and feedback
    const updateGradeAndFeedback = async (index, newScore, feedback) => {
        if (!results) return;
    
        const updatedQuestions = [...results.questions];
        updatedQuestions[index] = {
            ...updatedQuestions[index],
            score: Math.max(results.scaleMin, Math.min(results.scaleMax, newScore)),
            feedback: feedback
        };
    
        const newTotalScore = updatedQuestions.reduce((sum, question) => sum + question.score, 0);
        const newPercentageScore = (newTotalScore / (results.scaleMax * results.questions.length)) * 100;
    
        // Determine if any questions are still flagged
        const hasFlaggedQuestions = updatedQuestions.some(q => q.flagged);
    
        try {
            await updateDoc(doc(db, 'grades', `${assignmentId}_${studentUid}`), {
                questions: updatedQuestions,
                rawTotalScore: newTotalScore,
                percentageScore: newPercentageScore,
                hasFlaggedQuestions: hasFlaggedQuestions // Update flag status
            });

            setResults({
                ...results,
                questions: updatedQuestions,
                rawTotalScore: newTotalScore,
                percentageScore: newPercentageScore,
                hasFlaggedQuestions: hasFlaggedQuestions
            });

            const newCorrectCount = updatedQuestions.filter(q => q.score === results.scaleMax).length;
            const newPartialCount = updatedQuestions.filter(q => q.score > results.scaleMin && q.score < results.scaleMax).length;
            const newIncorrectCount = updatedQuestions.filter(q => q.score === results.scaleMin).length;
            
            setCorrectCount(newCorrectCount);
            setPartialCount(newPartialCount);
            setIncorrectCount(newIncorrectCount);
        } catch (error) {
            console.error('Error updating grade and feedback:', error);
        }
    };

    // Toggle flag status for a specific question
    const toggleFlag = async (index) => {
        if (!results) return;

        const updatedQuestions = [...results.questions];
        updatedQuestions[index].flagged = !updatedQuestions[index].flagged;

        // Determine if any questions are still flagged
        const hasFlaggedQuestions = updatedQuestions.some(q => q.flagged);

        try {
            await updateDoc(doc(db, 'grades', `${assignmentId}_${studentUid}`), {
                questions: updatedQuestions,
                hasFlaggedQuestions: hasFlaggedQuestions // Update flag status
            });

            setResults({
                ...results,
                questions: updatedQuestions,
                hasFlaggedQuestions: hasFlaggedQuestions
            });
        } catch (error) {
            console.error('Error toggling flag:', error);
        }
    };

    // Handle navigation clicks
    const handleGradeClick = (studentUid) => {
        navigate(`/teacherStudentResults/${assignmentId}/${studentUid}`);
    };
    const handleStudentClick = (studentUid) => {
        navigate(`/class/${classId}/student/${studentUid}/grades`);
    };
    const handleAssignmentClick = () => {
        navigate(`/class/${classId}/assignment/${assignmentId}/TeacherResults`);
    };

    // Determine letter grade based on percentage
    const getLetterGrade = (percentage) => {
        if (percentage >= 90) return 'A';
        if (percentage >= 80) return 'B';
        if (percentage >= 70) return 'C';
        if (percentage >= 60) return 'D';
        return 'F';
    };

    // Render Loading State
    if (!results) {
        return <div>Loading...</div>;
    }
    const letterGrade = getLetterGrade(results.percentageScore);

    return (
        <div style={{   minHeight: '100vh',
            width: 'calc(100% - 200px)',
            marginLeft:'200px',
            backgroundColor: 'white',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative' }}>
<Navbar 
  userType="teacher"
  navItems={[
    {
      type: 'assignmentName',
      id: assignmentId,
      label: assignmentName
    },
    {
      type: 'studentGrades',
      id: studentUid,
      label: studentName
    }
  ]}
  classId={classId}
/>





            <div style={{  fontFamily: "'montserrat', sans-serif", backgroundColor: '', width: '100%', zIndex: '20', alignItems: 'center', marginLeft: 'auto', marginRight: 'auto', marginTop: '0px'}}>
           
           
           
       
               
                  
                  


        <div style={{display: 'flex'}}>
            <div style={{
           paddingRight: '0px', width: '655px ', borderRadius: '15px', marginBottom: '20px', height: '140px', marginLeft: '4%', }}>
       <div style={{display: 'flex', marginBottom: '30px'}}>
      
      
       <h1
       
       onClick={() => navigate(`/class/${classId}/assignment/${assignmentId}/TeacherResults`)}
                             
       style={{ fontSize: '25px', color: 'grey', marginBottom: '0px', cursor: 'pointer' , marginLeft: '-5px',fontFamily: "'montserrat', sans-serif", textAlign: 'left', fontWeight: '500' }}
       
       
       onMouseEnter={(e) => { e.target.style.textDecoration = 'underline'; }}
       onMouseLeave={(e) => { e.target.style.textDecoration = 'none'; }}
    > 
        {assignmentName}
      </h1>



      <h1 style={{ fontSize: '25px', color: 'grey', marginBottom: '0px', cursor: 'pointer' ,fontFamily: "'montserrat', sans-serif", textAlign: 'left', marginLeft: '10px',fontWeight: '500',  }} >/</h1>
       <h1 style={{ fontSize: '25px', color: 'black', marginBottom: '0px', cursor: 'pointer' ,fontFamily: "'montserrat', sans-serif", textAlign: 'left', marginLeft: '10px', fontWeight: '500'  }}
              onClick={() => navigate(`/class/${classId}/student/${studentUid}/grades`)}
              onMouseEnter={(e) => { e.target.style.textDecoration = 'underline'; }}
              onMouseLeave={(e) => { e.target.style.textDecoration = 'none'; }}
          
                      
       
       
       > {studentName}</h1>
     
      </div>



       <h1 style={{ fontSize: '16px', fontFamily: "'montserrat', sans-serif", textAlign: 'left',  color: 'grey', fontWeight: '500', marginTop: '10px' }}> {new Date(results.submittedAt.toDate()).toLocaleString()} </h1>
            
        
      
         

       </div>
       <div style={{height: '80px ', position: 'relative', marginLeft:'auto',  borderRadius: '15px', width: '80px ',  marginTop:'20px' ,background: 'white', marginRight: '4%', }}>
       <img style={{ width: '80px',   }} src="/Score.svg" alt="logo" />
     
       <div style={{fontSize: '35px', fontWeight: 'bold', width: '90px', height: '70px',position: 'absolute', background: 'transparent',  borderRadius:  '10px', top: '-35px', left: '-5px', textAlign: 'center', lineHeight: '150px'}}> 
       {letterGrade}

          </div>
                      
                   
           </div>
           </div>

      














                 
              
               </div>


               <div style={{
      position: 'sticky',
      height: '50px',
      top: '0px',
      left: '200px',
      width: 'calc(100%)',
      background: 'rgb(255,255,255,.9)',
      backdropFilter: 'blur(5px)',
      borderBottom: '1px solid lightgrey',
      
      borderTop: '1px solid lightgrey',
    marginTop: '-40px',
      transition: 'all 0.3s',
      zIndex: 50,
      display: 'flex',
      flexDirection: 'row'
    }}>
     <div style={{marginLeft: '4%', width: '86%', display: 'flex', overflow: 'hidden', }}>
      {results.questions.map((question, index) => (
          <div
            key={index}
            onClick={() => scrollToQuestion(index)}
            style={{
              width: '30px',
           cursor: 'pointer',
              padding: '10px 5px',
            }}
          >
            {question.score === results.scaleMax ? (
              <SquareCheck size={25} color="#00d12a" style={{ marginRight: '0px',
                cursor: 'pointer', }} />
            ) : question.score === results.scaleMin ? (
              <SquareX size={25} color="#FF0000" style={{ marginRight: '0px' ,
                cursor: 'pointer',}} />
            ) : (
              <SquareSlash size={25} color="#FFD13B" style={{ marginRight: '0px',
                cursor: 'pointer', }} />
            )}
          </div>
         ))}
           </div>  
           <div style={{fontSize: '20px', marginRight: '4%', marginLeft: 'auto', borderLeft: '1px solid lightgrey', paddingLeft: '20px', lineHeight: '50px',
            
           }}>
          <div style={{width: '80px', textAlign: 'center', height: '30px',
          marginTop :'10px',
          lineHeight: '30px',
          borderRadius: '5px',

background: getGradeColors(results.percentageScore.toFixed(0)).background,
color: getGradeColors(results.percentageScore.toFixed(0)).color 
          }}>
{results.percentageScore.toFixed(0)}%
            </div> </div>
            </div>

            
       

                 
              
              
       
                
              
                <ul style={{ listStyle: 'none', padding: '0', marginTop: '0px',  width: '100%',marginLeft: 'auto', marginRight: 'auto', borderRadius: '20px' }}>
                    {results.questions && results.questions.map((question, index) => {
                        const studentResponseLength = (question.studentResponse || "").length;
                        const isShortResponse = studentResponseLength < 50;
                        const studentResponseWidth = isShortResponse ? 280 : 380;
                        const feedbackWidth = isShortResponse ? 540 : 440;
                        
                        return (
                            <li key={index} 
                                ref={el => questionRefs.current[index] = el} 
                                style={{ position: 'relative', fontFamily: "'montserrat', sans-serif", marginBottom: '20px', background: 'white',
                                     width: '92%', marginRight: 'auto', paddingLeft: '4%',paddingRight: '4%', borderBottom: ' 1px solid lightgrey',  marginTop: '0px',   paddingBottom:'35px', marginLeft: '-5px' }}>
                             <div style={{ display: 'flex', fontFamily: "'montserrat', sans-serif", alignItems: 'center' }}>
                      
        
        {/* Question Text */}
        <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleQuestionClick(question.questionId);
    }}
    style={{ 
        width: 'calc(100%)', 
        backgroundColor: 'white', 
        fontWeight: 'bold', 
        lineHeight: '1.4', 
        fontSize: '20px', 
        textAlign: 'left', 
        border: 'none', 
        position: 'relative', 
        display: 'flex', 
        flexDirection: 'column', 
        cursor: 'pointer',
        padding: '0',
        fontFamily: 'inherit'
    }}
>
    <ResponsiveText
        text={question.question}
        maxFontSize={20} 
        minFontSize={14} 
    />
</button>
        
        {/* Score Buttons and Flag Button */}
        <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginLeft: 'auto',
            gap: '0px' 
        }}>
            {/* Score 2 Button */}
            <button
                onClick={() => updateGradeAndFeedback(index, 2, question.feedback)}
                style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                title="Assign Score: 2"
                aria-label="Assign Score 2"
            >
                <SquareCheck 
                    size={24} 
                    style={{
                        padding: '4px',
                        borderRadius: '5px',
                        border: '2px solid',
                        color: question.score === 2 ? '#16a34a' : '#9ca3af',
                        borderColor: question.score === 1 ? 'white' : 'white',
                        transition: 'background-color 0.3s, color 0.3s, border-color 0.3s'
                    }}
                />
            </button>

            {/* Score 1 Button */}
            <button
                onClick={() => updateGradeAndFeedback(index, 1, question.feedback)}
                style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                title="Assign Score: 1"
                aria-label="Assign Score 1"
            >
                <SquareSlash 
                    size={24}
                    style={{
                        padding: '4px',
                        borderRadius: '5px',
                        border: '2px solid',
                        color: question.score === 1 ? '#FFD13B' : '#9ca3af',
                        borderColor: question.score === 1 ? 'white' : 'white',
                        transition: 'background-color 0.3s, color 0.3s, border-color 0.3s'
                    }}
                />
            </button>

            {/* Score 0 Button */}
            <button
                onClick={() => updateGradeAndFeedback(index, 0, question.feedback)}
                style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                title="Assign Score: 0"
                aria-label="Assign Score 0"
            >
                <SquareX 
                    size={24} 
                    style={{
                        padding: '4px',
                        borderRadius: '5px',
                        border: '2px solid',
                        color: question.score === 0 ? '#dc2626' : '#9ca3af',
                        borderColor: question.score === 1 ? 'white' : 'white',
                        transition: 'background-color 0.3s, color 0.3s, border-color 0.3s'
                    }}
                />
            </button>

            {/* Flag Button */}
            <button
                onClick={() => toggleFlag(index)}
                style={{
                    padding: '4px',
                    marginLeft: '20px',
                    cursor: 'pointer',
                    borderRadius: '5px',
                    border: '2px solid',
                    background:'white',
                    color: question.flagged ? '#020CFF' : '#9ca3af',
                    borderColor: question.score === 1 ? 'white' : 'white',
                    transition: 'background-color 0.3s, color 0.3s, border-color 0.3s'
                }}
                title="Flag this question"
                aria-label={question.flagged ? "Unflag this question" : "Flag this question"}
            >
                <Flag size={20} />
            </button>
        </div>
                                </div>
                                <div style={{ marginTop: '0px'}}>
                               
                                    
                                <div style={{
    flexGrow: 0, // Changed from 1 to 0 to prevent full width
    paddingLeft: '30px',
    paddingRight: '0px',
    marginLeft: '0px',
    position: 'relative',
    padding: '10px 40px 10px 10px',
    minWidth: '100px',
    maxWidth: 'fit-content', // Added to make it inline
    background: `${question.score === 2 ? '#CCFFC3' : question.score === 1 ? '#FFF5D2' : '#FFCDCD'}`,
    borderLeft: `4px solid ${question.score === 2 ? '#20BF00' : question.score === 1 ? '#F4C10A' : '#FF0000'}`, 
    color: `${question.score === 2 ? '#20BF00' : question.score === 1 ? '#E76F00' : '#FF0000'}`, 
    display: 'inline-flex', // Changed from flex to inline-flex
    alignItems: 'center',
}}>
    <p style={{
        fontSize: '16px',
        fontWeight: '600',
        textAlign: 'left',
        margin: 0,
        width: 'auto', // Changed from 100% to auto
        padding: '0px',
        whiteSpace: 'pre-wrap', // Added to preserve line breaks
        overflowWrap: 'break-word', // Added to handle long words
    }}>
        {question.studentResponse || "Not provided"}
    </p>
</div>
                                    <div style={{
                                        width: `100%`,
                                        backgroundColor: 'white',
                                        position: 'relative',
                                        borderRadius: '20px',
                                        display: 'flex',
                                        marginTop: '20px',
                                        marginRight: '0px',
                                    }}>
                                      
                                            <MessageSquareMore size={25}  style={{position: 'absolute', left: '0px', top: '50%', transform: 'translatey(-50%)', color: 'grey'}}/>
                                      
                                            <textarea
  style={{
    fontSize: '16px',
    color: 'grey',
    textAlign: 'left',
    width: '100%',
    marginLeft: '30px',
    border: 'none',
    resize: 'none',
    overflow: 'hidden',
    fontFamily: "'montserrat', sans-serif",
    padding: '0 10px',
    background: 'transparent',
    lineHeight: '1.5',
    minHeight: '24px' // This sets exactly one line height (16px * 1.5)
  }}
  value={feedbackStates[index] || ''}
  onChange={(e) => {
    e.target.style.height = '24px'; // Reset to one line
    e.target.style.height = `${e.target.scrollHeight}px`;
    handleFeedbackChange(index, e.target.value);
  }}
  placeholder="Enter feedback here..."
  onFocus={(e) => {
    e.target.style.height = '24px'; // Reset to one line
    e.target.style.height = `${e.target.scrollHeight}px`;
  }}
/>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', marginBottom: '20px' }}>
                <div style={{ marginBottom: '0px', border: '0px solid grey', background: '#f4f4f4', height: '40px', borderRadius: '10px', marginLeft: '30px', display: 'flex', alignItems: 'center', padding: '0 10px' }}>
                    <label style={{ fontFamily: "'montserrat', sans-serif", marginRight: '10px' }}>
                        <input
                            type="checkbox"
                            checked={halfCredit}
                            onChange={(e) => setHalfCredit(e.target.checked)}
                        />
                        Enable Half Credit
                    </label>
                    <button
                        onClick={handleRegrade}
                        disabled={isRegrading}
                        style={{
                            backgroundColor: isRegrading ? '#A0A0A0' : '#f4f4f4',
                            color: isRegrading ? 'grey' : 'blue',
                            padding: '8px 20px',
                            fontSize: '18px',
                            borderRadius: '5px',
                            fontFamily: "'montserrat', sans-serif",
                            fontWeight: 'bold',
                            border: 'none',
                            cursor: isRegrading ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {isRegrading ? 'Regrading...' : 'Regrade Assignment'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TeacherStudentResults;