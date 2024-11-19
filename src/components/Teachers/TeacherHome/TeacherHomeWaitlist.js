import React from 'react';
import { Link } from 'react-router-dom';
import { db, auth } from '../../Universal/firebase';
import { collection, query, where, doc, getDoc, getDocs, updateDoc, arrayUnion } from "firebase/firestore";

import { useState, useEffect } from 'react';
import {  useNavigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import HomeNavbar from '../../Universal/HomeNavbar';
import Footer from '../../Universal/Footer'; // Make sure this file exists in the same directory
const TeacherHomeWaitlist = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useAuthState(auth);
  const [teacherData, setTeacherData] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [schoolCode, setSchoolCode] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [hasAccess, setHasAccess] = useState(null);
  const [accessKey, setAccessKey] = useState('');
  const [accessError, setAccessError] = useState('');
  const [validationSuccess, setValidationSuccess] = useState(false);

  const [successMessage, setSuccessMessage] = useState('');
  const [newClassId, setNewClassId] = useState('');
  useEffect(() => {
    const fetchTeacherData = async () => {
      if (user) {
        const teacherRef = doc(db, 'teachers', user.uid);
        const teacherSnap = await getDoc(teacherRef);
        if (teacherSnap.exists()) {
          setTeacherData(teacherSnap.data());
        }
      }
    };
    fetchTeacherData();
  }, [user]);
  const handleAccessKeySubmit = async () => {
    setAccessError('');
    setValidationSuccess(false);
    try {
      // Query for the access key
      const keysQuery = query(collection(db, 'ACCESS KEYS'), where('ACCESS KEY', '==', accessKey));
      const keySnapshot = await getDocs(keysQuery);

      if (keySnapshot.empty) {
        setAccessError('Invalid access key.');
        return;
      }

      const keyDoc = keySnapshot.docs[0];
      const keyData = keyDoc.data();

      // Check if the key has already been used
      if (keyData.teacher) {
        setAccessError('This access key has already been used.');
        return;
      }

      // Update the access key document with the teacher's ID
      await updateDoc(doc(db, 'ACCESS KEYS', keyDoc.id), {
        teacher: user.uid
      });

      // Update the teacher's document to grant access
      await updateDoc(doc(db, 'teachers', user.uid), {
        hasAccess: true
      });

      // Set success state and message
      setValidationSuccess(true);
      setSuccessMessage('Your key has been validated. Refresh the page to start your SquareScore journey!');
      
      // Close the modal after a short delay
      setTimeout(() => {
        setAccessModalOpen(false);
      }, 3000);
    } catch (error) {
      console.error('Error validating access key:', error);
      setAccessError('An error occurred. Please try again.');
    }
  };
  const handleJoinOrganization = async () => {
    try {
      const schoolsQuery = query(collection(db, 'schools'), where('joinCode', '==', schoolCode));
      const schoolsSnap = await getDocs(schoolsQuery);

      if (!schoolsSnap.empty) {
        const schoolDoc = schoolsSnap.docs[0];
        const schoolData = schoolDoc.data();
        const schoolRef = doc(db, 'schools', schoolDoc.id);

        // Update teacher's document
        const teacherRef = doc(db, 'teachers', user.uid);
        await updateDoc(teacherRef, { 
          school: schoolData.schoolName, 
          schoolCode
        });

        // Add teacher UID to school's teachers array
        await updateDoc(schoolRef, { teachers: arrayUnion(user.uid) });

        // Update state
        setTeacherData(prevData => ({ 
          ...prevData, 
          school: schoolData.schoolName,
          schoolCode: schoolData.schoolCode
        }));
        setModalOpen(false);
        setSchoolCode('');
      } else {
        alert('Invalid school code.');
      }
    } catch (error) {
      console.error('Error joining organization:', error);
    }
  };
  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      setNewClassId(location.state.classId);
      // Clear the message from location state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);



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
      marginTop: '-6px',
      marginBottom: '20px',
      whiteSpace: 'nowrap'
    }}>
      <p style={{ color: '#45B434', fontWeight: 'bold', marginRight: '20px' }}>{successMessage}</p>
    
    </div>
  </div>
)}
      
      
      
      
      
      
      
      
      
        {loading && <p>Loading...</p>}
        {error && <p>Error: {error.message}</p>}

        <div style={{
          marginTop: '70px',
          display: 'flex',
         flexWrap:'wrap', 
         width: 'calc(100% -200px)',
         marginLeft: 'calc(200px + 4%)',
         fontFamily: "'montserrat', sans-serif",
          backgroundColor: 'white',
          
          marginRight: 'auto'
          }}>
           

