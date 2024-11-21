import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, getDocs, query, where, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../Universal/firebase';
import { ClipboardList, ClipboardMinus, Flag, Pencil, Square, SquareSlash, SquareX, ChevronDown, ChevronUp, User, ArrowRight, SquareCheck, PencilOff, MessageSquareMore, YoutubeIcon } from 'lucide-react';
import Navbar from '../../Universal/Navbar';

import TextareaAutosize from 'react-textarea-autosize';
const QuestionResults = ({ assignmentId, questionId, inModal = false, onClose }) => {
  
  const [students, setStudents] = useState([]);
  const [assignmentName, setAssignmentName] = useState('');
  const [questionData, setQuestionData] = useState(null);
  const [showResponseMap, setShowResponseMap] = useState({});
  const [showRubric, setShowRubric] = useState(false); // New state for rubric visibility
  const [loading, setLoading] = useState(true);
  const [classId, setClassId] = useState(null);
  const [editingQuestions, setEditingQuestions] = useState({});
  const [feedbackDebounceTimers, setFeedbackDebounceTimers] = useState({});
  const [className, setClassName] = useState('');
  const [classChoice, setClassChoice] = useState('');
  const [expandAll, setExpandAll] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth' // This gives a smooth scrolling effect
    });
  }, [assignmentId, questionId]); 
  const handleFeedbackChange = async (studentId, newFeedback) => {
    try {
      const gradeRef = doc(db, 'grades', studentId);
      const gradeDoc = await getDoc(gradeRef);
      const gradeData = gradeDoc.data();
  
      // Update the specific question's feedback while maintaining array structure
      const updatedQuestions = gradeData.questions.map(q => {
        if (q.questionId === questionId) {
          return {
            ...q,
            feedback: newFeedback
          };
        }
        return q;
      });
  
      // Clear any existing timer for this student
      if (feedbackDebounceTimers[studentId]) {
        clearTimeout(feedbackDebounceTimers[studentId]);
      }
  
      // Set a new timer
      const newTimer = setTimeout(async () => {
        // Update Firestore
        await updateDoc(gradeRef, {
          questions: updatedQuestions,
          // Update hasFlaggedQuestions based on the new flagged statuses
          hasFlaggedQuestions: updatedQuestions.some(q => q.flagged),
        });
      }, 500); // 500ms debounce
  
      // Store the new timer
      setFeedbackDebounceTimers(prev => ({
        ...prev,
        [studentId]: newTimer
      }));
  
      // Update local state immediately for responsive UI
      setStudents(prevStudents =>
        prevStudents.map(s =>
          s.id === studentId 
            ? { 
                ...s, 
                feedback: newFeedback
              } 
            : s
        )
      );
    } catch (error) {
      console.error("Error updating feedback:", error);
    }
  };

  const updateQuestionContent = async (newQuestion, newRubric) => {
    try {
      setLoading(true);
      
      // Get all grade documents for this assignment
      const gradesRef = collection(db, 'grades');
      const gradesQuery = query(gradesRef,
        where('assignmentId', '==', assignmentId)
      );
      const gradesSnapshot = await getDocs(gradesQuery);

      // Update each grade document
      const updatePromises = gradesSnapshot.docs.map(async (gradeDoc) => {
        const gradeData = gradeDoc.data();
        const updatedQuestions = gradeData.questions.map(q => {
          if (q.questionId === questionId) {
            return {
              ...q,
              question: newQuestion,
              rubric: newRubric
            };
          }
          return q;
        });

        // Determine if any questions are still flagged after updating question content
        const hasFlaggedQuestions = updatedQuestions.some(q => q.flagged);

        // Update the document
        return updateDoc(doc(db, 'grades', gradeDoc.id), {
          questions: updatedQuestions,
          hasFlaggedQuestions: hasFlaggedQuestions
        });
      });

      // Wait for all updates to complete
      await Promise.all(updatePromises);

      // Update local state
      setQuestionData(prev => ({
        ...prev,
        question: newQuestion,
        rubric: newRubric
      }));

      // Exit editing mode
      setEditingQuestions(prev => ({
        ...prev,
        [questionId]: false
      }));

    } catch (error) {
      console.error("Error updating question content:", error);
    } finally {
      setLoading(false);
    }
  };

  // Update the question blur handler
  const handleQuestionBlur = async () => {
    if (editingQuestions[questionId]) {
      await updateQuestionContent(questionData.question, questionData.rubric);
    }
  };

  // Update the rubric blur handler
  const handleRubricBlur = async () => {
    if (editingQuestions[questionId]) {
      await updateQuestionContent(questionData.question, questionData.rubric);
    }
  };

  // Update the edit toggle function
  const handleEditQuestionToggle = (qId) => {
    setEditingQuestions(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
    
    if (!editingQuestions[qId]) {
      setShowRubric(true);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const gradesRef = collection(db, 'grades');
        const gradesQuery = query(gradesRef,
          where('assignmentId', '==', assignmentId)
        );

        const gradesSnapshot = await getDocs(gradesQuery);
        let responses = 0;
        let totalScore = 0;
        let questionText = '';
        let rubricText = '';
        let rawMaxScore = 0;

        const studentsData = [];
        if (gradesSnapshot.docs.length > 0) {
          const firstDoc = gradesSnapshot.docs[0].data();
          if (firstDoc.classId) {
            setClassId(firstDoc.classId);
            
            // Fetch class details
            const classDocRef = doc(db, 'classes', firstDoc.classId);
            const classDoc = await getDoc(classDocRef);
            if (classDoc.exists()) {
              const classData = classDoc.data();
              // Note: These are intentionally "swapped" to match the pattern in TeacherClassHome
              setClassName(classData.classChoice); // Set the class subject/name
              setClassChoice(classData.className); // Set the period/number
            }
          }
        }
        gradesSnapshot.forEach(doc => {
          const gradeData = doc.data();
          setAssignmentName(gradeData.assignmentName);
          

          // Assuming rawMaxScore is the maximum possible score, e.g., 2 * number of questions
          if (!rawMaxScore && gradeData.rawMaxScore) {
            rawMaxScore = gradeData.rawMaxScore;
          }

          const relevantQuestion = gradeData.questions.find(q => q.questionId === questionId);
          if (relevantQuestion) {
            responses++;
            totalScore += relevantQuestion.score;
            questionText = relevantQuestion.question;
            rubricText = relevantQuestion.rubric;

            studentsData.push({
              id: doc.id,
              firstName: gradeData.firstName,
              classId: gradeData.classId,
              lastName: gradeData.lastName,
              studentUid: gradeData.studentUid,
              response: relevantQuestion.studentResponse,
              score: relevantQuestion.score,
              flagged: relevantQuestion.flagged || false,
              feedback: relevantQuestion.feedback,
              rawTotalScore: gradeData.rawTotalScore || 0, // Assuming rawTotalScore is available
              rawMaxScore: gradeData.rawMaxScore || 0,
              percentageScore: gradeData.percentageScore || 0, // Assuming rawMaxScore is available
            });
          }
        });

        // Sort students by last name
        studentsData.sort((a, b) => a.lastName.localeCompare(b.lastName));

        // Calculate average score
        const averageScore = responses > 0 ? (totalScore / responses / 2) * 100 : 0;

        setQuestionData({
          question: questionText,
          rubric: rubricText,
          averageScore: averageScore,
          totalResponses: responses
        });

        setStudents(studentsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [assignmentId, questionId]);

  // Function to update a student's grade
  const updateGrade = async (studentId, newScore) => {
    try {
      const gradeRef = doc(db, 'grades', studentId);
      const gradeDoc = await getDoc(gradeRef);
      const gradeData = gradeDoc.data();
  
      // Update the specific question while maintaining array structure
      const updatedQuestions = gradeData.questions.map(q => {
        if (q.questionId === questionId) {
          return {
            ...q,
            score: newScore
          };
        }
        return q;
      });
  
      // Calculate new raw total
      const newRawTotal = updatedQuestions.reduce((sum, q) => sum + q.score, 0);
      
      // Calculate new percentage
      const maxScore = gradeData.rawMaxScore || (updatedQuestions.length * 2);
      const newPercentage = (newRawTotal / maxScore) * 100;
  
      // Update the entire document, including hasFlaggedQuestions
      const hasFlaggedQuestions = updatedQuestions.some(q => q.flagged);
  
      await updateDoc(gradeRef, {
        questions: updatedQuestions,
        rawTotalScore: newRawTotal,
        percentageScore: newPercentage,
        hasFlaggedQuestions: hasFlaggedQuestions // Update flag status
      });
  
      // Update local state
      setStudents(prevStudents =>
        prevStudents.map(student =>
          student.id === studentId 
            ? { 
                ...student, 
                score: newScore,
                rawTotalScore: newRawTotal,
                percentageScore: newPercentage
              } 
            : student
        )
      );
    } catch (error) {
      console.error("Error updating grade:", error);
    }
  };

  // Function to toggle flag status
  const toggleFlag = async (studentId) => {
    try {
      const student = students.find(s => s.id === studentId);
      const gradeRef = doc(db, 'grades', studentId);
      const gradeDoc = await getDoc(gradeRef);
      const gradeData = gradeDoc.data();
  
      // Update the specific question while maintaining array structure
      const updatedQuestions = gradeData.questions.map(q => {
        if (q.questionId === questionId) {
          return {
            ...q,
            flagged: !student.flagged
          };
        }
        return q;
      });
  
      // Determine if any questions are still flagged
      const hasFlaggedQuestions = updatedQuestions.some(q => q.flagged);
  
      // Update the entire document, including hasFlaggedQuestions
      await updateDoc(gradeRef, {
        questions: updatedQuestions,
        hasFlaggedQuestions: hasFlaggedQuestions // Update flag status
      });
  
      // Update local state
      setStudents(prevStudents =>
        prevStudents.map(s =>
          s.id === studentId 
            ? { ...s, flagged: !s.flagged } 
            : s
        )
      );
    } catch (error) {
      console.error("Error toggling flag:", error);
    }
  };

  // Toggle visibility of a student's response and feedback
  const toggleResponse = (studentId) => {
    setShowResponseMap(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  // Expand or collapse all student responses
  const handleExpandAll = () => {
    const newShowResponseMap = {};
    students.forEach(student => {
      newShowResponseMap[student.id] = !expandAll;
    });
    setShowResponseMap(newShowResponseMap);
    setExpandAll(!expandAll);
  };

  // Toggle rubric visibility
  const toggleRubricVisibility = () => {
    setShowRubric(prev => !prev);
  };

  if (loading) {
    return <div></div>;
  }
  
  const handleGradeClick = (studentUid) => {
    navigate(`/teacherStudentResults/${assignmentId}/${studentUid}/${classId}`);
  };
  
  const handleStudentClick = (studentUid) => {
    navigate(`/class/${classId}/student/${studentUid}/grades`);
  };
  
  const handleAssignmentClick = () => {
    navigate(`/class/${classId}/assignment/${assignmentId}/TeacherResults`);
  };

  
  
  return (
    <div>
  
      <div style={{
      }}>

       
          <div style={{
      width: 'calc(92% - 200px)',
      padding: '10px 4%',
      position: 'fixed',
      
      zIndex: '2',
      left: '200px',
      top: '160px',
      background: 'rgb(255,255,255,.9)',
      backdropFilter: 'blur(5px)', 
      borderBottom:" 1px solid lightgrey",
 
    }}>
      <div style={{
        display: 'flex', 
        gap: '24px'
      }}>
        {/* Main content area (80%) */}
        <div style={{
          flexGrow: 1,
          width: '80%',
        }}>
          {/* Question Section */}
          <div style={{  }}>
            {editingQuestions[questionId] ? (
              <TextareaAutosize
                style={{
                  width: '100%',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  border: '1px solid #e5e7eb',
                  
                fontFamily: "default",
                  borderRadius: '8px',
                  outline: 'none',
                  resize: 'none'
                }}
                value={questionData?.question}
                onChange={(e) => setQuestionData(prev => ({ ...prev, question: e.target.value }))}
                onBlur={handleQuestionBlur}
                minRows={1}
              />
            ) : (
              <h1 style={{
                fontWeight: '600',
                fontSize: '20px',
                marginTop: '10px',marginBottom: '-0px',
                fontFamily: "'Montserrat', sans-serif",
             
              }}>
                {questionData?.question}
              </h1>
            )}
          </div>

          {/* Rubric Section */}
          {showRubric && (
            <div style={{
              marginTop: '16px',
              padding: '16px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <ClipboardList style={{
                  width: '24px',
                  height: '24px',
                  color: '#6b7280'
                }} />
                {editingQuestions[questionId] ? (
                  <TextareaAutosize
                    style={{
                      width: '100%',
                      fontSize: '1rem',
                      background: 'transparent',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      outline: 'none',
                      resize: 'none'
                    }}
                    value={questionData?.rubric}
                    onChange={(e) => setQuestionData(prev => ({ ...prev, rubric: e.target.value }))}
                    onBlur={handleRubricBlur}
                    minRows={3}
                  />
                ) : (
                  <p style={{
                    fontSize: '1rem',
                    margin: '0'
                  }}>
                    {questionData?.rubric}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar with controls and score */}
        <div style={{
          width: '102px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          {/* Control buttons */}
          <div style={{
            display: 'flex',
            gap: '16px',
          }}>
            <button
              onClick={toggleRubricVisibility}
              style={{
                padding: '8px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#9ca3af'
              }}
              aria-label={showRubric ? "Hide Rubric" : "Show Rubric"}
            >
              {showRubric ? (
                <ClipboardMinus style={{ width: '24px', height: '24px' }} />
              ) : (
                <ClipboardList style={{ width: '24px', height: '24px' }} />
              )}
            </button>
            <button
              onClick={() => handleEditQuestionToggle(questionId)}
              style={{
                padding: '8px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#9ca3af'
              }}
              aria-label={editingQuestions[questionId] ? "Stop Editing" : "Edit Question"}
            >
              {editingQuestions[questionId] ? (
                <PencilOff style={{ width: '24px', height: '24px' }} />
              ) : (
                <Pencil style={{ width: '24px', height: '24px' }} />
              )}
            </button>
          </div>

          {/* Score display */}
         
        </div>
        <div style={{
            width: '70px',
            height: '40px',
            lineHeight: '40px',
            borderRadius: '8px',
            textAlign: 'right',
            backgroundColor: 'white',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            {questionData?.averageScore.toFixed(0)}%
          </div>

      </div>

      </div>























      
        </div>

        {/* Rubric Section - Conditionally Rendered */}
       
        

        {/* Responses Header with Expand All Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginLeft: '4%', marginRight: '4%',  marginTop: '80px'}}>
          <div style={{fontWeight: '600', fontSize: '16px', marginBottom: '-20px', color: 'lightgrey', marginTop: '-10px'}}>
            {questionData?.totalResponses} Responses
          </div>
          <button onClick={handleExpandAll} style={{
            padding: '8px 12px',
            backgroundColor: 'white',
            marginBottom: '0px', 
            border: '1px solid lightgrey',
            color: 'grey', 
            borderRadius: '5px',
            cursor: 'pointer',
            display: 'flex',
            fontWeight: '600',
            alignItems: 'center',
            gap: '4px',
            fontFamily: "'montserrat', sans-serif",
          }}>
         {expandAll ? 'Collapse All' : 'Expand All'}   {expandAll ? <ChevronUp size={16}/> : <ChevronDown size={16}/>} 
          </button>
        </div>


<div style={{
           
            background: 'white'}}>
















        {/* Student List */}
        {students.map((student, index) => (
          <div key={student.id} style={{
            padding: '10px 0px',
            borderBottom: '1px solid lightgrey',
            marginBottom: '0px'
          }}>
            {/* Student Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginRight: '4%',
              justifyContent: 'space-between'
            }}>
              <div style={{
                display: 'flex',
              
                alignItems: 'center',
                marginLeft: '4%',
                gap: '16px'
              }}>
                {/* Score Icon */}
             
                <h3 
                         onClick={() => handleStudentClick(student.studentUid)}
                style={{
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontFamily: "'montserrat', sans-serif"
                }}
                
                
                onMouseEnter={(e) => {
                    e.target.style.textDecoration = 'underline';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.textDecoration = 'none';
                  }}>{`${student.lastName}, ${student.firstName}`}</h3>


              </div>
             
              <div style={{
                display: 'flex',
                alignItems: 'center',
                width: '300px',
                gap: '16px', 
              }}>

{!showResponseMap[student.id] && (
                    <div style={{
                      overflow: 'hidden',
                      padding: '5px 10px',
                      zIndex: '0',
                      maxWidth: '40%',
                      position: 'absolute', left: '250px',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      background: student.score === 2 ? '#CCFFC3' : student.score === 1 ? '#FFF5D2' : '#FFCDCD',
                      borderLeft: `4px solid ${student.score === 2 ? '#20BF00' : student.score === 1 ? '#F4C10A' : '#FF0000'}`,
                      color: student.score === 2 ? '#20BF00' : student.score === 1 ? '#E76F00' : '#FF0000',
                     
                      flex: 1,
                      fontSize: '14px'
                    }}>
                      {student.response || "No response provided"}
                    </div>
                  )}

                {/* Score Controls */}
                <div style={{
                  display: 'flex',
                  gap: '2px'
                }}>
                    <button
                  onClick={() => toggleResponse(student.id)}
                  style={{
                    padding: '4px',
                    
                    backgroundColor: 'transparent',
                   border: 'none',
                    cursor: 'pointer',
                    color: '#9ca3af'
                  }}
                >
                  {showResponseMap[student.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                  <button
                    onClick={() => updateGrade(student.id, 2)}
                    style={{
                      border: 'none',
                      background: 'none' ,
                       cursor: 'pointer',
                    }}
                  >
                    <SquareCheck size={20} 
                    
                    style={{


                      padding: '4px 4px',
                      borderRadius: '5px',
                      
                      cursor: 'pointer',
                      background: 'white',
                      color: student.score === 2 ? '#16a34a' : '#9ca3af',
                      


                    }}
                    
                    />
                  </button>
                  <button
                    onClick={() => updateGrade(student.id, 1)}
                    style={{
                      border: 'none',
                      background: 'none' ,
                       cursor: 'pointer',
                    }}
                  >
                    <SquareSlash size={20}
                    
                    
                    style={{

                      padding: '4px 4px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      border: 'none',
                      background: 'white',
                      color: student.score === 1 ? '#FFD13B' : '#9ca3af'



                    }}
                    
                    />
                  </button>
                  <button
                    onClick={() => updateGrade(student.id, 0)}
                    style={{
                     
                     border: 'none',
                     background: 'none' ,
                      cursor: 'pointer',
                  
                    }}
                  >
                    <SquareX size={20}  style={{  

                      padding: '4px 4px',
                      borderRadius: '5px',

                      border: 'none',
                      cursor: 'pointer',
                      background: 'white',
                      color: student.score === 0 ? '#dc2626' : '#9ca3af'



                    }}/>
                  </button>
                </div>

                {/* Flag Button */}
                <button
                  onClick={() => toggleFlag(student.id)}
                  style={{
                    padding: '6px 8px',
                    cursor: 'pointer',
                    marginTop: '-4px',
                    borderRadius: '5px',
                    border: 'none',
                    background: 'white',
                    color: student.flagged ? '#020CFF' : '#9ca3af',
                    
                  }}
                >
                  <Flag size={20} />
                </button>

                {/* Chevron Toggle Button */}
              

                {/* Overall Percentage */}
                <span style={{
                  fontWeight: '500',
                  fontFamily: "'montserrat', sans-serif"
                }}>
               {student.percentageScore ? 
    `${Math.round(student.percentageScore)}%` : 
    (student.rawTotalScore !== undefined && student.rawMaxScore ? 
      `${Math.round((student.rawTotalScore / student.rawMaxScore) * 100)}%` : 
      'N/A'
    )
  }
                </span>
                <button
                   onClick={() => handleGradeClick(student.studentUid)} 
                  style={{
                    padding: '4px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9ca3af'
                  }}
                  
                >
                 <ArrowRight size={20} />
                </button>
              </div>
            </div>

            {/* Student Response and Feedback */}
            {showResponseMap[student.id] && (
  <div style={{
    marginTop: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  }}>
    <div style={{
      display: 'inline-block', // Changed to inline-block
      maxWidth: 'calc(100% - 360px)',
      marginLeft: '4%',
    }}>
      <div style={{
        padding: '5px 10px',
        width: 'fit-content', // Added to fit content
        backgroundColor: student.score === 2 ? '#CCFFC3' : 
                        student.score === 1 ? '#FFF5D2' : '#FFCDCD',
        borderLeft: `4px solid ${
          student.score === 2 ? '#20BF00' : 
          student.score === 1 ? '#F4C10A' : '#FF0000'
        }`,
      }}>
        <p style={{
          margin: 0,
          color: student.score === 2 ? '#20BF00' : 
                 student.score === 1 ? '#E76F00' : '#FF0000',
          fontWeight: '500',
          whiteSpace: 'pre-wrap', // Added to preserve formatting
          overflowWrap: 'break-word' // Added to handle long words
        }}>
          {student.response || "No response provided"}
        </p>
      </div>
    </div>

    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
      marginLeft: '4%',
      maxWidth: 'calc(100% - 380px)',
      padding: '16px',
      backgroundColor: 'white',
      borderRadius: '4px'
    }}>
      <MessageSquareMore size={20} style={{ color: 'grey', marginTop: '2px' }}/>
      <textarea
        value={student.feedback || ''}
        onChange={(e) => handleFeedbackChange(student.id, e.target.value)}
        style={{
          width: '100%',
          border: 'none',
          padding: '0',
          backgroundColor: 'transparent',
          resize: 'none',
          fontSize: '14px',
          color: 'grey',
          fontFamily: "'montserrat', sans-serif"
        }}
        placeholder="Add feedback..."
      />
    </div>
  </div>
)}


       
        </div>
      ))}

        
      </div>
      </div>
  );
};

export default QuestionResults;
