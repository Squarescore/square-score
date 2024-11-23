import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auth, db } from '../Universal/firebase';
import { collection, query, where, getDocs, runTransaction, doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
import HomeNavbar from '../Universal/HomeNavbar';
import FooterAuth from '../unAuthenticated/FooterAuth';
import JoinClassModal from './JoinClassModal';
import { RefreshCw } from 'lucide-react';

const loaderStyle = `
  .loader {
    height: 4px;
    width: 130px;
    top: 25px;
    --c: no-repeat linear-gradient(#020CFF 0 0);
    background: var(--c), var(--c), #627BFF;
    background-size: 60% 100%;
    animation: l16 3s infinite;
  }
  @keyframes l16 {
    0%   {background-position: -150% 0, -150% 0}
    66%  {background-position: 250% 0, -150% 0}
    100% {background-position: 250% 0, 250% 0}
  }
`;

const StudentHome = () => {
  const navigate = useNavigate();
  const { code } = useParams(); // Extract the 'code' parameter from the URL
  const [classes, setClasses] = useState([]);
  const studentUID = auth.currentUser.uid; 
  
  const [showJoinClassModal, setShowJoinClassModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [joinClassError, setJoinClassError] = useState('');
  const inputRefs = useRef([]);
  
  const periodStyles = {
    1: { background: '#A3F2ED', color: '#1CC7BC' },
    2: { background: '#F8CFFF', color: '#E01FFF' },
    3: { background: '#FFCEB2', color: '#FD772C' },
    4: { background: '#FFECA9', color: '#F0BC6E' },
    5: { background: '#AEF2A3', color: '#4BD682' },
    6: { background: '#BAA9FF', color: '#8364FF' },
    7: { background: '#8296FF', color: '#3D44EA' },
    8: { background: '#FF8E8E', color: '#D23F3F' }
  };

  // Function to handle leaving a class
  const handleLeaveClass = async (classId) => {
    if (window.confirm("Are you sure you want to leave this class?")) {
      try {
        const classRef = doc(db, 'classes', classId);
        const classDoc = await getDoc(classRef);
        const classData = classDoc.data();
    
        if (classData.students.includes(studentUID)) {
          await runTransaction(db, async (transaction) => {
            const freshClassDoc = await transaction.get(classRef);
            if (!freshClassDoc.exists()) {
              throw new Error("Class does not exist!");
            }
            const updatedStudents = freshClassDoc.data().students.filter(uid => uid !== studentUID);
            transaction.update(classRef, { students: updatedStudents });
          });
          setClasses(prevClasses => prevClasses.filter(classItem => classItem.id !== classId));
        }
      } catch (error) {
        console.error("Error leaving class:", error);
      }
    }
  };

  // Focus on the first input when the component mounts
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleJoinClass = useCallback(async (classCode) => {
    try {
      const classesRef = collection(db, 'classes');
      const classQuery = query(classesRef, where('classCode', '==', classCode));
      const classQuerySnapshot = await getDocs(classQuery);

      if (classQuerySnapshot.empty) {
        throw new Error('Invalid class code. Please check the code and try again.');
      }

      const classDoc = classQuerySnapshot.docs[0];
      const classRef = doc(db, 'classes', classDoc.id);
      const classData = classDoc.data();

      // Check if the student is already enrolled
      if (classData.students && classData.students.includes(studentUID)) {
        throw new Error('You are already enrolled in this class.');
      }

      // Use a transaction to safely add the student to the class
      await runTransaction(db, async (transaction) => {
        const freshClassDoc = await transaction.get(classRef);
        if (!freshClassDoc.exists()) {
          throw new Error("Class does not exist!");
        }
        const freshClassData = freshClassDoc.data();
        if (freshClassData.students && freshClassData.students.includes(studentUID)) {
          throw new Error('You are already enrolled in this class.');
        }
        transaction.update(classRef, {
          students: freshClassData.students ? [...freshClassData.students, studentUID] : [studentUID]
        });
      });

      // Update local state
      setClasses(prevClasses => [...prevClasses, { id: classDoc.id, ...classData }]);
      return true;
    } catch (err) {
      throw err;
    }
  }, [studentUID]);



  useEffect(() => {
    const processPendingClasses = async () => {
      try {
        const studentRef = doc(db, 'students', studentUID);
        const studentDoc = await getDoc(studentRef);
        if (studentDoc.exists()) {
          const pendingClasses = studentDoc.data().pendingClasses || [];
          for (const classCode of pendingClasses) {
            try {
              await handleJoinClass(classCode);
              // After successful join, remove the classCode from pendingClasses
              await updateDoc(studentRef, {
                pendingClasses: arrayRemove(classCode)
              });
            } catch (err) {
              console.error(`Error joining class with code ${classCode}:`, err);
              // Optionally, you can handle errors here, e.g., show a notification
            }
          }
        }
      } catch (error) {
        console.error("Error processing pending classes:", error);
      }
    };
  
    processPendingClasses();
  }, [studentUID, handleJoinClass]);
  
  // Function to handle joining a class

  // Function to fetch classes
  const fetchClasses = useCallback(async () => {
    if (!studentUID) {
      console.error("No student UID available");
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const classesRef = collection(db, 'classes');
      const classQuery = query(classesRef, where('students', 'array-contains', studentUID));

      const classesSnapshot = await getDocs(classQuery);

      let classesData = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      classesData.sort((a, b) => {
        const periodA = parseInt(a.className.split(' ')[1]);
        const periodB = parseInt(b.className.split(' ')[1]);
        return periodA - periodB;
      });

      setClasses(classesData);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching classes:", err);
      setError("Failed to load classes. Please try again.");
      setLoading(false);
    }
  }, [studentUID]);

  // Fetch classes on component mount
  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // Handle retries on error
  useEffect(() => {
    if (error && retryCount < 3) {
      const timer = setTimeout(() => {
        setRetryCount(prevCount => prevCount + 1);
        fetchClasses();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, retryCount, fetchClasses]);

  // Function to get ordinal suffix for period numbers
  const getOrdinalSuffix = (num) => {
    const number = parseInt(num);
    if (number === 1) return "st";
    if (number === 2) return "nd";
    if (number === 3) return "rd";
    return "th";
  };

  // **New useEffect to handle joining via URL params**
  useEffect(() => {
    if (code) {
      // Attempt to join the class with the code from URL params
      handleJoinClass(code)
        .then(() => {
          // On success, navigate to '/studenthome' to clear the code from URL
          navigate('/studenthome', { replace: true });
        })
        .catch(err => {
          // On error, set the error message and show the JoinClassModal
          setJoinClassError(err.message);
          setShowJoinClassModal(true);
          // Navigate to '/studenthome' to clear the code from URL
          navigate('/studenthome', { replace: true });
        });
    }
  }, [code, handleJoinClass, navigate]);

  // **Render Loading State**
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

  // **Render Error State**
  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#white' }}>
        <HomeNavbar userType="student" />
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p style={{ color: 'red', fontFamily: "'montserrat', sans-serif", fontSize: '18px' }}>{error}</p>
          <button 
            onClick={fetchClasses} 
            style={{
              marginTop: '10px',
              padding: '10px 20px',
              backgroundColor: '#020CFF',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontFamily: "'montserrat', sans-serif",
              fontSize: '16px'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // **Main Render**
  return (
    <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#white', flexWrap: 'wrap' }}>
      <HomeNavbar userType="student" />
      <style>{loaderStyle} </style>
      
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px', backgroundColor: '#white', marginBottom: '230px' }}>
        <div style={{width: '100%', borderBottom: '1px solid lightgrey',  marginBottom: '-40px'}}>
          <h1 style={{
            fontSize: '30px',
            marginLeft: 'calc(4% + 200px)',
            fontWeight: '600'
          }}>
            Home
          </h1>

          <button
            style={{
              background: 'none',
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer',
              marginLeft: 'calc(4% + 200px)',
              fontWeight: "600",
              padding: '12px 10px',
              fontFamily: "'Montserrat', sans-serif",
              borderBottom:  '2px solid #E01FFF',
              color:  '#E01FFF',
            }}
          >
            Classes
          </button>
      
          <button
            style={{
              background: 'none',
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer',
              marginLeft: '50px',
              fontWeight: "600",
              padding: '12px 10px',
              fontFamily: "'Montserrat', sans-serif",
              borderBottom:  '2px solid transparent',
              color:  'grey',
            }}
          >
            Tutorials
          </button>
        </div>

        <div style={{
          marginTop: '40px',
          display: 'flex',
          flexWrap:'wrap', 
          width: 'calc(92% - 200px)',
          marginLeft: 'calc(200px)',
          fontFamily: "'montserrat', sans-serif",
          backgroundColor: 'white',
        }}>
          <div style={{ fontFamily: "'montserrat', sans-serif",width: '100%', display: 'flex', height: '30px', marginBottom: '10px', marginTop: '30px' }}>
            <h4 style={{
              fontSize: '25px', 
              marginTop: '10px',
              fontWeight: '600'
            }}>Your Classes</h4>

            <button
              onClick={() => setShowJoinClassModal(true)}
              style={{
                marginRight: '4%', 
                backgroundColor: 'white',
                border: '1px solid lightgrey',
                marginLeft: 'auto',
                fontSize: '16px', 
                width: '140px',
                marginTop: '0px',
                transition: '.3s', 
                color: 'grey',
                borderRadius: '5px',
                padding: '10px 5px', 
                fontWeight: '600',
                fontFamily: "'montserrat', sans-serif",
                textAlign: 'center', 
                lineHeight: '20px',
                cursor: 'pointer',
                height: '40px',
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#45B434';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = 'grey';
              }}
            >
              Join Class +
            </button>
          </div>

          {classes.map(classItem => {
            const periodNumber = parseInt(classItem.className.split(' ')[1]);
            const periodStyle = periodStyles[periodNumber] || { background: '#F4F4F4', color: 'grey' };
            const suffix = getOrdinalSuffix(periodNumber);
            return (
              <button 
                key={classItem.id}
                onClick={() => navigate(`/studentassignments/${classItem.id}/active`)}
                style={{
                  marginRight: '3%',
                  flex: 1,
                  width: "30%",
                  maxWidth: '30%',
                  marginTop: '20px', 
                  height: '150px',
                  display: 'flex',
                  backgroundColor: 'transparent',  
                  color: 'grey', 
                  cursor: 'pointer',
                  border: '1px solid #ededed',
                  boxShadow: 'rgba(50, 50, 205, 0.05) 0px 2px 5px 0px, rgba(0, 0, 0, 0.05) 0px 1px 1px 0px',
                  borderRadius: '15px', 
                  textAlign: 'left',
                  flexDirection: 'column',
                  alignItems: 'left',
                  transition: '.2s', 
                  position: 'relative',
                  zIndex: '1',
                  fontFamily: "'montserrat', sans-serif",
                  transform: 'scale(1)',
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#dddddd';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#ededed';
                }}
                className="hoverableButton"
              >
                <div style={{display: 'flex', padding: '20px'}}>
                  <h1 style={{
                    fontSize: '30px',
                    borderRadius: '5px',
                    backgroundColor: periodStyle.background,
                    color: periodStyle.color,
                    height: '40px',
                    marginTop: '6px',
                    lineHeight: '40px',
                    fontWeight: '600',
                    padding: '0px 10px',
                  }}>
                    {periodNumber}
                    <span style={{
                      fontSize: '30px',
                      fontWeight: '600',
                      marginLeft: '2px',
                    }}>
                      {suffix}
                    </span>
                  </h1>
                
                  <h1 style={{
                    fontSize: '40px',
                    color: periodStyle.color,
                    margin: 0,
                    fontWeight: '600',
                    marginLeft: '10px',
                  }}>
                    Period
                  </h1>
                </div>

                <p style={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis', 
                  marginLeft: '20px',
                  textAlign: 'left',
                  color: 'lightgrey', 
                  fontWeight: '600', 
                  marginTop: '0px',
                  fontSize: '16px',
                  whiteSpace: 'nowrap',
                  width: '268px',
                  background: 'transparent',   
                }}>
                  {classItem.classChoice}
                </p>
              </button>
            );
          })}
        </div>
      </main>

      {showJoinClassModal && (
        <JoinClassModal
          onSubmit={handleJoinClass}
          onClose={() => setShowJoinClassModal(false)} 
          error={joinClassError}  // Pass the error message to the modal
        />
      )}

      <FooterAuth style={{marginTop: '100px'}}/>
    </div>
  );
};

export default StudentHome;
