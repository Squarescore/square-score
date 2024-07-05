import React, { useState } from 'react';
import { auth, db } from './firebase';
import { doc, getDocs, query, where, updateDoc, collection } from "firebase/firestore";
import { Link } from 'react-router-dom';
import CNavbar from './CJNavbar';
import { useNavigate } from 'react-router-dom';
import JNavbar from './JNavbar';
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

      setSuccessMessage('Request to join class sent successfully. You can return home and once the teacher admits you, the class will appear on your home screen.');
      setShowModal(true); // Show modal on success
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
  return (
    <div style={{ 
      
      
      height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'white'
      }}>
     <JNavbar userType="student" />
    <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '200px' }}>
   
    <button 
      onClick={handleBack} 
      style={{ position: 'absolute',fontFamily: "'Radio Canada', sans-serif",left: '40px', top :'120px', textDecoration: 'none',  color: 'black', backgroundColor: 'white', border: 'none', cursor: 'pointer',  }}>
    <img src="https://static.thenounproject.com/png/1875804-200.png" style={{width: '30px', opacity: '50%'}}/>
    </button>

    <form onSubmit={handleJoinClass} style={{ width: '30%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <input type="text" placeholder="Class Code" onChange={e => setClassCode(e.target.value)} required 
      style={{  boxShadow: '1px 2px 5px 1px lightgrey', fontFamily: "'Radio Canada', sans-serif",
       width: '100%', fontSize: '190%', paddingTop: '10px', paddingBottom: '10px',
        textAlign: 'center', border: '4px solid white', borderRadius: '10px',
         outline: 'none', backgroundColor: 'white' }} />
      <button 
            type="submit" 
            disabled={!classCode}
            style={{ 
              boxShadow: '10px 5px 20px 2px lightgrey',
           fontFamily: "'Radio Canada', sans-serif",
              fontSize: '20px',
             marginTop: '10%',
              width: '70%', 
              padding: '15px 0',
              transform: 'scale(1)',
              backgroundColor: (!classCode) ? 'grey' : 'black',
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
