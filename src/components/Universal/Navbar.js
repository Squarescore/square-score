import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import { auth, db } from "./firebase";
import { signOut } from "firebase/auth";
import emailjs from 'emailjs-com';
import { motion, AnimatePresence } from "framer-motion";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import {
  Grid,
  Home,
  BookOpenText,
  Users,
  Plus,
  ChevronDown,
  MessageSquare,
  Clapperboard,
  LayoutGrid,
  BookOpen,
  BookOpenCheck,
  CalendarClock,
  CalendarX2,
  Link as LinkIcon,
  Check,
  DoorOpen,
  SendHorizonal,
  SquareX,
  Settings,
  X,
} from "lucide-react";
import TeacherAssignmentHome from "../Teachers/TeacherAssignments/TeacherAssignmentHome";
import Tutorials from "../Teachers/TeacherHome/Tutorials";
import { GlassContainer } from "../../styles";

const Navbar = ({ userType }) => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const timeoutRef = useRef(null);
  const tawkToScriptRef = useRef(null);

  // Function to initialize tawk.to
  const initializeTawkTo = () => {
    try {
      if (typeof window !== 'undefined') {
        // Remove any existing tawk.to elements first
        const existingScript = document.querySelector('script[src*="tawk.to"]');
        if (existingScript) {
          existingScript.remove();
        }
        const existingWrapper = document.getElementById('tawkchat-container');
        if (existingWrapper) {
          existingWrapper.remove();
        }

        // Reset Tawk_API
        window.Tawk_API = undefined;
        
        // Create and inject the new script
        var s1 = document.createElement("script");
        s1.async = true;
        s1.src = 'https://embed.tawk.to/65a0d5688d261e1b5f5243c7/1hk2c5o9l';
        s1.charset = 'UTF-8';
        s1.setAttribute('crossorigin', '*');
        
        s1.onload = function() {
          // Optional: Configure Tawk_API after script loads
          if (window.Tawk_API) {
            window.Tawk_API.onLoad = function() {
              window.Tawk_API.setAttributes({
                userType: 'teacher'
              }, function(error) {});
            };
          }
        };

        document.head.appendChild(s1);
        tawkToScriptRef.current = s1;
      }
    } catch (error) {
      console.error('Error initializing tawk.to:', error);
    }
  };

  // Function to remove tawk.to
  const removeTawkTo = () => {
    try {
      // Remove script
      if (tawkToScriptRef.current) {
        tawkToScriptRef.current.remove();
      }
      
      // Remove any existing script tags
      const existingScript = document.querySelector('script[src*="tawk.to"]');
      if (existingScript) {
        existingScript.remove();
      }

      // Remove the widget iframe and container
      const tawkToWrapper = document.getElementById('tawkchat-container');
      if (tawkToWrapper) {
        tawkToWrapper.remove();
      }
      
      // Clean up global variables
      if (window.Tawk_API) {
        if (typeof window.Tawk_API.hideWidget === 'function') {
          window.Tawk_API.hideWidget();
        }
        window.Tawk_API = undefined;
      }
      if (window.Tawk_LoadStart) {
        window.Tawk_LoadStart = undefined;
      }
    } catch (error) {
      console.error('Error removing tawk.to:', error);
    }
  };

  // Handle tawk.to visibility based on userType
  useEffect(() => {
    const setupTawkTo = async () => {
      if (userType === 'teacher') {
        // Small delay to ensure proper initialization
        await new Promise(resolve => setTimeout(resolve, 100));
        initializeTawkTo();
      } else {
        removeTawkTo();
      }
    };

    setupTawkTo();

    return () => {
      removeTawkTo();
    };
  }, [userType]);

  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userFullName, setUserFullName] = useState("");
  const [currentClass, setCurrentClass] = useState("");
  
  const [currentClassChoice, setCurrentClassChoice] = useState("");
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTutorialsModalOpen, setIsTutorialsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState({ from_name: '', reply_to: '', message: '' });
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null);

  // Animation Variants for Dropdown
  const dropdownVariants = {
    hidden: {
      height: 0,
      opacity: 0,
      transition: {
        height: { duration: 0.3 },
        opacity: { delay: 0.9, duration: 0.3 },
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
    visible: {
      height: "auto",
      opacity: 1,
      transition: {
        height: { delay: 0, duration: 0.3 },
        opacity: { duration: 0.1 },
      },
    },
  };

  const classItemVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, transition: { duration: 0.01 } },
  };

  // Determine the current active page
 

  // Extract classId from URL if not in params
  const getClassIdFromUrl = () => {
    const path = location.pathname;
    // Updated regex to handle the full path
    const matches = path.match(/\/(class|studentassignments)\/([^/]+)/);
    const extractedId = matches ? matches[2] : null;
    console.log('Current path:', path);
    console.log('Extracted classId:', extractedId);
    return extractedId;
  };

  const currentClassId = classId || getClassIdFromUrl();
  
  // Debug logging
  useEffect(() => {
    console.log('Current classId:', currentClassId);
    console.log('Available classes:', classes);
    if (currentClassId && classes.length > 0) {
      const currentClassData = classes.find(cls => cls.classId === currentClassId);
      console.log('Found class data:', currentClassData);
    }
  }, [currentClassId, classes]);

  // Initial class data fetch
  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser?.uid) return;
      
      setIsLoading(true);
      try {
        if (userType === "teacher") {
          const teacherRef = doc(db, 'teachers', auth.currentUser.uid);
          const teacherDoc = await getDoc(teacherRef);
          
          if (teacherDoc.exists()) {
            const teacherData = teacherDoc.data();
            const classesArray = teacherData.classes || [];
            setClasses(classesArray);

            // Find current class using currentClassId
            if (currentClassId) {
              const currentClassData = classesArray.find(cls => cls.classId === currentClassId);
              if (currentClassData) {
                setCurrentClass(`Period ${currentClassData.period}`);
                setCurrentClassChoice(currentClassData.classChoice);
              }
            }
          }
        } else {
          // Student data fetch
          const studentRef = doc(db, 'students', auth.currentUser.uid);
          const studentDoc = await getDoc(studentRef);
          
          if (studentDoc.exists()) {
            const studentData = studentDoc.data();
            const classesArray = studentData.classes || [];
            console.log('Fetched student classes:', classesArray);
            setClasses(classesArray);

            // Find current class using currentClassId
            if (currentClassId) {
              const currentClassData = classesArray.find(cls => cls.classId === currentClassId);
              console.log('Found current class data:', currentClassData);
              if (currentClassData) {
                setCurrentClass(`Period ${currentClassData.period}`);
                setCurrentClassChoice(currentClassData.classChoice);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
      setIsLoading(false);
    };

    fetchUserData();
  }, [userType, currentClassId]); // Updated dependency

  // Update current class when URL changes
// Update the useEffect that sets currentClassChoice
useEffect(() => {
  const newClassId = getClassIdFromUrl();
  if (newClassId && classes.length > 0) {
    const currentClassData = classes.find(cls => {
      // Remove any trailing '/active' from classId if present
      const cleanClassId = cls.classId.replace('/active', '');
      return cleanClassId === newClassId;
    });
    
    if (currentClassData) {
      setCurrentClass(`Period ${currentClassData.period}`);
      setCurrentClassChoice(currentClassData.classChoice); // Make sure this is being set
      console.log('Setting currentClassChoice to:', currentClassData.classChoice); // Debug log
    }
  }
}, [location.pathname, classes]);

  // Handle class change
  const handleClassChange = (newClassId, e) => {
    e.stopPropagation();
    if (newClassId !== currentClassId) {
      if (userType === "teacher") {
        const currentPath = location.pathname;
        const isParticipantsPage = currentPath.includes('/participants');
        const isClassHomePage = currentPath === `/class/${currentClassId}`;
        
        if (isParticipantsPage || isClassHomePage) {
          const newPath = currentPath.replace(currentClassId, newClassId);
          navigate(newPath);
        } else {
          navigate(`/class/${newClassId}`);
        }
      } else {
        // For students, always navigate to the main assignments page
        // Remove any trailing '/active' from the newClassId
        const cleanClassId = newClassId.replace('/active', '');
        navigate(`/studentassignments/${cleanClassId}/active`);
      }
      setShowClassDropdown(false);
    }
  };

  // Toggle class dropdown
  const toggleClassDropdown = (e) => {
    if (e) e.preventDefault();
    setShowClassDropdown((prev) => !prev);
  };

  // Update teacherLinkRoutes object
  const teacherLinkRoutes = {
    Create: `/class/${currentClassId}/teacherassignmenthome`,
    Assessments: `/class/${currentClassId}/`,
    Students: `/class/${currentClassId}/participants`,
    Settings: `/class/${currentClassId}/teacherSettings`,
    Home: "/home",
  };

  const studentLinkRoutes = {
    Active: `/studentassignments/${currentClassId}/active`,
    Grades: `/studentassignments/${currentClassId}/completed`,
    Home: "/home",
  };

  // Define linkRoutes based on userType
  const linkRoutes = userType === "teacher" ? teacherLinkRoutes : studentLinkRoutes;

  // Optionally replace :classId in routes if needed
  Object.keys(linkRoutes).forEach((key) => {
    linkRoutes[key] = linkRoutes[key].replace(":classId", currentClassId);
  });

  // Fetch user full name
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const uid = auth.currentUser.uid;
        const userDoc = await getDoc(
          doc(db, userType === "teacher" ? "teachers" : "students", uid)
        );
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserFullName(`${userData.firstName} ${userData.lastName}`);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [userType]);

  // Toggle user dropdown
  const toggleDropdown = () => {
    setShowDropdown((prev) => !prev);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Define link colors with new scheme
  const linkColors = {
    Assessments: "#E441FF", // Pink
    Setting: 'grey',
    Assignments: "#E441FF", // Pink
    Students: "#ffc300", // Green
    Create: "#29c60f", // Yellow
    Home: "#29c60f", // Green
    Active: "#29c60f", // Green
    Grades: "#E441FF", // Pink
  };

  // Define variants for GlassContainer
  const linkVariants = {
    Assessments: "pink",
    Assignments: "pink",
    Students: "yellow",
    Settings: 'grey',
    Create: "green",
    Home: "green",
    Active: "green",
    Grades: "pink",
  };

  const getCurrentPage = () => {
    const path = location.pathname;
    if (userType === "student") {
      if (path.includes("/active")) return "Active";
      if (path.includes("/completed") || path.includes("/studentresults")) return "Grades";
      if (path.includes("/upcoming")) return "Upcoming";
      if (path.includes("/overdue")) return "Overdue";
      if (path === `/studentassignments/${currentClassId}`) return "Assessments";
    } else {
      if (path.includes("/teacherassignmenthome")) return "Create";
      if (path === `/class/${currentClassId}/`) return "Assessments";
      if (path.includes("/createassignment") || path.includes("/MCQ") || path.includes("/MCQA"))
        return "Create";
      if (path.includes("/TeacherResults") || path.includes("/teacherStudentResults") || path.includes("/Assessments"))
        return "Assessments";
      if (path.includes("/participants")) return "Students";
      if (path.includes("/grades")) return "Students";
      if (path.includes("/teacherSettings")) return "Settings";
    }
    if (path === "/teacherhome") return "Home";
    return "";
  };

  // Cache the current page to prevent flicker during navigation
  const [cachedPage, setCachedPage] = useState(getCurrentPage());

  // Update cached page when route changes
  useEffect(() => {
    const newPage = getCurrentPage();
    if (newPage !== cachedPage) {
      setCachedPage(newPage);
    }
  }, [location.pathname]);

  const renderNavigationLinks = () => {
    return Object.entries(linkRoutes)
      .filter(([linkText]) => linkText !== 'Home')
      .map(([linkText, route], index) => {
        const isActive = cachedPage === linkText;
        
        // Get appropriate icon based on link text and user type
        const getIcon = () => {
          if (userType === "student") {
            switch(linkText) {
              case "Active": return BookOpen;
              case "Grades": return BookOpenCheck;
              case "Assessments": return BookOpen;
              case "Settings" : return Settings;
              default: return LayoutGrid;
            }
          } else {
            switch(linkText) {
              case "Assessments": return BookOpen;
              case "Assignments": return BookOpenText;
              case "Students": return Users;
              case "Create": return Plus;
              
              case "Settings" : return Settings;
              default: return LayoutGrid;
            }
          }
        };

        const Icon = getIcon();

        const handleNavigation = (e) => {
          e.preventDefault();
          setCachedPage(linkText); // Update cached page immediately
          navigate(route); // Then navigate
        };
        
        return isActive ? (
          <GlassContainer
          enableRotation={true}
            key={index}
            variant={linkVariants[linkText]}
            size={2}
            style={{
              width: '160px',
              marginBottom: '25px',
              cursor: 'pointer',
            }}
            contentStyle={{
              padding: '2px 15px',
              margin: '0',
              fontFamily: "'Montserrat', sans-serif",
              fontSize: '16px',
              fontWeight: "500",
              
              color: linkColors[linkText],
              height: '30px',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Link
              to={route}
              onClick={handleNavigation}
              style={{
                display: "flex",
                alignItems: "center",
                textDecoration: "none",
                color: "inherit",
                width: "100%",
              }}
            >
              <div style={{ marginRight: "10px",marginTop: '4px' }}>
                <Icon
                  size={20}
                  strokeWidth={1.5}
                  color={linkColors[linkText]}
                />
              </div>
              <div style={{
                fontFamily: "'montserrat', sans-serif",
                fontWeight: "400",
                fontSize: '1rem',
              }}>
                {linkText}
              </div>
            </Link>
          </GlassContainer>
        ) : (
          <Link
            key={index}
            to={route}
            onClick={handleNavigation}
            style={{
              display: "flex",
              alignItems: "center",
              position: 'relative',
              padding: "0px 15px",
              height: '31px',
              width: "160px",
              textDecoration: "none",
              color: "#A1A1A1",
              marginBottom: "25px",
              transition: "color 0.3s",
              cursor: "pointer",
            }}
          >
            <div style={{ marginRight: "10px", marginTop: '4px' }}>
              <Icon
                size={20}
                strokeWidth={1.5}
                color="#A1A1A1"
              />
            </div>
            <span style={{
              fontFamily: "'montserrat', sans-serif",
              fontWeight: "400",
              fontSize: '16px',
            }}>
              {linkText}
            </span>
          </Link>
        );
      });
  };


  // Define period styles
  const periodStyles = {
    1: { variant: 'teal', color: "#1EC8bc", borderColor: "#83E2F5" },
    2: { variant: 'purple', color: "#8324e1", borderColor: "#cf9eff" },
    3: { variant: 'orange', color: "#ff8800", borderColor: "#f1ab5a" },
    4: { variant: 'yellow', color: "#ffc300", borderColor: "#Ecca5a" },
    5: { variant: 'green', color: "#29c60f", borderColor: "#aef2a3" },
    6: { variant: 'blue', color: "#1651d4", borderColor: "#b5ccff" },
    7: { variant: 'pink', color: "#d138e9", borderColor: "#f198ff" },
    8: { variant: 'red', color: "#c63e3e", borderColor: "#ffa3a3" },
  };
  const getOrdinalSuffix = (num) => {
    const number = parseInt(num);
    if (number === 1) return "st";
    if (number === 2) return "nd";
    if (number === 3) return "rd";
    return "th";
  };
  // Get period number from class data
  const getPeriodNumber = (classId) => {
    if (!classId) return null;
    const currentClass = classes.find(cls => {
      // Remove any trailing '/active' from classId if present
      const cleanClassId = cls.classId.replace('/active', '');
      return cleanClassId === classId;
    });
    return currentClass?.period || null;
  };

  // Define home route
  const homeRoute = "/";
  const periodNumber = getPeriodNumber(currentClassId);
  const periodStyle = periodStyles[periodNumber] || {
    background: "#F4F4F4",
    color: "grey",
    borderColor: "grey",
  };
const handleCopyLink = async (classData) => {
  const baseUrl = 'https://amoeba-education.web.app/signup';
  const encodedClassName = encodeURIComponent(`Period ${classData.period}`);
  
  // Get classChoice from multiple sources
  const classChoice = currentClassChoice || classData.classChoice || classData.className || '';
  console.log('Using classChoice:', classChoice); // Debug log
  
  const encodedClassChoice = encodeURIComponent(classChoice);
  const signupUrl = `${baseUrl}/${classData.classCode}+${encodedClassName}+${encodedClassChoice}`;

  console.log('Generated signup URL:', signupUrl); // Debug log

  try {
    await navigator.clipboard.writeText(signupUrl);
    setShowCopySuccess(true);
    setTimeout(() => setShowCopySuccess(false), 1000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

  // Feedback modal handlers
  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFeedback({ from_name: '', reply_to: '', message: '' });
    setSendStatus(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFeedback((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSending(true);

    const service_id = 'service_t17hzxi';
    const template_id = 'template_nnojgxd';
    const user_id = 'GvU568KbWouvXYWUh';

    emailjs.send(service_id, template_id, feedback, user_id)
      .then((response) => {
        console.log('SUCCESS!', response.status, response.text);
        setSendStatus('success');
        setIsSending(false);
      })
      .catch((err) => {
        console.error('FAILED...', err);
        setSendStatus('error');
        setIsSending(false);
      });
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Navbar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0, // Ensure it's fixed to the left
          width: "200px", // Increased width for better spacing
          display: "flex",
          flexDirection: "column", // Arrange links vertically
          alignItems: "flex-start",
          height: "100%",
          color: "grey",
          zIndex: "1000",
          
          borderRight: '1px solid #ddd',
          transition: "background-color 0.3s ease",
          backdropFilter: "blur(7px)",
          paddingTop: "20px",  // Scroll if content overflows
        }}
      >
        {/* Logo */}
      

        {/* Class Selector */}
        <div style={{ width: "100%", padding: "10px 10px", height: '80px', marginBottom: "20px" , }}>
          <GlassContainer
            size={0}
            onClick={toggleClassDropdown}
            
          enableRotation={true}
            variant={periodStyle.variant || 'clear'}
            style={{
              width: 'auto',
              borderRadius: '5px',
              marginBottom: '15px',
              marginTop: '-10px',
              position: "relative",
              marginLeft: '10px',
            }}
            contentStyle={{
              display: 'flex',
              alignItems: 'baseline',
              width: '150px',
              padding: '10px .5rem',
              height: '20px'
            }}
          >
            <div style={{
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              borderRadius: "5px",
              position: "relative",
            }}>
              <div style={{display: 'flex'}}>
                <span style={{
                  fontFamily: "'montserrat', sans-serif",
                  fontWeight: "500",
                  color: periodStyle.color,
                  fontSize: '25px',
                  userSelect: 'none',
                  marginTop: '-5px',
                  marginLeft: '10px',
                }}>
                  Period {periodNumber}
                </span>
              </div>
            </div>
            <motion.div
              animate={{ rotate: showClassDropdown ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'absolute',
                right: '1rem',
                top: '.7rem',
                height: '18px',
                cursor: 'pointer'
              }}
            >
              <ChevronDown size={20} style={{ color: periodStyle.color }} />
            </motion.div>
          </GlassContainer>

          {/* Join Code Display */}
          {classes.find(cls => cls.classId === currentClassId)?.classCode && (
            <div style={{
              padding: '10px 10px',
              marginLeft: '0px',
              marginTop: '-15px',
              marginBottom: '10px',
              display: 'flex',
              gap: '5px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{
                  fontFamily: "'montserrat', sans-serif",
                  fontWeight: "400",
                  fontSize: '12px',
                  color: 'grey',
                }}>
                  Class Code:
                </span>
                <span style={{
                fontFamily: "'montserrat', sans-serif",
                fontWeight: "500",
                marginLeft: '5px',
                fontSize: '12px',
                color: periodStyle.color || '#666',
                letterSpacing: '1px'
              }}>
                {classes.find(cls => cls.classId === currentClassId)?.classCode}
              </span>
                <button 
                  onClick={() => {
                    const classData = classes.find(cls => cls.classId === currentClassId);
                    if (classData) {
                      handleCopyLink(classData);
                    }
                  }}
                  style={{ 
                    background: 'transparent', 
                    color: periodStyle.color || '#666', 
                    border: 'none', 
                    cursor: 'pointer',
                    position: 'relative',
                    display: 'flex',
                    marginLeft: '5px',
                    alignItems: 'center',
                    padding: 0
                  }}
                >
                  {showCopySuccess ? (
                    <Check size={12} strokeWidth={2.5} />
                  ) : (
                    <LinkIcon size={12} strokeWidth={2.5} />
                  )}
                  {showCopySuccess && (
                    <div style={{
                      position: 'absolute',
                      top: '0px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: periodStyle.color || '#666',
                      color: 'white',
                      padding: '4px 8px',
                      fontFamily: "'montserrat', sans-serif",
                      zIndex: ' 100',
                      borderRadius: '20px',
                      fontSize: '12px',
                      whiteSpace: 'nowrap'
                    }}>
                      Link copied!
                    </div>
                  )}
                </button>
              </div>
          
            </div>
          )}

          {/* Dropdown Menu for Classes */}
          <AnimatePresence>
            {showClassDropdown && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.1 }}
                style={{
                  position: 'absolute',
                  userSelect: 'none',
                  width: '190px',
                  backgroundColor: "#ffffff",
                  borderRadius: "5px",
                  height: '800px',
                  marginTop: userType === "student" ? "-15px" : "-35px",
                  zIndex: 1000,
                }}
              >
                {classes
                  .filter((cls) => {
                    // Remove any trailing '/active' from classIds for comparison
                    const cleanCurrentClassId = currentClassId?.replace('/active', '');
                    const cleanClassId = cls.classId?.replace('/active', '');
                    return cleanClassId !== cleanCurrentClassId;
                  })
                  .sort((a, b) => {
                    // Safe sorting by period number
                    const periodA = a?.period || 0;
                    const periodB = b?.period || 0;
                    return periodA - periodB;
                  })
                  .map((cls, index) => {
                    const periodNumber = cls.period;
                    const periodStyle = periodStyles[periodNumber] || { background: '#fff', color: 'grey' };
                    const suffix = getOrdinalSuffix(periodNumber);
                    return (
                      <div
                        key={cls.classId}
                        onClick={(e) => handleClassChange(cls.classId, e)}
                        style={{
                          padding: "10px 10px",
                          cursor: "pointer",
                          marginTop: '0px',  
                          display: "flex",
                          alignItems: "center",
                          borderTop:
                            index !== 0
                              ? "1px solid #eee"
                              : "none",
                        }}
                      >
                        <GlassContainer
                          size={0}
                          
          enableRotation={true}
                          variant={periodStyle.variant || 'clear'}
                          style={{
                            width: '120px',
                            borderRadius: '5px',
                          }}
                          contentStyle={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '25px',
                            padding: ' .3rem 0px'
                          }}
                        >
                       

                        <span style={{
                          fontSize: '20px',
                          color: periodStyle.color,
                          margin: 0,
                          fontWeight: '500',
                        }}>
                          Period    {periodNumber}
                          
                        </span>
                        
                        </GlassContainer>
                      </div>
                    );
                  })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
<div style={{width: '90%', background: '#fff', height: '1px',marginLeft: 'auto', marginRight: 'auto', marginTop: '-30px'}}/>
        {/* Navigation Links */}
        <div
  style={{
    display: "flex",
    flexDirection: "column",
    width: "100%",
    alignItems: "flex-start",
    marginTop: '20px',
    paddingLeft: "20px",
  }}
>
{renderNavigationLinks()}
</div>

{/* Spacer */}

{/* Bottom Navigation Section */}
<div
  style={{
 width: "170px",
          padding: "15px", // Reduced padding
         
          display: "flex",
          marginTop: 'auto',
          marginBottom: '20px',
          flexDirection: "column",
          gap: "5px" // Reduced gap
  }}
>
  {/* Home Link */}
  <Link
    to={homeRoute}
   style={{
    display: "flex",
              alignItems: "center",
              textDecoration: "none",
              padding: "8px 12px",
              color: "grey",
              transition: "color 0.2s",
              borderRadius: "50px",
              border: "1px solid transparent",
              fontSize: "0.85rem",
              fontFamily: "'montserrat', sans-serif",
              fontWeight: "400"
    }}
       onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ddd'}
    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
  >
    <Home
      size={16}
      strokeWidth={1.5}
      color={getCurrentPage() === "Home" ? linkColors["Home"] : "grey"}
      style={{marginRight: '8px'}}
    />
    Home
  </Link>

  {/* Divider Line */}
  <div 
    style={{
      width: "205px",
      margin: "10px -20px",
      borderTop: "1px solid #f4f4f4"
    }}
  />

  {/* Tutorials Link */}
  <button
    onClick={() => setIsTutorialsModalOpen(true)}
    style={{
      display: "flex",
      alignItems: "center",
      textDecoration: "none",
      padding: "8px 12px",
      color: "grey",
      transition: "color 0.2s",
      borderRadius: "50px",
      border: "1px solid transparent",
      fontSize: "0.85rem",
      fontFamily: "'montserrat', sans-serif",
      fontWeight: "400",
      background: "transparent",
      cursor: "pointer"
    }}
    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ddd'}
    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
  >
    <Clapperboard size={16} strokeWidth={1.5} color="grey" style={{marginRight: '8px'}} />
    Tutorials
  </button>

  {/* Feedback Link */}
  <Link
    to="/feedback"
    onClick={(e) => {
      e.preventDefault();
      openModal();
    }}
    style={{
    display: "flex",
              alignItems: "center",
              textDecoration: "none",
              padding: "8px 12px",
              color: "grey",
              transition: "color 0.2s",
              borderRadius: "50px",
              border: "1px solid transparent",
              fontSize: "0.85rem",
              fontFamily: "'montserrat', sans-serif",
              fontWeight: "400"
    }}
       onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ddd'}
    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
  >
    <MessageSquare size={16} strokeWidth={1.5} color="grey" style={{marginRight: '8px'}} />
    Feedback
  </Link>

  {/* Sign Out Button */}
  <button
    onClick={handleLogout}
    style={{
      display: "flex",
      alignItems: "center",
      padding: "8px 12px",
      backgroundColor: "transparent",
      border: "1px solid transparent",
      borderRadius: "50px",
      cursor: "pointer",
      color: "grey",
      fontSize: "0.85rem",
      fontFamily: "'montserrat', sans-serif",
      fontWeight: "400",
      transition: "background-color 0.2s",
      width: "170px"
    }}
    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ddd'}
    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
  >
    <DoorOpen size={16} strokeWidth={1.5} color="grey" style={{marginRight: '8px'}} />
    Sign Out
  </button>
</div>

  
      </div>

      {/* Create Dropdown Modal */}
      <AnimatePresence>
        {showCreateDropdown && (
          <TeacherAssignmentHome onClose={() => setShowCreateDropdown(false)} />
        )}
      </AnimatePresence>

      {/* Feedback Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <GlassContainer
            variant="clear"
            size={0}
            style={{
              position: 'relative',
            }}
            contentStyle={{
              padding: '30px',
            }}
          >
            
            <h2 style={{ 
              fontSize: '1.5rem',
              fontWeight: '400',
              color: 'black',
              marginTop:'0px',
              marginBottom: '20px',
              fontFamily: "'montserrat', sans-serif",
            }}>Send Feedback</h2>

            <form onSubmit={handleSubmit}>
              {/* Name Input */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                marginBottom: '0px',
                height: '40px'
              }}>
                <label 
                  htmlFor="from_name" 
                  style={{ 
                    width: '100px',
                    fontSize: '1rem',
                    color: 'grey',
                    fontWeight: '500',
                    fontFamily: "'montserrat', sans-serif",
                  }}
                >
                  Name
                </label>
                <input
                  type="text"
                  id="from_name"
                  name="from_name"
                  value={feedback.from_name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your name"
                  style={{
                    flex: 1,
                    padding: '5px 15px',
                    fontFamily: "'montserrat', sans-serif",
                    fontSize: '0.8rem',
                    borderRadius: '25px',
                    border: '1px solid #ddd',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Email Input */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                marginBottom: '20px',
                height: '40px'
              }}>
                <label 
                  htmlFor="reply_to" 
                  style={{ 
                    width: '100px',
                    fontSize: '1rem',
                    color: 'grey',
                    fontWeight: '500',
                    fontFamily: "'montserrat', sans-serif",
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  id="reply_to"
                  name="reply_to"
                  value={feedback.reply_to}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email"
                  style={{
                       padding: '5px 15px',
                    fontFamily: "'montserrat', sans-serif",
                    fontSize: '0.8rem',
                    borderRadius: '25px',
                    border: '1px solid #ddd',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Message Input */}
              <div style={{ 
                display: 'flex', 
                marginBottom: '30px',
              }}>
               
                <textarea
                  id="message"
                  name="message"
                  value={feedback.message}
                  onChange={handleChange}
                  required
                  rows="4"
                  placeholder="Enter your feedback"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontFamily: "'montserrat', sans-serif",
                    fontSize: '0.85rem',
                    borderRadius: '15px',
                    border: '1px solid #ddd',
                    outline: 'none',
                    resize: 'vertical',
                    minHeight: '100px'
                  }}
                />
              </div>

              {/* Buttons Container */}
              <div style={{
                display: 'flex',
                gap: '10px',
                height: '30px',
                marginTop: '20px'
              }}>
                <button
                
                  onClick={closeModal}
                  style={{padding: '8px 20px',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    fontFamily: "'montserrat', sans-serif",
                    color: 'grey',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '35px',
                    cursor: 'pointer',
                  }}>
               
                  Cancel
                </button>
<div>
                <GlassContainer
                  variant={
                    feedback.from_name && 
                    feedback.reply_to && 
                    feedback.message ? 'green' : 'clear'
                  }
                  size={0}
                  type="submit"
                  disabled={isSending}
                  style={{
                    cursor: 'pointer',
                  }}
                  
                  contentStyle={{
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    height:'28px',
                    width: '100px',
                    fontFamily: "'montserrat', sans-serif",
                    color: feedback.from_name && feedback.reply_to && feedback.message ? 'green' : 'grey',
                    display: 'flex',
                    alignItems: 'center',
                  
                  }}
                >
                  <div style={{display: 'flex', gap: '10px', marginTop: '-6px',
                    alignItems: 'center',}}>
                    <p>
                  {isSending ? 'Sending...' : 'Send'}   </p> 
                  <SendHorizonal size={16} />
              </div> 
                </GlassContainer>
                </div>
              </div>
            </form>

            {sendStatus === 'success' && (
              <p style={{ 
                color: 'green', 
                marginTop: '15px',
                fontSize: '0.85rem',
                fontFamily: "'montserrat', sans-serif",
              }}>
                Feedback sent successfully!
              </p>
            )}
            {sendStatus === 'error' && (
              <p style={{ 
                color: 'red', 
                marginTop: '15px',
                fontSize: '0.85rem',
                fontFamily: "'montserrat', sans-serif",
              }}>
                Failed to send feedback. Please try again.
              </p>
            )}
          </GlassContainer>
        </div>
      )}

      {/* Tutorials Modal */}
      {isTutorialsModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(250, 250, 250, 0.95)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >

<div   style={{
              width: '90vw',
              maxWidth: '1050px',
              maxHeight: '85vh',
           
            }}> 
          <GlassContainer
            variant="clear"
            size={2}
          
            contentStyle={{
              padding: '20px 30px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingRight: '10px'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '1.5rem',
                fontWeight: '400',
                color: 'black',
                fontFamily: "'Montserrat', sans-serif"
              }}>
                Tutorials
              </h2>
              <button
                onClick={() => setIsTutorialsModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '5px',
                  marginRight: '-10px'
                }}
              >
                <X size={24} color="grey" />
              </button>
            </div>

            {/* Tutorial Content */}
      <div style={{   overflowY: 'auto',
              msOverflowStyle: 'none',  /* IE and Edge */
              scrollbarWidth: 'none',  /* Firefox */
              '&::-webkit-scrollbar': {
                display: 'none'  /* Chrome, Safari and Opera */
              }}}>
              <Tutorials />
              </div>
          </GlassContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
