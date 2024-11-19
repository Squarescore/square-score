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
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import {
  Home,
  ChevronDown,
  MessageSquare,
  Clapperboard,
  LayoutGrid,
} from "lucide-react";
import TeacherAssignmentHome from "../Teachers/TeacherAssignments/TeacherAssignmentHome";
import { motion, AnimatePresence } from "framer-motion";

const HomeNav = ({ userType }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [userFullName, setUserFullName] = useState("");
  const [currentClass, setCurrentClass] = useState("Squarescore");
  const [currentClassChoice, setCurrentClassChoice] = useState("Select a class");
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch classes based on user type
  useEffect(() => {
    const fetchClasses = async () => {
      setIsLoading(true);
      let classQuery;
      if (userType === "teacher") {
        const teacherUID = auth.currentUser.uid;
        classQuery = query(
          collection(db, "classes"),
          where("teacherUID", "==", teacherUID)
        );
      } else {
        const studentUID = auth.currentUser.uid;
        classQuery = query(
          collection(db, "classes"),
          where("students", "array-contains", studentUID)
        );
      }

      try {
        const classesSnapshot = await getDocs(classQuery);
        const classesData = classesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClasses(classesData);
      } catch (error) {
        console.error("Error fetching classes:", error);
      }
      setIsLoading(false);
    };

    fetchClasses();
  }, [userType]);

  // Handle class change
  const handleClassChange = (newClassId, e) => {
    e.stopPropagation();
    let newPath =
      userType === "teacher"
        ? `/class/${newClassId}/`
        : `/studentassignments/${newClassId}/active`;
    navigate(newPath);
    setShowClassDropdown(false);
  };

  // Toggle class dropdown
  const toggleClassDropdown = (e) => {
    if (e) e.preventDefault();
    setShowClassDropdown((prev) => !prev);
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

  // Determine the current active page
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === "/teacherhome" || path === "/studenthome") return "Home";
    return "";
  };
  const periodStyles = {
    1: { background: "#D4FFFD", color: "#1CC7BC", borderColor: "#1CC7BC" },
    2: { background: "#FCEDFF", color: "#E01FFF", borderColor: "#E01FFF" },
    3: { background: "#FFCEB2", color: "#FD772C", borderColor: "#FD772C" },
    4: { background: "#FFECA9", color: "#F0BC6E", borderColor: "#F0BC6E" },
    5: { background: "#DBFFD6", color: "#4BD682", borderColor: "#4BD682" },
    6: { background: "#F0EDFF", color: "#8364FF", borderColor: "#8364FF" },
    7: { background: "#8296FF", color: "#3D44EA", borderColor: "#3D44EA" },
    8: { background: "#FF8E8E", color: "#D23F3F", borderColor: "#D23F3F" },
  };

  // Get period number from class name
  const getPeriodNumber = (className) => {
    const match = className.match(/Period (\d)/);
    return match ? parseInt(match[1]) : null;
  };
  const periodNumber = getPeriodNumber(currentClass);
  const periodStyle =
    periodStyles[periodNumber] || {
      background: "#F4F4F4",
      color: "grey",
      borderColor: "grey",
    };
  return (
    <div style={{ position: "relative" }}>
      {/* Navbar */}
      <div
        style={{
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
          borderRight: "1px solid #DFDFDF",
          paddingTop: "20px",
          overflowY: "auto",
        }}
      >
        {/* Class Selector */}
        <div
          style={{ width: "100%", padding: "10px 10px", marginBottom: "20px" }}
        >
          <div
            onClick={toggleClassDropdown}
            style={{
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              marginBottom: "20px",
              width: "180px",
              backgroundColor: "white",
              borderRadius: "5px",
              position: "relative",
            }}
          >
            <div
              style={{
                fontFamily: "'montserrat', sans-serif",
                fontWeight: "600",
                background: "white",
                height: "12px",
                lineHeight: "10px",
                width: "170px",
                paddingLeft: "4px",
                marginBottom: "15px",
                color: "grey",
                fontSize: "25px",
                whiteSpace: "nowrap",
                flex: 1,
                marginRight: "10px",
              }}
            >
              {currentClass}
            </div>

            <div
              style={{
                fontFamily: "'montserrat', sans-serif",
                fontWeight: "600",
                color: "lightgrey",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flex: 1,
                marginRight: "10px",
                fontSize: "14px",
              }}
            >
              {currentClassChoice}
            </div>
            <ChevronDown
              size={20}
              style={{ position: "absolute", right: "10px", top: "25px" }}
            />
          </div>
          {/* Dropdown Menu for Classes */}
          <AnimatePresence>
            {showClassDropdown && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  overflow: "hidden",
                  backgroundColor: "white",
                  borderRadius: "5px",
                  marginTop: "0px",
                  zIndex: 1000,
                }}
              >
                {classes
                  .filter((cls) => cls.id !== cls.classId)
                  .sort((a, b) => a.className.localeCompare(b.className))
                  .map((cls, index) => {
                    const periodNumber = getPeriodNumber(cls.className);
                    const periodStyle =
                      periodStyles[periodNumber] || {
                        background: "#F4F4F4",
                        color: "grey",
                        borderColor: "grey",
                      };

                    return (
                      <div
                        key={cls.id}
                        onClick={(e) => handleClassChange(cls.id, e)}
                        style={{
                          padding: "10px 10px",
                          cursor: "pointer",
                          marginTop: '0px',  
                          display: "flex",
                          alignItems: "center",
                          borderTop:
                            index !== classes.length - 1
                              ? "1px solid #eee"
                              : "none",
                        }}
                      >
                    
                        {/* Class Name */}
                        <span
                          style={{
                            fontFamily: "'montserrat', sans-serif",
                            fontWeight: "600",
                            lineHeight: '4px',
                            margin: '10px 0px',
                            padding: '0px 5px 0px 2px',
                            height:'6px',
                            fontSize: '20px',
                            color: periodStyle.color,
                            backgroundColor: periodStyle.background,
                           
                          }}
                        >
                          {cls.className}
                        </span>
                      </div>
                    );
                  })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div
          style={{
            width: "90%",
            background: "#f4f4f4",
            height: "2px",
            marginLeft: "auto",
            marginRight: "auto",
            marginTop: "-20px",
          }}
        />
        {/* Navigation Links */}
      

        {/* Bottom Navigation Section */}
        <div
          style={{
            width: "100%",
            marginTop: '20px',
            paddingLeft: "20px",
            marginBottom: "20px",
          }}
        >
          {/* Home Link */}
          <Link
            to="/home"
            style={{
              display: "flex",
              alignItems: "center",
              padding: "1% 0",
              width: "89%",
              textDecoration: "none",
              color:
                getCurrentPage() === "Home" ? "#000000" : "#A1A1A1",
              borderRight:
                getCurrentPage() === "Home"
                  ? `2px solid #000000`
                  : "2px solid transparent",
              marginBottom: "15px",
              transition: "border-right 0.3s, color 0.3s",
              cursor: "pointer",
            }}
          >
            <div style={{ marginRight: "10px" }}>
              <Home
                size={20}
                strokeWidth={getCurrentPage() === "Home" ? 2.5 : 2}
                color={
                  getCurrentPage() === "Home" ? "#000000" : "#A1A1A1"
                }
              />
            </div>
            <span
              style={{
                fontFamily: "'montserrat', sans-serif",
                fontWeight: "600",
                fontSize: "15px",
                color: "inherit",
              }}
            >
              Home
            </span>
          </Link>

          {/* Divider Line */}
          <div
            style={{
              width: "90%",
              padding: "10px",
              position: 'absolute', 
              bottom: '110px',
              marginLeft: "-10px",
              boxSizing: "border-box",
              borderTop: "1px solid #ddd",
            }}
          />

          {/* Tutorials Link */}
          <Link
            to="/tutorials"
            style={{
              display: "flex",
              position: 'absolute', 
              bottom: '80px',
              alignItems: "center",
              width: "90%",
              textDecoration: "none",
              color: "#A1A1A1",
              marginBottom: "15px",
              cursor: "pointer",
            }}
          >
            <div style={{ marginRight: "10px" }}>
              <Clapperboard size={15} strokeWidth={2} color="#A1A1A1" />
            </div>
            <span
              style={{
                fontFamily: "'montserrat', sans-serif",
                fontWeight: "600",
                fontSize: "12px",
                color: "inherit",
              }}
            >
              Tutorials
            </span>
          </Link>

          {/* Feedback Link */}
          <Link
            to="/feedback"
            style={{
              display: "flex",
              alignItems: "center",
              width: "90%",
              position: 'absolute', 
              bottom: '50px',
              textDecoration: "none",
              color: "#A1A1A1",
              marginBottom: "15px",
              cursor: "pointer",
            }}
          >
            <div style={{ marginRight: "10px" }}>
              <MessageSquare size={15} strokeWidth={2} color="#A1A1A1" />
            </div>
            <span
              style={{
                fontFamily: "'montserrat', sans-serif",
                fontWeight: "600",
                fontSize: "12px",
                color: "inherit",
              }}
            >
              Feedback
            </span>
          </Link>
        </div>

        {/* Spacer to push profile to bottom */}
        <div style={{ flexGrow: 1 }}></div>

        {/* User Profile */}
        <div
          style={{
            width: "90%",
            padding: "10px",
            marginLeft: "5%",
            boxSizing: "border-box",
            borderTop: "1px solid #ddd",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {/* Initials Box */}
          <div
            style={{
              width: "32px",
              height: "32px",
              backgroundColor: "#f4f4f4",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'montserrat', sans-serif",
              fontWeight: "600",
              fontSize: "14px",
              color: "#666",
            }}
          >
            {userFullName
              .split(" ")
              .map((name) => name[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleLogout}
            style={{
              flex: 1,
              padding: "10px",
              backgroundColor: "white",
              border: "none",
              textAlign: "left",
              borderRadius: "5px",
              cursor: "pointer",
              fontFamily: "'montserrat', sans-serif",
              fontWeight: "600",
              color: "lightgrey",
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Create Dropdown Modal */}
      <AnimatePresence>
        {showCreateDropdown && (
          <TeacherAssignmentHome
            onClose={() => setShowCreateDropdown(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomeNav;
