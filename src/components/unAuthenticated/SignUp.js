import React, { useState, useCallback, useEffect } from 'react';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "../Universal/firebase"; // Adjust the path to your firebase configuration
import { Link, useLocation, useNavigate } from 'react-router-dom'; // Import the navigate hook
import './BackgroundDivs.css'; // Import the CSS file
import { doc, setDoc, serverTimestamp, getDoc, updateDoc, arrayUnion, collection, query, where, getDocs } from "firebase/firestore"; 
import { BookOpenText, Check, CheckCircle, CheckCircle2, CircleCheck, CircleX, Eye, EyeOff, GraduationCap, SquareCheck, SquareX } from 'lucide-react';
import { GlassContainer } from '../../styles.js'; // Import GlassContainer

const ClassSignupInfo = ({ classInfo }) => {
  if (!classInfo) return null;

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '5px 20px',
      marginLeft: '20px',
      position: 'fixed',
      top: '10px',
      zIndex: '2000',
      overflow: 'hidden',
      borderRadius: '10px',
      marginBottom: '30px',
    }}>
      <div style={{
        display: 'flex',
        gap: '5px'
      }}>
        <span style={{ color: 'black', fontWeight: '500', fontSize: "1rem", marginTop: '3px' }}>
          Joining:
        </span>
        <span style={{ color: 'black', fontWeight: '500', fontSize: "1rem", marginLeft: '10px' , marginTop: '3px'  }}>
          Period {decodeURIComponent(classInfo.period)},
        </span>
        <span style={{ color: 'black', fontWeight: '500', fontSize: "1rem", marginLeft: '5px' , marginTop: '3px'  }}>
          {decodeURIComponent(classInfo.classChoice)}
        </span>
      </div>
    </div>
  );
};
const SignUp = () => {
  // State Variables
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('student'); // Default role
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Initialize the navigate function
  const [showPopup, setShowPopup] = useState(false); // Popup state
  const [navbarBg, setNavbarBg] = useState('rgba(255,255,255,0.7)');
  const [referralCode, setReferralCode] = useState('');
  const [referralError, setReferralError] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [allCriteriaMet, setAllCriteriaMet] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [classInfo, setClassInfo] = useState(null);
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [inputValidation, setInputValidation] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false
  });
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false
  });
  const [inputStyles, setInputStyles] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false
  });

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/signup/')) {
      const classInfoStr = path.slice(8); // Remove '/signup/'
      const [classCode, encodedPeriodStr, encodedClassChoice] = classInfoStr.split('+');
  
      if (classCode && encodedPeriodStr && encodedClassChoice) {
        // Extract period number from "Period X" string
        const periodStr = decodeURIComponent(encodedPeriodStr);
        const periodNumber = parseInt(periodStr.split(' ')[1]);
        
        setClassInfo({
          classCode,
          period: periodNumber,
          classChoice: encodedClassChoice
        });
        // Force role to student when signing up through class link
        setRole('student');
      }
    }
  }, [location]);
  
  const PasswordCriteria = ({ passwordCriteria, allCriteriaMet }) => (
    <div style={{
      position: 'absolute',
      top: '-24px',
      width: '380px',
      zIndex: '10',
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #eee',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <div style={{ width: '100%', padding: '16px' }}>
        {/* First row: Length and Number */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '12px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            width: '50%'
          }}>
            {passwordCriteria.length ? (
              <CircleCheck size={20} style={{ color: '#2BB514' }} />
            ) : (
              <CircleX size={20} style={{ color: '#D3D3D3' }} />
            )}
            <span style={{ 
              marginLeft: '8px',
              color: passwordCriteria.length ? '#2BB514' : '#D3D3D3',
              fontWeight: '500'
            }}>
              8+ characters
            </span>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            width: '50%'
          }}>
            {passwordCriteria.number ? (
              <CircleCheck size={20} style={{ color: '#2BB514' }} />
            ) : (
              <CircleX size={20} style={{ color: '#D3D3D3' }} />
            )}
            <span style={{ 
              marginLeft: '8px',
              color: passwordCriteria.number ? '#2BB514' : '#D3D3D3',
              fontWeight: '500'
            }}>
              Number
            </span>
          </div>
        </div>
        
        {/* Second row: Uppercase and Lowercase */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            width: '50%'
          }}>
            {passwordCriteria.uppercase ? (
              <CircleCheck size={20} style={{ color: '#2BB514' }} />
            ) : (
              <CircleX size={20} style={{ color: '#D3D3D3' }} />
            )}
            <span style={{ 
              marginLeft: '8px',
              color: passwordCriteria.uppercase ? '#2BB514' : '#D3D3D3',
              fontWeight: '500'
            }}>
              Uppercase letter
            </span>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            width: '50%'
          }}>
            {passwordCriteria.lowercase ? (
              <CircleCheck size={20} style={{ color: '#2BB514' }} />
            ) : (
              <CircleX size={20} style={{ color: '#D3D3D3' }} />
            )}
            <span style={{ 
              marginLeft: '8px',
              color: passwordCriteria.lowercase ? '#2BB514' : '#D3D3D3',
              fontWeight: '500'
            }}>
              Lowercase letter
            </span>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Utility Functions
  const validateEmail = (email) => {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const formatName = (name) => {
    if (!name) return '';
    // Remove non-alphabetic characters, capitalize first letter, lowercase the rest
    const cleanedName = name.replace(/[^a-zA-Z]/g, '');
    return cleanedName.charAt(0).toUpperCase() + cleanedName.slice(1).toLowerCase();
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
    setIsSubmitting(true);
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
        userProfile.pendingClasses = [];
        
        // If there's class info, let's add them directly to the class
        if (classInfo && classInfo.classCode) {
          // Find the class document
          const classesRef = collection(db, 'classes');
          const classQuery = query(classesRef, where('classCode', '==', classInfo.classCode));
          const classSnapshot = await getDocs(classQuery);
          
          if (!classSnapshot.empty) {
            const classDoc = classSnapshot.docs[0];
            const classData = classDoc.data();
            
            // Create student info for class
            const studentInfo = {
              uid,
              email,
              name: `${formatName(firstName)} ${formatName(lastName)}`,
              timeMultiplier: 1
            };

            // Create class info for student
            const classInfo = {
              classId: classDoc.id,
              classChoice: classData.classChoice,
              period: classData.period
            };

            // Update userProfile with the class
            userProfile.classes = [classInfo];

            // Create student document with class included
            await setDoc(doc(db, 'students', uid), userProfile);

            // Update class document to include the student
            await updateDoc(doc(db, 'classes', classDoc.id), {
              students: arrayUnion(uid),
              participants: arrayUnion(studentInfo)
            });
          } else {
            // If class not found, create student doc without class
            await setDoc(doc(db, 'students', uid), userProfile);
          }
        } else {
          // If no class info, just create the student doc
          await setDoc(doc(db, 'students', uid), userProfile);
        }

        // Instead of navigating directly, wait a moment for Firebase to update
        await new Promise(resolve => setTimeout(resolve, 1000));
        window.location.href = '/studenthome';
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
      setIsSubmitting(false);
    }
  };

  const toggleRole = (newRole) => {
    setRole(newRole);
  };

  const handlePopupClose = () => {
    setShowPopup(false); // Close the popup
    navigate('/login'); // Navigate to login page
  };

  const isFormComplete = () => {
    return email && password && role && firstName && lastName && allCriteriaMet;
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
      password: criteriamet && password.length > 0
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

  // Handlers for Input Focus and Blur
  const handleInputFocus = (inputName) => {
    setInputStyles(prevState => ({ ...prevState, [inputName]: true }));
  };

  const handleInputBlur = (inputName, value) => {
    setInputStyles(prevState => ({ ...prevState, [inputName]: value.trim() !== '' }));
  };

  // Add at the top with other style constants
  const inputContainerStyle = {
    display: 'flex', 
    alignItems: 'center', 
    gap: '10px', 
    marginTop: '.3rem',
  };

  const labelStyle = {
    padding: '0 5px',
    fontFamily: "'montserrat', sans-serif",
    fontWeight: '500',
    color: 'grey',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
    width: '120px'
  };

  const inputStyle = {
    padding: '8px 15px',
    margin: '8px 0',
    marginLeft: 'auto',
    border: '1px solid #ddd',
    outline: 'none',
    borderRadius: '25px',
    fontSize: '1rem',
    width: '250px',
    fontFamily: "'montserrat', sans-serif",
  };

  const validationIconStyle = {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center'
  };

  return (
    <div style={{ 
      position: 'relative', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      backgroundColor: '#white',
      backdropFilter: 'blur(7px)'
    }}>
     
  {classInfo && <ClassSignupInfo classInfo={classInfo} />}
      {/* Navbar */}
   <div style={{ 
             position: 'fixed', top: 0, width: '100%', display: 'flex',borderBottom: '1px solid lightgrey',
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
           <Link to="/">
                 <img style={{width: '35px',  }} src="/FAVICON.svg" alt="logo" />
                 </Link></div>
   
                 
              
   
               </div>
   
   
<h1 style={{position: 'absolute'
  ,
  left: '50%',
  top: '5px',
  transform: 'translate(-50%)',
  fontWeight:'400',
  fontSize: '1.3rem',
  color: 'black'
}}>Create An Account</h1>
   
               <div style={{ width: '700px', display: 'flex', position: 'fixed', right: '20px' }}>
   
   
       
               <Link to="/login" style={{
                   height: '30px', marginTop: '20px', lineHeight: '30px', borderRadius: '5px',
                   fontWeight: '500', marginLeft:'auto',
                     color: 'grey',
   width: '10rem',
                   textDecoration: 'none', 
                  textAlign: 'center', transition: '.2s',
                   fontFamily: "'montserrat', sans-serif", 
                   fontSize: '1rem',
   
   
                   transition: 'color 0.3s, box-shadow 0.3s',
                
                 }}
                
                 onMouseEnter={(e) => {
                   e.currentTarget.style.color = 'darkgrey';
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.color = 'grey';
                 }}
                 
                 
                 
                 >Login</Link>
               
                
               </div>
             </div>
      </div>

      {/* Sign-Up Form Container */}
      <div style={{
        width: '450px', 
        marginLeft: 'auto', 
        marginTop: '150px', 
        marginRight: 'auto',  
        display: 'flex',
        flexDirection: 'column',
      }}>
        <GlassContainer
        size={1}
          variant="clear"
          style={{
            width: '107%',

            borderRadius: '12px',
          }}
          contentStyle={{padding: '30px', paddingBottom: '10px'}}
        >
          {/* Form Header */}
          <form onSubmit={handleSignUp} style={{ width: '100%' }}> 
          
  {/* Role Selection - Only show if not joining via class link */}
  {!classInfo && (
    <div style={{marginBottom: 'calc(1.5rem - 10px)'}}>
      <div style={inputContainerStyle}>
        <label style={labelStyle}>
          Role
        </label>
        <div style={{ 
          position: 'relative', 
          flex: 1, 
          display: 'flex', 
          justifyContent: 'flex-end',
          gap: '10px'
        }}>
          {role === 'student' ? (
            <div>
            <GlassContainer 
                      enableRotation={true}
              variant="yellow" 
              size={0}
              onClick={() => toggleRole('student')}
              style={{
                cursor: 'pointer',
              }}
              contentStyle={{
                display: 'flex',
                height: '32px',
                width: '135px',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <div style={{display:'flex', gap: '8px'}}>
              <BookOpenText size={16} style={{ color: '#ffc300' }} />
              <span style={{
                fontWeight: '500', 
                fontSize: '0.9rem',
                color: '#ffc300',
                fontFamily: "'montserrat', sans-serif"
              }}>
                Student
              </span>
              </div>
            </GlassContainer>
            </div>
          ) : (
            <button
              onClick={() => toggleRole('student')}
              style={{
                background: 'none',
                border: '1px solid #fff',
                cursor: 'pointer',
                borderRadius: '25px',
                height: '35px',
                width: '135px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <BookOpenText size={16} style={{ color: '#D2D2D2' }} />
              <span style={{
                fontWeight: '500', 
                fontSize: '0.9rem',
                color: 'grey',
                fontFamily: "'montserrat', sans-serif"
              }}>
                Student
              </span>
            </button>
          )}

          {role === 'teacher' ? (
            <div>
            <GlassContainer 
                      enableRotation={true}
              variant="blue" 
              size={0}
              onClick={() => toggleRole('teacher')}
              style={{
                cursor: 'pointer',
              }}
              contentStyle={{
                display: 'flex',
                height: '32px',
                width: '135px',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <div style={{display:'flex', gap: '8px'}}>
              <GraduationCap size={16} style={{ color: '#1651d4' }} />
              <span style={{
                fontWeight: '500', 
                fontSize: '0.9rem',
                color: '#1651d4',
                fontFamily: "'montserrat', sans-serif"
              }}>
                Teacher
              </span>
              </div>
            </GlassContainer>
            </div>
          ) : (
            <button
              onClick={() => toggleRole('teacher')}
              style={{
                background: 'none',
                border: '1px solid #fff',
                cursor: 'pointer',
                borderRadius: '25px',
                height: '35px',
                width: '135px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <GraduationCap size={16} style={{ color: '#D2D2D2' }} />
              <span style={{
                fontWeight: '500', 
                fontSize: '0.9rem',
                color: 'grey',
                fontFamily: "'montserrat', sans-serif"
              }}>
                Teacher
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  )}

  <div style={{marginTop:'0px'}}>
    {/* First Name */}
          <div style={inputContainerStyle}>
            <label style={labelStyle}>
              First Name
            </label>
            <div style={{ position: 'relative', flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <input
                type="text"
                value={firstName}
                onChange={(e) => {
                  const formattedName = formatName(e.target.value);
                  setFirstName(formattedName);
                  setInputValidation(prev => ({
                    ...prev,
                    firstName: formattedName.length > 0
                  }));
                }}
                style={inputStyle}
              />
              <div style={validationIconStyle}>
                {inputValidation.firstName ?
                  <CircleCheck size={14} style={{ color: '#2BB514' }} /> :
                  <CircleX size={14} style={{ color: 'lightgrey' }} />
                }
              </div>
            </div>
          </div>

          {/* Last Name */}
          <div style={inputContainerStyle}>
            <label style={labelStyle}>
              Last Name
            </label>
            <div style={{ position: 'relative', flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <input
                type="text"
                value={lastName}
                onChange={(e) => {
                  const formattedName = formatName(e.target.value);
                  setLastName(formattedName);
                  setInputValidation(prev => ({
                    ...prev,
                    lastName: formattedName.length > 0
                  }));
                }}
                style={inputStyle}
              />
              <div style={validationIconStyle}>
                {inputValidation.lastName ?
                  <CircleCheck size={14} style={{ color: '#2BB514' }} /> :
                  <CircleX size={14} style={{ color: 'lightgrey' }} />
                }
              </div>
            </div>
          </div>

          {/* Email */}
          <div style={inputContainerStyle}>
            <label style={labelStyle}>
              Email
            </label>
            <div style={{ position: 'relative', flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  const newEmail = e.target.value.replace(/\s/g, '');
                  setEmail(newEmail);
                  setInputValidation(prev => ({
                    ...prev,
                    email: newEmail.length > 0
                  }));
                }}
                style={inputStyle}
              />
              <div style={validationIconStyle}>
                {inputValidation.email ?
                  <CircleCheck size={14} style={{ color: '#2BB514' }} /> :
                  <CircleX size={14} style={{ color: 'lightgrey' }} />
                }
              </div>
            </div>
          </div>

          {/* Password */}
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            marginBottom: isPasswordFocused ? '0' : '1.3rem'
          }}>
            <div style={inputContainerStyle}>
              <label style={labelStyle}>
                Password
              </label>
              <div style={{ position: 'relative', flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  onChange={(e) => {
                    const newPassword = e.target.value;
                    setPassword(newPassword);
                    checkPasswordCriteria(newPassword);
                  }}
                  style={{
                    ...inputStyle,
                    fontSize: '1rem',
                  }}
                />
                <div style={{
                  ...validationIconStyle,
                  gap: '8px',
                  right: '8px'
                }}>
                  <div
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px'
                    }}
                  >
                    {showPassword ? (
                      <EyeOff size={14} style={{ color: '#666' }} />
                    ) : (
                      <Eye size={14} style={{ color: '#666' }} />
                    )}
                  </div>
                  {inputValidation.password ?
                    <CircleCheck size={14} style={{ color: '#2BB514' }} /> :
                    <CircleX size={14} style={{ color: 'lightgrey' }} />
                  }
                </div>
              </div>
            </div>
            {isPasswordFocused && (
              <div style={{ 
                marginTop: '0.5rem',
                marginBottom: '1rem',
                width: '100%',
                position: 'relative'
              }}>
                <PasswordCriteria passwordCriteria={passwordCriteria} allCriteriaMet={allCriteriaMet} />
              </div>
            )}
          </div>
           
          </div>

          {/* Create Account Button and Terms */}
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', marginTop: '30px'}}>
            <GlassContainer
              variant={isFormComplete() ? (role === 'student' ? 'yellow' : 'blue') : 'grey'}
              size={1}
                        enableRotation={true}
              onClick={isFormComplete() ? handleSignUp : null}
              style={{
                cursor: isFormComplete() ? (isSubmitting ? 'default' : 'pointer') : 'not-allowed',
                width: '100%',
                borderRadius: '8px',
                opacity: isSubmitting ? '0.7' : '1',
                transition: '.3s'
              }}
              contentStyle={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '12px'
              }}
            >
              <h1 style={{
                fontWeight: '500',
                fontSize: '1.1rem',
                color: isFormComplete() ? (role === 'student' ? '#ffc300' : '#1651d4') : '#808080',
                fontFamily: "'montserrat', sans-serif",
                margin: 0
              }}>
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </h1>
            </GlassContainer>
            <p style={{ 
              fontFamily: "'montserrat', sans-serif",
              color: 'grey', 
              fontSize: '0.875rem', 
              textAlign: 'left',
              marginTop: '10px'
            }}>
              By signing up you agree to Amoeba's <a href="/TermsofService" style={{ color: role === 'student' ? '#ffc300' : '#1651d4' }}>Terms of Service</a> and <a href="/PrivacyPolicy" style={{ color: role === 'student' ? '#ffc300' : '#1651d4' }}>Privacy Policy</a>
            </p>
          </div>
        </form>

        {/* Error Message */}
        {error && <p style={{ color: 'red', marginTop: '20px', fontFamily: "'montserrat', sans-serif", fontSize: '16px', textAlign: 'center' }}>{error}</p>}
        </GlassContainer>
      </div>

      {/* Success Popup */}
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
            padding: '40px',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <h2 style={{ 
              fontFamily: "'montserrat', sans-serif", 
              marginBottom: '20px' 
            }}>
              Account Creation Successful
            </h2>
            <button onClick={handlePopupClose} style={{
              padding: '10px 20px',
              backgroundColor: '#2AD00E',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontFamily: "'montserrat', sans-serif",
              fontSize: '16px'
            }}>
              Go to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignUp;
