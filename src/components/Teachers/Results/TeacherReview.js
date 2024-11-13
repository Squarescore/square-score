import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../Universal/firebase';
import { doc, collection, updateDoc, where, query, getDocs, getDoc } from 'firebase/firestore';
import Confetti from 'react-confetti';
import Navbar from '../../Universal/Navbar';
import { ClipboardList, MessageSquareMore, SquareCheck, SquareSlash, SquareX, User } from 'lucide-react';
import { transform } from 'framer-motion';
const AutoResizeTextarea = ({ value, onChange, placeholder }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      style={{
        width: '100%',
        border: 'none',
        fontSize: '14px',
        fontWeight: '600',
        resize: 'none',
        outline: 'none',
        color:'#848484',
        overflow: 'hidden',
        background: 'transparent',
        padding: '0',
        margin: '0',
        lineHeight: '1.5'
      }}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      rows={1}
    />
  );
};

const TeacherReview = () => {
  const [editingFeedback, setEditingFeedback] = useState(false);
  const { classId, assignmentId } = useParams();
  const [reviewCount, setReviewCount] = useState(0);
  const [students, setStudents] = useState([]);
  const [currentReview, setCurrentReview] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const navigate = useNavigate();
  const [assignmentName, setAssignmentName] = useState('');
  const chunkSize = 10;
  const [isFinished, setIsFinished] = useState(false);
  const [feedbackDebounceTimers, setFeedbackDebounceTimers] = useState({});

  const [showRubric, setShowRubric] = useState(false);

  useEffect(() => {
    let timeoutId;
    if (currentReview?.questions[currentIndex]?.feedback) {
      timeoutId = setTimeout(async () => {
        const reviewRef = doc(db, 'grades', `${assignmentId}_${currentReview.studentUid}`);
        await updateDoc(reviewRef, {
          questions: currentReview.questions
        });
      }, 500);
    }
    return () => clearTimeout(timeoutId);
  }, [currentReview?.questions[currentIndex]?.feedback]);
  const fetchReviewsNeedingAttention = async () => {
    const gradesCollection = collection(db, 'grades');
    const gradesQuery = query(gradesCollection, where('assignmentId', '==', assignmentId));
    const querySnapshot = await getDocs(gradesQuery);
    let reviews = [];
    querySnapshot.forEach((doc) => {
      const gradeData = doc.data();
      const needsReview = gradeData.questions.some(question => question.flagged);
      if (needsReview) {
        reviews.push({ id: doc.id, ...gradeData });
      }
    });

    if (reviews.length > 0) {
      setCurrentReview(reviews[0]);
      setCurrentIndex(0);
    } else {
      setCurrentReview(null);
    }
  };

  useEffect(() => {
    fetchReviewsNeedingAttention();
  }, [assignmentId]);

  useEffect(() => {
    const fetchAssignmentName = async () => {
      const assignmentRef = doc(db, 'assignments', assignmentId);
      const assignmentDoc = await getDoc(assignmentRef);
      if (assignmentDoc.exists()) {
        setAssignmentName(assignmentDoc.data().assignmentName);
      }
    };

    const fetchClassAndReviews = async () => {
      const classDocRef = doc(db, 'classes', classId);
      const classDoc = await getDoc(classDocRef);
      if (classDoc.exists()) {
        const classData = classDoc.data();
        if (classData && classData.participants) {
          const sortedStudents = classData.participants.sort((a, b) => a.name.split(' ').pop().localeCompare(b.name.split(' ').pop()));
          setStudents(sortedStudents);
        }
      }
    };

    fetchAssignmentName();
    fetchClassAndReviews();
  }, [classId, assignmentId]);

  useEffect(() => {
    const fetchReviewCount = async () => {
      const gradesCollection = collection(db, 'grades');
      let count = 0;

      for (let i = 0; i < students.length; i += chunkSize) {
        const studentChunk = students.slice(i, i + chunkSize).map(student => student.uid);
        const gradesQuery = await getDocs(query(gradesCollection, where('studentUid', 'in', studentChunk), where('assignmentId', '==', assignmentId)));

        gradesQuery.forEach((doc) => {
          const gradeData = doc.data();
          count += gradeData.questions.filter(question => question.flagged).length;
        });
      }

      setReviewCount(prevCount => {
        console.log("New Review count:", count);
        return count;
      });
    };

    if (students.length > 0) {
      fetchReviewCount();
      const reviewCountInterval = setInterval(() => {
        fetchReviewCount();
      }, 1000); // Poll every 1 second

      return () => {
        clearInterval(reviewCountInterval);
      };
    }
  }, [students]);

  const handleGradeChange = async (newGrade) => {
    if (currentReview && currentReview.questions && currentReview.questions[currentIndex]) {
      const updatedReview = { ...currentReview };
      updatedReview.questions[currentIndex].score = newGrade;
      updatedReview.questions[currentIndex].flagged = false;

      const totalScore = updatedReview.questions.reduce((accum, current) => accum + current.score, 0);
      const maxScore = updatedReview.questions.length * 2; // Assuming max score per question is 2
      updatedReview.totalScore = totalScore;
      updatedReview.maxScore = maxScore;
      updatedReview.percentageScore = (totalScore / maxScore) * 100;

      const reviewRef = doc(db, 'grades', `${assignmentId}_${currentReview.studentUid}`);
      await updateDoc(reviewRef, updatedReview);

      const nextStudentIndex = students.findIndex(student => student.uid === currentReview.studentUid) + 1;
      const needsReview = updatedReview.questions.some(question => question.flagged);
      if (!needsReview || currentIndex >= currentReview.questions.length - 1) {
        if (nextStudentIndex < students.length) {
          setCurrentReviewIndex(nextStudentIndex);
          fetchReviewsNeedingAttention();
        } else {
          setCurrentReviewIndex(0);
          fetchReviewsNeedingAttention();
        }
      } else {
        setCurrentIndex(currentIndex + 1);
        setCurrentReviewIndex(nextStudentIndex);
      }
    }
  };

  if (!currentReview) {
    return <div style={{}}>No responses are currently for review</div>;
  }

  const currentQuestion = currentReview.questions[currentIndex];

  const handleBack = () => {
    if (currentReviewIndex > 0) {
      setCurrentReviewIndex(currentReviewIndex - 1);
      fetchReviewsNeedingAttention();
    } else {
      navigate(-1);
    }
  };

  const handleFeedbackChange = (e) => {
    const feedback = e.target.value;
    setCurrentReview(prev => ({
      ...prev,
      questions: prev.questions.map((q, idx) => 
        idx === currentIndex ? { ...q, feedback } : q
      )
    }));
  };



    const buttonContainerStyle = {
      width: '400px',
      display: 'flex',
      position: 'fixed',
      bottom: '40px',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderRadius: '15px',
      height: '60px',
      
      padding: '10px 10px',
      background: 'white',
      left: 'calc(200px + 4%)',
      boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)',
      marginTop: '20px'
    };
  
    
  
  
    return (
      <div style={{
      
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white'
      }}>



       
      
        <div style={{
          width: 'calc(92% - 200px)',
         position: 'absolute',
         left: 'calc(200px + 4%) ',
          textAlign: 'left',
          backgroundColor: 'white',
          padding: '0px',
          borderRadius: '15px',
          marginTop: '0px',
        }}>
          <div style={{display:" flex"}}>
          <h2 style={{
            fontSize: '25px',
            fontWeight: '600',

          }}>
            {reviewCount} Flagged Responses  
          </h2>
          <button  style={{ background: 'white',  borderRadius:  '5px', cursor: 'pointer', marginTop:'20px', marginLeft: 'auto',

padding: '10px 20px',
          fontWeight: '600',
          fontSize: '16px',
          color: 'grey',
          lineHeight: '10px',
          height: '35px', border: '1px solid lightgrey',
fontFamily: "'montserrat', sans-serif",
        }}onClick={handleBack}>

          Previous Response
        </button>
        </div>
          <div style={{
            position: 'relative',
            width: '750px',
            marginBottom: '20px',
            backgroundColor: 'white',
            borderRadius: '15px',
            color: 'black',
          }}>
            <h1
  style={{fontSize: '14px',  marginTop: '50px', 
    color: 'lightgray',}}
  >{students.find(student => student.uid === currentReview.studentUid)?.name}</h1>
            <button 
              onClick={() => setShowRubric(!showRubric)}
              style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                color: 'grey',
                background: 'none',
                border: 'none',        
                cursor: 'pointer'
              }}
            >
              <ClipboardList/>
            </button>
  
         
  
            <p style={{
              width: '630px',
              marginTop: '15px',
              fontSize: '18px',
              fontFamily: "'montserrat', sans-serif",
              fontWeight: '600',
              textAlign: 'left',
            }}>
              {currentQuestion.question}
            </p>
  
            {showRubric && (
              <div style={{
                margin: '20px',
                padding: '15px',
                background: '#f4f4f4',
                borderRadius: '10px',
                color: 'grey',
                fontFamily: "'montserrat', sans-serif",
                fontSize: '14px'
              }}>
                {currentQuestion.rubric}
              </div>
            )}
          </div>
  
          <div style={{
      
            width: '700px',
            borderRadius: '15px',
            marginBottom: '10px',
          }}>
            {/* Student Response */}
          
              <div style={{ background: '#f4f4f4', padding: '10px', borderLeft: '4px solid #7B7B7B', color: '#7B7B7B'}}>
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  fontFamily: "'montserrat', sans-serif",
                  fontWeight: '500'
                }}>
                  {currentQuestion.studentResponse || "Not provided"}
                </p>
             
            </div>
  
            {/* Teacher Feedback */}
            <div style={{ display: 'flex', width: '100%', marginTop: '30px'}}>
        <div style={{
          border: '0px solid lightgrey',
          color: '#848484',
          width: '40px',
          borderRadius: '10px 0px 0px 10px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: '-4px',
          zIndex: '1'
        }}>
          <MessageSquareMore size={25} />
        </div>
        <div style={{
          flex: 1,
          marginLeft: '-4px',
          background: 'white',
          borderRadius: '0px 10px 10px 0px',
          padding: '10px 15px'
        }}>
          <AutoResizeTextarea
            value={currentQuestion.feedback}
            onChange={handleFeedbackChange}
            placeholder="Add feedback..."
          />
        </div>
        </div>
        </div>
  
        </div>

        
        <div style={buttonContainerStyle}>
            <button
              onClick={() => handleGradeChange(0)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#ffebeb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <SquareX size={40} color="#ef4444" />
            </button>
  
            <button
              onClick={() => handleGradeChange(1)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#fff7ed'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <SquareSlash size={40} color="#FFAE00" />
            </button>
  
            <button
              onClick={() => handleGradeChange(2)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f0fdf4'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <SquareCheck size={40} color="#2BB514" />
            </button>
          </div>

      </div>
    );
  };
export default TeacherReview;
