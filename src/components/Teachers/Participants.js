import React, { useState, useEffect } from 'react';
import { auth, db } from '../Universal/firebase';
import { collection, query, where, getDocs, updateDoc, doc, getDoc, onSnapshot } from "firebase/firestore";
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Pencil, SquareX, SquareCheck, Hourglass, PencilOff, PlusSquare, Timer, Mail } from 'lucide-react';
import Navbar from '../Universal/Navbar';

const Participants = () => {
  const [currentClass, setCurrentClass] = useState({});
  const teacherUID = auth.currentUser.uid;
  const { classId } = useParams();
  const [timeMultipliers, setTimeMultipliers] = useState({});
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false); // New state for edit mode
  const [activeTab, setActiveTab] = useState('enrolled');

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
      const classDoc = await getDoc(classRef);

      if (!classDoc.exists()) {
        console.error("Class document does not exist");
        return;
      }

      const currentData = classDoc.data();

      // Add student to participants
      const updatedParticipants = [...(currentData.participants || []), {
        uid: student.uid,
        name: student.name,
        email: student.email
      }];

      // Update students array
      const updatedStudents = [...(currentData.students || []), student.uid];

      // Update joinRequests - just keep the UIDs that aren't the admitted student
      const updatedJoinRequests = (currentData.joinRequests || [])
        .filter(uid => uid !== student.uid);

      // Sort participants by last name
      updatedParticipants.sort((a, b) => 
        a.name.split(' ').pop().localeCompare(b.name.split(' ').pop())
      );

      // Update the document - notice we're not mapping joinRequests
      await updateDoc(classRef, {
        participants: updatedParticipants,
        joinRequests: updatedJoinRequests, // Just the filtered array of UIDs
        students: updatedStudents
      });

      // Update local state
      setCurrentClass(prev => ({
        ...prev,
        participants: updatedParticipants,
        joinRequests: prev.joinRequests.filter(req => req.uid !== student.uid), // Keep the full objects in state
        students: updatedStudents
      }));

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

      // Update local state
      setCurrentClass(prev => ({
        ...prev,
        joinRequests: updatedJoinRequests
      }));
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
    return prefix.charAt(0).toUpperCase() + prefix.charAt(1).toLowerCase();
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
width: 'calc(100% - 200px)' ,marginLeft: '200px',
      backgroundColor: '', border:'1px solid blue',
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
      
   
<div style={{ borderBottom:'1px solid lightgrey', height: '128px', position: 'relative'}}>
      <div style={{  display: 'flex', marginLeft: '4%', height: '70px', paddingTop: '10px', marginBottom: '60px', marginTop: '0px' }}>
        <h1 style={{ fontSize: '30px' }}>Students</h1>
        <h1 style={{
          fontSize: '40px',
          marginTop: '30px',
          width: '170px',
          height: "25px",
          paddingLeft: '20px',
          color: '#FFAE00',
          lineHeight: '20px',
          background: '#FFF5D3',
          marginRight: '4%',
          fontFamily: "'montserrat', sans-serif",
          fontWeight: '600',
          marginLeft: 'auto'
        }}>
          {currentClass.classCode}
        </h1>








        
      </div>

      <div style={{
        display: 'flex',
        width: '250px',
        marginLeft:'4%',
        marginTop: '-50px',
        marginBottom: '60px'
      }}>
        <button
          onClick={() => setActiveTab('enrolled')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '14px',
            cursor: 'pointer',
            fontWeight: "600",
            padding: '10px 10px',
            fontFamily: "'Montserrat', sans-serif",
            borderBottom: activeTab === 'enrolled' ? '2px solid #FFAE00' : '2px solid transparent',
            color: activeTab === 'enrolled' ? '#FFAE00' : 'grey',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          Enrolled
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '14px',
            marginLeft: 'auto',
            cursor: 'pointer',
            fontWeight: "600",
            padding: '10px 10px',
            fontFamily: "'Montserrat', sans-serif",
            borderBottom: activeTab === 'requests' ? '2px solid #FFAE00' : '2px solid transparent',
            color: activeTab === 'requests' ? '#FFAE00' : 'grey',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          Join Requests
          {currentClass.joinRequests?.length > 0 && (
            <span style={{
              background: '#FFF5D3',
              color: '#FFAE00',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {currentClass.joinRequests.length}
            </span>
          )}
        </button>
      </div>


      </div>

      {activeTab === 'enrolled' ? (
        <>
          <div style={{ width: '100%', marginLeft: 'auto', marginRight: 'auto', display: 'flex', marginTop: '-30px', marginBottom: '-10px' }}>
            <h1 style={{ fontWeight: '600', fontSize: '25px', marginLeft: '4%', marginTop: '50px',  }}>{currentClass.participants ? currentClass.participants.length : 0} Students</h1>

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
                marginTop: '50px', 
                paddingLeft: '10px',
                width: '85px',
                marginRight: '4%',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              {isEditing ? (
         
<div style={{ marginTop: '3px', marginLeft: '0px',display: 'flex' }}>
                  <h1 style={{fontSize: '16px', fontWeight: '600', marginTop: '2px', marginRight: '8px'}}>Done</h1>
                  <PencilOff size={14} color="lightgrey" strokeWidth={2} style={{marginTop:'4px'}} />
                </div>
              ) : (
                <div style={{ marginTop: '3px', marginLeft: '0px',display: 'flex' }}>
                  <h1 style={{fontSize: '16px', fontWeight: '600', marginTop: '2px', marginRight: '8px'}}>Edit</h1>
                  <Pencil size={14} color="grey" strokeWidth={2} style={{marginTop:'4px'}} />
                </div>
              )}
            </button>
          </div>

          <div style={{
            display: 'flex',
            marginLeft: '4%',
            marginRight: '4%',
            marginTop: '20px',
            marginBottom: '100px',
          }}>
            <div style={{
              width: '33%',
              padding: '20px',
              background: 'white',
              border: '1px solid #D2D2D2',
              borderRadius: '15px',
              marginLeft: '-15px'
            }}>
              <h1 style={{ fontSize: '20px', marginTop: '0px' }}>{firstColumnRange}</h1>
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

            <div style={{ width: '2px', background: 'transparent', marginLeft: '0px', marginRight: '10px' }}></div>

            <div style={{
              width: '33%',
              padding: '20px',
              background: 'white',
              border: '1px solid #D2D2D2',
              borderRadius: '15px'
            }}>
              <h1 style={{ fontSize: '20px', marginTop: '0px' }}>{secondColumnRange}</h1>
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

            <div style={{
              width: '33%',
              padding: '20px',
              background: 'white',
              border: '1px solid #D2D2D2',
              borderRadius: '15px'
            }}>
              <h1 style={{ fontSize: '20px', marginTop: '0px' }}>{thirdColumnRange}</h1>
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
        </>
      ) : (
        // Show join requests content
        <div style={{ width: '100%', marginLeft: 'auto', marginRight: 'auto',  marginTop: '-30px', marginBottom: '-10px' }}>
            <h1 style={{ fontWeight: '600', fontSize: '25px', marginLeft: '4%', marginTop: '50px',  }}>Join Requests</h1>

          {currentClass.joinRequests && currentClass.joinRequests.length > 0 ? (
            currentClass.joinRequests.map((student) => (
              <div key={student.uid} style={{
                width: '100%',
                display: 'flex',
                marginLeft: '-15px',
                background: 'white',
                borderBottom: '1px solid lightgrey',
                padding: '10px',
                marginBottom: '10px',
                height: '40px',
                alignItems: 'center' // Added this to vertically center
              }}>
                <span style={{
                  backgroundColor: 'transparent',
                  borderColor: 'transparent',
                  fontFamily: "'montserrat', sans-serif",
                  fontSize: '20px',
                  marginLeft: '4%',
                  marginRight: '10px'
                }}> {student.name.split(' ').pop()},</span>

                <span style={{
                  backgroundColor: 'transparent',
                  borderColor: 'transparent',
                  fontFamily: "'montserrat', sans-serif",
                  fontSize: '20px',
                  marginRight: '20px',
                  fontWeight: '600'
                }}>{student.name.split(' ')[0]}</span>
                <span style={{
                  backgroundColor: 'transparent',
                  borderColor: 'transparent',
                  fontFamily: "'montserrat', sans-serif",
                  fontSize: '16px',
                  color: 'grey',
                  fontWeight: '600', marginLeft: 'auto', marginRight: 'auto',
                }}>{student.email}</span>
               


                <div style={{
                  marginLeft: 'auto',
                  marginRight: '4%',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <button style={{
                    backgroundColor: 'transparent',
                    borderColor: 'transparent',
                    fontFamily: "'montserrat', sans-serif",
                    cursor: 'pointer',
                    padding: '5px',
                    display: 'flex',
                    alignItems: 'center'
                  }} onClick={() => handleAdmitStudent(student)}>
                    <SquareCheck size={30} color="#00b303" strokeWidth={2} />
                  </button>

                  <button style={{
                    backgroundColor: 'transparent',
                    borderColor: 'transparent',
                    fontFamily: "'montserrat', sans-serif",
                    cursor: 'pointer',
                    marginLeft: '20px',
                    padding: '5px',
                    display: 'flex',
                    alignItems: 'center'
                  }} onClick={() => handleRejectStudent(student.uid)}>
                    <SquareX size={30} color="#e60000" strokeWidth={2} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p style={{ fontFamily: "'montserrat', sans-serif", color: 'grey' , marginLeft:' 4%'}}>No join requests available.</p>
          )}
        </div>
      )}
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
          <span style={{ fontWeight: '600', color: 'grey' }}>
            {lastNamePrefix.charAt(0).toUpperCase() + lastNamePrefix.charAt(1).toLowerCase()} ,  
          </span>
          <strong>{firstName}</strong>
        </>
      );
    } else {
      return (
        <>
          <span style={{ fontWeight: '500', color: 'black' }}>   {lastName},  {firstName}  </span>  
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
    <div style={{
      width: '',
      marginBottom: '0px',
      display: 'flex',
      flexDirection: 'row',
      borderTop: '2px solid #f4f4f4',
      padding: '25px 5px',
      backgroundColor: 'white',
      position: 'relative',
    }}>
      {/* Student Name */}
      <div style={{ width: '80%' }}>
        <div
          style={{ cursor: 'pointer' }}
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
          {formatName(student.name, isEditing)}
        </div>
      </div>

      {/* Email Icon with Tooltip */}
      {!isEditing && (
        <div className="tooltip" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', zIndex: '100' }}>
          <Mail size={20} color="lightgrey" style={{ position: 'absolute', right: '-5px' }} />
          <span className="tooltiptext" style={{
            fontSize: '12px',
            width: '190px',
            backgroundColor: 'white',
            color: 'black',
            zIndex: '100',
            padding: '5px',
            borderRadius: '5px',
            marginTop: '5px',
            marginLeft: '-40px',
            border: ''
          }}>
            {student.email}
          </span>
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
            left: '80%',
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
            marginRight: '40px',
            marginLeft: '10px',
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
              onClick={(e) => {
                e.stopPropagation();
                removeAccommodations(student.uid);
              }}
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
              -
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
