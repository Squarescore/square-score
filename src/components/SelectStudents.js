import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

function SelectStudents({ classId, selectedStudents = new Set(), setSelectedStudents }) {
  const [students, setStudents] = useState([]);

  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  useEffect(() => {
    const fetchStudents = async () => {
      const classDocRef = doc(db, 'classes', classId);
      const classDoc = await getDoc(classDocRef);
      const classData = classDoc.data();
      if (classData && classData.participants) {
        const sortedStudents = classData.participants.sort((a, b) => a.name.split(' ').pop().localeCompare(b.name.split(' ').pop()));
        setStudents(sortedStudents);
        // Set all students as selected by default
        const studentIds = sortedStudents.map(student => student.uid);
        setSelectedStudents(new Set(studentIds));
      }
    };
    fetchStudents();
  }, [classId]);

  const handleStudentClick = (studentUid) => {
    const updatedSelectedStudents = new Set(selectedStudents);
    if (updatedSelectedStudents.has(studentUid)) {
      updatedSelectedStudents.delete(studentUid);
    } else {
      updatedSelectedStudents.add(studentUid);
    }
    setSelectedStudents(updatedSelectedStudents);
  };

  return (
    <div onClick={stopPropagation} style={{ maxHeight: '420px', overflow: 'auto', padding: '0 10px' ,}}>
     
      <div style={{ 
        display: 'flex', 
         marginTop: '15px',
         marginBottom: '15px',
        flexWrap: 'wrap', 
        width: '600px',
        
        justifyContent: 'flex-start',
        gap: '10px', 
      }}>
        {students.map(student => (
          <div
            key={student.uid}
            onClick={() => handleStudentClick(student.uid)}
            style={{
              width: 'calc(30% - 10px)',
              padding: '10px',
              border: `6px solid ${selectedStudents.has(student.uid) ? '#73D87D' : 'lightgrey'}`,
              borderRadius: '5px',
              height: '50px',
              alignItems: 'center' ,
              cursor: 'pointer',
              textAlign: 'center',
              display: 'flex',
              justifyContent: 'center',
              backgroundColor: 'white',
              color:  'black',
              fontWeight: 'bold',
              transition: 'all 0.2s ease',
              userSelect: 'none',
              boxSizing: 'border-box',
            }}
          >
            {student.name.split(' ')[1]}, {student.name.split(' ')[0]}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SelectStudents;