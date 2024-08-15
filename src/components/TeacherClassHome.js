
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import Navbar from './Navbar';
import Footer from './Footer';
import { deleteDoc } from 'firebase/firestore';

const TeacherClassHome = ({ currentPage }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { classId } = useParams(); // Extract classId from the URL
  const [className, setClassName] = useState(''); // State to store the class name
  const [classTheme, setClassTheme] = useState(null);
  const [recentAverage, setRecentAverage] = useState('N/A');
  const [overallAverage, setOverallAverage] = useState('N/A');
  const [classChoice, setClassChoice] = useState('');
  const [classChoiceStyle, setClassChoiceStyle] = useState({});
  const [assignmentFormat, setAssignmentFormat] = useState('');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [newAssignmentId, setNewAssignmentId] = useState('');

  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      setNewAssignmentId(location.state.assignmentId);
      setAssignmentFormat(location.state.format);
      // Clear the message from location state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleDismiss = () => {
    setSuccessMessage('');
    setNewAssignmentId('');
    setAssignmentFormat('');
  };
  
  const handleResults = () => {
    setSuccessMessage('');
    setNewAssignmentId('');
    setAssignmentFormat('');
    
    // Extract classId and assignmentId from the newAssignmentId
    let [classId, uid, assignmentId] = newAssignmentId.split('+');
    
    // Remove "DRAFT" from the beginning of the assignmentId if present
    if (assignmentId.startsWith('DRAFT')) {
      assignmentId = assignmentId.slice(5); // Remove the first 5 characters ("DRAFT")
    }
    
    const fullAssignmentId = `${classId}+${uid}+${assignmentId}`;
  
    switch(assignmentFormat) {
      case 'AMCQ':
      case 'MCQ':
        navigate(`/class/${classId}/assignment/${fullAssignmentId}/TeacherResultsAMCQ`);
        break;
      case 'SAQ':
      case 'ASAQ':
        navigate(`/class/${classId}/assignment/${fullAssignmentId}/TeacherResults`);
        break;
      default:
        console.error('Unknown assignment format');
    }
  };

  const getNotificationStyles = (format) => {
    switch(format) {
      case 'AMCQ':
      case 'MCQ':
        return {
          background: '#AEF2A3',
          border: '#4BD682',
          color: '#45B434',
          buttonBg: '#FFECA9',
          buttonColor: '#CE7C00',
          buttonBorder: '#CE7C00'
        };
      case 'SAQ':
      case 'Asaq':
        return {
          background: '#9DA6FF',
          border: '#020CFF',
          color: '#020CFF',
          buttonBg: '#627BFF',
          buttonColor: '#FFFFFF',
          buttonBorder: '#020CFF'
        };
      default:
        return {
          background: '#F4F4F4',
          border: '#CCCCCC',
          color: '#666666',
          buttonBg: '#CCCCCC',
          buttonColor: '#666666',
          buttonBorder: '#666666'
        };
    }
  };
  const periodStyles = {
    1: { background: '#A3F2ED', color: '#1CC7BC' },
        2: { background: '#F8CFFF', color: '#E01FFF' },
        3: { background: '#FFCEB2', color: '#FD772C' },
        4: { background: '#FFECA9', color: '#F0BC6E' },
        5: { background: '#AEF2A3', color: '#4BD682' },
        6: { background: '#BAA9FF', color: '#8364FF' },
        7: { background: '#8296FF', color: '#3D44EA' },
        8: { background: '#FF8E8E', color: '#D23F3F' }
  };
  
  const handleDeleteClass = () => {
    if (!classId) {
      console.error("Invalid classId");
      return;
    }
  
    if (typeof classId !== 'string' || !classId.trim()) {
      console.error("classId must be a non-empty string");
      return;
    }
  
    setShowDeleteConfirm(true);
  };
  const confirmDeleteClass = async () => {
    try {
      const classDocRef = doc(db, 'classes', classId);
      await deleteDoc(classDocRef);
      setShowDeleteConfirm(false);
      navigate('/teacherhome');
    } catch (error) {
      console.error("Error deleting class:", error);
    }
  };
  const RetroConfirm = ({ onConfirm, onCancel, className }) => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backdropFilter: 'blur(5px)',
      background: 'rgba(255,255,255,0.8)',
      zIndex: 100
    }}>
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        borderRadius: '30px',
        backdropFilter: 'blur(5px)',
        transform: 'translate(-50%, -50%)',
        width: '500px',
        backgroundColor: 'rgb(255,255,255,.001)',
        border: '0px solid transparent',
        boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.25)',
        fontFamily: 'Arial, sans-serif',
        zIndex: 100000
      }}>
        <div style={{
          backgroundColor: '#FF6B6B',
          color: '#980000',
          fontFamily: '"Rajdhani", sans-serif',
          border: '10px solid #980000', 
          borderTopRightRadius: '30px',
          borderTopLeftRadius: '30px',
          opacity: '80%',
          textAlign: 'center',
          fontSize: '40px',
          padding: '12px 4px',
          fontWeight: 'bold'
        }}>
          Confirm Deletion
        </div>
        <div style={{ padding: '20px', textAlign: 'center', fontWeight: 'bold', fontFamily: '"Radio Canada", sans-serif', fontSize: '30px' }}>
          Are you sure you want to delete  {classChoice} - {className}?<br />
          This action cannot be undone.
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          padding: '10px'
        }}>
          <button 
            onClick={onConfirm}
            style={{
              width: '200px',
              marginRight: '10px',
              height: '40PX',
              lineHeight: '10PX',
              padding: '5px 5px',
              fontWeight: 'bold',
              fontSize: '24px',
              borderRadius: '10px',
              color: '#980000',
              fontFamily: '"Rajdhani", sans-serif',
              border: '0px solid lightgrey',
              backgroundColor: 'white',
              cursor: 'pointer',
              transition: '.3s'
            }}
            onMouseEnter={(e) => { e.target.style.boxShadow = '0px 4px 4px 0px rgba(0, 0, 0, 0.25)'; }}
            onMouseLeave={(e) => { e.target.style.boxShadow = 'none'; }} 
          >
            Delete
          </button>
          <button 
            onClick={onCancel}
            style={{
              width: '200px',
              marginRight: '10px',
              height: '40PX',
              lineHeight: '10PX',
              padding: '5px 5px',
              fontWeight: 'bold',
              fontSize: '24px',
              borderRadius: '10px',
              color: '#009006',
              marginBottom: '10px',
              fontFamily: '"Rajdhani", sans-serif',
              border: '0px solid lightgrey',
              backgroundColor: 'white',
              cursor: 'pointer',
              transition: '.3s'
            }}
            onMouseEnter={(e) => { e.target.style.boxShadow = '0px 4px 4px 0px rgba(0, 0, 0, 0.25)'; }}
            onMouseLeave={(e) => { e.target.style.boxShadow = 'none'; }} 
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  console.log('Current classChoice:', classChoice);
console.log('Current classChoiceStyle:', classChoiceStyle);
   // Re-run the effect whenever classId changes

  const handleBack = () => {
    navigate('/teacherhome');
  };

  useEffect(() => {
    const fetchClassData = async () => {
      const classDocRef = doc(db, 'classes', classId);
      const classDoc = await getDoc(classDocRef);
  
      if (classDoc.exists()) {
        const data = classDoc.data();
        console.log('Fetched class data:', data);
        
        setClassName(data.classChoice); // This is the full class name
        setClassChoice(data.className); // This is the period
        setRecentAverage(data.mostRecentAssignmentAverage || 'N/A');
        setOverallAverage(data.overallClassAverage || 'N/A');
  
        // Use the color and background directly from the class data
        setClassChoiceStyle({
          background: data.background,
          color: data.color
        });
      }
    };
  
    fetchClassData();
  }, [classId]);

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
    width: '90%', 
    marginLeft: '60px',
    fontFamily: "'Rajdhani', sans-serif", 
    padding: '45px 0', 
    marginBottom: '0px', 
  
 border: '0px solid ',
