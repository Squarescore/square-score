import React, { useState } from 'react';
import { auth, db } from './firebase';
import { doc, getDocs, query, where, updateDoc, collection } from "firebase/firestore";
import { Link } from 'react-router-dom';
import CNavbar from './CJNavbar';
import { useNavigate } from 'react-router-dom';

import  {useCallback, useEffect } from 'react';
import HomeNavbar from './HomeNavbar';
const JoinClass = () => {
  const [classCode, setClassCode] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleJoinClass = async (e) => {
    e.preventDefault();
    try {
      const classesRef = collection(db, 'classes');
      const classQuery = query(classesRef, where('classCode', '==', classCode));
      const classQuerySnapshot = await getDocs(classQuery);

      if (classQuerySnapshot.empty) {
        throw new Error('Class not found.');
      }

      const classDoc = classQuerySnapshot.docs[0];
      const studentUID = auth.currentUser.uid;

      const existingStudents = classDoc.data().students || [];
      const existingJoinRequests = classDoc.data().joinRequests || [];

      if (existingStudents.includes(studentUID) || existingJoinRequests.includes(studentUID)) {
        throw new Error('You have already joined or requested to join this class.');
      }

      const joinRequests = [...existingJoinRequests, studentUID];
      await updateDoc(doc(db, 'classes', classDoc.id), { joinRequests });

      // Navigate to StudentHome after successful request
      navigate('/');
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  // Function to close the modal and optionally navigate home
  const handleCloseModal = () => {
    setShowModal(false);
    navigate('/'); // Navigate to home or any other route
  };
  const handleBack = () => {
    navigate(-1);
  };
  const getRandomColorClass = () => {
    const colors = ['color-1', 'color-2', 'color-3', 'color-4', 'color-5'];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  const generateUniquePositions = useCallback((count, size, margin) => {
    const positions = [];
    const documentHeight = document.documentElement.scrollHeight;
    const documentWidth = window.innerWidth;
  
    for (let i = 0; i < count; i++) {
      let newPos;
      let attempts = 0;
      do {
        newPos = {
          top: Math.random() * (documentHeight - size) + 'px',
          left: Math.random() * (documentWidth - size) + 'px',
        };
        attempts++;
      } while (positions.some(pos => {
        const dx = parseFloat(newPos.left) - parseFloat(pos.left);
        const dy = parseFloat(newPos.top) - parseFloat(pos.top);
        return Math.sqrt(dx * dx + dy * dy) < size + margin;
      }) && attempts < 100);
  
      if (attempts < 100) {
        positions.push(newPos);
      }
    }
  
    return positions;
  }, []);
  const [positions, setPositions] = useState([]);
  
  useEffect(() => {
    setPositions(generateUniquePositions(20, 200, 100));
  }, [generateUniquePositions]);
 
  return (
    <div style={{ 
      
      
      height: '100vh', display: 'flex', flexDirection: 'column', 
      }}>
          <HomeNavbar userType="student" />
          {positions.map((pos, index) => (
      <div
        key={index}
        className={`background-div ${getRandomColorClass()}`}
        style={{
          top: pos.top,
          left: pos.left,
          position: 'absolute',
          width: '200px',
          height: '200px',
        }}
      />
    ))}
    <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '200px' }}>
   
    <button 
      onClick={handleBack} 
      style={{ position: 'fixed',fontFamily: "'Radio Canada', sans-serif",left: '40px', top :'20px', zIndex: '1000',textDecoration: 'none',  color: 'black', backgroundColor: 'transparent', border: 'none', cursor: 'pointer',  }}>
    <img src="https://static.thenounproject.com/png/1875804-200.png" style={{width: '30px', opacity: '50%'}}/>
    </button>

    <form className="white-background" onSubmit={handleJoinClass} style={{  display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'rgb(255,255,255,.8)', backdropFilter: 'blur(5px)', width: '700px', marginTop: '-100PX', }}>
      <h1 style={{ fontSize: '80px', fontFamily: '"rajdhani", sans-serif'}}>Join Class</h1>
      <input type="text"  placeholder='Code' onChange={e => setClassCode(e.target.value)} required 
      style={{  fontFamily: "'rajdhani', sans-serif", fontSize: '100px', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', background: "rgb(200,200,200,.4)",
       width: '440px',paddingLeft: '60px',paddingRight: '60px', paddingTop: '10px', paddingBottom: '10px', fontWeight: 'bold',
        textAlign: 'Left', borderColor: 'transparent',borderBottom: '6px solid lightgrey',
         outline: 'none', }} />
      <button 
            type="submit" 
            disabled={!classCode}
            style={{  boxShadow: ' 0px 4px 4px 0px rgba(0, 0, 0, 0.25)',
           fontFamily: "'Radio Canada', sans-serif",
           fontWeight: 'bold',
              fontSize: '20px',
             marginTop: '10%',
              width: '70%', 
              padding: '15px 0',
              transform: 'scale(1)',
              backgroundColor: (!classCode) ? 'grey' : '#627BFF',
              color: (!classCode) ? 'darkgrey' : 'white',  
              border: 'none', 
              borderRadius: '10px',  
              transition: '.3s',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)',
              cursor: (!classCode) ? 'default' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (e.target.style.backgroundColor === 'lightgreen') {
              e.target.style.transform = 'scale(1.01)'
              e.target.style.opacity = '99%';
              }
              
            }}
            onMouseLeave={(e) => {
              if (e.target.style.backgroundColor === 'lightgreen') {
              e.target.style.opacity = '100%';
              e.target.style.transform = 'scale(1)'
              }
            }}
          >
           Submit Request
          </button>
      {successMessage && <p style={{ fontFamily: "'Radio Canada', sans-serif",}}>{successMessage}</p>}
      {errorMessage && <p style={{ fontFamily: "'Radio Canada', sans-serif",}}>{errorMessage}</p>}
    
    </form>
    {showModal && (
          <div style={{ position: 'fixed', marginRight: 'auto', marginLeft: 'auto', width: '800px', height: '500px', backgroundColor: 'rgb(240,240,240)', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
            <p style={{textAlign: 'center', fontSize: '40px', fontWeight: 'bold', color: 'grey'}}>{successMessage}</p>
            <button onClick={handleCloseModal} style={{ padding: '20px 100px', borderRadius: '5px', border: 'none',fontFamily: "'Radio Canada', sans-serif", backgroundColor: 'black', color: 'white', cursor: 'pointer', fontSize:' 30px' , marginLeft: '195px', }}>
              Return Home
            </button>
            </div>
        )}
    </main>
    </div>
  );
};

export default JoinClass;
