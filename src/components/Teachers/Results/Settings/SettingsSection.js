import { doc, getDoc, writeBatch } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { db } from "../../../Universal/firebase";
import { Trash2, X, SquareArrowOutUpRight, Folder, Check } from "lucide-react";
import { CustomSwitch, GlassContainer } from "../../../../styles";
import { useNavigate } from "react-router-dom";
import { formatDate } from "../../Create/DateSettings";
import ExportSettings from "./ExportSettings";
import AddToFolderSettings from "./AddToFolderSettings";
import ConfirmationModal from "../../../Universal/ConfirmationModal";
import { 
  AssignmentName,
  TimerSection,
  QuestionCountSection,
  DateSettingsElement,
  GradingScale,
  SecuritySettingsElement,
  PreferencesSection,
  ToggleSwitch
} from "../../Create/Elements";

const DeleteConfirmation = ({ onConfirm, onCancel, assignmentName }) => {
  const [holdProgress, setHoldProgress] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const holdTimerRef = useRef(null);

  const handleHoldStart = () => {
    const startTime = Date.now();
    holdTimerRef.current = setInterval(() => {
      const progress = Math.min(((Date.now() - startTime) / 3000) * 100, 100);
      setHoldProgress(progress);
      if (progress >= 100) {
        clearInterval(holdTimerRef.current);
        setIsDeleting(true);
        onConfirm().finally(() => {
          setIsDeleting(false);
        });
      }
    }, 10);
  };

  const handleHoldEnd = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
    }
    setHoldProgress(0);
  };

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
      }
    };
  }, []);

  return (
    <ConfirmationModal
      title={`Delete "${assignmentName}"?`}
      message="This action cannot be undone. All student responses and grades will be permanently deleted."
      onConfirm={() => {}}
      onCancel={onCancel}
      onHoldStart={handleHoldStart}
      onHoldEnd={handleHoldEnd}
      confirmText="Delete"
      confirmVariant="red"
      confirmColor="#ef4444"
      showHoldToConfirm={true}
      holdProgress={holdProgress}
      isLoading={isDeleting}
    />
  );
};


