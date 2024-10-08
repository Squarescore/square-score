import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from "firebase/firestore";
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Pencil, SquareX, SquareCheck, Users } from 'lucide-react';
import Navbar from './Navbar';
const Participants = () => {
  const [currentClass, setCurrentClass] = useState({});
  const teacherUID = auth.currentUser.uid;
  const { classId } = useParams();
  const [timeMultipliers, setTimeMultipliers] = useState({});
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false); // New state for edit mode
  const navigateToStudentGrades = (studentUid) => {
    navigate(`/class/${classId}/student/${studentUid}/grades`);
  };
  useEffect(() => {
    const fetchClass = async () => {
      try {
        const classDocRef = doc(db, 'classes', classId);
        const classDoc = await getDoc(classDocRef);
  
        if (!classDoc.exists()) {
          console.log("No such document exists");
          return;
        }
  
        let classData = classDoc.data();
        console.log("Class Data:", classData);
  
        // Fetch full names for participants
        if (Array.isArray(classData.participants)) {
          const updatedParticipants = await Promise.all(classData.participants.map(async (participant) => {
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
          }));
          classData.participants = updatedParticipants;
        }
  
        // Fetch full names for join requests
        if (Array.isArray(classData.joinRequests)) {
          const updatedJoinRequests = await Promise.all(classData.joinRequests.map(async (requestUID) => {
            const studentDocRef = doc(db, 'students', requestUID);
            const studentDoc = await getDoc(studentDocRef);
            if (studentDoc.exists()) {
              const studentData = studentDoc.data();
              return {
                uid: requestUID,
                name: `${studentData.firstName.trim()} ${studentData.lastName.trim()}`,
                email: studentData.email
              };
            }
            return null;
          }));
          classData.joinRequests = updatedJoinRequests.filter(request => request !== null);
        }
  
        setCurrentClass(classData);
  
        // Fetch time multipliers for participants
        const newTimeMultipliers = {};
        if (Array.isArray(classData.participants)) {
          for (const participant of classData.participants) {
            const studentDocRef = doc(db, 'students', participant.uid);
            const studentDoc = await getDoc(studentDocRef);
            if (studentDoc.exists()) {
              const studentData = studentDoc.data();
              newTimeMultipliers[participant.uid] = studentData.timeMultiplier || 1;
            }
          }
        }
        setTimeMultipliers(newTimeMultipliers);
      } catch (error) {
        console.error("Error fetching class:", error);
      }
    };
  
    fetchClass();
  
    // Set up interval to fetch join requests every 6 seconds
    const intervalId = setInterval(fetchClass, 6000);
  
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [classId]);
  


  useEffect(() => {
    if (isEditing) {
      const saveTimeMultipliers = async () => {
        for (const [studentUid, multiplier] of Object.entries(timeMultipliers)) {
          const studentRef = doc(db, 'students', studentUid);
          await updateDoc(studentRef, { timeMultiplier: multiplier });
        }
      };
      saveTimeMultipliers();
    }
  }, [timeMultipliers, isEditing]);

  const formatMultiplier = (multiplier) => `${(multiplier * 100).toFixed(0)}%`;

  const handleTimeMultiplierChange = (studentUid, multiplier) => {
    setTimeMultipliers(prev => ({ ...prev, [studentUid]: parseFloat(multiplier) || 1 }));
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };


  const handleRemoveStudent = async (studentUID) => {
    const classRef = doc(db, 'classes', classId);
    
    // Remove the student from the participants array
    const updatedParticipants = currentClass.participants.filter(student => student.uid !== studentUID);
    
    // Remove the student's UID from the students array
    const updatedStudents = currentClass.students.filter(uid => uid !== studentUID);
    
    // Update the Firestore document
    await updateDoc(classRef, { 
      participants: updatedParticipants,
      students: updatedStudents
    });
    
    // Update the local state
    setCurrentClass(prevState => ({
      ...prevState,
      participants: updatedParticipants,
      students: updatedStudents
    }));
  };
  const handleAdmitStudent = async (student) => {
    const classRef = doc(db, 'classes', classId);
    const participants = [...(currentClass.participants || []), {
      uid: student.uid,
      name: student.name,
      email: student.email
    }];
    const joinRequests = currentClass.joinRequests.filter(req => req.uid !== student.uid);
    const students = [...(currentClass.students || []), student.uid];  // Add the student's UID to the students array
    participants.sort((a, b) => a.name.split(' ').pop().localeCompare(b.name.split(' ').pop())); // Sort by last name
    await updateDoc(classRef, { participants, joinRequests, students });  // Update the Firestore document
    setCurrentClass({ ...currentClass, participants, joinRequests, students }); // Update local state
  };
  const handleRejectStudent = async (studentUID) => {
    const classRef = doc(db, 'classes', classId);
    
    // Remove the student from the joinRequests array
    const updatedJoinRequests = currentClass.joinRequests.filter(req => req.uid !== studentUID);
    
    // Update the Firestore document
    await updateDoc(classRef, { 
      joinRequests: updatedJoinRequests
    });
    
    // Update the local state
    setCurrentClass(prevState => ({
      ...prevState,
      joinRequests: updatedJoinRequests
    }));
  };
  const handleBack = () => {
    navigate(-1);
  };
  return (
    <div style={{  display: 'flex', flexDirection: 'column', backgroundColor: 'white',paddingBottom: '30px' }}>
  
  <style>
    {`
      .tooltip {
        position: relative;
        display: inline-block;
      }
      .tooltip .tooltiptext {
        visibility: hidden;
        width: 220px;
        background-color: rgba(250,250,250,0.8);
        box-shadow: 2px 2px 2px 2px rgb(0,0,0,.1);
        padding: 10px;
        backdrop-filter: blur(5px); 
        color: grey;
        text-align: center;
        border-radius: 6px;
        position: absolute;
        z-index: 1;
        bottom: 100%;
        left: 50%;
        margin-left: -110px; /* Use half of the width of the tooltip */
        opacity: 0;
        transition: opacity 0.3s;
      }
      .tooltip:hover .tooltiptext {
        visibility: visible;
        opacity: 1;
      }
    `}
  </style>
  <Navbar userType="teacher" />
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1% auto', width: '1000px', marginTop: '0px', }}>
    <div style={{width: '700px', marginTop: '70px', }}>
      {(currentClass.joinRequests || []).map(student => (

        <div key={student.uid} style={{ width: '700px', display: 'flex', border: '6px solid #f4f4f4', borderTop: 'none', marginLeft: '-30px',
       
        borderBottomRightRadius: '15px',borderBottomLeftRadius: '15px', padding: '10px', marginBottom: '10px', height: '70px' }}>
           <span style={{backgroundColor: 'transparent', borderColor: 'transparent',fontFamily: "'Radio Canada', sans-serif", fontSize: '30px', marginTop: '20px', marginLeft: '50px', marginRight: '30px', color: 'grey'}}>Admit</span>
          <span style={{backgroundColor: 'transparent', borderColor: 'transparent',fontFamily: "'Radio Canada', sans-serif",  fontSize: '30px', marginTop: '20px',marginRight: '20px'}}>{student.name.split(' ')[1]},</span>
          <span style={{backgroundColor: 'transparent', borderColor: 'transparent',fontFamily: "'Radio Canada', sans-serif", fontSize: '30px', marginTop: '20px',marginRight: '20px',  fontWeight: 'bold'}}>{student.name.split(' ')[0]}</span>
          <span style={{backgroundColor: 'transparent', borderColor: 'transparent',fontFamily: "'Radio Canada', sans-serif", fontSize: '30px',marginTop: '20px',marginLeft: '10px', color: 'grey'}}>?</span>
          
          <div style={{marginLeft: 'auto', marginRight: '30px', marginTop: '20px'}}>
            <button style={{backgroundColor: 'transparent', borderColor: 'transparent',fontFamily: "'Radio Canada', sans-serif", cursor: 'pointer'}} onClick={() => handleAdmitStudent(student)}>                  
            <SquareCheck size={40} color="#00b303" strokeWidth={2} /></button>
            <button style={{backgroundColor: 'transparent', borderColor: 'transparent',fontFamily: "'Radio Canada', sans-serif", cursor: 'pointer', marginLeft: '20px'}} onClick={() => handleRejectStudent(student.uid)}>  \
            <SquareX size={40} color="#e60000" strokeWidth={2} /></button>
        </div>
        </div>
      ))}
    </div>
  </div>
  
 

  <div style={{width: '750px', display: 'flex', marginLeft: 'auto', marginRight: 'auto', marginTop: '0px', height: '150px'}}>
    <h1 style={{ fontSize: '70px', marginTop: '30px', width: '270px',  marginRight: '20px',fontFamily: "'Rajdhani', sans-serif", }}>Students</h1>
    <div className="tooltip">
      <button 
        onClick={toggleEditMode}
        style={{ 
          fontSize: '12px',
          textDecoration: 'none',
          color: 'blue',
         marginTop: '5px',
          backgroundColor: 'transparent',
          fontFamily: "'Radio Canada', sans-serif",
          border: 'none', 
          marginRight: '350px',
          cursor: 'pointer' 
        }}
      >
        {isEditing ? <h1 style={{marginTop: '50px'}}>Done</h1> : <div style={{marginTop:'50px'}}><Pencil size={30} color="#8f8f8f" strokeWidth={3} /></div>}
      </button>
   
      
    </div>
   
   
</div>
<div style={{width: '610px', marginLeft: 'auto', marginRight: 'auto',marginBottom: '30px', }}>
<div style={{width: '610px', display: 'flex', border: '4px solid #FFAA00',  marginLeft: '-64px', marginTop: '-30px', 
       background: '#FFF2AD',
       borderRadius: '10px', padding: '10px', marginBottom: '10px', height: '30px'}}>
  
  <h1 style={{fontSize: '30px', color: '#FFAA00', marginTop: '-3px',fontFamily: "'Radio Canada', sans-serif"}}>Class Code:</h1>  
       <h2 style={{ marginLeft: '20px', fontSize: '35px', marginTop: '-5px', fontWeight: 'bold', color: '#FFAA00',  fontFamily: "'Rajdhani', sans-serif",}}>
      {currentClass.classCode}
    </h2>
    
  </div>
  </div>
{currentClass.participants && currentClass.participants.length > 0 ? (
        currentClass.participants.map(student => (
      <div key={student.uid} style={{ zIndex: 10, width: '600px',  marginLeft: '-100px',display: 'flex', flexDirection: 'row',color: 'grey', fontSize: '20px', justifyContent: 'space-between', border: '4px solid #f4f4f4',borderRadius: '10px', padding: '15px', marginBottom: '30px', alignSelf: 'center', backgroundColor: 'white', position: 'relative' }}>
        <div style={{ width: '50%' }}>
          {timeMultipliers[student.uid] !== 1 && timeMultipliers[student.uid] !== undefined ? (
            <div 
              className="accomodations-tag"
              style={{ 
                position: 'absolute', 
                top: '-25px',
                zIndex: 0,
                padding: '0px', 
                paddingLeft: '4px', 
                paddingTop: '3px',
                paddingRight: '4px',
                height:'20px',
                borderColor: isEditing ?  'lightgrey': '#FFAA00',
                backgroundColor: isEditing ?  '#f4f4f4': '#FFF0A1', 
                width: isEditing ? '175px' : '115px',
                fontFamily: "'Radio Canada', sans-serif", 
                marginLeft: '30px', 
                color: isEditing ? 'grey':'#FFAA00', 
                fontWeight: 'bold', 
                borderTopRightRadius: '5px', 
                borderTopLeftRadius: '5px', 
                fontSize: '14px',
                transition: 'width 0.3s',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                if (!isEditing) {
                  e.currentTarget.style.width = '210px';
                  e.currentTarget.querySelector('.time-multiplier').style.display = 'inline';
                }
              }}
              onMouseLeave={(e) => {
                if (!isEditing) {
                  e.currentTarget.style.width = '115px';
                  e.currentTarget.querySelector('.time-multiplier').style.display = 'none';
                }
              }}
            >
              <span style={{ marginLeft: '5px' , }}>Accomodations</span>
              <span className="time-multiplier" style={{ marginLeft: '5px', display: isEditing ? 'inline' : 'none' }}>
                {isEditing ? (
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    value={timeMultipliers[student.uid]}
                    onChange={(e) => handleTimeMultiplierChange(student.uid, e.target.value)}
                    style={{ width: '50px', height: '16px', color: '#FC8518',borderRadius: '5px', border: '2px solid #FC8518', fontWeight: 'bold', background: '#FFF0A1', outline:'rgb(72, 164, 158)', borderColor: 'transparent'}}
                  />
                ) : (
                  `( Time: ${formatMultiplier(timeMultipliers[student.uid])})`
                )}
              </span>
            </div>
          ) : isEditing && (
            <div 
              className="add-accomodations" 
              onClick={() => handleTimeMultiplierChange(student.uid, 1.5)}
              style={{ 
                position: 'absolute', 
                top: '-26px',
                
                padding: '1px', 
                paddingLeft: '4px', 
                paddingRight: '4px',
                backgroundColor: 'white', 
                width: '120px', 
                fontFamily: "'Radio Canada', sans-serif", 
                marginLeft: '30px', 
                border: '4px dashed lightgrey',
                borderBottom: '2px solid TRANSPARENT',
                color: 'grey', 
                fontWeight: 'bold', 
                borderTopRightRadius: '5px', 
                borderTopLeftRadius: '5px', 
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              + Accomodations
            </div>
          )}
          <div   onClick={() => navigateToStudentGrades(student.uid)}
          style={{cursor: 'pointer'}}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'blue';
        e.currentTarget.style.textDecoration = 'underline';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'inherit';
        e.currentTarget.style.textDecoration = 'none';
      }}>
          <span style={{ backgroundColor: 'transparent', borderColor: 'transparent', fontFamily: "'Radio Canada', sans-serif", marginLeft: '30px' }}>{student.name.split(' ')[1]},</span>
          <span style={{ backgroundColor: 'transparent', borderColor: 'transparent', fontFamily: "'Radio Canada', sans-serif", fontWeight: 'bold', marginLeft: '10px' }}>{student.name.split(' ')[0]}</span>
        </div>
        </div>
        <div style={{ marginRight: 'auto' }}>
          <span style={{ backgroundColor: 'transparent', borderColor: 'transparent', fontSize: '14px', fontFamily: "'Radio Canada', sans-serif", marginLeft: '-20px'}}> {student.email}</span>
        </div>
        {isEditing && (
          <button onClick={() => handleRemoveStudent(student.uid)} style={{ backgroundColor: 'transparent', fontFamily: "'Radio Canada', sans-serif", borderColor: 'transparent', color: 'red', position: 'absolute', right: '-10px', top: '-10px' ,
           
           zIndex: '990',
                  height: '30px', 
                  width: '30px',
                  borderRadius: '6px',
                  background: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  
                }}
              >
                <div style={{marginTop: '-2px', marginLeft: '-4px', }}>
                <SquareX size={30} color="#e60000" strokeWidth={3} /></div>
          
              </button>
        )}
      </div>
  ))
) : (
  <div style={{
    width: '600px',
    marginLeft: 'auto',
    marginRight: 'auto',

    textAlign: 'left',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '10px',
    fontFamily: "'Radio Canada', sans-serif",
    fontSize: '18px',
    color: '#666'
  }}>
    <h1 style={{color: 'lightgrey', fontSize: '24px', marginLeft: '-80px'}}>Add your first students by having them input the class code in their join class page, their requests will show up here</h1>
  </div>
)}
</div>
);
};

export default Participants;