import React, { useState, useEffect } from 'react';
import { auth, db } from '../Universal/firebase';
import { collection, query, where, getDocs, updateDoc, doc, getDoc, onSnapshot } from "firebase/firestore";
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Pencil, SquareX, SquareCheck, Hourglass, PencilOff, PlusSquare, Timer, Mail} from 'lucide-react';
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



  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Get class document
        const classDoc = await getDoc(doc(db, 'classes', classId));
        if (!classDoc.exists()) return;

        const classData = classDoc.data();
        
        // Fetch all student data in parallel including time multipliers
        const studentPromises = [];
        const processedParticipants = [];
        
        if (Array.isArray(classData.participants)) {
          for (const participant of classData.participants) {
            studentPromises.push(
              getDoc(doc(db, 'students', participant.uid)).then(studentDoc => {
                if (studentDoc.exists()) {
                  const studentData = studentDoc.data();
                  // Update time multipliers
                  setTimeMultipliers(prev => ({
                    ...prev,
                    [participant.uid]: studentData.timeMultiplier || 1
                  }));
                  // Add to processed participants
                  processedParticipants.push({
                    ...participant,
                    name: `${studentData.firstName.trim()} ${studentData.lastName.trim()}`,
                    email: studentData.email
                  });
                }
                return null;
              })
            );
          }
        }

        await Promise.all(studentPromises);
        
        setCurrentClass(prev => ({
          ...classData,
          participants: processedParticipants
        }));

      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };

    fetchInitialData();
  }, [classId]);

  // Listen for changes to join requests and student time multipliers
  useEffect(() => {
    // Listen for changes to the class document (specifically join requests)
    const classRef = doc(db, 'classes', classId);
    const unsubscribeClass = onSnapshot(classRef, async (snapshot) => {
      if (!snapshot.exists()) return;

      const classData = snapshot.data();
      
      // Only process join requests if they exist and have changed
      if (Array.isArray(classData.joinRequests)) {
        const joinRequestPromises = classData.joinRequests.map(async (requestUID) => {
          const studentDoc = await getDoc(doc(db, 'students', requestUID));
          if (studentDoc.exists()) {
            const studentData = studentDoc.data();
            return {
              uid: requestUID,
              name: `${studentData.firstName.trim()} ${studentData.lastName.trim()}`,
              email: studentData.email
            };
          }
          return null;
        });

        const processedJoinRequests = (await Promise.all(joinRequestPromises)).filter(Boolean);
        
        setCurrentClass(prev => ({
          ...prev,
          joinRequests: processedJoinRequests
        }));
      }
    });

    // Listen for changes to time multipliers of current participants
    const unsubscribeTimeMultipliers = currentClass.participants?.map(participant => {
      return onSnapshot(doc(db, 'students', participant.uid), (snapshot) => {
        if (snapshot.exists()) {
          const studentData = snapshot.data();
          setTimeMultipliers(prev => ({
            ...prev,
            [participant.uid]: studentData.timeMultiplier || 1
          }));
        }
      });
    }) || [];

    // Cleanup
    return () => {
      unsubscribeClass();
      unsubscribeTimeMultipliers.forEach(unsubscribe => unsubscribe());
    };
  }, [classId, currentClass.participants]);

  // Optimized handlers
  const handleTimeMultiplierChange = async (studentUid, multiplier) => {
    const newMultiplier = parseFloat(multiplier) || 1;
    
    try {
      // Update local state immediately for UI responsiveness
      setTimeMultipliers(prev => ({ ...prev, [studentUid]: newMultiplier }));
      
      // Update Firestore
      await updateDoc(doc(db, 'students', studentUid), {
        timeMultiplier: newMultiplier
      });
    } catch (error) {
      console.error("Error updating time multiplier:", error);
      // Revert on error
      setTimeMultipliers(prev => ({ ...prev, [studentUid]: prev[studentUid] }));
    }
  };

  const handleAdmitStudent = async (student) => {
    try {
      const classRef = doc(db, 'classes', classId);
      const participants = [...(currentClass.participants || []), {
        uid: student.uid,
        name: student.name,
        email: student.email
      }];
      const joinRequests = currentClass.joinRequests.filter(req => req.uid !== student.uid);
      const students = [...(currentClass.students || []), student.uid];
      
      participants.sort((a, b) => a.name.split(' ').pop().localeCompare(b.name.split(' ').pop()));
      
      await updateDoc(classRef, { 
        participants, 
        joinRequests, 
        students 
      });
    } catch (error) {
      console.error("Error admitting student:", error);
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

      // Update local state
      setCurrentClass(prev => ({
        ...prev,
        participants: updatedParticipants,
        students: updatedStudents
      }));
    } catch (error) {
      console.error("Error removing student:", error);
    }
  };

  const handleRejectStudent = async (studentUID) => {
    try {
      const classRef = doc(db, 'classes', classId);
      const updatedJoinRequests = currentClass.joinRequests.filter(req => req.uid !== studentUID);
      
      await updateDoc(classRef, {
        joinRequests: updatedJoinRequests
      });
    } catch (error) {
      console.error("Error rejecting student:", error);
    }
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

  const handleBack = () => {
    navigate(-1);
  }; 
  const getLastNamePrefix = (fullName) => {
    if (!fullName) return 'A'; // Default to 'A' if fullName is undefined
    const nameParts = fullName.split(' ');
    if (nameParts.length < 2) return 'A'; // Default to 'A' if there's no last name
    const lastName = nameParts.pop();
    const prefix = lastName.substring(0, 2).toLowerCase();
    return prefix.charAt(0).toUpperCase() + prefix.charAt(1) + '';
  };

  // Function to format the range string
  const formatRange = (start, end) => {
    if (!start || !end) return 'A-Z'; // Default range if start or end is undefined
    if (start === 'A' || end === 'Z') {
      return `${start}-${end}`;
    }
    return `${start}-${end}`;
  };

  // Sort participants by last name
  const sortedParticipants = currentClass.participants
    ? [...currentClass.participants].sort((a, b) =>
        (a.name || '').split(' ').pop().localeCompare((b.name || '').split(' ').pop())
      )
    : [];

  // Split participants into three columns
  const columnLength = Math.ceil(sortedParticipants.length / 3);
  const firstColumn = sortedParticipants.slice(0, columnLength);
  const secondColumn = sortedParticipants.slice(columnLength, columnLength * 2);
  const thirdColumn = sortedParticipants.slice(columnLength * 2);

  // Get the range for each column
  const getColumnRange = (column) => {
    if (column.length === 0) return 'N/A';
    const firstPrefix = getLastNamePrefix(column[0]?.name);
    const lastPrefix = getLastNamePrefix(column[column.length - 1]?.name);
    return formatRange(firstPrefix, lastPrefix);
  };

  const firstColumnRange = formatRange('A', getLastNamePrefix(firstColumn[firstColumn.length - 1]?.name));
  const secondColumnRange = getColumnRange(secondColumn);
  const thirdColumnRange = thirdColumn.length > 0 ? formatRange(getLastNamePrefix(thirdColumn[0]?.name), 'Z') : 'N/A';

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#FCFCFC',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
  <style>
        {`
         .tooltip {
  position: relative;
  display: inline-block;
}

.tooltip .tooltiptext {
  visibility: hidden;
  width: 90px;
  background-color: #f4f4f4;
  color: grey;
  text-align: left;
  border-radius: 6px;
  padding: 5px;
  position: absolute;
  z-index: 1;
  top: 150%;
  right: 150%; /* Changed from right to left */
  transform: translateY(-50%);
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
  
 

  <div style={{width: '830px', display: 'flex', marginLeft: 'auto', marginRight: 'auto', marginTop: '60px', height: '170px', paddingTop: '10px', marginBottom: '60px', }}>
 
 
 
  <div style={{width: '320px', border: '6px solid white',   marginTop: '0px' ,  marginRight: 'auto',
    background: 'white',
               boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)',
      
       borderRadius: '15px', padding: '10px', marginBottom: '10px', height: '140px'}}>
  
  <h1 style={{fontSize: '25px', color: '#FFAA00', fontFamily: "'montserrat', sans-serif",  margin: '-16px', padding: '5px 0px 5px 0px', borderRadius: '15px 15px 0px 0px ',
    
    background: '#FFF2AD', border: '6px solid #FFAA00', textAlign: 'center' }}>{currentClass.classChoice}</h1>  
       <h2 style={{ width: '100%', textAlign: 'center', fontSize: '50px',fontWeight: '600', overflow: 'hidden',
                    textOverflow: 'ellipsis',  color: '#7C7C7C',  marginTop: '40px', fontFamily: "'montserrat', sans-serif",}}>
       {currentClass.className}
    </h2>
    
  </div>




   <div style={{ width: '400px', background: 'white',
               boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)',  borderRadius: '15px', paddingLeft: '30px'}}>


   <div style={{display: 'flex', width: '340px', marginTop: '20px',  marginLeft: '0px', }}> 

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
          marginLeft: '0px',
          width: '290px',
          textAlign: 'left',
          lineHeight: '50px',
          color: '#8C8C8C',
          marginRight: '30px',
          borderRadius: '8px',
        }}
      >
             Class Code
           
     </div>
    

</div>
    <h1 style={{ fontSize: '60px', marginTop: '0px', width: '270px',  marginRight: '10px',fontFamily: "'montserrat', sans-serif", marginLeft: '0px' }}>
      {currentClass.classCode}</h1>

     

      </div>


  
      
   
</div>

<div style={{width: '800px',marginLeft: 'auto', marginRight: 'auto', display: 'flex', marginTop: '-30px', marginBottom: '-10px'}}>
<h1 style={{fontWeight: '600', fontSize: '30px'}}>{currentClass.participants ? currentClass.participants.length : 0} Students 
</h1>

<button 
        onClick={toggleEditMode}
        style={{ 
          fontSize: '12px',
          textDecoration: 'none',
          color: 'blue',
          marginLeft: '20px',
          height: '40px',
         marginTop: '22px',
          backgroundColor: 'white',
          
          boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)' ,
          fontFamily: "'montserrat', sans-serif",
          border: 'none', 
          padding: '0px',
          width: '40px',

          marginRight: '10px',
          borderRadius: '8px',
          cursor: 'pointer' 
        }}
      >
        {isEditing ? <div style={{marginTop:'3px', marginLeft:'0px'}}><PencilOff size={25} color="lightgrey" strokeWidth={2} /></div> : <div style={{marginTop:'3px',  marginLeft:'0px'}}><Pencil size={25} color="grey" strokeWidth={2} /></div>}
      </button>
</div>   
<div style={{ display: 'flex', maxWidth: '800px', margin: 'auto',  marginTop: '10px' }}>


<div style={{ width: '320px', padding: '20px',  background: 'white', 
               boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)', borderRadius: '15px', marginLeft: '-15px' }}>
<h1 style={{fontSize: '20px', marginTop: '0px'}}>{firstColumnRange}</h1>
        {firstColumn.map((student) => (
            <StudentCard
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

        <div style={{ width: '2px', background: 'transparent', marginLeft: '0px', marginRight: '10px'  }}></div>

        <div style={{ width: '320px', padding: '20px',  background: 'white', 
               boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)', borderRadius: '15px' }}>
        <h1 style={{fontSize: '20px', marginTop: '0px'}}>{secondColumnRange}</h1>
          {secondColumn.map((student) => (
            <StudentCard
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

        <div style={{ width: '2px', background: 'transparent', marginLeft: '0px', marginRight: '10px' }}></div>

        <div style={{ width: '320px', padding: '20px',  background: 'white', 
               boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)', borderRadius: '15px' }}>
        <h1 style={{fontSize: '20px', marginTop: '0px'}}>{thirdColumnRange}</h1>
          {thirdColumn.map((student) => (
            <StudentCard
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
const StudentCard = ({ student, isEditing, timeMultipliers, handleTimeMultiplierChange, removeAccommodations, handleRemoveStudent, navigateToStudentGrades }) => {
  const formatMultiplier = (multiplier) => `${(multiplier * 100).toFixed(0)}%`;
  const formatName = (fullName, isEditing) => {
    const [firstName, ...lastNameParts] = fullName.split(' ');
    const lastName = lastNameParts.join(' ');
    
    if (isEditing) {
      const lastNamePrefix = lastName.substring(0, 2).toLowerCase();
      return (
        <>
          <span style={{fontWeight: '600', color: 'grey'}}>{lastNamePrefix[0].toUpperCase() + lastNamePrefix[1].toLowerCase()} ,  </span>
          <strong>{firstName}</strong>
        </>
      );
    } else {
      return (
        <>
          <span style={{fontWeight: '600', color: 'grey'}}>{lastName}, </span>
          <strong>{firstName}</strong>
        </>
      );
    }
  };
  const confirmAndRemoveStudent = () => {
    const fullName = student.name;
    if (window.confirm(`Are you sure you want to remove ${fullName} from this class?`)) {
      handleRemoveStudent(student.uid);
    }
  };

  return (
    <div style={{ width: '220px', marginBottom: '0px', display: 'flex', flexDirection: 'row', borderTop: ' 2px solid #f4f4f4',  padding: ' 25px 5px', backgroundColor: 'white', position: 'relative', }}>
      {/* Student Name */}
      <div style={{ width: '80%',  }}>
      <div style={{ cursor: 'pointer' }} onClick={() => navigateToStudentGrades(student.uid)}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'blue';
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'black';
              e.currentTarget.style.textDecoration = 'none';
            }}
        >
          {formatName(student.name, isEditing)}
        </div>
      </div>

      {/* Email Icon with Tooltip */}
      {!isEditing && (
        <div className="tooltip" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', zIndex: '100' }}>
          <Mail size={20} color="lightgrey" style={{position: 'absolute', right: '-5px'}} />
          <span className="tooltiptext" style={{ fontSize: '12px', width: '190px', backgroundColor: 'white', color: 'black', zIndex: '100', padding: '5px', borderRadius: '5px', marginTop: '5px', marginLeft: '-40px', border: '' }}>{student.email}</span>
        </div>
      )}

    
      {timeMultipliers[student.uid] !== 1 && timeMultipliers[student.uid] !== undefined ? (
             
             <div
                className="accomodations-tag tooltip"
                style={{
                  zIndex: 10,
                  marginTop: '-4px',
                  height: '25px',
                  borderColor: isEditing ? 'lightgrey' : '#FFAA00',
                  backgroundColor: isEditing ? 'white' : 'white',
                  width: '25px',
                  fontFamily: "'montserrat', sans-serif",
                  marginRight: '20px',
                  color: isEditing ? '#2BB514' : 'lightgrey',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  position: 'absolute',
                  left: '175px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                 
                <Timer size={25} />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    backgroundColor: 'white',
                    width: '12px',
                    height: '12px',
                    lineHeight: '10px',
                    color: 'lightgrey',
                    fontWeight: 'bold',
                    borderRadius: '10px',
                  }}
                >
                  +
                  
                </div>
                <span className="tooltiptext">Time: {formatMultiplier(timeMultipliers[student.uid])}</span>

                
                {isEditing && (
                  <div style={{ position: 'absolute', right: '30px', display: 'flex', alignItems: 'center' }}>
                      <input
  type="number"
  min="1"
  value={timeMultipliers[student.uid]}
  onChange={(e) => handleTimeMultiplierChange(student.uid, e.target.value)}
  style={{
    width: '40px',
    height: '25px',
    color: 'black',
    border: '1px solid #f4f4f4',
    borderRadius: '5px',
    fontWeight: 'bold',
    fontFamily: "'montserrat', sans-serif",
    background: 'white',
    outline: 'rgb(72, 164, 158)',
    marginRight: '5px',
    // Styles to remove arrows
    WebkitAppearance: 'none',
    MozAppearance: 'textfield',
    appearance: 'textfield',
    // Additional styles to remove arrows in specific browsers
    '::-webkit-inner-spin-button': {
      WebkitAppearance: 'none',
      margin: 0,
    },
    '::-webkit-outer-spin-button': {
      WebkitAppearance: 'none',
      margin: 0,
    },
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
                      }}
                    >
                      -
                    </div>
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
                  marginRight: '40px', marginLeft: '10px',
                  cursor: 'pointer',
                }}
              >
                <Timer size={25} color="lightgrey" />
                <div
                  style={{
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
                    borderRadius: '10px',
                  }}
                >
                  +
                  
                  <div
                      onClick={() => removeAccommodations(student.uid)}
                      style={{
                        position: 'absolute',
                        top: '-15px',
                        right: '-4px',
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
                      }}
                    >
                      +
                    </div>
                </div>
            
              </div>
            )}

         

      {/* Remove Student Button */}
      {isEditing && (
        <button
        onClick={confirmAndRemoveStudent}
          style={{
            backgroundColor: 'transparent',
            fontFamily: "'montserrat', sans-serif",
            borderColor: 'transparent',
            color: 'red',
            position: 'absolute',
            right: '0px',
           
            zIndex: '990',
            height: '20px',
            width: '20px',
            borderRadius: '6px',
            background: 'white',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <SquareX size={20} color="#e60000" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};


export default Participants;