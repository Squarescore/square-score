import React, { useState, useEffect, useRef } from 'react';
import { doc, collection, writeBatch, getDocs, query, where, getDoc } from 'firebase/firestore';
import { db, auth } from '../../Universal/firebase';
import { serverTimestamp, arrayUnion } from 'firebase/firestore';
import { SquareArrowOutUpRight, Check } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const Exports = ({ assignmentId, style }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [isHovered, setIsHovered] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const timeoutRef = useRef(null);
  const containerRef = useRef(null);

  const periodStyles = {
    1: { background: '#A3F2ED', color: '#1CC7BC', hoverBg: '#D4FFFD' },
    2: { background: '#F8CFFF', color: '#E01FFF', hoverBg: '#FCEDFF' },
    3: { background: '#FFCEB2', color: '#FD772C', hoverBg: '#FFE4D4' },
    4: { background: '#FFECA9', color: '#F0BC6E', hoverBg: '#FFF6D4' },
    5: { background: '#AEF2A3', color: '#4BD682', hoverBg: '#DBFFD6' },
    6: { background: '#BAA9FF', color: '#8364FF', hoverBg: '#F0EDFF' },
    7: { background: '#8296FF', color: '#3D44EA', hoverBg: '#D4DAFF' },
    8: { background: '#FF8E8E', color: '#D23F3F', hoverBg: '#FFD4D4' }
  };

  useEffect(() => {
    const fetchTeacherClasses = async () => {
      const teacherUID = auth.currentUser.uid;
      const classesRef = collection(db, 'classes');
      const classQuery = query(classesRef, where('teacherUID', '==', teacherUID));
      const querySnapshot = await getDocs(classQuery);
      const classes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTeacherClasses(classes);
    };

    fetchTeacherClasses();
  }, []);

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
      
      const assignmentData = assignmentDoc.data();
      const format = assignmentId.split('+').pop();
      const newDraftId = `${classId}+${uuidv4()}+${format}`;
      
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
      setTimeout(() => setExportSuccess(false), 2000);
      setShowDropdown(false); // Close dropdown after successful export
    } catch (error) {
      console.error("Error during export:", error);
    }
  };

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
          width: '100px',
          height: '30px', 
          marginTop: '45px',
          borderRadius: '5px',
       
          fontWeight: 'bold',
          border: '1px solid lightgrey',
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

      {showDropdown && (
        <div 
          onMouseEnter={handleDropdownEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            position: 'absolute',
            top: '70px',
            right: '0px',
            backgroundColor: 'white',
            borderRadius: '20px',
            width: '490px',
            border: '1px solid #DFDFDF',
            padding: '10px',
            zIndex: 1000,
            maxHeight: '400px',
            overflowY: 'auto',
            boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)'
          }}>
          <h1 style={{
            fontWeight: '600', 
            fontSize: '20px', 
            marginLeft: '20px',
            marginBottom: '15px',
            fontFamily: "'montserrat', sans-serif",
            color: 'grey'
          }}>
            Click on Class to Export
          </h1>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '5px',
          }}>
            {teacherClasses.map((classItem) => {
              const periodNumber = getPeriodNumber(classItem.className);
              const periodStyle = periodStyles[periodNumber] || { background: '#F4F4F4', color: 'grey', hoverBg: '#FAFAFA' };
              
              return (
                <div 
                  key={classItem.id}
                  onClick={() => handleClassSelect(classItem.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = periodStyle.hoverBg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                  }}
                  style={{
                    width: '150px',
                    height: '60px',
                    cursor: 'pointer',
                    borderRadius: '10px',
                    position: 'relative',
                    transition: 'all 0.3s',
                    background: 'white',
                    padding: '5px'
                  }}>
                  <div style={{
                    fontFamily: "'montserrat', sans-serif",
                    fontWeight: "600",
                    background: periodStyle.background,
                    height: '12px',
                    marginLeft: '15px',
                    lineHeight: '10px',
                    width: '120px',
                    paddingLeft: '4px',
                    marginBottom: '15px',
                    marginTop: '10px',
                    color: periodStyle.color,
                    fontSize: '25px',
                    whiteSpace: "nowrap"
                  }}>
                    {classItem.className}
                  </div>
                  <div style={{
                    fontFamily: "'montserrat', sans-serif",
                    fontWeight: "600",
                    color: 'lightgrey',
                    marginLeft: '15px',
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize: '14px'
                  }}>
                    {classItem.classChoice}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {exportSuccess && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: '#AEF2A3',
          color: '#2BB514',
          padding: '16px 24px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          zIndex: 1000,
          fontFamily: "'montserrat', sans-serif",
          fontWeight: '600'
        }}>
          <Check size={20} />
          Successfully exported
        </div>
      )}
    </div>
  );
};

export default Exports;