import React, { useState, useEffect } from 'react';
import { auth, db } from '../Universal/firebase';
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from "firebase/firestore";
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Pencil, SquareX, SquareCheck, Hourglass, PencilOff, PlusSquare, Timer} from 'lucide-react';
import Navbar from '../Universal/Navbar';
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
  const removeAccommodations = async (studentUid) => {
    try {
      // Update local state
      setTimeMultipliers(prev => ({ ...prev, [studentUid]: 1 }));

      // Update database
      const studentRef = doc(db, 'students', studentUid);
      await updateDoc(studentRef, { timeMultiplier: 1 });

      console.log(`Accommodations removed for student ${studentUid}`);
    } catch (error) {
      console.error("Error removing accommodations:", error);
      // If there's an error, revert the local state change
      setTimeMultipliers(prev => ({ ...prev, [studentUid]: prev[studentUid] }));
    }
  };

  useEffect(() => {
    const saveTimeMultipliers = async () => {
      for (const [studentUid, multiplier] of Object.entries(timeMultipliers)) {
        const studentRef = doc(db, 'students', studentUid);
        await updateDoc(studentRef, { timeMultiplier: multiplier });
      }
    };

    if (isEditing) {
      saveTimeMultipliers();
    }
  }, [timeMultipliers, isEditing]);

  const handleTimeMultiplierChange = async (studentUid, multiplier) => {
    const newMultiplier = parseFloat(multiplier) || 1;
    setTimeMultipliers(prev => ({ ...prev, [studentUid]: newMultiplier }));

    // If not in editing mode, update the database immediately
    if (!isEditing) {
      try {
        const studentRef = doc(db, 'students', studentUid);
        await updateDoc(studentRef, { timeMultiplier: newMultiplier });
      } catch (error) {
        console.error("Error updating time multiplier:", error);
        // If there's an error, revert the local state change
        setTimeMultipliers(prev => ({ ...prev, [studentUid]: prev[studentUid] }));
      }
    }
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
  width: 120px;
  background-color: lightgrey;
  color: #f4f4f4;
  text-align: center;
  border-radius: 6px;
  padding: 5px;
  position: absolute;
  z-index: 1;
  top: 90%;
  left: 150%; /* Changed from right to left */
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 0.3s;
}

.tooltip .tooltiptext::after {
  content: "";
  position: absolute;
  top: 38%;
  right: 100%; /* Changed from left to right */
  margin-top: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: transparent lightgrey transparent transparent; /* Adjusted for left-pointing arrow */
}

