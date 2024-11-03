import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../Universal/firebase';
import { doc, collection, updateDoc, where, query, getDocs, getDoc } from 'firebase/firestore';
import Confetti from 'react-confetti';
import Navbar from '../../Universal/Navbar';
import { ClipboardList, MessageSquareMore, SquareCheck, SquareSlash, SquareX, User } from 'lucide-react';
import { transform } from 'framer-motion';

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
        const reviewRef = doc(db, 'grades(saq)', `${assignmentId}_${currentReview.studentUid}`);
        await updateDoc(reviewRef, {
          questions: currentReview.questions
        });
      }, 500);
    }
    return () => clearTimeout(timeoutId);
  }, [currentReview?.questions[currentIndex]?.feedback]);
  const fetchReviewsNeedingAttention = async () => {
    const gradesCollection = collection(db, 'grades(saq)');
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
      const assignmentRef = doc(db, 'assignments(saq)', assignmentId);
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
      const gradesCollection = collection(db, 'grades(saq)');
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

      const reviewRef = doc(db, 'grades(saq)', `${assignmentId}_${currentReview.studentUid}`);
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
    return <div style={{}}>Finished</div>;
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
      left: '50%',
      transform: 'translateX(-50%)',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderRadius: '15px',
      height: '60px',
      
      padding: '10px 10px',
      background: 'white',
      marginLeft: 'auto',
      marginRight: 'auto',
      boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)',
      marginTop: '20px'
    };
  
    const iconContainerStyle = {
      border: '4px solid lightgrey',
      background: '#f4f4f4',
      color: 'grey',
      width: '40px',
      borderRadius: '10px 0px 0px 10px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: '-4px',
      zIndex: '1'
    };
  
    const contentContainerStyle = {
      flex: 1,
      marginLeft: '-4px',
      background: 'white',
      borderRadius: '0px 10px 10px 0px',
      border: '4px solid #f4f4f4',
      padding: '10px 15px'
    };
  
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white'
      }}>



        <button  style={{position: 'fixed', left: '20px', top: "100px", background: 'white', border: '0px',  borderRadius:  '10px', cursor: 'pointer',
fontSize: '20px',
padding: '10px 20px',
          fontWeight: '600',
fontFamily: "'montserrat', sans-serif",
boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)',
        }}onClick={handleBack}>

          Previous Response
        </button>
        <Navbar userType="teacher" />
      
        <div style={{
          width: '800px',
         position: 'absolute',
         left: '50%',
         top: '30%',
         transform: 'translate(-50%,-30%)',
          textAlign: 'left',
          backgroundColor: 'white',
          padding: '0px',
          borderRadius: '15px',
          marginTop: '100px',
        }}>
          <h2 style={{
            fontSize: '12px',
            fontWeight: '600',
            color: 'lightgray',
            marginLeft: '40px',
          }}>
            {reviewCount} flagged Responses remain, Reviewing for {students.find(student => student.uid === currentReview.studentUid)?.name}
          </h2>
  
          <div style={{
            marginLeft: 'auto',
            marginRight: 'auto',
            position: 'relative',
            width: '700px',
            marginBottom: '20px',
            backgroundColor: 'white',
            borderRadius: '15px',
            color: 'black',
            border: '10px solid white',
            boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)',
          }}>
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
  
            <h4 style={{
              margin: '-12px',
              color: 'grey',
              marginBottom: '-35px',
              zIndex: '11',
              position: 'relative',
              borderRadius: '15px 15px 0px 0px',
              backgroundColor: '#f4f4f4',
              border: '4px solid lightgrey',
              width: '675px',
              padding: '5px 20px',
              fontFamily: "'montserrat', sans-serif",
              fontWeight: '600',
              fontSize: '20px'
            }}>
              {assignmentName}
            </h4>
  
            <p style={{
              width: '630px',
              marginLeft: '20px',
              padding: '10px',
              marginTop: '50px',
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
            boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)',
            width: '720px',
            borderRadius: '15px',
            padding: '30px 0px 30px 0px ',
            marginLeft: 'auto',
            marginRight: 'auto',
            marginBottom: '10px',
          }}>
            {/* Student Response */}
            <div style={{ display: 'flex', width: '90%', marginBottom: '10px', marginLeft: 'auto', marginRight: 'auto', }}>
              <div style={iconContainerStyle}>
                <User size={25} />
              </div>
              <div style={contentContainerStyle}>
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  fontFamily: "'montserrat', sans-serif",
                  fontWeight: '600'
                }}>
                  {currentQuestion.studentResponse || "Not provided"}
                </p>
              </div>
            </div>
  
            {/* Teacher Feedback */}
            <div style={{ display: 'flex', width: '90%', marginLeft: 'auto', marginRight: 'auto', }}>
              <div style={iconContainerStyle}>
                <MessageSquareMore size={25} />
              </div>
              <div style={contentContainerStyle}>
                <textarea
                  style={{
                    width: '100%',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '600',
                    resize: 'none',
                    outline: 'none',
                    minHeight: '60px',
                    background: 'transparent'
                  }}
                  value={currentQuestion.feedback || ''}
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
