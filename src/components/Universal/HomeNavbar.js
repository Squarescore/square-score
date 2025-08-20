import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import { auth, db } from "./firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import {
  Home,
  ChevronDown,
  MessageSquare,
  Clapperboard,
  LayoutGrid,
  School,
  Building,
  MessageSquareReply,
  DoorOpen,
} from "lucide-react";
import { GlassContainer } from "../../styles";

const HomeNav = ({ userType }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [userFullName, setUserFullName] = useState("");
  const [schoolCode, setSchoolCode] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [teacherData, setTeacherData] = useState(null);

  // Fetch teacher data for school info
  useEffect(() => {
    const fetchTeacherData = async () => {
      if (userType === "teacher" && auth.currentUser) {
        try {
          const teacherRef = doc(db, 'teachers', auth.currentUser.uid);
          const teacherSnap = await getDoc(teacherRef);
          
          if (teacherSnap.exists()) {
            setTeacherData(teacherSnap.data());
          }
        } catch (error) {
          console.error("Error fetching teacher data:", error);
        }
      }
    };

    fetchTeacherData();
  }, [userType]);

  // Handle join organization
  const handleJoinOrganization = async () => {
    try {
      const schoolsQuery = query(collection(db, 'schools'), where('joinCode', '==', schoolCode));
      const schoolsSnap = await getDocs(schoolsQuery);

      if (!schoolsSnap.empty) {
        const schoolDoc = schoolsSnap.docs[0];
        const schoolData = schoolDoc.data();
        const schoolRef = doc(db, 'schools', schoolDoc.id);

        // Update teacher's document
        const teacherRef = doc(db, 'teachers', auth.currentUser.uid);
        await updateDoc(teacherRef, { 
          school: schoolData.schoolName, 
          schoolCode
        });

        // Add teacher UID to school's teachers array
        await updateDoc(schoolRef, { teachers: arrayUnion(auth.currentUser.uid) });

        // Update state
        setTeacherData(prevData => ({ 
          ...prevData, 
          school: schoolData.schoolName,
          schoolCode: schoolData.schoolCode
        }));
        setModalOpen(false);
        setSchoolCode('');
      } else {
        alert('Invalid school code.');
      }
    } catch (error) {
      console.error('Error joining organization:', error);
    }
  };

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

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "200px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        height: "100%",
        color: "grey",
        zIndex: "1000",
        backgroundColor: "#fcfcfc",
        transition: "background-color 0.3s ease",
        backdropFilter: "blur(7px)",
        borderRight: '1px solid #DFDFDF',
      }}>
        {/* Logo */}
        <div style={{
          width: '170px',
          borderBottom: '1px solid #ddd',
          justifyContent: 'center',
          padding: '20px 15px',
          paddingBottom: '20px',
          marginBottom: '20px',
          display: 'flex'
        }}>
          <img 
            src="/favicon.svg" 
            alt="Logo" 
            style={{
              width: '50px',
              height: '50px'
            }}
          />
          <h1 style={{fontSize: '1rem', fontWeight: '400', color: 'grey', lineHeight: '1.2', marginTop: '10px', marginLeft: '10px', borderLeft: '1px solid #ddd', 
            paddingLeft: '10px'
          }}>Amoeba. Education</h1>
      
      
        </div>

   



   <div style={{
          width: "170px",
          display: "flex",
          marginTop: 'auto',
          marginBottom: '10px', 
          padding: "0 15px", // Reduced padding
          gap: "15px",
        }}>
          {/* Join School Button - Only for teachers */}
          {userType === "teacher" && !teacherData?.school && (
            <button
              onClick={() => setModalOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 12px",
                backgroundColor: "transparent",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                color: "grey",
                width: '170px',
                fontSize: "0.85rem",
                fontFamily: "'montserrat', sans-serif",
                fontWeight: "500",
                transition: "background-color 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f8f8'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Building size={16} strokeWidth={1.5} style={{marginRight: '8px'}} />
              <p>Join School</p>
            </button>
          )}
        </div>
          {/* Show school name if teacher has joined */}
          {userType === "teacher" && teacherData?.school && (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px",
              backgroundColor: "transparent",
              borderRadius: "5px",
              color: "#00BBFF",
              
          marginTop: 'auto',
              fontSize: "0.85rem",
              fontFamily: "'montserrat', sans-serif",
              fontWeight: "500",
              marginBottom: "12px",
              borderBottom: "1px solid #EDEDED",
              paddingBottom: "20px"
            }}>
              <School size={16} strokeWidth={1.5} color="#00BBFF" style={{marginRight: '8px'}} />
              <span style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "110px"
              }}>
                {teacherData.school}
              </span>
            </div>
          )}

          
        {/* Bottom Section */}
        <div style={{
          width: "170px",
          padding: "15px", // Reduced padding
          borderTop: "1px solid #EDEDED",
          display: "flex",
          flexDirection: "column",
          gap: "12px" // Reduced gap
        }}>
           

          {/* Feedback Link */}
          <Link
            to="/feedback"
            style={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
              padding: "8px 12px",
              color: "grey",
              transition: "color 0.2s",
              borderRadius: "5px",
              fontSize: "0.85rem",
              fontFamily: "'montserrat', sans-serif",
              fontWeight: "500"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f8f8'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <MessageSquareReply size={16} strokeWidth={1.5} style={{marginRight: '8px'}} />
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
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              color: "grey",
              fontSize: "0.85rem",
              fontFamily: "'montserrat', sans-serif",
              fontWeight: "500",
              transition: "background-color 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f8f8'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <DoorOpen size={16} strokeWidth={1.5} style={{marginRight: '8px'}} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Join School Modal */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          backdropFilter: 'blur(15px)',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: '100'
        }}>
          <GlassContainer
            variant="clear"
            size={0}
            style={{

            }}
            contentStyle={{
              padding: '40px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            <h3 style={{ 
              fontSize: '1.5rem', 
              fontFamily: "'montserrat', sans-serif", 
              fontWeight: '400',
              color: 'black',
              margin: 0
            }}>
              School Code
            </h3>
            <input
              type="text"
              value={schoolCode}
              onChange={(e) => setSchoolCode(e.target.value)}
              style={{
                fontFamily: "'montserrat', sans-serif",
                fontSize: '1rem',
                background: "white",
                letterSpacing: '4px', 
                fontWeight: '600',
                borderRadius: '100px',
                border: '1px solid #ddd',
                width: '180px',
                padding: '10px 20px',
                outline: 'none',
              }}
            />
            <div style={{
              display: 'flex',
              gap: '10px',
              marginTop: '10px'
            }}>
              <GlassContainer
                variant="green"
                size={0}
                          enableRotation={true}
                onClick={handleJoinOrganization}
                style={{
                  flex: 1,
                  cursor: 'pointer'
                }}
                contentStyle={{
                  padding: '10px',
                  width: '80px',
                  height: '15px',
                  textAlign: 'center',
                  fontSize: '1rem',
                  fontFamily: "'montserrat', sans-serif",
                  fontWeight: '500'
                }}
              >
               <p style={{fontSize: '1rem', color: 'green', textAlign: 'center', width: '80px', marginTop: '-3px' }}>Join</p>
              </GlassContainer>
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  flex: 1,
                  padding: '5px 15px',
                  width: '100px', 
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '50px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontFamily: "'montserrat', sans-serif",
                  fontSize: '1rem',
                  color: 'grey',
                }}
              >
                Cancel
              </button>
            </div>
          </GlassContainer>
        </div>
      )}
    </div>
  );
};

export default HomeNav;
