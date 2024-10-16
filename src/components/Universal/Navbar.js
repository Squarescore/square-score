import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc, collection, query, where, getDocs, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { ArrowLeft, SquarePlus, Users, BookOpenText, SquareX, Home, Repeat } from "lucide-react";
import TeacherAssignmentHome from "../Teachers/TeacherAssignments/TeacherAssignmentHome";
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

const Navbar = ({ userType, currentPage, firstName, lastName }) => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const timeoutRef = useRef(null);

  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userInitials, setUserInitials] = useState("");
  const [currentClass, setCurrentClass] = useState('');
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [classes, setClasses] = useState([]);
  const [navbarBg, setNavbarBg] = useState('rgba(255,255,255,0.7)');
  const [classChoice, setClassChoice] = useState('');
  const [isClassNameLoaded, setIsClassNameLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Animation Variants for Dropdown
  const dropdownVariants = {
    hidden: {
      height: 0,
      opacity: 0,
      transition: {
        height: {
          duration: 0.3,
        },
        opacity: {
          delay: 0.9,
          duration: 0.3,
        },
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
      
    },
    visible: {
      height: 'auto',
      opacity: 1,
      transition: {
        height: {
          delay: 0,
          duration: 0.3,
        },
        opacity: {
          duration: 0.1,
        },
      },
    },
  };
  
  const classItemVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, transition: { duration: 0.01 } },
  };
  // Function to get the current page
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path.includes('/teacherassignmenthome')) return 'Assignments';
    
    if (path === `/class/${classId}`) return 'Home';
    if (path.includes('/createassignment')) return 'Create';
    if (path.includes('/MCQ')) return 'Create';
    if (path.includes('/TeacherResults')) return 'Assignments';
    if (path.includes('/TeacherStudentResults')) return 'Assignments';
    if (path.includes('/MCQA')) return 'Create';
    if (path.includes('/Assignments')) return 'Assignments';
    if (path.includes('/participants')) return 'Students';
  // default to Home for the main class page
  };

  // Function to handle format selection
// Inside the Navbar component

