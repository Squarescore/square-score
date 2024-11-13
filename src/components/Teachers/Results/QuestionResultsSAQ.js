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
          questions: updatedQuestions
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

        // Update the document
        return updateDoc(doc(db, 'grades', gradeDoc.id), {
          questions: updatedQuestions
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
  }, [assignmentId, questionId, classId]);


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
  
      // Update the entire document
      await updateDoc(gradeRef, {
        questions: updatedQuestions,
        rawTotalScore: newRawTotal,
        percentageScore: newPercentage
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
  
      // Update the entire document
      await updateDoc(gradeRef, {
        questions: updatedQuestions
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
       width: '100%',
        border: '1px solid green'
      }}>

        {/* Assignment and Question Details */}
        <div style={{ display: 'flex' }}>
          {/* Assignment Header */}
          <div style={{
            backgroundColor: 'blue',
            position: 'fixed',top: '10px',
            borderRadius: '15px',
            width: '100%',
            boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)',
            padding: '24px',
            marginBottom: '24px'
          }}>
       
            <div style={{ display: 'flex',  height: '145px', alignItems: 'center' }}>
          


              {/* Question Title */}
              {editingQuestions[questionId] ? (
    <TextareaAutosize
      style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
        width: '650px', 
        maxRows: 8,
        position: 'absolute', 
        top: '60px',
        marginBottom: '0px',
        borderRadius: '5px',
        padding: '10px',
        resize: 'none',
      }}
      value={questionData?.question}
      onChange={(e) => setQuestionData(prev => ({ ...prev, question: e.target.value }))}
      onBlur={handleQuestionBlur}
    />
  ) : (
    <h1 style={{
      fontSize: '1.5rem',
      fontWeight: 'bold',
      width: '650px',
      marginTop: '20px',
      marginBottom: '0px',
      fontFamily: "'montserrat', sans-serif"
    }}>
      {questionData?.question}
    </h1>
  )}



              <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', height: '60px', marginTop: '20px' }}>
                {/* Rubric Toggle Button */}
                <button
  onClick={toggleRubricVisibility}
  style={{
    fontSize: '24px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#9ca3af'
  }}

>
  {showRubric ? <ClipboardMinus size={24} /> : <ClipboardList size={24} />}
</button>
                {/* Edit Button */}
              {/* Edit Button */}
<button
  onClick={() => handleEditQuestionToggle(questionId)}
  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
  aria-label={editingQuestions[questionId] ? "Stop Editing" : "Edit Question"}
>
  {editingQuestions[questionId] ? <PencilOff size={24} /> : <Pencil size={24} />}
