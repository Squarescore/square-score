import { Link } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { auth, db } from "./firebase"; // Ensure these imports point to your Firebase setup
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth"; // Import signOut function from Firebase Auth
import { collection, query, where } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { onSnapshot } from "firebase/firestore";
const CJNavbar = ({ userType, currentPage, firstName, lastName })=> {
    const { classId } = useParams();
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [userInitials, setUserInitials] = useState("");
    const [currentClass, setCurrentClass] = useState('');
    const [showClassDropdown, setShowClassDropdown] = useState(false);
    const [classes, setClasses] = useState([]);
    useEffect(() => {
        const fetchClasses = () => {
            let classesRef;
            if (userType === 'teacher') {
                const teacherUID = auth.currentUser.uid;
                classesRef = query(collection(db, 'classes'), where('teacherUID', '==', teacherUID));
            } else {
                // Logic for fetching student classes
            }

            const unsubscribe = onSnapshot(classesRef, (querySnapshot) => {
                const fetchedClasses = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setClasses(fetchedClasses);

                const currentClassData = fetchedClasses.find(cls => cls.id === classId);
                if (currentClassData) {
                    setCurrentClass(currentClassData.className);
                }
            });

            return unsubscribe; // Unsubscribe when component unmounts
        };

        const unsubscribe = fetchClasses();
        return () => unsubscribe();
    }, [classId, userType]);

    const handleClassChange = (newClassId, e) => {
        e.stopPropagation(); // Prevent event bubbling
        if (newClassId !== classId) {
            // Construct the new path relative to the current location
            let newPath = `/class/${newClassId}/`;
            // Add additional path segments if needed
            const pathSegments = window.location.pathname.split('/');
            if (pathSegments.length > 3) {
                // Reconstruct the path with the new class ID
                newPath += pathSegments.slice(3).join('/');
            }
            console.log('New Path:', newPath); // Log for debugging
            navigate(newPath); // Navigate to the new path
            setShowClassDropdown(false);
        }
    };

    const handleClassDropdownClick = (e) => {
        e.stopPropagation(); // Prevents click event from propagating to parent elements
    };


    const teacherLinkRoutes = {
        
    
    };
    const studentLinkRoutes = {
       
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
            // Redirect to login or other appropriate page after logout
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const getInitials = (firstName, lastName) => {
        if (!firstName || !lastName) return "";
        return `${firstName[0]}${lastName[0]}`.toUpperCase();
    };

    // Use appropriate mapping based on userType
    const linkRoutes = userType === 'teacher' ? teacherLinkRoutes : studentLinkRoutes;
  const homeRoute = userType === 'teacher' ? '/teacherhome' : '/studenthome';

    const homeIcon = "https://cdn-icons-png.flaticon.com/512/1946/1946488.png"; // URL of the home icon image
    const logoUrl = "/logo.png";
    const [navbarBg, setNavbarBg] = useState('rgba(255,255,255,0.7)');
    // Use appropriate mapping based on userType
 
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
    const handleBack = () => {
        navigate(-1);
    };
    return (
        <div style={{ 
            position: 'fixed', top: 0, width: '100%', display: 'flex',
            padding: '0px 0', alignItems: 'center', height: '70px',color: 'grey', zIndex: '1000',


            backgroundColor: 'rgba(255,255,255,0.9)', 

    
            backdropFilter: 'blur(5px)', 
           }}>
 <button 
                onClick={handleBack} 
                style={{position: 'fixed', top: '10px', left: '0px', fontFamily: "'Radio Canada', sans-serif", textDecoration: 'none', color: 'black', border: '0px solid lightgrey', height: '47px', width: '47px', borderRadius:'10px', backgroundColor: 'transparent', marginLeft:'20px', marginRight: '20px', cursor: 'pointer' }}>
                <img src="https://static.thenounproject.com/png/1875804-200.png" style={{width: '30px', opacity: '30%'}}/>
            </button>

            <div style={{width: '1280px', display: 'flex', backgroundColor: 'transparent',
            padding: '0px 0',alignItems: 'center', height: '70px',color: 'grey', marginRight: 'auto', marginLeft: 'auto'}}>
            
            



            <img style={{width: '320px',  marginLeft: 'auto', marginRight: 'auto'}} src="/SquareScore.png" alt="logo" />


           


      




            </div>
            
            <div style={{ flex: 0.15, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: '10px', right: '-20px' }}>
               
                
                <div onClick={toggleDropdown}
                style={{ 
             
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '4px',
                    // Rounded shape
                    backgroundColor: 'transparent', 
                    border: '8px solid #627BFF',
                    boxShadow: '0px 2px 3px 1px rgba(0, 0, 0, 0.1)',
                    cursor: 'pointer',
                    marginLeft: 'auto', 
                    marginRight: '60px',
                  
                    display: 'flex', // To center the text
                    alignItems: 'center', // Aligns vertically
                    justifyContent: 'center', // Aligns horizontally
                    color: '#020CFF',// Text color
                    fontSize: '20px', 
                   // Font size of the initials
                    fontWeight: 'bold' // Font weight for the initials
           
               }}>
                <h1 style={{   fontSize: '16px', width: '44px', height: '30px', borderRadius: '2px',   margin: '-4px',    border: '5px solid #020CFF', userSelect: 'none' }}>
            <h1 style={{ fontSize: '22px', fontFamily: '"Rajdhani", sans-serif', marginTop: '10px ', marginLeft: '2px' }} >{userInitials}</h1> </h1>
                 {showDropdown && (
                  <div style={{
                    position: 'absolute',
                    marginTop: '130px', // Position right below the initials
                    right: 25,
                    color: '#020CFF',
                    boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.2)',
                    borderRadius: '5px',
                    minWidth: '150px',
                    zIndex: 100,
                    
                }}>
                    <ul style={{
                        listStyleType: 'none',
                        padding: 0,
                        margin: 0
                    }}>
                        <li onClick={handleLogout} style={{
                            padding: '10px 15px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #eee',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '16px',
                            color: 'grey',
                            
                            '&:hover': {
                                backgroundColor: '#f5f5f5'
                            }
                        }}>
                            Logout
                            </li>
                        </ul>
                    </div>
                )}
                </div>


            </div>
        </div>
    );
};

export default CJNavbar;