import { doc, getDoc, writeBatch } from "firebase/firestore";
import { useState } from "react";
import { db } from "../../Universal/firebase";
import DateSettings, { formatDate } from "../Create/DateSettings";

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
    <div style={{
      width: "480px",
      marginLeft: '4%',
      backgroundColor: "white",
      borderRadius: "8px"
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Assignment Name */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#4B5563",
            marginBottom: "8px",
            display: "block"
          }}>
            Assignment Name:
          </label>
          <input
            type="text"
            value={localName}
            onChange={handleInputChange}
            onBlur={handleNameUpdate}
            style={{
              width: "calc(100% - 16px)",
              padding: "8px",
              border: "1px solid #D1D5DB",
              borderRadius: "8px",
              outline: "none",
              boxShadow: "0 0 0 2px transparent",
              transition: "box-shadow 0.2s"
            }}
          />
        </div>

        {/* Date Settings */}
        <DateSettings
          assignDate={assignDate}
          setAssignDate={handleAssignDateChange}
          dueDate={dueDate}
          setDueDate={handleDueDateChange}
        />

        {/* Timer Settings */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <label style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#4B5563"
          }}>Timer:</label>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "16px"
          }}>
            {timerOn && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                position: 'relative', 
                marginLeft: '100px', 
                background:'#f4f4f4', 
                height: '26px', 
                borderRadius: '5px', 
                width:' 130px'
              }}>
                <input
                  type="number"
                  style={{
                    marginLeft: '3px',
                    height: '20px',
                    width: '40px',
                    fontFamily: "'montserrat', sans-serif",
                    textAlign: 'center',
                    fontWeight: '600',
                    border: 'none',
                    outline: 'none',
                    borderRadius: '5px',
                    fontSize: '12px',
                    boxShadow: '1px 1px 5px 1px rgb(0,0,155,.03)'
                  }}
                  placeholder="10"
                  value={timer}
                  onChange={handleTimerChange}
                />
                <h1 style={{ 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  marginLeft: '10px', 
                  color: 'grey' 
                }}>
                  Minutes
                </h1>
              </div>
            )}
            <div style={{ position: 'relative', marginLeft: "auto", marginRight: '-20px' }}>
              <input
                type="checkbox"
                className="greenSwitch"
                checked={timerOn}
                onChange={handleTimerToggle}
                style={{ marginLeft: 'auto', marginRight: '14px' }}
              />
              <span style={{marginRight: '16px'}}>On</span>
            </div>
          </div>
        </div>

        {/* Questions Per Student */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <label style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#4B5563"
          }}>Questions per Student:</label>
          <input
            type="number"
            value={assignmentSettings.questionCount?.student || '5'}
            onChange={(e) => updateAssignmentSetting('questionCount', {
              ...assignmentSettings.questionCount,
              student: e.target.value
            })}
            style={{
              width: "30px",
              padding: "4px",
              border: "1px solid #D1D5DB",
              borderRadius: "4px"
            }}
          />
        </div>

        {/* Half Credit Toggle */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "-20px"
        }}>
          <label style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#4B5563"
          }}>Half Credit:</label>
          <div style={{ position: "relative", marginRight: "4px" }}>
            <input
              type="checkbox"
              className="greenSwitch"
              checked={assignmentSettings.halfCredit}
              onChange={(e) => updateAssignmentSetting('halfCredit', e.target.checked)}
            />
            <span>On</span>
          </div>
        </div>

        {/* Save & Exit Toggle */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "-20px"
        }}>
          <label style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#4B5563"
          }}>Save & Exit:</label>
          <div style={{ position: "relative", marginRight: "4px" }}>
            <input
              type="checkbox"
              className="greenSwitch"
              checked={assignmentSettings.saveAndExit}
              onChange={(e) => updateAssignmentSetting('saveAndExit', e.target.checked)}
            />
            <span>On</span>
          </div>
        </div>

        {/* Lockdown Mode Toggle */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "-20px"
        }}>
          <label style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#4B5563"
          }}>Lockdown Mode:</label>
          <div style={{ position: "relative", marginRight: "4px" }}>
            <input
              type="checkbox"
              className="greenSwitch"
              checked={assignmentSettings.lockdown}
              onChange={(e) => updateAssignmentSetting('lockdown', e.target.checked)}
            />
            <span>On</span>
          </div>
        </div>

        {/* Violation Behavior (only show if lockdown is enabled) */}
        {assignmentSettings.lockdown && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "-20px"
          }}>
            <label style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#4B5563"
            }}>On Violation:</label>
            <select
              value={assignmentSettings.onViolation || 'pause'}
              onChange={(e) => updateAssignmentSetting('onViolation', e.target.value)}
              style={{
                padding: "4px 8px",
                border: "1px solid #D1D5DB",
                borderRadius: "4px",
                marginRight: "4px",
                fontFamily: "'montserrat', sans-serif"
              }}
            >
              <option value="pause">Pause Assignment</option>
              <option value="submit">Submit Assignment</option>
            </select>
          </div>
        )}

        {/* Grading Scale */}
        <div style={{ display: "flex", gap: "8px" }}>
          <label style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#4B5563"
          }}>Grading Scale:</label>
          <div style={{
            display: "flex",
            marginLeft: 'auto',
            alignItems: "center",
            gap: "16px"
          }}>
            <input
              type="number"
              value={assignmentSettings.scale?.min || '0'}
              onChange={(e) => updateAssignmentSetting('scaleMin', e.target.value)}
              style={{
                width: "30px",
                padding: "4px",
                border: "1px solid #D1D5DB",
                borderRadius: "4px"
              }}
            />
            <span>to</span>
            <input
              type="number"
              value={assignmentSettings.scale?.max || '2'}
              onChange={(e) => updateAssignmentSetting('scaleMax', e.target.value)}
              style={{
                width: "30px",
                padding: "4px",
                border: "1px solid #D1D5DB",
                borderRadius: "4px"
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsSection;