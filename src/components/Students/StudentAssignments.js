import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db, auth } from '../Universal/firebase';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../Universal/Navbar';
import { ArrowRight, CalendarClock, CalendarX2, BookOpen, BookOpenCheck, Eye, EyeOff, SquareMinus, SquareCheck, SquareDashedBottom, SquareX, Check, ChevronDown, Search, ListFilter, CalendarArrowDown, CalendarArrowUp, ArrowDownAZ, ArrowUpAZ, ArrowDown10, ArrowUp01, X, Pause, CircleDashed, Minus } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import Tooltip from '../Teachers/TeacherAssignments/AssignmentsToolTip';
import { flushSync } from 'react-dom';
import { color } from 'framer-motion';
import GradeProgressionChart from '../Teachers/Results/TeacherStudentView/GradeProgressionChart';
import { GlassContainer } from '../../styles';
function StudentAssignmentsHome({ studentUid: propStudentUid }) {
  const { classId } = useParams();
  const [assignments, setAssignments] = useState([]);
  const studentUid = propStudentUid || auth.currentUser.uid;
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const isActiveOrCompleted = activeTab === 'active' || activeTab === 'completed';
  const [isHovered, setIsHovered] = useState(false);
  const [assignmentsPaused, setAssignmentsPaused] = useState([]);
  const [specialDates, setSpecialDates] = useState({});
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);
  const [unavailableAssignment, setUnavailableAssignment] = useState(null);

  // Add scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // U
  const [completedAssignments, setCompletedAssignments] = useState([]);
  const [averageScore, setAverageScore] = useState(null);
  const [mostRecentScore, setMostRecentScore] = useState(null);
  const [classChoice, setClassChoice] = useState('');
  const [showDueDate, setShowDueDate] = useState(true);
  const [hoveredAssignment, setHoveredAssignment] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
