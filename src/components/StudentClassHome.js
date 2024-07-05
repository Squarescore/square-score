
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import Navbar from './Navbar';
import Footer from './Footer';
const StudentClassHome = () => {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [className, setClassName] = useState('');
  const studentUid = auth.currentUser.uid;
  const [averageScore, setAverageScore] = useState(null);
  const [mostRecentScore, setMostRecentScore] = useState(null);
  const [classChoice, setClassChoice] = useState('');
  useEffect(() => {
    const fetchClassData = async () => {
      const classDocRef = doc(db, 'classes', classId);
      const classDoc = await getDoc(classDocRef);

      if (classDoc.exists()) {
        setClassName(classDoc.data().className);
        setClassChoice(classDoc.data().classChoice);
      }

      const studentScoresRef = doc(classDocRef, 'studentScores', studentUid);
      const studentScoresDoc = await getDoc(studentScoresRef);

      if (studentScoresDoc.exists()) {
        const data = studentScoresDoc.data();
        setAverageScore(data.averageScore);
        setMostRecentScore(data.mostRecentScore);
      }
    };

    fetchClassData();
  }, [classId, studentUid]);

  const handleBack = () => {
    navigate('/studenthome');
  };
  const linkStyle = {
    width: '550px', 
    fontWeight: 'bold',
    fontFamily: "'Radio Canada', sans-serif",
    padding: '40px 0', 
    marginBottom: '0px', 
 border: '0px solid ',

    boxShadow: 'none',
    textAlign: 'center', 
    fontSize: '20px', 
    textDecoration: 'none', 
backgroundColor: 'black',
    color: 'white',
    borderRadius: '10px',
    transition: '.3s', 
    cursor: 'pointer',
    transform: 'scale(1)',
    opacity: '100%', 
  };
  const getBorderColor = (average) => {
    if (average < 60) return 'crimson';
    if (average < 80) return 'khaki';
    return 'lightgreen';
  };

  return ( 
   
      <div style={{  display: 'flex', flexDirection: 'column', backgroundColor: 'white'}}>
  
        <Navbar userType="student" />
       
  
        <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: '60px' }}>
       <div  style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: '20px', width: '1200px'}}>
  
  
        <div style={{width: '100%', display: 'flex', justifyContent: 'space-between'}}>
        <div
            
            style={{ 
              width: '873px', zIndex: '1',
              height: '374px',
             position: 'relative',
              marginBottom: '50px', 
              marginTop: '75px',
              border: '10px solid #627BFF',
              backgroundColor: 'white',
              borderRadius:'30px',
              fontFamily: "'Radio Canada', sans-serif",
        
              textAlign: 'center', 
              fontSize: '40px', 
              textDecoration: 'none', 
              color: 'white',
             marginRight:'-30px', marginLeft:'10px',
           transition: '.3s', 
                    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.4)',
                    transform: 'scale(1)'
                     // Set default background color
              // Set default text color
          }}
     
      >
  <h1 style={{fontSize: '36px',
    height: '50px',
    marginLeft: 'auto',
    marginRight: 'auto',
    fontFamily: "'Radio Canada', sans-serif",
    marginTop: '-30px',
    textAlign: 'center',
    marginBottom: '-27px',
    zIndex: '20',
    color: 'grey',
    position: 'relative',
    fontWeight: 'lighter',
    backgroundColor: 'transparent',
    alignItems: 'center',
    lineHeight: '1',
    display: 'flex',
    justifyContent: 'center'
  }}>
    <h1 style={{ width: 'fit-content', backgroundColor: 'white', fontSize: '35px', fontWeight: 'normal', paddingLeft: '30px', paddingRight: '30px', fontFamily: "'Radio Canada', sans-serif", marginLeft: '0px', textShadow: 'none' }}>{classChoice}</h1>
  </h1>
  
    <h1 style={{color: 'black', textAlign: 'center', textShadow: 'none', marginTop: '136px', fontSize: '90px', fontWeight: 'bold' }}>{className}</h1>
  
  </div>
        <div style={{width: '50%', display: 'flex', justifyContent: 'space-between', marginTop: '75px', marginBottom: '-20px'}}>
          
          
          <div style={{width: '384px', backgroundColor: 'white', border: `10px solid ${getBorderColor(averageScore)}`, borderRadius: '30px', height: '374px',marginLeft: '70px'}}>
            <h1 style={{fontSize: '22px', padding: '20px', width: '110px', textAlign: 'center', backgroundColor: 'white', fontWeight: 'normal', fontFamily: "'Radio Canada', sans-serif", lineHeight: '1', marginTop: '-105px', marginLeft: 'auto', marginRight: 'auto', color: 'grey'}}> <h5 style={{fontSize: '34px', marginBottom: '-0px', color: 'grey'}}>Recent</h5> Average</h1>
            <h2 style={{width: '100%', fontSize: '130px', fontWeight: 'normal', fontFamily: "'Radio Canada', sans-serif", textAlign: 'center', color: 'grey', marginTop: '65px'}}>{averageScore}</h2>
            </div>
       
          
        </div>
      
  
  </div>
  
      <div style={{ 
            width: '100%', 
            
            display: 'flex', 
            justifyContent: 'space-around', 
            alignItems: 'center', 
            position: 'relative',
            bottom: '0',
            paddingBottom: '20px', 
            marginBottom: '-35px'
          }}>
  

      <Link
            to={`/studentassignments/${classId}`} 
            style={{ 
              
              ...linkStyle,
              backgroundColor: '#AEF2A3',
              color: '#18AC00'
             
            }}
            onMouseEnter={(e) => {
              e.target.style.opacity = '85%';
              e.target.style.boxShadow= ' 0px 4px 4px 0px rgba(0, 0, 0, 0.25)';
              e.target.style.transform = 'scale(1.01)';
            
           
              
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = '100%';
              e.target.style.boxShadow= 'none';
              e.target.style.transform = 'scale(1)'; 
            }}
            
          
      >
         Assignments
      </Link>
  
          <Link 
            to={`./StudentGradesHome`} 
            style={{ 
              ...linkStyle,
              backgroundColor: '#A3F2ED',
              color: '#48A49E'
              // Set default background color
              // Set default text color
            }}
            onMouseEnter={(e) => {
              e.target.style.opacity = '85%';
              e.target.style.boxShadow= ' 0px 4px 4px 0px rgba(0, 0, 0, 0.25)';
              e.target.style.transform = 'scale(1.01)';
            
           
              
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = '100%';
              e.target.style.boxShadow= 'none';
              e.target.style.transform = 'scale(1)'; 
            }}
            
          
      >
            Grades
          </Link>
          
          
        
          </div>
         
          </div>
        </main>
        <Footer></Footer>
      </div>
    );
  };
  
  export default StudentClassHome;
  