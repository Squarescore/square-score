import React, { useState, useEffect } from 'react';
import { doc, collection, writeBatch, getDocs, query, where, getDoc } from 'firebase/firestore';
import { db, auth } from '../../Universal/firebase';
import { serverTimestamp, arrayUnion } from 'firebase/firestore';
import { SquareArrowOutUpRight, SquareX } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import ReactDOM from 'react-dom';
const Exports = ({ assignmentId }) => {
  const [showExportModal, setShowExportModal] = useState(false);
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [isHovered, setIsHovered] = useState(false);
  const [assignmentFormat, setAssignmentFormat] = useState('');

  useEffect(() => {
    const fetchTeacherClasses = async () => {
      console.log("Fetching teacher classes...");
      const teacherUID = auth.currentUser.uid;
      const classesRef = collection(db, 'classes');
      const classQuery = query(classesRef, where('teacherUID', '==', teacherUID));
      const querySnapshot = await getDocs(classQuery);
      const classes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log("Fetched classes:", classes);
      setTeacherClasses(classes);
    };

    fetchTeacherClasses();
  }, []);

  useEffect(() => {
    const determineAssignmentFormat = () => {
      const formatMap = {
        SAQ: 'assignments(saq)',
        AMCQ: 'assignments(Amcq)',
        MCQ: 'assignments(mcq)',
        ASAQ: 'assignments(Asaq)'
      };

      const format = assignmentId.split('+').pop();
      const collectionName = formatMap[format] || 'assignments(saq)'; // Default to SAQ if format is not recognized
      setAssignmentFormat(collectionName);
    };

    determineAssignmentFormat();
  }, [assignmentId]);

  const handleExportClick = () => {
    console.log("Export button clicked");
    setShowExportModal(true);
  };

  const handleClassSelect = (classId) => {
    console.log("Class selected/deselected:", classId);
    setSelectedClasses(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const handleExport = async () => {
    console.log("Starting export process");
    const batch = writeBatch(db);
  
    try {
      // Fetch the current assignment data
      const assignmentRef = doc(db, assignmentFormat, assignmentId);
      const assignmentDoc = await getDoc(assignmentRef);
      if (!assignmentDoc.exists()) {
        console.error("Assignment not found");
        return;
      }
      const assignmentData = assignmentDoc.data();
  
      // Extract the format from the assignmentId
      const format = assignmentId.split('+').pop();
  
      // Create a new draft for each selected class
      for (const selectedClassId of selectedClasses) {
        const newDraftId = `${selectedClassId}+${uuidv4()}+${format}`;
        const draftRef = doc(db, 'drafts', newDraftId);
  
        // Prepare the draft data, including questions
        const draftData = {
          ...assignmentData,
          classId: selectedClassId,
          selectedStudents: [], // Clear selected students
          createdAt: serverTimestamp(),
          questions: assignmentData.questions || {}, // Ensure questions are included
        };
        delete draftData.id; // Remove the original assignment ID if it exists
  
        // Set the new draft document
        batch.set(draftRef, draftData);
  
        // Update the class document with the new draft ID
        const classRef = doc(db, 'classes', selectedClassId);
        batch.update(classRef, {
          [`assignment(${format.toLowerCase()})`]: arrayUnion(newDraftId)
        });
      }
  
      // Commit the batch
      await batch.commit();
      console.log("Export completed successfully");
  
      // Close the export modal and show a success message
      setShowExportModal(false);
      // You might want to show a success message to the user here
    } catch (error) {
      console.error("Error during export:", error);
      // Handle the error and show an error message to the user
    }
  };
  const ExportModal = () => {
    const periodStyles = {
      1: { background: '#A3F2ED', color: '#1CC7BC' },
      2: { background: '#F8CFFF', color: '#E01FFF' },
      3: { background: '#FFCEB2', color: '#FD772C' },
      4: { background: '#FFECA9', color: '#F0BC6E' },
      5: { background: '#AEF2A3', color: '#4BD682' },
      6: { background: '#BAA9FF', color: '#8364FF' },
      7: { background: '#8296FF', color: '#3D44EA' },
      8: { background: '#FF8E8E', color: '#D23F3F' }
    };
  
    const getPeriodNumber = (className) => {
      const match = className.match(/Period (\d)/);
      return match ? parseInt(match[1]) : null;
    };
  
    return ReactDOM.createPortal(

      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(250, 250, 250, 0.9)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          width: '1000px',
          maxHeight: '80vh',  
          border: '10px solid white',
          
               boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)' ,
          display: 'flex',
          marginTop: '70px',
          flexDirection: 'column',
          position: 'relative',
        }} onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={() => setShowExportModal(false)}
            
            style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              fontFamily: "'montserrat', sans-serif",
              fontWeight: 'bold',
              fontSize: '40px',
              background: 'none',
              border: 'none',
              color: '#EF8FFF',
              cursor: 'pointer',
              zIndex: 100,
            }}
          >
            <SquareX size={40} color="#2BB514"  strokeWidth={2.5}/>
          </button>
          <div style={{
            padding: '10px',
            marginTop: '0px',
            textAlign: 'left',
            paddingLeft: '40px',
            backgroundColor: '#AEF2A3',
            color: '#2BB514',
            display: 'flex',
            fontWeight: '700',
            fontFamily: "'montserrat', sans-serif",
            fontSize: '35px',
            margin:' -10px -10px -10px -10px',
            borderRadius: ' 20px 20px 0px 0px',
            border: '10px solid #2BB514',
          }}>
            <div style={{width: '50px', marginTop: '5px' }}>
            <SquareArrowOutUpRight strokeWidth={2.5} size={35} /></div>
            Export
          </div>
          
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-around',
            padding: '20px',
          }}>
            {teacherClasses.map((classItem) => {
              const periodNumber = getPeriodNumber(classItem.className);
              const periodStyle = periodStyles[periodNumber] || { background: '#F4F4F4', color: 'grey' };
              
              return (
                <div 
                  key={classItem.id}
                  onClick={() => handleClassSelect(classItem.id)}
                  style={{
                    width: '276px',
                    height: '123px',
                    margin: '15px',
                    cursor: 'pointer',
                    border: selectedClasses.includes(classItem.id) ? '4px solid #AEF2A3' : '4px solid white',
                    paddingLeft: '4px',
                    paddingTop: '6px',
                    borderRadius: '20px',
                    position: 'relative',
                  }}
                >
                  <div style={{
                    width: '245px',
                    height: '30px',
                    border: `6px solid ${periodStyle.color}`,
                    backgroundColor: periodStyle.background,
                    color: periodStyle.color,
                    borderTopLeftRadius: '15px',
                    borderTopRightRadius: '15px',
                    fontFamily: "'montserrat', sans-serif",
                    fontWeight: 'bold',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: '15px',
                    justifyContent: 'left',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {classItem.classChoice}
                  </div>
                  <div style={{
                    width: '260px',
                    height: '70px',
                    border:'6px solid #f4f4f4',
                    borderTop: 'none',
                    borderBottomLeftRadius: '15px',
                    borderBottomRightRadius: '15px',
                    backgroundColor: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'left',
                    fontFamily: "'montserrat', sans-serif",
                    fontWeight: '600',
                    fontSize: '30px',
                    color: 'grey',
                    transition: '.6s',
                  }}>
                    <p style={{ marginTop: '30px' , userSelect: 'none', marginLeft: '15px'}}>{classItem.className}</p>
                  </div>
                </div>
              );
            })}
          </div>
         
          <div style={{
            marginTop: '-30px',
            display: 'flex',
            justifyContent: 'space-between',
            padding: '20px',
          }}>
            <button 
              onClick={handleExport}
              disabled={selectedClasses.length === 0}
              style={{
                backgroundColor:  selectedClasses.length > 0 ? '#AEF2A3' : ' transparent',
                color:  selectedClasses.length > 0 ? '#2BB514' : ' transparent',
                fontSize: '30px',
                padding: '10px 40px',
                marginLeft: '15px',
                marginRight: 'auto',
                marginBottom: '-10px',
                height: '60px',
                marginTop: '25px',
                lineHeight: '25px',
                border: selectedClasses.length > 0 ? '4px solid #2BB514' : '4px solid transparent',
                fontFamily: "'montserrat', sans-serif",
                fontWeight:'bold',
                borderRadius: '10px',
                cursor: selectedClasses.length > 0 ? 'pointer' : 'default'
              }}
            >
              Export
            </button>
            <p style={{
              width: '600px',
              marginLeft: 'auto',
              fontFamily: "'montserrat', sans-serif",
              marginRight: 'auto',
              fontWeight: 'bold',
              color:'#9E9E9E',
              fontSize: '20px',
            }}>
              Exported assignments appear as drafts in chosen classes. To let students access them, publish from each class's Drafts tab.
            </p>
          </div>
        </div>
      </div>,
       document.body // Render the modal at the body level
      );
    };
  return (
    <>
      <button
        onClick={handleExportClick}
        style={{
          width: '65px',
          height: '65px',
          borderRadius: '10px',
          fontWeight: 'bold',
          border: '4px solid transparent',
          background: 'transparent',
          cursor: 'pointer',
          color: 'grey',
          marginTop: '10px',
          marginLeft: '8px',
          transition: '.3s',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '5px',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = '#2BB514';
          e.currentTarget.style.backgroundColor = '#AEF2A3';
          e.currentTarget.style.color = '#2BB514';
          setIsHovered(true);
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'transparent';
          e.currentTarget.style.color = 'grey';
          e.currentTarget.style.backgroundColor = 'transparent';
          setIsHovered(false);
        }}
      >
        <SquareArrowOutUpRight strokeWidth={2.5} size={35} style={{marginTop: '0px', width: '40px'}} />
      </button>
      {showExportModal && <ExportModal />}
    </>
  );
};

export default Exports;