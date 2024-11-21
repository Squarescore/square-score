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
  Grid,
  Home,
  BookOpenText,
  Users,
  SquarePlus,
  ChevronDown,
  MessageSquare,
  Clapperboard,
  LayoutGrid,
  BookOpen,
  BookOpenCheck,
  CalendarClock,
  CalendarX2,
} from "lucide-react";
import TeacherAssignmentHome from "../Teachers/TeacherAssignments/TeacherAssignmentHome";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = ({ userType }) => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const timeoutRef = useRef(null);

  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userFullName, setUserFullName] = useState("");
  const [currentClass, setCurrentClass] = useState("");
  
  const [currentClassChoice, setCurrentClassChoice] = useState("");
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
 

  // Fetch classes based on user type and classId
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
        const currentClassData = classesData.find((cls) => cls.id === classId);

        if (currentClassData) {
          setCurrentClass(currentClassData.className);
          setCurrentClassChoice(currentClassData.classChoice);
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
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
      let newPath =
        userType === "teacher"
          ? `/class/${newClassId}/`
          : `/studentassignments/${newClassId}/active`;
      navigate(newPath);
      setShowClassDropdown(false);
    }
  };

  // Toggle class dropdown
  const toggleClassDropdown = (e) => {
    if (e) e.preventDefault();
    setShowClassDropdown((prev) => !prev);
  };

  // Toggle create dropdown
  const toggleCreateDropdown = (e) => {
    if (e) e.preventDefault();
    setShowCreateDropdown((prev) => !prev);
  };
  const tabStyles = {
    active: { background: '#CCFFC3', color: '#00CD09', borderColor: '#00CD09' },
    completed: { background: '#B9C4FF', color: '#020CFF', borderColor: '#020CFF' },
    upcoming: { background: '#FFF0A1', color: '#FC8518', borderColor: '#FCAE18' },
    overdue: { background: '#FFE6E6', color: 'red', borderColor: 'red' }
  };
  // Define link routes
  const teacherLinkRoutes = {
    Dashboard: `/class/${classId}/`,
    Create: `/class/${classId}/teacherassignmenthome`,
    Assignments: `/class/${classId}/Assignments`,
    Students: `/class/${classId}/participants`,
    Home: "/home", // Added Home link
  };

  const studentLinkRoutes = {
    Active: `/studentassignments/${classId}/active`,
    Completed: `/studentassignments/${classId}/completed`,
    Upcoming: `/studentassignments/${classId}/upcoming`,
    Overdue: `/studentassignments/${classId}/overdue`,
    Home: "/home",
  };

  // Define linkRoutes based on userType
  const linkRoutes = userType === "teacher" ? teacherLinkRoutes : studentLinkRoutes;

  // Optionally replace :classId in routes if needed
  Object.keys(linkRoutes).forEach((key) => {
    linkRoutes[key] = linkRoutes[key].replace(":classId", classId);
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

  // Define link colors
  const linkColors = {
    Dashboard: "#E441FF",
    Assignments: "#020CFF",
    Students: "#FFAE00",
    Create: "#2BB514",
    Home: "#00C853",
    Active: "#00CD09",
    Completed: "#020CFF",
    Upcoming: "#FC8518",
    Overdue: "#FF0000"
  };
  const getCurrentPage = () => {
    const path = location.pathname;
    if (userType === "student") {
      if (path.includes("/active")) return "Active";
      if (path.includes("/completed")) return "Completed";
      if (path.includes("/upcoming")) return "Upcoming";
      if (path.includes("/overdue")) return "Overdue";
      if (path === `/studentassignments/${classId}`) return "Dashboard";
    } else {
      // Existing teacher logic
      if (path.includes("/teacherassignmenthome")) return "Create";
      
      if (path === `/class/${classId}/`) return "Dashboard";
      if (path.includes("/createassignment") || path.includes("/MCQ") || path.includes("/MCQA"))
        return "Create";
      if (path.includes("/TeacherResults") || path.includes("/teacherStudentResults") || path.includes("/Assignments"))
        return "Assignments";
      if (path.includes("/participants")) return "Students";
    }
    if (path === "/teacherhome") return "Home";
    return "";
  };
  const renderNavigationLinks = () => {
    return Object.entries(linkRoutes)
      .filter(([linkText]) => linkText !== 'Home')
      .map(([linkText, route], index) => {
        const isActive = getCurrentPage() === linkText;
        
        // Get appropriate icon based on link text and user type
        const getIcon = () => {
          if (userType === "student") {
            switch(linkText) {
              case "Active": return BookOpen;
              case "Completed": return BookOpenCheck;
              case "Upcoming": return CalendarClock;
              case "Overdue": return CalendarX2;
              case "Dashboard": return LayoutGrid;
              default: return LayoutGrid;
            }
          } else {
            // Existing teacher icons
            switch(linkText) {
              case "Dashboard": return LayoutGrid;
              case "Assignments": return BookOpenText;
              case "Students": return Users;
              case "Create": return SquarePlus;
              default: return LayoutGrid;
            }
          }
        };

        const Icon = getIcon();

        return (
          <Link
            key={index}
            to={route}
            style={{
              display: "flex",
              alignItems: "center",
              position: 'relative',
              padding: "5% 0",
              height: '20px',
              width: "176px",
              textDecoration: "none",
              color: isActive ? linkColors[linkText] : "#A1A1A1",
              borderRight: isActive ? `4px solid ${linkColors[linkText]}` : "4px solid transparent",
              marginBottom: "25px",
              transition: "border-right 0.3s, color 0.3s",
              cursor: "pointer",
            }}
          >
            <div style={{ marginRight: "10px", marginTop: '5px' }}>
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 2}
                color={isActive ? linkColors[linkText] : "#A1A1A1"}
              />
            </div>
            <span
              style={{
                fontFamily: "'montserrat', sans-serif",
                fontWeight: "600",
                fontSize: '16px',
                color: "inherit",
              }}
            >
              {linkText}
            </span>
          </Link>
        );
      });
  };
  // Removed linkBorderColors as it's no longer needed
  // const linkBorderColors = {
  //   Dashboard: "#F5B6FF",
  //   Assignments: "#C7CFFF",
  //   Students: "#FFEAAF",
  //   Create: "#AEF2A3",
  //   Home: "#AAF4C3", // Border color for Home
  // };

  // Define period styles (unchanged)
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
  const getOrdinalSuffix = (num) => {
    const number = parseInt(num);
    if (number === 1) return "st";
    if (number === 2) return "nd";
    if (number === 3) return "rd";
    return "th";
  };
  // Get period number from class name
  const getPeriodNumber = (className) => {
    const match = className.match(/Period (\d)/);
    return match ? parseInt(match[1]) : null;
  };

  // Define home route
  const homeRoute = "/"; // Adjusted to the new Home route
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
          left: 0, // Ensure it's fixed to the left
          width: "200px", // Increased width for better spacing
          display: "flex",
          flexDirection: "column", // Arrange links vertically
          alignItems: "flex-start",
          height: "100%",
          color: "grey",
          zIndex: "1000",
          backgroundColor: "#fcfcfc",
          transition: "background-color 0.3s ease",
          backdropFilter: "blur(7px)",
          borderRight: '1px solid #DFDFDF',
          paddingTop: "20px", // Added padding
          overflowY: "auto", // Scroll if content overflows
        }}
      >
        {/* Logo */}
      

        {/* Class Selector */}
        <div style={{ width: "100%", padding: "10px 10px", marginBottom: "20px" }}>
          <div
            onClick={toggleClassDropdown}
            style={{
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              marginBottom: '20px',
              marginLeft: '10px',
              width: '180px',
              backgroundColor: "white",
              borderRadius: "5px",
              position: "relative",
            }}
          >
            <div style={{display: 'flex'}}>
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              background: periodStyle.background,
              padding: '3px 8px',
              userSelect: 'none',
              borderRadius: '5px',
              marginBottom: '15px',
              marginTop: '-0px',
              width: '25px',
              textAlign: 'center',
              height:'20px'
            }}>
              <span style={{
                fontFamily: "'montserrat', sans-serif",
                fontWeight: "600",
                color: periodStyle.color,
                fontSize: '16px',
              }}>
                {periodNumber}
              </span>
              <span style={{
                fontFamily: "'montserrat', sans-serif",
                fontWeight: "600",
                color: periodStyle.color,
                fontSize: '16px',
                marginLeft: '2px',
              }}>
                {getOrdinalSuffix(periodNumber)}
              </span> </div>
              <span style={{
                fontFamily: "'montserrat', sans-serif",
                fontWeight: "600",
                color: periodStyle.color,
                fontSize: '25px',
                userSelect: 'none',
                marginTop: '-5px',
                marginLeft: '10px',
              }}>
                Period
              </span>
              </div>

            <div style={{
              fontFamily: "'montserrat', sans-serif",
              fontWeight: "600",
              color: "lightgrey",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
              marginRight: "10px",
              fontSize: '14px'
            }}>
              {currentClassChoice || "Select Class"}
            </div>
            <ChevronDown size={20} style={{position: 'absolute', right: '15px', top: '5px'}} />
          </div>
          {/* Dropdown Menu for Classes */}
          <AnimatePresence>
            {showClassDropdown && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.1 }}
                style={{
                  overflow: "hidden",
                  position: 'absolute',
                  userSelect: 'none',
                  width: '200px',
                  backgroundColor: "#fcfcfc",
                  borderRadius: "5px",
                  marginTop: "0px",
                  zIndex: 1000,
                }}
              >
                {classes
                  .filter((cls) => cls.id !== classId)
                  .sort((a, b) => a.className.localeCompare(b.className))
                  .map((cls, index) => {
                   
                      const periodNumber = parseInt(cls.className.split(' ')[1]);
                      const periodStyle = periodStyles[periodNumber] || { background: '#F4F4F4', color: 'grey' };
                      const suffix = getOrdinalSuffix(periodNumber);
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
                        <div style={{
                    fontSize: '16px',
                    borderRadius: '5px',
                    backgroundColor: periodStyle.background,
                    width: '45px',
                    color: periodStyle.color,
                    height: '25px',
                    marginTop: '0px',
                    lineHeight: '25px',
                    fontWeight: '600',
                   textAlign: 'center',
                    padding: '0px 0px',
                  }}>
                    {periodNumber}
                    <span style={{
                    fontSize: '16px',
                    fontWeight: '600',
                  }}>
                    {suffix}
                  </span>

</div>


                  <span style={{
                    fontSize: '20px',
                    
                    color: periodStyle.color,
                    margin: 0,
                    fontWeight: '600',
                    marginLeft: '10px',
                  }}>
                    Period
                  </span>

                  




                      </div>
                    );
                  })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
