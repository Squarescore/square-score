import React, { useState, useEffect } from 'react';

import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useNavigate } from 'react-router-dom';
import { getAuth, setPersistence, signInWithEmailAndPassword } from 'firebase/auth';
import { browserLocalPersistence } from 'firebase/auth';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [navbarBg, setNavbarBg] = useState('rgba(255,255,255,0.7)');
 
  useEffect(() => {
    const handleScroll = () => {
        if (window.scrollY > 0) {
            setNavbarBg('rgba(250, 250, 250, 0.7)');
        } else {
            setNavbarBg('rgba(255, 255, 255, 0.7)');
        }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
        window.removeEventListener('scroll', handleScroll);
    };
}, []);


  const handleForgotPassword = async () => {
    const auth = getAuth();
    try {
      await sendPasswordResetEmail(auth, email);
      alert('Password reset email sent. Please check your email.');
    } catch (err) {
      setError(err.message);
    }
  };
  const handleLogin = async (e) => {
    e.preventDefault();

    const auth = getAuth();
    try {
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userUID = userCredential.user.uid;

      let userDocRef = doc(db, 'students', userUID);
      let userProfile = await getDoc(userDocRef);

      if (!userProfile.exists()) {
        userDocRef = doc(db, 'teachers', userUID);
        userProfile = await getDoc(userDocRef);
      }
      // Redirect based on the user's role
      if (userDocRef.path.startsWith('students')) {
        navigate('/studenthome'); // Redirect to student home
      } else if (userDocRef.path.startsWith('teachers')) {
        navigate('/teacherhome'); // Redirect to teacher home
      }
    } catch (err) {
      setError(err.message);
    }
  };
  const handleBack = () => {
    navigate(-1);
  };
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'white',}}>
          <div style={{ 
      position: 'fixed', top: 0, width: '100%', display: 'flex',
      padding: '0px 0', alignItems: 'center', height: '70px', color: 'grey', zIndex: '1000',
      backgroundColor: navbarBg,
      transition: 'background-color 0.3s ease',
      backdropFilter: 'blur(7px)',  }}>

<img style={{width: '320px',  marginLeft: 'auto', marginRight: 'auto'}} src="/SquareScore.png" alt="logo" />
<button 
onClick={handleBack} 
style={{ position: 'fixed',fontFamily: "'Radio Canada', sans-serif",left: '20px', top: '20px', textDecoration: 'none',  color: 'black', backgroundColor: 'white', border: 'none', cursor: 'pointer',  }}>
<img src="https://static.thenounproject.com/png/1875804-200.png" style={{width: '30px', opacity: '50%'}}/>
</button>
</div>



 
     
      <div style={{ width: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: 'auto', marginRight: 'auto', marginTop: '6%'}}>
       
        <form onSubmit={handleLogin} style={{ width: '100%' }}>
        <h1 style={{ 
    color: 'black', fontSize: '80px',   fontFamily: "'Radio Canada', sans-serif",  textAlign: 'center', fontWeight: 'bold'}}>Login</h1>


        <div style={{ width: '100%', marginBottom: '20px' }}>
  <input 
    type="email" 
    placeholder="Email" 
    onChange={e => {
      setEmail(e.target.value);

      // Check if the value is not empty
      if (e.target.value.trim() !== '') {
        e.target.style.borderColor= 'lightgreen';
      } else {
        e.target.style.borderColor= 'lightgrey'; // Reset to the default color
      }
    }}
    style={{
      width: '100%',
      fontFamily: "'Radio Canada', sans-serif",
      padding: '30px',
      fontSize: '30px',
      border: '3px solid lightgrey',
      borderRadius: '10px',
      fontWeight: 'bold',
      outline: 'none',
      backgroundColor: 'white',
      
    }}
  />
</div>
<div style={{ width: '100%', marginBottom: '40px' }}>
  <input 
    type="password" 
    placeholder="Password"
    onChange={e => {
      setPassword(e.target.value);

      // Check if the value is not empty
      if (e.target.value.trim() !== '') {
        e.target.style.borderColor= 'lightgreen';
      } else {
        e.target.style.borderColor= 'lightgrey'; // Reset to the default color
      }
    }}
    style={{
      width: '100%',
      fontFamily: "'Radio Canada', sans-serif",
      padding: '30px',
      fontSize: '30px',
      fontWeight: 'bold',
      border: '3px solid lightgrey',
      borderRadius: '10px',
      outline: 'none',
      backgroundColor: 'white',
      
    }}
  />
</div>
<div style={{display: 'flex'}}>
<button 
  type="submit" 
  style={{ 
            
width: '240px',
   marginLeft: '-10px',
    backgroundColor: 'transparent', 
    border: 'none', 
    borderRadius: '50px', 
    cursor: 'pointer',
    fontFamily: "'Radio Canada', sans-serif",
    transition: '.2s'
  }}
 
>
  <img style={{width: '240px', height: '100%', borderRadius: '15px',    transition: '.2s'}} 
  
  onMouseEnter={(e) => {
    e.target.style.opacity = '85%';
    
    e.target.style.boxShadow = '0px 4px 4px 0px rgba(0, 0, 0, 0.25)';
    e.target.style.transform = 'scale(1.02)';
  }}
  onMouseLeave={(e) => {
    e.target.style.opacity = '99.5%';
    e.target.style.boxShadow = 'none';
    e.target.style.transform = 'scale(1)';
  }}
  src='/Login.png' alt="Login"/>
</button>
<p style={{ fontFamily: "'Radio Canada', sans-serif", color: 'black', marginLeft: '30px', fontSize: '20px', width: '300px'}}>
                By logging in you agree to our <a href="/TermsofService" style={{ color: 'blue' }}>terms of service</a>
              </p>
              </div>
        </form>
      
        <button 
          onClick={handleForgotPassword}
          style={{
            marginRight: 'auto',
            marginTop: '30px',
            backgroundColor: 'transparent',
            border: 'none',
            textDecoration: 'underline',
            color: 'blue',
            borderRadius: '10px',
            padding: '10px 20px',
            cursor: 'pointer',
            fontFamily: "'Radio Canada', sans-serif",
          }}
        >
          Forgot Password?
        </button>
        {error && <p style={{ color: 'red', marginTop: '20px' }}>{error}</p>}
      </div>
    </div>
  );
};

export default Login;
