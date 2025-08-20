import React, { useState, useEffect, useRef } from 'react';
import { doc, collection, writeBatch, getDocs, query, where, getDoc } from 'firebase/firestore';
import { db, auth } from '../../Universal/firebase';
import { serverTimestamp, arrayUnion } from 'firebase/firestore';
import { SquareArrowOutUpRight, Check } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { GlassContainer } from '../../../styles';
import { useAuthState } from 'react-firebase-hooks/auth';

const Exports = ({ assignmentId, style }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [teacherData, setTeacherData] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const timeoutRef = useRef(null);
  const containerRef = useRef(null);
  const [user] = useAuthState(auth);

  const periodStyles = {
    1: { variant: 'teal', color: "#1EC8bc", borderColor: "#83E2F5" },
    2: { variant: 'purple', color: "#8324e1", borderColor: "#cf9eff" },
    3: { variant: 'orange', color: "#ff8800", borderColor: "#f1ab5a" },
    4: { variant: 'yellow', color: "#ffc300", borderColor: "#Ecca5a" },
    5: { variant: 'green', color: "#29c60f", borderColor: "#aef2a3" },
    6: { variant: 'blue', color: "#1651d4", borderColor: "#b5ccff" },
    7: { variant: 'pink', color: "#d138e9", borderColor: "#f198ff" },
    8: { variant: 'red', color: "#c63e3e", borderColor: "#ffa3a3" },
  };

  useEffect(() => {
    const fetchTeacherData = async () => {
      if (!user) return;

      try {
        // First get the teacher document
        const teacherRef = doc(db, 'teachers', user.uid);
        const teacherSnap = await getDoc(teacherRef);
        
        if (teacherSnap.exists()) {
          const teacherData = teacherSnap.data();
          
          // Then fetch all classes where this teacher is the owner
          const classesQuery = query(
            collection(db, 'classes'),
            where('teacherUID', '==', user.uid)
          );
          
          const classesSnap = await getDocs(classesQuery);
          const classes = [];
          
          classesSnap.forEach((doc) => {
            classes.push({
              id: doc.id,
              ...doc.data()
            });
          });
          
          setTeacherData({
            ...teacherData,
            classes: classes
          });
        }
      } catch (error) {
        console.error("Error fetching teacher data:", error);
      }
    };

    fetchTeacherData();
  }, [user]);

  const getPeriodNumber = (className) => {
    const match = className.match(/Period (\d)/);
    return match ? parseInt(match[1]) : null;
  };

  const handleClassSelect = async (classId) => {
    try {
      const batch = writeBatch(db);
      
      // Get the assignment data
      const assignmentRef = doc(db, 'assignments', assignmentId);
      const assignmentDoc = await getDoc(assignmentRef);
      
      if (!assignmentDoc.exists()) {
        console.error("Assignment not found");
        return;
      }
      const timestamp = Date.now();
      const assignmentData = assignmentDoc.data();
      const format = assignmentId.split('+').pop();
      const newDraftId = `${classId}+${timestamp}+${format}`;
      
      // Create the draft document
      const draftRef = doc(db, 'drafts', newDraftId);
      const draftData = {
        ...assignmentData,
        classId: classId,
        selectedStudents: [],
        createdAt: serverTimestamp(),
        questions: assignmentData.questions || {},
      };
      delete draftData.id;
      
      // Set the draft document
      batch.set(draftRef, draftData);

      // Update the class document to add to drafts array
      const classRef = doc(db, 'classes', classId);
      batch.update(classRef, {
        drafts: arrayUnion({
          id: newDraftId,
          name: assignmentData.assignmentName || 'Untitled Assignment'
        })
      });
      
      await batch.commit();
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 1000);
      setShowDropdown(false); // Close dropdown after successful export
    } catch (error) {
      console.error("Error during export:", error);
    }
  };

  useEffect(() => {
    if (showDropdown) {
      setDropdownVisible(true);
    } else {
      const timer = setTimeout(() => {
        setDropdownVisible(false);
      }, 200); // Match transition duration
      return () => clearTimeout(timer);
    }
  }, [showDropdown]);

  useEffect(() => {
    if (exportSuccess) {
      setSuccessVisible(true);
      const timer = setTimeout(() => {
        setExportSuccess(false);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setSuccessVisible(false);
      }, 200); // Match transition duration
      return () => clearTimeout(timer);
    }
  }, [exportSuccess]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsHovered(true);
    setShowDropdown(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false);
      setShowDropdown(false);
    }, 300);
  };

  const handleDropdownEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleDropdownLeave = () => {
    setIsHovered(false);
    setShowDropdown(false);
  };
  const getOrdinalSuffix = (num) => {
    const number = parseInt(num);
    if (number === 1) return "st";
    if (number === 2) return "nd";
    if (number === 3) return "rd";
    return "th";
  };
  return (
    <div 
      ref={containerRef} 
      style={{ 
        position: 'relative',
        ...style 
      }}
      onMouseLeave={handleDropdownLeave}
    >
      <button
        onMouseEnter={handleMouseEnter}
        style={{
          width: '85px',
          height: '30px', 
          marginTop: '60px',
          borderRadius: '5px',
       
          fontWeight: 'bold',
          border: '1px solid white',
          backgroundColor: isHovered ? 'white' : 'transparent',
          color: isHovered ? '#2BB514' : 'grey',
          cursor: 'pointer',
          transition: 'all 0.3s',
          fontSize:'12px',
          justifyContent: 'center',
          display: 'flex',
          alignItems: 'center',
        }}>
         
        <SquareArrowOutUpRight strokeWidth={2.5} size={12} style={{ marginTop: 0, }} />
        <h1 style={{fontSize: '14px', marginLeft: '10px ', fontFamily:  "'montserrat', sans-serif", fontWeight: '600'}}>Export</h1>
      </button>

      {dropdownVisible && (
        <GlassContainer
          variant="clear"
          size={1}
          style={{
            position: 'absolute',
            top: '95px',
            right: '-250px',
            width: '620px',
            zIndex: 1000,
            maxHeight: '400px',
            opacity: showDropdown ? 1 : 0,
            transform: showDropdown ? 'translateY(0)' : 'translateY(-10px)',
            transition: 'opacity 0.2s ease, transform 0.2s ease',
          }}
          contentStyle={{
            padding: '10px',
            
            overflow: 'hidden',
          }}
        >
          <h1 style={{
            fontWeight: '500', 
            fontSize: '.8rem', 
            marginLeft: '20px',
            marginBottom: '0px',
            fontFamily: "'montserrat', sans-serif",
            color: 'lightgrey'
          }}>
            Click on Class to Export
          </h1>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '15px',
            padding: '10px'
          }}>
            {teacherData?.classes
              ?.sort((a, b) => (a.period || 0) - (b.period || 0))
              .map((classItem) => {
              const periodNumber = classItem.period || 1;
              const periodStyle = periodStyles[periodNumber] || { variant: 'clear', color: 'grey', borderColor: '#ddd' };
               
              return (
                <GlassContainer
                  key={classItem.id}
                  variant={periodStyle.variant}
                  size={1}
                  onClick={() => handleClassSelect(classItem.id)}
                  style={{
                    width: '180px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                  contentStyle={{
                    padding: '10px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <div style={{display: 'flex', alignItems: 'center'}}>
                    <h1 style={{
                      fontSize: '20px',
                      color: periodStyle.color,
                      fontWeight: '600',
                      margin: 0,
                    }}>
                      Period {periodNumber}
                      
                     
                    </h1>
                  </div>

                  <div style={{
                    fontFamily: "'montserrat', sans-serif",
                    fontWeight: "500",
                    color: periodStyle.borderColor,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize: '.7rem',
                    marginTop: '5px'
                  }}>
                    {classItem.classChoice}
                  </div>
                </GlassContainer>
              );
            })}
          </div>
        </GlassContainer>
      )}

      {successVisible && (
        <GlassContainer
          variant="green"
          size={1}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1000,
            opacity: exportSuccess ? 1 : 0,
            transform: exportSuccess ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 0.2s ease, transform 0.2s ease',
          }}
          contentStyle={{
            padding: '6px 24px',
            display: 'flex',
color: 'green', 
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div style={{display: 'flex'}}>
          
          <span style={{
            fontFamily: "'montserrat', sans-serif",
            fontWeight: '600',
            marginRight: '10px'
          }}>
            Successfully exported
          </span>
          <Check size={20} />
          </div>
        </GlassContainer>
      )}
    </div>
  );
};

export default Exports;