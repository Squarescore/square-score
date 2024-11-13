import React, { useState } from 'react';
import { arrayUnion, doc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../Universal/firebase';
import CustomDateTimePicker from '../Create/CustomDateTimePicker';

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
    <div className="w-full p-6 bg-white rounded-lg">
      <div className="space-y-6">
        {/* Assignment Name */}
        <div className="mb-4">
          <label className="text-sm font-semibold text-gray-600 mb-2">
            Assignment Name:
          </label>
          <input
            type="text"
            value={localName}
            onChange={handleInputChange}
            onBlur={handleNameUpdate}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-600">Assign Date:</label>
            <CustomDateTimePicker
              selected={new Date(assignmentSettings.assignDate)}
              onChange={(date) => updateAssignmentSetting('assignDate', formatDate(date))}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-600">Due Date:</label>
            <CustomDateTimePicker
              selected={new Date(assignmentSettings.dueDate)}
              onChange={(date) => updateAssignmentSetting('dueDate', formatDate(date))}
            />
          </div>
        </div>

        {/* Timer Settings */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-gray-600">Timer:</label>
          <div className="flex items-center space-x-4">
            <input
              type="number"
              value={timer}
              onChange={handleTimerChange}
              className="w-20 p-2 border rounded"
              disabled={!timerOn}
            />
            <div className="flex items-center">
              <span className="mr-2">Enable Timer:</span>
              <input
                type="checkbox"
                checked={timerOn}
                onChange={handleTimerToggle}
                className="form-checkbox"
              />
            </div>
          </div>
        </div>

        {/* Questions Per Student */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-gray-600">Questions per Student:</label>
          <input
            type="number"
            value={assignmentSettings.questionCount?.student || '5'}
            onChange={(e) => updateAssignmentSetting('questionCount', {
              ...assignmentSettings.questionCount,
              student: e.target.value
            })}
            className="w-20 p-2 border rounded"
          />
        </div>

        {/* Half Credit Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-gray-600">Half Credit:</label>
          <input
            type="checkbox"
            checked={assignmentSettings.halfCredit}
            onChange={(e) => updateAssignmentSetting('halfCredit', e.target.checked)}
            className="form-checkbox"
          />
        </div>

        {/* Save & Exit Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-gray-600">Save & Exit:</label>
          <input
            type="checkbox"
            checked={assignmentSettings.saveAndExit}
            onChange={(e) => updateAssignmentSetting('saveAndExit', e.target.checked)}
            className="form-checkbox"
          />
        </div>

        {/* Grading Scale */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-600">Grading Scale:</label>
          <div className="flex items-center space-x-4">
            <input
              type="number"
              value={assignmentSettings.scale?.min || '0'}
              onChange={(e) => updateAssignmentSetting('scaleMin', e.target.value)}
              className="w-20 p-2 border rounded"
            />
            <span>to</span>
            <input
              type="number"
              value={assignmentSettings.scale?.max || '2'}
              onChange={(e) => updateAssignmentSetting('scaleMax', e.target.value)}
              className="w-20 p-2 border rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsSection;