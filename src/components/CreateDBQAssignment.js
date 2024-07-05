import { updateDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, setDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from './firebase'; // Ensure this path is correct for your project
import { getDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { arrayUnion } from 'firebase/firestore';
import { writeBatch } from 'firebase/firestore';
import DBQTeacherPreview from './DBQTeacherPreview';
import SelectStudents from './SelectStudents';
import Navbar from './Navbar';

const CreateDBQAssignment = () => {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false); // State for loading modal

  const [sourceCount, setSourceCount] = useState('');
  const [assignmentName, setAssignmentName] = useState('');
  const [assignmentGenerated, setAssignmentGenerated] = useState(false);
  const navigate = useNavigate();
  const { classId } = useParams();
  const [dbqId, setDbqId] = useState(null);
  const [className, setClassName] = useState('');
  const [timerEnabled, setTimerEnabled] = useState(false); // Add timerEnabled state
  const [timer, setTimer] = useState(0); 
  const [classChoice, setClassChoice] = useState('');
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [isSelectStudentsVisible, setIsSelectStudentsVisible] = useState(false);
  const [IsdbqpreviewVisible, setIsdbqpreviewVisible] = useState(false);
  const [assignmentId, setAssignmentId] = useState(null);
  const [lockdownMode, setLockdownMode] = useState(false);
  const [hasOpenedSelectStudents, setHasOpenedSelectStudents] = useState(false);
const [multipleDays, setMultipleDays] = useState(false);

  const closeSelectStudentsModal = () => {
    setIsSelectStudentsVisible(false);
  };

  useEffect(() => {
    // Fetch the class data from Firestore
    const fetchClassData = async () => {
      const classDocRef = doc(db, 'classes', classId);
      const classDoc = await getDoc(classDocRef);

      if (classDoc.exists()) {
        setClassName(classDoc.data().className);
      
        setClassChoice(classDoc.data().classChoice);
        // Fetch the averages

      }
    };

    fetchClassData();
  }, [classId]);

  const assignToStudents = async (dbqId) => {
    // Assuming `selectedStudents` contains the UIDs of the selected students
    const batch = writeBatch(db);
  
    selectedStudents.forEach(studentUid => {
      const studentRef = doc(db, 'students', studentUid);
      // Using `arrayUnion` to ensure we're adding to an existing array without removing any existing entries
      batch.update(studentRef, {
        dbqs: arrayUnion(dbqId)
      });
    });
  
    try {
      await batch.commit(); 
      const dbqDocRef = doc(db, 'dbqs', dbqId);
    await updateDoc(dbqDocRef, { isActive: true });

      setIsSuccessModalVisible(true);
      console.log("DBQ successfully assigned to selected students.");
    } catch (error) {
      console.error("Error assigning DBQ to students:", error);
    }
  };
  useEffect(() => {
    // Generate a unique DBQ ID when the component mounts
    setDbqId(`dbqID#${uuidv4()}`);
  }, []);
  // Generate a unique DBQ ID when needed (e.g., upon DBQ creation)
 
  // Use this ID both when saving the DBQ to Firestore and when assigning it to students

  



  const generateDBQAssignment = async (regenerate = false) => {
    setIsLoading(true); 
    const payload = { topic, sourceCount, classChoice: classChoice }; // Use classChoice directly
    try {
      const response = await fetch("https://us-central1-lirf4-41820.cloudfunctions.net/generateDBQAssignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) throw new Error('Failed to generate DBQ assignment');
      const assignmentResponse = await response.json(); // Get the full response
  
      console.log("OpenAI API Response:", assignmentResponse); // Log the full response
  
      // Assuming the assignmentResponse contains { assignment: '...' }
      const { assignment } = assignmentResponse;
  
      // Convert the assignment object to a string
      const assignmentString = JSON.stringify(assignment);
  
      // Save the assignment string to Firestore using the existing dbqId
      const dbqDocRef = doc(db, 'dbqs', dbqId);
      await setDoc(dbqDocRef, { 
        assignment: assignmentString,
        name: assignmentName,
        lockdownMode: lockdownMode,
        timer: timer,
        multipleDays: multipleDays,
        classId: classId,
        createdDate: Timestamp.now(),
      });
  
      // Set the assignmentId state to the existing dbqId
      setAssignmentId(dbqId);
      setIsLoading(false);
      // Set assignmentGenerated to true
      setAssignmentGenerated(true);
  
    } catch (error) {
      console.error("Error generating DBQ assignment:", error);
      setIsLoading(false);
    }
  };
  const inputStyle = {
    padding: '15px', 
    height: '50px',
    
    border: '2px solid lightgrey', 
    borderRadius: '10px', 
    outline: 'none', 
    marginBottom: '40px',
    backgroundColor: ' white',
    fontFamily: "'Radio Canada', sans-serif",
    boxSizing: 'border-box',
    marginLeft: '',
    fontSize: '100%'
  };
  
    
  const modalStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#F9F9F9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
};

const modalContentStyle = {
  width: '60%',
  maxHeight: '80%',
border: '2px solid lightgrey',
backgroundColor: 'white',
  padding: '20px',
  borderRadius: '10px',
  position: 'relative',
  overflowY: 'auto',
  listStyleType: 'none',
};

const closeButtonStyle = {
    position: 'absolute',
    right: '20px',
    bottom: '10px',borderRadius: '4px', fontFamily: "'Radio Canada', sans-serif",
    background: 'none',backgroundColor: 'black', padding: '5px 10px 5px 10px', 
    color: 'white',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer'
};
const buttonStyle = {
  textAlign: 'center',
  width: '200px', 
  border: '2px solid', 
  padding: '10px', 
  color: 'white', 
  fontFamily: "'Radio Canada', sans-serif",
  fontSize: '25px',
  borderRadius: '10px',
  transition: '0.3s',
  marginTop: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F9F9F9'}}>
    <Navbar userType="teacher" />
    <div style={{ width: '800px', marginLeft: 'auto', marginRight: ' auto',marginTop: '150px', backgroundColor: 'transparent', marginTop: '70px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
  

     
<h1 style={{fontSize: '40px',fontFamily: "'Poppins', sans-serif"}}> Create a DBQ </h1>

<div style={{width: '1000px'}}>







      <p style={{...inputStyle, fontWeight: 'bold', lineHeight: '15px', width: '400px',  fontSize: '25px', textAlign:'center'}}>{classChoice}</p>
      
      <input
          style={{...inputStyle, width: '250px', marginRight: '20px', marginRight: '25px'}}
          type="text"
          placeholder="Enter assignment name"
          value={assignmentName}
          onChange={(e) => setAssignmentName(e.target.value)}
        />



      <input style={{...inputStyle, width: '250px', marginRight: '25px'}}
        type="text"
        placeholder="Enter topic"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
      />
      <input style={{...inputStyle, width: '250px', }}
        type="number"
        placeholder="Enter source count"
        value={sourceCount}
        onChange={(e) => setSourceCount(e.target.value)}
      />
      





<div style={{justifyContent: 'center', display: 'flex'}}>

      
      <div style={{ display: 'flex',  alignItems: 'center', marginBottom: '20px',...inputStyle, width: '250px'  ,marginRight: '25px'}}>
       
      <style>{`
        .switch {
          position: relative;
          width: 200px;
          height: 32px;
          marginRight: 30px 
        }
        
        .switch input { 
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 58px;
          background-color: #ccc;
          transition: .4s;
        }
        
        .slider:before {
          position: absolute;
          content: "";
          height: 24px;
          width: 24px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: .4s;
        }
        
        input:checked + .slider {
          background-color: black;
        }
        
        input:checked + .slider:before {
          transform: translateX(26px);
        }
        
        .slider.round {
          border-radius: 34px;
        }
        
        .slider.round:before {
          border-radius: 50%;
        }
      `}</style>
          <div style={{ marginRight: '10px' }}>Lockdown Mode</div>
          <label 
          style={{ marginRight: '-150px' }}
      className="switch">
            <input type="checkbox" checked={lockdownMode} onChange={(e) => setLockdownMode(e.target.checked)} />
            <span className="slider round"></span>
          </label>
        </div>
        <div style={{width: '250px', marginRight: '23px', backgroundColor: 'white', height: '46px', border: '2px solid lightgrey', borderRadius: '10px', color: 'grey',}}> 
<div style={{ height: '28px', display: 'flex'}}>
<style>{`
        .switch {
          position: relative;
          width: 200px;
          height: 32px;
          marginRight: 30px 
        }
        
        .switch input { 
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 58px;
          background-color: #ccc;
          transition: .4s;
        }
        
        .slider:before {
          position: absolute;
          content: "";
          height: 24px;
          width: 24px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: .4s;
        }
        
        input:checked + .slider {
          background-color: black;
        }
        
        input:checked + .slider:before {
          transform: translateX(26px);
        }
        
        .slider.round {
          border-radius: 34px;
        }
        
        .slider.round:before {
          border-radius: 50%;
        }
      `}</style>
<label style={{fontSize: '16px', marginRight: '10px', marginTop: '10px', marginLeft: '16px', color: 'black'}}>Timer</label>
    
        <label className="switch" style={{width: '20px',marginTop: '7px' }}>
          <input 
            type="checkbox"
            checked={timerEnabled}
            onChange={() => setTimerEnabled(!timerEnabled)}  
          />
          <span className="slider round"></span>
        </label>
    
      </div>
      {timerEnabled ? (
        <input  style={{width: '70px', 
        backgroundColor: '	#F5F5F5', 
        border: '0px solid lightgrey',
        fontFamily: "'Radio Canada', sans-serif",
        marginTop: '-22px', 
        fontSize: '16px', borderRadius: '4px',
        height: '30px',
        outline: 'none',
        position: 'relative', marginLeft: 'auto',  marginRight: '14px',display: 'flex'}}



          type="number"
          placeholder="min" 
          value={timer}
          onChange={e => setTimer(Number(e.target.value))}
        />
        ) : (
          <div style={{width: '70px', 
         color: 'lightgrey',
          fontFamily: "'Radio Canada', sans-serif",
          marginTop: '-18px', 
          fontSize: '16px', borderRadius: '4px',
          height: '30px',
          outline: 'none',
          position: 'relative', marginLeft: 'auto',  marginRight: '1px',display: 'flex', textAlign: 'center'}}>Off</div>  
        )}
</div>     

        {/* Switch for Multiple Days */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', ...inputStyle, width: '250px'}}>
       
        <style>{`
        .switch {
          position: relative;
          width: 200px;
          height: 32px;
          marginRight: 30px 
        }
        
        .switch input { 
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 58px;
          background-color: #ccc;
          transition: .4s;
        }
        
        .slider:before {
          position: absolute;
          content: "";
          height: 24px;
          width: 24px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: .4s;
        }
        
        input:checked + .slider {
          background-color: black;
        }
        
        input:checked + .slider:before {
          transform: translateX(26px);
        }
        
        .slider.round {
          border-radius: 34px;
        }
        
        .slider.round:before {
          border-radius: 50%;
        }
      `}</style>
             <div style={{ marginRight: '20px' }}>Save and Exit</div>
          <label className="switch" style={{marginRight: '-180px'}}>
            <input type="checkbox" checked={multipleDays} onChange={(e) => setMultipleDays(e.target.checked)} />
            <span className="slider round"></span>
          </label>
        </div>



        </div>


        {isLoading && (
          <div style={modalStyle}>
            <div style={modalContentStyle}>
              Loading...
            </div>
          </div>
        )}
</div>

        <button   style={{
            ...buttonStyle,fontSize: '22px', width: '160px', marginRight: '-0px',
            color:  assignmentGenerated ? 'black' : 'white',
            background: assignmentGenerated ? 'white' : 'black',
            border: assignmentGenerated ? '2px dashed black' : 'none',
            lineHeight: '0px',
            cursor: 'pointer'
          }}
          onClick={() => generateDBQAssignment(assignmentGenerated)}
        >
          {assignmentGenerated ? 'Regenerate ' : 'Generate '}
        </button>



     
      <button onClick={() => {
  setIsSelectStudentsVisible(true);
  setHasOpenedSelectStudents(true);
}} style={{ ...buttonStyle, backgroundColor: 'white', borderColor:'lightgrey', color: 'black' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'darkgrey'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'lightgrey'; }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '12px' }}>
        <img src="https://static.vecteezy.com/system/resources/previews/010/159/990/original/people-icon-sign-symbol-design-free-png.png" style={{width:  '40px', marginBottom: '5px'}}></img>
        Select Students
      </div>
    </button>
      {isSelectStudentsVisible && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <button style={closeButtonStyle} onClick={closeSelectStudentsModal}>Continue</button>
            <SelectStudents 
              classId={classId} 
              selectedStudents={selectedStudents} 
              setSelectedStudents={setSelectedStudents} 
              
            />
          </div>
        </div>
      )}


<button style={{ ...buttonStyle, backgroundColor: '	white', zIndex: '100',borderColor: '	lightgrey', color: 'black', cursor: 'pointer' }}onClick={() => setIsdbqpreviewVisible(true)}>  


<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '12px'  }}>
        <img src="https://www.freeiconspng.com/thumbs/eye-icon/eyeball-icon-png-eye-icon-1.png" style={{width:  '40px', zIndex: '1', color: 'yellow'}}></img>
       Preview
      </div></button>



{IsdbqpreviewVisible && (
  <div style={modalStyle}>
    <div style={modalContentStyle}>
      <button style={closeButtonStyle} onClick={() => setIsdbqpreviewVisible(false)}>Close</button>
      <DBQTeacherPreview assignmentId={assignmentId} />
    </div>
  </div>
)}



   
   

{isSuccessModalVisible && (
        <div style={modalStyle}>
          <div style={{...modalContentStyle, textAlign: 'center'}}>
            <h2 style={{color: 'black'}}>Assignment Successfully Assigned!</h2>
            <button 
              onClick={() => navigate(`/teacherhome`)} 
              style={{...buttonStyle, marginLeft: '20%',color: 'white', width: '60%', backgroundColor: 'black', borderColor: 'lightgrey'}}  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'darkgrey'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'lightgrey'; }}>
              Return Home
            </button>
          </div>
        </div>
      )}

<button 
      style={{ 
        ...buttonStyle, 
        width: '23%', 
        backgroundColor: hasOpenedSelectStudents ? '#98FB98' : '#D3D3D3', 
        borderColor: hasOpenedSelectStudents ? '#006400' : '#A9A9A9', 
        color: hasOpenedSelectStudents ? '#006400' : '#A9A9A9',
        cursor: hasOpenedSelectStudents ? 'pointer' : 'not-allowed'
      }} 
      onClick={hasOpenedSelectStudents ? () => assignToStudents(dbqId) : null}
      onMouseEnter={(e) => { 
        if (hasOpenedSelectStudents) e.currentTarget.style.borderColor = '#006400)'; 
      }} 
      onMouseLeave={(e) => { 
        if (hasOpenedSelectStudents) e.currentTarget.style.borderColor = 'green'; 
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '12px'  }}>
        <img src="https://www.freeiconspng.com/thumbs/arrow-icon/arrow-icon-28.png" 
        style={{width:  '40px', opacity: '50%'}}></img>
        Publish
      </div>
</button>

    </div>
    </div>
  );
};

export default CreateDBQAssignment;