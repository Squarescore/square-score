import { Link } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { auth, db } from "./firebase"; // Ensure these imports point to your Firebase setup
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth"; // Import signOut function from Firebase Auth

const Navbar = ({ userType, currentPage, firstName, lastName }) => {
    const { classId } = useParams();
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [userInitials, setUserInitials] = useState("");
    const [currentClass, setCurrentClass] = useState('');
    const [showClassDropdown, setShowClassDropdown] = useState(false);
    const [classes, setClasses] = useState([]);
    const [navbarBg, setNavbarBg] = useState('rgba(255,255,255,0.7)');
    const [classChoice, setClassChoice] = useState('');
    useEffect(() => {
        const fetchClasses = async () => {
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
            }
        };

        if (classId) {
            fetchClasses();
        }
    }, [classId, userType]);

    const handleClassChange = (newClassId, e) => {
        e.stopPropagation();
        if (newClassId !== classId) {
            let newPath = userType === 'teacher' ? `/class/${newClassId}/` : `/studentclasshome/${newClassId}`;
            navigate(newPath);
            setShowClassDropdown(false);
        }
    };

    const handleClassDropdownClick = (e) => {
        e.stopPropagation(); // Prevents click event from propagating to parent elements
    };

    const teacherLinkRoutes = {
        'Home': `/class/${classId}`,
        'Resources': `/class/${classId}/drafts`,
        'Create': `/class/${classId}/teacherassignmenthome`,
        'Grades': `/class/${classId}/TeacherGradesHome`,
        'Participants': `/class/${classId}/participants`,
    };

    const studentLinkRoutes = {
        'Home': `/studentclasshome/${classId}`,
        'Materials': '',
        'Grades': `/studentgrades/${classId}`,
        'Assignments': `/studentassignments/${classId}`,
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const uid = auth.currentUser.uid; // Get current user's UID
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

    const homeRoute = userType === 'teacher' ? '/teacherhome' : '/studenthome';
    const homeIcon = "https://cdn-icons-png.flaticon.com/512/1946/1946488.png"; // URL of the home icon image
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
        <div style={{
            position: 'fixed', top: 0, width: '100%', display: 'flex',
            padding: '0px 0', alignItems: 'center', height: '70px', color: 'grey', zIndex: '1000',
            backgroundColor: navbarBg,
            transition: 'background-color 0.3s ease',
            backdropFilter: 'blur(7px)',
        }}>

            <button 
                onClick={handleBack} 
                style={{position: 'fixed', top: '10px', left: '0px', fontFamily: "'Radio Canada', sans-serif", textDecoration: 'none', color: 'black', border: '0px solid lightgrey', height: '47px', width: '47px', borderRadius:'10px', backgroundColor: 'transparent', marginLeft:'20px', marginRight: '20px', cursor: 'pointer' }}>
                <img src="https://static.thenounproject.com/png/1875804-200.png" style={{width: '30px', opacity: '30%'}}/>
            </button>

            <div style={{ width: '1200px', marginLeft: 'auto', marginRight: 'auto', display: 'flex', alignItems: 'center' , }}>
                <Link to={homeRoute}>
                    <img src='/logo.png' alt="Logo" style={{ width: '40px', height: 'auto', marginLeft: '0px', marginRight: '40px' }} />
                </Link>
                <div
                    onMouseEnter={() => setShowClassDropdown(true)}
                    onMouseLeave={() => setShowClassDropdown(false)}
                    style={{
                        fontSize: '22px', color: 'rgb(50,50,50)', padding: '10px', width: '100px',
                        fontFamily: "'Rajdhani', sans-serif",  fontWeight: 'BOLD',backgroundColor: 'rgba(220, 220, 202, 0.2)',
                        backdropFilter: 'blur(5px)', textAlign: "center", marginRight: '20px', borderRadius: '7px', cursor: 'pointer', position: 'relative'
                    }}
                >
                    {currentClass || ''}
                    {showClassDropdown && (
                        <div onClick={handleClassDropdownClick} style={{
                            position: 'absolute', top: '100%', fontFamily: "'Rajdhani', sans-serif",
                            width: '120px', backgroundColor: 'white', fontWeight: 'bold', left: '0px', marginTop: '-7px',
                            backdropFilter: 'blur(7px)', opacity: showClassDropdown ? 1 : 0,
                            borderBottomRightRadius: '7px', borderBottomLeftRadius: '7px', zIndex: 10,
                            fontSize: '22px', color: 'grey', overflow: 'hidden',
                            maxHeight: showClassDropdown ? '200px' : '0', transition: 'max-height 0.3s ease-out, opacity 0.3s ease-out'
                        }}>
                            {classes
                                .filter(cls => cls.id !== classId)
                                .sort((a, b) => a.className.localeCompare(b.className)) 
                                .map((cls, index) => (
                                    <div
                                        key={cls.id}
                                        onClick={(e) => handleClassChange(cls.id, e)}
                                        style={{
                                            fontSize: '22px', cursor: 'pointer', backgroundColor: `rgba(${230 - (index * 20)}, ${230 - (index * 20)}, ${230 - (index * 20)}, 0.8)`,
                                            padding: '5px 20px', borderBottom: '1px solid #ddd', transition: 'background-color 0.2s',
                                            '&:hover': { backgroundColor: 'lightgrey' }
                                        }}
                                    >
                                        {cls.className}
                                    </div>
                                ))
                            }
                        </div>
                    )}
                    
                </div>

                {userType === 'teacher' ? (
                    <div style={{ display: 'flex', justifyContent: 'start', flex: 0.85, gap: '18%', fontSize: '15px', fontFamily: "'Radio Canada', sans-serif", textDecoration: 'none', marginTop: '10px' }}>
                        {Object.entries(linkRoutes).map(([linkText, route], index) => (
                            <Link
                                key={index}
                                to={route}
                                style={{ textDecoration: currentPage === linkText ? 'underline' : 'none', color: 'black' }}
                            >
                                {linkText === 'Home' ? <img src={homeIcon} alt="Home" style={{ width: '20px', marginTop: '-4px',  marginRight: '-190px',opacity: '90%' }} /> : linkText}
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div style={{ flex: 0.85, display: 'flex', justifyContent: 'center', fontSize: '40px', fontFamily: "'Rajdhani', sans-serif", color: 'grey', marginTop: '10px', fontWeight: 'bold' }}>
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
                                boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.2)', borderRadius: '5px', minWidth: '150px', zIndex: 100
                            }}>
                                <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                                    <li onClick={handleLogout} style={{
                                        padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #eee',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '16px', color: 'grey',
                                        '&:hover': { backgroundColor: '#f5f5f5' }
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
    );
};

export default Navbar;
