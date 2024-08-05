import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { v4 as uuidv4 } from 'uuid';
import Navbar from './Navbar';
import { arrayUnion } from 'firebase/firestore';
import { updateDoc } from 'firebase/firestore';
import './SwitchYellow.css';

const TeacherAssignmentHome = () => {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [className, setClassName] = useState('');
  const [selectedAssignmentType, setSelectedAssignmentType] = useState(null);
  const [isAdaptive, setIsAdaptive] = useState(false);

  useEffect(() => {
    const fetchClassData = async () => {
      const classDocRef = doc(db, 'classes', classId);
      const classDoc = await getDoc(classDocRef);

      if (classDoc.exists) {
        setClassName(classDoc.data().className);
      }
    };

    fetchClassData();
  }, [classId]);

  const handleBack = () => {
    navigate(-1);
  };const handleContinue = async () => {
    const newAssignmentId = uuidv4();
    let assignmentId = `${classId}+${newAssignmentId}+`;
    let collectionName = '';
    let classFieldName = '';
    let navigationPath = '';
  
    if (selectedAssignmentType === 'short-answer') {
      if (isAdaptive) {
        assignmentId += 'ASAQ';
        collectionName = 'assignments(Asaq)';
        classFieldName = 'assignment(Asaq)';
        navigationPath = `/class/${classId}/SAQA/${assignmentId}`;
      } else {
        assignmentId += 'SAQ';
        collectionName = 'assignments(saq)';
        classFieldName = 'assignment(saq)';
        navigationPath = `/class/${classId}/createassignment/${assignmentId}`;
      }
    } else if (selectedAssignmentType === 'multiple-choice') {
      if (isAdaptive) {
        assignmentId += 'AMCQ';
        collectionName = 'assignments(Amcq)';
        classFieldName = 'assignment(Amcq)';
        navigationPath = `/class/${classId}/MCQA/${assignmentId}`;
      } else {
        assignmentId += 'MCQ';
        collectionName = 'assignments(mcq)';
        classFieldName = 'assignment(mcq)';
        navigationPath = `/class/${classId}/MCQ/${assignmentId}`;
      }
    }
  
    // Create the assignment document in the appropriate collection
    const assignmentData = {
      classId,
      assignmentType: selectedAssignmentType,
      isAdaptive,
      assignmentId
    };
    
    const assignmentRef = doc(db, collectionName, assignmentId);
    await setDoc(assignmentRef, assignmentData);
  
    // Update the class document with the new assignment ID
    const classRef = doc(db, 'classes', classId);
    await updateDoc(classRef, {
      [classFieldName]: arrayUnion(assignmentId)
    });
  
    navigate(navigationPath);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
      <Navbar userType="teacher" />
      <div style={{width: '1000px', marginLeft: 'auto', marginRight: 'auto'}}>
        <h1 style={{marginLeft: '100px', marginTop: '100px', color: 'black', fontSize: '60px', display: 'flex', fontFamily: '"Rajdhani", sans-serif'}}>
          Create <h1 style={{fontSize: '30px', marginLeft: '30px', color: 'grey'}}>Step 1 - Format</h1>
        </h1>
        <div style={{ display: 'flex', marginTop: '10px', justifyContent: 'space-evenly', flexDirection: 'column', width: '800px', height: '550px', border: '10px solid lightgrey', 
          marginLeft: 'auto', marginRight: 'auto', borderRadius: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <button
              onClick={() => setSelectedAssignmentType('multiple-choice')}
              style={{
                padding: '7px',
                marginRight: '20px',
                width: '320px',
                border: selectedAssignmentType === 'multiple-choice' ? '7px solid #45B434' : '7px solid transparent',
                borderRadius: '20px',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                transition: 'border 0.2s',
              }}
            >
              <h1 style={{marginBottom: '0px', fontSize: '35px'}}>Multiple Choice</h1>
              <img style={{width: '220px'}} src="/MCQ.png" alt="Multiple Choice" />
            </button>
            <button
              onClick={() => setSelectedAssignmentType('short-answer')}
              style={{
                width: '320px',
                padding: '7px',
                border: selectedAssignmentType === 'short-answer' ? '7px solid #627BFF' : '7px solid transparent',
                borderRadius: '20px',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                transition: 'border 0.2s',
              }}
            >
              <h1 style={{marginBottom: '0px', fontSize: '35px'}}>Short Answer</h1>
              <img style={{width: '220px'}} src="/SAQ.png" alt="Short Answer" />
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '15px' }}>
            <label style={{ marginRight: '40px', fontSize: '60px', fontFamily: "'Radio Canada', sans-serif", fontWeight: 'bold' }}>
              Adaptive:
            </label>
            <input
              style={{marginTop: '15px'}}
              type="checkbox"
              className="yellowSwitch"
              checked={isAdaptive}
              onChange={(e) => setIsAdaptive(e.target.checked)}
            />
          </div>
        </div>
        {selectedAssignmentType && (
          <button
            onClick={handleContinue}
            style={{
              position: 'fixed',
              width: '75px',
              height: '75px',
              padding: '10px 20px',
              right: '10%',
              top: '460px',
              bottom: '20px',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              border: 'none',
              fontSize: '30px',
              color: '#45B434',
              borderRadius: '10px',
              fontWeight: 'bold',
              fontFamily: "'Radio Canada', sans-serif",
              transition: '.5s',
              transform: 'scale(1)',
              opacity: '100%'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.04)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
            }}
          >
            <img src='/RightGreenArrow.png' style={{width: '75px', transition: '.5s'}} />
          </button>
        )}
      </div>
    </div>
  );
};

export default TeacherAssignmentHome;