const SettingsSection = ({ 
  assignmentId, 
  classId,
  assignmentName,
  setAssignmentName,
  assignmentSettings,
  updateAssignmentSetting,
  timer,
  setTimer,
  timerOn,
  handleTimerToggle,
  handleTimerChange
}) => {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [localName, setLocalName] = useState(assignmentName);
  const [assignDate, setAssignDate] = useState(new Date(assignmentSettings.assignDate));
  const [dueDate, setDueDate] = useState(new Date(assignmentSettings.dueDate));
  const [showSaved, setShowSaved] = useState(false);
  const savedTimerRef = useRef(null);
  
  const showSavedIndicator = () => {
    setShowSaved(true);
    if (savedTimerRef.current) {
      clearTimeout(savedTimerRef.current);
    }
    savedTimerRef.current = setTimeout(() => {
      setShowSaved(false);
    }, 2000);
  };

  const handleInputChange = (value) => {
    setLocalName(value);
  };
  
  const handleNameUpdate = async (newName = localName) => {
    if (newName === assignmentName) return;
    
    try {
      const classRef = doc(db, 'classes', classId);
      const assignmentRef = doc(db, 'assignments', assignmentId);
      
      const batch = writeBatch(db);
      
      batch.update(assignmentRef, { assignmentName: newName });
      
      const classDoc = await getDoc(classRef);
      if (classDoc.exists()) {
        const classData = classDoc.data();
        const assignments = classData.assignments || [];
        
        const updatedAssignments = assignments.map(assignment => {
          if (assignment.id === assignmentId) {
            return {
              ...assignment,
              name: newName
            };
          }
          return assignment;
        });
        
        batch.update(classRef, {
          assignments: updatedAssignments
        });
      }
      
      await batch.commit();
      setAssignmentName(newName);
      showSavedIndicator();
    } catch (error) {
      console.error('Error updating assignment name:', error);
      setLocalName(assignmentName);
    }
  };

  const handleAssignDateChange = (date) => {
    setAssignDate(date);
    updateAssignmentSetting('assignDate', formatDate(date));
    showSavedIndicator();
  };

  const handleDueDateChange = (date) => {
    setDueDate(date);
    updateAssignmentSetting('dueDate', formatDate(date));
    showSavedIndicator();
  };

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <GlassContainer>
          <GlassContainer size={1}>
      <div style={{ width: '490px', padding: '30px' }}>
        <AssignmentName 
          value={localName}
          onChange={(value) => {
            handleInputChange(value);
            handleNameUpdate(value);
          }}
          onBlur={() => handleNameUpdate(localName)}
          maxLength={25}
        />

        <DateSettingsElement
          assignDate={assignDate}
          setAssignDate={handleAssignDateChange}
          dueDate={dueDate}
          setDueDate={handleDueDateChange}
        />

                  <TimerSection
          timerOn={timerOn}
          timer={timer}
          onTimerChange={(value) => {
            handleTimerChange(value);
            showSavedIndicator();
          }}
          onToggle={handleTimerToggle}
        />

        <QuestionCountSection
          studentCount={assignmentSettings.questionCount?.student || '5'}
          onStudentChange={(value) => {
            updateAssignmentSetting('questionCount', {
              ...assignmentSettings.questionCount,
              student: value
            });
            showSavedIndicator();
          }}
        />


        <SecuritySettingsElement
          saveAndExit={assignmentSettings.saveAndExit}
          setSaveAndExit={(value) => {
            updateAssignmentSetting('saveAndExit', value);
            showSavedIndicator();
          }}
          lockdown={assignmentSettings.lockdown}
          setLockdown={(value) => {
            updateAssignmentSetting('lockdown', value);
            showSavedIndicator();
          }}
          onViolation={assignmentSettings.onViolation || 'pause'}
          setOnViolation={(value) => {
            updateAssignmentSetting('onViolation', value);
            showSavedIndicator();
          }}
        />

        <ToggleSwitch
          label="Half Credit"
          value={assignmentSettings.halfCredit}
          onChange={(value) => {
            updateAssignmentSetting('halfCredit', value);
            showSavedIndicator();
          }}
        />
                               <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                  <button
                    onClick={() => setShowExportModal(true)}
                    style={{
                      backgroundColor: "transparent",
                      color: "grey",
                      padding: "5px 15px",
                      border: "1px solid #ddd",
                      alignItems: 'center',
                      fontFamily: "'montserrat', sans-serif",
                      borderRadius: "40px",
                      cursor: "pointer",
                      height: '30px',
                      fontWeight: "400",
                      fontSize: '.9rem',
                      display: 'flex',
                      gap: '10px'
                    }}
                  >
                    <SquareArrowOutUpRight size={16} strokeWidth={1.5}/> <p>Export</p>
                  </button>

                  <button
                    onClick={() => setShowFolderModal(true)}
                    style={{
                      backgroundColor: "transparent",
                      color: "grey",
                      padding: "5px 15px",
                      border: "1px solid #ddd",
                      alignItems: 'center',
                      fontFamily: "'montserrat', sans-serif",
                      borderRadius: "40px",
                      cursor: "pointer",
                      height: '30px',
                      fontWeight: "400",
                      fontSize: '.9rem',
                      display: 'flex',
                      gap: '10px'
                    }}
                  >
                    <Folder size={16} strokeWidth={1.5}/> <p>Add to Folder</p>
                  </button>

                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    style={{
                      backgroundColor: "transparent",
                      color: "grey",
                      padding: "5px 15px",
                      border: "1px solid #ddd",
                      alignItems: 'center',
                      fontFamily: "'montserrat', sans-serif",
                      borderRadius: "40px",
                      cursor: "pointer",
                      height: '30px',
                      fontWeight: "400",
                      fontSize: '.9rem',
                      display: 'flex',
                      gap: '10px'
                    }}
                  >
                    <Trash2 size={16} strokeWidth={1.5}/> <p>Delete Assignment</p>
                  </button>
                </div>

                {/* Saved Indicator */}
          
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-60px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                 
                    opacity: showSaved ? 1 : 0,
                    transition: 'opacity 0.3s ease-in-out',
                    pointerEvents: 'none'
                  }}
                >
                        <GlassContainer variant="green"
                size={0}
                  contentStyle={{   display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',}}>
                      <div style={{display: 'flex', gap: '8px'}}>
                  <Check size={16} color="#16a34a" />
                  <span style={{ 
                    color: '#16a34a',
                    fontSize: '0.875rem',
                    fontFamily: "'montserrat', sans-serif",
                    fontWeight: '500'
                  }}>
                    Changes saved
                  </span>
                  </div>
                  </GlassContainer>
                </div>
      </div>
  {showExportModal && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'white',
              borderRadius: '35px',
              zIndex: 10
            }}>
              <ExportSettings
                assignmentId={assignmentId}
                onClose={() => setShowExportModal(false)}
              />
            </div>
          )}
          

          {showFolderModal && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'white',
              borderRadius: '35px',
              zIndex: 10
            }}>
              <AddToFolderSettings
                assignmentId={assignmentId}
                classId={classId}
                onClose={() => setShowFolderModal(false)}
              />
            </div>
          )}
          
      </GlassContainer>
      </GlassContainer>

     
                  {showDeleteConfirm && (
            <DeleteConfirmation
              assignmentName={assignmentName}
              onCancel={() => setShowDeleteConfirm(false)}
              onConfirm={async () => {
                try {
                  const batch = writeBatch(db);
                  
                  // Delete the assignment document
                  const assignmentRef = doc(db, 'assignments', assignmentId);
                  batch.delete(assignmentRef);

                  // Update the class document to remove the assignment
                  const classRef = doc(db, 'classes', classId);
                  const classDoc = await getDoc(classRef);
                  if (classDoc.exists()) {
                    const classData = classDoc.data();
                    const updatedAssignments = (classData.assignments || []).filter(a => a.id !== assignmentId);
                    batch.update(classRef, { assignments: updatedAssignments });
                  }

                  await batch.commit();
                  navigate(`/class/${classId}/`);
                } catch (error) {
                  console.error("Error deleting assignment:", error);
                  alert("Failed to delete assignment. Please try again.");
                }
              }}
            />
          )}

        
    </div>
  );
};

export default SettingsSection;