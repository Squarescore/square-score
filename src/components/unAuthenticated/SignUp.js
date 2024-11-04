import React, { useState, useCallback, useEffect } from 'react';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "../Universal/firebase"; // Adjust the path to your firebase configuration
import { Link, useNavigate } from 'react-router-dom'; // Import the navigate hook
import './BackgroundDivs.css'; // Import the CSS file
import { doc, setDoc, serverTimestamp, getDoc, updateDoc } from "firebase/firestore"; 
import { ArrowLeft, SquareCheck, SquareX } from 'lucide-react';
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
  const [navbarBg, setNavbarBg] = useState('rgba(255,255,255,0.7)');
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [referralCode, setReferralCode] = useState('');
  const [referralError, setReferralError] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(true);

  const [allCriteriaMet, setAllCriteriaMet] = useState(false);
  const [inputValidation, setInputValidation] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    confirmPassword: false
  });

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
  const generateReferralCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 7; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
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
        if (referralCode) {
          const teacherQuery = await getDoc(doc(db, 'teachers', referralCode));
          if (teacherQuery.exists()) {
            const teacherData = teacherQuery.data();
            if (!teacherData.referredTeachers) {
              teacherData.referredTeachers = [];
            }
            teacherData.referredTeachers.push(uid);
            await updateDoc(doc(db, 'teachers', referralCode), teacherData);
          } else {
            setReferralError('Invalid referral code');
            return;
          }
        }
        userProfile.testsTaken = [];
        userProfile.classesIn = [];
        userProfile.grades = [];
        userProfile.questionsCompleted = 0;
        userProfile.reviewedTests = false;
        await setDoc(doc(db, 'students', uid), userProfile);
        navigate('/studenthome');
      } else if (role === 'teacher') {
        const newReferralCode = generateReferralCode();
        userProfile.classesOwned = [];
        userProfile.draftAssignments = [];
        userProfile.testsAssigned = [];
        userProfile.createdAt = serverTimestamp();
        userProfile.referralCode = newReferralCode;
        userProfile.referredTeachers = [];
        userProfile.hasAccess = false;
        await setDoc(doc(db, 'teachers', uid), userProfile);
        navigate('/teacherhome');
      } else if (role === 'admin') {
        userProfile.school = [];
        userProfile.usage = [];
        userProfile.teachers = [];
        await setDoc(doc(db, 'admin', uid), userProfile);
        navigate('/adminhome');
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
    
    const criteriamet = Object.values(newCriteria).every(Boolean);
    
    setPasswordCriteria(newCriteria);
    setAllCriteriaMet(criteriamet);
    setInputValidation(prev => ({
      ...prev,
      password: criteriamet && password.length > 0,
      // Update confirm password validation state when password changes
      confirmPassword: password === confirmPassword && password.length > 0 && criteriamet
    }));
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
    <div style={{ position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fcfcfc',backdropFilter: 'blur(7px)'}}>
  
  <div style={{ 
          position: 'fixed', top: 0, width: '100%', display: 'flex',boxShadow: '1px 1px 5px 1px rgb(0,0,155,.1)',
          padding: '0px 0', alignItems: 'center', height: '60px', color: 'grey', zIndex: 1000,
          backgroundColor: navbarBg, transition: 'background-color 0.3s ease',
          backdropFilter: 'blur(7px)',
        }}>
          <div style={{ marginLeft: 'auto', marginRight: 'auto', display: 'flex'}}>
            <div style={{ width: '1280px', display: 'flex', backgroundColor: 'transparent', padding: '0px 0', alignItems: 'center', height: '70px', color: 'grey', marginRight: 'auto', marginLeft: 'auto' }}>
              
            <div style={{display: 'flex',  position: 'absolute',
      left: '30px',
      top: '50%',
      transform: 'translateY( -50%)'}}>
              <img style={{width: '25px',  }} src="/SquareScore.svg" alt="logo" />
              <h1 style={{fontWeight: '600', color: 'black', paddingLeft: '10px', borderLeft: '4px solid #f4f4f4', marginLeft: '10px', fontSize: '20px'}}>SquareScore</h1>
              </div>
            </div>
            <div style={{ width: '300px', display: 'flex', position: 'fixed', right: '20px' }}>
           
              <Link to="/login" style={{
                height: '30px', marginTop: '15px', lineHeight: '30px', borderRadius: '8px',
                fontWeight: '600', background: 'transparent',  color: 'black',

                textDecoration: 'none', width: '100px', marginLeft: 'auto',
               textAlign: 'center', transition: '.2s',
                fontFamily: "'montserrat', sans-serif", fontSize: '16px'
              }}
              onMouseEnter={(e) => {     e.target.style.background = '#f4f4f4';
                e.target.style.border = '3px solid lightgrey';
                
                e.target.style.color = 'grey';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                
                e.target.style.color = 'black';
                e.target.style.border = '3px solid transparent';
          
              }}>Login</Link>
            </div>
          </div>
        </div>

      <div  style={{width: '1000px', marginLeft: 'auto', height: '620px', marginTop: '120px', marginRight: 'auto',  backgroundColor: 'white',padding: '20px', boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)', borderRadius: '30px', }}>
        
       
        <form onSubmit={handleSignUp}> 
          <div style={{background: '#AEF2A3 ', border: '10px solid #2AD00E', margin: '-20px -20px 10px -20px', height: '70px', borderRadius: '30px 30px 0px 0px', display: 'flex' }}>
        <h1 style={{ fontWeight: 'Bold',
           color: '#2AD00E', fontSize: '40px', fontFamily: "'montserrat', sans-serif", 
            padding: '0px', backgroundColor: 'transparent', 
             marginLeft: '50px',width: '370px', marginTop: '10px'}}>Create Account +</h1>
      
      
      
       
            </div>



          <div style={{ width: '920px', marginLeft: 'auto', marginRight: 'auto', marginTop: '40px'}}>



            <div style={{marginBottom: '50px', display: 'flex'}}>
            <h1 style={{fontFamily: "'montserrat', sans-serif", fontWeight: '600', fontSize: '25px', marginTop: '2px'}}>Select Role:</h1>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '35%',marginLeft: '0px',  marginTop: '-2px', height: '40px',}}>
            <button 
              type="button"
              onClick={() => toggleRole('student')}
              style={{ 
                flex: 1, 
                marginLeft: '22px',
                marginRight: '20px',
                backgroundColor: role === 'student' ? '#FFEC87' : 'transparent',
                color:   role === 'student' ? '#FC8518' : 'grey',
                borderColor: role === 'student' ? '#FC8518' : 'transparent',
               
                fontSize: '20px', 
                fontWeight: '600',
                borderWidth: '3px',
                borderStyle: 'solid',
                cursor: 'pointer',
                fontFamily: "'montserrat', sans-serif",
                borderRadius: '10px',
                transition: '.2s',
              }}
            >
              Student
            </button>
            <button 
              type="button"
              onClick={() => toggleRole('teacher')}
              style={{ 
                flex: 1, 
                marginLeft: '-2px',
                marginRight: '20px',
                backgroundColor: role === 'teacher' ? '#C2D3FF' : 'transparent',
                color:   role === 'teacher' ? '#020CFF' : 'grey',
                borderColor: role === 'teacher' ? '#020CFF' : 'transparent',
               
                fontSize: '20px', 
                fontWeight: '600',
                borderWidth: '3px',
                borderStyle: 'solid',
                cursor: 'pointer',
                fontFamily: "'montserrat', sans-serif",
                borderRadius: '10px',
                transition: '.2s',
              }}
            >
              Teacher
            </button>
            </div>

            </div>



            <div style={{display: 'flex'}}>
              <div style={{ position: 'relative', width: '410px', marginBottom: '20px' }}>
                <input 
                  type="text" 
                  value={firstName}
                  onFocus={() => handleInputFocus('firstName')}
                  onBlur={(e) => handleInputBlur('firstName', e.target.value)}
                  onChange={e => {
                    const formattedName = formatName(e.target.value);
                    setFirstName(formattedName);
                    setInputValidation(prev => ({
                      ...prev,
                      firstName: formattedName.length > 0
                    }));   }}
                  style={{ 
                    width: '90%', 
                    padding: '10px', 
                    border: '2px solid lightgrey', 
                    color: 'black',
                    fontWeight: '600',
                    borderRadius: '8px', 
                    outline: 'none', 
                    backdropFilter: 'blur(7px)',
                    fontSize: '20px',
                    backgroundColor: 'rgb(250,250,250,.5)', 
                    fontFamily: "'montserrat', sans-serif",
                  }}
                />
       <div style={{ position: 'absolute', top: '-30px', left: '-10px', backgroundColor: 'white', padding: '0 10px', borderTopRightRadius: '3px', borderTopLeftRadius: '3px', zIndex: '20', fontFamily: "'montserrat', sans-serif", fontWeight: '600', height: '13px', fontSize: '20px', display: 'flex' }}>
                  <h1 style={{fontFamily: "'montserrat', sans-serif", fontWeight: '600', fontSize: '16px', marginTop: '2px'}}>First Name</h1>
                  {inputValidation.firstName ? 
                    <SquareCheck size={20} style={{marginLeft: '10px', marginTop: '3px', color: '#2BB514'}}/> : 
                    <SquareX size={20} style={{marginLeft: '10px', marginTop: '3px', color: 'lightgrey'}}/>
                  }
                </div>
              </div>
              <div style={{ position: 'relative', width: '410px', marginBottom: '20px', marginLeft: '20px' }}>
                <input 
               type="text" 
               value={lastName}
               onFocus={() => handleInputFocus('lastName')}
               onBlur={(e) => handleInputBlur('lastName', e.target.value)}
               onChange={e => {
                 const formattedName = formatName(e.target.value);
                 setLastName(formattedName);
                 setInputValidation(prev => ({
                   ...prev,
                   lastName: formattedName.length > 0
                 }));
               }}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                  
                    fontWeight: '600',
                    border: '2px solid lightgrey', 
                    color: 'black',
                    borderRadius: '8px', 
                    outline: 'none', 
                    backdropFilter: 'blur(7px)',
                    fontSize: '20px',
                    backgroundColor: 'rgb(250,250,250,.5)', 
                    fontFamily: "'montserrat', sans-serif",
                  }}
                />
                <div style={{ position: 'absolute', top: '-30px', left: '-10px', backgroundColor: 'white', padding: '0 10px', borderTopRightRadius: '3px', borderTopLeftRadius: '3px', zIndex: '20', fontFamily: "'montserrat', sans-serif", fontWeight: '600', height: '13px', fontSize: '20px', display: 'flex' }}>
                  <h1 style={{fontFamily: "'montserrat', sans-serif", fontWeight: '600', fontSize: '16px', marginTop: '2px'}}>Last Name</h1>
                  {inputValidation.lastName ? 
                    <SquareCheck size={20} style={{marginLeft: '10px', marginTop: '3px', color: '#2BB514'}}/> : 
                    <SquareX size={20} style={{marginLeft: '10px', marginTop: '3px', color: 'lightgrey'}}/>
                  }
                </div>
                </div>
            </div> 
            <div style={{ position: 'relative', width: '855px', marginBottom: '13px', 
                  marginTop: '40px', }}>
            <input 
           type="email" 
           value={email}
           onFocus={() => handleInputFocus('email')}
           onBlur={(e) => handleInputBlur('email', e.target.value)}
           onChange={e => {
             const newEmail = e.target.value.replace(/\s/g, '');
             setEmail(newEmail);
             const isValid = validateEmail(newEmail);
             setIsEmailValid(isValid);
             setInputValidation(prev => ({
               ...prev,
               email: isValid
             }));
           }}
                style={{ 
                  width: '500px', 
                  padding: '10px', 
                  border: '2px solid lightgrey', 
                    color: 'black',
                    fontWeight: '600',
                    borderRadius: '8px', 
                    outline: 'none', 
                    backdropFilter: 'blur(10px)',
                    fontSize: '20px',
                    backgroundColor: 'rgb(250,250,250,.5)', 
                    fontFamily: "'montserrat', sans-serif",
                }}
              />
         <div style={{ position: 'absolute', top: '-30px', left: '-10px', backgroundColor: 'white', padding: '0 10px', borderTopRightRadius: '3px', borderTopLeftRadius: '3px', zIndex: '20', fontFamily: "'montserrat', sans-serif", fontWeight: '600', height: '13px', fontSize: '20px', display: 'flex' }}>
                <h1 style={{fontFamily: "'montserrat', sans-serif", fontWeight: '600',fontSize: '16px', marginTop: '2px'}}>Email</h1>
                {inputValidation.email ? 
                  <SquareCheck size={20} style={{marginLeft: '10px', marginTop: '3px', color: '#2BB514'}}/> : 
                  <SquareX size={20} style={{marginLeft: '10px', marginTop: '3px', color: 'lightgrey'}}/>
                }
              </div>
            </div>
      
            <div style={{display: 'flex',marginTop: '60px'}}>
              <div style={{ position: 'relative', width: '410px', marginBottom: '20px' }}>
                <input 
                      type="password" 
                      value={password}
                      onFocus={() => handleInputFocus('password')}
                      onBlur={(e) => handleInputBlur('password', e.target.value)}
                      onChange={e => {
                        const newPassword = e.target.value;
                        setPassword(newPassword);
                        setPasswordsMatch(newPassword === confirmPassword);
                        checkPasswordCriteria(newPassword);
                   
                      }}
                  style={{ 
                    width: '90%',  
                    padding: '10px', 
                    border: '2px solid lightgrey', 
                    color: 'black',
                    borderRadius: '8px', 
                    outline: 'none', 
                    fontWeight: '600',
                    backdropFilter: 'blur(7px)',
                    fontSize: '20px',
                    backgroundColor: 'rgb(255,255,255,.5)', 
                    fontFamily: "'montserrat', sans-serif",
                  }}
                />
          <div style={{ position: 'absolute', top: '-30px', left: '-10px', backgroundColor: 'white', padding: '0 10px', borderTopRightRadius: '3px', borderTopLeftRadius: '3px', zIndex: '20', fontFamily: "'montserrat', sans-serif", fontWeight: '600', height: '13px', fontSize: '20px', display: 'flex' }}>
                  <h1 style={{fontFamily: "'montserrat', sans-serif", fontWeight: '600', fontSize: '16px', marginTop: '2px'}}>Password</h1>
                  {inputValidation.password ? 
                    <SquareCheck size={20} style={{marginLeft: '10px', marginTop: '3px', color: '#2BB514'}}/> : 
                    <SquareX size={20} style={{marginLeft: '10px', marginTop: '3px', color: 'lightgrey'}}/>
                  }
                </div>
              </div>
           
            <div style={{ position: 'relative', width: '410px', marginBottom: '20px', marginLeft: '20px',  }}>
              <input 
                 type="password" 
                  value={confirmPassword}
                  onFocus={() => handleInputFocus('confirmPassword')}
                  onBlur={(e) => handleInputBlur('confirmPassword', e.target.value)}
                  onChange={e => {
                    setConfirmPassword(e.target.value);
                    setPasswordsMatch(e.target.value === password);
                    setInputValidation(prev => ({
                      ...prev,
                      confirmPassword: e.target.value === password && password !== ''
                    }));
                  }}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  fontWeight: '600',
                  border: '2px solid lightgrey', 
                  color: 'black',
                  borderRadius: '8px', 
                  outline: 'none', 
                  backdropFilter: 'blur(7px)',
                  fontSize: '20px',
                  backgroundColor: 'rgb(255,255,255,.5)', 
                  fontFamily: "'montserrat', sans-serif",
                }}
              />
               <div style={{ position: 'absolute', top: '-30px', left: '-10px', backgroundColor: 'white', padding: '0 10px',  borderTopRightRadius: '3px', borderTopLeftRadius: '3px', zIndex: '20',
                    fontFamily: "'montserrat', sans-serif", fontWeight: '600', height: '13px', fontSize: '20px', display: 'flex'  }}> <h1 style={{fontFamily: "'montserrat', sans-serif", fontWeight: '600', fontSize: '16px', marginTop: '2px'}}>
                      Confirm Password
                      </h1>{inputValidation.confirmPassword ? 
                    <SquareCheck size={20} style={{marginLeft: '10px', marginTop: '3px', color: '#2BB514'}}/> : 
                    <SquareX size={20} style={{marginLeft: '10px', marginTop: '3px', color: 'lightgrey'}}/>
                  }</div>
            </div>
           
          </div>
          <div style={{ display: 'flex', 
            
            backgroundColor: 'transparent',
          borderRadius: '10px',
          backdropFilter: 'blur(5px)',
          
          justifyContent: 'space-between', width: '880px', marginTop: '-10px', marginBottom: '25px' }}>
        <h1 style={{fontFamily: "'montserrat', sans-serif", fontSize: '16px', 
           color: allCriteriaMet ? '#91D487' : 'grey'
        }}>Password Criteria</h1>
          {Object.entries(passwordCriteria).map(([criterion, isMet]) => (
            <div key={criterion} style={{ display: 'flex', alignItems: 'center', fontFamily: "'montserrat', sans-serif" }}>
              
              <div style={{ color: isMet ? '#2BB514' : 'grey', marginRight: '5px' }}>
                {isMet ? <SquareCheck size={20} style={{marginTop: '2px'}}/> : <SquareX size={20} style={{marginTop: '2px'}}/>}
              </div>
              <span style={{ color: isMet ? '#2BB514' : 'grey' }}>
                {criterion === 'length' ? ' 8+ characters' : 
                 criterion === 'uppercase' ? 'Uppercase letter' :
                 criterion === 'lowercase' ? 'Lowercase letter' : 'Number'}
              </span>
            </div>
          ))}
        </div>
          {!passwordsMatch && (
            <p style={{ color: 'red', marginTop: '5px', marginBottom: '15px', fontFamily: "'montserrat', sans-serif" }}>
              Passwords do not match
            </p>
          )}
       
            {isFormComplete() && (
              <div style={{display: 'flex', marginTop: '0px'}}>
                <button onClick={handleSignUp}
                  type="submit"
                  style={{ 
                    width: '350px',
                    height: '50px',
                    fontSize: '25px',
                    
                    color: role === 'student' ? '#FC8518' : 'blue',
                    border: '4px solid',
                    borderRadius: '10px',
                    backgroundColor: role === 'student' ? '#FFEC87' : '#A9B7FF',
                    fontWeight: 'bold',
                    fontFamily: "'montserrat', sans-serif",
                    transition: '.3s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (isFormComplete()) {
                      e.target.style.opacity = '85%';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isFormComplete()) {
                      e.target.style.opacity = '100%';
                      e.target.style.boxShadow= 'none'
                    }
                  }}
                >
                Create Account <span style={{fontSize: '16px', lineHeight: '10px'}}>({role})</span>
                </button>
                <p style={{ fontFamily: "'montserrat', sans-serif", color: 'black', marginLeft: '40px', fontSize: '20px', width: '450px', marginTop: '0px'}}>
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
            <h2 style={{ fontFamily: "'montserrat', sans-serif", }}>Account Creation Successful</h2>
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
