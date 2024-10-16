
import { Link } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { auth, db } from "./firebase"; // Ensure these imports point to your Firebase setup
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth"; // Import signOut function from Firebase Auth
import { getDocs } from "firebase/firestore";
const HomeNavbar = ({ userType, currentPage, firstName, lastName }) => {
    const { classId } = useParams();
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [userInitials, setUserInitials] = useState("");
    


    

    const teacherLinkRoutes = {
        
    
    };
    const studentLinkRoutes = {
       
    };
   
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const uid = auth.currentUser.uid; // Get current user's UID
                const userDoc = await getDoc(doc(db, userType === 'teacher' ? 'teachers' : userType === 'student' ? 'students' : 'admin', uid));

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

    // Use appropriate mapping based on userType
 
    return (
        <div style={{ 
            position: 'fixed', top: 0, width: '100%', display: 'flex',
            padding: '0px 0', alignItems: 'center', height: '70px',color: 'grey', zIndex: '1000',


            backgroundColor: 'rgba(255,255,255,0.9)', 

    
            backdropFilter: 'blur(5px)', 
           }}>


            <div style={{width: '1280px', display: 'flex', backgroundColor: 'transparent',
            padding: '0px 0',alignItems: 'center', height: '70px',color: 'grey', marginRight: 'auto', marginLeft: 'auto'}}>
            
         

                
            <div style={{width: '320px',   display: 'flex', marginLeft: 'auto', marginRight: 'auto',}}>
<img style={{ width: '50px', marginLeft: '20px', marginTop: '-0px' }} src="/SquareScore.svg" alt="logo" /> <span style={{fontSize: '30px', fontWeight: '600', paddingLeft: '20px', 
    color:'black', borderLeft: '4px solid #f4f4f4', marginLeft: '15px'}}>SquareScore</span>
    
            </div>


      




            </div>
            
            <div style={{ flex: 0.15, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: '10px', right: '-20px' }}>
               
                
            <div onClick={toggleDropdown} style={{
                            width: '32px', height: '32px', borderRadius: '4px', backgroundColor: 'transparent',
                            border: '8px solid #627BFF', boxShadow: '0px 2px 3px 1px rgba(0, 0, 0, 0.1)', cursor: 'pointer', marginLeft: 'auto', marginRight: '60px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#020CFF', fontSize: '20px', fontWeight: 'bold'
                        }}>
                            <div style={{ fontSize: '10px', width: '44px', height: '30px', borderRadius: '2px', margin: '-4px', border: '5px solid #020CFF', userSelect: 'none' }}>
                                <h1 style={{ fontSize: '20px', width: '30px', fontFamily: '"montserrat", sans-serif', marginTop: '11px ', marginLeft: '2px' }}>{userInitials}</h1>
                            </div>    {showDropdown && (
                  <div style={{
                    position: 'absolute',
                    marginTop: '130px', // Position right below the initials
                    right: 25,
                    color: '#020CFF',
                    boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.2)',
                    borderRadius: '5px',
                    minWidth: '150px',
                    zIndex: 10000,
                    
                }}>
                    <ul style={{
                        listStyleType: 'none',
                        padding: 0,
                        margin: 0,
                        zIndex: 1000,
                    }}>
                        <li onClick={handleLogout} style={{
                            padding: '10px 15px',
                            cursor: 'pointer',
                            zIndex: 1000,
                            borderBottom: '1px solid #FFE279',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '16px',
                            color: 'grey',
                            
                            '&:hover': {
                                backgroundColor: '#FFE279'
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

export default HomeNavbar;