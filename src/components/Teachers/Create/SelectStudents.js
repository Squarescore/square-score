import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../Universal/firebase';

const SelectStudents = ({ classId, selectedStudents, setSelectedStudents }) => {
  const [students, setStudents] = useState([]);
  const [initialLoad, setInitialLoad] = useState(true);

  // Memoize the fetch students function to prevent unnecessary re-renders
  const fetchStudents = useCallback(async () => {
    try {
      const classDocRef = doc(db, 'classes', classId);
      const classDoc = await getDoc(classDocRef);
      const classData = classDoc.data();
      
      if (classData && classData.participants) {
        const updatedParticipants = await Promise.all(
          classData.participants.map(async (participant) => {
            const studentDocRef = doc(db, 'students', participant.uid);
            const studentDoc = await getDoc(studentDocRef);
            if (studentDoc.exists()) {
              const studentData = studentDoc.data();
              return {
                ...participant,
                name: `${studentData.firstName.trim()} ${studentData.lastName.trim()}`
              };
            }
            return participant;
          })
        );
        
        const sortedStudents = updatedParticipants.sort((a, b) => 
          a.name.split(' ').pop().localeCompare(b.name.split(' ').pop())
        );
        
        setStudents(sortedStudents);
        
        // Only set all students as selected on initial load if no students are currently selected
        if (initialLoad && selectedStudents.size === 0) {
          const studentIds = sortedStudents.map(student => student.uid);
          setSelectedStudents(new Set(studentIds));
        }
        setInitialLoad(false);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  }, [classId, selectedStudents.size, initialLoad, setSelectedStudents]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleStudentClick = useCallback((studentUid) => {
    setSelectedStudents(prev => {
      const updated = new Set(prev);
      if (updated.has(studentUid)) {
        updated.delete(studentUid);
      } else {
        updated.add(studentUid);
      }
      return updated;
    });
  }, [setSelectedStudents]);

  return (
    <div style={{ overflow: 'auto', padding: '0 10px', width: '590px', height: '400px', marginTop: '160px' }}>
      <div style={{ 
        display: 'flex', 
        marginTop: '15px',
        marginBottom: '15px',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        gap: '10px', 
      }}>
        {students.map(student => (
          <div
            key={student.uid}
            onClick={() => handleStudentClick(student.uid)}
            style={{
              width: 'calc(31.5% - 12px)',
              padding: '10px',
              border: `1px solid ${selectedStudents.has(student.uid) ? '#2BB514' : '#fcfcfc'}`,
              borderRadius: '20px',
              height: '35px',
              alignItems: 'center',
              cursor: 'pointer',
              fontSize: '12px',
              textAlign: 'center',
              display: 'flex',
              justifyContent: 'center',
              backgroundColor: 'white',
              color: ` ${selectedStudents.has(student.uid) ? 'black' : 'grey'}`,
              fontWeight: '500',
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
};

export default SelectStudents;