fontWeight: 'bold',
   
    textAlign: 'center', 
    fontSize: '55px', 
    textDecoration: 'none', 
backgroundColor: 'rgb(50,50,50)',
    color: 'white',
    borderRadius: '20px',
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

      <Navbar userType="teacher" currentPage={currentPage}  />
     
{showDeleteConfirm && (
  <RetroConfirm 
    onConfirm={confirmDeleteClass}
    onCancel={() => setShowDeleteConfirm(false)}
    className={className}
  />
)}
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: '60px' }}>
     
      {successMessage && (
          <div style={{
            position: 'fixed',
            top: '70px',
            zIndex: '10000',
            left: '0',
            right: '0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: getNotificationStyles(assignmentFormat).border,
             height: '6px'
          }}>
            <div style={{width: '1000px',marginLeft: 'auto', marginRight: 'auto',  }}>
            <div style={{
              backgroundColor: getNotificationStyles(assignmentFormat).background,
              border: `6px solid ${getNotificationStyles(assignmentFormat).border}`,
              borderBottomLeftRadius: '20px',
              
             marginTop: '0px',
              borderBottomRightRadius: '20px',
              padding: '0px 20px',
              height: '40px',
              display: 'flex',
              marginRight: 'auto',
              alignItems: 'center',
              marginBottom: '20px',
              whiteSpace: 'nowrap',
              width: '500px',
            }}>
              <p style={{ color: getNotificationStyles(assignmentFormat).color, fontWeight: 'bold', marginRight: '20px' }}>{successMessage}</p>
              <button
                onClick={handleResults}
                style={{
                  backgroundColor: getNotificationStyles(assignmentFormat).buttonBg,
                  color: getNotificationStyles(assignmentFormat).buttonColor,
                  fontSize: '16px',
                  fontFamily: "'Radio Canada', sans-serif",
                  fontWeight: 'BOLD',
                  height: '30px',
                  border: `6px solid ${getNotificationStyles(assignmentFormat).buttonBorder}`,
                  borderRadius: '5px',
                  marginRight: '10px',
                  cursor: 'pointer'
                }}
              >
                Grades
              </button>
              <button
                onClick={handleDismiss}
                style={{
                  backgroundColor: 'white',
                  color: getNotificationStyles(assignmentFormat).color,
                  fontSize: '16px',
                  fontFamily: "'Radio Canada', sans-serif",
                  fontWeight: 'BOLD',
                  height: '30px',
                  border: `6px solid ${getNotificationStyles(assignmentFormat).border}`,
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Dismiss
              </button>
            </div>
            </div>
          </div>
        )}
     <div  style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: '70px', width: '1200px'}}>


      <div style={{width: '100%', display: 'flex', justifyContent: 'space-between'}}>
     
     
     
      <div
          
          style={{ 
            width: '60%', zIndex: '1',
            height: '400px',
           position: 'relative',
            marginBottom: '50px', 
            marginTop: '75px',
            border: '15px solid #F4F4F4',
            backgroundColor: 'white',
            borderRadius:'50px',
            fontFamily: "'Radio Canada', sans-serif",
      
            textAlign: 'center', 
            fontSize: '40px', 
            textDecoration: 'none', 
            color: 'white',
           marginRight:'-30px', marginLeft:'10px',
         transition: '.3s', 
                 
                  transform: 'scale(1)'
                   // Set default background color
            // Set default text color
        }}
   
    >
