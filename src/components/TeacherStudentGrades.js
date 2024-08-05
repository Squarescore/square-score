import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from './Navbar';

function TeacherStudentGrades() {
  const [grades, setGrades] = useState([]);
  const [studentName, setStudentName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { classId, studentUid } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGrades = async () => {
      const gradesQuery = query(
        collection(db, 'grades(saq)'),
        where('studentUid', '==', studentUid),
        where('classId', '==', classId)
      );

      const querySnapshot = await getDocs(gradesQuery);
      const fetchedGrades = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGrades(fetchedGrades);
    };

    const fetchStudentName = async () => {
      const studentDocRef = doc(db, 'students', studentUid);
      const studentDoc = await getDoc(studentDocRef);
      if (studentDoc.exists()) {
        const studentData = studentDoc.data();
        setStudentName(`${studentData.firstName} ${studentData.lastName}`);
      }
    };

    fetchGrades();
    fetchStudentName();
  }, [studentUid, classId]);

  const navigateToResults = (assignmentId) => {
    navigate(`/teacherStudentResults/${assignmentId}/${studentUid}/${classId}`);
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
  const percentage = Math.round(grade.percentageScore);
  const letterGrade = getLetterGrade(percentage);
  return (
    <li key={grade.id} 
      style={{
        fontSize: '40px',
        color: 'black',
        backgroundColor: 'white',
        fontFamily: "'Radio Canada', sans-serif",
        transition: '.4s',
         border: '6px solid #F4F4F4',
        listStyleType: 'none',
        textAlign: 'center',
        marginTop: '20px',
        height: '69px',
        marginLeft: 'auto',
        marginRight: 'auto',
        padding: '10px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#54AAA4';
        e.currentTarget.style.borderTopRightRadius = '0px';
        e.currentTarget.style.borderBottomRightRadius = '0px';
        const arrowButton = e.currentTarget.querySelector('.arrow-button');
        if (arrowButton) arrowButton.style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'lightgrey';
        e.currentTarget.style.borderTopRightRadius = '10px';
        e.currentTarget.style.borderBottomRightRadius = '10px';
        const arrowButton = e.currentTarget.querySelector('.arrow-button');
        if (arrowButton) arrowButton.style.opacity = '0';
      }}
    >
      <div style={{ display: 'flex', width: '100%' }}>
        <button 
          className="arrow-button"
          style={{
            fontWeight: 'bold',
            position: 'absolute', 
            right: '-57px', 
            top: '50%', 
            width: '60px',
            cursor: 'pointer',
            height: '94px',
            padding: '10px 20px 10px 20px',
            display: 'flex',
            transform: 'translateY(-50%)', 
            color: 'white',
            backgroundColor: '#A3F2ED',
            border: '6px solid #54AAA4',
            borderRadius: '10px',
            marginBottom: '5px',
            borderTopLeftRadius: '0px',
            borderBottomLeftRadius: '0px',
            fontFamily: "'Radio Canada', sans-serif",
            alignItems: 'center', 
            justifyContent: 'center',
            opacity: 0,
            transition: 'opacity 0.3s'
          }} 
          onClick={() => navigateToResults(grade.assignmentId)}
        >
          <img 
            style={{ 
              width: '30px', 
              cursor: 'pointer', 
              transform: 'scale(1)', 
              transition: '.3s' 
            }}
            onMouseEnter={(e) => { e.target.style.transform = 'scale(1.06)'; }}
            onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }} 
            src='/gradesarrow.png'
            alt="View grades"
          />
        </button>
        
        {/* Rest of the content */}
        <div style={{ marginLeft: '10px', width: '300px', textAlign: 'left' }}>
          <h1 style={{ color: 'black', fontSize: '25px', marginLeft: '5px' }}>
            {grade.assignmentName}
          </h1>  
          <div style={{ display: 'flex', position: 'relative', alignItems: 'center', marginTop: '-30px' }}>
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
            <h1 style={{ color: 'grey', fontSize: '24px', marginLeft: '40px' }}>
              {percentage}%
            </h1>
          </div>
        </div>
        <div style={{ width: '300px', position: 'relative', alignItems: 'center', height: '70px', marginTop: '6px', marginLeft: '30px' }}>
          <span style={{
            position: 'absolute',
            right: '10px',
            bottom: '-8px',
            fontWeight: 'bold',
            width: '60px',
            marginTop: '0px',
            fontSize: '25px',
            fontFamily: "'Radio Canada', sans-serif",
            color: '#020CFF',
          }}>
            SAQ
          </span>
          <h1 style={{ color: 'grey', fontSize: '20px', textAlign: 'left', fontWeight: 'normal' }}>
            Completed: {grade.submittedAt ? new Date(grade.submittedAt.toDate()).toLocaleString(undefined, {
              year: 'numeric',
              month: 'numeric',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }) : 'N/A'}
          </h1>
        </div>
      </div>
    </li>
  );
})}
        </ul>
      </div>
    </div>
  );
}

export default TeacherStudentGrades;
