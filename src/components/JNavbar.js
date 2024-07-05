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

const JNavbar = ({ userType, currentPage, firstName, lastName })=> {
    const { classId } = useParams();
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [userInitials, setUserInitials] = useState("");
    const [currentClass, setCurrentClass] = useState('');
    const [showClassDropdown, setShowClassDropdown] = useState(false);
    const [classes, setClasses] = useState([]);
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
  const handleBack = () => {
    navigate(-1);
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
    const linkRoutes = userType === 'student' ? studentLinkRoutes : studentLinkRoutes;
  const homeRoute = userType === 'student' ? '/studenthome' : '/studenthome';

    const homeIcon = "https://cdn-icons-png.flaticon.com/512/1946/1946488.png"; // URL of the home icon image
    const logoUrl = "https://mail.google.com/mail/u/0/?ui=2&ik=37a737aa12&attid=0.1&permmsgid=msg-a:r-3148323832766397253&th=18c16593bd8d7df2&view=fimg&realattid=f_lpifu2e60&disp=thd&attbid=ANGjdJ8bgrZRCyhxdcsLGbyfJk0zP8m3DmyaxIsEtzN4KKU_xk70WmC_KsqNLsSL5dQb0HbtJcDimO341JFirizvIY8pc3g_iCm3rMpAsGFL3G4sVki7EOOsfoHa9Qs&ats=2524608000000&sz=w2256-h1274";


    // Use appropriate mapping based on userType
 
    return (
        <div style={{ 
            position: 'fixed', top: 0, width: '100%', display: 'flex',
            padding: '0px 0', alignItems: 'center', height: '70px',color: 'grey', zIndex: '1000',


            backgroundColor: 'rgba(250,250,250,0.9)', 

    
            backdropFilter: 'blur(5px)', 
            boxShadow: '1px 1px 5px 1px rgb(0,0,0,.15)'  }}>
           
            <Link to={homeRoute}>
            <img src={logoUrl} alt="Logo" style={{ width: '70px', height: 'auto', marginLeft: '30px', marginRight: '30px', }} />
            </Link>
            <div style={{ height: '70px', width: '2px', backgroundColor: 'lightgray', marginRight: '1%' }}></div>
          





       



            <div style={{ display: 'flex', justifyContent: 'start', flex: 0.85,
            
            gap: '7%', fontSize: '15px', fontFamily: "'Radio Canada', sans-serif",
             color: 'grey', textDecoration: 'none', 
        marginTop: '10px'}}>

            <h1 style={{marginBottom: '30px', fontWeight: 'normal', marginLeft: 'auto', marginRight: 'auto', color: 'grey'}} >
                Join Class
            </h1>
               
            </div>
            <div style={{ flex: 0.15, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
               
                
                <div onClick={toggleDropdown}
                style={{ 
                      
                        width: '40px', 
                        height: '40px', 
                        // Rounded shape
                        backgroundColor: '#BD00FF', 
                        cursor: 'pointer',
                        marginLeft: 'auto', 
                        marginRight: '60px',
                        display: 'flex', // To center the text
                        alignItems: 'center', // Aligns vertically
                        justifyContent: 'center', // Aligns horizontally
                        color: 'white', // Text color
                        fontSize: '18px', 
                        color: 'white',// Font size of the initials
                        fontWeight: 'bold' // Font weight for the initials
               
                   }}>
                 {userInitials}
                 {showDropdown && (
                  <div style={{
                    position: 'absolute',
                    marginTop: '130px', // Position right below the initials
                    right: 25,
                    backgroundColor: 'white',
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
                            color: '#333',
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

export default JNavbar