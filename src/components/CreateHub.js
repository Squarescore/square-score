import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';


const CreateHub = () => {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [className, setClassName] = useState('');
  const [createHover, setCreateHover] = useState(false);
  const [draftsHover, setDraftsHover] = useState(false);

  
  useEffect(() => {
    const fetchClassData = async () => {
      const classDocRef = doc(db, 'classes', classId);
      const classDoc = await getDoc(classDocRef);

      if (classDoc.exists) {
        setClassName(classDoc.data().className);
      }
    };

    fetchClassData();
  }, [classId]);
  const handleBack = () => {
    navigate(-1);
  };
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F9F9F9'}}>
      <header style={{     backgroundColor: 'white',
    boxShadow: '10px 5px 20px 2px lightgrey',
    borderRadius: '10px',
    color: 'white',
   height: '14%',
    display: 'flex',
    marginBottom: '-46px',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    margin: '1% auto',
    width: '70%'}}> <button 
          onClick={handleBack} 
          style={{ position: 'absolute',fontFamily: "'Radio Canada', sans-serif",left: '20px', textDecoration: 'none',  color: 'black', backgroundColor: 'white', border: 'none', cursor: 'pointer',  }}>
          Back
        </button>
        <button onClick={() => navigate(`/teacherhome`)} 
          style={{ position: 'absolute', left: '70px', textDecoration: 'none', color: 'black', fontFamily: "'Roboto Mono', sans-serif", backgroundColor: 'white', border: 'none', cursor: 'pointer' }}>
          Home</button>
        <h1 style={{ fontSize: '40px', color: 'black',fontWeight: 'normal',  }}>{className}</h1>
    
      </header>



      <div style={{ display: 'flex', justifyContent: 'space-evenly', marginTop: '20px', height: "100%" }}>


        
        <div 
         
          style={{
            width: '22%',
            height: '40%',
            boxShadow: '10px 5px 20px 2px lightgrey',
         fontFamily: "'Radio Canada', sans-serif",
            backgroundColor: '#5D3FD3' ,
            border: '5px solid',
            borderColor: 'transparent',
            color: createHover ? 'white' : 'white',
            textAlign: 'center',
            fontSize: '70%',
            transition: '0.3s',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: '-400px',
            borderRadius: '40px',
            marginTop: '5%',
            marginRight: '-10%',
            cursor: 'pointer',
          
            transform: 'scale(1)',
            opacity: '100%' // Set default background color
      // Set default text color
  }}
  onMouseEnter={(e) => {
    e.target.style.opacity = '85%';
    e.target.style.boxShadow= '5px 2px 8px 2px 	#BC9AEF'
    e.target.style.transform = 'scale(1.01)';
  
 
    
  }}
  onMouseLeave={(e) => {
    e.target.style.opacity = '100%';
    e.target.style.boxShadow = '5px 2px 8px 2px lightgrey';
    e.target.style.transform = 'scale(1)'; 
  }}
          onClick={() => navigate(`/class/${classId}/createassignment`)}
        >
         
          <div style={{ fontSize: '30px' }}> New Quiz</div>
        </div>
        <div 
       
          style={{
            width: '22%',
            height: '40%',
          
            boxShadow: '10px 5px 20px 2px lightgrey',
          
            backgroundColor: '	#87CEEB',
            border: '5px solid',
            borderColor:'transparent',
            color: draftsHover ? 'white' : 'white',
            textAlign: 'center',
            fontSize: '70%',
            transition: '0.3s',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '40px',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '5%',
            marginLeft: '%',
            cursor: 'pointer',
            transform: 'scale(1)',
            opacity: '100%' // Set default background color
      // Set default text color
  }}
  onMouseEnter={(e) => {
    e.target.style.opacity = '85%';
    e.target.style.boxShadow= '5px 2px 8px 2px 	 #AED2FF'
    e.target.style.transform = 'scale(1.01)';
  
 
    
  }}
  onMouseLeave={(e) => {
    e.target.style.opacity = '100%';
    e.target.style.boxShadow = '5px 2px 8px 2px lightgrey';
    e.target.style.transform = 'scale(1)'; 
  }}
  
          onClick={() => navigate(`/class/${classId}/createconnect`)}
        >
          
          <div  style={{ fontSize: '30px' }}>Connect</div>
          
        </div>
      
      </div>
      <div>
        <Link to="/connect" > Beta-connect</Link>
      </div>
    </div>
  );
};

export default CreateHub;
