import React, { useState } from 'react';
import { ChevronDown, ChevronUp, SquareDashedMousePointer } from 'lucide-react';
import SelectStudents from './SelectStudents';

const SelectStudentsDW = ({ classId, selectedStudents, setSelectedStudents }) => {
  const [studentsDropdownOpen, setStudentsDropdownOpen] = useState(false);

  return (
    <div style={{ width: '700px',  marginTop: '20px', marginBottom: '0px',  }}>
      <div style={{display: 'flex',  marginBottom: '-10px'}}> 

      <SquareDashedMousePointer size={20} color="lightgrey" />  
      <h1 style={{ fontSize: '16px', marginLeft: '5px', marginRight: 'auto', fontFamily: "'montserrat', sans-serif", color: 'lightgrey', fontWeight: '600' , marginTop: '0px' }}>Select Students</h1>
      </div>
      <button
        onClick={() => setStudentsDropdownOpen(!studentsDropdownOpen)}
        style={{
          width: '350px',
          padding: '0px',
          fontSize: '25px',
          height: '50px',
          backgroundColor: 'white',
          color: 'black',
          border: ' 0px solid blue', 
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <h1 style={{ fontSize: '25px',  fontFamily: "'montserrat', sans-serif", fontWeight: '600' , }}> All Students Selected</h1>
    
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