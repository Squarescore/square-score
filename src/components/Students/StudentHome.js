import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth, db } from '../Universal/firebase';
import { doc, getDoc, collection, query, where, getDocs, runTransaction } from "firebase/firestore";
import HomeNavbar from '../Universal/HomeNavbar';
import FooterAuth from '../unAuthenticated/FooterAuth';
import JoinClassTab from './JoinClassModal';
import { RefreshCw, CheckSquare } from 'lucide-react';
import { GlassContainer } from '../../styles';
import TabButtons from '../Universal/TabButtons';

const StudentHome = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [classes, setClasses] = useState([]);
  const [studentName, setStudentName] = useState('');
  const studentUID = auth.currentUser.uid;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joinClassError, setJoinClassError] = useState('');
  const [activeTab, setActiveTab] = useState('Classes');
  const [successMessage, setSuccessMessage] = useState('');
  const [newClassId, setNewClassId] = useState('');

  const periodStyles = {
    1: { variant: 'teal', color: "#1EC8bc", borderColor: "#83E2F5" },
    2: { variant: 'purple', color: "#8324e1", borderColor: "#cf9eff" },
    3: { variant: 'orange', color: "#ff8800", borderColor: "#f1ab5a" },
    4: { variant: 'yellow', color: "#ffc300", borderColor: "#Ecca5a" },
    5: { variant: 'green', color: "#29c60f", borderColor: "#aef2a3" },
    6: { variant: 'blue', color: "#1651d4", borderColor: "#b5ccff" },
    7: { variant: 'pink', color: "#d138e9", borderColor: "#f198ff" },
    8: { variant: 'red', color: "#c63e3e", borderColor: "#ffa3a3" },
  };

  // Function to fetch student data and classes
  const fetchStudentData = async () => {
    if (!studentUID) {
      console.error("No student UID available");
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const studentRef = doc(db, 'students', studentUID);
      const studentDoc = await getDoc(studentRef);

      if (studentDoc.exists()) {
        const studentData = studentDoc.data();
        setStudentName(studentData.firstName);
        const studentClasses = studentData.classes || [];
        // Sort classes by period
        studentClasses.sort((a, b) => a.period - b.period);
        setClasses(studentClasses);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching student data:", err);
      setError("Failed to load classes. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [studentUID]);

  const handleDismiss = () => {
    setSuccessMessage('');
    setNewClassId('');
  };

  const handleJoinClass = async (classCode) => {
    try {
      // Get the current user's data
      const studentRef = doc(db, 'students', studentUID);
      const studentDoc = await getDoc(studentRef);
      
      if (!studentDoc.exists()) {
        throw new Error('Student profile not found');
      }
      
      const studentData = studentDoc.data();
      const studentInfo = {
        uid: studentUID,
        email: auth.currentUser.email,
        name: studentData.firstName + ' ' + studentData.lastName,
        timeMultiplier: 1
      };

      // Find the class with case-insensitive code match
      const classesRef = collection(db, 'classes');
      const allClassesQuery = query(classesRef);
      const allClassesSnapshot = await getDocs(allClassesQuery);
      const matchingClass = allClassesSnapshot.docs.find(
        doc => doc.data().classCode.toLowerCase() === classCode.toLowerCase()
      );

      if (!matchingClass) {
        throw new Error('Invalid class code. Please check the code and try again.');
      }

      const classDoc = matchingClass;
      const classRef = doc(db, 'classes', classDoc.id);
      const classData = classDoc.data();

      // Check if the student is already enrolled
      if (classData.students && classData.students.includes(studentUID)) {
        throw new Error('You are already enrolled in this class.');
      }

      // Use a transaction to safely update both documents
      await runTransaction(db, async (transaction) => {
        const freshClassDoc = await transaction.get(classRef);
        const freshStudentDoc = await transaction.get(studentRef);
        
        if (!freshClassDoc.exists()) {
          throw new Error("Class does not exist!");
        }
        
        const freshClassData = freshClassDoc.data();
        const freshStudentData = freshStudentDoc.data();
        
        if (freshClassData.students && freshClassData.students.includes(studentUID)) {
          throw new Error('You are already enrolled in this class.');
        }

        // Update students array in class document
        const updatedStudents = freshClassData.students ? [...freshClassData.students, studentUID] : [studentUID];
        const updatedParticipants = freshClassData.participants ? [...freshClassData.participants, studentInfo] : [studentInfo];

        // Create class info for student document
        const classInfo = {
          classId: classDoc.id,
          classChoice: freshClassData.classChoice || freshClassData.className,
          period: freshClassData.period || (freshClassData.className && freshClassData.className.includes(' ') ? parseInt(freshClassData.className.split(' ')[1]) : 1)
        };

        // Get existing classes array or create new one
        const existingClasses = freshStudentData.classes || [];
        
        // Add new class info to array
        const updatedClasses = [...existingClasses, classInfo];

        // Update both documents
        transaction.update(classRef, {
          students: updatedStudents,
          participants: updatedParticipants
        });

        transaction.update(studentRef, {
          classes: updatedClasses
        });
      });

      // Update local state
      const newClass = {
        classId: classDoc.id,
        classChoice: classData.classChoice || classData.className,
        period: classData.period || (classData.className && classData.className.includes(' ') ? parseInt(classData.className.split(' ')[1]) : 1)
      };
      setClasses(prevClasses => [...prevClasses, newClass]);

      // Show success message
      setSuccessMessage('Successfully joined class!');
      setActiveTab('Classes'); // Switch back to Classes tab after successful join
      return true;
    } catch (err) {
      setJoinClassError(err.message);
      throw err;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#white' }}>
        <HomeNavbar userType="student" />
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <RefreshCw size={50} color="#020CFF" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '10px', fontFamily: "'montserrat', sans-serif", fontSize: '18px' }}>Loading your classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#white', flexWrap: 'wrap' }}>
      <HomeNavbar userType="student" />
      
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'left', marginTop: '10px', backgroundColor: '#white', marginBottom: '230px' }}>
        {/* Success Message */}
        {successMessage && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            zIndex: '10000',
            right: '4%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <GlassContainer variant="green"
            size={1}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'transparent',
                color: 'green',
                padding: '0px 16px',
                borderRadius: '8px',
                animation: 'fadeIn 0.3s ease-in-out',
                zIndex: 50,
                fontFamily: "'Montserrat', sans-serif"
              }}>
                <CheckSquare style={{ width: '20px', height: '20px' }} />
                <p style={{ color: 'green', fontWeight: '500', marginRight: '20px' }}>{successMessage}</p>
                <button
                  onClick={handleDismiss}
                  style={{
                    backgroundColor: 'transparent',
                    opacity: '100%',
                    color: 'grey',
                    fontSize: '14px',
                    fontFamily: "'montserrat', sans-serif",
                    fontWeight: '500',
                    height: '30px',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Dismiss
                </button>
              </div>
            </GlassContainer>
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{ width: '100%', marginBottom: '-40px', alignItems: 'center', display: 'flex' }}>
          <h1 style={{
            fontSize: '1.5rem',
            marginLeft: 'calc(4% + 200px)',
            fontWeight: '400'
          }}>
            Welcome, {studentName}
          </h1>

          <div style={{
            marginLeft: 'auto',
            display: 'flex',
            gap: '20px',
            marginRight: 'calc(4%)',
            alignItems: 'center'
          }}>
            <TabButtons
              tabs={[
                { id: 'Classes', label: 'Classes' },
                { id: 'Join', label: 'Join Class' }
              ]}
              activeTab={activeTab}
              onTabClick={setActiveTab}
              variant="teal"
              color="#00BBFF"
              buttonStyle={{
                fontSize: '1rem'
              }}
            />
          </div>
        </div>

        {/* Content Area */}
        <div style={{
          marginTop: '100px',
          display: 'flex',
          marginBottom: '200px',
          flexWrap: 'wrap',
          width: 'calc(92% - 200px)',
          marginLeft: 'calc(200px + 4%)',
          fontFamily: "'montserrat', sans-serif",
        }}>
          {activeTab === 'Classes' ? (
            classes.map((classItem) => {
              const periodStyle = periodStyles[classItem.period] || { variant: 'clear', color: 'grey', borderColor: '#ddd' };
              
              return (
                <GlassContainer
                  key={classItem.classId}
                  variant={periodStyle.variant}
                  size={3}
                  
          enableRotation={true}
                  onClick={() => navigate(`/studentassignments/${classItem.classId}`)}
                  style={{ 
                    marginRight: '3%',
                    width: "20rem",
                    marginTop: '40px', 
                    height: '120px',
                    cursor: 'pointer',
                    transition: '.2s', 
                    alignContent: 'center',
                    fontFamily: "'montserrat', sans-serif",
                    transform: 'scale(1)',
                  }}
                  contentStyle={{
                    padding: '20px 50px',
                    margin: '0',
                    height: '100%',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                  className="hoverableButton"
                >
                  <div style={{ display: 'flex' }}>
                    <h1 style={{
                      fontSize: '2rem',
                      color: periodStyle.color,
                      margin: '0',
                      fontWeight: '500',
                      textShadow: '0px 2px 3px rgba(255, 255, 255, 0.8)',
                      WebkitBackgroundClip: 'text',
                      MozBackgroundClip: 'text',
                      backgroundClip: 'text'
                    }}>
                      Period {classItem.period}
                    </h1>
                  </div>

                  <p style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textAlign: 'left',
                    color: periodStyle.borderColor,
                    fontWeight: '500', 
                    fontSize: '1.3rem',
                    whiteSpace: 'nowrap',
                    background: 'transparent',
                    margin: '0',
                    marginTop: '10px',
                    textShadow: '0px 2px 3px rgba(255, 255, 255, 0.8)',
                    WebkitBackgroundClip: 'text',
                    MozBackgroundClip: 'text',
                    backgroundClip: 'text'
                  }}>
                    {classItem.classChoice}
                  </p>
                </GlassContainer>
              );
            })
          ) : (
            <JoinClassTab
              onSubmit={handleJoinClass}
              error={joinClassError}
            />
          )}
        </div>

        <FooterAuth style={{marginTop: '100px'}}/>
      </main>
    </div>
  );
};

export default StudentHome;
