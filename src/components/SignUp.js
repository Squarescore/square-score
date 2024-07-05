import React, { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; 
import { db, auth } from "./firebase"; // Adjust the path to your firebase configuration
import { useNavigate } from 'react-router-dom'; // Import the navigate hook

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('student'); // Default role
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Initialize the navigate function
  const [showPopup, setShowPopup] = useState(false); // New state variable
  
  const handleSignUp = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
  
      const userProfile = {
        email,
        firstName,
        lastName,
      };
  
      if (role === 'student') {
        userProfile.testsTaken = [];
        userProfile.classesIn = [];
        userProfile.grades = [];
        userProfile.questionsCompleted = 0;
        userProfile.reviewedTests = false;
        await setDoc(doc(db, 'students', uid), userProfile);
        navigate('/studenthome');  // Navigate to student home
      } else if (role === 'teacher') {
        userProfile.classesOwned = [];
        userProfile.draftAssignments = [];
        userProfile.testsAssigned = [];
        await setDoc(doc(db, 'teachers', uid), userProfile);
        navigate('/teacherhome');  // Navigate to teacher home
      }
  
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBack = () => {
    navigate('/'); // Navigate back to the main authentication page (or any other path you want)
  };

  const toggleRole = (newRole) => {
    setRole(newRole);
  };

  const handlePopupClose = () => {
    setShowPopup(false); // Close the popup
    navigate('/login'); // Navigate to login page
  };

  const isFormComplete = () => {
    return email && password && confirmPassword && firstName && lastName && (password === confirmPassword);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'white'}}>
      <div></div>
      <div style={{ 
      position: 'fixed', top: 0, width: '100%', display: 'flex',
      padding: '0px 0', alignItems: 'center', height: '70px', color: 'grey', zIndex: '1000',
      backgroundColor: 'white',
      transition: 'background-color 0.3s ease',
      backdropFilter: 'blur(7px)',  }}>

        <img style={{width: '320px',  marginLeft: 'auto', marginRight: 'auto'}} src="/SquareScore.png" alt="logo" />
        <button 
          onClick={handleBack} 
          style={{ position: 'fixed',fontFamily: "'Radio Canada', sans-serif",left: '20px', top: '20px', textDecoration: 'none',  color: 'black', backgroundColor: 'white', border: 'none', cursor: 'pointer',  }}>
          <img src="https://static.thenounproject.com/png/1875804-200.png" style={{width: '30px', opacity: '50%'}}/>
        </button>
      </div>

      <div style={{width: '1000px', marginLeft: 'auto', border: '10px solid lightgrey',marginTop: '200px', marginRight: 'auto',  backgroundColor: 'white', padding: '40px', borderRadius: '30px'}}>
        <h1 style={{ fontWeight: 'Bold', color: 'black', fontSize: '95px', fontFamily: "'Radio Canada', sans-serif",  padding: '40px', backgroundColor: 'white', marginTop: '-150px', marginLeft: '20px',width: '370px'
         
        }}>Sign Up</h1>
        <form onSubmit={handleSignUp}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '50%',marginLeft: 'auto',marginBottom: '40px' , marginTop: '-130px'}}>
            <button 
              onClick={() => toggleRole('student')}
              style={{ 
                flex: 1, 
                marginLeft: '-2px',
                marginRight: '40px',
                backgroundColor: 'white',
                borderColor: role === 'student' ? '#020CFF' : 'transparent',
                color: 'black',
                padding: '20px',
                fontSize: '20px', 
               fontWeight: 'bold',
                border: '5px solid white',
                cursor: 'pointer',
                fontFamily: "'Radio Canada', sans-serif",
                borderRadius: '10px',
                transition: '.2s',
              }}
            >
              Student
            </button>
            <button 
              onClick={() => toggleRole('teacher')}
              style={{ 
                flex: 1, 
                marginLeft: '-2px',
                marginRight: '40px',
                backgroundColor: 'white',
                borderColor: role === 'teacher' ? '#020CFF' : 'transparent',
                color: 'black',
                padding: '20px',
                fontSize: '20px', 
               fontWeight: 'bold',
                border: '5px solid white',
                cursor: 'pointer',
                fontFamily: "'Radio Canada', sans-serif",
                borderRadius: '10px',
                transition: '.2s',
              }}
            >
              Teacher
            </button>
          </div>
          <div style={{ width: '90%', marginLeft: 'auto', marginRight: 'auto',}}>
           
           <div style={{display: 'flex'}}>
            
           <input 
              type="text" 
              placeholder="First Name" 
              onChange={e => {
                setFirstName(e.target.value);
                e.target.style.borderColor= e.target.value.trim() !== '' ? 'lightgreen' : 'lightgrey';
              }}
              style={{ 
                width: '410px', 
                padding: '20px', 
                border: '3px solid lightgrey', 
                color: 'black',
                fontWeight: 'bold',
                borderRadius: '10px', 
                outline: 'none', 
               fontSize: '20px',
                marginBottom: '20px',
                backgroundColor: 'white', 
                fontFamily: "'Radio Canada', sans-serif",
              }}
            />
            <input 
              type="text" 
              placeholder="Last Name" 
              onChange={e => {
                setLastName(e.target.value);
                e.target.style.borderColor= e.target.value.trim() !== '' ? 'lightgreen' : 'lightgrey';
              }}
              style={{ 
                width: '410px', 
                padding: '20px', 
                marginLeft: '20px',
                border: '3px solid lightgrey', 
                color: 'black',
                fontWeight: 'bold',
                borderRadius: '10px', 
                outline: 'none', 
               fontSize: '20px',
                marginBottom: '20px',
                backgroundColor: 'white', 
                fontFamily: "'Radio Canada', sans-serif",
              }}
            />
             </div> 
            <input 
              type="email" 
              placeholder="Email" 
              onChange={e => {
                setEmail(e.target.value);
                e.target.style.borderColor= e.target.value.trim() !== '' ? 'lightgreen' : 'lightgrey';
              }}
              style={{ 
                width: '855px', 
                padding: '20px', 
                border: '3px solid lightgrey', 
                color: 'black',
                fontWeight: 'bold',
                borderRadius: '10px', 
                outline: 'none', 
               fontSize: '20px',
                marginBottom: '20px',
                backgroundColor: 'white', 
                fontFamily: "'Radio Canada', sans-serif",
              }}
            />


