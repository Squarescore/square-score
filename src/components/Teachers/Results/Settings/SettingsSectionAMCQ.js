import React, { useState } from 'react';
import { Trash2, SquareArrowOutUpRight, Folder } from 'lucide-react';
import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../../Universal/firebase';
import { GlassContainer } from '../../../../styles';
import { formatDate } from "../../Create/DateSettings";
import ExportSettings from './ExportSettings';
import AddToFolderSettings from './AddToFolderSettings';
import { 
  AssignmentName,
  TimerSection,
  DateSettingsElement,
  SecuritySettingsElement,
  ToggleSwitch
} from "../../Create/Elements";
const SettingsSectionAMCQ = ({
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
  handleTimerChange,

  onDelete // Added onDelete prop
}) => {
  const [localName, setLocalName] = useState(assignmentName);
  // Initialize dates properly from assignmentSettings
  const [assignDate, setAssignDate] = useState(assignmentSettings?.assignDate ? new Date(assignmentSettings.assignDate) : new Date());
  const [dueDate, setDueDate] = useState(assignmentSettings?.dueDate ? new Date(assignmentSettings.dueDate) : new Date());

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
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);

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
                onClick={onDelete}
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
    </div>
  );
};

export default SettingsSectionAMCQ;