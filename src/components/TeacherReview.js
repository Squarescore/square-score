import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from './firebase';
import { doc, collection, updateDoc, where, query, getDocs, getDoc } from 'firebase/firestore';
import Confetti from 'react-confetti';
import Navbar from './Navbar';
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

  const handleSaveFeedback = async () => {
    const reviewRef = doc(db, 'grades(saq)', `${assignmentId}_${currentReview.studentUid}`);
    await updateDoc(reviewRef, {
      questions: currentReview.questions
    });
    setEditingFeedback(false);
  };
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'white'}}>
       <Navbar userType="teacher" />
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
width: '70%'}}> 
    
    <h1 style={{ 
    color: 'black', fontSize: '60px', marginTop: '100px',  fontFamily: "'Rajdhani', sans-serif",fontWeight: 'bold' }}>{assignmentName}</h1>
  </header>


     
    <div style={{width: '60%', marginLeft: 'auto', marginRight: 'auto',
     textAlign: 'center', backgroundColor: 'white', padding: '0px', borderRadius: '20px', }}>
   
   <h2 style={{fontSize: '12px', color: 'grey'}}>{reviewCount} flagged Responses remain, Reviewing for {students.find(student => student.uid === currentReview.studentUid)?.name}</h2>
       <div>

       <h4 style={{marginTop: '20px', color:'grey',marginLeft: '80px', marginRight: 'auto', marginBottom: '-35px',zIndex: '11', position:'relative', borderRadius: '20px',  backgroundColor: '#f4f4f4', border: '10px solid white', width: '170px', padding: '0px', fontFamily: "'Radio Canada', sans-serif",fontWeight: 'bold', fontSize: '30px'}}>Question</h4>
          <div style={{marginLeft: 'auto', marginRight: 'auto', width: '85%',marginBottom: '10px',  backgroundColor: 'white', borderRadius: '30px', color: 'black', border: '10px solid #f4f4f4'}}>
            <p style={{width: '90%', marginLeft: 'auto', marginRight: 'auto', padding: '10px', fontSize: '24px',
         fontFamily: "'Radio Canada', sans-serif",fontWeight: 'bold', textAlign: 'left',}}>{currentQuestion.question}</p>
           <p style={{width: '90%', marginLeft: 'auto', marginRight: 'auto', padding: '10px', fontSize: '16px', textAlign: 'left', fontStyle: 'italic', color: 'grey', marginTop: '-30px' ,
         fontFamily: "'Radio Canada', sans-serif",fontWeight: 'bold', }}>{currentQuestion.expectedResponse}</p>
          </div>

          <h5 style={{marginTop: '20px', marginLeft: '80px', marginRight: 'auto', marginBottom: '-30px', color: '#020CFF', backgroundColor: '#99B6FF', border: '10px solid white',zIndex: '11', position:'relative', borderRadius: '20px', width: '200px', padding: '5px', fontSize: '22px',
         fontFamily: "'Radio Canada', sans-serif",fontWeight: 'bold', }}>Student Answer</h5>
          <div style={{marginLeft: 'auto', marginRight: 'auto',position: 'relative', width: '85%', marginBottom: '4%',  backgroundColor: 'white', borderRadius: '20px', border: '10px solid #99B6FF'}}>
            <p style={{width: '90%', marginLeft: 'auto', marginRight: 'auto', padding: '10px', fontSize: '20px', textAlign: 'left',
         fontFamily: "'Radio Canada', sans-serif",fontWeight: 'bold', }}>{currentQuestion.studentResponse || "Not provided"}</p>
            <p style={{color: 'grey', position: 'absolute', padding: '10px', width: '150px', borderRadius: '10px', fontWeight: 'bold', right: '5px', bottom: '-80px', }}> Current Points: {currentQuestion.score}</p>
          </div>





        <h5  style={{marginTop: '20px', 
        marginLeft: '100px', marginRight: 'auto',
         marginBottom: '-17px', color: 'black', 
         backgroundColor: 'white',
         fontSize: '20px',
         fontFamily: "'Radio Canada', sans-serif",fontWeight: 'bold', 
         zIndex: '11', position:'relative',
         borderRadius: '5px', width: '120px', padding: '5px'}}>

          Feedback</h5>
        <div  onClick={() => setEditingFeedback(true)} style={{marginLeft: 'auto', 
        marginRight: 'auto', width: '85%',
        textAlign: 'left',
           backgroundColor: 'white', 
           borderRadius: '5px',
            border: '4px dotted lightgrey'}}>
        
    
{editingFeedback ? (
  <textarea style={{width: '90%', marginLeft: 'auto', marginRight: 'auto', padding: '10px', fontSize: '14px',textAlign: 'center',borderColor: 'transparent'}}
  value={currentQuestion.feedback}
    onChange={handleFeedbackChange} 
  />  
) : (
  <p style={{width: '90%', marginLeft: 'auto',fontFamily: "'Radio Canada', sans-serif",fontWeight: 'bold',  marginRight: 'auto', padding: '10px', fontSize: '14px'}}>{currentQuestion.feedback}</p>
)}

        </div>
        {editingFeedback && (

<button onClick={handleSaveFeedback} style={{ position: 'relative', width: '100%', backgroundColor: 'transparent', borderColor: 'transparent', fontSize: '20px',
marginTop: '20px', cursor: 'pointer'}}>Save</button>

)}
        <button style={{width: '20%', fontSize: '30px',
          borderColor: 'transparent', 
           borderRadius: '20px',transition: '.5s',
           borderWidth: '4px',
           height:'40px',
           fontWeight: 'bold',
           fontFamily: "'Radio Canada', sans-serif" ,
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
        fontFamily: "'Radio Canada', sans-serif" ,
        fontWeight: 'bold',
        fontSize: '30px', 
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


        <button style={{width: '20%',fontSize: '30px',
        borderColor: 'transparent',
        transition: '.5s',
        fontWeight: 'bold',
        fontFamily: "'Radio Canada', sans-serif" ,
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
