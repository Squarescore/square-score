import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, getDocs, query, where, updateDoc, doc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../../Universal/firebase';
import { ClipboardList, ClipboardMinus, Flag, Pencil, Square, SquareSlash, SquareX, ChevronDown, ChevronUp, User, ArrowRight, SquareCheck, PencilOff, MessageSquareMore, YoutubeIcon, Users, Check, Slash, X } from 'lucide-react';
import Navbar from '../../../Universal/Navbar';
import { GlassContainer } from '../../../../styles';
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
  const getGradeColors = (grade) => {
    if (grade === undefined || grade === null || grade === 0) return { color: '#858585', variant: 'clear' };
    if (grade < 60) return { color: '#c63e3e', variant: 'red' };
    if (grade < 70) return { color: '#ff8800', variant: 'orange' };
    if (grade < 80) return { color: '#ffc300', variant: 'yellow' };
    if (grade < 90) return { color: '#29c60f', variant: 'green' };
    if (grade < 100) return { color: '#006400', variant: 'darkgreen' };
    return { color: '#f198ff', variant: 'pink' };
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

        // First get the assignment details to get the question text
        const assignmentRef = doc(db, 'assignments', assignmentId);
        const assignmentDoc = await getDoc(assignmentRef);
        let questionText = '';
        let rubricText = '';
        
        if (assignmentDoc.exists()) {
          const assignmentData = assignmentDoc.data();
          if (assignmentData.questions && assignmentData.questions[questionId]) {
            questionText = assignmentData.questions[questionId].question;
            rubricText = assignmentData.questions[questionId].rubric;
          }
        }

        const gradesSnapshot = await getDocs(gradesQuery);
        let responses = 0;
        let totalScore = 0;
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
  
      // Calculate new raw total and percentage scores
      const newRawTotal = updatedQuestions.reduce((sum, q) => sum + q.score, 0);
      const maxScore = gradeData.rawMaxScore || (updatedQuestions.length * 2);
      const newPercentageScore = (newRawTotal / maxScore) * 100;
      const newScaledScore = (newRawTotal / maxScore);
  
      // Check for flagged questions
      const hasFlaggedQuestions = updatedQuestions.some(q => q.flagged);
  
      // Update both grade document and student's class grades
      const studentRef = doc(db, 'students', gradeData.studentUid);
      
      const batch = writeBatch(db);
      
      // Update grade document
      batch.update(gradeRef, {
        questions: updatedQuestions,
        rawTotalScore: newRawTotal,
        percentageScore: newPercentageScore,
        scaledScore: newScaledScore,
        hasFlaggedQuestions
      });
  
      // Update student's class grades
      batch.update(studentRef, {
        [`class_${gradeData.classId}.grades.${gradeData.assignmentId}`]: {
          score: newPercentageScore,
          submittedAt: gradeData.submittedAt,
          assignmentId: gradeData.assignmentId,
          assignmentName: gradeData.assignmentName,
      
        }
      });
  
      await batch.commit();
  
      // Update local state
      setStudents(prevStudents =>
        prevStudents.map(student =>
          student.id === studentId 
            ? { 
                ...student, 
                score: newScore,
                rawTotalScore: newRawTotal,
                percentageScore: newPercentageScore,
                scaledScore: newScaledScore
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
    zIndex: '10',
    left: '200px',
    top: '60px',
    background: 'rgb(255,255,255,.8)',
    backdropFilter: 'blur(5px)',
    borderBottom: "1px solid #EDEDED",
    height: '50px', // Added fixed height
    display: 'flex', // Added flex
    alignItems: 'center' // Added vertical alignment
  }}>
    <div style={{
      display: 'flex',
      gap: '24px',
      alignItems: 'center', // Added vertical alignment
      width: '100%' // Added full width
    }}>
      {/* Main content area */}
      <div style={{
        flexGrow: 1,
        width: '80%',
      }}>
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          height: '40px' // Added fixed height
        }}>
          {editingQuestions[questionId] ? (
            <TextareaAutosize
              style={{
                width: '100%',
                fontSize: '1rem',
                fontWeight: '500',
                fontFamily: "'Montserrat', sans-serif",
                borderRadius: '80px',
                color: 'grey',
                outline: 'none',
                resize: 'none',
                padding: '8px 20px'
              }}
              value={questionData?.question}
              onChange={(e) => setQuestionData(prev => ({ ...prev, question: e.target.value }))}
              onBlur={handleQuestionBlur}
              minRows={1}
            />
          ) : (
            <h1 style={{
              fontWeight: '500',   color: 'grey',
              fontSize: '1rem',
              margin: 0, // Removed margins
              fontFamily: "'Montserrat', sans-serif",
            }}>
              {questionData?.question}
            </h1>
          )}
        </div>
      </div>

      {/* Control buttons */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <button
          onClick={toggleRubricVisibility}
          style={{
            padding: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#9ca3af',
            display: 'flex',
            alignItems: 'center'
          }}
          aria-label={showRubric ? "Hide Rubric" : "Show Rubric"}
        >
          {showRubric ? (
            <ClipboardMinus size={20} strokeWidth={1}  />
          ) : (
            <ClipboardList size={20} strokeWidth={1}  />
          )}
        </button>
        <button
          onClick={() => handleEditQuestionToggle(questionId)}
          style={{
            padding: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#9ca3af',
            display: 'flex',
            alignItems: 'center'
          }}
          aria-label={editingQuestions[questionId] ? "Stop Editing" : "Edit Question"}
        >
          {editingQuestions[questionId] ? (
            <PencilOff size={20}  strokeWidth={1} />
          ) : (
            <Pencil size={20}  strokeWidth={1} />
          )}
        </button>
      </div>

      {/* Response count */}
      <div style={{
        fontWeight: '500',
        fontSize: '1rem',
        color: 'grey',
        width: '60px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <Users size={20} strokeWidth={1} /> {questionData?.totalResponses}
      </div>

      {/* Average score */}
      <div style={{
        height: '30px',
        borderRadius: '5px',
        padding: '0 10px',
        display: 'flex',
        alignItems: 'center',
        fontSize: '16px',
        fontWeight: '600',
        color: getGradeColors(questionData?.averageScore).color,
        background: getGradeColors(questionData?.averageScore).background
      }}>
        {questionData?.averageScore.toFixed(0)}%
      </div>

      {/* Expand/Collapse button */}
      <button onClick={handleExpandAll} style={{
        padding: '4px 12px',
        backgroundColor: 'white',
        border: '1px solid #ddd',
        color: 'grey',
        borderRadius: '100px',
        cursor: 'pointer',
        width: '160px',
        display: 'flex',
        fontWeight: '400',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        height: '32px', // Added fixed height
        fontFamily: "'montserrat', sans-serif",
      }}>
        {expandAll ? 'Collapse All' : 'Expand All'}
        {expandAll ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
      </button>
    </div>
  </div>
  </div>
        {/* Rubric Section - Conditionally Rendered */}
       
        

        {/* Responses Header with Expand All Button */}
 

<div style={{
            background: 'white', 
            marginLeft: 'calc(-200px + 2%)',
            paddingTop: '20px',
            marginTop: '-150px',
            width: '100%', 
          }}>
















        {/* Student List */}
        {students.map((student, index) => (
          <div key={student.id} style={{
            padding: '10px 2%',
            margin: '0% 2%',
          width: '100%',
            borderBottom: '1px solid lightgrey',
            marginBottom: '0px'
          }}>
            {/* Student Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              gap: '20px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                minWidth: '200px'
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
             
{!showResponseMap[student.id] && (
                    <div style={{
                      overflow: 'hidden',
                      padding: '5px 10px',
                      zIndex: '0',
                      maxWidth: '300px',
marginLeft: '0px',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      background: student.score === 2 ? '#CCFFC380' : student.score === 1 ? '#FFF5D280' : '#FFCDCD50',
                      color: student.score === 2 ? '#20BF00' : student.score === 1 ? '#E76F00' : '#FF0000',
                     borderRadius:'20px', 
                      fontSize: '14px'
                    }}>
                      {student.response || "No response provided"}
                    </div>
                  )}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                width: '300px',
                gap: '16px', 
              }}>


                {/* Score Controls */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
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

                {/* Score 2 Button */}
                {student.score === 2 ? (
                    <GlassContainer
                        variant="green"
                        size={0}
                        style={{
                            cursor: 'pointer',
                            zIndex: '1'
                        }}
                        contentStyle={{
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onClick={() => updateGrade(student.id, 2)}
                    >
                        <Check size={16} color="#16a34a" />
                    </GlassContainer>
                ) : (
                    <button
                        onClick={() => updateGrade(student.id, 2)}
                        style={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0.5
                        }}
                    >
                        <Check size={16} color="#9ca3af" />
                    </button>
                )}

                {/* Score 1 Button */}
                {student.score === 1 ? (
                    <GlassContainer
                        variant="yellow"
                        size={0}
                        style={{
                            cursor: 'pointer',
                            zIndex: '1'
                        }}
                        contentStyle={{
                            padding: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onClick={() => updateGrade(student.id, 1)}
                    >
                        <Slash strokeWidth={4} size={10} color="#FF8800" />
                    </GlassContainer>
                ) : (
                    <button
                        onClick={() => updateGrade(student.id, 1)}
                        style={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0.5
                        }}
                    >
                        <Slash strokeWidth={4} size={10} color="#9ca3af" />
                    </button>
                )}

                {/* Score 0 Button */}
                {student.score === 0 ? (
                    <GlassContainer
                        variant="red"
                        size={0}
                        style={{
                            cursor: 'pointer',
                            zIndex: '1'
                        }}
                        contentStyle={{
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onClick={() => updateGrade(student.id, 0)}
                    >
                        <X size={16} color="#dc2626" />
                    </GlassContainer>
                ) : (
                    <button
                        onClick={() => updateGrade(student.id, 0)}
                        style={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0.5
                        }}
                    >
                        <X size={16} color="#9ca3af" />
                    </button>
                )}

                {/* Flag Button */}
                {student.flagged ? (
                    <GlassContainer
                        variant="blue"
                        size={0}
                        style={{
                            cursor: 'pointer',
                            marginLeft: '10px',
                            zIndex: '1'
                        }}
                        contentStyle={{
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onClick={() => toggleFlag(student.id)}
                    >
                        <Flag size={14} color="#020CFF" />
                    </GlassContainer>
                ) : (
                    <button
                        onClick={() => toggleFlag(student.id)}
                        style={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            marginLeft: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0.5
                        }}
                    >
                        <Flag size={14} color="#9ca3af" />
                    </button>
                )}
                </div>

                {/* Overall Percentage */}
                <GlassContainer
                    variant={getGradeColors(student.percentageScore).variant}
                    size={0}
                    style={{
                        marginLeft: '10px',
                        zIndex: '1'
                    }}
                    contentStyle={{
                        padding: '2px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <span style={{
                        fontSize: '.8rem',
                        color: getGradeColors(student.percentageScore).color,
                        fontWeight: '500'
                    }}>
                        {student.percentageScore ? 
                            `${Math.round(student.percentageScore)}%` : 
                            (student.rawTotalScore !== undefined && student.rawMaxScore ? 
                                `${Math.round((student.rawTotalScore / student.rawMaxScore) * 100)}%` : 
                                'N/A'
                            )
                        }
                    </span>
                </GlassContainer>
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



                                   
    <div
                    style={{
                      alignItems: 'center',
                      marginBottom: '10px',
                      fontWeight: '500',  color: 'lightgrey',
                      marginTop: '0px' ,
                      marginLeft: '4%',
    textAlign: 'left',
    width: '96%',
                      display: 'flex',
                    }}
                  >
                    <MessageSquareMore size={18} style={{ marginRight: '10px' }} />
                    <div
                      style={{
                        margin: 0,
                        fontWeight: '500',
                        display: 'flex', fontSize: '14px',
                        alignItems: 'center',color: 'lightgrey',
                      }}
                    >
                      Feedback
                
                    </div>
                  </div>
                  <textarea
  style={{
    fontSize: '16px',
    color: 'grey',
    marginTop: '-20px' ,
    marginLeft: '4%',
    textAlign: 'left',
    width: '92%',
    border: 'none',
    resize: 'none',
    overflow: 'hidden',
    fontFamily: "'montserrat', sans-serif",
    
    background: 'transparent',
    lineHeight: '1.5',
    minHeight: '24px' // This sets exactly one line height (16px * 1.5)
  }}
  value={student.feedback || ''}
  onChange={(e) => handleFeedbackChange(student.id, e.target.value)}
/>
                

              
                                </div>


  
)}


       
        </div>
      ))}

        
      </div>
      </div>
  );
};

export default QuestionResults;
