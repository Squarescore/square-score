import React, { useState } from 'react';
import { ChevronDown, ChevronUp, SquareDashedMousePointer } from 'lucide-react';
import SelectStudents from './SelectStudents';

const SelectStudentsDW = ({ classId, selectedStudents, setSelectedStudents }) => {
  const [studentsDropdownOpen, setStudentsDropdownOpen] = useState(false);

  return (
    <div style={{ width: '770px', padding: '10px', marginTop: '40px', borderTop: ' 0px solid #f4f4f4', borderRadius: '0px', marginBottom: '-20px',  }}>
      <button
        onClick={() => setStudentsDropdownOpen(!studentsDropdownOpen)}
        style={{
          width: '100%',
          padding: '10px',
          fontSize: '30px',
          height: '50px',
          backgroundColor: 'white',
          color: 'black',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <SquareDashedMousePointer size={40} color="#000000" />  
        <h1 style={{ fontSize: '30px', marginRight: 'auto', marginLeft: '20px', fontFamily: "'montserrat', sans-serif" }}>Select Students</h1>
    
       {studentsDropdownOpen ? <ChevronUp  style={{color: 'grey'}}/> : <ChevronDown style={{color: 'grey'}}/>}
          
      </button>

      <div className={`dropdown-content ${studentsDropdownOpen ? 'open' : ''}`}>
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