<div style={{ fontFamily: "'montserrat', sans-serif", fontSize: '50px',  marginTop: '0px', height: '70px',
  marginBottom: '100px',
}}>
            <h4 style={{
             fontSize: '40px'
            }}>You have successfully joined our waitlist!</h4>
       
          <p style={{fontSize: '20px', fontFamily: '"montserrat", sans-serif', fontWeight: '600', width: '800px'}}>You will get an email from our team within 24 hours on whether or not you entered our early access program. </p>
        
          </div>  
       

            {modalOpen && (
          <div style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backdropFilter: 'blur(15px)',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
zIndex: '100'
          }}>
            <div style={{
              backgroundColor: 'transparent',
              padding: '20px',
              borderRadius: '10px',
              textAlign: 'center',
            }}>
              <h3
             
              style={{ fontSize: '80px', fontFamily: '"montserrat", sans-serif', marginTop:' -50px', marginBottom: '0px'}}
              >School Code</h3>
              <input
                type="text"
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value)}
              style={{  fontFamily: "'montserrat', sans-serif", fontSize: '100px',background: "white", borderRadius: '20px', border: '4px solid lightgrey',
                width: '440px',paddingLeft: '60px',paddingRight: '60px', paddingTop: '10px', paddingBottom: '10px', fontWeight: 'bold',
                 textAlign: 'Left', 
                  outline: 'none', }} />  
              <br />
              <button
                onClick={handleJoinOrganization}
                style={{ 
                  padding: '10px 20px', 
                  backgroundColor: '#AEF2A3',
              border: '5px solid #45B434',
              color: '#45B434',
                    borderRadius: '15px',
                     cursor: 'pointer', 
                    marginTop: '30px',
                     fontFamily: "'montserrat', sans-serif",
                     fontWeight: 'bold',
                     fontSize: '30px',
                     width: '45%',
                     marginRight: '10px' }}
              >
                Join
              </button>
              <button
                onClick={() => setModalOpen(false)}
                style={{ 

                  padding: '10px 20px', 
                  backgroundColor: '#f4f4f4',
              border: '5px solid lightgrey',
              color: 'grey',
                    borderRadius: '15px',
                     cursor: 'pointer', 
                    marginTop: '30px',
                     fontFamily: "'montserrat', sans-serif",
                     fontWeight: 'bold',
                     fontSize: '30px',
                     width: '45%',
                     marginRight: '10px'
                 }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}



{accessModalOpen && (
          <div style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backdropFilter: 'blur(15px)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
zIndex: '100'
          }}>
            <div style={{
              backgroundColor: 'white',
              border: '1px solid lightgrey',
              padding: '20px',
              borderRadius: '10px',
              textAlign: 'left',
            }}>
              <h3
             
              style={{ fontSize: '25px', fontFamily: '"montserrat", sans-serif', marginTop:' 0px', marginBottom: '10px'}}
              >Access Key</h3>
              <input
                type="text"
                placeholder='Paste key here'
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
              style={{  fontFamily: "'montserrat', sans-serif", fontSize: '14px',background: "white", borderRadius: '5px', border: '1px solid lightgrey',
                 width: '500px',paddingLeft: '20px',paddingRight: '20px', paddingTop: '10px', paddingBottom: '10px', fontWeight: '600',
                  textAlign: 'Left', 
                   outline: 'none', }} />  
              <br />
              <button
               onClick={handleAccessKeySubmit}
                style={{ 
                  padding: '10px 20px', 
                  background: '#FFEC87', color: '#FC8518',
                  border: '1px solid #FC8518',
                    borderRadius: '5px',
                     cursor: 'pointer', 
                    marginTop: '30px',
                     fontFamily: "'montserrat', sans-serif",
                     fontWeight: 'bold',
                     fontSize: '16px',
                     width: '45%',
                     marginRight: '10px' }}
              >
                Validate Key
              </button>
              <button
                onClick={() => setAccessModalOpen(false)}
                style={{ 

                  padding: '10px 20px', 
                  backgroundColor: '#f4f4f4',
              border: '1px solid lightgrey',
              color: 'grey',
                    borderRadius: '5px',
                     cursor: 'pointer', 
                    marginTop: '30px',
                     fontFamily: "'montserrat', sans-serif",
                     fontWeight: 'bold',
                     fontSize: '16px',
                     width: '45%',
                     marginRight: '10px'
                 }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

   
</div>




<div style={{
         width: 'calc(100% -200px)',marginLeft: 'calc(200px + 4%)', marginRight: 'auto',}}>
<div style={{width: '350px', marginRight: 'auto',  marginTop: '300px',  display: 'flex'}}>
<button
            onClick={() => setAccessModalOpen(true)}
            style={{
              marginRight: 'auto',
              background: 'white', color: '#FC8518',
              border: '1px solid lightgrey',
              borderRadius: '5px',
              padding: '20px 20px',
              height: '40px',
              fontWeight: '600',
              cursor: 'pointer',
             marginTop: '0px',
             lineHeight: '0px',
             fontFamily: "'montserrat', sans-serif",
           
              fontSize: '16px',
              transition: '.3s',
            }}
          
          >
            Enter Access Key
          </button>
          {teacherData && teacherData.school ? (
         <div
         style={{ 
            
          

          marginTop: '10px', marginLeft: 'auto',
          marginRight: 'auto',
           fontSize: '30px',  color: 'lightgrey' }}>
            
         <h4 style={{ 
          marginRight: 'auto', 
            marginLeft: 'auto',
            fontFamily: "'montserrat', sans-serif",
            marginTop: '0px', 
             fontSize: '30px',  color: 'lightgrey' }}> {teacherData.school}</h4>
             </div>
        ) : (
          <button
            onClick={() => setModalOpen(true)}
            style={{
              marginRight: 'auto',
              backgroundColor: 'white',
              border: '1px solid lightgrey',
              color: '#020CFF',
              borderRadius: '5px',
              padding: '20px 20px',
              height: '40px',
              fontWeight: '600',
              cursor: 'pointer',
             marginTop: '0px',
             fontFamily: "'montserrat', sans-serif",
             lineHeight: '0px',
             marginLeft: 'auto',
              fontSize: '16px',
              transition: '.3s',
            }}
          
          >
            Join School
          </button>
        )}


        </div>
       
        </div>






        





      </main>

      <Footer style={{marginTop: '100px'}}/>
      
    </div>
    
  );
  
};

export default TeacherHomeWaitlist;
