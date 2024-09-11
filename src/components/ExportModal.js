import React, { useState, useEffect } from 'react';
import { doc, getDoc, writeBatch, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from './firebase';
import { useParams } from 'react-router-dom';
import { arrayUnion, serverTimestamp } from 'firebase/firestore';
const ExportModal = () => {
  const [showExportModal, setShowExportModal] = useState(false);
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const { assignmentId } = useParams();

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

  const handleClassSelect = (classId) => {
    setSelectedClasses(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const formatQuestion = (question) => {
    const choiceKeys = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const formattedQuestion = {
      questionId: question.questionId || `question_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      question: question.question || '',
      difficulty: question.difficulty || 'medium',
      correct: question.correct || '',
      choices: question.choices || choiceKeys.filter(key => question[key]).length
    };

    // Add individual choice texts and explanations
    choiceKeys.forEach(key => {
      if (question[key]) {
        formattedQuestion[key] = question[key];
        formattedQuestion[`explanation_${key}`] = question[`explanation_${key}`] || '';
      }
    });

    return formattedQuestion;
  };

  const handleExport = async () => {
    const batch = writeBatch(db);
  
    try {
      const assignmentRef = doc(db, 'assignments(Amcq)', assignmentId);
      const assignmentDoc = await getDoc(assignmentRef);
      if (!assignmentDoc.exists()) {
        console.error("Assignment not found");
        return;
      }
      const assignmentData = assignmentDoc.data();
  
      for (const selectedClassId of selectedClasses) {
        const newDraftId = `${selectedClassId}+${Date.now()}+AMCQ`;
        const draftRef = doc(db, 'drafts', newDraftId);
  
        const draftData = {
          ...assignmentData,
          classId: selectedClassId,
          selectedStudents: [],
          createdAt: serverTimestamp(),
          questions: assignmentData.questions.map(formatQuestion),
        };
        delete draftData.id;
  
        batch.set(draftRef, draftData);
  
        const classRef = doc(db, 'classes', selectedClassId);
        batch.update(classRef, {
          [`assignment(amcq)`]: arrayUnion(newDraftId)
        });
      }
  
      await batch.commit();
      setShowExportModal(false);
      console.log("Export completed successfully");
    } catch (error) {
      console.error("Error during export:", error);
    }
  };
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

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(250, 250, 250, 0.5)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 101,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '30px',
        width: '1000px',
        maxHeight: '80vh',
        border: '10px solid #EF8FFF',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }} onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={() => setShowExportModal(false)}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            fontFamily: "'Radio Canada', sans-serif",
            fontWeight: 'bold',
            fontSize: '40px',
            background: 'none',
            border: 'none',
            color: '#EF8FFF',
            cursor: 'pointer',
            zIndex: 1,
          }}
        >
          X
        </button>
        <h2 style={{
          textAlign: 'center',
          padding: '10px',
          margin: 0,
          backgroundColor: '#F8CFFF',
          color: '#E01FFF',
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: '58px',
          borderBottom: '10px solid #EF8FFF',
        }}>
          Export
        </h2>
        
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-around',
          padding: '20px',
          overflowY: 'auto'
        }}>
          {teacherClasses.map((classItem) => {
            const periodNumber = getPeriodNumber(classItem.className);
            const periodStyle = periodStyles[periodNumber] || { background: '#F4F4F4', color: 'grey' };
            
            return (
              <div 
                key={classItem.id}
                onClick={() => handleClassSelect(classItem.id)}
                style={{
                  width: '280px',
                  height: '140px',
                  margin: '15px',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <div style={{
                  width: '268px',
                  height: '30px',
                  border: `4px solid ${periodStyle.color}`,
                  backgroundColor: periodStyle.background,
                  color: periodStyle.color,
                  borderTopLeftRadius: '15px',
                  borderTopRightRadius: '15px',
                  fontFamily: "'Radio Canada', sans-serif",
                  fontWeight: 'bold',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {classItem.classChoice}
                </div>
                <div style={{
                  width: '268px',
                  height: '90px',
                  border:'4px solid #f4f4f4',
                  borderTop: 'none',
                  borderBottomLeftRadius: '15px',
                  borderBottomRightRadius: '15px',
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 'bold',
                  fontSize: '40px',
                  color: 'grey',
                  transition: '.6s',
                  boxShadow: selectedClasses.includes(classItem.id) ? '0px 4px 4px 0px rgb(239, 143, 255,.4 )' : 'none',
                }}>
                  <p style={{ marginTop: '40px' , userSelect: 'none'}}>{classItem.className}</p>
                </div>
              </div>
            );
          })}
        </div>
        <p style={{
          width: '900px',
          marginLeft: 'auto',
          fontFamily: "'Radio Canada', sans-serif",
          marginRight: 'auto',
          fontWeight: 'bold',
          color:'#9E9E9E',
          fontSize: '22px',
          marginTop: '-15px',
          marginBottom: '-70px'
        }}>
          Exported assignments become drafts in selected classes. To make them available to students, publish them from the Drafts tab on each class's Assignments page.
        </p>
            
        <div style={{
          marginTop: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          padding: '20px',
        }}>
          <button 
            onClick={handleExport}
            disabled={selectedClasses.length === 0}
            style={{
              backgroundColor:  '#F8CFFF',
              color:  selectedClasses.length > 0 ? '#E01FFF' : ' #EF8FFF',
              fontSize: '30px',
              padding: '10px 40px',
              marginLeft: 'auto',
              marginRight: 'auto',
              marginBottom: '-10px',
              marginTop: '40px',
              border: selectedClasses.length > 0 ? '4px solid #E01FFF' : '4px solid #EF8FFF',
              fontFamily: "'Radio Canada', sans-serif",
              fontWeight:'bold',
              borderRadius: '10px',
              cursor: selectedClasses.length > 0 ? 'pointer' : 'not-allowed'
            }}
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;