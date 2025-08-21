import { doc, getDoc, writeBatch } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { db } from "../../../Universal/firebase";
import { Trash2, X, SquareArrowOutUpRight, Folder } from "lucide-react";
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
  const holdTimerRef = useRef(null);

  const handleHoldStart = () => {
    let startTime = Date.now();
    
    holdTimerRef.current = setInterval(() => {
      const progress = Math.min(((Date.now() - startTime) / 3000) * 100, 100);
      setHoldProgress(progress);
      
      if (progress >= 100) {
        clearInterval(holdTimerRef.current);
        onConfirm();
      }
    }, 10);
  };

  const handleHoldEnd = () => {
    setHoldProgress(0);
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
    }
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
      onConfirm={handleHoldStart}
      onCancel={() => {
        handleHoldEnd();
        onCancel();
      }}
      confirmText="Delete"
      confirmVariant="red"
      confirmColor="#ef4444"
      showHoldToConfirm={true}
      holdProgress={holdProgress}
      confirmStyle={{
        onMouseUp: handleHoldEnd,
        onMouseLeave: handleHoldEnd,
        onTouchEnd: handleHoldEnd
      }}
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
  
  const handleInputChange = (e) => {
    setLocalName(e.target.value);
  };
  
  const handleNameUpdate = async () => {
    if (localName === assignmentName) return;
    
    try {
      const classRef = doc(db, 'classes', classId);
      const assignmentRef = doc(db, 'assignments', assignmentId);
      
      const batch = writeBatch(db);
      
      batch.update(assignmentRef, { assignmentName: localName });
      
      const classDoc = await getDoc(classRef);
      if (classDoc.exists()) {
        const classData = classDoc.data();
        const assignments = classData.assignments || [];
        
        const updatedAssignments = assignments.map(assignment => {
          if (assignment.id === assignmentId) {
            return {
              ...assignment,
              name: localName
            };
          }
          return assignment;
        });
        
        batch.update(classRef, {
          assignments: updatedAssignments
        });
      }
      
      await batch.commit();
      setAssignmentName(localName);
    } catch (error) {
      console.error('Error updating assignment name:', error);
      setLocalName(assignmentName);
    }
  };

  const handleAssignDateChange = (date) => {
    setAssignDate(date);
    updateAssignmentSetting('assignDate', formatDate(date));
  };

  const handleDueDateChange = (date) => {
    setDueDate(date);
    updateAssignmentSetting('dueDate', formatDate(date));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <GlassContainer>
          <GlassContainer size={1}>
      <div style={{ width: '490px', padding: '30px' }}>
        <AssignmentName 
          value={localName}
          onChange={handleInputChange}
          onBlur={handleNameUpdate}
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
          onTimerChange={handleTimerChange}
          onToggle={handleTimerToggle}
        />

        <QuestionCountSection
          studentCount={assignmentSettings.questionCount?.student || '5'}
          onStudentChange={(value) => updateAssignmentSetting('questionCount', {
            ...assignmentSettings.questionCount,
            student: value
          })}
        />


        <SecuritySettingsElement
          saveAndExit={assignmentSettings.saveAndExit}
          setSaveAndExit={(value) => updateAssignmentSetting('saveAndExit', value)}
          lockdown={assignmentSettings.lockdown}
          setLockdown={(value) => updateAssignmentSetting('lockdown', value)}
          onViolation={assignmentSettings.onViolation || 'pause'}
          setOnViolation={(value) => updateAssignmentSetting('onViolation', value)}
        />

        <ToggleSwitch
          label="Half Credit"
          value={assignmentSettings.halfCredit}
          onChange={(value) => updateAssignmentSetting('halfCredit', value)}
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
                  navigate(`/class/${classId}/assignments`);
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