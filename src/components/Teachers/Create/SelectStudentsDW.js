import React, { useState } from 'react';
import { ChevronDown, ChevronUp, SquareDashedMousePointer } from 'lucide-react';
import SelectStudents from './SelectStudents';

const SelectStudentsDW = ({ classId, selectedStudents, setSelectedStudents }) => {

  return (
    <div style={{ width: '600px',  marginTop: '-160px', marginBottom: '0px',   marginLeft: '10px'}}>
    
      <div>
        <div style={{ marginTop: '0px' }}>
          <SelectStudents
            classId={classId}
            selectedStudents={selectedStudents}
            setSelectedStudents={setSelectedStudents}
          />
        </div>
      </div>
    </div>
  );
};

export default SelectStudentsDW;