</button>

              </div>
            </div>

            <div style={{
              fontSize: '45px',
              fontWeight: 'bold',
              width: '150px',
              fontFamily: "'montserrat', sans-serif",
              height: '150px',
              position: 'absolute',
              background: 'transparent',
              borderRadius: '10px',
              top: '20px',
              left: '20px',
              textAlign: 'center',
              lineHeight: '150px'
            }}> 
              {questionData?.averageScore.toFixed(0)}
            </div>

          </div>

      
        </div>

        {/* Rubric Section - Conditionally Rendered */}
        {showRubric && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '15px',
            width: '950px',
            paddingLeft: '60px',
            boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)',
            padding: '10px 10px',
            position: 'relative',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <div style={{
              margin: '-10px 10px -10px -10px',
              width: '100px',
              height: '90px',
              borderRadius: '15px 0px 0px 15px',
              border: '4px solid lightgrey',
              background: '#f4f4f4',
              color: 'grey',
              position: 'relative'
            }}>
              <ClipboardList style={{
                position: 'absolute',
                height: '30px',
                width: '30px',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}/>
            </div>

              {/* Rubric Content */}
              {showRubric && editingQuestions[questionId] ? (
    <TextareaAutosize
      style={{width: '140%', fontSize: '16px'}}
      value={questionData?.rubric}
      onChange={(e) => setQuestionData(prev => ({ ...prev, rubric: e.target.value }))}
      onBlur={handleRubricBlur}
    />
  ) : (
    <p style={{}}>
      {questionData?.rubric}
    </p>
  )}
  </div>
)}
        

        {/* Responses Header with Expand All Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{fontWeight: '600', fontSize: '25px', marginBottom: '-15px', marginLeft: '15px'}}>
            {questionData?.totalResponses} Responses
          </div>
          <button onClick={handleExpandAll} style={{
            padding: '8px 12px',
            backgroundColor: 'white',
            marginBottom: '-5px', 
            boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)',
            color: 'grey', 
            border: 'none',
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
            boxShadow: '1px 1px 5px 1px rgb(0,0,155,.10)',
            borderRadius: '20px', 
            background: 'white'}}>
















        {/* Student List */}
        {students.map((student, index) => (
          <div key={student.id} style={{
            padding: '25px',
            marginBottom: '-40px'
          }}>
            {/* Student Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{
                display: 'flex',
              
                alignItems: 'center',
                gap: '16px'
              }}>
                {/* Score Icon */}
                <div style={{ width: '24px', height: '24px', marginLeft: '10px', marginTop: '-5px' }}>
                  {student.score === 2 && <SquareCheck color="#22c55e" size={30} />}
                  {student.score === 1 && <SquareSlash color="#FFD13B" size={30}  />}
                  {student.score === 0 && <SquareX color="#ef4444"  size={30}  />}
                </div>
                <h3 
                         onClick={() => handleStudentClick(student.studentUid)}
                style={{
                  fontWeight: '600',
                  cursor: 'pointer',
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
                marginRight: '15px',
                alignItems: 'center',
                gap: '16px'
              }}>
                {/* Score Controls */}
                <div style={{
                  display: 'flex',
                  gap: '8px'
                }}>
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


                      padding: '8px 8px',
                      borderRadius: '5px',
                      
                      border: '2px solid ',
                      cursor: 'pointer',
                      backgroundColor: student.score === 2 ? '#dcfce7' : 'transparent',
                      color: student.score === 2 ? '#16a34a' : '#9ca3af',
                      
                      borderColor: student.score === 2 ? '#16a34a' : 'transparent'


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

                      padding: '8px 8px',
                      borderRadius: '5px',
                      border: '2px solid ',
                      cursor: 'pointer',
                            borderColor: student.score === 1 ? '#FFD13B' : 'transparent',
                      backgroundColor: student.score === 1 ? '#FFF7DB' : 'transparent',
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

                      padding: '8px 8px',
                      borderRadius: '5px',

                      border: '2px solid ',
                      cursor: 'pointer',

                      borderColor: student.score === 0 ? '#dc2626' : 'transparent',
                      backgroundColor: student.score === 0 ? '#fee2e2' : 'transparent',
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
                    border: '2px solid ',
                    background: student.flagged ? '#DEE3FF' : 'white',
                    color: student.flagged ? '#020CFF' : '#9ca3af',
                    borderColor: student.flagged ? '#020CFF' : 'white'
                  }}
                >
                  <Flag size={20} />
                </button>

                {/* Chevron Toggle Button */}
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
              marginTop: '0px',
              padding: '16px',
              width: '890px',
              borderRadius: '8px',
              display: 'flex',
              gap: '16px'
            }}>
              {/* Student Response - Dynamic width based on content length */}
              <div style={{ 
                display: 'flex', 
                border: '4px solid #f4f4f4', 
                borderRadius: '15px', 
                width: student.response && student.response.length < 100 ? '30%' : '43%',
                marginLeft: '30px',
                transition: 'width 0.3s ease' // Smooth transition for width changes
              }}>
                <div style={{
                  margin: '-4px 20px -4px -40px',
                  width: '60px',
                  height: '100px',
                  borderRadius: '15px 0px 0px 15px',
                  border: '4px solid lightgrey',
                  background: '#f4f4f4',
                  color: 'grey',
                  position: 'relative'
                }}>
                  <User style={{
                    position: 'absolute',
                    height: '30px',
                    width: '30px',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}/>
                </div>
               
                <p style={{
                  marginBottom: '16px',
                  color: '#374151',
                  flex: '1'
                }}>
                  {student.response || "No response provided"}
                </p>
              </div>

              {/* Student Feedback - Dynamic width based on response length */}
              <div style={{ 
                display: 'flex', 
                border: '4px solid #f4f4f4', 
                borderRadius: '15px', 
                width: student.response && student.response.length < 100 ? '58%' : '45%',
                marginLeft: 'auto',
                transition: 'width 0.3s ease' // Smooth transition for width changes
              }}>
                <div style={{
                  margin: '-4px 20px -4px -40px',
                  width: '60px',
                  borderRadius: '15px 0px 0px 15px',
                  border: '4px solid lightgrey',
                  background: '#f4f4f4',
                  color: 'grey',
                  position: 'relative'
                }}>
                  <MessageSquareMore style={{
                    position: 'absolute',
                    height: '30px',
                    width: '30px',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}/>
                </div>
               
                <textarea
                  value={student.feedback || ''}
                  onChange={(e) => handleFeedbackChange(student.id, e.target.value)}
                  style={{
                    width: '100%',
                    border: 'none',
                    padding: '16px',
                    marginBottom: '16px',
                    color: '#374151',
                    flex: '1',
                    resize: 'none',
                    fontSize: '14px',
                    background: 'transparent'
                  }}
                  placeholder="Add feedback..."
                />
              </div>
            </div>
          )}


           {index !== students.length - 1 && (
      <div style={{
        width: '900px', 
        height: '2px',
        background: '#f4f4f4',
        marginLeft: 'auto', 
        marginRight: 'auto', 
        marginTop: '10px'
      }}></div>
    )}
        </div>
      ))}

        
      </div>
      </div>
    </div>
  );
};

export default QuestionResults;
