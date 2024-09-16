import React, { useState, useCallback, useEffect } from 'react';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; 
import { db, auth } from "./firebase"; // Adjust the path to your firebase configuration
import { useNavigate } from 'react-router-dom'; // Import the navigate hook
import './BackgroundDivs.css'; // Import the CSS file

const SignUpAdmin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('admin'); // Default role
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Initialize the navigate function
  const [showPopup, setShowPopup] = useState(false); // New state variable
  const [navbarBg, setNavbarBg] = useState('rgba(255,255,255,0.7)');
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [allCriteriaMet, setAllCriteriaMet] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false
  });
  const validateEmail = (email) => {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const formatName = (name) => {
    // Remove spaces, capitalize first letter, lowercase the rest
    return name.replace(/[^a-zA-Z]/g, '').charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };
  const handleSignUp = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setPasswordsMatch(false);
      setError("Passwords do not match");
      return;
    }

    setPasswordsMatch(true);
    setError(null);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      const userProfile = {
        email,
        firstName: formatName(firstName),
        lastName: formatName(lastName),
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
      else if (role === 'admin') {
        userProfile.school = [];
        userProfile.usage = [];
        userProfile.teachers = [];
        await setDoc(doc(db, 'admin', uid), userProfile);
        navigate('/adminhome');  // Navigate to teacher home
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
    return email && password && role && confirmPassword && firstName && lastName && 
           (password === confirmPassword) && allCriteriaMet;
  };
  
 
  const checkPasswordCriteria = (password) => {
    const newCriteria = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password)
    };
    setPasswordCriteria(newCriteria);
    setAllCriteriaMet(Object.values(newCriteria).every(Boolean));
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
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const handleInputFocus = (inputName) => {
    setInputStyles(prevState => ({ ...prevState, [inputName]: true }));
  };

  const handleInputBlur = (inputName, value) => {
    setInputStyles(prevState => ({ ...prevState, [inputName]: value.trim() !== '' }));
  };

  return (
    <div style={{ position: 'relative', overflow: 'hidden', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'rgb(255,255,255,.2)',backdropFilter: 'blur(7px)'}}>
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
          padding: '0px 0', alignItems: 'center', height: '70px', color: 'grey', zIndex: 1000,
          backgroundColor: navbarBg, transition: 'background-color 0.3s ease',
          backdropFilter: 'blur(7px)',
        }}>
          <div style={{ marginLeft: 'auto', marginRight: 'auto', display: 'flex'}}>
           

        <img style={{width: '320px',  marginLeft: 'auto', marginRight: 'auto'}} src="/SquareScore.png" alt="logo" />
        <button 
          onClick={handleBack} 
          style={{ position: 'fixed',fontFamily: "'Radio Canada', sans-serif",left: '20px', top: '20px', textDecoration: 'none',  color: 'black', backgroundColor: 'white', border: 'none', cursor: 'pointer',  }}>
          <img src="https://static.thenounproject.com/png/1875804-200.png" style={{width: '30px', opacity: '50%'}}/>
        </button>
      </div>
      </div>

      <div 