const [confirmAssignment, setConfirmAssignment] = useState(null);
const [studentName, setStudentName] = useState('');
const [textSize, setTextSize] = useState(40);
const [calculatedAverage, setCalculatedAverage] = useState(0);
const [hoveredAssignmentId, setHoveredAssignmentId] = useState(null);
const [isGradeExpanded, setIsGradeExpanded] = useState(true);
const [classPeriod, setClassPeriod] = useState(4);
  const [showFiltersPopup, setShowFiltersPopup] = useState(false);
  const [sortOrder, setSortOrder] = useState('new-old'); // Default sort
  const [alphabeticalOrder, setAlphabeticalOrder] = useState(null); // 'a-z' or 'z-a' or null
  const [gradeOrder, setGradeOrder] = useState(null); // 'high-low' or 'low-high' or null
  const [searchTerm, setSearchTerm] = useState('');
  const filtersRef = useRef(null);

  // Handle clicking outside of filters popup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target)) {
        setShowFiltersPopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update handlers
  const handleSortOrderChange = (order) => {
    setSortOrder(order);
    setAlphabeticalOrder(null);
    setGradeOrder(null);
  };

  const handleAlphabeticalToggle = (order) => {
    if (alphabeticalOrder === order) {
      setAlphabeticalOrder(null);
    } else {
      setAlphabeticalOrder(order);
      setGradeOrder(null);
    }
  };

  const handleGradeOrderToggle = (order) => {
    if (gradeOrder === order) {
      setGradeOrder(null);
    } else {
      setGradeOrder(order);
      setAlphabeticalOrder(null);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter and sort completed assignments
  const getFilteredCompletedAssignments = () => {
    let filtered = [...completedAssignments];
    const now = new Date();
    const overdueAssignments = assignments.filter(a => new Date(a.dueDate) < now && !completedAssignments.find(c => c.id === a.id));

    // Combine completed and overdue assignments
    filtered = [
      ...filtered,
      ...overdueAssignments.map(assignment => ({
        ...assignment,
        isOverdue: true,
        submittedAt: { toDate: () => new Date(assignment.dueDate) }
      }))
    ];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((item) =>
        (item.assignmentName || item.name).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    if (alphabeticalOrder === 'a-z') {
      filtered.sort((a, b) => (a.assignmentName || a.name).localeCompare(b.assignmentName || b.name));
    } else if (alphabeticalOrder === 'z-a') {
      filtered.sort((a, b) => (b.assignmentName || b.name).localeCompare(a.assignmentName || a.name));
    } else if (gradeOrder === 'high-low') {
      filtered.sort((a, b) => ((b.score || 0) - (a.score || 0)));
    } else if (gradeOrder === 'low-high') {
      filtered.sort((a, b) => ((a.score || 0) - (b.score || 0)));
    } else if (sortOrder === 'new-old') {
      filtered.sort((a, b) => b.submittedAt.toDate() - a.submittedAt.toDate());
    } else if (sortOrder === 'old-new') {
      filtered.sort((a, b) => a.submittedAt.toDate() - b.submittedAt.toDate());
    }

    return filtered;
  };

  // Update initial tab setting
useEffect(() => {
  const path = location.pathname;
  if (path.includes('/active')) {
    setActiveTab('active');
  } else if (path.includes('/completed')) {
    setActiveTab('completed');
  } else if (path.includes('/upcoming')) {
    setActiveTab('upcoming');
  } else {
    // Default to active if no specific tab in URL
    setActiveTab('active');
  }
}, [location.pathname]);

// Update URL when tab changes



useEffect(() => {
  const fetchStudentData = async () => {
    try {
      const studentDoc = await getDoc(doc(db, 'students', studentUid));
      if (studentDoc.exists()) {
        const userData = studentDoc.data();
        const fullName = `${userData.firstName} ${userData.lastName}`;
        setStudentName(fullName);
        
        // Find the matching class from the classes array
        const classData = userData.classes?.find(c => c.classId.split('/')[0] === classId);
        if (classData) {
          setClassChoice(`${classData.classChoice}`);
          setClassPeriod(classData.period);
        }
        
        // Adjust text size based on name length
        const baseSize = 40;
        const adjustedSize = Math.min(baseSize, (baseSize * 20) / fullName.length);
        setTextSize(adjustedSize);
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
    }
  };

  fetchStudentData();
}, [studentUid, classId]);


const studentUID = auth.currentUser.uid;
  useEffect(() => {
    // Disable right-click
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    const handleKeyDown = (e) => {
      if (
        e.keyCode === 123 || // F12
        (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) || // Ctrl+Shift+I or Ctrl+Shift+J
        (e.ctrlKey && e.keyCode === 85) // Ctrl+U
      ) {
        e.preventDefault();
      }
    };

    // Detect if DevTools is open
    const detectDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      
      if (widthThreshold || heightThreshold) {
        // Optionally, you can redirect or take other actions here
        console.log('DevTools detected');
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    // Check for DevTools periodically
    const interval = setInterval(detectDevTools, 1000);

    // Cleanup function
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      clearInterval(interval);
    };
  }, []);
  useEffect(() => {
    let unsubscribeClass;
    
    const fetchAssignments = async () => {
      try {
        const studentDocRef = doc(db, 'students', studentUid);
        const studentDoc = await getDoc(studentDocRef);
        
        if (studentDoc.exists()) {
          const studentData = studentDoc.data();
          const assignmentsToTake = studentData.assignmentsToTake || [];
          const assignmentsInProgress = studentData.assignmentsInProgress || [];
          const assignmentsPaused = studentData.assignmentsPaused || [];
          const specialDates = studentData.specialDates || {};
          
          setAssignmentsPaused(assignmentsPaused);
  
          // Set up real-time listener for class document
          const classRef = doc(db, 'classes', classId);
          unsubscribeClass = onSnapshot(classRef, async (classDoc) => {
            if (classDoc.exists()) {
              const classData = classDoc.data();
              const viewableAssignments = classData.viewableAssignments || [];
              
              // Filter assignments for this class
              const classAssignments = assignmentsToTake.filter(assignmentId => 
                assignmentId.startsWith(classId)
              );
              
              const inProgressAssignments = assignmentsInProgress.filter(assignmentId => 
                assignmentId.startsWith(classId)
              );
              
              const allAssignmentIds = [...new Set([
                ...classAssignments,
                ...inProgressAssignments,
                ...assignmentsPaused.filter(id => id.startsWith(classId))
              ])];
              
              // Fetch all assignment documents
              const assignmentPromises = allAssignmentIds.map(async (assignmentId) => {
                const assignmentDocRef = doc(db, 'assignments', assignmentId);
                const assignmentDoc = await getDoc(assignmentDocRef);
                
                if (assignmentDoc.exists()) {
                  const assignmentData = assignmentDoc.data();
                  
                  // Check if this assignment has a special date for this student
                  const specialDueDate = specialDates[assignmentId];
                  const dueDate = specialDueDate ? new Date(specialDueDate) : assignmentData.dueDate;
                  
                  return {
                    id: assignmentId,
                    ...assignmentData,
                    dueDate, // Override with special date if it exists
                    inProgress: assignmentsInProgress.includes(assignmentId),
                    isPaused: assignmentsPaused.includes(assignmentId),
                    viewable: viewableAssignments.includes(assignmentId),
                    hasSpecialDate: !!specialDueDate // Flag to indicate if this is a special date
                  };
                }
                return null;
              });
              
              const assignmentDetails = await Promise.all(assignmentPromises);
              const filteredAssignments = assignmentDetails.filter(assignment => assignment !== null);
              setAssignments(filteredAssignments);
            }
          });
        }
      } catch (error) {
        console.error("Error fetching assignments:", error);
      }
    };
  
    fetchAssignments();
    
    // Cleanup
    return () => {
      if (unsubscribeClass) {
        unsubscribeClass();
      }
    };
  }, [classId, studentUid]);


  const getAssignmentStatus = (assignment) => {
    const now = new Date();
    const assignDate = new Date(assignment.assignDate);
    
    if (assignDate > now) {
      return {
        text: "Upcoming",
        icon: <CalendarClock size={16} color="#858585" strokeWidth={1.5} />,
        variant: 'clear',
        clickable: false
      };
    }
    if (assignment.isPaused) {
      return {
        text: "Paused",
        icon: <Pause size={16} color="#FFA500" strokeWidth={1.5} />,
        variant: 'orange',
        clickable: false
      };
    }
    if (assignment.inProgress) {
      return {
        text: "In Progress",
        icon: <CircleDashed size={16} color="orange" strokeWidth={1.5} />,
        variant: 'yellow',
        clickable: true
      };
    }
    return {
      text: "Not Started",
      icon: <Minus size={16} color="#858585" strokeWidth={1.5} />,
      variant: 'clear',
      clickable: true
    };
  };

  

  const fetchCompletedAssignments = async () => {
    try {
      const [studentDoc, classDoc] = await Promise.all([
        getDoc(doc(db, 'students', studentUid)),
        getDoc(doc(db, 'classes', classId))
      ]);
      
      if (!studentDoc.exists()) return;
  
      const studentData = studentDoc.data();
      const classData = classDoc.exists() ? classDoc.data() : {};
      const viewableAssignments = classData.viewableAssignments || [];
      const classGrades = studentData[`class_${classId}`]?.grades || {};
  
      const gradesArray = Object.entries(classGrades).map(([assignmentId, gradeData]) => {
        const parts = assignmentId.split('+');
        const format = parts[parts.length - 1];
        
        return {
          id: assignmentId,
          assignmentId: assignmentId,
          ...gradeData,
          type: format,
          submittedAt: gradeData.submittedAt,
          percentageScore: gradeData.score,
          viewable: viewableAssignments.includes(assignmentId)
        };
      });
  
      const sortedGrades = gradesArray.sort((a, b) => 
        b.submittedAt.toDate() - a.submittedAt.toDate()
      );
  
      setCompletedAssignments(sortedGrades);
      
      if (sortedGrades.length > 0) {
        const totalScore = sortedGrades.reduce((sum, grade) => sum + grade.score, 0);
        setCalculatedAverage(Math.round(totalScore / sortedGrades.length));
      }
    } catch (error) {
      console.error("Error fetching completed assignments:", error);
    }
  };
  useEffect(() => {
    fetchCompletedAssignments();
  }, [classId, studentUid]);
  // Helper function to parse the format from the document ID

  
  
  
  const navigateToTest = async (assignmentId, format, assignDate, dueDate, assignmentName, saveAndExit, lockdown) => {
    const now = new Date();
    const assignDateTime = new Date(assignDate);
    const dueDateTime = new Date(dueDate);
  
    if (now < assignDateTime) {
      alert("This assignment is not available yet.");
      return;
    }
  
    if (now > dueDateTime) {
      alert("This assignment is past due.");
      return;
    }
  
    // Check if the assignment is paused
    const progressRef = doc(db, 'assignments(progress)', `${assignmentId}_${studentUid}`);
    const progressDoc = await getDoc(progressRef);
    
    if (progressDoc.exists() && progressDoc.data().status === 'Paused') {
      alert("This assignment is currently paused by your teacher.");
      return;
    }
  
    setConfirmAssignment({ id: assignmentId, format, assignmentName, saveAndExit, lockdown });
    setShowConfirm(true);
  };

  // Add new states at the top of the component
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const holdTimerRef = useRef(null);

  // Add hold handlers
  const handleHoldStart = () => {
    setIsHolding(true);
    let startTime = Date.now();
    
    holdTimerRef.current = setInterval(() => {
      const progress = Math.min(((Date.now() - startTime) / 1500) * 100, 100);
      setHoldProgress(progress);
      
      if (progress >= 100) {
        clearInterval(holdTimerRef.current);
        setShowConfirm(false);
        const format = confirmAssignment.id.split('+')[2];
        
        let path = '';
        if (format === 'AMCQ') {
          path = `/TakeAmcq/${confirmAssignment.id}`;
        } else if (format === 'ASAQ') {
          path = `/TakeAsaq/${confirmAssignment.id}`;
        } else if (format === 'MCQ') {
          path = `/TakeMcq/${confirmAssignment.id}`;
        } else if (format === 'OE') {
          path = `/taketests/${confirmAssignment.id}`;
        }

        navigate(path, { state: { allowAccess: true }, replace: true });
      }
    }, 10);
  };

  const handleHoldEnd = () => {
    setIsHolding(false);
    setHoldProgress(0);
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
    }
  };

  // Add cleanup effect
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
      }
    };
  }, []);

  // Update RetroConfirm component
  const RetroConfirm = ({ onConfirm, onCancel, assignmentName, saveAndExit, lockdown }) => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(5px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <GlassContainer
        variant="clear"
        size={2}
        style={{
          width: '400px',
          backgroundColor: 'white'
        }}
        contentStyle={{
          padding: '30px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          userSelect: 'none'
        }}
      >
        <h2 style={{
          margin: 0,
          fontSize: '1.5rem',
          fontWeight: '400',
          color: 'black',
          fontFamily: "'Montserrat', sans-serif"
        }}>
          Enter {assignmentName}?
        </h2>
        <p style={{
          margin: '20px 0px',
          fontSize: '1rem',
          width: '100%',
          color: 'grey',
          fontFamily: "'Montserrat', sans-serif"
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
            <div style={{ 
              fontWeight: '500',
              width: '100%',
              display: 'flex',
              alignItems: 'center'
            }}>
              Format:
              <FormatDisplay format={confirmAssignment.format} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px',  borderBottom: '1px solid #ddd', paddingBottom: '10px'}}>
            <span style={{ 
              color:  'grey',
              fontWeight: '500',
              marginRight: 'auto'
            }}>
              Save & Exit:
            </span>
            {saveAndExit ? (
              <Check size={18} color="#2BB514" strokeWidth={2} />
            ) : (
              <X size={18} color="grey" strokeWidth={2} />
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ 
              color:  'grey',
              fontWeight: '500',
              marginRight: 'auto'
            }}>
              Lockdown Mode:
            </span>
            {lockdown ? (
              <Check size={18} color="#2BB514" strokeWidth={2} />
            ) : (
              <X size={18} color="grey" strokeWidth={2} />
            )}
          </div>
        </p>
        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onCancel}
            style={{
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '50px',
              padding: '5px 15px',
              color: 'grey',
              cursor: 'pointer',
              fontSize: '.9rem',
              fontWeight: '400',
              width: '100px',
              fontFamily: "'Montserrat', sans-serif"
            }}
          >
            Cancel
          </button>
          <div style={{ position: 'relative', width: '150px' }}>
            <GlassContainer
              onMouseDown={handleHoldStart}
              onMouseUp={handleHoldEnd}
              onMouseLeave={handleHoldEnd}
              onTouchStart={handleHoldStart}
              onTouchEnd={handleHoldEnd}
              variant="green"
              size={0}
              style={{
                width: '100%',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
              contentStyle={{
                padding: '5px 15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                zIndex: 2
              }}
            >
              <span style={{
                color: '#2BB514',
                fontSize: '.9rem',
                fontWeight: '400',
                fontFamily: "'Montserrat', sans-serif"
              }}>
                Enter (Hold)
              </span>
              {isHolding && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${holdProgress}%`,
                  backgroundColor: 'rgba(43, 181, 20, 0.1)',
                  transition: 'width 0.01s linear',
                  zIndex: 1
                }} />
              )}
            </GlassContainer>
          </div>
        </div>
      </GlassContainer>
    </div>
  );

const ResultsUnavailableModal = ({ assignmentName, onClose }) => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(5px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <GlassContainer
      variant="clear"
      size={2}
      style={{
        width: '400px',
        backgroundColor: 'white'
      }}
      contentStyle={{
        padding: '30px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        userSelect: 'none'
      }}
    >
      <h2 style={{
        margin: 0,
        fontSize: '1.5rem',
        fontWeight: '400',
        color: 'black',
        fontFamily: "'Montserrat', sans-serif"
      }}>
        Unable to View Results For "{assignmentName}""
      </h2>
      <p style={{
        margin: '10px 0px',
        fontSize: '1rem',
        width: '100%',
        color: 'grey',
        lineHeight: '1.3',
        fontFamily: "'Montserrat', sans-serif"
      }}>
       Your teacher must open the assignment for review. A <GlassContainer

                      variant='blue'
                      size={0}
                      contentStyle={{padding: '2px 4px'}}
                      style={{zIndex: '1'}}
                    > <Eye size={16} color="#020CFF" style={{ verticalAlign: 'middle' }} /> 
                    </GlassContainer> will appear next to the assignment when reviewable:   
      </p>
      <div style={{
        display: 'flex',
        gap: '10px',
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={onClose}
          style={{
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '50px',
            padding: '5px 15px',
            color: 'grey',
            cursor: 'pointer',
            fontSize: '.9rem',
            fontWeight: '400',
            width: '100px',
            fontFamily: "'Montserrat', sans-serif"
          }}
        >
          Close
        </button>
      </div>
    </GlassContainer>
  </div>
);

  const filterAssignments = (assignments) => {
    const now = new Date();
    
    return {
      active: assignments.filter(a => {
        const dueDate = new Date(a.dueDate);
        // Include both active and upcoming assignments
        return dueDate >= now;
      })
    };
  };

  const filteredAssignments = filterAssignments(assignments);

  const getLetterGrade = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  
  const renderCompletedAssignments = () => {
    const filteredAssignments = getFilteredCompletedAssignments();
    
    return (
      <>
        {showUnavailableModal && (
          <ResultsUnavailableModal
            assignmentName={unavailableAssignment?.assignmentName}
            onClose={() => {
              setShowUnavailableModal(false);
              setUnavailableAssignment(null);
            }}
          />
        )}

        {/* Assignments List */}
        <div style={{ 
          display: 'flex',
          marginLeft: "-2%",
          marginTop: '40px',
          flexDirection: 'column',
          position: 'relative',
          gap: '1px',
        }}>
          {/* Search and Filters Section */}
          <div style={{
            width: '96%',
            margin: '15px 4%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            {/* Filters */}
            <div style={{
              display: 'flex',
              gap: '15px',
              position: 'relative',
              alignItems: 'center',
            }}>
              {/* Tab Title */}
              <h2 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: '400',
                color: 'grey',
                fontFamily: "'Montserrat', sans-serif",
                paddingRight: '15px',
                borderRight: '1px solid #ddd'
              }}>
                Completed
              </h2>

              {/* Filter Icon and Popup */}
              <div ref={filtersRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowFiltersPopup(!showFiltersPopup)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#858585',
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: '14px',
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <ListFilter size={18} color="#858585" />
                  Sort & Filter
                </button>

                {/* Filters Popup */}
                {showFiltersPopup && (
                  <GlassContainer
                    variant="clear"
                    size={1}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: '0',
                      marginTop: '10px',
                      minWidth: '200px',
                      zIndex: 1000
                    }}
                    contentStyle={{
                      padding: '20px'
                    }}
                  >
                    {/* Sort Options */}
                    <div style={{ marginBottom: '15px' }}>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#858585', 
                        marginBottom: '8px',
                        fontFamily: "'Montserrat', sans-serif",
                      }}>
                        SORT BY
                      </div>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}>
                        <button
                          onClick={() => handleSortOrderChange('new-old')}
                          style={{
                            width: 'calc(50% - 4px)',
                            padding: '8px 12px',
                            border: `1px solid ${sortOrder === 'new-old' ? '#858585' : '#ddd'}`,
                            borderRadius: '100px',
                            background: sortOrder === 'new-old' ? 'rgba(219, 219, 219, 0.1)' : 'white',
                            color: sortOrder === 'new-old' ? '#858585' : 'grey',
                            cursor: 'pointer',
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                          }}
                        >
                          <CalendarArrowDown size={16} />
                        </button>
                        <button
                          onClick={() => handleSortOrderChange('old-new')}
                          style={{
                            width: 'calc(50% - 4px)',
                            padding: '8px 12px',
                            border: `1px solid ${sortOrder === 'old-new' ? '#858585' : '#ddd'}`,
                            borderRadius: '100px',
                            background: sortOrder === 'old-new' ? 'rgba(219, 219, 219, 0.1)' : 'white',
                            color: sortOrder === 'old-new' ? '#858585' : 'grey',
                            cursor: 'pointer',
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                          }}
                        >
                          <CalendarArrowUp size={16} />
                        </button>
                        <button
                          onClick={() => handleAlphabeticalToggle('a-z')}
                          style={{
                            width: 'calc(50% - 4px)',
                            padding: '8px 12px',
                            border: `1px solid ${alphabeticalOrder === 'a-z' ? '#858585' : '#ddd'}`,
                            borderRadius: '100px',
                            background: alphabeticalOrder === 'a-z' ? 'rgba(219, 219, 219, 0.1)' : 'white',
                            color: alphabeticalOrder === 'a-z' ? '#858585' : 'grey',
                            cursor: 'pointer',
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                          }}
                        >
                          <ArrowDownAZ size={16} />
                        </button>
                        <button
                          onClick={() => handleAlphabeticalToggle('z-a')}
                          style={{
                            width: 'calc(50% - 4px)',
                            padding: '8px 12px',
                            border: `1px solid ${alphabeticalOrder === 'z-a' ? '#858585' : '#ddd'}`,
                            borderRadius: '100px',
                            background: alphabeticalOrder === 'z-a' ? 'rgba(219, 219, 219, 0.1)' : 'white',
                            color: alphabeticalOrder === 'z-a' ? '#858585' : 'grey',
                            cursor: 'pointer',
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                          }}
                        >
                          <ArrowUpAZ size={16} />
                        </button>
                        <button
                          onClick={() => handleGradeOrderToggle('high-low')}
                          style={{
                            width: 'calc(50% - 4px)',
                            padding: '8px 12px',
                            border: `1px solid ${gradeOrder === 'high-low' ? '#858585' : '#ddd'}`,
                            borderRadius: '100px',
                            background: gradeOrder === 'high-low' ? 'rgba(219, 219, 219, 0.1)' : 'white',
                            color: gradeOrder === 'high-low' ? '#858585' : 'grey',
                            cursor: 'pointer',
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                          }}
                        >
                          <ArrowDown10 size={16} />
                        </button>
                        <button
                          onClick={() => handleGradeOrderToggle('low-high')}
                          style={{
                            width: 'calc(50% - 4px)',
                            padding: '8px 12px',
                            border: `1px solid ${gradeOrder === 'low-high' ? '#858585' : '#ddd'}`,
                            borderRadius: '100px',
                            background: gradeOrder === 'low-high' ? 'rgba(219, 219, 219, 0.1)' : 'white',
                            color: gradeOrder === 'low-high' ? '#858585' : 'grey',
                            cursor: 'pointer',
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                          }}
                        >
                          <ArrowUp01 size={16} />
                        </button>
                      </div>
                    </div>
                  </GlassContainer>
                )}
              </div>

              {/* Active Options Display */}
              <div style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
              }}>
                {/* Sort Display */}
                {(sortOrder || alphabeticalOrder || gradeOrder) && (
                  <button
                    style={{
                      padding: '6px 12px',
                      paddingRight: '30px',
                      border: '1px solid #ddd',
                      borderRadius: '100px',
                      background: 'rgba(219, 219, 219, 0.1)',
                      color: '#858585',
                      cursor: 'pointer',
                      fontFamily: "'Montserrat', sans-serif",
                      fontSize: '12px',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    onClick={() => setShowFiltersPopup(true)}
                  >
                    {sortOrder === 'new-old' ? (
                      <>
                        <CalendarArrowDown size={14} /> Newest First
                      </>
                    ) : sortOrder === 'old-new' ? (
                      <>
                        <CalendarArrowUp size={14} /> Oldest First
                      </>
                    ) : alphabeticalOrder === 'a-z' ? (
                      <>
                        <ArrowDownAZ size={14} /> A to Z
                      </>
                    ) : alphabeticalOrder === 'z-a' ? (
                      <>
                        <ArrowUpAZ size={14} /> Z to A
                      </>
                    ) : gradeOrder === 'high-low' ? (
                      <>
                        <ArrowDown10 size={14} /> Highest Grade First
                      </>
                    ) : (
                      <>
                        <ArrowUp01 size={14} /> Lowest Grade First
                      </>
                    )}
                    <ChevronDown
                      size={12}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                      }}
                    />
                  </button>
                )}
              </div>
            </div>

            {/* Search */}
            <div style={{
              position: 'relative',
              width: '300px',
              border: '1px solid #ddd',
              borderRadius: '1rem'
            }}>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search assignments..."
                style={{
                  width: '80%',
                  padding: '8px 12px',
                  paddingLeft: '40px',
                  border: 'none',
                  outline: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: "'Montserrat', sans-serif",
                  background: 'transparent',
                }}
              />
              <Search 
                size={20} 
                color="#858585" 
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
            </div>
          </div>


          {filteredAssignments.map((grade) => {
            const isOverdue = grade.isOverdue;
            const percentage = !isOverdue ? Math.round(
              grade.type === 'MC*' ? grade.score :
              grade.type === 'MC' ? (grade.score) * 100 :
              grade.percentageScore
            ) : null;

            const displayGrade = {
              letter: percentage !== null && !isNaN(percentage) ? calculateLetterGrade(percentage) : 'Z',
              percentage: percentage !== null && !isNaN(percentage) ? `${percentage}%` : '00%'
            };

            return (
              <div key={grade.id} 
                style={{
                  backgroundColor:  'white',
                  height: '70px',
                  width: '96%',
                  margin: '0% 2%',
                  padding: '0% 2%',
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: '1px solid #ddd',
                  cursor: !isOverdue && grade.viewable ? 'pointer' : 'default',
                  transition: '.3s',
                  position: 'relative'
                }}
                onMouseEnter={() => setHoveredAssignmentId(grade.id)}
                onMouseLeave={() => setHoveredAssignmentId(null)}
                onClick={() => {
                  if (!isOverdue) {
                    if (grade.viewable) {
                      navigate(`/studentresults${grade.type === 'MC*' ? 'mcq' : (grade.type === 'OE' ? '' : 'AMCQ')}/${grade.assignmentId || grade.id}/${studentUID}/${classId}`);
                    } else {
                      setUnavailableAssignment(grade);
                      setShowUnavailableModal(true);
                    }
                  }
                }}
              >
                <div style={{ 
                  width: '350px',
                  fontWeight: '500',
                  fontSize: '1rem',
                  gap: "0px",
                  display: 'flex',
                  alignItems: 'center' ,
                  fontFamily: "'montserrat', sans-serif",
                }}>
                  <div>
                  {grade.assignmentName}   
                  </div>
                   <div style={{
                  fontSize: '.8rem',
                  fontWeight: '500',
                  width: '50px',
                  marginLeft: '10px',
                  textAlign: 'left',
                  color: grade.type === 'MC*' ? '#7D00EA' : (grade.type === 'OE' ? '#00CCB4 ' : '#7D00EA'),
                }}>
                  {grade.type}
                </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-evenly',
                  flex: 1,
                  marginLeft: '20px',
                  marginRight: '20px'
                }}>
                  <GlassContainer
                    variant={isOverdue ? 'clear' : getGradeColors(percentage).variant}
                    size={0}
                    style={{
                      margin: 0,
                                            zIndex: '2'
                    }}
                    contentStyle={{
                      padding: '2px 8px',
                      display: 'flex',
                      width: '60px',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <div style={{display:'flex', gap:'8px'}}>
                      <span style={{
                        fontSize: '.8rem',
                        color: isOverdue ? 'grey' : getGradeColors(percentage).color,
                        fontWeight: '500'
                      }}>
                        {displayGrade.letter}
                      </span>
                      <span style={{
                        width: '1px',
                        marginTop: '3px',
                        background: isOverdue ? 'grey' : getGradeColors(percentage).color,
                        height: '10px',
                      }}/>
                      <span style={{
                        fontSize: '.8rem',
                        color: isOverdue ? 'grey' : getGradeColors(percentage).color,
                        fontWeight: '500'
                      }}>
                        {displayGrade.percentage}
                      </span>
                    </div>
                  </GlassContainer>

                  <div style={{
                    display: 'flex',
                    color: 'grey',
                    fontStyle: 'italic',
                    fontWeight: '500',
                    textAlign: 'left',
                    width: '240px',
                    gap: '5px',
                  }}>
                    <span style={{
                      fontSize: '.8rem',
                      marginTop: '2px'
                    }}>
                      {isOverdue ? 'Due: ' : 'Completed: '}
                      {grade.submittedAt ? new Date(grade.submittedAt.toDate()).toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      }) : 'N/A'}
                    </span>
                  </div>
                </div>
                <div style={{
                }}>
                  
                  {isOverdue ? (
                    <GlassContainer
                      variant='red'
                      size={0}
                      contentStyle={{padding: '2px 4px'}}
                      style={{zIndex: '1'}}
                    >
                      <CalendarX2 
                        size={16} 
                        color="#c63e3e" 
                        strokeWidth={1.5}
                      />
                    </GlassContainer>
                  ) : grade.viewable ? (
                    <GlassContainer
                      variant='blue'
                      size={0}
                      contentStyle={{padding: '2px 4px'}}
                      style={{zIndex: '1'}}
                    >
                      <Eye 
                        size={16} 
                        color="#020CFF" 
                        strokeWidth={1.5}
                      />
                    </GlassContainer>
                  ) : (
                    <EyeOff 
                      size={16} 
                      color="transparent" 
                      strokeWidth={1.5}
                      style={{padding: '4px 6px'}}
                    />
                  )}
                </div>
             
              </div>
            );
          })}
        </div>
      </>
    );
  };



const StatusIcon = ({ status }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div style={{ position: 'relative', marginRight: '4%' }}>
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <GlassContainer
          variant={status.variant}
          size={0}
          contentStyle={{ padding: '2px 4px' }}
          style={{ zIndex: '1' }}
        >
          {status.icon}
        </GlassContainer>
      </div>
      <div
        style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(245, 245, 245, 0.8)',
          color: 'grey',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          whiteSpace: 'nowrap',
          opacity: showTooltip ? 1 : 0,
          transition: 'opacity 0.2s ease',
          pointerEvents: 'none',
          zIndex: 2,
          marginTop: '5px'
        }}
      >
        {status.text}
      </div>
    </div>
  );
};

const FormatDisplay = ({ format }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const getFormatInfo = () => {
    switch(format) {
      case 'OE':
        return {
          abbr: 'OE',
          color: '#00CCB4',
          fullName: 'Open Ended',
          isAdaptive: false
        };
      case 'ASAQ':
        return {
          abbr: 'OE',
          color: '#00CCB4',
          fullName: 'Open Ended Adaptive',
          isAdaptive: true
        };
      case 'MCQ':
        return {
          abbr: 'MC',
          color: '#7D00EA',
          fullName: 'Multiple Choice',
          isAdaptive: false
        };
      case 'AMCQ':
        return {
          abbr: 'MC',
          color: '#7D00EA',
          fullName: 'Multiple Choice Adaptive',
          isAdaptive: true
        };
      default:
        return {
          abbr: '',
          color: 'grey',
          fullName: '',
          isAdaptive: false
        };
    }
  };

  const formatInfo = getFormatInfo();

  return (
    <div style={{ 
      position: 'relative',
      marginLeft: 'auto',
      display: 'flex',
      alignItems: 'center'
    }}
    onMouseEnter={() => setShowTooltip(true)}
    onMouseLeave={() => setShowTooltip(false)}
    >
      <span style={{ color: formatInfo.color }}>
        {formatInfo.abbr}
        {formatInfo.isAdaptive && <span style={{ color: '#F4C10A' }}>*</span>}
      </span>
      {showTooltip && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(245, 245, 245, 0.8)',
          color: 'grey',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          whiteSpace: 'nowrap',
          opacity: 1,
          transition: 'opacity 0.2s ease',
          pointerEvents: 'none',
          zIndex: 2,
          marginTop: '5px'
        }}>
          {formatInfo.fullName}
        </div>
      )}
    </div>
  );
};

const renderAssignments = (assignments) => {
  return assignments.map((assignment) => {
    const now = new Date();
    const assignDate = new Date(assignment.assignDate);
    const isUpcoming = assignDate > now;
    const status = getAssignmentStatus(assignment);
    const isClickable = status.clickable && !isUpcoming;

    const format = assignment.id.split('+').pop();
    let formatDisplay;
    if (format === 'OE') { 
      formatDisplay = <span style={{ color: '#00CCB4' }}>OE</span>;
    } else if (format === 'ASAQ') {
      formatDisplay = (
        <span>
          <span style={{ color: '#00CCB4' }}>OE</span>
          <span style={{ color: '#F4C10A' }}>*</span>
        </span>
      );
    } else if (format === 'MCQ') {
      formatDisplay = <span style={{ color: '#7D00EA' }}>MC</span>;
    } else if (format === 'AMCQ') {
      formatDisplay = (
        <span>
          <span style={{ color: '#7D00EA' }}>MC</span>
          <span style={{ color: '#F4C10A' }}>*</span>
        </span>
      );
    }

    const formatDate = (dateString, showDueDate, activeTab) => {
      const date = new Date(dateString);
      const options = {
        weekday: 'short',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };
      return ` ${date.toLocaleDateString('en-US', options)}`;
    };

    
    const listItemStyle = {
     
      color: isUpcoming ? 'grey' : 'black',
      height: '70px',
      display: 'flex',
      alignItems: 'center',
      fontFamily: "'montserrat', sans-serif",
      transition: '.3s',
      listStyleType: 'none',
      width: '92%', 
      textAlign: 'center',
      position: "relative",
     
           padding: '0px 2%',
      borderBottom: `1px solid #ddd ` ,
      cursor: isClickable ? 'pointer' : 'default'
    };
   
      const progressIndicatorStyle = {
        position: 'absolute',
        right: '60px',
        top: '50%',
        color: 'blue',
        transform: 'translateY(-50%)',
        paddingLeft: '15px',
        fontWeight: '500',
        fontFamily: "'montserrat', sans-serif",
        fontSize: '15px',
        borderRadius: '5px',
        height: '21px',
        width: '6px',
        display: 'flex',
        alignItems: 'center'
      };
    
      
    
      const pausedLabelStyle = {
        position: 'absolute',
        top: '15px',
        left: '20px',
        backgroundColor: '#FFA500',
        paddingLeft: '15px',
        fontWeight: '500',
        color: 'white',
        paddingRight: '15px',
        fontFamily: "'montserrat', sans-serif",
        border: '0px solid white',
        fontSize: '18px',
        borderRadius: '5px'
      };
    
      const assignmentNameStyle = {
        display: 'flex',
        alignItems: 'center',
        textAlign: 'left',
        marginLeft: '0%',
        height: '30px',
        width: '40%',
        overflow: 'hidden',
        maxWidth: '320px',
        fontWeight: '500', fontSize: '1rem',
      };
    
      const dateDisplayStyle = {
        color: 'grey',
        fontSize: '12px',
        fontWeight: '500',
        fontFamily: "'montserrat', sans-serif",
       
        marginLeft: '5%', marginRight: '5%',
        width: '270px',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        height: '30px'
      };
    
      const formatDisplayStyle = {
        marginLeft: '10px',
        width: '120px',
fontWeight: '500',
        textAlign: 'left',
        fontSize: '.8rem',
      };
      return (
        <li 
          key={assignment.id}
          style={listItemStyle}
          onMouseEnter={() => isClickable && setHoveredAssignmentId(assignment.id)}
          onMouseLeave={() => setHoveredAssignmentId(null)}
          onClick={() => {
            if (isClickable && !assignment.isPaused) {
              navigateToTest(
                assignment.id,
                format,
                assignment.assignDate,
                assignment.dueDate,
                assignment.assignmentName,
                assignment.saveAndExit,
                assignment.lockdown
              );
            }
          }}
        >
       
          {assignment.inProgress && (
            <div style={progressIndicatorStyle}>
             
              {assignment.status === 'Paused' && (
                <div style={pausedLabelStyle}>
                  Paused
                </div>
              )}
            </div>
          )}

          <div style={assignmentNameStyle}>
          {assignment.assignmentName}
          
          <h1 style={formatDisplayStyle}>
            {formatDisplay}
          </h1>
          </div>
          <h1 style={dateDisplayStyle}>
   Assigned: {formatDate(assignment.assignDate)}</h1>
          <h1 style={dateDisplayStyle}>
   Due: {formatDate(assignment.dueDate)}
   </h1>



          <StatusIcon status={status} />
        </li>
    );
  });
};


const getGradeColors = (grade) => {
  if (grade === undefined || grade === null || grade === 0) return { color: '#858585', variant: 'clear' };
  if (grade < 50) return { color: '#c63e3e', variant: 'red' };
  if (grade < 60) return { color: '#ff8800', variant: 'orange' };
  if (grade < 70) return { color: '#ffc300', variant: 'yellow' };
  if (grade < 80) return { color: '#29c60f', variant: 'green' };
  if (grade < 90) return { color: '#006400', variant: 'darkgreen' };
  return { color: '#f198ff', variant: 'pink' };
};

const calculateLetterGrade = (percentage) => {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
};

const gradeColors = getGradeColors(calculatedAverage);
  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: 'white',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      <Navbar userType="student" />

      {showConfirm && (
        <RetroConfirm 
          onConfirm={() => {
            setShowConfirm(false);
            const format = confirmAssignment.id.split('+')[2];
            
            let path = '';
            if (format === 'AMCQ') {
              path = `/TakeAmcq/${confirmAssignment.id}`;
            } else if (format === 'ASAQ') {
              path = `/TakeAsaq/${confirmAssignment.id}`;
            } else if (format === 'MCQ') {
              path = `/TakeMcq/${confirmAssignment.id}`;
            } else if (format === 'OE') {
              path = `/taketests/${confirmAssignment.id}`;
            }

            navigate(path, { state: { allowAccess: true }, replace: true });
          }}
          onCancel={() => setShowConfirm(false)}
          assignmentName={confirmAssignment ? confirmAssignment.assignmentName : ''}
          saveAndExit={confirmAssignment ? confirmAssignment.saveAndExit : false}
          lockdown={confirmAssignment ? confirmAssignment.lockdown : false}
        />
      )}

      <div style={{ width: 'calc(100% - 200px)', marginLeft: '200px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Fixed Header */}
          <div style={{
            height: '70px',
            background: 'white',
            borderBottom: `1px solid ${isScrolled ? '#ddd' : 'transparent'}`,
            width: 'calc(100% - 200px)',
            position: 'fixed',
            top: 0,
            left: '200px',
            display: 'flex',
            alignItems: 'center',
            transition: 'border-color 0.3s ease',
            zIndex: 10,
            backdropFilter: 'blur(5px)',
            backgroundColor: 'rgba(255, 255, 255, 0.9)'
          }}> 
            <h1 style={{ 
              fontSize: '1.3rem',
              marginLeft: '5%',
              fontFamily: '"montserrat", sans-serif',
              fontWeight: '400',
              transition: 'font-size 0.3s ease',
              textAlign: 'left',
              color: '#2c2c2c'
            }}>
              {classChoice}
            </h1>
         
            <div style={{marginLeft:' 20px', marginRight: '4%'}}>
              <GlassContainer
                size={0}
                
          enableRotation={true}
                style={{
                  zIndex: '2',
                  cursor: "pointer"
                }}
                variant={calculatedAverage ? getGradeColors(calculatedAverage).variant : 'clear'}
                contentStyle={{
                  padding: '5px 10px',
                  textAlign: 'center',
                  display: 'flex',
                  height: '.9rem',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  msUserSelect: 'none',
                }}
                onClick={() => activeTab === 'completed' && setIsGradeExpanded(!isGradeExpanded)}
              >
                <div style={{display: 'flex', marginTop: '-12px'}}>
                  <h1 style={{
                    color: calculatedAverage ? getGradeColors(calculatedAverage).color : '#858585',
                    fontWeight: '500',
                    fontSize: '.9rem',
                    fontFamily: "'Montserrat', sans-serif",
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    msUserSelect: 'none',
                  }}>
                    {calculatedAverage ? `${calculatedAverage}%` : '-'}
                  </h1>
                  {activeTab === 'completed' && (
                    <ChevronDown 
                      size={20} 
                      strokeWidth={1.5}
                      style={{
                        transform: isGradeExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease',
                        color: calculatedAverage ? getGradeColors(calculatedAverage).color : '#858585',
                        marginTop: '10px',
                        marginLeft: '5px',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        msUserSelect: 'none',
                      }}
                    />
                  )}
                </div>
              </GlassContainer>
            </div>
          </div>

          {/* Spacer to prevent content from going under fixed header */}
          <div style={{ height: '50px' }} />

          {/* Graph Section */}
          {activeTab === 'completed' && (
            <div style={{
              height: isGradeExpanded ? '220px' : '0',
              overflow: 'hidden',
              transition: 'height 0.3s ease',
              opacity: isGradeExpanded ? 1 : 0,
            }}>
              {isGradeExpanded && (
                <GradeProgressionChart grades={completedAssignments} period={classPeriod} />
              )}
            </div>
          )}

          {/* Content Section */}
          <ul style={{ listStyleType: 'none', width: '92%' }}>
            {activeTab === 'completed' ? (
              completedAssignments.length === 0 ? (
                <div style={{ textAlign: 'center', fontSize: '20px', fontFamily: "'montserrat', sans-serif", color: 'grey', marginTop: '20px' }}>
                  No completed assignments
                </div>
              ) : (
                renderCompletedAssignments()
              )
            ) : (
              filteredAssignments.active.length === 0 ? (
                <div style={{ textAlign: 'left', fontSize: '20px', fontFamily: "'montserrat', sans-serif", color: 'grey', marginTop: '20px' }}>
                  No active or upcoming assignments
                </div>
              ) : (
                renderAssignments(filteredAssignments.active)
              )
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default StudentAssignmentsHome;
