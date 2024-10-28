
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
            
               boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)',


            backgroundColor: 'rgba(255,255,255,0.9)', 

    
            backdropFilter: 'blur(5px)', 
           }}>


            <div style={{width: '1280px', display: 'flex', backgroundColor: 'transparent',
            padding: '0px 0',alignItems: 'center', height: '70px',color: 'grey', marginRight: 'auto', marginLeft: 'auto'}}>
            
         

                
            <div style={{width: '320px',   display: 'flex', marginLeft: 'auto', marginRight: 'auto',}}>
<img style={{ width: '30px', marginLeft: '20px', marginTop: '-0px' }} src="/SquareScore.svg" alt="logo" /> <span style={{fontSize: '30px', fontWeight: '600', paddingLeft: '20px', 
    color:'black', borderLeft: '4px solid #f4f4f4', marginLeft: '15px'}}>SquareScore</span>
    
            </div>


      




            </div>
            
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
        </div>
    );
};

export default HomeNavbar;