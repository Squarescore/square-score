import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from './firebase';
import { doc, setDoc } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';
import CJNavbar from './CJNavbar';
import { useNavigate } from 'react-router-dom';
const CreateClass = () => {
  const [period, setPeriod] = useState(1);
  const [classChoice, setClassChoice] = useState(''); // New state for class choice
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [className, setClassName] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [createdClassCode, setCreatedClassCode] = useState('');
  const navigate = useNavigate();
  
  const [customClass, setCustomClass] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [createdClassName, setCreatedClassName] = useState('');
 
  const [message, setMessage] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const classOptions = [
    'AP African American Studies', 'AP Art History', 'AP Biology', 
    'AP Comparative Government', 'AP Macroeconomics', 'AP Microeconomics', 
    'AP English Literature', 'AP English Language and Composition', 
    'AP Environmental Science', 'AP European History', 'AP Human Geography', 
    'AP Psychology', 'AP Spanish Language', 'AP Spanish Literature', 
    'AP US Government and Politics', 'AP US History', 'AP World History', 
    'Biology', 'Civics', 'English 1', 'English 2','English 3', 'Spanish', 'US History', 'World History', 'Chemistry','Journalism', 'Personal Fitness'
  ]; // Array of class choices

  const createClassCode = () => {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
  };
  const handleClassChange = (e) => {
    if (e.target.value === 'custom') {
      setIsCustom(true);
      setClassChoice('');
    } else {
      setIsCustom(false);
      setClassChoice(e.target.value);
    }
  };

  const handleCustomClassChange = (e) => {
    setCustomClass(e.target.value);
    setClassChoice(e.target.value);
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    const classCode = createClassCode();
    const teacherUID = auth.currentUser.uid;
    const className = `Period ${period}`;
   
    const classData = {
      className,
      classChoice, // Include the selected class choice
      classCode,
      teacherUID,
      students: [],
     
    };

    try {
      const classDocRef = doc(db, 'classes', uuidv4());
      await setDoc(classDocRef, classData);
      
      setCreatedClassCode(classCode); 
      setCreatedClassName(className); 
      setSuccessMessage(` ${className} has been added to your roster `);
      setShowModal(true); 
    } catch (err) {
      setErrorMessage('Error creating class. Please try again.');
    }
  };
  const SuccessModal = ({ message, classCode, onClose, className }) => {
   
    const handleBack = () => {
      navigate(-1);
    };
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '10px',
          textAlign: 'center',
          width: '400px',
        }}>
          <h2 style={{ fontFamily: "'Poppins', sans-serif" , fontSize: '40px' }}>Success!</h2>
          <p style={{ fontFamily: "'Radio Canada', sans-serif", fontSize: '20px'  }}>{message}</p>
          <p style={{ fontFamily: "'Poppins', sans-serif" , fontSize: '24px' , fontWeight: 'bold'}}>Class Code: {classCode}</p>
          <p style={{ fontFamily: "'Poppins', sans-serif" }}>You can now access the class on your home screen, to add your students have them input the class code in their join class page and then admit them in your {className} participants page</p>
          <button
            onClick={handleBack}
            style={{
              fontFamily: "'Radio Canada', sans-serif",
              fontSize: '16px',
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: 'black',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Return Home
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'white'}}>
      <CJNavbar userType="teacher" />
      
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '150px' }}>
      
      
    
      
      
      
      
      
      
      
      
      
      
      
      
      
        <form onSubmit={handleCreateClass} style={{ width: '800px',  height: '450px' ,border: '10px solid lightgrey',borderRadius: '30px',backgroundColor: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{display: 'flex', flexDirection: 'column', width: '750px'}}>

          <h1 style={{width: '750px', textAlign: 'center', fontSize: '50px', fontFamily: "'Radio Canada', sans-serif",}}>Create Class</h1>
   
   <div style={{display: 'flex', marginTop: '-50px'}}>
   
        <div style={{ width: '420px', position: 'relative',height: '180px', margin: '0px 0', fontWeight: 'bold', marginTop: '50px' ,alignItems: 'center',border: '3px solid lightgrey', borderRadius: '10px', justifyContent: 'center', display: 'flex'}}>


            <label htmlFor="period-selector" style={{fontSize: '60px',  fontFamily: "'Radio Canada', sans-serif", marginLeft: '7%', }}>Period:</label>
         
         
            <select
              id="period-selector"
              value={period}
              onChange={e => setPeriod(e.target.value)}
              style={{ width: '80px ', paddingLeft: '10px',borderColor: 'transparent', cursor: 'pointer',backgroundColor: '#EDEDED', color: 'black', fontWeight: 'bold', borderRadius: '5px', textAlign: 'center', marginLeft: '15px', height: '70px', fontFamily: "'Radio Canada', sans-serif", fontSize: '40px' }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <option  style={{borderColor: 'transparent', }}key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>
          <div
  style={{
    width: '290px', 
    height: '180px',
    border: '3px solid lightgrey', 
    borderRadius: '10px', 
    alignItems: 'center',
    justifyContent: 'center', 
    display: 'flex',  
    marginTop: '50px', 
    marginLeft: 'auto',
    position: 'relative'  // Add this to make absolute positioning work
  }}
>
  <button 
    style={{
      position: 'absolute',
      top: '-15px',  // Change this from '117px' to '10px'
      right: '-15px',  // Change this from '5px' to '10px'
      width: '50px', 
      height: '50px', 
      fontSize: '30px', 
      borderRadius: '50%',
      backgroundColor: 'white', 
      border: '3px solid lightgrey',  
      lineHeight: '30px',
      textAlign: 'center',  
      color: 'black',
      fontWeight: 'bold', 
      fontFamily: "'Radio Canada', sans-serif"
    }}
  >
    ?
  </button>

  <div style={{width: '290px'}}>
    <h1 style={{display: 'flex', fontSize: ' 100px', fontWeight: 'bold', color: '#F4C10A', marginTop: '120px', marginLeft: '20px'}}>
      *<h2 style={{fontSize: '50px', marginTop:' 6px', marginLeft: '10px', color: 'black',fontWeight: 'bold', fontFamily: "'Radio Canada', sans-serif"}}>Enabled</h2>
    </h1>
  </div>   
</div>

          </div>
          <div style={{ width: '100%', position: 'relative',  marginTop: '-30px' }}>
            <select
              value={isCustom ? 'custom' : classChoice}
              onChange={handleClassChange}
              required
              style={{
                width: '100%', padding: '20px 30px', fontWeight: 'bold', marginTop: '60px',
                border: '3px solid lightgrey ',  borderRadius: '10px',
                fontSize: '20px',  fontFamily: "'Radio Canada', sans-serif",
               
                cursor: 'pointer', outline: 'none', transition: 'all 0.3s ease',
                backgroundColor: 'white', lineHeight: '2'
              }}
            >
              <option value="" disabled hidden>Select a Class</option>
              {classOptions.map(option => (
                <option  style={{lineHeight: '4', padding: '50px', backgroundColor: 'white', color: 'black', fontWeight: 'heavy', marginTop: '10px',  fontFamily: "'Radio Canada', sans-serif",}} key={option} value={option}>{option}</option>
              ))}
              <option style={{lineHeight: '4', padding: '40px', backgroundColor: '#F4C10A', color: 'black', fontWeight: 'heavy'}} value="custom">Custom</option>
            </select>
            {isCustom && (
              <input
                type="text"
                value={customClass}
                onChange={handleCustomClassChange}
                placeholder="Enter custom name"
                style={{
              
                  position: 'absolute',
      top: '117px',
      right: '5px',
      width: '500px',padding: '20px 30px', fontWeight: 'bold', height: '10px', marginTop: '-50px',
                  border: '3px solid #F4C10A ', paddingRight: '40px', borderRadius: '10px',
                  fontSize: '20px',  fontFamily: "'Radio Canada', sans-serif",
                  
                  outline: 'none', transition: 'all 0.3s ease',
                   lineHeight: '2'
                }}
              />
            )}
          </div>
          <div style={{ 
  width: '100%', 
  display: 'flex', 
  justifyContent: 'center', 
  marginTop: '70px', 
  marginBottom: '20px'
}}>
  <button 
    type="submit" 
    disabled={!classChoice}
    style={{ 
      fontFamily: "'Radio Canada', sans-serif",
      fontSize: '20px',
      height: '90px',
      backgroundColor: 'transparent', border: 'none', borderRadius: '15px',
      width: '400px', 
      opacity: classChoice ? '100%' : '0%',
      transition: 'opacity 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease',
      cursor: classChoice ? 'pointer' : 'default',
    }}
    onMouseEnter={(e) => {
      if (classChoice) {
        e.currentTarget.style.transform = 'scale(1.01)';
        e.currentTarget.style.boxShadow = '0px 4px 8px rgba(0, 0, 0, 0.1)';
      }
    }}
    onMouseLeave={(e) => {
      if (classChoice) {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = 'none';
      }
    }}
  >
    <img style={{width: '400px', marginLeft: '-5px'}} src='/CreateClass.png' alt="Create Class"/>
  </button>
</div>
          </div>
        </form>
        {showModal && (
  <SuccessModal
    message={successMessage}
    classCode={createdClassCode}  
    className={createdClassName}  
    onClose={() => {
      setShowModal(false);
  
      
      
      // Navigate to the home page
      // You can use a routing library like React Router for this
      // For example: history.push('/home');
    }}
  />
)}
        {successMessage && <p style={{ color: 'green', marginTop: '20px', fontFamily: "'Poppins', sans-serif" }}>{successMessage}</p>}
        {errorMessage && <p style={{ color: 'red', marginTop: '20px' }}>{errorMessage}</p>}
      </main>
    </div>
  );
};

export default CreateClass;
