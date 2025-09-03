import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../Universal/firebase';
import { collection, query, where, getDocs, updateDoc, doc, getDoc, onSnapshot, writeBatch } from "firebase/firestore";
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Pencil, SquareX, PencilOff, Timer, Chain, SquareArrowOutUpRight, ChartBarIcon, ChartBarIncreasing, Link } from 'lucide-react';
import Navbar from '../Universal/Navbar';
import CopyLinkButton from './CopyLinkButton';
import GradeReport from './GradeReport';
import { GlassContainer } from '../../styles';
import ConfirmationModal from '../Universal/ConfirmationModal';

const Participants = () => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteHoldProgress, setDeleteHoldProgress] = useState(0);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const deleteHoldTimerRef = useRef(null);

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteHoldStart = () => {
    if (deleteHoldTimerRef.current) {
      clearInterval(deleteHoldTimerRef.current);
    }
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / 3000) * 100, 100);
      setDeleteHoldProgress(progress);
      
      if (progress >= 100) {
        clearInterval(timer);
        setIsDeleting(true);
        handleRemoveStudent(studentToDelete).finally(() => {
          setIsDeleting(false);
          setShowDeleteConfirm(false);
          setStudentToDelete(null);
        });
      }
    }, 10);
    deleteHoldTimerRef.current = timer;
  };

  const handleDeleteHoldEnd = () => {
    if (deleteHoldTimerRef.current) {
      clearInterval(deleteHoldTimerRef.current);
      deleteHoldTimerRef.current = null;
    }
    setDeleteHoldProgress(0);
  };

  useEffect(() => {
    return () => {
      if (deleteHoldTimerRef.current) {
        clearInterval(deleteHoldTimerRef.current);
      }
    };
  }, []);
  const [currentClass, setCurrentClass] = useState({});
  const teacherUID = auth.currentUser.uid;
  const { classId } = useParams();
  const [timeMultipliers, setTimeMultipliers] = useState({});
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isGradeReportOpen, setIsGradeReportOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

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

  const getVariantAndColor = () => {
    // Convert period to number if it's a string, default to 4 if not found
    const periodNumber = currentClass?.period ? Number(currentClass.period) : 4;
    const style = periodStyles[periodNumber] || periodStyles[4];
    return {
      variant: style.variant,
      color: style.color,
      borderColor: style.borderColor
    };
  };

  const navigateToStudentGrades = (studentUid) => {
    navigate(`/class/${classId}/student/${studentUid}/grades`);
  };

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const classDoc = await getDoc(doc(db, 'classes', classId));
        if (!classDoc.exists()) return;
  
        const classData = classDoc.data();
        const processedParticipants = classData.participants || [];
  
        setCurrentClass({
          ...classData,
          participants: processedParticipants,
        });
  
        const timeMultipliersObj = {};
        for (const participant of processedParticipants) {
          timeMultipliersObj[participant.uid] = 
            participant.timeMultiplier !== undefined ? participant.timeMultiplier : 1;
        }
        setTimeMultipliers(timeMultipliersObj);
  
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };
  
    fetchInitialData();
  }, [classId]);

  useEffect(() => {
    if (!classId) return;
  
    let participantUnsubscribers = [];
    const classRef = doc(db, 'classes', classId);
  
    const unsubscribeClass = onSnapshot(classRef, async (snapshot) => {
      if (!snapshot.exists()) return;
  
      const classData = snapshot.data();
      const processedParticipants = classData.participants || [];
  
      setCurrentClass(prev => ({
        ...prev,
        ...classData,
        participants: processedParticipants
      }));
  
      const timeMultipliersObj = {};
      processedParticipants.forEach(participant => {
        timeMultipliersObj[participant.uid] = 
          participant.timeMultiplier !== undefined ? participant.timeMultiplier : 1;
      });
      setTimeMultipliers(timeMultipliersObj);
  
      participantUnsubscribers.forEach(unsubscribe => unsubscribe());
      participantUnsubscribers = [];
  
      processedParticipants.forEach(participant => {
        const unsubscribe = onSnapshot(
          doc(db, 'students', participant.uid),
          (studentSnapshot) => {
            if (studentSnapshot.exists()) {
              const studentData = studentSnapshot.data();
              setTimeMultipliers(prev => {
                if (prev[participant.uid] !== studentData.timeMultiplier) {
                  return {
                    ...prev,
                    [participant.uid]: studentData.timeMultiplier || 1
                  };
                }
                return prev;
              });
            }
          }
        );
        participantUnsubscribers.push(unsubscribe);
      });
    });
  
    return () => {
      unsubscribeClass();
      participantUnsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [classId]);

  const handleTimeMultiplierChange = async (studentUid, multiplier) => {
    const newMultiplier = parseFloat(multiplier) || 1;
  
    try {
      setTimeMultipliers(prev => ({ ...prev, [studentUid]: newMultiplier }));
  
      const batch = writeBatch(db);
      const studentRef = doc(db, 'students', studentUid);
      const classRef = doc(db, 'classes', classId);
  
      batch.update(studentRef, { timeMultiplier: newMultiplier });
  
      const updatedParticipants = currentClass.participants.map(participant =>
        participant.uid === studentUid
          ? { ...participant, timeMultiplier: newMultiplier }
          : participant
      );
      batch.update(classRef, { participants: updatedParticipants });
  
      await batch.commit();
    } catch (error) {
      console.error("Error updating time multiplier:", error);
      setTimeMultipliers(prev => ({ ...prev, [studentUid]: prev[studentUid] }));
    }
  };

  const handleRemoveStudent = async (studentUID) => {
    try {
      const classRef = doc(db, 'classes', classId);
      const updatedParticipants = currentClass.participants.filter(student => student.uid !== studentUID);
      const updatedStudents = currentClass.students.filter(uid => uid !== studentUID);

      await updateDoc(classRef, {
        participants: updatedParticipants,
        students: updatedStudents
      });

      setCurrentClass(prev => ({
        ...prev,
        participants: updatedParticipants,
        students: updatedStudents
      }));
    } catch (error) {
      console.error("Error removing student:", error);
    }
  };

  const removeAccommodations = async (studentUid) => {
    try {
      setTimeMultipliers(prev => ({ ...prev, [studentUid]: 1 }));
  
      const studentRef = doc(db, 'students', studentUid);
      const classRef = doc(db, 'classes', classId);
  
      await Promise.all([
        updateDoc(studentRef, { timeMultiplier: 1 }),
        updateDoc(classRef, {
          participants: currentClass.participants.map(participant =>
            participant.uid === studentUid
              ? { ...participant, timeMultiplier: 1 }
              : participant
          )
        })
      ]);
    } catch (error) {
      console.error("Error removing accommodations:", error);
      setTimeMultipliers(prev => ({ ...prev, [studentUid]: prev[studentUid] }));
    }
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  const handleMoveStudent = async (studentUid, direction) => {
    const participants = [...currentClass.participants];
    const currentIndex = participants.findIndex(p => p.uid === studentUid);
    
    if (direction === 'up' && currentIndex > 0) {
      // Swap with previous student
      const temp = participants[currentIndex];
      participants[currentIndex] = participants[currentIndex - 1];
      participants[currentIndex - 1] = temp;
    } else if (direction === 'down' && currentIndex < participants.length - 1) {
      // Swap with next student
      const temp = participants[currentIndex];
      participants[currentIndex] = participants[currentIndex + 1];
      participants[currentIndex + 1] = temp;
    }

    // Update order field for all participants
    const updatedParticipants = participants.map((p, idx) => ({
      ...p,
      order: idx
    }));

    // Update Firestore
    try {
      const classRef = doc(db, 'classes', classId);
      await updateDoc(classRef, {
        participants: updatedParticipants
      });
    } catch (error) {
      console.error('Error updating student order:', error);
    }
  };

  const sortedParticipants = currentClass.participants
    ? [...currentClass.participants].sort((a, b) =>
        (a.name || '').split(' ').pop().localeCompare((b.name || '').split(' ').pop())
      )
    : [];

  const confirmAndRemoveStudent = (studentUid) => {
    const student = currentClass.participants.find(p => p.uid === studentUid);
    setStudentToDelete(studentUid);
    setShowDeleteConfirm(true);
  };

  const formatName = (fullName) => {
    const parts = fullName.trim().split(' ');
    if (parts.length < 2) return fullName;
    const lastName = parts[parts.length - 1];
    const firstName = parts.slice(0, -1).join(' ');
    return `${lastName}, ${firstName}`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: 'calc(100% - 200px)',
      marginLeft: '200px',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      <Navbar userType="teacher" />
      
      <div style={{ 
        borderBottom: hasScrolled ? '1px solid #ddd' : '1px solid transparent',
        height: '90px',
        position: 'fixed',
        width: 'calc(96% - 200px)',
        paddingRight: '4%',
        background: 'rgb(255,255,255,.9)',
        backdropFilter: 'blur(5px)',
        zIndex: "10",
        transition: 'border-bottom 0.2s ease'
      }}>
        <div style={{ 
          display: 'flex', 
          marginLeft: '4%', 
          height: '30px', 
          paddingTop: '20px',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h1 style={{ fontSize: '1.3rem', fontWeight: '400', marginRight: '10px' }}>Students</h1>
           <GlassContainer variant={getVariantAndColor().variant} size={0} >
            <div style={{
              color: getVariantAndColor().color,
              fontSize: '1rem',
              padding: '5px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
            }}>
              {currentClass.participants ? currentClass.participants.length : 0} 
            </div>
            </GlassContainer>
          </div>

          <div style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}>
            
            <button
              onClick={() => setIsGradeReportOpen(true)}
              style={{
                fontSize: '.9rem',
                color: 'grey',
                backgroundColor: 'transparent',
                border: '1px solid #ddd',
                fontFamily: "'montserrat', sans-serif",
                padding: '5px 15px',
                borderRadius: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: '400'
              }}
            >
              Grade Report
              <ChartBarIncreasing size={16} strokeWidth={2} />
            </button>

            <button
              onClick={toggleEditMode}
              style={{
                fontSize: '.9rem',
                color: 'grey',
                backgroundColor: 'transparent',
                border: '1px solid #ddd',
                fontFamily: "'montserrat', sans-serif",
                padding: '5px 15px',
                borderRadius: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: '400'
              }}
            >
              {isEditing ? (
                <>
                  Done
                  <PencilOff size={16} strokeWidth={2} />
                </>
              ) : (
                <>
                  Edit
                  <Pencil size={16} strokeWidth={2} />
                </>
              )}
            </button>
            <GlassContainer variant={getVariantAndColor().variant} size={0} >
          
            <div style={{
              fontSize: '1.3rem',
              display: 'flex',
              alignItems: 'center',
              color: getVariantAndColor().color,
              letterSpacing: '2px',
              fontFamily: "'montserrat', sans-serif",
              fontWeight: '500',
              padding: '2px 15px',
              gap: '5px',
              borderColor: getVariantAndColor().borderColor
            }}>
              {currentClass.classCode}
              <CopyLinkButton
                classCode={currentClass.classCode}
                period={currentClass.period}
                classChoice={currentClass.classChoice}
                color={getVariantAndColor().color}
              />
            </div>

            </GlassContainer>
          </div>
        </div>
        <div 
                
                
                style={{ padding: '0px 4%', display: 'flex',
    width: '92%', fontWeight: '500',  
          marginTop: '18px',
          background: 'white',
          color: getVariantAndColor().color,
          alignItems: 'center'
        }}>
          {/* Order Column - Only visible in edit mode */}
          {isEditing && (
            <div style={{ 
              width: '50px',
              fontSize: '.8rem',
              fontWeight: '500',
              color: 'lightgrey',
              marginRight: '10px'
            }}>
              Order
            </div>
          )}
          
          {/* Name Column */}
          <div style={{ 
            width: isEditing ? 'calc(30% - 60px)' : '30%',
            fontSize: '.8rem',
            fontWeight: '400',
            color: 'grey'
          }}>
            Name
          </div>

          {/* Email Column */}
          <div style={{ 
            flex: 1,
            marginLeft: '20px',
            fontSize: '.8rem',
            fontWeight: '400',
            color: 'grey'
          }}>
            Email
          </div>

          {/* Time Column */}
          <div style={{ 
            marginRight: isEditing ? '5%' : '1.6%',
            fontSize: '.8rem',
            fontWeight: '400',
            color: 'grey'
          }}>
            Time
          </div>
        </div>


      </div>

 

      <div style={{
        marginTop: '100px',
        marginBottom: '100px',
      }}>
      

        {/* Student List */}
        <div style={{
          marginTop: '-15px',
          marginBottom: '100px',
        }}>
          {currentClass?.participants?.sort((a, b) => {
            // If we're in edit mode or both participants have order field, use order
            if (isEditing || (a.order !== undefined && b.order !== undefined)) {
              return (a.order || 0) - (b.order || 0);
            }
            // If only one has order, prioritize the one with order
            if (a.order !== undefined) return -1;
            if (b.order !== undefined) return 1;
            // Otherwise sort by last name
            const aName = formatName(a.name);
            const bName = formatName(b.name);
            return aName.localeCompare(bName);
          }).map((participant, index) => (
            <div
              key={participant.uid}
              style={{
                display: 'flex',
                margin: '0px 2%',
                padding: '20px 2%',
                alignItems: 'center',
                borderBottom: isEditing ? '1px dashed #ddd' : '1px solid #ededed',
                position: 'relative'
              }}
            >
              {/* Order Controls - Only visible in edit mode */}
              {isEditing && (
                <div style={{ 
                  width: '50px',
                  marginRight: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <div style={{
                    cursor: 'pointer',
                    opacity: index === 0 ? 0.3 : 1,
                    pointerEvents: index === 0 ? 'none' : 'auto'
                  }}
                    onClick={() => handleMoveStudent(participant.uid, 'up')}>
                    ↑
                  </div>
                  <div style={{
                    cursor: 'pointer',
                    opacity: index === currentClass.participants.length - 1 ? 0.3 : 1,
                    pointerEvents: index === currentClass.participants.length - 1 ? 'none' : 'auto'
                  }}
                    onClick={() => handleMoveStudent(participant.uid, 'down')}>
                    ↓
                  </div>
                </div>
              )}

              {/* Name */}
              <div 
                onClick={() => navigateToStudentGrades(participant.uid)}
                style={{ 
                  width: isEditing ? 'calc(30% - 60px)' : '30%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#020CFF';
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'inherit';
                  e.currentTarget.style.textDecoration = 'none';
                }}
              >
                {formatName(participant.name)}
              </div>
              
              {/* Rest of participant row content */}
              <div style={{ 
                flex: 1,
                color: 'grey'
              }}>
                {participant.email}
              </div>

              {/* Extended Time */}
              <div style={{
                marginRight: isEditing ? '8%' : '4%',
                display: 'flex',
                alignItems: 'center'
              }}
              onClick={(e) => e.stopPropagation()}>
                {timeMultipliers[participant.uid] !== 1 && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Timer size={20} color="grey" style={{ marginRight: '5px' }} />
                    {isEditing ? (
                      <input
                        type="number"
                        min="1"
                        value={timeMultipliers[participant.uid]}
                        onChange={(e) => handleTimeMultiplierChange(participant.uid, e.target.value)}
                        style={{
                          width: '50px',
                          height: '25px',
                          marginRight: '5px',
                          textAlign: 'center'
                        }}
                      />
                    ) : (
                      <span>{(timeMultipliers[participant.uid] * 100)}%</span>
                    )}
                    {isEditing && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAccommodations(participant.uid);
                        }}
                        style={{
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          color: 'grey'
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                )}
                {isEditing && timeMultipliers[participant.uid] === 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTimeMultiplierChange(participant.uid, 1.5);
                    }}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <Timer size={20} color="lightgrey" />
                    <span style={{ marginLeft: '5px', color: 'lightgrey' }}>+</span>
                  </button>
                )}
              </div>

              {/* Remove Button */}
              {isEditing && (
                <button
                onClick={(e) => {
                  e.stopPropagation();
                  confirmAndRemoveStudent(participant.uid);
                }}
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    padding: '5px',
                    position: 'absolute',
                    right: '4%'
                  }}
                >
                  <SquareX size={20} color="#e60000" strokeWidth={2} />
                </button>
              )}


            </div>
          ))}
        </div>
      </div>      <GradeReport
        isOpen={isGradeReportOpen}
        onClose={() => setIsGradeReportOpen(false)}
        classId={classId}
      />

      {showDeleteConfirm && studentToDelete && (
        <ConfirmationModal
          title={`Remove ${currentClass.participants.find(p => p.uid === studentToDelete)?.name} from class?`}
          message="This student will lose access to all assignments and their grades in this class."
          onConfirm={() => {}}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setStudentToDelete(null);
          }}
          onHoldStart={handleDeleteHoldStart}
          onHoldEnd={handleDeleteHoldEnd}
          confirmText="Remove"
          confirmVariant="green"
          confirmColor="#29c60f"
          showHoldToConfirm={true}
          holdProgress={deleteHoldProgress}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};

export default Participants;