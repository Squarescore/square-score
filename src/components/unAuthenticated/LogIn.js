import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from "firebase/firestore";
import { db } from "../Universal/firebase";
import { useNavigate } from 'react-router-dom';
import { getAuth, setPersistence, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { browserLocalPersistence } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [navbarBg, setNavbarBg] = useState('rgba(255,255,255,0.7)');

  const handleScroll = () => {
    if (window.scrollY > 0) {
      setNavbarBg('rgba(250, 250, 250, 0.7)');
    } else {
      setNavbarBg('rgba(255, 255, 255, 0.7)');
    }
  };

  useEffect(() => {
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

      // Check user type by searching in different collections
      let userDocRef = doc(db, 'students', userUID);
      let userProfile = await getDoc(userDocRef);

      if (!userProfile.exists()) {
        userDocRef = doc(db, 'teachers', userUID);
        userProfile = await getDoc(userDocRef);
      }

      if (!userProfile.exists()) {
        userDocRef = doc(db, 'admins', userUID);  // Check if user is an admin
        userProfile = await getDoc(userDocRef);
      }

      // Redirect based on user type
      if (userDocRef.path.startsWith('students')) {
        navigate('/studenthome');
      } else if (userDocRef.path.startsWith('teachers')) {
        navigate('/teacherhome');
      } else if (userDocRef.path.startsWith('admins')) {
        navigate('/adminhome');  // Redirect to admin home
      } else {
        setError("User type not recognized.");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBack = () => {
    navigate(-1);
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

  const getRandomColorClass = () => {
    const colors = ['color-1', 'color-2', 'color-3', 'color-4', 'color-5'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const positions = generateUniquePositions(20, 200, 100);

  const [inputStyles, setInputStyles] = useState({
    email: false,
    password: false,
  });

  const handleInputFocus = (inputName) => {
    setInputStyles(prevState => ({ ...prevState, [inputName]: true }));
  };

  const handleInputBlur = (inputName, value) => {
    setInputStyles(prevState => ({ ...prevState, [inputName]: value.trim() !== '' }));
  };

  return (
    <div style={{ position: 'relative',  height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fcfcfc',  }}>
   

      <div style={{
        position: 'fixed', top: 0, width: '100%', display: 'flex',
        padding: '0px 0', alignItems: 'center', height: '70px', color: 'grey', zIndex: '1000',
        backgroundColor: navbarBg,
        transition: 'background-color 0.3s ease',
        backdropFilter: 'blur(7px)',
      }}>
       <div style={{ marginLeft: 'auto', marginRight: 'auto', display: 'flex'}}>
           

           <h1 style={{color: 'black', fontWeight: "600"}}>SquareScore</h1>
           
   
         </div>
        
      </div>

      <div  style={{width: '450px', marginLeft: 'auto', height: '380px', marginTop: '190px', marginRight: 'auto',  backgroundColor: 'white',padding: '20px', boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)', borderRadius: '30px', }}>
        
       
        <form onSubmit={handleLogin} style={{ width: '450px' }}>
        <div style={{background: '#F4F4F4 ', border: '10px solid #C1C1C1', margin: '-20px -20px 10px -20px', height: '70px', borderRadius: '30px 30px 0px 0px', display: 'flex' }}>
        <h1 style={{ fontWeight: 'Bold',
           color: '#C1C1C1', fontSize: '40px', fontFamily: "'montserrat', sans-serif", 
            padding: '0px', backgroundColor: 'transparent', 
             marginLeft: '30px',width: '370px', marginTop: '10px'}}>Login</h1>
      
      </div>
          








<div style={{marginLeft :'15px', width: '400px', marginTop: '50px'}}>
          <div style={{  marginBottom: '20px', position: 'relative', }}>
            
            <input
              type="email"
              value={email}
              onFocus={() => handleInputFocus('email')}
              onBlur={(e) => handleInputBlur('email', e.target.value)}
              onChange={e => {
                setEmail(e.target.value);
                e.target.style.borderColor = e.target.value.trim() !== '' ? 'lightgreen' : 'lightgrey';
              }}
              style={{
                width: '97%', 
                padding: '15px', 
                fontWeight: 'bold',
                border: '2px solid lightgrey', 
                color: 'black',
                borderRadius: '10px', 
                outline: 'none', 
                backdropFilter: 'blur(7px)',
                fontSize: '20px',
                backgroundColor: 'rgb(250,250,250,.5)', 
                fontFamily: "'montserrat', sans-serif"
              }}
            />
             <div style={{ position: 'absolute', top: '-30px', left: '-10px', backgroundColor: 'white', padding: '0 10px', borderTopRightRadius: '3px', borderTopLeftRadius: '3px', zIndex: '20', fontFamily: "'montserrat', sans-serif", fontWeight: '600', height: '13px', fontSize: '20px', display: 'flex' }}>
            
          <h1 style={{fontFamily: "'montserrat', sans-serif", fontWeight: '600', fontSize: '20px', marginTop: '0px'}}>Email</h1>
          
          </div></div>

          <div style={{  marginBottom: '40px', position: 'relative' }}>
            <input
              type="password"
              value={password}
              onFocus={() => handleInputFocus('password')}
              onBlur={(e) => handleInputBlur('password', e.target.value)}
              onChange={e => {
                setPassword(e.target.value);
                e.target.style.borderColor = e.target.value.trim() !== '' ? 'lightgreen' : 'lightgrey';
              }}
              style={{
                width: '97%', 
                padding: '15px', 
                marginTop: '30px',
                fontWeight: 'bold',
                border: '2px solid lightgrey', 
                color: 'black',
                borderRadius: '10px', 
                outline: 'none', 
                backdropFilter: 'blur(7px)',
                fontSize: '20px',
                backgroundColor: 'rgb(250,250,250,.5)', 
                fontFamily: "'montserrat', sans-serif",
              }}
            />
     
     <div style={{ position: 'absolute', top: '0px', left: '-10px', backgroundColor: 'white', padding: '0 10px', borderTopRightRadius: '3px', borderTopLeftRadius: '3px', zIndex: '20', fontFamily: "'montserrat', sans-serif", fontWeight: '600', height: '13px', fontSize: '20px', display: 'flex' }}>
            
            <h1 style={{fontFamily: "'montserrat', sans-serif", fontWeight: '600', fontSize: '20px', marginTop: '0px'}}>Password</h1>
            <button
          onClick={handleForgotPassword}
          style={{
            marginLeft: '-10px', 
            marginTop: '-5px',
            zIndex: '1000',
            backgroundColor: 'transparent',
            border: 'none',
            textDecoration: 'none',
            color: 'blue',
            borderRadius: '10px',
            padding: '10px 20px',
            cursor: 'pointer',
            fontFamily: "'montserrat', sans-serif",
          }}
        >
         - Forgot Password?
        </button>
            </div>
                </div>

          <div style={{ display: 'flex', width: '430px' }}>
            <button
              type="submit"
              style={{
                width: '120px',
                marginLeft: '0px',
                background: '#C7FFBE', border: '4px solid #2BB514', 
            zIndex: '1000',
               
                height: '40px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: "'montserrat', sans-serif",
                transition: '.2s'
              }}
              onMouseEnter={(e) => {     e.target.style.borderColor = '#009006';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = '#2BB514';
          
              }}
            >
              <h1 style={{ marginTop: '2px', fontSize: '20px', pointerEvents: 'none',color: '#2BB514', }}>Login</h1>
            </button>
            <p style={{ fontFamily: "'montserrat', sans-serif", color: 'black', marginLeft: '20px', fontSize: '14px', width: '340px',  marginTop: '5px'}}>
                  By Logging in you agree to SquareScore's <a href="/TermsofService" style={{ color: 'blue' }}>Terms of Service</a>  and <a href="/PrivacyPolicy" style={{ color: 'blue' }}>Privacy Policy</a>
                </p>
          </div>
          </div>
        </form>

      
     
        {error && <p style={{ color: 'red', marginTop: '40px' }}>{error}</p>}
      </div>
      
    </div>
  );
};

export default Login;
