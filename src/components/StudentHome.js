import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from './firebase'; // Ensure this path is correct
import { collection, query, where, getDocs } from "firebase/firestore";
import { signOut } from 'firebase/auth'; // Import signOut function
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import HomeNavbar from './HomeNavbar';
import FooterAuth from './FooterAuth';
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
const [joinClassError, setJoinClassError] = useState('');
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  const handleJoinClass = async (e) => {
    e.preventDefault();
    setJoinClassError('');
    const trimmedClassCode = classCode.replace(/\s+/g, ''); // Remove all spaces
    try {
      const classesRef = collection(db, 'classes');
      const classQuery = query(classesRef, where('classCode', '==', trimmedClassCode));
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
      setClassCode('');
      // Optionally, you can update the UI to show the pending request
      setPendingRequests(prev => [...prev, classDoc.data()]);
    } catch (err) {
      setJoinClassError(err.message);
    }
  };
  useEffect(() => {
    const fetchClassesAndRequests = async () => {
      const classesRef = collection(db, 'classes');
      const classQuery = query(classesRef, where('students', 'array-contains', studentUID));
      const requestQuery = query(classesRef, where('joinRequests', 'array-contains', studentUID));
  
      const [classesSnapshot, requestsSnapshot] = await Promise.all([
        getDocs(classQuery),
        getDocs(requestQuery)
      ]);
  
      let classesData = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const requestsData = requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort classes by period number
      classesData.sort((a, b) => {
        const periodA = parseInt(a.className.split(' ')[1]);
        const periodB = parseInt(b.className.split(' ')[1]);
        return periodA - periodB;
      });
  
      setClasses(classesData);
      setPendingRequests(requestsData);
    };
  
    fetchClassesAndRequests();
    const interval = setInterval(fetchClassesAndRequests, 5000); // Fetch every 5 seconds
  
    return () => clearInterval(interval);
  }, [studentUID]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'white', flexWrap: 'wrap' }}>
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
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px', backgroundColor: 'white', marginBottom: '230px' }}>
        <div style={{
          marginTop: '70px',
          display: 'flex',
          flexWrap:'wrap', 
          width: '1000px',
          fontFamily: "'Radio Canada', sans-serif",
          backgroundColor: 'white',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          <h4 style={{width: '90%', marginLeft: '32px', fontSize: '60px', marginBottom: '0px', marginTop: '60px', fontFamily: "'Rajdhani', sans-serif",}}>Your Classes</h4>
       
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
                fontFamily: "'Radio Canada', sans-serif" ,
                position: 'relative',
                marginTop: '20px', 
              }}>
                <h1 style={{
                  fontSize: '16px',
                  height: '50px',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  fontFamily: "'Radio Canada', sans-serif",
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
                  <p style={{
                    width: '268px',
                    border: `6px solid ${periodStyle.color}`,
                    backgroundColor: periodStyle.background,
                    paddingLeft: '0px',
                    paddingRight: '0px',
                    marginLeft: '0px',
                    height: '30px',
                    fontWeight: 'bold',
                    color: periodStyle.color,
                    lineHeight: '30px',
                    borderTopLeftRadius: '15px',
                    borderTopRightRadius: '15px',
                  }}>
                    <p style={{
                      marginTop: '0px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      width: '250px',
                      background: 'transparent',
                      marginLeft: 'auto',
                      marginRight: 'auto'
                    }}>{classItem.classChoice}</p>
                  </p>
                </h1>
            
                <button
                  onClick={() => navigate(`/studentassignments/${classItem.id}`)} 
                  style={{ 
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    flex: 1,
                    fontWeight: 'bold',
                    width: '280px',
                    height: '140px',
                    justifyContent: 'center',
                    display: 'flex',
                    backgroundColor: 'transparent',  
                    color: 'grey', 
                    
                    borderRadius: '15px', 
                    lineHeight: '90px',
                    textAlign: 'center',
                    flexDirection: 'column',
                    alignItems: 'center',
                    fontSize: '45px',
                    transition: '.2s', 
                    position: 'relative',
                    zIndex: '1',
                    marginTop:'0px',
                    cursor: 'pointer',
                    fontFamily: "'rajdhani', sans-serif",
                    transform: 'scale(1)',
                    border: '6px solid #F4F4F4', 
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#E8E8E8';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = '#f4f4f4';
                  }}
                  className="hoverableButton"
                >
                  {classItem.className}
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
              marginLeft: '32px',
              fontSize: '20px', 
              transition: '.3s', 
              color: '#45B434',
              borderRadius: '10px',
              padding: '10px 20px', 
              width: '200px', 
              textAlign: 'center', 
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.target.style.opacity = '90%';
              e.target.style.boxShadow = ' 0px 4px 4px 0px rgba(0, 0, 0, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = '100%';
              e.target.style.boxShadow = ' none ';
            }}
          >
            Join Class +
          </button>
        </div>
      </main>

      {showJoinClassModal && (
        <div style={{
          position: 'fixed',
          top: 70,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100
        }}>
          <div style={{
            backgroundColor: 'transparent',
            padding: '20px',
            borderRadius: '10px',
            width: '600px'
          }}>
            <h2 style={{ fontSize: '80px', fontFamily: '"rajdhani", sans-serif', marginTop:' -100px', marginBottom: '20px', textAlign: 'center' }}>Join Class</h2>
            <form onSubmit={handleJoinClass}>
              <input
                type="text"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                placeholder=' input code'
                style={{
                  fontFamily: "'rajdhani', sans-serif", fontSize: '60px',background: "white", borderRadius: '20px', border: '4px solid lightgrey',
                width: '360px',paddingLeft: '140px',paddingRight: '60px', paddingTop: '10px', paddingBottom: '10px', fontWeight: 'bold',
                 textAlign: 'Left', 
                  outline: 'none',
                }}
              />
              {joinClassError && <p style={{ color: 'red', marginBottom: '10px' }}>{joinClassError}</p>} 
              
              <p style={{
                       fontFamily: "'Radio Canada', sans-serif", fontSize: '20px', fontStyle: 'italic', fontWeight: 'bold', color: 'grey'}} >Caps sensitive. zero and O look similar - try both if applicable</p>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button
                  type="submit"
                  style={{ 
                    padding: '10px 20px', 
                    backgroundColor: '#AEF2A3',
                border: '5px solid #45B434',
                color: '#45B434',
                      borderRadius: '15px',
                       cursor: 'pointer', 
                      marginTop: '30px',
                       fontFamily: "'Radio Canada', sans-serif",
                       fontWeight: 'bold',
                       fontSize: '30px',
                       width: '50%',
                       marginRight: '10px' }}
                >
                  Submit Request
                </button>
                <button
                  type="button"
                  onClick={() => setShowJoinClassModal(false)}
                  style={{ 
  
                    padding: '10px 20px', 
                    backgroundColor: '#f4f4f4',
                border: '5px solid lightgrey',
                color: 'grey',
                      borderRadius: '15px',
                       cursor: 'pointer', 
                      marginTop: '30px',
                       fontFamily: "'Radio Canada', sans-serif",
                       fontWeight: 'bold',
                       fontSize: '30px',
                       width: '40%',
                       marginRight: '5%'
                   }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <FooterAuth style={{marginTop: '100px'}}/>
    </div>
  );
};

export default StudentHome;