import React, { useState } from 'react';
import { SquareDashedMousePointer } from 'lucide-react';
import SelectStudents from './SelectStudents';

const SelectStudentsDW = ({ classId, selectedStudents, setSelectedStudents }) => {
  const [studentsDropdownOpen, setStudentsDropdownOpen] = useState(false);

  return (
    <div style={{ width: '770px', padding: '10px', marginTop: '20px', border: '4px solid #F4F4F4', borderRadius: '10px', marginBottom: '20px' }}>
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
        <img
          src={studentsDropdownOpen ? '/Up.png' : '/Down.png'}
          alt={studentsDropdownOpen ? "Collapse" : "Expand"}
          style={{ width: '20px' }}
        />
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