import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import Navbar from './Navbar';

function TeacherGradesHome() {
  const { classId } = useParams();
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const navigate = useNavigate();
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [sortBy, setSortBy] = useState('assignment');

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const assignmentsCollections = [
          'assignments(saq)',
          'assignments(saq*)',
          'assignments(mcq)',
          'assignments(Amcq)'
        ];
  
        const fetchPromises = assignmentsCollections.map(collectionName =>
          getDocs(collection(db, collectionName))
        );
  
        const snapshots = await Promise.all(fetchPromises);
  
        let allAssignments = [];
        snapshots.forEach((snapshot, index) => {
          const filteredDocs = snapshot.docs.filter(doc => doc.id.startsWith(`${classId}+`));
          const assignments = filteredDocs
            .map(doc => {
              const data = doc.data();
              const [, , type] = doc.id.split('+');
              return {
                id: doc.id,
                ...data,
                type: type.replace('*', ''),
                name: data.assignmentName || data.name
              };
            })
            .filter(assignment => assignment.name); // Filter out assignments without names
  
          allAssignments = allAssignments.concat(assignments);
        });
  
        const sortedAssignments = allAssignments.sort((a, b) => {
          const dateA = a.createdDate && typeof a.createdDate.toDate === 'function' ? a.createdDate.toDate() : new Date(0);
          const dateB = b.createdDate && typeof b.createdDate.toDate === 'function' ? b.createdDate.toDate() : new Date(0);
          return dateB - dateA;
        });
  
        setAssignments(sortedAssignments);
        setFilteredAssignments(sortedAssignments);
      } catch (error) {
        console.error("Error fetching assignments:", error);
      }
    };
    fetchAssignments();
  }, [classId]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const classDocRef = doc(db, 'classes', classId);
        const classDoc = await getDoc(classDocRef);

        if (!classDoc.exists()) {
          console.log("No such document exists");
          return;
        }

        const classData = classDoc.data();
        const studentPromises = classData.participants.map(async (participant) => {
          const studentDocRef = doc(db, 'students', participant.uid);
          const studentDoc = await getDoc(studentDocRef);
          if (studentDoc.exists()) {
            const studentData = studentDoc.data();
            return {
              uid: participant.uid,
              name: studentData.firstName + ' ' + studentData.lastName,
            };
          }
          return null;
        });

        const studentsData = await Promise.all(studentPromises);
        const filteredStudentsData = studentsData.filter(student => student !== null);
        setStudents(filteredStudentsData);
        setFilteredStudents(filteredStudentsData);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };
    fetchStudents();
  }, [classId]);

  useEffect(() => {
    const handleSearch = () => {
      if (sortBy === 'assignment') {
        const filtered = assignments.filter(assignment => 
          assignment.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredAssignments(filtered);
      } else if (sortBy === 'student') {
        const filtered = students.filter(student => 
          student.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredStudents(filtered);
      }
    };
    handleSearch();
  }, [searchTerm, assignments, students, sortBy]);

  const formatDate = (createdDate) => {
    if (createdDate && typeof createdDate.toDate === 'function') {
      const date = createdDate.toDate();
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
    return '';
  };

  const handleSortClick = (type) => {
    setSortBy(type);
    setSearchTerm('');
    setFilteredAssignments(assignments);
    setFilteredStudents(students);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar userType="teacher" />
      <div style={{ width: '1000px', marginLeft: 'auto', marginRight: 'auto' }}>
        <div style={{
          display: 'flex',
          marginLeft: 'auto',
          marginRight: 'auto',
          marginTop: '70px',
          padding: '10px',
          backgroundColor: 'transparent',
          borderRadius: '10px'
        }}>
          <h1 style={{ color: 'black', fontSize: '60px', fontFamily: "'Radio Canada', sans-serif", marginLeft: '0px' }}>Grades</h1>
          <div style={{
            width: '250px', border: '3px solid #D7D7D7', display: 'flex', padding: '20px', borderRadius: '10px', height: '25px', marginLeft: '70px', marginTop: '50px'
          }}>
            <h1 style={{ position: 'absolute', marginTop: '-50px', fontSize: '26px', padding: '8px', backgroundColor: 'white', fontFamily: "'Radio Canada', sans-serif" }}> Sort By</h1>
            <button
              style={{
                fontSize: '16px', height: '40px',  paddingTop: '10px', paddingBottom: '30px', marginLeft: '-10px',
                paddingLeft: '30px', paddingRight: '30px', fontFamily: "'Radio Canada', sans-serif", borderRadius: '5px', border: '0px solid #48A49E', marginTop: '-7px', zIndex: '100', cursor: 'pointer',
                backgroundColor: sortBy === 'assignment' ? '#ECFAF9' : 'white', color: sortBy === 'assignment' ? '#48A49E' : 'black',
              }}
              onClick={() => handleSortClick('assignment')}
            >
              Assignment
            </button>
            <button
              style={{
                fontSize: '16px', height: '40px', 
                paddingLeft: '30px', paddingRight: '30px', paddingTop: '10px', paddingBottom: '30px', fontFamily: "'Radio Canada', sans-serif", borderRadius: '5px', border: '0px solid #48A49E', marginTop: '-7px', zIndex: '100', cursor: 'pointer',
                backgroundColor: sortBy === 'student' ? '#ECFAF9' : 'white', color: sortBy === 'student' ? '#48A49E' : 'black',
             
              }}
              onClick={() => handleSortClick('student')}
            >
              Student
            </button>
          </div>
          {!showSearchBar ? (
            <button
              onClick={() => setShowSearchBar(true)}
              style={{ width: '40px', height: '40px', marginLeft: 'auto', marginRight: '20px', backgroundColor: 'transparent', borderColor: 'transparent', marginTop: '60px', padding: '5px', cursor: 'pointer' }}
            >
              <img style={{ width: '30px' }} src="/BlueSearch.png" alt="Search" />
            </button>
          ) : (
            <div style={{ position: 'relative', width: '300px', height: '30px', marginLeft: 'auto', marginRight: '20px', marginTop: '60px' }}>
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
                  border: '2px solid #48A49E',
                  backgroundColor: 'transparent',
                  borderRadius: '100px',
                  paddingLeft: '20px',
                  color: 'black',
                  outlineColor: '#48A49E',
                }}
              />
              <button
                onClick={() => setShowSearchBar(false)}
                style={{
                  width: '30px',
                  height: '30px',
                  position: 'absolute',
                  top: '17px',
                  right: '5px',
                  transform: 'translateY(-39%)',
                  backgroundColor: 'transparent',
                  borderColor: 'transparent',
                  cursor: 'pointer',
                  padding: '0',
                }}
              >
                <img style={{ width: '30px' }} src="/BlueSearch.png" alt="Search" />
              </button>
            </div>
          )}
        </div>

        <ul style={{ width: '100%', display: 'flex', flexWrap: 'wrap', padding: 0, margin: 'auto' }}>
        {sortBy === 'assignment' && filteredAssignments.map((assignment, index) => (
  <li
    key={assignment.id}
    onClick={(e) => {
      if (!e.target.classList.contains('slider') && !e.target.parentElement.classList.contains('slider')) {
        if (assignment.type === 'dbq') {
          navigate(`/class/${classId}/dbq/${assignment.id}/TeacherDBQResults`);
        } else {
          navigate(`/class/${classId}/assignment/${assignment.id}/TeacherResults`);
        }
      }
    }}
    style={{
      backgroundColor: 'white',
      fontSize: '23px',
      color: 'black',
      width: '420px',
      height: '70px',
      margin: '25px',
      position: 'relative',
      fontFamily: "'Radio Canada', sans-serif",
      transition: '.3s',
      listStyleType: 'none',
      textAlign: 'left',
      border: '3px solid lightgrey',
      padding: '10px',
      borderRadius: '10px',
      transform: 'scale(1)',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.opacity = '100%';
      e.currentTarget.style.boxShadow = '0px 4px 4px 0px rgba(0, 0, 0, 0.25)';
      e.currentTarget.style.transform = 'scale(1.02)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.opacity = '100%';
      e.currentTarget.style.boxShadow = 'none';
      e.currentTarget.style.transform = 'scale(1)';
    }}
  >
    <span
      style={{
        cursor: 'pointer',
        fontFamily: "'Radio Canada', sans-serif",
        marginLeft: '10px',
        fontWeight: 'bold',
      }}
    >
      {assignment.name}
    </span>
    <span
      style={{
        position: 'absolute',
        left: '20px',
        top: '50px',
        cursor: 'pointer',
        marginTop: '0px',
        fontFamily: "'Radio Canada', sans-serif",
        color: '#9DCDCD',
      }}
    >
      {formatDate(assignment.createdDate)}
    </span>
    <span
      style={{
        position: 'absolute',
        right: '10px',
        top: '50px',
        cursor: 'pointer',
        fontWeight: 'bold',
        width: '60px',
        marginTop: '0px',
        fontFamily: "'Radio Canada', sans-serif",
        color: '#020CFF',
      }}
    >
      {assignment.type}
    </span>
    <span
      style={{
        position: 'absolute',
        left: '20px',
        bottom: '10px',
        fontSize: '12px',
        fontFamily: "'Radio Canada', sans-serif",
        color: 'lightgrey',
      }}
    >
      {assignment.createdAt && assignment.createdAt.toDate().toLocaleString()}
    </span>
  </li>
))}
 {sortBy === 'student' && filteredStudents.map((student, index) => (
    <li
      key={student.uid}
      onClick={() => navigate(`/class/${classId}/student/${student.uid}/grades`)}
      style={{
        backgroundColor: 'white',
        fontSize: '23px',
        color: 'black',
        width: '420px',
        height: '70px',
        margin: '25px',
        position: 'relative',
        fontFamily: "'Radio Canada', sans-serif",
        transition: '.3s',
        listStyleType: 'none',
        textAlign: 'center',
        border: '3px solid lightgrey',
        padding: '10px',
        borderRadius: '10px',
        transform: 'scale(1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '100%';
        e.currentTarget.style.boxShadow = '0px 4px 4px 0px rgba(0, 0, 0, 0.25)';
        e.currentTarget.style.transform = 'scale(1.02)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '100%';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      <h1
        style={{
          cursor: 'pointer',
          fontFamily: "'Radio Canada', sans-serif",
          marginTop: '15px',
          fontSize: '30px',
          fontWeight: 'bold',
        }}
      >
        {student.name}
      </h1>
    </li>
  ))}
        </ul>
      </div>
    </div>
  );
}

export default TeacherGradesHome;
