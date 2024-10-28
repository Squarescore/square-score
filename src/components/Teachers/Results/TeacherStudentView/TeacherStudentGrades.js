import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../Universal/firebase';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../../../Universal/Navbar';
import { Search } from 'lucide-react';

function TeacherStudentGrades() {
  const [grades, setGrades] = useState([]);
  const [studentName, setStudentName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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

      const allGrades = [...saqGrades, ...amcqGrades, ...mcqGrades].sort((a, b) => b.submittedAt.toDate() - a.submittedAt.toDate());
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
    } else if (gradeType === 'MCQ') {
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
    <div style={{     minHeight: '100vh',
      width: '100%',
      backgroundColor: '#FCFCFC',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'}}>
      <Navbar userType="teacher" />


      <div style={{ position: 'absolute', width: '360px', height: '55px',  right: '50px', marginTop: '100px'}}>
                           <input
                             type="text"
                             placeholder="Search..."
                             value={searchTerm}
                             onChange={(e) => setSearchTerm(e.target.value)}
                           
                             style={{
                               width: '300px',
                               height: '35px',
                               fontSize: '20px',
                               border: '4px solid white',
                               fontFamily: "'montserrat', sans-serif",
                               padding: '0px 40px 0px 20px',
                              
                          boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)',
                               marginLeft: '0px',
                               marginTop: '0px',
                               backgroundColor: 'white',
                               color: 'black',
                               borderRadius: '10px',
                               outline: 'none',
                             }}
                           />
                           <button
                            onClick={() => setSearchTerm('')}
                             style={{
                               position: 'absolute',
                               top: '28px',
                               right: '-8px',
                               height: '44px',
                               width: '45px',
                               borderRadius: '0px 10px 10px  0px ',
                               transform: 'translateY(-65%)',
                               backgroundColor: '#FFF2AD',
                               border: `4px solid #FFAA00`,
                               cursor: 'pointer',
                               padding: '0',
                             }}
                           >
                                    <Search size={25} strokeWidth={2.8} color={'#FFAA00'} />
                        
                           </button>
                         </div>


      <div style={{ width: '820px', marginLeft: 'auto', marginRight: 'auto', marginTop: '200px' }}>
        <h1 style={{ fontSize: '40px', fontFamily: "'montserrat', sans-serif", textAlign: 'left', marginLeft: '0px', marginBottom: '-50px' }}>
          {studentName}'s Grades
        </h1>
        <div style={{ position: 'relative', width: '300px', height: '30px', marginRight: 'auto', marginTop: '0px' }}>
         
   
        </div>
        <ul style={{ 
  padding: 0, 
  marginTop: '30px', 
  width: '820px',
  listStyleType: 'none', 
  display: 'flex', 
  flexWrap: 'wrap', 
  justifyContent: 'space-between' 
}}>
  {filteredGrades.length === 0 && (
    <div style={{ textAlign: 'center', fontSize: '20px', fontFamily: "'Roboto Mono', sans-serif", color: 'grey' }}>
      No grades available for this student.
    </div>
  )}
  {filteredGrades.map(grade => {
    const isAMCQ = grade.type === 'AMCQ';
    const isSAQ = grade.type === 'SAQ';
    const isMCQ = grade.type === 'MCQ';
    const percentage = Math.round(
      isAMCQ
        ? grade.SquareScore
        : isMCQ
        ? (grade.rawTotalScore / grade.maxRawScore) * 100
        : grade.percentageScore
    );
    const letterGrade = getLetterGrade(percentage);

    return (
      <li
        key={grade.id}
        style={{
          backgroundColor: 'white',
          boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)',
          borderRadius: '15px',
          padding: '20px 0px',
          width: 'calc(50% - 10px)',
          fontFamily: "'montserrat', sans-serif",
          position: 'relative',
          cursor: 'pointer',
          marginTop: '20px',
        }}
        onClick={() => navigateToResults(grade.assignmentId, grade.type)}
      >
        <h2
          style={{
            fontSize: '20px',
            marginLeft: '20px',
            marginBottom: '20px',
            marginTop: '0px',
          }}
        >
          {grade.assignmentName}
        </h2>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: '-5px',
            marginLeft: '20px',
          }}
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '5px',
              textAlign: 'center',
            }}
          >
            <span
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'black',
                lineHeight: '20px',
                fontFamily: "'montserrat', sans-serif",
              }}
            >
              {letterGrade}
            </span>
          </div>

          <span
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              width: '70px',
              marginLeft: '20px',
              color: 'grey',
            }}
          >
            {percentage}%
          </span>

          <div
            style={{
              fontSize: '14px',
              color: 'grey',
              fontStyle: 'italic',
              fontWeight: 'bold',
              marginLeft: '20px',
              height: '20px',
              marginTop: '5px',
              width: '170px',
            }}
          >
            <span style={{ fontWeight: '600' }}>
              {grade.submittedAt
                ? new Date(grade.submittedAt.toDate()).toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })
                : 'N/A'}
            </span>
          </div>

          <div
            style={{
              fontSize: '16px',
              fontWeight: 'bold',
              marginTop: '5px',
              textAlign: 'left',
              marginLeft: '10px',
              color: isAMCQ ? '#2BB514' : isSAQ ? '#020CFF' : '#2BB514',
            }}
          >
            {isAMCQ ? 'MCQ*' : isSAQ ? 'SAQ' : 'MCQ'}
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