<div style={{display: 'flex'}}>
            
            <input 
              type="password" 
              placeholder="Password" 
              onChange={e => {
                setPassword(e.target.value);
                e.target.style.borderColor= e.target.value.trim() !== '' ? 'lightgreen' : 'lightgrey';
              }}
              style={{ 
                width: '410px',  
                padding: '20px', 
                border: '3px solid lightgrey', 
                color: 'black',
                fontWeight: 'bold',
                borderRadius: '10px', 
                outline: 'none', 
               fontSize: '20px',
                marginBottom: '20px',
                backgroundColor: 'white', 
                fontFamily: "'Radio Canada', sans-serif",
              }}
            />
            <input 
              type="password" 
              placeholder="Confirm Password" 
              onChange={e => {
                setConfirmPassword(e.target.value);
                e.target.style.borderColor= e.target.value.trim() !== '' ? 'lightgreen' : 'lightgrey';
              }}
              style={{ 
                width: '410px', 
                padding: '20px', 
                marginLeft: '20px',
                border: '3px solid lightgrey', 
                color: 'black',
                fontWeight: 'bold',
                borderRadius: '10px', 
                outline: 'none', 
               fontSize: '20px',
                marginBottom: '20px',
                backgroundColor: 'white', 
                fontFamily: "'Radio Canada', sans-serif",
              }}
            />
            </div>
            {isFormComplete() && (
             <div style={{display: 'flex', marginTop: '20px'}}>
            
               <button onClick={handleSignUp}
               type="submit"
               style={{ 
                width: '250px',
                background: 'transparent',
                borderColor: 'transparent',
              
                 transition: '.3s'
               }}
              
             >
               <img src='/SignUp.png' style={{width: '250px', borderRadius: '15px' , transition: '.3s', cursor: 'pointer'
               }}
               onMouseEnter={(e) => {
                 if (isFormComplete()) {
                   e.target.style.opacity = '85%';
                   
                  e.target.style.boxShadow= '0px 4px 4px 0px rgba(0, 0, 0, 0.25)'
              
          
                 }
               }}
               onMouseLeave={(e) => {
                 if (isFormComplete()) {
                  e.target.style.opacity = '100%';
                  e.target.style.boxShadow= 'none'
             
                 }
               }}/>
             </button>
             <p style={{ fontFamily: "'Radio Canada', sans-serif", color: 'black', marginLeft: '40px', fontSize: '20px', width: '300px'}}>
                By Signing up you agree to our <a href="/TermsofService" style={{ color: 'blue' }}>terms of service</a>
              </p>
             </div>
            )}
           
          </div>
        </form>
        {error && <p style={{ color: 'red', marginTop: '20px' }}>{error}</p>}
      </div>
      {showPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '10px'
          }}>
            <h2 style={{ fontFamily: "'Radio Canada', sans-serif", }}>Sign Up Completed Successfully</h2>
            <button onClick={handlePopupClose}>
              Go to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignUp;