// Update the handleFormatSelect function
const handleFormatSelect = async (format) => {
    setSelectedFormat(format);
    const newAssignmentId = uuidv4();
    const fullNewAssignmentId = `${classId}+${newAssignmentId}+${format}`;
    let navigationPath = '';
  
    switch (format) {
      case 'SAQ':
        navigationPath = `/class/${classId}/createassignment/${fullNewAssignmentId}`;
        break;
      case 'ASAQ':
        navigationPath = `/class/${classId}/SAQA/${fullNewAssignmentId}`;
        break;
      case 'MCQ':
        navigationPath = `/class/${classId}/MCQ/${fullNewAssignmentId}`;
        break;
      case 'AMCQ':
        navigationPath = `/class/${classId}/MCQA/${fullNewAssignmentId}`;
        break;
      default:
        console.error('Invalid format selected');
        return;
    }
  
    navigate(navigationPath, {
      state: {
        assignmentType: format,
        isAdaptive: format === 'ASAQ' || format === 'AMCQ',
        assignmentId: fullNewAssignmentId,
        classId
      }
    });
  
    // Close the create dropdown after selection
    setShowCreateDropdown(false);
  };
  
  // Update the TeacherAssignmentHome component usage
 

  // Fetch classes based on user type and classId
  useEffect(() => {
    const fetchClasses = async () => {
      setIsLoading(true);
      let classQuery;
      if (userType === 'teacher') {
        const teacherUID = auth.currentUser.uid;
        classQuery = query(collection(db, 'classes'), where('teacherUID', '==', teacherUID));
      } else {
        const studentUID = auth.currentUser.uid;
        classQuery = query(collection(db, 'classes'), where('students', 'array-contains', studentUID));
      }

      try {
        const classesSnapshot = await getDocs(classQuery);
        const classesData = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setClasses(classesData);
        const currentClassData = classesData.find(cls => cls.id === classId);

        if (currentClassData) {
          setCurrentClass(currentClassData.className);
          setClassChoice(currentClassData.classChoice);
          setIsClassNameLoaded(true);
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
      setIsLoading(false);
    };

    if (classId) {
      fetchClasses();
    }
  }, [classId, userType]);

  // Handle class change
  const handleClassChange = (newClassId, e) => {
    e.stopPropagation();
    if (newClassId !== classId) {
      let newPath = userType === 'teacher' ? `/class/${newClassId}/` : `/studentassignments/${newClassId}`;
      navigate(newPath);
      setShowClassDropdown(false);
    }
  };

  // Toggle class dropdown
  const toggleClassDropdown = (e) => {
    if (e) e.preventDefault();
    setShowClassDropdown(prev => !prev);
  };
  // Handle scroll to change navbar background
 


  // Handle background hover to close dropdown
  const handleBackgroundHover = () => {
    setShowClassDropdown(false);
  };

  // Activate/Create Dropdown functions (simplified)
  const toggleCreateDropdown = (e) => {
    if (e) e.preventDefault();
    setShowCreateDropdown(prev => !prev);
  };

  const toggleCreateModal = () => {
    toggleCreateDropdown();
  };

  // Define link routes
  const teacherLinkRoutes = {
    
    'Home': `/class/${classId}`,
    'Create': `/class/${classId}/teacherassignmenthome`,
    'Assignments': `/class/${classId}/Assignments`,
    'Students': `/class/${classId}/participants`,
    
  };

  const studentLinkRoutes = {
    'Home': `/studentassignments/${classId}`,
    'Materials': '',
    'Assignments': `/studentassignments/${classId}`,
  };

  // Fetch user initials
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const uid = auth.currentUser.uid;
        const userDoc = await getDoc(doc(db, userType === 'teacher' ? 'teachers' : 'students', uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserInitials(getInitials(userData.firstName, userData.lastName));
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [userType]);

  // Toggle user dropdown
  const toggleDropdown = () => {
    setShowDropdown(prev => !prev);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Get user initials
  const getInitials = (firstName, lastName) => {
    if (!firstName || !lastName) return "";
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  // Replace classId in routes
  const linkRoutes = userType === 'teacher' ? teacherLinkRoutes : studentLinkRoutes;
  Object.keys(linkRoutes).forEach(key => {
    linkRoutes[key] = linkRoutes[key].replace(':classId', classId);
  });

  // Handle back navigation
  const handleBack = () => {
    navigate(-1);
  };
  const linkColors = {
    'Home': '#E441FF',
    'Assignments': '#020CFF',
    'Students': '#FFAE00',
    'Create': '#2BB514'
  };
  const linkBorderColors = {
    'Home': '#F5B6FF',
    'Assignments': '#C7CFFF',
    'Students': '#FFEAAF',
    'Create': '#AEF2A3'
  };

  // Define period styles
  const periodStyles = {
    1: { background: '#A3F2ED', color: '#1CC7BC', borderColor: '#1CC7BC' },
    2: { background: '#F8CFFF', color: '#E01FFF', borderColor: '#E01FFF' },
    3: { background: '#FFCEB2', color: '#FD772C', borderColor: '#FD772C' },
    4: { background: '#FFECA9', color: '#F0BC6E', borderColor: '#F0BC6E' },
    5: { background: '#AEF2A3', color: '#4BD682', borderColor: '#4BD682' },
    6: { background: '#BAA9FF', color: '#8364FF', borderColor: '#8364FF' },
    7: { background: '#8296FF', color: '#3D44EA', borderColor: '#3D44EA' },
    8: { background: '#FF8E8E', color: '#D23F3F', borderColor: '#D23F3F' }
  };

  // Get period number from class name
  const getPeriodNumber = (className) => {
    const match = className.match(/Period (\d)/);
    return match ? parseInt(match[1]) : null;
  };

  // Define home route and icons
  const homeRoute = userType === 'teacher' ? '/teacherhome' : '/studenthome';
  const homeIcon = "/home.svg";
  const logoUrl = "/logo.png";

  return (
    <div style={{ position: 'relative',  }}>
        {showClassDropdown  && <div onMouseEnter={handleBackgroundHover} style={{
                position: 'fixed',
                top: '70px',
                left: '0px',
                width: '100%',
                height: '100%',
                background: 'rgba(255,255,255,.9)',
                backdropFilter: 'blur(5px)',
                zIndex: '1000',
            }} />}
      {/* Overlay for class dropdown */}

     
      <AnimatePresence>
        {showClassDropdown && (
             <motion.div
             initial="hidden"
             animate="visible"
             exit="hidden"
             variants={dropdownVariants}
             style={{
               position: 'fixed',
               top: '70px',
               left: '0',
               width: '100%',
               backgroundColor: 'white',
               boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
               zIndex: 1000,
               display: 'flex',
               justifyContent: 'center',
               overflow: 'hidden',
             }}>
             <div
               style={{
                 display: 'flex',
                 flexWrap: 'wrap',
                 justifyContent: 'flex-start',
                 width: '1200px',
                 marginLeft: 'auto',
                 marginRight: 'auto',
                 paddingBottom: '30px'
               }}
             >
              {classes
                .filter(cls => cls.id !== classId)
                .sort((a, b) => a.className.localeCompare(b.className))
                .map((cls, index) => {
                    const periodNumber = getPeriodNumber(cls.className);
                    const periodStyle = periodStyles[periodNumber] || { background: '#F4F4F4', color: 'grey' };
  
                  return (
                    <motion.div
                    key={cls.id}
                    variants={classItemVariants}
                    initial="hidden"
                    animate="visible"
                       exit="hidden"
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    onClick={e => handleClassChange(cls.id, e)}
                    style={{
                      width: '280px',
                      height: '140px',
                      margin: '15px',
                      marginLeft: '30px',
                      marginRight: '30px',
                      marginBottom: '0px',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    <div
                      key={cls.id}
                      onClick={e => handleClassChange(cls.id, e)}
                      style={{
                        width: '280px',
                        height: '140px',
                        margin: '15px',
                        marginLeft: '30px',
                        marginRight: '30px',
                        marginBottom: '20px',
                        cursor: 'pointer',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          width: '243px',
                          height: '30px',
                          border: `6px solid ${periodStyle.color}`,
                          backgroundColor: periodStyle.background,
                          color: periodStyle.color,
                          borderTopLeftRadius: '15px',
                          borderTopRightRadius: '15px',
                          fontFamily: "'montserrat', sans-serif",
                          fontWeight: 'bold',
                          fontSize: '16px',
                          display: 'flex',
                          paddingLeft: '25px',
                          alignItems: 'center',
                          textAlign: 'left',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {cls.classChoice}
                      </div>
                      <div
                        style={{
                          width: '268px',
                          height: '70px',
                          borderBottomLeftRadius: '15px',
                          borderBottomRightRadius: '15px',
                          backgroundColor: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: "'montserrat', sans-serif",
                          fontWeight: '600',
                          fontSize: '35px',
                          color: 'grey',
                          transition: 'border-color 0.3s',
                          border: '6px solid #F4F4F4',
                          borderTop: 'none',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = '#E8E8E8';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = '#f4f4f4';
                        }}
                      >
                       
                            <h1 style={{fontSize: '30px', marginTop: '20px', width: '250px',  textAlign: 'left', marginLeft: '20px',
                      fontWeight: '600',}}>{cls.className}</h1>
                          
                     
                      </div>
                    </div>
                    </motion.div>
                      );
                    })}
              <div style={{ height: '60px', width: '100%', background: 'white' }}></div>
            </div>
          </motion.div>
          )}
      </AnimatePresence>

      {/* Overlay for create dropdown if needed */}
      {showCreateDropdown && (
        <div
          onClick={toggleCreateDropdown}
          style={{
            position: 'fixed',
            top: '70px',
            left: '0px',
            width: '100%',
            height: '100%',
            background: 'rgba(255,255,255,.9)',
            backdropFilter: 'blur(20px)',
            zIndex: '101',
          }}
        />
      )}

      {/* Navbar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          height: '70px',
          color: 'grey',
          zIndex: '1000',
          backgroundColor: 'rgb(255,255,255,.9)',
          transition: 'background-color 0.3s ease',
          backdropFilter: 'blur(7px)',
          
                borderBottom: '2px solid rgb(220,220,220,.2)'
        }}
      >
        {/* Back Button */}
        <Link to={homeRoute} style={{position: 'absolute', left: '20px'}} >
          <img style={{ width: '40px', }} src="/SquareScore.svg" alt="logo" /> 
          
          </Link>
          <div  style={{
              flex: 0.15,
              display: 'flex',
              alignItems: 'center',
              background: '#ECECEC',
              width: '2px', 
              height: '40px',
              justifyContent: 'center',
              position: 'fixed',
              top: '15px',
              left: '84px',
            }}></div>
        

        {!isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', position: 'fixed',
              top: '20px',
              left: '110px', }}>
          
                <div
                  onClick={toggleClassDropdown}
                  style={{
                    cursor: 'pointer',
                    transform: showClassDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                    userSelect: 'none',
                    marginTop: '5px',
                    marginLeft: '3px',
                    transition: 'transform 0.5s ease',
                   
                    position: 'absolute',
                    right: '0px',
                    height: '6px',
                    width: '20px',
                    fontSize: '13px',
                  }}
                >
                  <Repeat size={20} style={{marginTop: '-7px'}}/>
                </div>
    
              <Link
                to={userType === 'teacher' ? `/class/${classId}` : `/studentassignments/${classId}`}
                style={{
                  fontSize: '25px',
                  width: '130px',
                  textAlign: 'left',
                  paddingRight: '10px',
                  fontFamily: "'montserrat', sans-serif",
                  fontWeight: '600',
                    color: '#868686',
                  textDecoration: 'none',
                  background: 'white',
                 
                }}
              >
                {currentClass || ''}
              </Link>
            </div>
          ) : (
            <div style={{ width: '130px', height: '38px', backgroundColor: 'transparent', borderRadius: '7px' }}></div>
          )}


<div  style={{
              flex: 0.15,
              display: 'flex',
              alignItems: 'center',
              background: '#ECECEC',
              width: '2px', 
              height: '40px',
              justifyContent: 'center',
              position: 'absolute',
              top: '15px',
              right: '70px',
            }}></div>
          <div
            style={{
              flex: 0.15,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'fixed',
              top: '20px',
              right: '-45px',
            }}
          >
            
            <div
              onClick={toggleDropdown}
              style={{
                width: '25px',
                height: '25px',
                borderRadius: '5px',
                backgroundColor: 'transparent',
                border: '4px solid #6A6A6A',
                cursor: 'pointer',
                marginLeft: 'auto',
                marginRight: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6A6A6A',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
             
                <h1
                  style={{
                    fontSize: '14px',
                   userSelect: 'none',
                   fontWeight: '800',
                    fontFamily: '"montserrat", sans-serif',
                    marginTop: '12px',
                   
                  }}
                >
                  {userInitials}
                </h1>
             
              {showDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    marginTop: '130px',
                    right: 25,
                    color: '#020CFF',
                    boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.2)',
                    borderRadius: '5px',
                    minWidth: '150px',
                    zIndex: 1000,
                    background: 'white',
                  }}
                >
                  <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                    <li
                      onClick={handleLogout}
                      style={{
                        padding: '10px 15px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #eee',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '16px',
                        color: 'grey',
                        background: 'white',
                      }}
                    >
                      Logout
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
          
        <div style={{ width: '50%', position: 'absolute', left: '50%',transform: 'translate(-50%)', display: 'flex', alignItems: 'center', border:'0px solid blue' }}>
        

          {/* Class Selector */}
          

    
          {/* Teacher Links */}
          {userType === 'teacher' ? (
              <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                flex: 0.85,
                fontSize: '15px',
                fontFamily: "'montserrat', sans-serif",
                textDecoration: 'none',
                marginTop: '10px',
                marginLeft: '100px',
              }}
            >
                 {Object.entries(linkRoutes).map(([linkText, route], index) => (
              <div key={index} style={{ position: 'relative' }}>
                <Link
                  to={route}
                  onClick={(e) => linkText === 'Create' && toggleCreateDropdown(e)}
                  style={{
                    textDecoration: 'none',
                    color: 'black',
                    marginTop: '-2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '50px',
                    height: '50px',
                    borderBottom: (getCurrentPage() === linkText || (linkText === 'Create' && showCreateDropdown)) 
                      ? `4px solid ${linkBorderColors[linkText]}` 
                      : 'none',
                    paddingBottom: '10px',
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: '25px',  // Set a fixed width for all icons
                    height: '25px', // Set a fixed height for all icons
                  }}>
                    {linkText === 'Home' && <Home size={25} strokeWidth={getCurrentPage() === 'Home' ? 2.5 : 2} color={getCurrentPage() === 'Home' ? linkColors['Home'] : '#696969'} />}
                    {linkText === 'Assignments' && <BookOpenText size={25} strokeWidth={getCurrentPage() === 'Assignments' ? 2.5 : 2} color={getCurrentPage() === 'Assignments' ? linkColors['Assignments'] : '#696969'} />}
                    {linkText === 'Students' && <Users size={25} strokeWidth={getCurrentPage() === 'Students' ? 2.5 : 2} color={getCurrentPage() === 'Students' ? linkColors['Students'] : '#696969'} />}
                    {linkText === 'Create' && <SquarePlus size={25} strokeWidth={(getCurrentPage() === 'Create' || showCreateDropdown) ? 2.5 : 2} color={(getCurrentPage() === 'Create' || showCreateDropdown) ? linkColors['Create'] : '#696969'} />}
                  </div>
                </Link>
                  {linkText === 'Create' && showCreateDropdown && (
                    <div
                      style={{
                        position: 'fixed',
                        top: '200px',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        zIndex: -1, // Ensure it's above other elements
                        display: 'flex',
                        backdropFilter: 'blur(5px)',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                      }}
                      onClick={toggleCreateDropdown} // Close on clicking outside
                    >
                      <div
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                        style={{
                          position: 'relative',
                          width: '450px',
                          background: 'white',
                          padding: '10px',
                          borderRadius: '20px',
                          height: '240px',
                          marginTop: '50%',
                          border: '10px solid #f4f4f4',
                        }}
                      >
                        <button
                          onClick={toggleCreateModal}
                          style={{
                            position: 'absolute',
                            top: '-15px',
                            right: '20px',
                            width: '30px',
                            height: '30px',
                            background: 'transparent',
                            fontSize: '24px',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ marginTop: '-5px', marginLeft: '-8px' }}>
                            <SquareX size={40} color="#a3a3a3" strokeWidth={3} />
                          </div>
                        </button>
                        <h2
                          style={{
                            fontSize: '30px',
                            padding: '10px 10px 10px 30px',
                            marginBottom: '20px',
                            fontFamily: "'montserrat', sans-serif",
                            textAlign: 'left',
                            color: 'grey',
                            border: '10px solid lightgray',
                            borderRadius: '20px 20px 0px 0px',
                            marginLeft: '-20px',
                            marginRight: '-20px',
                            marginTop: '-50px',
                            background: '#f4f4f4',
                          }}
                        >
                          Select Format
                        </h2>
                        <TeacherAssignmentHome
    onFormatSelect={(format) => {
      handleFormatSelect(format);
      toggleCreateModal();
    }}
  />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Student View
            <div
              style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '30px',
                fontFamily: "'montserrat', sans-serif",
                color: 'grey',
                marginTop: '0px',
                fontWeight: 'bold',
                whiteSpace: 'nowrap', // Prevents text wrapping
                padding: '5px 10px',  // Adds some space inside the div
              }}
            >
              {classChoice}
            </div>
          )}

          {/* User Profile Dropdown */}
        
        </div>
      </div>
      </div>
    );
};

export default Navbar;
