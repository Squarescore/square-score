import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from './firebase';
import { doc, collection, updateDoc, where, query, getDocs, getDoc } from 'firebase/firestore';

const TeacherReview = () => {
  const [editingFeedback, setEditingFeedback] = useState(false);
  const { classId, assignmentId } = useParams();
  const [reviewCount, setReviewCount] = useState(0);
  const [students, setStudents] = useState([]);
  const [currentReview, setCurrentReview] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0); // New state variable
  const navigate = useNavigate();
  const [assignmentName, setAssignmentName] = useState('');
const chunkSize= 10;
  const fetchReviewsNeedingAttention = async () => {
    const gradesCollection = collection(db, 'grades');
    const gradesQuery = query(gradesCollection, where('assignmentId', '==', assignmentId));
    const querySnapshot = await getDocs(gradesQuery);
    let reviews = [];
    querySnapshot.forEach((doc) => {
      const gradeData = doc.data();
      const needsReview = gradeData.gradedAnswers.some(answer => answer.review === true);
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
        setAssignmentName(assignmentDoc.data().name);
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
          count += gradeData.gradedAnswers.filter(answer => answer.review === true).length;
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
    if (currentReview && currentReview.gradedAnswers && currentReview.gradedAnswers[currentIndex]) {
      // Update the grade in Firestore for the particular question
      const updatedReview = { ...currentReview };
      updatedReview.gradedAnswers[currentIndex].grade = newGrade;
      updatedReview.gradedAnswers[currentIndex].review = false; // Set review to false
  
      // Recalculate the total grade for the student's test
      const totalGrade = updatedReview.gradedAnswers.reduce((accum, current) => accum + current.grade, 0);
      updatedReview.grade = totalGrade;
  
      const reviewRef = doc(db, 'grades', `${currentReview.studentUid}_${assignmentId}`);
      await updateDoc(reviewRef, updatedReview);
  
      // Check if there are more reviews for the current student or move to next student
      const nextStudentIndex = students.findIndex(student => student.uid === currentReview.studentUid) + 1;
      const needsReview = updatedReview.gradedAnswers.some(answer => answer.review === true);
      if (!needsReview || currentIndex >= currentReview.gradedAnswers.length - 1) {
        // No more questions to review for this student or all questions reviewed, move to the next student
        if (nextStudentIndex < students.length) {
          setCurrentReviewIndex(nextStudentIndex); // Update currentReviewIndex
          fetchReviewsNeedingAttention();
        } else {
          // Reached the end of students, go back to the first student
          setCurrentReviewIndex(0);
          fetchReviewsNeedingAttention();
        }} else {
        // Move to the next question for the same student
        setCurrentIndex(currentIndex + 1);
          setCurrentReviewIndex(nextStudentIndex);
      }
    }
  };
  if (!currentReview) {
    return <div>No reviews available.</div>;
  }

  const currentQuestion = currentReview.gradedAnswers[currentIndex];
  const handleBack = () => {
    if (currentReviewIndex > 0) {
      setCurrentReviewIndex(currentReviewIndex - 1); // Move to the previous review
      fetchReviewsNeedingAttention();
    } else {
      navigate(-1); // If at the first review, navigate back
    }
  };
  


  const handleFeedbackChange = (e) => {
    const feedback = e.target.value;
    
    setCurrentReview(prev => ({
      ...prev,
      gradedAnswers: [{
        ...prev.gradedAnswers[currentIndex],  
        explanation: feedback
      }]
    }))
  }
  const handleDoneEditing = () => {
    // Save to Firestore
    
    setEditingFeedback(false);
  }
  const handleSaveFeedback = () => {
    handleDoneEditing();
  }
  
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'white'}}>
      <header style={{     backgroundColor: 'white',

borderRadius: '10px',
color: 'white',
marginTop: '20px',
height: '14%',
display: 'flex',
marginBottom: '-46px',
alignItems: 'center',
justifyContent: 'center',
position: 'relative',
margin: '1% auto',
width: '70%'}}> <button 
      onClick={handleBack} 
      style={{ position: 'absolute',fontFamily: "'Radio Canada', sans-serif",left: '20px', textDecoration: 'none',  color: 'black', backgroundColor: 'white', border: 'none', cursor: 'pointer',  }}>
    <img src="https://static.thenounproject.com/png/1875804-200.png" style={{width: '30px', opacity: '50%'}}/>
    </button>
    
    <h1 style={{ fontWeight: 'normal',
    color: 'black', fontSize: '60px',   fontFamily: "'Radio Canada', sans-serif", }}>Results</h1>
  </header>


      <div style={{ padding: '10px', backgroundColor: 'transparent', textAlign: 'center', marginBottom: '20px', color: 'darkgrey' }}>
      {reviewCount} flagged Responses remain
    </div>
    <div style={{width: '60%', marginLeft: 'auto', marginRight: 'auto',
     textAlign: 'center', backgroundColor: 'white', padding: '20px', borderRadius: '20px', boxShadow: '10px 5px 20px 2px lightgrey'}}>
   
      <h2 style={{fontSize: '12px', color: 'grey'}}>Reviewing for {students.find(student => student.uid === currentReview.studentUid)?.name}</h2>
      <div>

      <h4 style={{marginTop: '20px', marginLeft: 'auto', marginRight: 'auto', marginBottom: '-30px', color: 'white', backgroundColor: 'grey',zIndex: '11', position:'relative', borderRadius: '5px', width: '120px', padding: '5px',}}>Question</h4>
        <div style={{marginLeft: 'auto', marginRight: 'auto', width: '65%',marginBottom: '4%',  backgroundColor: 'black', borderRadius: '5px', color: 'white'}}>
        
        <p style={{width: '90%', marginLeft: 'auto', marginRight: 'auto', padding: '20px'}}>{currentQuestion.question}</p>
        </div>

        <h5  style={{marginTop: '20px', marginLeft: 'auto', marginRight: 'auto', marginBottom: '-17px', color: 'black', backgroundColor: 'white',zIndex: '11', position:'relative', borderRadius: '5px', width: '120px', padding: '5px'}}>Student Answer</h5>
        <div style={{marginLeft: 'auto', marginRight: 'auto', width: '85%', marginBottom: '4%',  backgroundColor: 'white', borderRadius: '5px', border: '4px solid black'}}>
        
        <p style={{width: '90%', marginLeft: 'auto', marginRight: 'auto', padding: '20px'}}> {currentQuestion.response || "Not provided"
}</p>
        <p style={{color: 'lightgrey'}}>Current Grade: {currentQuestion.grade}</p>
        </div>





        <h5  style={{marginTop: '20px', 
        marginLeft: 'auto', marginRight: 'auto',
         marginBottom: '-17px', color: 'black', 
         backgroundColor: 'white',
         
         zIndex: '11', position:'relative',
         borderRadius: '5px', width: '120px', padding: '5px'}}>

          Feedback</h5>
        <div  onClick={() => setEditingFeedback(true)} style={{marginLeft: 'auto', 
        marginRight: 'auto', width: '85%',
         marginBottom: '',
           backgroundColor: 'white', 
           borderRadius: '5px',
            border: '4px dotted lightgrey'}}>
        
    
{editingFeedback ? (
  <textarea style={{width: '90%', marginLeft: 'auto', marginRight: 'auto', padding: '20px', fontSize: '14px',textAlign: 'center',borderColor: 'transparent'}}
    value={currentQuestion.explanation}
    onChange={handleFeedbackChange} 
  />  
) : (
  <p style={{width: '90%', marginLeft: 'auto', marginRight: 'auto', padding: '20px', fontSize: '14px'}}>{currentQuestion.explanation}</p>
)}

        </div>
        {editingFeedback && (

<button onClick={handleSaveFeedback} style={{ position: 'relative', width: '100%', backgroundColor: 'transparent', borderColor: 'transparent', fontSize: '20px',
marginTop: '20px', cursor: 'pointer'}}>Save</button>

)}
        <button style={{width: '20%', fontSize: '30px',
         boxShadow: '10px 5px 20px 2px lightgrey',
          borderColor: 'transparent', 
           borderRadius: '20px',transition: '.5s',
           borderWidth: '4px',
           height:'40px',
           color: 'darkred', 
           borderStyle: 'solid',
        
           marginTop: '4%',
           backgroundColor: 'lightcoral', 
           marginRight: '-40px'}}onClick={() => handleGradeChange(0)}
           onMouseEnter={(e) => {
            e.target.style.borderColor = 'darkred';
            e.target.style.widthColor = '4px';
        }}
        onMouseLeave={(e) => {
            e.target.style.borderColor = 'transparent';
            e.target.style.widthColor = '4px';
           
        }}
           >0</button>


        <button style={{width: '10%',
        fontFamily: "'Roboto Mono', sans-serif" ,
        fontSize: '30px', boxShadow: '2px 2px 10px 1px rgba(0, 0, 0, 0.2)',
         borderColor: 'transparent',  height:'60px',color: 'goldenrod',
         transition: '.5s',
           borderWidth: '4px',
         borderStyle: 'solid',
          backgroundColor: 'khaki',borderRadius: '40px', marginRight: '-40px', transition: '1s',
           zIndex: '10', position:'relative'}}onClick={() => handleGradeChange(1)}
           onMouseEnter={(e) => {
            e.target.style.borderColor = 'goldenrod';
            e.target.style.widthColor = '4px';
        }}
        onMouseLeave={(e) => {
            e.target.style.borderColor = 'transparent';
            e.target.style.widthColor = '4px';
           
        }}
           
           
           >1</button>


        <button style={{width: '20%',fontSize: '30px', boxShadow: '10px 5px 20px 2px lightgrey', 
        borderColor: 'transparent',
        transition: '.5s',
           borderWidth: '4px',
        borderStyle: 'solid',  borderRadius: '20px',height:'40px', 
         color: 'darkgreen', backgroundColor: 'lightgreen', }} onClick={() => handleGradeChange(2)}
         onMouseEnter={(e) => {
          e.target.style.borderColor = 'darkgreen';
          e.target.style.widthColor = '4px';
      }}
      onMouseLeave={(e) => {
          e.target.style.borderColor = 'transparent';
          e.target.style.widthColor = '4px';
         
      }}
         
         >2</button>
      </div>
    </div>
    </div>
  );
};

export default TeacherReview;
