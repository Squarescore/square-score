import React from 'react';
import { Link } from 'react-router-dom';
import { db, auth } from './firebase';
import { collection, query, where, doc, deleteDoc } from "firebase/firestore";
import { useState, useEffect } from 'react';
import {  useNavigate, useLocation } from 'react-router-dom';

import { useCollection } from 'react-firebase-hooks/firestore';
import { getAuth, signOut } from 'firebase/auth';
import HomeNavbar from './HomeNavbar';
import FooterAuth from './FooterAuth'; // Make sure this file exists in the same directory
const TeacherHome = () => {
  const navigate = useNavigate();
  const location = useLocation();
 

  const [successMessage, setSuccessMessage] = useState('');
  const [newClassId, setNewClassId] = useState('');

  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      setNewClassId(location.state.classId);
      // Clear the message from location state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleDismiss = () => {
    setSuccessMessage('');
    setNewClassId('');
  };
  
  const handleAddStudents = () => {
    setSuccessMessage('');
    setNewClassId('');
    navigate(`/class/${newClassId}/participants`);
  };
  const getRandomColor = () => {
    return hoverColors[Math.floor(Math.random() * hoverColors.length)];
  };
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  const hoverColors = [
    { background: '#F8CFFF', border: '#E01FFF' },
    { background: '#A3F2ED', border: '#4BD682' },
    { background: '#AEF2A3', border: '#006428' },
    { background: '#FFECA8', border: '#CE7C00' },
    { background: '#627BFF', border: '#020CFF' }
  ];
  
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
  const handleDeleteClass = async (classId) => {
    if (window.confirm("Are you sure you want to delete this class?")) {
      const classDocRef = doc(db, 'classes', classId);
      await deleteDoc(classDocRef);
    }
  };

  const classesRef = collection(db, 'classes');
  const teacherUID = auth.currentUser.uid;
  const classQuery = query(classesRef, where('teacherUID', '==', teacherUID));
  const [querySnapshot, loading, error] = useCollection(classQuery);

  const classes = querySnapshot?.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
 
 
  return (
    <div style={{  display: 'flex', flexDirection: 'column', backgroundColor: 'white', flexWrap: 'wrap' }}>
     <HomeNavbar userType="teacher" />
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px', backgroundColor: 'white', marginBottom: '230px' }}>
        {loading && <p>Loading...</p>}
        {error && <p>Error: {error.message}</p>}

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
            {successMessage && (
  <div style={{
    position: 'fixed',
    top: '70px',
    zIndex: '10000',
    left: '0',
    right: '0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  }}>
    <div style={{width: '100%', background: '#4BD682', height: '6px'}}></div>
    <div style={{
      backgroundColor: '#AEF2A3',
      border: '6px solid #4BD682',
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
      <p style={{ color: '#45B434', fontWeight: 'bold', marginRight: '20px' }}>{successMessage}</p>
      <button
        onClick={handleAddStudents}
        style={{
          backgroundColor: '#FFECA9',
          color: '#CE7C00',
          fontSize: '16px',
          fontFamily: "'Radio Canada', sans-serif",
          fontWeight: 'BOLD',
          height: '30px',
          border: '6px solid #CE7C00',
          borderRadius: '5px',
          marginRight: '10px',
          cursor: 'pointer'
        }}
      >
        Add Students
      </button>
      <button
        onClick={handleDismiss}
        style={{
          backgroundColor: 'white',
          color: '#4BD682',
          fontSize: '16px',
          fontFamily: "'Radio Canada', sans-serif",
          fontWeight: 'BOLD',
          height: '30px',
          border: '6px solid #4BD682',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Dismiss
      </button>
    </div>
  </div>
)}
            <h4 style={{ fontFamily: "'Rajdhani', sans-serif",width: '90%', marginLeft: '32px', fontSize: '60px', marginBottom: '10px', marginTop: '40px'}}>Your Classes</h4>
       
   
            {classes && classes
          .sort((a, b) => a.className.localeCompare(b.className)) // Sort alphabetically by className
          .map((classItem, index) => {
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
                fontFamily: "'Poppins', sans-serif" ,
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
                    <p style={{marginTop: '0px',  overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',width: '250px', background: 'tranparent', marginLeft: 'auto', marginRight: 'auto'}}>{classItem.classChoice}</p>
                    
                  </p>
                </h1>
            
                <button 
                  onClick={() => navigate(`/class/${classItem.id}`)} 
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
                    cursor: 'pointer',
                    border: '6px solid #F4F4F4', 
                    borderRadius: '15px', 
                    textAlign: 'center',
                    flexDirection: 'column',
                    alignItems: 'center',
                    fontSize: '35px',
                    transition: '.2s', 
                    position: 'relative',
                    zIndex: '1',
                    marginTop:'0px',
                    fontFamily: "'rajdhani', sans-serif",
                    transform: 'scale(1)',
                  }}
                  onMouseEnter={(e) => {
                    const color = getRandomColor();
                    e.target.style.boxShadow = '0px 4px 4px 0px rgba(0, 0, 0, 0.25)';
                   
                  }}
                  onMouseLeave={(e) => {
                    
                    e.target.style.boxShadow = 'none';
                   
                  }}
                  className="hoverableButton"
                >
                  {classItem.className}
                </button>
              </div>
               );
              })
            }
</div>





<div style={{width: '1000px', marginRight: 'auto', marginLeft: 'auto', marginTop: '30px'}}>
        <Link to="/createclass" style={{
          marginRight: 'auto', 
           textDecoration: 'none',
            backgroundColor: '#AEF2A3' , 
            marginBottom: '100px',
           border: '5px solid #45B434',
            marginLeft: '32px',
            
            fontSize: '20px', 
            transition: '.3s', 
            color: '#45B434',
             borderRadius: '10px',
              padding: '10px 20px', 
             
               width: '145px', 
               textAlign: 'center', 
               fontWeight: 'bold' }}
          onMouseEnter={(e) => {
            e.target.style.opacity = '90%';
            e.target.style.boxShadow = ' 0px 4px 4px 0px rgba(0, 0, 0, 0.25)';
        }}
        onMouseLeave={(e) => {
            e.target.style.opacity = '100%';
            e.target.style.boxShadow = ' none ';
        }}>Create Class +</Link>
        
        </div>
       







        





      </main>

      <FooterAuth style={{marginTop: '100px'}}/>
      
    </div>
    
  );
  
};

export default TeacherHome;