.tooltip:hover .tooltiptext {
  visibility: visible;
  opacity: 1;
}
        `}
      </style>

  <Navbar userType="teacher" />
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1% auto', width: '750px', marginTop: '0px', }}>
    <div style={{width: '700px', marginTop: '70px', }}>
      {(currentClass.joinRequests || []).map(student => (

        <div key={student.uid} style={{ width: '700px', display: 'flex', border: '6px solid #f4f4f4', borderTop: 'none', marginLeft: '-30px',
       
        borderBottomRightRadius: '15px',borderBottomLeftRadius: '15px', padding: '10px', marginBottom: '10px', height: '70px' }}>
           <span style={{backgroundColor: 'transparent', borderColor: 'transparent',fontFamily: "'montserrat', sans-serif", fontSize: '30px', marginTop: '20px', marginLeft: '50px', marginRight: '30px', color: 'grey'}}>Admit</span>
          <span style={{backgroundColor: 'transparent', borderColor: 'transparent',fontFamily: "'montserrat', sans-serif",  fontSize: '30px', marginTop: '20px',marginRight: '20px'}}>{student.name.split(' ')[1]},</span>
          <span style={{backgroundColor: 'transparent', borderColor: 'transparent',fontFamily: "'montserrat', sans-serif", fontSize: '30px', marginTop: '20px',marginRight: '20px',  fontWeight: 'bold'}}>{student.name.split(' ')[0]}</span>
          <span style={{backgroundColor: 'transparent', borderColor: 'transparent',fontFamily: "'montserrat', sans-serif", fontSize: '30px',marginTop: '20px',marginLeft: '10px', color: 'grey'}}>?</span>
          
          <div style={{marginLeft: 'auto', marginRight: '30px', marginTop: '20px'}}>
            <button style={{backgroundColor: 'transparent', borderColor: 'transparent',fontFamily: "'montserrat', sans-serif", cursor: 'pointer'}} onClick={() => handleAdmitStudent(student)}>                  
            <SquareCheck size={40} color="#00b303" strokeWidth={2} /></button>
            <button style={{backgroundColor: 'transparent', borderColor: 'transparent',fontFamily: "'montserrat', sans-serif", cursor: 'pointer', marginLeft: '20px'}} onClick={() => handleRejectStudent(student.uid)}>  \
            <SquareX size={40} color="#e60000" strokeWidth={2} /></button>
        </div>
        </div>
      ))}
    </div>
  </div>
  
 

  <div style={{width: '720px', display: 'flex', marginLeft: 'auto', marginRight: 'auto', marginTop: '60px', height: '190px', paddingTop: '10px', borderBottom: '4px solid #f4f4f4', marginBottom: '60px', }}>
   
   <div>
    <h1 style={{ fontSize: '60px', marginTop: '30px', width: '270px',  marginRight: '10px',fontFamily: "'montserrat', sans-serif", marginLeft: '0px' }}>
    {currentClass.className}</h1>

     
<div style={{display: 'flex', width: '340px', marginTop: '-45px',  marginLeft: '0px', }}> 

<div
       
        style={{ 
          textDecoration: 'none',
         marginTop: '5px',
          fontFamily: "'montserrat', sans-serif",
          border: '0px solid blue', 
          padding: '0px',
          fontWeight:'600',
          height: '50px',
          fontSize: '25px',
          marginLeft: '10px',
          width: '290px',
          textAlign: 'left',
          lineHeight: '50px',
          color: '#8C8C8C',
          marginRight: '30px',
          borderRadius: '8px',
        }}
      >
             {currentClass.participants ? currentClass.participants.length : 0} Students Enrolled
           
     </div>
      <button 
        onClick={toggleEditMode}
        style={{ 
          fontSize: '12px',
          textDecoration: 'none',
          color: 'blue',
          marginLeft: '-20px',
          height: '35px',
         marginTop: '10px',
          backgroundColor: '#f4f4f4',
          fontFamily: "'montserrat', sans-serif",
          border: 'none', 
          padding: '0px',
          width: '40px',

          marginRight: '10px',
          borderRadius: '8px',
          cursor: 'pointer' 
        }}
      >
        {isEditing ? <div style={{marginTop:'5px', marginLeft:'0px'}}><PencilOff size={20} color="lightgrey" strokeWidth={2} /></div> : <div style={{marginTop:'5px',  marginLeft:'0px'}}><Pencil size={20} color="grey" strokeWidth={2} /></div>}
      </button>

</div>
      </div>


    <div style={{width: '200px', border: '6px solid #f4f4f4',  marginLeft: 'auto', marginTop: '35px' ,  marginRight: '0px',
      
       borderRadius: '15px', padding: '10px', marginBottom: '10px', height: '80px'}}>
  
  <h1 style={{fontSize: '20px', color: '#FFAA00', fontFamily: "'montserrat', sans-serif",  margin: '-16px', padding: '5px 0px 5px 0px', borderRadius: '15px 15px 0px 0px ',
    
    background: '#FFF2AD', border: '6px solid #FFAA00', textAlign: 'center' }}>Class Code</h1>  
       <h2 style={{ width: '100%', textAlign: 'center', fontSize: '30px',fontWeight: '700', color: 'black',  marginTop: '25px', fontFamily: "'montserrat', sans-serif",}}>
      {currentClass.classCode}
    </h2>
    
  </div>
      
   
</div>
{currentClass.participants && currentClass.participants.length > 0 ? (
        currentClass.participants.map(student => (
      <div key={student.uid} style={{ zIndex: 10, width: '690px',   marginTop: '-15px', marginLeft: '0px',display: 'flex', flexDirection: 'row',color: 'grey', fontSize: '20px', justifyContent: 'space-between', border: '2px solid #EEEEEE',borderRadius: '10px', padding: '15px', marginBottom: '30px', alignSelf: 'center', backgroundColor: 'white', position: 'relative' }}>
        <div style={{ width: '50%' }}>
         
          <div   onClick={() => navigateToStudentGrades(student.uid)}
          style={{cursor: 'pointer', background: 'white', width: '250px'}}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'blue';
        e.currentTarget.style.textDecoration = 'underline';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'inherit';
        e.currentTarget.style.textDecoration = 'none';
      }}>
          <span style={{ backgroundColor: 'transparent', borderColor: 'transparent', fontFamily: "'montserrat', sans-serif", marginLeft: '20px' }}>{student.name.split(' ')[1]},</span>
          <span style={{ backgroundColor: 'transparent', borderColor: 'transparent', fontFamily: "'montserrat', sans-serif", fontWeight: '600', marginLeft: '10px' }}>{student.name.split(' ')[0]}</span>
        </div>
        </div>
        <div style={{ marginRight: 'auto' , marginLeft: '-30px'}}>
          <span style={{ backgroundColor: 'transparent', borderColor: 'transparent', fontSize: '16px',fontFamily: "'montserrat', sans-serif", marginLeft: '-40px'}}> {student.email}</span>
      
      
      
      
      
      
        </div>
       

        {timeMultipliers[student.uid] !== 1 && timeMultipliers[student.uid] !== undefined ? (
          <div 
            className="accomodations-tag tooltip"
            style={{ 
              zIndex: 10,
              marginTop: '0px',
              height: '25px',
              borderColor: isEditing ? 'lightgrey' : '#FFAA00',
              backgroundColor: isEditing ? 'white' : 'white', 
              width: '25px',
              fontFamily: "'montserrat', sans-serif", 
              marginRight: '20px',
              color: isEditing ? '#2BB514' : 'lightgrey', 
              fontWeight: 'bold', 
              fontSize: '14px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Timer size={25} />
            <div style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  backgroundColor: 'white',
                  width: '12px',
                  height: '12px',
                  lineHeight: '10px',
                  color: 'lightgrey',
                  fontWeight: 'bold',
                  borderRadius: '10px'
                }} >+</div>
            <span className="tooltiptext">
              Time: {formatMultiplier(timeMultipliers[student.uid])}
            </span>
            {isEditing && (
              <div style={{ position: 'absolute', right: '30px', display: 'flex', alignItems: 'center' }}>
                <input
                  type="number"
                  min="1"
                  step="0.1"
                  value={timeMultipliers[student.uid]}
                  onChange={(e) => handleTimeMultiplierChange(student.uid, e.target.value)}
                  style={{
                    width: '40px',
                    height: '25px',
                    color: 'black',
                    border: '4px solid #f4f4f4',
                    borderRadius: '5px',
                    fontWeight: 'bold',
                    fontFamily: "'montserrat', sans-serif",
                    background: 'white',
                    outline: 'rgb(72, 164, 158)',
                    marginRight: '5px',
                  }}
                />
                <div 
                
                onClick={() => removeAccommodations(student.uid)}
                style={{
                 
                  position: 'absolute',
                  top: '6px',
                  right: '-40px',
                  backgroundColor: 'white',
                  color: 'lightgrey',
                  fontSize: '20px',
                  textAlign: 'center',
                  width: '12px',
                  height: '12px',
                  lineHeight: '10px',
                  fontWeight: 'bold',
                  borderRadius: '10px',
                  cursor: 'pointer',
                }} >-</div>
                <div style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '-29px',
                  backgroundColor: 'white',
                  cursor: 'default',
                  fontSize: '14px',
                  textAlign: 'center',
                  width: '10px',
                  height: '10px',
                  lineHeight: '3px',
                  fontWeight: 'bold',
                  borderRadius: '10px',
                  
                }} >+</div>
              </div>
            )}
          </div>
        ) : isEditing && (
          <div 
            className="add-accomodations" 
            onClick={() => handleTimeMultiplierChange(student.uid, 1.5)}
            style={{ 
              position: 'relative', 
              width: '25px',
              height: '25px',
              marginRight: '20px',
              cursor: 'pointer'
            }}
          >
            <Timer size={25} color="lightgrey" />
            <div style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  backgroundColor: 'white',
                  width: '12px',
                  height: '12px',
                  fontSize: '14px',
                  lineHeight: '9px',
                  color: 'lightgrey',
                  fontWeight: 'bold',
                  borderRadius: '10px'
                }} >+</div>
                  <div style={{
                  position: 'absolute',
                  right: '-8px',
                  top: '-2px',
                  backgroundColor: 'white',
                  width: '12px',
                  color: '#2BB514',

                  height: '12px',
                  lineHeight: '10px',
                  fontWeight: 'bold',
                  borderRadius: '10px'
                }} >+</div>
          </div>
        )}
          {isEditing && (
          <button onClick={() => handleRemoveStudent(student.uid)} style={{ backgroundColor: 'transparent', fontFamily: "'montserrat', sans-serif", borderColor: 'transparent', color: 'red', position: 'absolute', right: '-10px', top: '-10px' ,
           
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
    fontFamily: "'montserrat', sans-serif",
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