import React, { useState, useEffect } from 'react';
import { auth, db } from '../Universal/firebase';
import { collection, query, where, getDocs, updateDoc, doc, getDoc, onSnapshot, writeBatch } from "firebase/firestore";
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Pencil, SquareX, PencilOff, Timer, Chain, SquareArrowOutUpRight, ChartBarIcon, ChartBarIncreasing, Link } from 'lucide-react';
import Navbar from '../Universal/Navbar';
import CopyLinkButton from './CopyLinkButton';

const Participants = () => {
  const [currentClass, setCurrentClass] = useState({});
  const teacherUID = auth.currentUser.uid;
  const { classId } = useParams();
  const [timeMultipliers, setTimeMultipliers] = useState({});
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  const navigateToStudentGrades = (studentUid) => {
    navigate(`/class/${classId}/student/${studentUid}/grades`);
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const classDoc = await getDoc(doc(db, 'classes', classId));
        if (!classDoc.exists()) return;
  
        const classData = classDoc.data();
        const processedParticipants = classData.participants || [];
  
        setCurrentClass({
          ...classData,
          participants: processedParticipants,
        });
  
        const timeMultipliersObj = {};
        for (const participant of processedParticipants) {
          timeMultipliersObj[participant.uid] = 
            participant.timeMultiplier !== undefined ? participant.timeMultiplier : 1;
        }
        setTimeMultipliers(timeMultipliersObj);
  
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };
  
    fetchInitialData();
  }, [classId]);

  useEffect(() => {
    if (!classId) return;
  
    let participantUnsubscribers = [];
    const classRef = doc(db, 'classes', classId);
  
    const unsubscribeClass = onSnapshot(classRef, async (snapshot) => {
      if (!snapshot.exists()) return;
  
      const classData = snapshot.data();
      const processedParticipants = classData.participants || [];
  
      setCurrentClass(prev => ({
        ...prev,
        ...classData,
        participants: processedParticipants
      }));
  
      const timeMultipliersObj = {};
      processedParticipants.forEach(participant => {
        timeMultipliersObj[participant.uid] = 
          participant.timeMultiplier !== undefined ? participant.timeMultiplier : 1;
      });
      setTimeMultipliers(timeMultipliersObj);
  
      participantUnsubscribers.forEach(unsubscribe => unsubscribe());
      participantUnsubscribers = [];
  
      processedParticipants.forEach(participant => {
        const unsubscribe = onSnapshot(
          doc(db, 'students', participant.uid),
          (studentSnapshot) => {
            if (studentSnapshot.exists()) {
              const studentData = studentSnapshot.data();
              setTimeMultipliers(prev => {
                if (prev[participant.uid] !== studentData.timeMultiplier) {
                  return {
                    ...prev,
                    [participant.uid]: studentData.timeMultiplier || 1
                  };
                }
                return prev;
              });
            }
          }
        );
        participantUnsubscribers.push(unsubscribe);
      });
    });
  
    return () => {
      unsubscribeClass();
      participantUnsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [classId]);

  const handleTimeMultiplierChange = async (studentUid, multiplier) => {
    const newMultiplier = parseFloat(multiplier) || 1;
  
    try {
      setTimeMultipliers(prev => ({ ...prev, [studentUid]: newMultiplier }));
  
      const batch = writeBatch(db);
      const studentRef = doc(db, 'students', studentUid);
      const classRef = doc(db, 'classes', classId);
  
      batch.update(studentRef, { timeMultiplier: newMultiplier });
  
      const updatedParticipants = currentClass.participants.map(participant =>
        participant.uid === studentUid
          ? { ...participant, timeMultiplier: newMultiplier }
          : participant
      );
      batch.update(classRef, { participants: updatedParticipants });
  
      await batch.commit();
    } catch (error) {
      console.error("Error updating time multiplier:", error);
      setTimeMultipliers(prev => ({ ...prev, [studentUid]: prev[studentUid] }));
    }
  };

  const handleRemoveStudent = async (studentUID) => {
    try {
      const classRef = doc(db, 'classes', classId);
      const updatedParticipants = currentClass.participants.filter(student => student.uid !== studentUID);
      const updatedStudents = currentClass.students.filter(uid => uid !== studentUID);

      await updateDoc(classRef, {
        participants: updatedParticipants,
        students: updatedStudents
      });

      setCurrentClass(prev => ({
        ...prev,
        participants: updatedParticipants,
        students: updatedStudents
      }));
    } catch (error) {
      console.error("Error removing student:", error);
    }
  };

  const removeAccommodations = async (studentUid) => {
    try {
      setTimeMultipliers(prev => ({ ...prev, [studentUid]: 1 }));
  
      const studentRef = doc(db, 'students', studentUid);
      const classRef = doc(db, 'classes', classId);
  
      await Promise.all([
        updateDoc(studentRef, { timeMultiplier: 1 }),
        updateDoc(classRef, {
          participants: currentClass.participants.map(participant =>
            participant.uid === studentUid
              ? { ...participant, timeMultiplier: 1 }
              : participant
          )
        })
      ]);
    } catch (error) {
      console.error("Error removing accommodations:", error);
      setTimeMultipliers(prev => ({ ...prev, [studentUid]: prev[studentUid] }));
    }
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  const sortedParticipants = currentClass.participants
    ? [...currentClass.participants].sort((a, b) =>
        (a.name || '').split(' ').pop().localeCompare((b.name || '').split(' ').pop())
      )
    : [];

  return (
    <div style={{
      minHeight: '100vh',
      width: 'calc(100% - 200px)',
      marginLeft: '200px',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      <Navbar userType="teacher" />
      
      <div style={{ borderBottom:'1px solid lightgrey', height: '128px', position: 'fixed', width: 'calc(100% - 200px)', background: 'rgb(255,255,255,.9)', backdropFilter: 'blur(5px)', zIndex: "10",  }}>
        <div style={{ display: 'flex', marginLeft: '4%', height: '70px', paddingTop: '10px', marginBottom: '60px', marginTop: '0px' }}>
          <h1 style={{ fontSize: '30px' }}>Students</h1>
          <div style={{
            fontSize: '40px',
            marginTop: '20px',
            width: '210px',
            height: "25px",
            paddingLeft: '20px',
            display: 'flex',
            color: '#FFAE00',
            lineHeight: '20px',
            background: '#FFF5D3',
            marginRight: '4%',
            fontFamily: "'montserrat', sans-serif",
            fontWeight: '600',
            marginLeft: 'auto'
          }}>
            {currentClass.classCode}
            <CopyLinkButton
  classCode={currentClass.classCode}
  className={currentClass.className}
  classChoice={currentClass.classChoice}
/>
          </div>
        </div>











        <div style={{ width: '100%', marginLeft: 'auto', marginRight: 'auto', display: 'flex', marginTop: '-60px', marginBottom: '-10px',  }}>
        <h1 style={{ fontWeight: '600', fontSize: '20px', marginLeft: '4%', marginTop: '0px', color: 'lightgrey' }}>
          {currentClass.participants ? currentClass.participants.length : 0} Enrolled
        </h1>

        <button
          onClick={toggleEditMode}
          style={{
            fontSize: '12px',
            textDecoration: 'none',
            color: 'grey',
            marginLeft: 'auto',
            height: '30px',
            backgroundColor: 'white',
            border: '1px solid #D2D2D2',
            fontFamily: "'montserrat', sans-serif",
            padding: '0px',
            marginTop: '0px', 
            paddingLeft: '10px',
            width: '85px',
            marginRight: '4%',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          {isEditing ? (
            <div style={{ marginTop: '3px', marginLeft: '0px', display: 'flex' }}>
              <h1 style={{fontSize: '16px', fontWeight: '600', marginTop: '2px', marginRight: '8px'}}>Done</h1>
              <PencilOff size={14} color="lightgrey" strokeWidth={2} style={{marginTop:'4px'}} />
            </div>
          ) : (
            <div style={{ marginTop: '3px', marginLeft: '0px', display: 'flex' }}>
              <h1 style={{fontSize: '16px', fontWeight: '600', marginTop: '2px', marginRight: '8px'}}>Edit</h1>
              <Pencil size={14} color="grey" strokeWidth={2} style={{marginTop:'4px'}} />
            </div>
          )}
        </button>
      </div>


















      </div>

 

      <div style={{
        marginTop: '130px',
        marginBottom: '100px',
      }}>
        <div style={{
          width: '100%',
          background: 'white',
        }}>
          {sortedParticipants.map((student) => (
            <StudentRow
              key={student.uid}
              student={student}
              isEditing={isEditing}
              timeMultipliers={timeMultipliers}
              handleTimeMultiplierChange={handleTimeMultiplierChange}
              removeAccommodations={removeAccommodations}
              handleRemoveStudent={handleRemoveStudent}
              navigateToStudentGrades={navigateToStudentGrades}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const StudentRow = ({ student, isEditing, timeMultipliers, handleTimeMultiplierChange, removeAccommodations, handleRemoveStudent, navigateToStudentGrades }) => {
  const [firstName, ...lastNameParts] = student.name.split(' ');
  const lastName = lastNameParts.join(' ');

  const confirmAndRemoveStudent = () => {
    if (window.confirm(`Are you sure you want to remove ${student.name} from this class?`)) {
      handleRemoveStudent(student.uid);
    }
  };

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      height: '60px',
      borderBottom: '1px solid #ededed',
      position: 'relative',
    }}>
      {/* Name */}
      <div
        style={{ 
          cursor: 'pointer',
          paddingLeft: '4%',
          width: '30%',
          fontSize: '16px',
          fontWeight: '600'
        }}
        onClick={() => navigateToStudentGrades(student.uid)}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'blue';
          e.currentTarget.style.textDecoration = 'underline';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'black';
          e.currentTarget.style.textDecoration = 'none';
        }}
      >
        {lastName}, {firstName}
      </div>

      {/* Email */}
      <div style={{ 
        flex: 1,
        color: 'grey'
      }}>
        {student.email}
      </div>

      {/* Extended Time */}
      <div style={{
        marginRight: isEditing ? '8%' : '4%',
        display: 'flex',
        alignItems: 'center'
      }}>
        {timeMultipliers[student.uid] !== 1 && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Timer size={20} color="grey" style={{ marginRight: '5px' }} />
            {isEditing ? (
              <input
                type="number"
                min="1"
                value={timeMultipliers[student.uid]}
                onChange={(e) => handleTimeMultiplierChange(student.uid, e.target.value)}
                style={{
                  width: '50px',
                  height: '25px',
                  marginRight: '5px',
                  textAlign: 'center'
                }}
              />
            ) : (
              <span>{(timeMultipliers[student.uid] * 100)}%</span>
            )}
            {isEditing && (
              <button
                onClick={() => removeAccommodations(student.uid)}
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: 'grey'
                }}
              >
                ×
              </button>
            )}
          </div>
        )}
        {isEditing && timeMultipliers[student.uid] === 1 && (
          <button
            onClick={() => handleTimeMultiplierChange(student.uid, 1.5)}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Timer size={20} color="lightgrey" />
            <span style={{ marginLeft: '5px', color: 'lightgrey' }}>+</span>
          </button>
        )}
      </div>

      {/* Remove Button */}
      {isEditing && (
        <button
          onClick={confirmAndRemoveStudent}
          style={{
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            padding: '5px',
            position: 'absolute',
            right: '4%'
          }}
        >
          <SquareX size={20} color="#e60000" strokeWidth={2} />
        </button>
      )}
    </div>
  );
};

export default Participants;