<div style={{fontSize: '36px',
  height: '60px',
 
  fontFamily: "'Radio Canada', sans-serif",
  marginTop: '-0px',
  marginLeft:"-15px",
  marginRight:"-15px",
  textAlign: 'center',
  marginBottom: '-27px',
  zIndex: '20',
  color: 'grey',
  position: 'relative',
  fontWeight: 'lighter',
  backgroundColor: 'transparent',
  alignItems: 'center',
  lineHeight: '60px',
  display: 'flex',
  justifyContent: 'center'
}}>
<h1 style={{
  width: '100%',
  border: '15px solid ', 
  borderColor:  classChoiceStyle.color || 'grey',
  height: ' 80px',  
  lineHeight: '80px',
  fontWeight: 'bold',
  borderTopLeftRadius: '50px', 
  borderTopRightRadius: '50px', 
  backgroundColor: classChoiceStyle.background || 'white', 
  color: classChoiceStyle.color || 'grey',
  fontSize: '35px', 
  paddingLeft: '30px', 
  paddingRight: '30px', 
  fontFamily: "'Radio Canada', sans-serif", 
  marginLeft: '0px', 
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  textShadow: 'none' 
}}>
  {className}
</h1></div>
<div style={{display: 'flex'}}>
  <h1 style={{ textAlign: 'center', textShadow: 'none', marginTop: '120px', width:'100%',
     fontSize: '120px', fontWeight: 'bold', color: 'grey',fontFamily: "'Rajdhani', sans-serif", }}>
      {classChoice}</h1>
      

     
</div>
</div>
<div style={{display: 'flex', flexDirection: 'column', marginTop: '80px',width: '40%'}}>
      <Link 
          to={`./participants`} 
          style={{ 
            ...linkStyle,
            backgroundColor: '#FFF0A1',
            marginTop: '20px',
           
            border: '10px solid #FC8518',
            color: '#FC8518'
           
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
         Students
        </Link> 
      <Link 
          to={`./Assignments`} 
          style={{ 
            ...linkStyle,
            backgroundColor: '#99B6FF',
            marginTop: '20px',
            color: '#020CFF',
            border: '10px solid #020CFF'
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
          Assignments
        </Link>
        
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


        </div>
        <button onClick={handleDeleteClass} style={{marginTop: '90px', backgroundColor: 'transparent', borderColor: 'transparent', marginRight: 'auto', fontWeight: 'bold',  marginBottom: '-90px',      fontFamily: "'Radio Canada', sans-serif", color: 'darkgrey', cursor: 'pointer',fontSize: '20px' }}>Delete Class</button>
     
        </div>
      </main>
      <Footer></Footer>
    </div>
  );
};

export default TeacherClassHome;
