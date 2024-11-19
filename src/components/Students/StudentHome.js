import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '../Universal/firebase';
import { collection, query, where, getDocs } from "firebase/firestore";
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
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
  const [classes, setClasses] = useState([]);
  const studentUID = auth.currentUser.uid;
  
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showJoinClassModal, setShowJoinClassModal] = useState(false);
const [classCode, setClassCode] = useState('');
const [code, setCode] = useState(['', '', '', '', '', '']);
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


  const handleLeaveClass = async (classId) => {
    if (window.confirm("Are you sure you want to leave this class?")) {
      try {
        const classRef = doc(db, 'classes', classId);
        const classDoc = await getDoc(classRef);
        const classData = classDoc.data();
    
        if (classData.students.includes(studentUID)) {
          const updatedStudents = classData.students.filter(uid => uid !== studentUID);
          await updateDoc(classRef, { students: updatedStudents });
          setClasses(prevClasses => prevClasses.filter(classItem => classItem.id !== classId));
        }
      } catch (error) {
        console.error("Error leaving class:", error);
      }
    }
  };
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);
  const handleJoinClass = async (classCode) => {
    try {
      const classesRef = collection(db, 'classes');
      const classQuery = query(classesRef, where('classCode', '==', classCode));
      const classQuerySnapshot = await getDocs(classQuery);
  
      if (classQuerySnapshot.empty) {
        throw new Error('Invalid class code. Please check the code and try again.');
      }
  
      const classDoc = classQuerySnapshot.docs[0];
      const existingStudents = classDoc.data().students || [];
      const existingJoinRequests = classDoc.data().joinRequests || [];
  
      if (existingStudents.includes(studentUID)) {
        throw new Error('You are already enrolled in this class.');
      }
  
      if (existingJoinRequests.includes(studentUID)) {
        throw new Error('You have already requested to join this class. Please wait for teacher approval.');
      }
  
      const joinRequests = [...existingJoinRequests, studentUID];
      await updateDoc(doc(db, 'classes', classDoc.id), { joinRequests });
  
      setPendingRequests(prev => [...prev, classDoc.data()]);
      return true;
    } catch (err) {
      throw err;
    }
  };
  
  const fetchClassesAndRequests = useCallback(async () => {
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
      const requestQuery = query(classesRef, where('joinRequests', 'array-contains', studentUID));

      const [classesSnapshot, requestsSnapshot] = await Promise.all([
        getDocs(classQuery),
        getDocs(requestQuery)
      ]);

      let classesData = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const requestsData = requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      classesData.sort((a, b) => {
        const periodA = parseInt(a.className.split(' ')[1]);
        const periodB = parseInt(b.className.split(' ')[1]);
        return periodA - periodB;
      });

      setClasses(classesData);
      setPendingRequests(requestsData);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching classes and requests:", err);
      setError("Failed to load classes. Please try again.");
      setLoading(false);
    }
  }, [studentUID]);

  useEffect(() => {
    // Initial fetch
    fetchClassesAndRequests();

    // Only set up the interval if there are pending requests
    let interval;
    if (pendingRequests.length > 0) {
      interval = setInterval(() => {
        // Only fetch if the page is visible
        if (document.visibilityState === 'visible') {
          fetchClassesAndRequests();
        }
      }, 30000); // Changed to 30 seconds to reduce frequency
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [fetchClassesAndRequests, pendingRequests.length]);

  useEffect(() => {
    if (error && retryCount < 3) {
      const timer = setTimeout(() => {
        setRetryCount(prevCount => prevCount + 1);
        fetchClassesAndRequests();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, retryCount, fetchClassesAndRequests]);
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

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#white' }}>
        <HomeNavbar userType="student" />
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p style={{ color: 'red', fontFamily: "'montserrat', sans-serif", fontSize: '18px' }}>{error}</p>
          <button 
            onClick={fetchClassesAndRequests} 
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
  return (
    <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#white', flexWrap: 'wrap', }}>
      <HomeNavbar userType="student" />
      <style>{loaderStyle} </style>
      {pendingRequests.length > 0 && (
        <div style={{
          position: 'fixed',
    bottom: '20px',
    zIndex: '10000',
    right: '4%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
          
        }}>
          <div style={{
            width: "400px", marginLeft: '0%',
            marginRight: 'auto',
            backgroundColor: '#FFECA8',
            border: '1px solid #F4C10A',
            borderRadius: '10px',
   
      padding: '0px 20px',
      height: '50px',
      display: 'flex',
      alignItems: 'left',
      marginTop: '0px',
      marginBottom: '20px',
      whiteSpace: 'nowrap'
          }}>
            <p style={{ color: '#F4C10A', fontWeight: '600', marginRight: '20px' }}>
              Waiting for teacher to accept request
            </p>
            <div className="loader"></div>
          </div>
        </div>
      )}


      
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px', backgroundColor: '#white', marginBottom: '230px' }}>
      <div style={{width: '100%', borderBottom: '1px solid lightgrey',  marginBottom: '-40px'}}>
            <h1 style={{
fontSize: '30px',
marginLeft: 'calc(4% + 200px)',
fontWeight: '600'


            }}>
Home    </h1>

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
              color:  '#E01FFF' ,
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
             color:  'grey' ,
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

           
         

<div style={{ fontFamily: "'montserrat', sans-serif",width: '100%', display: 'flex', height: '30px',

  marginBottom: '10px', marginTop: '30px',

}}>
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
            
            return (
              <button 
                key={classItem.id}
                onClick={() => navigate(`/studentassignments/${classItem.id}/active`)}
                style={{
                  height: '130px',
                  marginRight: '3%',
                  
                  marginTop: '30px',
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
                  fontFamily: "'montserrat', sans-serif",
                  width: '30%'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#dddddd';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#ededed';
                }}
                className="hoverableButton"
              >
                <h1 style={{
                  backgroundColor: periodStyle.background,
                  color: periodStyle.color,
                  marginLeft: '15%',
                  height: '16px',
                  lineHeight: '16px',
                  marginTop: '40px',
                  width: '180px',
                  textAlign: 'left',
                  paddingLeft: '5px',
                  fontSize: '40px',
                  fontWeight: '600'
                }}>
                  {classItem.className}
                </h1>
                
                <p style={{
                  marginTop: '-10px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginLeft: '15%',
                  textAlign: 'left',
                  color: 'lightgrey',
                  fontWeight: '600',
                  fontSize: '16px',
                  whiteSpace: 'nowrap',
                  width: '268px',
                  background: 'transparent'
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
    onClose={() => setShowJoinClassModal(false)} error={joinClassError}  // Add this line to pass the error
    />

)}

      <FooterAuth style={{marginTop: '100px'}}/>
    </div>
  );
};

export default StudentHome;