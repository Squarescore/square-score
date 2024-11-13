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
    setJoinClassError('');
    try {
      const classesRef = collection(db, 'classes');
      const classQuery = query(classesRef, where('classCode', '==', classCode));
      const classQuerySnapshot = await getDocs(classQuery);
  
      if (classQuerySnapshot.empty) {
        throw new Error('Class not found.');
      }
      const classDoc = classQuerySnapshot.docs[0];
      const existingStudents = classDoc.data().students || [];
      const existingJoinRequests = classDoc.data().joinRequests || [];
  
      if (existingStudents.includes(studentUID) || existingJoinRequests.includes(studentUID)) {
        throw new Error('You have already joined or requested to join this class.');
      }
  
      const joinRequests = [...existingJoinRequests, studentUID];
      await updateDoc(doc(db, 'classes', classDoc.id), { joinRequests });
  
      setShowJoinClassModal(false);
      // Optionally, you can update the UI to show the pending request
      setPendingRequests(prev => [...prev, classDoc.data()]);
    } catch (err) {
      setJoinClassError(err.message);
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
          top: '70px',
          zIndex: '10000',
          left: '0',
          right: '0',
          display: 'flex',
          flexDirection: 'column',
          
        }}>
          <div style={{width: '100%', background: '#F4C10A', height: '6px'}}></div>
          <div style={{
            width: "400px",
            marginLeft: '19%',
            marginRight: 'auto',
            backgroundColor: '#FFECA8',
            border: '4px solid #F4C10A',
            borderBottomLeftRadius: '20px',
            borderTop: '0px',
            borderBottomRightRadius: '20px',
            padding: '0px 20px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            marginTop: '0px',
            marginBottom: '20px',
            whiteSpace: 'nowrap'
          }}>
            <p style={{ color: 'grey', fontWeight: 'bold', marginRight: '20px' }}>
              Waiting for teacher to accept request
            </p>
            <div className="loader"></div>
          </div>
        </div>
      )}
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px', backgroundColor: '#white', marginBottom: '230px' }}>
        <div style={{
          marginTop: '70px',
          display: 'flex',
          flexWrap:'wrap', 
          width: '1000px',
          fontFamily: "'montserrat', sans-serif",
          backgroundColor: '#white',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          <h4 style={{width: '90%', marginLeft: '32px', fontSize: '60px', marginBottom: '20px', marginTop: '60px', fontFamily: "'montserrat', sans-serif",}}>Your Classes</h4>
       
          {classes.map(classItem => {
            const periodNumber = parseInt(classItem.className.split(' ')[1]);
            const periodStyle = periodStyles[periodNumber] || { background: '#F4F4F4', color: 'grey' };
            return (
              <div key={classItem.id} style={{ 
                marginBottom: '10px',
                width: '300px',
                marginLeft:'32px',
                display: 'inline-block',
                flexDirection: 'column',
                flexWrap: 'wrap',
                alignItems: 'center', 
                fontFamily: "'montserrat', sans-serif" ,
                position: 'relative',
                marginTop: '20px', 
              }}>
                <div style={{
                  fontSize: '16px',
                  height: '50px',
                  marginLeft: 'auto',
                  
                  marginRight: 'auto',
                  fontFamily: "'montserrat', sans-serif",
                  textAlign: 'center',
                  marginBottom: '-27px',
                  zIndex: '20',
                  color: 'grey',
                  position: 'relative',
                  fontWeight: 'lighter',
                  backgroundColor: 'transparent',
                  alignItems: 'center',
                  lineHeight: '1',
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: '268px',
                    border: `6px solid ${periodStyle.color}`,
                    backgroundColor: periodStyle.background,
                    paddingLeft: '0px',
                    paddingRight: '0px'
                    , marginTop: '40px',
                    marginLeft: '0px',
                    height: '30px',
                    fontWeight: 'bold',
                    color: periodStyle.color,
                    lineHeight: '30px',
                    borderTopLeftRadius: '15px',
                    borderTopRightRadius: '15px',
                   
                  }}>
                    <p style={{marginTop: '0px',  overflow: 'hidden',
                    textOverflow: 'ellipsis', 
                    textAlign: 'center',
                    whiteSpace: 'nowrap',width: '240px', background: 'tranparent', marginLeft: 'auto', marginRight: 'auto', }}>{classItem.classChoice}</p>
                    
                  </div>
                </div>
            
                <button
                  onClick={() => navigate(`/studentassignments/${classItem.id}/active`)} 
                  style={{ 
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    flex: 1,
                    fontWeight: '800',
                    width: '280px',
                    height: '130px',
                    justifyContent: 'center',
                    display: 'flex',
                    backgroundColor: 'transparent',  
                    color: 'grey', 
                    cursor: 'pointer',
                    border: '2px solid white', 
                    boxShadow: '1px 1px 5px 1px rgb(0,0,155,.1)',
                    borderRadius: '15px', 
                    lineHeight: '30px',
                    textAlign: 'left',
                    flexDirection: 'column',
                    alignItems: 'center',
                    transition: '.2s', 
                    position: 'relative',
                    zIndex: '1',
                    marginTop:'0px',
                    fontFamily: "'montserrat', sans-serif",
                    transform: 'scale(1)',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#f4f4f4';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = 'white';
                  }}
                  className="hoverableButton"
                >
                 <h1 style={{fontSize: '35px', marginTop: '60px', width: '250px',  textAlign: 'center',
                      fontWeight: '600',}}>{classItem.className}</h1>
                </button>
              </div>
            );
          })}
        </div>

        <div style={{width: '1000px', marginRight: 'auto', marginLeft: 'auto', marginTop: '30px'}}>
          
   
      <button
            onClick={() => setShowJoinClassModal(true)}
            style={{
              marginRight: 'auto', 
              backgroundColor: '#AEF2A3' , 
              marginBottom: '100px',
              border: '5px solid #45B434',
              marginLeft: '45px',
              fontSize: '20px', 
              transition: '.3s', 
              
              fontFamily: "'montserrat', sans-serif",
              color: '#45B434',
              borderRadius: '10px',
              padding: '10px 0px', 
              width: '150px', 
              textAlign: 'center', 
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.target.style.opacity = '80%';
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = '100%';
            }}
          >
            Join Class +
          </button>
        </div>
      </main>

      {showJoinClassModal && (
  <JoinClassModal
    onSubmit={handleJoinClass}
    onClose={() => setShowJoinClassModal(false)}
  />
)}

      <FooterAuth style={{marginTop: '100px'}}/>
    </div>
  );
};

export default StudentHome;