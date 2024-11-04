import React, { useState, useEffect, useCallback, useRef  } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../Universal/firebase';
import Navbar from '../../../Universal/Navbar';
import Tooltip from './ToolTip';
import axios from 'axios';
import { SquareCheck, SquareX, SquareSlash, Square, User, MessageSquareMore, Plus, Minus, YoutubeIcon, ChevronRight, ChevronLeft, ChevronUp, ChevronDown } from 'lucide-react';

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
    const scrollToQuestion = (index) => {
        setActiveQuestionIndex(index);
        questionRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    const debounce = (func, wait) => {
        let timeout;
        const debouncedFunction = (...args) => {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };

        debouncedFunction.cancel = () => {
            clearTimeout(timeout);
        };

        return debouncedFunction;
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
      useEffect(() => {
        const updateHeight = () => {
          if (contentRef.current) {
            const headerHeight = 50; // Height of the header
            const maxHeight = window.innerHeight - 230; // 230 = 180 (top) + 50 (header)
            const contentScrollHeight = contentRef.current.scrollHeight + headerHeight;
            
            if (contentScrollHeight > maxHeight) {
              setContentHeight(`${maxHeight}px`);
            } else {
              setContentHeight(`${contentScrollHeight}px`);
            }
          }
        };
    
        updateHeight();
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
      }, [results]);
    // Create debouncedUpdate function
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

    const handleFeedbackChange = (index, newFeedback) => {
        setDebouncedFeedback(prev => ({
            ...prev,
            [index]: newFeedback
        }));
        if (debouncedUpdateRef.current) {
            debouncedUpdateRef.current(index, results.questions[index].score, newFeedback);
        }
    };
    useEffect(() => {
        const fetchResults = async () => {
            try {
                const gradeDocRef = doc(db, 'grades', `${assignmentId}_${studentUid}`);
                const gradeDoc = await getDoc(gradeDocRef);
    
                if (gradeDoc.exists()) {
                    const data = gradeDoc.data();
                    setResults(data);
                    setAssignmentName(data.assignmentName);
                    
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
                        setStudentName(studentData.firstName + ' ' +  studentData.lastName );
                        console.log("Student Name:", studentData.firstName + ' ' +  studentData.lastName ); // Added log statement
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
                    halfCreditEnabled: halfCredit
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
                        feedback: newGrades[index].feedback
                    }));

                    const gradeDocRef = doc(db, 'grades', `${assignmentId}_${studentUid}`);
                    await updateDoc(gradeDocRef, {
                        questions: updatedQuestions,
                        rawTotalScore: newTotalScore,
                        scaledScore: newScaledScore,
                        percentageScore: newPercentageScore,
                        halfCreditEnabled: halfCredit
                    });

                    setResults(prevResults => ({
                        ...prevResults,
                        questions: updatedQuestions,
                        rawTotalScore: newTotalScore,
                        scaledScore: newScaledScore,
                        percentageScore: newPercentageScore,
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
    
        try {
            await updateDoc(doc(db, 'grades', `${assignmentId}_${studentUid}`), {
                questions: updatedQuestions,
                rawTotalScore: newTotalScore,
                percentageScore: newPercentageScore
            });

            setResults({
                ...results,
                questions: updatedQuestions,
                rawTotalScore: newTotalScore,
                percentageScore: newPercentageScore
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
    if (!results) {
        return <div>Loading...</div>;
    }

    const getLetterGrade = (percentage) => {
        if (percentage >= 90) return 'A';
        if (percentage >= 80) return 'B';
        if (percentage >= 70) return 'C';
        if (percentage >= 60) return 'D';
        return 'F';
    };

    const letterGrade = getLetterGrade(results.percentageScore);

    return (
        <div style={{   minHeight: '100vh',
            width: '100%',
            backgroundColor: '#FCFCFC',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative' }}>
            <Navbar userType="teacher" />
            <header style={{ backgroundColor: 'white', borderRadius: '10px', color: 'white', marginTop: '80px', height: '14%', display: 'flex', marginBottom: '-46px', alignItems: 'center', justifyContent: 'center', position: 'relative', margin: '1% auto', width: '70%' }}>
            </header>


            <div style={{
      position: 'fixed',
      height: isMapCollapsed ? '50px' : contentHeight,
      overflow: isMapCollapsed ? 'hidden' : 'auto',
      top: '180px',
      left: '40px',
      width: '80px',
      paddingBottom: isMapCollapsed ? '0px' : '30px',
      backgroundColor: 'white',
      
               boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)', 
      borderRadius: '10px',
      transition: 'all 0.3s',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        display: 'flex',
        width: '50px',
        marginLeft: 'auto',
        marginRight: 'auto',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px',
        height: '30px'
      }}>
        <span style={{ fontWeight: 'bold' }}>Map</span>
        <button
          onClick={() => setIsMapCollapsed(!isMapCollapsed)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}
        >
          {isMapCollapsed ? '+' : '-'}
        </button>
      </div>
      <div ref={contentRef} style={{ overflowY: 'auto', flex: 1 }}>
        {results.questions.map((question, index) => (
          <div
            key={index}
            onClick={() => scrollToQuestion(index)}
            style={{
              width: '50px',
              marginLeft: 'auto',
              marginRight: 'auto',
              alignItems: 'center',
              padding: '10px 5px',
              display: 'flex',
              borderTop: ' 2px solid #f4f4f4'
            }}
          >
            <span style={{ marginLeft: '0px', fontWeight: '700', marginRight: 'auto' }}>{index + 1}.</span>
            {question.score === results.scaleMax ? (
              <SquareCheck size={25} color="#00d12a" style={{ marginRight: '0px' }} />
            ) : question.score === results.scaleMin ? (
              <SquareX size={25} color="#FF0000" style={{ marginRight: '0px' }} />
            ) : (
              <SquareSlash size={25} color="#FFD13B" style={{ marginRight: '0px' }} />
            )}
          </div>
         ))}
                </div>
            </div>


            <div style={{  fontFamily: "'montserrat', sans-serif", backgroundColor: '', width: '870px', zIndex: '100', alignItems: 'center', marginLeft: 'auto', marginRight: 'auto', marginTop: '150px'}}>
           
           
           
       
               
                  
                  


        <div style={{display: 'flex'}}>
            <div style={{display: 'flex',
               boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)' , paddingRight: '0px', width: '655px ', borderRadius: '15px', marginBottom: '20px', height: '190px', marginLeft: '-10px',background: 'white' }}>
       <div style={{marginLeft: '30px', marginBottom: '40px'}}>
       <h1 style={{ fontSize: '40px', color: 'black', marginBottom: '0px',  marginLeft: '-5px',fontFamily: "'montserrat', sans-serif", textAlign: 'left',  }}>{studentName}</h1>
     
       <h1 style={{ fontSize: '30px', fontFamily: "'montserrat', sans-serif", textAlign: 'left', color: 'grey', fontWeight: '600', marginTop: '10px'   }}> {assignmentName}
      </h1>
       <h1 style={{ fontSize: '20px', fontFamily: "'montserrat', sans-serif", textAlign: 'left',  color: 'grey', fontWeight: '500', marginTop: '-10px' }}> Submitted: {new Date(results.submittedAt.toDate()).toLocaleString()} </h1>
            
        
       </div>
         

       </div>
       <div style={{height: '190px ', position: 'relative', marginLeft:'auto', boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)' , borderRadius: '15px', width: '190px ', background: 'white'}}>
       <img style={{ width: '150px', marginLeft: '20px' , marginTop: '23px' }} src="/Score.svg" alt="logo" />
     
       <div style={{fontSize: '60px', fontWeight: 'bold', width: '150px', height: '150px',position: 'absolute', background: 'transparent',  borderRadius:  '10px', top: '20px', left: '20px', textAlign: 'center', lineHeight: '150px'}}> 
       {letterGrade}

          </div>
                      
                   
           </div>
           </div>
           <div style={{display: 'flex', width: '880px', marginTop: '10px'}}>
               <div style={{width: '415px', background: 'white',
               boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)' , borderRadius: '15px', height: '135px',  padding: '0px 0px', marginLeft: '-10px'}}>
                   <h1 style={{  marginBottom: '-20px', marginTop:'15px', marginLeft: '30px', fontSize: '25px', }}> Point Distribution</h1>
                 <div style={{display: 'flex', justifyContent: 'space-around'}}> 
                   <div style={{ fontSize: '30px', fontWeight: 'bold', color: 'black', display: 'flex', alignItems: 'center',  justifyContent: 'space-around', marginLeft: '5px', width: '90px', marginTop: '50px' , }}>
                   
                       <div style={{width: '40px'}}>
                       <SquareCheck size={40} color="#00d12a" />
                       </div>
                       <h1 style={{ backgroundColor: 'white', borderRadius: '5px', margin: 'auto', marginLeft: '5px', marginTop: '0px', fontSize: '35px', alignItems: 'center', position: 'relative', fontFamily: "'montserrat', sans-serif" }}>{correctCount}</h1>
                
                   </div>
               
               
                   
                   <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'black', display: 'flex', alignItems: 'center',  justifyContent: 'space-around', marginLeft: '5px',  width: '90px' ,  marginTop: '50px'}}>
                   <div style={{width: '40px'}}>
                       <SquareSlash size={40} color="#FFD13B"  />
                       </div>
                       <h1 style={{backgroundColor: 'white', borderRadius: '5px', margin: 'auto', marginLeft: '5px', marginTop: '0px', fontSize: '35px', alignItems: 'center', position: 'relative', fontFamily: "'montserrat', sans-serif" }}>{partialCount}</h1>
                       
                   </div>
            
                   <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'black', display: 'flex', alignItems: 'center',  justifyContent: 'space-around', marginLeft: '5px',  width: '90px', marginTop: '50px' }}>
                     
                   <div style={{width: '40px'}}>
                         <SquareX size={40} color="#ff0000" />
                       </div>
                       <h1 style={{backgroundColor: 'white', borderRadius: '5px', margin: 'auto', marginLeft: '5px', marginTop: '0px', fontSize: '35px', alignItems: 'center', position: 'relative', fontFamily: "'montserrat', sans-serif" }}>{incorrectCount}</h1>
                   </div>
                   </div>
                   </div>


                   <div style={{width: '435px', background: 'white',
               boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)' , borderRadius: '15px', height: '135px',  padding: '0px 0px', marginLeft: '30px' }}>
                   <h1 style={{  marginBottom: '-20px', marginTop:'15px', marginLeft: '30px', fontSize: '25px', }}>Grade</h1>
                   <div style={{display: 'flex', justifyContent: 'space-around', marginTop: '25px'}}> 
                   <p style={{fontSize: '25px', width: '20px',color: 'grey', padding: '5px 30px', background: '#f4f4f4', borderRadius: '5px', fontWeight: 'bold',  textAlign: 'center'}}>{letterGrade}</p>
                   <p style={{fontSize: '25px', width: '60px',color: 'grey', padding: '5px 25px', background: '#f4f4f4', borderRadius: '5px', fontWeight: 'bold',  textAlign: 'center'}}>   {results.percentageScore.toFixed(0)}%</p>
                   <p style={{fontSize: '25px', width: '90px',color: 'grey', padding: '5px 0px', background: '#f4f4f4', borderRadius: '5px', fontWeight: 'bold',  textAlign: 'center'}}>     {`${results.rawTotalScore}/${results.questions.length * results.scaleMax}`}</p>

                   </div>
              </div>
              
               </div>


               </div>
       

                 
              
              
       
                
              
                <ul style={{ listStyle: 'none', padding: '0', marginTop: '30px', background: 'white',
               boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)',  width: '870px',marginLeft: 'auto', marginRight: 'auto', borderRadius: '20px' }}>
                    {results.questions && results.questions.map((question, index) => {
                        const studentResponseLength = (question.studentResponse || "").length;
                        const isShortResponse = studentResponseLength < 50;
                        const studentResponseWidth = isShortResponse ? 280 : 380;
                        const feedbackWidth = isShortResponse ? 540 : 440;
                        
                        return (
                            <li key={index} 
                                ref={el => questionRefs.current[index] = el} 
                                style={{ position: 'relative', fontFamily: "'montserrat', sans-serif", marginBottom: '20px', width: '840px', borderBottom: ' 2px solid #f4f4f4', marginLeft: 'auto', marginRight: 'auto',  paddingBottom:'50px', marginTop: '30px' }}>
                             <div style={{ display: 'flex', fontFamily: "'montserrat', sans-serif", alignItems: 'center' }}>
                                <div style={{position: 'relative', width: '40px', marginTop: '0px'}}>
                                    {question.score === 2 ? (
                                        <SquareCheck size={60} color="#00d12a" />
                                    ) : question.score === 1 ? (
                                        <SquareSlash size={60} color="#FFD13B" />
                                    ) : (
                                        <SquareX size={60} color="#FF0000" />
                                    )}

                                    <Plus
                                        onClick={() => question.score < 2 && updateGradeAndFeedback(index, question.score + 1, question.feedback)}
                                        size={20} 
                                        color={question.score === 2 ? "lightgrey" : "#00d12a"}
                                        strokeWidth={5}
                                        style={{
                                            position: 'absolute',
                                            top: '25px',
                                            cursor: question.score === 2 ? 'not-allowed' : 'pointer',
                                            right: '-23px',
                                            background: 'white',
                                            height: '15px'
                                        }}
                                    />
                                    
                                    <Minus 
                                        onClick={() => question.score > 0 && updateGradeAndFeedback(index, question.score - 1, question.feedback)} 
                                        size={10} 
                                        color={question.score === 0 ? "lightgrey" : "#FF0000"}
                                        strokeWidth={10}
                                        style={{
                                            position: 'absolute',
                                            top: '25px',
                                            cursor: question.score === 0 ? 'not-allowed' : 'pointer',
                                            left: '2px',
                                            background: 'white',
                                            height: '15px'
                                        }}
                                    />
                                </div>
                                    <div style={{ width: '700px', backgroundColor: 'white', fontWeight: 'bold', lineHeight: '1.4', fontSize: '20px', textAlign: 'left', border: '0px solid lightgrey', position: 'relative', display: 'flex', flexDirection: 'column', marginLeft: '40px', marginTop: '0px'}}>
                                        {question.question}
                                    </div>
                                    
                                </div>
                                <div style={{display: 'flex', marginTop: '20px'}}>
                                    <div style={{
                                        width: `${studentResponseWidth}px`,
                                        backgroundColor: 'white',
                                        position: 'relative',
                                        borderRadius: '20px',
                                        display: 'flex',
                                        border: '4px solid #f4f4f4',
                                        marginRight: '20px',
                                    }}>
                                        <div style={{
                                            width: '50px',
                                            position: 'absolute',
                                            borderRadius: '15px 0px 0px 15px',
                                            left:'-4px',
                                            top: '-4px',
                                            bottom:'-4px',
                                            background: `${question.score === 2 ? '#AEF2A3' : question.score === 1 ? '#FFDE67' : '#FFD3D3'}`,
                                            border: `4px solid ${question.score === 2 ? '#20BF00' : question.score === 1 ? '#F4C10A' : '#FF0000'}`, 
                                            color: `${question.score === 2 ? '#20BF00' : question.score === 1 ? '#E76F00' : '#FF0000'}`, 
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}> 
                                            <User size={40} />
                                        </div>
                                        <div style={{
                                            flexGrow: 1,
                                            paddingLeft: '30px',
                                            paddingRight: '0px',
                                            marginLeft: '20px',
                                            position: 'relative',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            minHeight: '100px',
                                        }}>
                                            <p style={{
                                                fontSize: '16px',
                                                fontWeight: 'bold',
                                                textAlign: 'left',
                                                margin: 0,
                                                width: '88%',
                                                padding: '0px',
                                            }}>
                                                {question.studentResponse || "Not provided"}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{
                                        width: `${feedbackWidth}px`,
                                        backgroundColor: 'white',
                                        position: 'relative',
                                        borderRadius: '20px',
                                        display: 'flex',
                                        border: '4px solid #f4f4f4',
                                        marginRight: '0px',
                                    }}>
                                        <div style={{
                                            width: '50px',
                                            position: 'absolute',
                                            borderRadius: '15px 0px 0px 15px',
                                            left:'-4px',
                                            top: '-4px',
                                            bottom:'-4px',
                                            background: `#f4f4f4`,
                                            border: `4px solid lightgrey`, 
                                            color: `grey`, 
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}> 
                                            <MessageSquareMore size={40} />
                                        </div>
                                        <textarea
                                            style={{
                                                fontSize: '16px',
                                                color: 'grey',
                                                paddingTop: '10px',
                                                textAlign: 'left',
                                                marginLeft: '70px',
                                                width: `${feedbackWidth - 80}px`,
                                                border: 'none',
                                                resize: 'vertical',
                                                minHeight: '30px',
                                                fontFamily: "'montserrat', sans-serif",
                                            }}
                                            value={debouncedFeedback[index] || question.feedback || ""}
                                            onChange={(e) => handleFeedbackChange(index, e.target.value)}
                                            placeholder="Enter feedback here..."
                                 
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