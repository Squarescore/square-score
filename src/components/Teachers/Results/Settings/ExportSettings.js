import React, { useState, useEffect } from 'react';
import { doc, collection, writeBatch, getDocs, query, where, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../Universal/firebase';
import { serverTimestamp, arrayUnion } from 'firebase/firestore';
import { Check, SquareArrowOutUpRight, ArrowLeft } from 'lucide-react';
import { GlassContainer } from '../../../../styles';
import { useAuthState } from 'react-firebase-hooks/auth';

const periodStyles = {
  1: { variant: 'teal', color: "#1EC8bc", borderColor: "#83E2F5" },
  2: { variant: 'purple', color: "#8324e1", borderColor: "#cf9eff" },
  3: { variant: 'orange', color: "#ff8800", borderColor: "#f1ab5a" },
  4: { variant: 'yellow', color: "#ffc300", borderColor: "#Ecca5a" },
  5: { variant: 'green', color: "#29c60f", borderColor: "#aef2a3" },
  6: { variant: 'blue', color: "#1651d4", borderColor: "#b5ccff" },
  7: { variant: 'pink', color: "#d138e9", borderColor: "#f198ff" },
  8: { variant: 'red', color: "#c63e3e", borderColor: "#ffa3a3" }
};

const ExportSettings = ({ assignmentId, onClose }) => {
  const [user] = useAuthState(auth);
  const [teacherData, setTeacherData] = useState(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  useEffect(() => {
    const fetchTeacherData = async () => {
      if (!user) return;

      try {
        const teacherRef = doc(db, 'teachers', user.uid);
        const teacherSnap = await getDoc(teacherRef);
        
        if (teacherSnap.exists()) {
          const teacherData = teacherSnap.data();
          
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

  const handleClassSelect = async (classId) => {
    try {
      const batch = writeBatch(db);
      
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
      
      const draftRef = doc(db, 'drafts', newDraftId);
      const draftData = {
        ...assignmentData,
        classId: classId,
        selectedStudents: [],
        createdAt: serverTimestamp(),
        questions: assignmentData.questions || {},
      };
      delete draftData.id;
      
      batch.set(draftRef, draftData);

      const classRef = doc(db, 'classes', classId);
      batch.update(classRef, {
        drafts: arrayUnion({
          id: newDraftId,
          name: assignmentData.assignmentName || 'Untitled Assignment'
        })
      });
      
      await batch.commit();
      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
        onClose();
      }, 1000);
    } catch (error) {
      console.error("Error during export:", error);
    }
  };

  return (
    <div style={{
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' ,}}>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '5px',
              display: 'flex'
            }}
          >
            <ArrowLeft size={20} color="black"  strokeWidth={1.5} />
          </button>
          <h2 style={{
            margin: 0,
            fontSize: '1.2rem',
            fontWeight: '400',
            color: 'black',
            fontFamily: "'Montserrat', sans-serif"
          }}>
            Export Assignment
          </h2>
        </div>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        
        gap: '20px'
      }}>
              <div style={{
        display: 'grid',
        
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '15px',
        flex: 1
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
                size={0}
                          enableRotation={true}
                onClick={() => handleClassSelect(classItem.id)}
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
                contentStyle={{
                  padding: '15px 30px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: '5px'
                }}
              >
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <h1 style={{
                    fontSize: '26px',
                    color: periodStyle.color,
                    fontWeight: '500',
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
                  fontSize: '.9rem',
                  marginTop: '5px'
                }}>
                  {classItem.classChoice}
                </div>
              </GlassContainer>
            );
          })}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px 10px',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '.9rem',
            fontWeight: '400',
            color: 'grey',
            fontFamily: "'Montserrat', sans-serif",
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SquareArrowOutUpRight size={16} strokeWidth={1.5} />
              <span>Select a class above to create a copy</span>
            </div>
            <span style={{ 
              fontSize: '.8rem', 
              color: 'lightgrey',
              fontStyle: 'italic'
            }}>
              The assignment will appear in drafts
            </span>
          </div>
        </div>
      </div>

      {exportSuccess && (
        <GlassContainer
          variant="green"
          size={0}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1000,
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
              fontWeight: '400',
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

export default ExportSettings;