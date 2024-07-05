
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import Navbar from './Navbar';
import Footer from './Footer';
import { deleteDoc } from 'firebase/firestore';

const TeacherClassHome = () => {
  const navigate = useNavigate();
  const { classId } = useParams(); // Extract classId from the URL
  const [className, setClassName] = useState(''); // State to store the class name
  const [classTheme, setClassTheme] = useState(null);
  const [recentAverage, setRecentAverage] = useState('N/A');
  const [overallAverage, setOverallAverage] = useState('N/A');
  const [classChoice, setClassChoice] = useState('');
  const handleDeleteClass = async () => {
    if (!classId) {
      console.error("Invalid classId");
      return;
    }
  
    if (typeof classId !== 'string' || !classId.trim()) {
      console.error("classId must be a non-empty string");
      return;
    }
  
    if (window.confirm("Are you sure you want to delete this class?")) {
      try {
        const classDocRef = doc(db, 'classes', classId);
        await deleteDoc(classDocRef);
        navigate('/teacherhome'); // Redirect after successful deletion
      } catch (error) {
        console.error("Error deleting class:", error);
      }
    }
  };
  
  useEffect(() => {
    // Fetch the class data from Firestore
    const fetchClassData = async () => {
      const classDocRef = doc(db, 'classes', classId);
      const classDoc = await getDoc(classDocRef);

      if (classDoc.exists()) {
        setClassName(classDoc.data().className);
        setClassTheme(classDoc.data().theme);
        setClassChoice(classDoc.data().classChoice);
        // Fetch the averages
        setRecentAverage(classDoc.data().mostRecentAssignmentAverage || 'N/A');
        setOverallAverage(classDoc.data().overallClassAverage || 'N/A');
      }
    };

    fetchClassData();
  }, [classId]); // Re-run the effect whenever classId changes

  const handleBack = () => {
    navigate('/teacherhome');
  };



  const getGradientStyle = (type, index) => {
    if (!classTheme) return {};
    const gradient = type === 'main' ? classTheme.main : classTheme.sub[index];
  
    return { 
      position: 'relative',
      border: '8px solid transparent',
      borderRadius: '10px',
      
      '&::before': {
        content: '""',
        position: 'absolute',
        top: -8, right: -8, bottom: -8, left: -8,
        background: gradient,
        borderRadius: 'inherit',
        zIndex: -1
      }
    };
  };
  const linkStyle = {
    width: '280px', 
    fontFamily: "'Radio Canada', sans-serif",
    padding: '40px 0', 
    marginBottom: '0px', 
 border: '0px solid ',
fontWeight: 'bold',
   
    textAlign: 'center', 
    fontSize: '25px', 
    textDecoration: 'none', 
backgroundColor: 'rgb(50,50,50)',
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

      <Navbar userType="teacher" />
     

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
        
        
        <div style={{width: '384px', backgroundColor: 'white', border: `10px solid ${getBorderColor(recentAverage)}`, borderRadius: '30px', height: '374px',marginLeft: '70px'}}>
          <h1 style={{fontSize: '22px', padding: '20px', width: '110px', textAlign: 'center', backgroundColor: 'white', fontWeight: 'normal', fontFamily: "'Radio Canada', sans-serif", lineHeight: '1', marginTop: '-105px', marginLeft: 'auto', marginRight: 'auto', color: 'grey'}}> <h5 style={{fontSize: '34px', marginBottom: '-0px', color: 'grey'}}>Recent</h5> Average</h1>
          <h2 style={{width: '100%', fontSize: '130px', fontWeight: 'normal', fontFamily: "'Radio Canada', sans-serif", textAlign: 'center', color: 'grey', marginTop: '65px'}}>{recentAverage}</h2>
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
          to={`./drafts`} 
          style={{ 
            ...linkStyle,
            backgroundColor: '#F8CFFF',
            color: '#B500D2'
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
          e.target.style.boxShadow= '';
          e.target.style.transform = 'scale(1)'; 
        }}
        
    >
          Resources
        </Link>
    <Link
          to={`./teacherassignmenthome`} 
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
            e.target.style.boxShadow= '';
            e.target.style.transform = 'scale(1)'; 
          }}
          
        
    >
        Create
    </Link>

        <Link 
          to={`./TeacherGradesHome`} 
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
            e.target.style.boxShadow= '';
            e.target.style.transform = 'scale(1)'; 
          }}
          
        
    >
          Grades
        </Link>
        <Link 
          to={`./participants`} 
          style={{ 
            ...linkStyle,
            backgroundColor: '#FFECA8',
            color: '#817400'
           
          }}
          onMouseEnter={(e) => {
            e.target.style.opacity = '85%';
            e.target.style.boxShadow= ' 0px 4px 4px 0px rgba(0, 0, 0, 0.25)';
            e.target.style.transform = 'scale(1.01)';
          
         
            
          }}
          onMouseLeave={(e) => {
            e.target.style.opacity = '100%';
            e.target.style.boxShadow= '';
            e.target.style.transform = 'scale(1)'; 
          }}
          
        
    >
         Participants
        </Link>
        
      
        </div>
        <button onClick={handleDeleteClass} style={{marginTop: '40px', backgroundColor: 'transparent', borderColor: 'transparent', marginRight: 'auto', fontWeight: 'bold',  marginBottom: '-50px',      fontFamily: "'Radio Canada', sans-serif", color: 'darkgrey', cursor: 'pointer',fontSize: '20px' }}>Delete Class</button>
     
        </div>
      </main>
      <Footer></Footer>
    </div>
  );
};

export default TeacherClassHome;