className="white-background" style={{width: '1000px', marginLeft: 'auto', border: '0px solid lightgrey',marginTop: '150px', marginRight: 'auto',  backgroundColor: 'rgb(255,255,255,.8)',backdropFilter: 'blur(7px)', padding: '40px', borderRadius: '30px'}}>
        <h1 style={{ fontWeight: 'Bold',
           color: 'black', fontSize: '50px', fontFamily: "'Rajdhani', sans-serif", 
            padding: '0px', backgroundColor: 'transparent', marginTop: '-10px',
             marginLeft: '50px',width: '870px', marginBottom: '170px'}}>Create Admin Account</h1>
        <form onSubmit={handleSignUp}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '60%',marginLeft: '37%',marginBottom: '40px' , marginTop: '-180px'}}>
           
         
            </div>
            <div style={{ width: '90%', marginLeft: 'auto', marginRight: 'auto',}}>
            <div style={{display: 'flex'}}>
              <div style={{ position: 'relative', width: '410px', marginBottom: '20px' }}>
                <input 
                  type="text" 
                  placeholder="First Name" 
                  
                  value={firstName}
                  onFocus={() => handleInputFocus('firstName')}
                  onBlur={(e) => handleInputBlur('firstName', e.target.value)}
                  onChange={e => {
                    const formattedName = formatName(e.target.value);
                    setFirstName(formattedName);
                    e.target.value = formattedName;
                    e.target.style.borderColor = formattedName.trim() !== '' ? 'lightgreen' : 'lightgrey';
                  }}
                  style={{ 
                    width: '90%', 
                    padding: '20px', 
                    border: '3px solid lightgrey', 
                    color: 'black',
                    fontWeight: 'bold',
                    borderRadius: '10px', 
                    outline: 'none', 
                    backdropFilter: 'blur(7px)',
                    fontSize: '20px',
                    backgroundColor: 'rgb(250,250,250,.5)', 
                    fontFamily: "'Radio Canada', sans-serif",
                  }}
                />
                {inputStyles.firstName && <label style={{ position: 'absolute', top: '-10px', left: '15px', backgroundColor: 'white', padding: '0 10px',  borderTopRightRadius: '3px', borderTopLeftRadius: '3px', zIndex: '20',
                    fontFamily: "'Radio Canada', sans-serif", fontWeight: 'bold', height: '13px'  }}>First Name</label>}
              </div>
              <div style={{ position: 'relative', width: '410px', marginBottom: '20px', marginLeft: '20px' }}>
                <input 
                  type="text" 
                  placeholder="Last Name" 
                  value={lastName}
                  onFocus={() => handleInputFocus('lastName')}
                  onBlur={(e) => handleInputBlur('lastName', e.target.value)}
                  onChange={e => {
                    const formattedName = formatName(e.target.value);
                    setLastName(formattedName);
                    e.target.value = formattedName;
                    e.target.style.borderColor = formattedName.trim() !== '' ? 'lightgreen' : 'lightgrey';
                  }}
                  style={{ 
                    width: '100%', 
                    padding: '20px', 
                  
                    fontWeight: 'bold',
                    border: '3px solid lightgrey', 
                    color: 'black',
                    borderRadius: '10px', 
                    outline: 'none', 
                    backdropFilter: 'blur(7px)',
                    fontSize: '20px',
                    backgroundColor: 'rgb(250,250,250,.5)', 
                    fontFamily: "'Radio Canada', sans-serif",
                  }}
                />
                {inputStyles.lastName && <label style={{ position: 'absolute', top: '-10px', left: '15px', backgroundColor: 'white', padding: '0 10px',  borderTopRightRadius: '3px', borderTopLeftRadius: '3px', 
                    fontFamily: "'Radio Canada', sans-serif", fontWeight: 'bold', height: '20px' }}>Last Name</label>}
              </div>
            </div> 
            <div style={{ position: 'relative', width: '855px', marginBottom: '13px' }}>
            <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onFocus={() => handleInputFocus('email')}
            onBlur={(e) => handleInputBlur('email', e.target.value)}
            onChange={e => {
              const newEmail = e.target.value.replace(/\s/g, '');
              setEmail(newEmail);
              const isValid = validateEmail(newEmail);
              setIsEmailValid(isValid);
              e.target.style.borderColor = newEmail.trim() !== '' 
                ? (isValid ? 'lightgreen' : 'red') 
                : 'lightgrey';
            }}
                style={{ 
                  width: '98%', 
                  padding: '20px', 
                  border: '3px solid lightgrey', 
                    color: 'black',
                    fontWeight: 'bold',
                    borderRadius: '10px', 
                    outline: 'none', 
                    backdropFilter: 'blur(10px)',
                    fontSize: '20px',
                    backgroundColor: 'rgb(250,250,250,.5)', 
                    fontFamily: "'Radio Canada', sans-serif",
                }}
              />
              {inputStyles.email && <label style={{ position: 'absolute', top: '-10px', left: '15px', backgroundColor: 'white', padding: '0 10px',  borderTopRightRadius: '3px', borderTopLeftRadius: '3px', 
                    fontFamily: "'Radio Canada', sans-serif", fontWeight: 'bold', height: '13px'  }}>Email</label>}
            </div>
            <div style={{ display: 'flex', 
            
              backgroundColor: 'transparent',
            borderRadius: '10px',
            backdropFilter: 'blur(5px)',
            paddingLeft: '20px',
            paddingRight: '50px',
            justifyContent: 'space-between', width: '90%', marginTop: '10px', marginBottom: '25px' }}>
          <h1 style={{fontFamily: "'Radio Canada', sans-serif", fontSize: '20px',
             color: allCriteriaMet ? '#91D487' : 'grey'
          }}>Password Criteria</h1>
            {Object.entries(passwordCriteria).map(([criterion, isMet]) => (
              <div key={criterion} style={{ display: 'flex', alignItems: 'center', fontFamily: "'Radio Canada', sans-serif" }}>
                
                <span style={{ color: isMet ? '#91D487' : 'grey', marginRight: '5px' }}>
                  {isMet ? '✓' : '•'}
                </span>
                <span style={{ color: isMet ? '#91D487' : 'grey' }}>
                  {criterion === 'length' ? 'At least 8 characters' : 
                   criterion === 'uppercase' ? 'Uppercase letter' :
                   criterion === 'lowercase' ? 'Lowercase letter' : 'Number'}
                </span>
              </div>
            ))}
          </div>
            <div style={{display: 'flex'}}>
              <div style={{ position: 'relative', width: '410px', marginBottom: '20px' }}>
                <input 
                      type="password" 
                      placeholder="Password" 
                      value={password}
                      onFocus={() => handleInputFocus('password')}
                      onBlur={(e) => handleInputBlur('password', e.target.value)}
                      onChange={e => {
                        const newPassword = e.target.value;
                        setPassword(newPassword);
                        setPasswordsMatch(newPassword === confirmPassword);
                        checkPasswordCriteria(newPassword);
                        e.target.style.borderColor = newPassword.trim() !== '' ? 'lightgreen' : 'lightgrey';
                      }}
                  style={{ 
                    width: '90%',  
                    padding: '20px', 
                    border: '3px solid lightgrey', 
                    color: 'black',
                    borderRadius: '10px', 
                    outline: 'none', 
                    fontWeight: 'bold',
                    backdropFilter: 'blur(7px)',
                    fontSize: '20px',
                    backgroundColor: 'rgb(255,255,255,.5)', 
                    fontFamily: "'Radio Canada', sans-serif",
                  }}
                />
                 {inputStyles.password && <label style={{ position: 'absolute', top: '-10px', left: '15px', backgroundColor: 'white', padding: '0 10px',  borderTopRightRadius: '3px', borderTopLeftRadius: '3px', 
                fontFamily: "'Radio Canada', sans-serif", fontWeight: 'bold', height: '13px' }}>Password</label>}
        </div>
           
            <div style={{ position: 'relative', width: '410px', marginBottom: '20px', marginLeft: '20px' }}>
              <input 
                type="password" 
                placeholder="Confirm Password" 
                value={confirmPassword}
                onFocus={() => handleInputFocus('confirmPassword')}
                onBlur={(e) => handleInputBlur('confirmPassword', e.target.value)}
                onChange={e => {
                  setConfirmPassword(e.target.value);
                  setPasswordsMatch(e.target.value === password);
                  e.target.style.borderColor = e.target.value.trim() !== '' ? 'lightgreen' : 'lightgrey';
                }}
                style={{ 
                  width: '100%', 
                  padding: '20px', 
                  fontWeight: 'bold',
                  border: '3px solid lightgrey', 
                  color: 'black',
                  borderRadius: '10px', 
                  outline: 'none', 
                  backdropFilter: 'blur(7px)',
                  fontSize: '20px',
                  backgroundColor: 'rgb(255,255,255,.5)', 
                  fontFamily: "'Radio Canada', sans-serif",
                }}
              />
              {inputStyles.confirmPassword && <label style={{ position: 'absolute', top: '-10px', left: '15px', backgroundColor: 'white', padding: '0 10px',  borderTopRightRadius: '3px', borderTopLeftRadius: '3px', 
              fontFamily: "'Radio Canada', sans-serif", fontWeight: 'bold', height: '13px' }}>Confirm Password</label>}
            </div>
           
          </div>
          
          {!passwordsMatch && (
            <p style={{ color: 'red', marginTop: '5px', marginBottom: '15px', fontFamily: "'Radio Canada', sans-serif" }}>
              Passwords do not match
            </p>
          )}
        
            {isFormComplete() && (
              <div style={{display: 'flex', marginTop: '0px'}}>
                <button onClick={handleSignUp}
                  type="submit"
                  style={{ 
                    width: '250px',
                    background: 'transparent',
                    borderColor: 'transparent',
                    transition: '.3s'
                  }}
                >
                  <img src='/SignUp.png' style={{width: '250px', borderRadius: '15px' , transition: '.3s', cursor: 'pointer'}}
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
                    }}
                  />
                </button>
                <p style={{ fontFamily: "'Radio Canada', sans-serif", color: 'black', marginLeft: '40px', fontSize: '20px', width: '600px'}}>
                  By Signing up you agree to SquareScore's <a href="/TermsofService" style={{ color: 'blue' }}>terms of service</a>  and <a href="/PrivacyPolicy" style={{ color: 'blue' }}>Privacy Policy</a>
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

export default SignUpAdmin;
