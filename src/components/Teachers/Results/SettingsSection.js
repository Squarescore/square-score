import { doc, getDoc, writeBatch } from "firebase/firestore";
import CustomDateTimePicker from "./CustomDateTimePickerResults";
import { useState } from "react";
import { db } from "../../Universal/firebase";

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

  const formatDate = (date) => {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    };
    
    const formattedDate = date.toLocaleString('en-US', options)
      .replace(',', '')
      .replace(',', '')
      .replace(' at ', ' ')
      .replace(/(\d{1,2}):(\d{2}):00/, '$1:$2')
      .replace(' PM', ' PM ')
      .replace(' AM', ' AM ');
      
    return formattedDate;
  };

  return (
    <div style={{
      width: "100%",
      padding: "24px",
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
              width: "100%",
              padding: "8px",
              border: "1px solid #D1D5DB",
              borderRadius: "8px",
              outline: "none",
              boxShadow: "0 0 0 2px transparent",
              transition: "box-shadow 0.2s",
              ":focus": {
                boxShadow: "0 0 0 2px #3B82F6"
              }
            }}
          />
        </div>

        {/* Dates */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px"
        }}>
          <div>
            <label style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#4B5563"
            }}>Assign Date:</label>
            <CustomDateTimePicker
              selected={new Date(assignmentSettings.assignDate)}
              onChange={(date) => updateAssignmentSetting('assignDate', formatDate(date))}
            />
          </div>
          <div>
            <label style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#4B5563"
            }}>Due Date:</label>
            <CustomDateTimePicker
              selected={new Date(assignmentSettings.dueDate)}
              onChange={(date) => updateAssignmentSetting('dueDate', formatDate(date))}
            />
          </div>
        </div>

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
            <input
              type="number"
              value={timer}
              onChange={handleTimerChange}
              disabled={!timerOn}
              style={{
                width: "80px",
                padding: "8px",
                border: "1px solid #D1D5DB",
                borderRadius: "4px"
              }}
            />
            <div style={{
              display: "flex",
              alignItems: "center"
            }}>
              <span style={{ marginRight: "8px" }}>Enable Timer:</span>
              <input
                type="checkbox"
                checked={timerOn}
                onChange={handleTimerToggle}
                style={{
                  width: "16px",
                  height: "16px",
                  cursor: "pointer"
                }}
              />
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
              width: "80px",
              padding: "8px",
              border: "1px solid #D1D5DB",
              borderRadius: "4px"
            }}
          />
        </div>

        {/* Half Credit Toggle */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <label style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#4B5563"
          }}>Half Credit:</label>
          <input
            type="checkbox"
            checked={assignmentSettings.halfCredit}
            onChange={(e) => updateAssignmentSetting('halfCredit', e.target.checked)}
            style={{
              width: "16px",
              height: "16px",
              cursor: "pointer"
            }}
          />
        </div>

        {/* Save & Exit Toggle */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <label style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#4B5563"
          }}>Save & Exit:</label>
          <input
            type="checkbox"
            checked={assignmentSettings.saveAndExit}
            onChange={(e) => updateAssignmentSetting('saveAndExit', e.target.checked)}
            style={{
              width: "16px",
              height: "16px",
              cursor: "pointer"
            }}
          />
        </div>

        {/* Grading Scale */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#4B5563"
          }}>Grading Scale:</label>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "16px"
          }}>
            <input
              type="number"
              value={assignmentSettings.scale?.min || '0'}
              onChange={(e) => updateAssignmentSetting('scaleMin', e.target.value)}
              style={{
                width: "80px",
                padding: "8px",
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
                width: "80px",
                padding: "8px",
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