<div style={{width: '90%', background: '#f4f4f4', height: '2px',marginLeft: 'auto', marginRight: 'auto', marginTop: '-20px'}}/>
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
    width: "100%", 
    position: 'absolute', bottom: '60px' ,
    paddingLeft: "20px",
    marginBottom: "20px",
  }}
>
  {/* Home Link */}
  <Link
    to={homeRoute}
    style={{
      display: "flex",
      alignItems: "center",
      padding: "1% 0",
      width: "90%",
      textDecoration: "none",
      color: getCurrentPage() === "Home" ? linkColors["Home"] : "#A1A1A1",
      borderRight: getCurrentPage() === "Home"
        ? `4px solid ${linkColors["Home"]}`
        : "4px solid transparent",
      marginBottom: "15px",
      transition: "border-right 0.3s, color 0.3s",
      cursor: "pointer",
    }}
  >
    <div style={{ marginRight: "10px" }}>
      <Home
        size={20} // 5px smaller than other icons
        strokeWidth={getCurrentPage() === "Home" ? 2.5 : 2}
        color={getCurrentPage() === "Home" ? linkColors["Home"] : "#A1A1A1"}
      />
    </div>
    <span
      style={{
        fontFamily: "'montserrat', sans-serif",
        fontWeight: "600",
        fontSize: '15px', // 5px smaller than other text
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
      marginLeft: '-10px',
      boxSizing: "border-box",
      borderTop: "1px solid #ddd",
    }}
  />

  {/* Tutorials Link */}
  <Link
    to="/tutorials"
    style={{
      display: "flex",
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
        fontSize: '12px',
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
        fontSize: '12px',
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
    marginLeft: '5%',
    boxSizing: "border-box",
    borderTop: "1px solid #ddd",
    display: "flex",
    alignItems: "center",
    gap: "10px"
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
      .map(name => name[0])
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
          <TeacherAssignmentHome onClose={() => setShowCreateDropdown(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Navbar;
