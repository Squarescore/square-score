import { Link } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "./firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useLocation } from 'react-router-dom';
import { ArrowLeft, SquarePlus, Users, BookOpenText } from "lucide-react";
import TeacherAssignmentHomeS from "./TeacherAssignmentHomeS";
import { setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { useRef } from "react";
import { v4 as uuidv4 } from 'uuid';
const Navbar = ({ userType, currentPage, firstName, lastName }) => {
    const { classId } = useParams();
    const navigate = useNavigate();
    const [showCreateDropdown, setShowCreateDropdown] = useState(false);
    const [selectedFormat, setSelectedFormat] = useState(null);
    const location = useLocation();
    const [showDropdown, setShowDropdown] = useState(false);
    const [userInitials, setUserInitials] = useState("");
    const [currentClass, setCurrentClass] = useState('');
    const [showClassDropdown, setShowClassDropdown] = useState(false);
    const [classes, setClasses] = useState([]);
    const [navbarBg, setNavbarBg] = useState('rgba(255,255,255,0.7)');
    const [classChoice, setClassChoice] = useState('');
    const [isClassNameLoaded, setIsClassNameLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isDropdownActive, setIsDropdownActive] = useState(false);
    const timeoutRef = useRef(null);
    const [isCreateDropdownActive, setIsCreateDropdownActive] = useState(false);
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [dropdownVisibleCreate, setDropdownVisibleCreate] = useState(false);
    const getCurrentPage = () => {
        const path = location.pathname;
        if (path.includes('/teacherassignmenthome')) return 'Create';
        if (path.includes('/createassignment')) return 'Create';
        if (path.includes('/MCQ')) return 'Create';
        if (path.includes('/TeacherResults')) return 'Assignments';
        if (path.includes('/TeacherStudentResults')) return 'Assignments';
        if (path.includes('/MCQA')) return 'Create';
        if (path.includes('/Assignments')) return 'Assignments';
        if (path.includes('/participants')) return 'Students';
        return 'Home'; // default to Home for the main class page
    };
    const handleFormatSelect = async (format) => {
        setSelectedFormat(format);
        const newAssignmentId = uuidv4();
        let assignmentId = `${classId}+${newAssignmentId}+${format}`;
        let collectionName = '';
        let classFieldName = '';
        let navigationPath = '';
    
        switch (format) {
          case 'SAQ':
            collectionName = 'assignments(saq)';
            classFieldName = 'assignment(saq)';
            navigationPath = `/class/${classId}/createassignment/${assignmentId}`;
            break;
          case 'ASAQ':
            collectionName = 'assignments(Asaq)';
            classFieldName = 'assignment(Asaq)';
            navigationPath = `/class/${classId}/SAQA/${assignmentId}`;
            break;
          case 'MCQ':
            collectionName = 'assignments(mcq)';
            classFieldName = 'assignment(mcq)';
            navigationPath = `/class/${classId}/MCQ/${assignmentId}`;
            break;
          case 'AMCQ':
            collectionName = 'assignments(Amcq)';
            classFieldName = 'assignment(Amcq)';
            navigationPath = `/class/${classId}/MCQA/${assignmentId}`;
            break;
          default:
            console.error('Invalid format selected');
            return;
        }
    
        const assignmentData = {
          classId,
          assignmentType: format,
          isAdaptive: format === 'ASAQ' || format === 'AMCQ',
          assignmentId
        };
        
        try {
          const assignmentRef = doc(db, collectionName, assignmentId);
          await setDoc(assignmentRef, assignmentData);
        
          const classRef = doc(db, 'classes', classId);
          await updateDoc(classRef, {
            [classFieldName]: arrayUnion(assignmentId)
          });
        
          navigate(navigationPath);
        } catch (error) {
          console.error('Error creating assignment:', error);
          // Handle the error (e.g., show an error message to the user)
        }
      };
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

            const classesSnapshot = await getDocs(classQuery);
            const classesData = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setClasses(classesData);
            const currentClassData = classesData.find(cls => cls.id === classId);

            if (currentClassData) {
                setCurrentClass(currentClassData.className);
                setClassChoice(currentClassData.classChoice);
                setIsClassNameLoaded(true);
            }
            setIsLoading(false);
        };

        if (classId) {
            fetchClasses();
        }
    }, [classId, userType]);

    const handleClassChange = (newClassId, e) => {
        e.stopPropagation();
        if (newClassId !== classId) {
            let newPath = userType === 'teacher' ? `/class/${newClassId}/` : `/studentassignments/${newClassId}`;
            navigate(newPath);
            setShowClassDropdown(false);
        }
    };

    const toggleClassDropdown = (e) => {
        e.stopPropagation();
        setShowClassDropdown(!showClassDropdown);
        setIsDropdownActive(!isDropdownActive);
        setDropdownVisible(!dropdownVisible);
    };

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 0 && !isDropdownActive) {
                setNavbarBg('rgba(250, 250, 250, 0.7)');
            } else if (isDropdownActive) {
                setNavbarBg('rgb(255, 255, 255)');
            } else {
                setNavbarBg('rgba(255, 255, 255, 0.7)');
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [isDropdownActive]);

    const handleBackgroundHover = () => {
        if (isDropdownActive) {
            setDropdownVisible(false);
            setTimeout(() => {
                setShowClassDropdown(false);
                setIsDropdownActive(false);
            }, 300); // Match this duration with your CSS transition duration
        }
    };

    const activateCreateDropdown = () => {
        setShowCreateDropdown(true);
        setIsCreateDropdownActive(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    const deactivateCreateDropdown = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setShowCreateDropdown(false);
            setIsCreateDropdownActive(false);
        }, 1000);
    };

    const handleDropdownHover = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setShowCreateDropdown(true);
        setIsCreateDropdownActive(true);
    };

    const handleDropdownLeave = () => {
        deactivateCreateDropdown();
    };

    const toggleCreateDropdown = (e) => {
        if (e) e.preventDefault();
        if (showCreateDropdown) {
            setShowCreateDropdown(false);
            setIsCreateDropdownActive(false);
        } else {
            activateCreateDropdown();
        }
    };

    const teacherLinkRoutes = {
        'Students': `/class/${classId}/participants`,
        'Assignments': `/class/${classId}/Assignments`,
        'Create': `/class/${classId}/teacherassignmenthome`,
        
    };

    const studentLinkRoutes = {
        'Home': `/studentassignments/${classId}`,
        'Materials': '',
        'Assignments': `/studentassignments/${classId}`,
    };

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

    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const getInitials = (firstName, lastName) => {
        if (!firstName || !lastName) return "";
        return `${firstName[0]}${lastName[0]}`.toUpperCase();
    };

    const linkRoutes = userType === 'teacher' ? teacherLinkRoutes : studentLinkRoutes;
    Object.keys(linkRoutes).forEach(key => {
        linkRoutes[key] = linkRoutes[key].replace(':classId', classId);
    });

    const handleBack = () => {
        navigate(-1);
    };

    const periodStyles = {
        1: { background: '#A3F2ED', color: '#1CC7BC',borderColor: '#1CC7BC' },
        2: { background: '#F8CFFF', color: '#E01FFF',borderColor: '#E01FFF'},
        3: { background: '#FFCEB2', color: '#FD772C',borderColor: '#FD772C' },
        4: { background: '#FFECA9', color: '#F0BC6E',borderColor: '#F0BC6E' },
        5: { background: '#AEF2A3', color: '#4BD682',borderColor: '#4BD682'},
        6: { background: '#BAA9FF', color: '#8364FF',borderColor: '#8364FF' },
        7: { background: '#8296FF', color: '#3D44EA',borderColor: '#3D44EA' },
        8: { background: '#FF8E8E', color: '#D23F3F' ,borderColor: '#D23F3F'}
    };

    const getPeriodNumber = (className) => {
        const match = className.match(/Period (\d)/);
        return match ? parseInt(match[1]) : null;
    };

    const homeRoute = userType === 'teacher' ? '/teacherhome' : '/studenthome';
    const homeIcon = "/home.svg";
    const logoUrl = "/logo.png";

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

    return (
        <div style={{ position: 'relative' }}>
            {isDropdownActive && <div onMouseEnter={handleBackgroundHover} style={{
                position: 'fixed',
                top: '70px',
                left: '0px',
                width: '100%',
                height: '100%',
                background: 'rgba(240,240,240,.3)',
                backdropFilter: 'blur(20px)',
                zIndex: '1000',
            }} />}
               {isCreateDropdownActive && (
                <div 
                    style={{
                        position: 'fixed',
                        top: '70px',
                        left: '0px',
                        width: '100%',
                        height: '100%',
                        background: 'rgba(240,240,240,.3)',
                        backdropFilter: 'blur(20px)',
                        zIndex: '101',
                    }} 
                />
            )}
            <div style={{
                position: 'fixed', top: 0, width: '100%', display: 'flex',
                padding: '0px 0', alignItems: 'center', height: '70px', color: 'grey', zIndex: '1000',
                backgroundColor: navbarBg,
                transition: 'background-color 0.3s ease',
                backdropFilter: 'blur(7px)',
            }}>
                <button
                    onClick={handleBack}
                    style={{ position: 'fixed', top: '12px', left: '0px', fontFamily: "'Radio Canada', sans-serif", textDecoration: 'none', color: 'black', border: '0px solid lightgrey', height: '47px', width: '47px', borderRadius: '10px', backgroundColor: 'transparent', marginLeft: '20px', marginRight: '20px', cursor: 'pointer' }}>
           <ArrowLeft size={30} color="grey" strokeWidth={2.5} />     </button>

                <div style={{ width: '80%', marginLeft: 'auto', marginRight: 'auto', display: 'flex', alignItems: 'center', }}>
                    <Link to={homeRoute}>
                        <img src={homeIcon} alt="Home" style={{ width: '25px', marginTop: '0px', marginRight: '50px', opacity: '50%' }} />
                    </Link>
                    {!isLoading ? (
                        <div style={{ display: 'flex', alignItems: 'center', marginRight: '20px' }}>
                            <div
                                style={{
                                    height: '28px',
                                    width: '20px',
                                    opacity: '50%',
                                    marginRight: '-5px',
                                    borderBottomLeftRadius: '7px',
                                    borderTopLeftRadius: '7px',border: '4px solid',
                                    ...(periodStyles[getPeriodNumber(currentClass)] || periodStyles[1])
                                }}
                            >
                                <div
                                    onClick={toggleClassDropdown}
                                    style={{
                                        cursor: 'pointer',
                                        transform: showClassDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                                        userSelect: 'none',
                                        marginTop: '5px',
                                        marginLeft: '2px',
                                        transition: 'transform .5s ease',
                                        width: '15px', height: '15px',
                                        ...(periodStyles[getPeriodNumber(currentClass)] || periodStyles[1])
                                    }}
                                >
                                    ▼
                                </div>
                            </div>
                            <Link
                                to={userType === 'teacher' ? `/class/${classId}` : `/studentassignments/${classId}`}
                                style={{
                                    fontSize: '22px',
                                    padding: '0px',
                                    width: '100px',
                                    paddingRight: '0px',
                                    fontFamily: "'Rajdhani', sans-serif",
                                    fontWeight: 'BOLD',
                                    textAlign: "center",
                                    borderRadius: '7px',
                                    textDecoration: 'none', border: '4px solid',
                                    ...(periodStyles[getPeriodNumber(currentClass)] || periodStyles[1])
                                }}
                            >
                                {currentClass || ''}
                            </Link>
                        </div>
                    ) : (
                        <div style={{ width: '130px', height: '38px', backgroundColor: 'transparent', borderRadius: '7px' }}></div>
                    )}
                        
                    {showClassDropdown && (
                        <div
                            style={{
                                position: 'fixed',
                                top: '70px',
                                left: '0',
                                width: '100%',
                                backgroundColor: 'white',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                zIndex: 999,
                                display: 'flex',
                                justifyContent: 'center',
                                padding: '20px 0',
                                opacity: isDropdownActive ? 1 : 0,
                                overflow: 'hidden',
                                
                                maxHeight: dropdownVisible ? '80vh' : '0',
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                justifyContent: 'flex-start',
                                width: '1200px',
                                marginLeft: 'auto', marginRight: 'auto'
                            }}>
                                {classes
                                    .filter(cls => cls.id !== classId)
                                    .sort((a, b) => a.className.localeCompare(b.className))
                                    .map((cls) => {
                                        const periodNumber = getPeriodNumber(cls.className);
                                        const periodStyle = periodStyles[periodNumber] || { background: '#F4F4F4', color: 'grey' };

                                        return (
                                            <div
                                                key={cls.id}
                                                onClick={(e) => handleClassChange(cls.id, e)}
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
                                                <div style={{
                                                    width: '268px',
                                                    height: '30px',
                                                    border: `6px solid ${periodStyle.color}`,
                                                    backgroundColor: periodStyle.background,
                                                    color: periodStyle.color,
                                                    borderTopLeftRadius: '15px',
                                                    borderTopRightRadius: '15px',
                                                    fontFamily: "'Radio Canada', sans-serif",
                                                    fontWeight: 'bold',
                                                    fontSize: '16px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {cls.classChoice}
                                                </div>
                                                <div style={{
                                                    width: '268px',
                                                    height: '90px',
                                                    borderBottomLeftRadius: '15px',
                                                    borderBottomRightRadius: '15px',
                                                    backgroundColor: 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontFamily: "'Rajdhani', sans-serif",
                                                    fontWeight: 'bold',
                                                    fontSize: '40px',
                                                    color: 'grey',
                                                    transition: '.3s',
                                                    border: '6px solid #F4F4F4', 
                                                    borderTop: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#E8E8E8';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = '#f4f4f4';
                  }}>
                                                    <p style={{ marginTop: '40px' }}

onMouseEnter={(e) => {
    e.target.style.boxShadow = 'none';
}}
onMouseLeave={(e) => {
    e.target.style.boxShadow = 'none';
}}

                                                    > {cls.className}</p>

                                                </div>
                                            </div>
                                        );
                                    })}
                                <div style={{ height: '60px', width: '100%', background: 'white' }}></div>
                            </div>
                        </div>
                    )}









                    {userType === 'teacher' ? (
                        <div style={{ display: 'flex', justifyContent: 'start', flex: 0.85, gap: '40%', fontSize: '15px', fontFamily: "'Radio Canada', sans-serif", textDecoration: 'none', marginTop: '10px', marginLeft: '100px' }}>
                                {Object.entries(linkRoutes).map(([linkText, route], index) => (
                           <div
                           key={index}
                           style={{ position: 'relative' }}
                       >
                           <Link
                               to={route}
                               onClick={(e) => linkText === 'Create' && toggleCreateDropdown(e)}
                               style={{
                                   fontWeight: (getCurrentPage() === linkText || (linkText === 'Create' && showCreateDropdown)) ? 'bold' : 'normal',
                                   textDecoration: 'none',
                                   color: 'black',
                                   marginTop: '-5px',
                                   display: 'flex',
                                   alignItems: 'center'
                               }}
                           >
                               {linkText}
                               {linkText === 'Assignments' && <BookOpenText size={20} style={{ marginLeft: '-120px' }} strokeWidth={getCurrentPage() === 'Assignments' ? 2.5 : 2} />}
                               {linkText === 'Students' && <Users size={20} style={{ marginLeft: '-90px'}} strokeWidth={getCurrentPage() === 'Students' ? 2.5 : 2} />}
                               {linkText === 'Create' && <SquarePlus size={20} style={{ marginLeft: '-70px' }} strokeWidth={(getCurrentPage() === 'Create' || showCreateDropdown) ? 2.5 : 2} />}
                           </Link>
                           {linkText === 'Create' && showCreateDropdown && (
                               <div 
                                   style={{
                                       position: 'fixed',
                                       top: '70px',
                                       left: '0',
                                       width: '100%',
                                       backgroundColor: 'white',
                                       boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                       zIndex: 999,
                                       display: 'flex',
                                       justifyContent: 'center',
                                       padding: '20px 0',
                                       overflow: 'hidden',
                                   }}
                               >
                                   <TeacherAssignmentHomeS onFormatSelect={handleFormatSelect} />
                               </div>
                           )}
                         </div>
                     ))}
                        </div>
                    ) : (
                        <div style={{ 
                            position: 'absolute',  
                            left: '50%', 
                            transform: 'translateX(-50%)',
                           
                            fontSize: '30px', 
                            fontFamily: "'Rajdhani', sans-serif", 
                            color: 'grey', 
                            marginTop: '0px', 
                            fontWeight: 'bold',
                            // You might want to add these properties for better control:
                            whiteSpace: 'nowrap',  // Prevents text wrapping
                            padding: '5px 10px',   // Adds some space inside the div
                          }}>
                           
                            {classChoice} 
                        </div>
                    )}














                    <div style={{ flex: 0.15, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: '10px', right: '0px' }}>
                        <div onClick={toggleDropdown} style={{
                            width: '32px', height: '32px', borderRadius: '4px', backgroundColor: 'transparent',
                            border: '8px solid #627BFF', boxShadow: '0px 2px 3px 1px rgba(0, 0, 0, 0.1)', cursor: 'pointer', marginLeft: 'auto', marginRight: '60px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#020CFF', fontSize: '20px', fontWeight: 'bold'
                        }}>
                            <h1 style={{ fontSize: '16px', width: '44px', height: '30px', borderRadius: '2px', margin: '-4px', border: '5px solid #020CFF', userSelect: 'none' }}>
                                <h1 style={{ fontSize: '22px', fontFamily: '"Rajdhani", sans-serif', marginTop: '10px ', marginLeft: '2px' }}>{userInitials}</h1>
                            </h1>
                            {showDropdown && (
                                <div style={{
                                    position: 'absolute', marginTop: '130px', right: 25, color: '#020CFF',
                                    boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.2)', borderRadius: '5px', minWidth: '150px', zIndex: 1000
                                }}>
                                    <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                                        <li onClick={handleLogout} style={{
                                            padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #eee',zIndex: 1000,

                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '16px', color: 'grey', background: 'white'
                                           
                                        }}>
                                            Logout
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Navbar;
