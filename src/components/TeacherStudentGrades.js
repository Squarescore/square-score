import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from './Navbar';

function TeacherStudentGrades() {
  const [grades, setGrades] = useState([]);
  const [studentName, setStudentName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredGrade, setHoveredGrade] = useState(null);
 
  const { classId, studentUid } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCompletedAssignments = async () => {
      const saqGradesQuery = query(
        collection(db, 'grades(saq)'),
        where('studentUid', '==', studentUid),
        where('classId', '==', classId)
      );
  
      const amcqGradesQuery = query(
        collection(db, 'grades(AMCQ)'),
        where('studentUid', '==', studentUid),
        where('classId', '==', classId)
      );
      const mcqGradesQuery = query(
        collection(db, 'grades(mcq)'),
        where('studentUid', '==', studentUid),
        where('classId', '==', classId)
      );
      const [saqSnapshot, amcqSnapshot, mcqSnapshot] = await Promise.all([
        getDocs(saqGradesQuery),
        getDocs(amcqGradesQuery),
        getDocs(mcqGradesQuery)
      ]);
  
      const saqGrades = saqSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'SAQ' }));
      const amcqGrades = amcqSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'AMCQ' }));
      const mcqGrades = mcqSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'MCQ' }));
  
      const allGrades = [...saqGrades, ...amcqGrades,...mcqGrades].sort((a, b) => b.submittedAt.toDate() - a.submittedAt.toDate());
      setGrades(allGrades);
    };
  

    const fetchStudentName = async () => {
      const studentDocRef = doc(db, 'students', studentUid);
      const studentDoc = await getDoc(studentDocRef);
      if (studentDoc.exists()) {
        const studentData = studentDoc.data();
        setStudentName(`${studentData.firstName} ${studentData.lastName}`);
      }
    };

    fetchCompletedAssignments();
    fetchStudentName();
  }, [studentUid, classId]);

  const navigateToResults = (assignmentId, gradeType) => {
    if (gradeType === 'SAQ') {
      navigate(`/teacherStudentResults/${assignmentId}/${studentUid}/${classId}`);
    } else if (gradeType === 'AMCQ') {
      navigate(`/teacherStudentResultsAMCQ/${assignmentId}/${studentUid}/${classId}`);
    }
    else if (gradeType === 'MCQ') {
      navigate(`/teacherStudentResultsMCQ/${assignmentId}/${studentUid}/${classId}`);
    }
  };

  const getLetterGrade = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const filteredGrades = grades.filter(grade =>
    grade.assignmentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar userType="teacher" />
      <div style={{ width: '700px', marginLeft: 'auto', marginRight: 'auto', marginTop: '100px' }}>
        <h1 style={{ fontSize: '40px', fontFamily: "'Radio Canada', sans-serif", textAlign: 'left', marginLeft: '0px' }}>
          {studentName}'s Grades
        </h1>
        <div style={{ position: 'relative', width: '300px', height: '30px', marginRight: 'auto', marginTop: '30px' }}>
        <button
            onClick={() => setSearchTerm('')}
            style={{
              width: '30px',
              height: '30px',
              position: 'absolute',
              top: '20px',
              left: '10px',
              transform: 'translateY(-39%)',
              backgroundColor: 'transparent',
              borderColor: 'transparent',
              cursor: 'pointer',
              padding: '0',
            }}
          >
            <img style={{ width: '20px' }} src="/BlueSearch.png" alt="Search" />
          </button>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              height: '100%',
              fontSize: '20px',
              fontFamily: "'Radio Canada', sans-serif",
              padding: '5px',
              paddingLeft: '50px',
              border: '0px solid #48A49E',
              backgroundColor: 'rgb(72, 164, 158,.1)',
              borderRadius: '100px',
              
              color: 'rgb(72, 164, 158)',
              outlineColor: '#48A49E',
            }}
          />
       
        </div>
        <ul style={{ padding: 0, marginTop: '30px' }}>
          {filteredGrades.length === 0 && (
            <div style={{ textAlign: 'center', fontSize: '20px', fontFamily: "'Roboto Mono', sans-serif", color: 'grey' }}>
              No grades available for this student.
            </div>
          )}
          {filteredGrades.map(grade => {
            const isAMCQ = grade.type === 'AMCQ';
            const isSAQ = grade.type === 'SAQ';
            const isMCQ = grade.type === 'MCQ';
            const percentage = Math.round(isAMCQ ? grade.SquareScore : grade.percentageScore);
            const percentageMCQ = Math.round((isMCQ ? grade.rawTotalScore / grade.maxRawScore: 0) * 100);
            const letterGrade = getLetterGrade(percentage);
            const letterGradeMCQ = getLetterGrade(percentageMCQ);

            const commonStyles = {
              color: 'black', 
              backgroundColor: 'white', 
              fontFamily: "'Radio Canada', sans-serif",
              transition: 'all 0.3s ease',
              border: hoveredGrade === grade.id ? '4px solid #54AAA4' : '4px solid lightgrey',
              listStyleType: 'none',
              marginTop: '20px', 
              marginLeft: '0px',
              borderRadius: '15px',
              position: 'relative',
              borderTopRightRadius: hoveredGrade === grade.id ? '0px' : '15px',
              borderBottomRightRadius: hoveredGrade === grade.id ? '0px' : '15px',
            };
            if (isAMCQ) {
              return (
                <li key={grade.id} 
                    style={{ 
                      ...commonStyles,
                      height: '100px',
                      display: 'flex',
                    }}
                    onMouseEnter={() => setHoveredGrade(grade.id)}
                    onMouseLeave={() => setHoveredGrade(null)}
               >
                  <div style={{
                    width: '60px',
                    height: '60px',
                    marginTop: '15px',
                    marginLeft: '15px',
                    border: '7px solid #003BD4',
                    backgroundColor: '#566DFF',
                    borderRadius: '15px'
                  }}>
                    <p style={{
                      fontWeight: 'bold',
                      width: '45px',
                      marginTop: '8px',
                      marginRight: 'auto',
                      marginLeft: 'auto',
                      fontSize: '25px',
                      backgroundColor: 'white',
                      height: '45px',
                      lineHeight: '47px',
                      color: 'black',
                      borderRadius: '3px',
                      fontFamily: "'Rajdhani', sans-serif",
                      textAlign: 'center'
                    }}>
                      {grade.SquareScore}
                    </p>
                  </div>
                  <div style={{flexGrow: 1, padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
                    <h1 style={{color: 'black', fontSize: '30px', marginTop: '5px'}}>
                      {grade.assignmentName}
                    </h1>
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '-15px'}}>
                      <span style={{fontSize: '25px', fontWeight: 'bold', color: 'grey'}}>
                        {letterGrade}
                      </span>
                      <span style={{fontSize: '20px', color: 'grey'}}>
                        Submitted: {grade.submittedAt ? new Date(grade.submittedAt.toDate()).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        }) : 'N/A'}
                      </span>
                      <span style={{
                        fontWeight: 'bold',
                        fontSize: '30px',
                        color: '#009006',
                      }}>
                        MCQ<span style={{ color: '#F4C10A' }}>*</span>
                      </span>
                    </div>
                  </div>
                  {hoveredGrade === grade.id && (
                    <button style={{
                      position: 'absolute', 
                      right: '-57px', 
                      top: '50%', 
                      width: '60px',
                      cursor: 'pointer',
                      height: '112px',
                      display: 'flex',
                      transform: 'translateY(-50%)', 
                      backgroundColor: '#A3F2ED',
                      border: '4px solid #54AAA4',
                      borderRadius: '0 15px 15px 0',
                      fontFamily: "'Radio Canada', sans-serif",
                      alignItems: 'center', 
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      opacity: hoveredGrade === grade.id ? 1 : 0,
                    }} onClick={() => navigateToResults(grade.assignmentId, grade.type)}>
                      <img style={{width: '30px', cursor: 'pointer', transform: 'scale(1)', transition: '.3s'}}
                        onMouseEnter={(e) => { e.target.style.transform = 'scale(1.06)'; }}
                        onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }} 
                        src='/gradesarrow.png' alt="View details"/>
                    </button>
                  )}
                </li>
              );
            } else if (isSAQ){
              return (
                <li key={grade.id} 
                style={{ 
                  ...commonStyles,
                  fontSize: '40px', 
                  textAlign: 'center', 
                  height: '69px',
                  padding: '10px', 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
                onMouseEnter={() => setHoveredGrade(grade.id)}
                onMouseLeave={() => setHoveredGrade(null)}
            >
                  <div style={{display: 'flex', width: '100%'}}>
                    <div style={{marginLeft: '10px', width: '800px', textAlign: 'left'}}>
                      <h1 style={{color: 'black', fontSize: '25px', marginLeft: '5px'}}>
                        {grade.assignmentName}
                      </h1>  
                      <div style={{display: 'flex', position: 'relative', alignItems: 'center', marginTop: '-30px'}}>
                        <p style={{
                          fontWeight: 'bold',
                          width: '23px',
                          textAlign: 'center',
                          fontSize: '22px',
                          backgroundColor: '#566DFF',
                          height: '23px',
                          border: '4px solid #003BD4',
                          lineHeight: '23px',
                          color: 'white',
                          borderRadius: '7px',
                          fontFamily: "'Radio Canada', sans-serif"
                        }}>
                          {letterGrade}
                        </p>
                        <h1 style={{color: 'grey', fontSize: '24px', marginLeft: '40px'}}>
                          {percentage}%
                        </h1>
                        <h1 style={{color: 'grey', fontSize: '20px', textAlign: 'left', fontWeight: 'normal', marginLeft: '30px'}}>
                          Submitted: {grade.submittedAt ? new Date(grade.submittedAt.toDate()).toLocaleString(undefined, {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          }) : 'N/A'}
                        </h1>
                        <span style={{
                          position: 'absolute',
                          right: '30px',
                          bottom: '20px',
                          fontWeight: 'bold',
                          width: '60px',
                          marginTop: '0px',
                          fontSize: '30px',
                          fontFamily: "'Radio Canada', sans-serif",
                          color: '#020CFF',
                        }}>
                          SAQ
                        </span>
                      </div>
                    </div>
                  </div>
                  {hoveredGrade === grade.id && (
                    <button style={{
                      fontWeight: 'bold',
                      position: 'absolute', 
                      right: '-57px', 
                      top: '50%', 
                      width: '60px',
                      cursor: 'pointer',
                      height: '101px',
                      padding: '10px 20px 10px 20px',
                      display: 'flex',
                      transform: 'translateY(-50%)', 
                      color: 'white',
                      backgroundColor: '#A3F2ED',
                      border: '4px solid #54AAA4',
                      borderRadius: '15px',
                      marginBottom: '5px',
                      borderTopLeftRadius: '0px',
                      borderBottomLeftRadius: '0px',
                      fontFamily: "'Radio Canada', sans-serif",
                      alignItems: 'center', 
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      opacity: hoveredGrade === grade.id ? 1 : 0,
                    }} onClick={() => navigateToResults(grade.assignmentId, grade.type)}>
                      <img style={{width: '30px', cursor: 'pointer', transform: 'scale(1)', transition: '.3s'}}
                        onMouseEnter={(e) => { e.target.style.transform = 'scale(1.06)'; }}
                        onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }} 
                        src='/gradesarrow.png' alt="View details"/>
                    </button>
                  )}
                </li>
              );
            }
            else if (isMCQ){



              return (
                <li key={grade.id} style={{ 
                  ...commonStyles,
                  fontSize: '40px', 
                  textAlign: 'center', 
                  height: '69px',
                  padding: '10px', 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }} onMouseEnter={() => setHoveredGrade(grade.id)}
                onMouseLeave={() => setHoveredGrade(null)}
            >
                  <div style={{display: 'flex', width: '100%'}}>
                    <div style={{marginLeft: '10px', width: '800px', textAlign: 'left'}}>
                      <h1 style={{color: 'black', fontSize: '25px', marginLeft: '5px'}}>
                        {grade.assignmentName}
                      </h1>  
                      <div style={{display: 'flex', position: 'relative', alignItems: 'center', marginTop: '-30px'}}>
                        <p style={{
                          fontWeight: 'bold',
                          width: '23px',
                          textAlign: 'center',
                          fontSize: '22px',
                          backgroundColor: '#566DFF',
                          height: '23px',
                          border: '4px solid #003BD4',
                          lineHeight: '23px',
                          color: 'white',
                          borderRadius: '7px',
                          fontFamily: "'Radio Canada', sans-serif"
                        }}>{letterGradeMCQ}
                        </p>
                        <h1 style={{color: 'grey', fontSize: '24px', marginLeft: '40px'}}>
                        {percentageMCQ}%
                        </h1>
                      
                        <h1 style={{color: 'grey', fontSize: '20px', textAlign: 'left', fontWeight: 'normal', marginLeft: '30px'}}>
                          Submitted: {grade.submittedAt ? new Date(grade.submittedAt.toDate()).toLocaleString(undefined, {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          }) : 'N/A'}
                        </h1>
                        <span style={{
                          position: 'absolute',
                          right: '30px',
                          bottom: '20px',
                          fontWeight: 'bold',
                          width: '60px',
                          marginTop: '0px',
                          fontSize: '30px',
                          fontFamily: "'Radio Canada', sans-serif",
                          color: 'green',
                        }}>
                          MCQ
                        </span>
                      </div>
                    </div>
                  </div>
                  {hoveredGrade === grade.id && (
                    <button style={{
                      fontWeight: 'bold',
                      position: 'absolute', 
                      right: '-57px', 
                      top: '50%', 
                      width: '60px',
                      cursor: 'pointer',
                      height: '101px',
                      padding: '10px 20px 10px 20px',
                      display: 'flex',
                      transform: 'translateY(-50%)', 
                      color: 'white',
                      backgroundColor: '#A3F2ED',
                      border: '4px solid #54AAA4',
                      borderRadius: '15px',
                      marginBottom: '5px',
                      borderTopLeftRadius: '0px',
                      borderBottomLeftRadius: '0px',
                      fontFamily: "'Radio Canada', sans-serif",
                      alignItems: 'center', 
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      opacity: hoveredGrade === grade.id ? 1 : 0,
                    }} onClick={() => navigateToResults(grade.assignmentId, grade.type)}>
                      <img style={{width: '30px', cursor: 'pointer', transform: 'scale(1)', transition: '.3s'}}
                        onMouseEnter={(e) => { e.target.style.transform = 'scale(1.06)'; }}
                        onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }} 
                        src='/gradesarrow.png' alt="View details"/>
                    </button>
                  )}
                </li>
              );
              
            
      
      
      
      
      
      
      
            }
          })}
          </ul>
      </div>
    </div>
  );
}

export default TeacherStudentGrades;
