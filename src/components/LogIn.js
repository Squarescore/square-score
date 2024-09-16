import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useNavigate } from 'react-router-dom';
import { getAuth, setPersistence, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { browserLocalPersistence } from 'firebase/auth';
import { Link } from 'react-router-dom';

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
    <div style={{ position: 'relative', overflow: 'hidden', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'rgb(255,255,255,.2)', backdropFilter: 'blur(7px)' }}>
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

      <div style={{
        position: 'fixed', top: 0, width: '100%', display: 'flex',
        padding: '0px 0', alignItems: 'center', height: '70px', color: 'grey', zIndex: '1000',
        backgroundColor: navbarBg,
        transition: 'background-color 0.3s ease',
        backdropFilter: 'blur(7px)',
      }}>
        <img style={{ width: '320px', marginLeft: 'auto', marginRight: 'auto' }} src="/SquareScore.png" alt="logo" />
        <button
          onClick={handleBack}
          style={{ position: 'fixed', fontFamily: "'Radio Canada', sans-serif", left: '20px', top: '20px', textDecoration: 'none', color: 'black', backgroundColor: 'white', border: 'none', cursor: 'pointer' }}>
          <img src="https://static.thenounproject.com/png/1875804-200.png" style={{ width: '30px', opacity: '50%' }} />
        </button>
      </div>

      <div className="white-background" style={{
        width: '60%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: 'auto', marginRight: 'auto', marginTop: '6%', backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(7px)', padding: '40px', borderRadius: '30px'
      }}>
        <form onSubmit={handleLogin} style={{ width: '100%' }}>
          <h1 style={{
            color: 'black', fontSize: '80px', fontFamily: "'Rajdhani', sans-serif", textAlign: 'center', fontWeight: 'bold'
          }}>Login</h1>
          








<div style={{marginLeft: 'auto', marginRight: 'auto', width: '600px'}}>
          <div style={{  marginBottom: '20px', position: 'relative' }}>
            
            <input
              type="email"
              placeholder="Email"
              value={email}
              onFocus={() => handleInputFocus('email')}
              onBlur={(e) => handleInputBlur('email', e.target.value)}
              onChange={e => {
                setEmail(e.target.value);
                e.target.style.borderColor = e.target.value.trim() !== '' ? 'lightgreen' : 'lightgrey';
              }}
              style={{
                width: '92%', 
                padding: '20px', 
                fontWeight: 'bold',
                border: '3px solid lightgrey', 
                color: 'black',
                borderRadius: '10px', 
                outline: 'none', 
                backdropFilter: 'blur(7px)',
                fontSize: '30px',
                backgroundColor: 'rgb(250,250,250,.5)', 
                fontFamily: "'Radio Canada', sans-serif"
              }}
            />
            {inputStyles.email && <label style={{ position: 'absolute', top: '-10px', left: '15px', backgroundColor: 'white', padding: '0 10px', borderTopRightRadius: '3px', borderTopLeftRadius: '3px', fontFamily: "'Radio Canada', sans-serif", fontWeight: 'bold', height: '13px', fontSize: '20px' }}>Email</label>}
          </div>

          <div style={{  marginBottom: '40px', position: 'relative' }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onFocus={() => handleInputFocus('password')}
              onBlur={(e) => handleInputBlur('password', e.target.value)}
              onChange={e => {
                setPassword(e.target.value);
                e.target.style.borderColor = e.target.value.trim() !== '' ? 'lightgreen' : 'lightgrey';
              }}
              style={{
                width: '92%', 
                padding: '20px', 
                marginTop: '30px',
                fontWeight: 'bold',
                border: '3px solid lightgrey', 
                color: 'black',
                borderRadius: '10px', 
                outline: 'none', 
                backdropFilter: 'blur(7px)',
                fontSize: '30px',
                backgroundColor: 'rgb(250,250,250,.5)', 
                fontFamily: "'Radio Canada', sans-serif",
              }}
            />
            {inputStyles.password && <label style={{ position: 'absolute', top: '20px', left: '15px', backgroundColor: 'white', padding: '0 10px', borderTopRightRadius: '3px', borderTopLeftRadius: '3px', fontFamily: "'Radio Canada', sans-serif", fontWeight: 'bold', height: '13px', fontSize: '20px' }}>Password</label>}
          </div>

          <div style={{ display: 'flex' }}>
            <button
              type="submit"
              style={{
                width: '240px',
                marginLeft: '0px',
                background: '#99B6FF', border: '6px solid #020CFF', 
               
                height: '50px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontFamily: "'Radio Canada', sans-serif",
                transition: '.2s'
              }}
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
            >
              <h1 style={{ marginTop: '0px',  pointerEvents: 'none',color: '#020CFF', }}>Login</h1>
            </button>
            <button
          onClick={handleForgotPassword}
          style={{
            marginLeft: 'auto', 
            marginTop: '0px',
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
          </div>
          </div>
        </form>

      
        <p style={{ fontFamily: "'Radio Canada', sans-serif", color: 'black', marginLeft: '0px', fontSize: '16px', width: '600px', marginTop: '20px'}}>
                  By Logging in you agree to SquareScore's <a href="/TermsofService" style={{ color: 'blue' }}>Terms of Service</a>  and <a href="/PrivacyPolicy" style={{ color: 'blue' }}>Privacy Policy</a>
                </p>
        {error && <p style={{ color: 'red', marginTop: '20px' }}>{error}</p>}
      </div>
      
    </div>
  );
};

export default Login;
