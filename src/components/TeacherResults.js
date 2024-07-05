import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, collection, updateDoc, where, query, getDocs, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { arrayUnion, arrayRemove, deleteDoc, getDoc } from 'firebase/firestore';
import Navbar from './Navbar';

const TeacherResults = () => {
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState({});
  const [resetStudent, setResetStudent] = useState(null);
  const [resetStatus, setResetStatus] = useState({}); // State to manage reset statuses for each student
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const { classId, assignmentId } = useParams();
  const navigate = useNavigate();
  const [reviewCount, setReviewCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [assignmentName, setAssignmentName] = useState('');
  const chunkSize = 10; // Limit to 10 based on Firebase's 'in' query limit
  const [allViewable, setAllViewable] = useState(false); // New state for the global viewable switch
  const [hoveredStudent, setHoveredStudent] = useState(null);

  const openResetModal = (student) => {
    setResetStudent(student);
  }

  const closeResetModal = () => {
    setResetStudent(null);
  }

  const toggleAllViewable = async () => {
    const newViewableStatus = !allViewable;
    setAllViewable(newViewableStatus);
  
    const batch = writeBatch(db);
  
    for (const student of students) {
      const gradeRef = doc(db, 'grades(saq)', `${assignmentId}_${student.uid}`);
      
      // First, check if the document exists
      const gradeDoc = await getDoc(gradeRef);
      
      if (gradeDoc.exists()) {
        const gradeData = gradeDoc.data();
        
        // Update the viewable status
        const updatedData = {
          viewable: newViewableStatus,
        };
  
        // If questions exist, update their flagged status
        if (gradeData.questions && Array.isArray(gradeData.questions)) {
          updatedData.questions = gradeData.questions.map(question => ({
            ...question,
            flagged: question.flagged || false, // Set to false if not already set
          }));
        }
  
        batch.update(gradeRef, updatedData);
  
        // Update local state
        setGrades(prevGrades => ({
          ...prevGrades,
          [student.uid]: {
            ...prevGrades[student.uid],
            viewable: newViewableStatus,
            questions: updatedData.questions || [],
          }
        }));
      }
      // If the document doesn't exist, we don't create a new one
    }
  
    try {
      await batch.commit();
      console.log("Successfully updated viewable status for existing documents");
    } catch (error) {
      console.error("Error updating viewable status:", error);
      // Optionally, revert the local state change here
    }
  };
  useEffect(() => {
    const fetchAssignmentName = async () => {
      try {
        const assignmentRef = doc(db, 'assignments(saq)', assignmentId);
        const assignmentDoc = await getDoc(assignmentRef);
        if (assignmentDoc.exists()) {
          setAssignmentName(assignmentDoc.data().assignmentName);
        } else {
          console.error("Assignment not found");
        }
      } catch (error) {
        console.error("Error fetching assignment name:", error);
      }
    };

    fetchAssignmentName();
  }, [assignmentId]);

  useEffect(() => {
    const fetchClassAndGrades = async () => {
      setLoading(true);
      try {
        const classDocRef = doc(db, 'classes', classId);
        const classDoc = await getDoc(classDocRef);
        const classData = classDoc.data();
      
        if (classData && classData.participants) {
          const sortedStudents = classData.participants.map(student => {
            const [firstName, lastName] = student.name.split(' ');
            return { ...student, firstName, lastName };
          }).sort((a, b) => a.lastName.localeCompare(b.lastName));
      
          setStudents(sortedStudents);
      
          const gradesCollection = collection(db, 'grades(saq)');
          const gradesQuery = query(gradesCollection, where('assignmentId', '==', assignmentId));
          const gradesSnapshot = await getDocs(gradesQuery);
          const fetchedGrades = {};
          let totalScore = 0;
          let totalGradesCount = 0;
      
          gradesSnapshot.forEach((doc) => {
            const gradeData = doc.data();
            fetchedGrades[gradeData.studentUid] = {
              totalScore: gradeData.totalScore,
              maxScore: gradeData.maxScore,
              percentageScore: gradeData.percentageScore,
              viewable: gradeData.viewable || false,
              questions: gradeData.questions ? gradeData.questions.map(q => ({
                ...q,
                flagged: q.flagged || false,
              })) : [],
            };
      
            if (gradeData.percentageScore !== undefined) {
              totalScore += gradeData.percentageScore;
              totalGradesCount++;
            }
          });
      
          setGrades(fetchedGrades);
      
          const classAverage = totalGradesCount > 0 ? (totalScore / totalGradesCount).toFixed(2) : 'N/A';
          const assignmentRef = doc(db, 'assignments(saq)', assignmentId);
          await updateDoc(assignmentRef, { classAverage: parseFloat(classAverage) });
        }
      } catch (error) {
        console.error("Error fetching class and grades:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClassAndGrades();
    const classAndGradesInterval = setInterval(fetchClassAndGrades, 10000);

    return () => clearInterval(classAndGradesInterval);
  }, [classId, assignmentId]);
  const handleReset = async (studentUid) => {
    setResetStatus(prev => ({ ...prev, [studentUid]: 'resetting' }));

    // Remove test from testsTaken array
    const studentRef = doc(db, 'students', studentUid);
    await updateDoc(studentRef, {
      testsTaken: arrayRemove(assignmentId)
    });

    // Delete existing grade doc
    const gradeRef = doc(db, 'grades', `${studentUid}_${assignmentId}`);
    await deleteDoc(gradeRef);

    // Re-add assignment to take 
    await updateDoc(studentRef, {
      assignmentsToTake: arrayUnion(assignmentId)
    });
    try {
      // Simulate resetting logic
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate a network request

      setResetStatus(prev => ({ ...prev, [studentUid]: 'success' }));
      setTimeout(() => setResetStatus(prev => ({ ...prev, [studentUid]: '' })), 1000); // Reset the status after 1 second
    } catch (error) {
      console.error("Failed to reset:", error);
      setResetStatus(prev => ({ ...prev, [studentUid]: 'failed' }));
    }
  };

  const fetchQuestions = async () => {
    try {
      const assignmentRef = doc(db, 'assignments(saq)', assignmentId);
      const assignmentDoc = await getDoc(assignmentRef);
  
      if (assignmentDoc.exists()) {
        const assignmentData = assignmentDoc.data();
        const allQuestions = Object.entries(assignmentData.questions || {}).map(([id, data]) => ({
          questionId: id,
          text: data.question,
          expectedResponse: data.expectedResponse
        }));
        setQuestions(allQuestions);
        setIsModalOpen(true);
      } else {
        console.error("Assignment not found");
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
    }
  };
<style>
  {`
    .student-item {
      transition: border-color 0.3s;
    }
    .student-item:hover {
      border-color: #54AAA4 !important;
    }
  `}
</style>
  // Modal component to display questions
  const QuestionsModal = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [questionsPerPage] = useState(5);
  
    const indexOfLastQuestion = currentPage * questionsPerPage;
    const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
    const currentQuestions = questions.slice(indexOfFirstQuestion, indexOfLastQuestion);
  
    const totalPages = Math.ceil(questions.length / questionsPerPage);
  
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          width: '800px',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            padding: '20px',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <h2 style={{ margin: 0, fontFamily: "'Radio Canada', sans-serif" }}>Questions</h2>
            <button
              onClick={() => setIsModalOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '24px',
                color: '#ff0000',
              }}
            >
              <img src='/redcirclex.png' alt="Close" style={{ width: '30px', height: '30px',  }} />
            </button>
          </div>
          <div style={{ overflowY: 'auto', padding: '20px' }}>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {currentQuestions.map((question, index) => (
                <li
                  key={question.questionId}
                  style={{
                    marginBottom: '20px',
                    padding: '15px',
                    backgroundColor: '#f8f8f8',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <h3 style={{ marginBottom: '10px', color: '#333', fontFamily: "'Radio Canada', sans-serif" }}>
                    Question {indexOfFirstQuestion + index + 1}:
                  </h3>
                  <p style={{ marginBottom: '15px', fontSize: '16px', color: '#444' }}>{question.text}</p>
                  <h4 style={{ marginBottom: '5px', color: '#666', fontFamily: "'Radio Canada', sans-serif" }}>
                    Expected Response:
                  </h4>
                  <p style={{ fontSize: '14px', color: '#555', fontStyle: 'italic' }}>{question.expectedResponse}</p>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            padding: '20px',
            borderTop: '1px solid #e0e0e0',
          }}>
            <button
              style={{
                padding: '5px 10px',
                background: 'transparent',
                border: 'none',
                marginRight: '10px',
                cursor: currentPage > 1 ? 'pointer' : 'default',
                opacity: currentPage > 1 ? 1 : 0.5,
              }}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <img style={{width: '40px'}} src='/LeftGreenArrow.png' alt="Previous" />
            </button>
            <button
              style={{
                padding: '5px 10px',
                background: 'transparent',
                border: 'none',
                cursor: currentPage < totalPages ? 'pointer' : 'default',
                opacity: currentPage < totalPages ? 1 : 0.5,
              }}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <img style={{width: '40px'}} src='/RightGreenArrow.png' alt="Next" />
            </button>
          </div>
        </div>
      </div>
    );
  };

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
      }, 10000); // Poll every 10 seconds

      return () => {
        clearInterval(reviewCountInterval);
      };
    }
  }, [students]);

  const handleBack = () => {
    navigate(-1);
  };

  const goToReview = () => {
    navigate(`/teacherReview/${classId}/${assignmentId}`);
  };

  const calculatePercentage = (grade, totalQuestions) => {
    return Math.floor((grade / totalQuestions) * 100);
  };

  const calculateLetterGrade = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };
  const AssignModal = () => {
    const handleAssign = async () => {
      const batch = writeBatch(db);
      for (const studentId of selectedStudents) {
        const studentRef = doc(db, 'students', studentId);
        batch.update(studentRef, {
          assignmentsToTake: arrayUnion(assignmentId)
        });
      }
      await batch.commit();
      setIsAssignModalOpen(false);
      setSelectedStudents([]);
    };
  
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '15px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          width: '600px',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}>
          <button 
            onClick={() => setIsAssignModalOpen(false)}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              zIndex: 1,
            }}
          >
            <img style={{width: '30px'}} src='/redCircleX.png' alt="Close"/>
          </button>
          <h2 style={{
            textAlign: 'center',
            padding: '20px',
            margin: 0,
            backgroundColor: '#54AAA4',
            color: 'white',
            fontFamily: "'Radio Canada', sans-serif",
            fontSize: '28px',
          }}>
            Assign to New Students
          </h2>
          <div style={{
            padding: '20px',
            overflowY: 'auto',
            maxHeight: 'calc(80vh - 180px)', // Adjust based on header and footer height
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {students.map((student) => (
                <div 
                  key={student.uid} 
                  style={{
                    width: '48%',
                    margin: '10px 0',
                    padding: '15px',
                    border: selectedStudents.includes(student.uid) ? '3px solid #54AAA4' : '3px solid #e0e0e0',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backgroundColor: selectedStudents.includes(student.uid) ? '#ECFAF9' : 'white',
                    fontFamily: "'Radio Canada', sans-serif",
                  }}
                  onClick={() => {
                    if (selectedStudents.includes(student.uid)) {
                      setSelectedStudents(prev => prev.filter(id => id !== student.uid));
                    } else {
                      setSelectedStudents(prev => [...prev, student.uid]);
                    }
                  }}
                >
                  {student.firstName} {student.lastName}
                </div>
              ))}
            </div>
          </div>
          <div style={{
            padding: '20px',
            borderTop: '1px solid #e0e0e0',
            textAlign: 'center',
          }}>
            <button 
              style={{
                padding: '10px 20px',
                backgroundColor: '#54AAA4',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '18px',
                fontFamily: "'Radio Canada', sans-serif",
                transition: 'background-color 0.3s ease',
              }}
              onClick={handleAssign}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#458F8A'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#54AAA4'}
            >
              Assign
            </button>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
      <Navbar userType="teacher" />
   
      <div style={{border: '15px solid #54AAA4', padding: '5px', zIndex: 100, boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.25)', width: '350px', fontFamily: "'Radio Canada', sans-serif", position: 'absolute', top: '-130px', background: 'rgb(255, 255, 255,.8)',
       backdropFilter: 'blur(5px)',  right: '-90px', backgroundColor: 'white', textAlign: 'center', borderRadius: '250px', height: '350px'}}>
        <h2 onClick={fetchQuestions} style={{ fontSize: '50px', fontWeight: 'bold', color: 'black', marginRight: '40px', marginTop: '180px', fontFamily: "'Radio Canada', sans-serif", cursor: 'pointer', }}>
          Question Bank
        </h2>
      </div>
      <style>
        {`
          .tooltip {
            position: relative;
            display: inline-block;
          }
          .tooltip .tooltiptext {
            visibility: hidden;
            width: 320px;
            background-color: rgba(250,250,250,0.8);
            box-shadow: 2px 2px 2px 2px rgb(0,0,0,.1);
            font-size: 14px;
            padding: 10px;
            backdrop-filter: blur(5px); 
            color: grey;
            text-align: left;
            border-radius: 6px;
            position: absolute;
            z-index: 1;
            bottom: -150%;
            left: 300%;
            margin-left: -110px;
            opacity: 0;
            transition: opacity 0.3s;
          }
          .tooltip:hover .tooltiptext {
            visibility: visible;
            opacity: 1;
          }
            .student-item {
      transition: border-color 0.3s, border-radius 0.3s;
      position: relative;
      z-index: 2;
    }
    .student-item:hover {
      border-color: #54AAA4 !important;
      border-top-right-radius: 0 !important;
      border-bottom-right-radius: 0 !important;
    }
    
    .student-arrow {
      transition: opacity 0.3s, transform 0.3s;
      opacity: 0;
      transform: translateX(-10px);
    }
    
    .student-item:hover .student-arrow {
      opacity: 1;
      transform: translateX(0);
    }
  `}
      </style>
      


      <div style={{ width: '1000px', display: 'flex', justifyContent: 'align', marginTop: '180px', marginLeft: 'auto', marginRight: 'auto' }}>
        <div style={{ display: 'flex', width: '780px',  marginRight: 'auto', marginLeft: '120px', height: ' auto', lineHeight:'0px'}}>
          <h1 style={{ fontSize: '78px', color: 'black', fontFamily: "'Radio Canada', sans-serif" }}>{assignmentName}</h1>
        </div>
        {isModalOpen && <QuestionsModal />}
      </div>

      {reviewCount > 0 && (
        <div style={{width: '100%', position: 'fixed', 
          marginTop: '70px',zIndex: '20'}}>
            <div style={{backgroundColor: 'rgb(22, 223, 210,.4)', height: '4px',backdropFilter: 'blur(10px)', zIndex: '21'}}></div>
      <div style={{ width: '700px', display: 'flex', 
       marginTop: '-0px',
       background: 'rgb(250, 250, 250,.8)',
      zIndex: '-1',
      borderTopLeftRadius: '0px',
      borderTopRightRadius: '0px',
       backdropFilter: 'blur(5px)', 
          boxShadow: ' 0px 4px 4px 0px rgba(0, 0, 0, 0.15)',
           borderBottomRightRadius: '10px',
           borderBottomLeftRadius: '10px', 
           padding: '10px', 
           marginBottom: '10px', 
           height: '50px', 
           marginLeft: 'auto',
           fontSize: '30px',
           marginRight: 'auto',
           }}>
              <h1 style={{fontSize: '40px', marginTop: '0px', marginLeft: '20px',fontFamily: "'Radio Canada', sans-serif",}}>
          {reviewCount} </h1> <h1 style={{fontSize: '30px', marginTop: '0px', marginLeft: '20px', fontWeight: 'normal',fontFamily: "'Radio Canada', sans-serif", lineHeight: '45px'}}>Responses Flagged For Review</h1>
          <button style={{
            height: '45px',
            width: '45px',
            position: 'absolute',
            right: '20px',
            fontFamily: "'Radio Canada', sans-serif",
            backgroundColor: 'transparent',
            color: 'white',
            borderRadius: '5px',
            cursor: 'pointer',
            borderColor: 'transparent',
            
            fontsize: '80px',
            marginLeft: '50px'
          }} onClick={goToReview}>
            <img  style={{width: '40px'}}src='/RightGreenArrow.png'/>
          </button>
        </div>
        </div>
      )}
{isAssignModalOpen && <AssignModal />}
      <div style={{ width: '810px', display: 'flex', justifyContent: 'space-between', marginTop: '20px', alignSelf: 'center', alignItems: 'center', marginLeft: '30px'}}>
       
        <button onClick={() => setIsAssignModalOpen(true)} style={{width: '450px', fontSize: '20px', height:'50px', borderRadius: '10px', fontWeight: 'bold', border: '3px solid lightgrey', background:' white', cursor: 'pointer',

marginLeft: '10px',
transition: '.3s',


}}
onMouseEnter={(e) => {

  e.target.style.borderColor = 'grey';

}}
onMouseLeave={(e) => {

  e.target.style.borderColor = 'lightgrey';

}}>Assign to New Students</button>

<div style={{width: '450px', fontSize: '20px', height:'45px', borderRadius: '10px', fontWeight: 'bold', border: '3px solid lightgrey', background:' white', cursor: 'pointer', display:'flex',
alignItems: 'center',
marginLeft: '10px',
transition: '.3s',


}}
>
   <h1 style={{fontSize: '20px', marginLeft:'80px'}}>Student Review </h1>
       
          <input type="checkbox" 
           className="greenSwitch"
           style={{marginLeft:'30px'}}
           checked={allViewable} onChange={toggleAllViewable} />
         
  
       
        </div>
      </div>

      <ul>
        {students.map((student) => (
   <li key={student.uid} className="student-item" style={{ 
        width: '780px', 
        height: '80px', 
        alignItems: 'center', 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginRight: 'auto', 
        marginLeft: 'auto', 
        border: '3px solid lightgrey', 
        backgroundColor: 'white', 
        borderRadius: '10px', 
        padding: '10px', 
        marginBottom: '20px', 
        position: 'relative',
        zIndex: '2', 
    }}
    onMouseEnter={() => setHoveredStudent(student.uid)}
    
    onMouseLeave={() => setHoveredStudent(null)}

    
    >  <div style={{ marginLeft: '20px', width: '400px',  }}>
              <div style={{ display: 'flex', marginBottom: '10px' }}>
                <h3 style={{ fontWeight: 'normal', color: 'grey', fontFamily: "'Radio Canada', sans-serif", fontSize: '23px' }}>{student.lastName},</h3>
                <h3 style={{ fontWeight: 'bold', color: 'black', fontFamily: "'Radio Canada', sans-serif", fontSize: '23px', marginLeft: '10px' }}>{student.firstName}</h3>
              </div>

              <div style={{ fontWeight: 'bold', textAlign: 'center', color: 'black', fontFamily: "'Poppins', sans-serif", marginTop: '-40px' }}>
              {grades[student.uid] ? (
  <div style={{ display: 'flex', alignItems: 'center' }}>
    <p style={{ fontWeight: 'bold', width: '23px', fontSize: '22px', backgroundColor: '#566DFF', height: '23px', border: '4px solid #003BD4', lineHeight: '23px', color: 'white', borderRadius: '7px', fontFamily: "'Radio Canada', sans-serif" }}>
      {calculateLetterGrade(grades[student.uid].percentageScore)}
    </p>
    <p style={{ fontSize: '22px', color: 'lightgrey', marginLeft: '30px' }}>
      {`${Math.round(grades[student.uid].percentageScore)}%`}
    </p>
    <button style={{ backgroundColor: 'transparent', color: resetStatus[student.uid] === 'success' ? 'lightgreen' : 'red', cursor: 'pointer', borderColor: 'transparent', fontFamily: "'Radio Canada', sans-serif", fontWeight: 'bold', fontSize: '22px', marginLeft: '30px' }} onClick={() => handleReset(student.uid)}>
      {resetStatus[student.uid] === 'success' ? 'Success' : 'Reset'}
    </button>
  </div>
) : (
  <div style={{ display: 'flex', alignItems: 'center' }}>
    <p style={{ fontWeight: 'bold', width: '23px', fontSize: '22px', backgroundColor: '#566DFF', height: '23px', border: '4px solid #003BD4', lineHeight: '23px', color: 'white', borderRadius: '7px', fontFamily: "'Radio Canada', sans-serif" }}>
      Z
    </p>
    <p style={{ fontSize: '22px', color: 'lightgrey', marginLeft: '30px' }}>
      00%
    </p>
    <button style={{ backgroundColor: 'transparent', color: resetStatus[student.uid] === 'success' ? 'lightgreen' : 'red', cursor: 'pointer', borderColor: 'transparent', fontFamily: "'Radio Canada', sans-serif", fontWeight: 'bold', fontSize: '22px', marginLeft: '30px' }} onClick={() => handleReset(student.uid)}>
      {resetStatus[student.uid] === 'success' ? 'Success' : 'Reset'}
    </button>
  </div>
)}
                  
              </div>
            </div>
            <div style={{ color: 'lightgrey', width: '400px', display: 'flex'}}>
              <div style={{}}>
              <h1 style={{ fontSize: '22px', fontFamily: "'Radio Canada', sans-serif", fontWeight: 'normal' }}>Completed: 11/05/2024 6:43am</h1>
              <h1 style={{ fontSize: '22px', fontFamily: "'Radio Canada', sans-serif", fontWeight: 'normal' }}>Due: 11/15/2024 8:43am</h1>
              </div>
          <h1 style={{fontSize: '20px',position: 'absolute', right: '15px', bottom: '0px', color: '#003BD4', fontWeight: 'bold', fontFamily: "'Radio Canada', sans-serif"}}>SAQ</h1>
            </div>

            <div className="tooltip">
              <span className="tooltiptext">Resetting assignments lets students take assignment again, it also assigns the assignment to new students</span>
            </div>
  
            {hoveredStudent === student.uid && (
              <div
                className="student-arrow"
                style={{
                  position: 'absolute',
                  right: '-75px',
                  top: '-3px',
                  height: '78px',
                  width: '50px',
                  padding: '11px',
                  zIndex: '1',
                  backgroundColor: '#A3F2ED',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '3px solid #54AAA4',
                  borderBottomRightRadius: '10px',
                  borderTopRightRadius: '10px',
                  cursor: 'pointer',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/teacherStudentResults/${assignmentId}/${student.uid}`);
                }}
              >
                <img 
                  src='/GradesArrow.png'
                  alt="View student results"
                  style={{ 
                    width: '30px', 
                  }}
                />
              </div>
            )}
          </li>
        ))}
      </ul>

      <style>{`
        .switch {
          position: relative;
          width: 60px;
          height: 34px;
          margin-right: 30px;
        }
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 26px;
          width: 26px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: .4s;
        }
        input:checked + .slider {
          background-color: #2196F3;
        }
        input:checked + .slider:before {
          transform: translateX(26px);
        }
        .slider.round {
          border-radius: 34px;
        }
        .slider.round:before {
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
};

export default TeacherResults;
