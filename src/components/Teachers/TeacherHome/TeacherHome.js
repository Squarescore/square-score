import React from 'react';
import { Link } from 'react-router-dom';
import { db, auth } from '../../Universal/firebase';
import { collection, query, where, doc, getDoc, getDocs, updateDoc, arrayUnion, addDoc } from "firebase/firestore";
import { CalendarClock, SquareX, ChevronDown, ChevronUp , Shapes} from 'lucide-react';

import { useState, useEffect } from 'react';
import {  useNavigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import Navbar from '../../Universal/Navbar';
import FooterAuth from '../../unAuthenticated/FooterAuth'; 
import CreateClassModal from './CreateClassModal';// Make sure this file exists in the same directory
import AnimationGreen from '../../Universal/AnimationGreen';
import AnimationAll from '../../Universal/AnimationAll';
import Loader from '../../Universal/Loader';
import { safeClassUpdate} from '../../teacherDataHelpers';
import { v4 as uuidv4 } from 'uuid';
import HomeNav from '../../Universal/HomeNavbar';
const TeacherHome = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useAuthState(auth);
  const [teacherData, setTeacherData] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [schoolCode, setSchoolCode] = useState('');
 
  const [successMessage, setSuccessMessage] = useState('');
  const [newClassId, setNewClassId] = useState('');

  const [showCreateClassModal, setShowCreateClassModal] = useState(false); // Add this line


const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const handleCreateClass = async (e, period, classChoice) => {
  e.preventDefault();
  
  try {
    const className = `Period ${period}`;
    const classId = uuidv4(); // Generate unique classId
    const classCode = Math.random().toString(36).substr(2, 6).toUpperCase(); // Generate unique classCode
    const teacherUID = auth.currentUser.uid;
    const periodStyle = periodStyles[period];

    const classData = {
      teacherUID: teacherUID,
      classId, // Unique UUID
      classCode, // Separate code
      className,
      classChoice,
      background: periodStyle.background,
      color: periodStyle.color,
      period
    };

    // Call the 'createClass' Cloud Function
    const result = await safeClassUpdate('createClass', classData);
    
    if (result.data && result.data.success) {
      setSuccessMessage(`${classChoice}, ${className}, was successfully added to your roster`);
      setNewClassId(classId); // Use classId, not classCode
      setShowCreateClassModal(false);
    } else {
      throw new Error('Class creation failed');
    }
  } catch (err) {
    console.error('Error creating class:', err);
    alert(`Error creating class: ${err.message}. Please try again.`);
  }
};



  useEffect(() => {
    const fetchTeacherData = async () => {
      if (user) {
        const teacherRef = doc(db, 'teachers', user.uid);
        const teacherSnap = await getDoc(teacherRef);
        if (teacherSnap.exists()) {
          setTeacherData(teacherSnap.data());
        }
      }
    };
    fetchTeacherData();
  }, [user]);

  const handleJoinOrganization = async () => {
    try {
      const schoolsQuery = query(collection(db, 'schools'), where('joinCode', '==', schoolCode));
      const schoolsSnap = await getDocs(schoolsQuery);

      if (!schoolsSnap.empty) {
        const schoolDoc = schoolsSnap.docs[0];
        const schoolData = schoolDoc.data();
        const schoolRef = doc(db, 'schools', schoolDoc.id);

        // Update teacher's document
        const teacherRef = doc(db, 'teachers', user.uid);
        await updateDoc(teacherRef, { 
          school: schoolData.schoolName, 
          schoolCode
        });

        // Add teacher UID to school's teachers array
        await updateDoc(schoolRef, { teachers: arrayUnion(user.uid) });

        // Update state
        setTeacherData(prevData => ({ 
          ...prevData, 
          school: schoolData.schoolName,
          schoolCode: schoolData.schoolCode
        }));
        setModalOpen(false);
        setSchoolCode('');
      } else {
        alert('Invalid school code.');
      }
    } catch (error) {
      console.error('Error joining organization:', error);
    }
  };
  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      setNewClassId(location.state.classId);
      // Clear the message from location state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleDismiss = () => {
    setSuccessMessage('');
    setNewClassId('');
  };
  
  const handleAddStudents = () => {
    setSuccessMessage('');
    setNewClassId('');
    navigate(`/class/${newClassId}/participants`);
  };
  const getRandomColor = () => {
    return hoverColors[Math.floor(Math.random() * hoverColors.length)];
  };
  const handleButtonHover = (e) => {
    if (e.currentTarget === e.target) {
      e.currentTarget.style.boxShadow = '0px 4px 4px 0px rgba(0, 0, 0, 0.25)';
    }
  };

  const handleButtonLeave = (e) => {
    e.currentTarget.style.boxShadow = 'none';
  };
  const hoverColors = [
    { background: '#F8CFFF', border: '#E01FFF' },
    { background: '#A3F2ED', border: '#4BD682' },
    { background: '#AEF2A3', border: '#006428' },
    { background: '#FFECA8', border: '#CE7C00' },
    { background: '#627BFF', border: '#020CFF' }
  ];
  
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


  const classesRef = collection(db, 'classes');
  const teacherUID = auth.currentUser.uid;
  const classQuery = query(classesRef, where('teacherUID', '==', teacherUID));
  const [querySnapshot, loading, error] = useCollection(classQuery);

  const classes = querySnapshot?.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
 
 
  return (
    <div style={{  display: 'flex', flexDirection: 'column', backgroundColor: '#white', flexWrap: 'wrap' }}>
     <HomeNav userType="teacher" />
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'left', marginTop: '10px', backgroundColor: '#white', marginBottom: '230px' }}>

      {successMessage && (
  <div style={{
    position: 'fixed',
    bottom: '20px',
    zIndex: '10000',
    right: '4%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  }}>
   
   

    <div style={{
      backgroundColor: '#CCFFC3',
      marginLeft: '0%',
      marginRight: 'auto',
      border: '1px solid #4BD682',
      borderRadius: '10px',
      padding: '0px 20px',
      height: '50px',
      display: 'flex',
      alignItems: 'left',
      marginTop: '0px',
      marginBottom: '20px',
      whiteSpace: 'nowrap'
    }}>
      <p style={{ color: '#45B434', fontWeight: '600', marginRight: '20px' }}>{successMessage}</p>
      <button
        onClick={handleAddStudents}
        style={{
          backgroundColor: '#FFF5D2',
          color: '#FFAE00',
          fontSize: '16px',
          marginTop: '10px',
          fontFamily: "'montserrat', sans-serif",
          fontWeight: '500',
          height: '30px',
          border: '1px solid #FFAE00',
          borderRadius: '5px',
          marginRight: '10px',
          cursor: 'pointer'
        }}
      >
        Add Students
      </button>
      <button
        onClick={handleDismiss}
        style={{
          backgroundColor: '#FFFFFF',
          color: 'lightgrey',
          marginTop: '10px',
          fontSize: '16px',
          fontFamily: "'montserrat', sans-serif",
          fontWeight: '500',
          height: '30px',
          border: '1px solid lightgrey',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Dismiss
      </button>
    </div>
  </div>
)}
        {loading && <p>Loading...</p>}
        {error && <p>Error: {error.message}</p>}


        <div style={{width: '100%', borderBottom: '1px solid lightgrey',  marginBottom: '-40px'}}>
            <h1 style={{
fontSize: '30px',
marginLeft: 'calc(4% + 200px)',
fontWeight: '600'


            }}>
Home    </h1>

<button
           
            style={{
              background: 'none',
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer',
              
marginLeft: 'calc(4% + 200px)',
              fontWeight: "600",
              padding: '12px 10px',
              fontFamily: "'Montserrat', sans-serif",
              borderBottom:  '2px solid #E01FFF',
              color:  '#E01FFF' ,
            }}
          >
            Classes
          </button>
      
          <button
           
           style={{
             background: 'none',
             border: 'none',
             fontSize: '14px',
             cursor: 'pointer',
             marginLeft: '50px',

             fontWeight: "600",
             padding: '12px 10px',
             fontFamily: "'Montserrat', sans-serif",
             borderBottom:  '2px solid transparent',
             color:  'grey' ,
           }}
         >
           Tutorials
         </button>

            </div>










        <div style={{
          marginTop: '40px',
          display: 'flex',
         flexWrap:'wrap', 
         width: 'calc(92% - 200px)',
         marginLeft: 'calc(200px + 4%)',
         fontFamily: "'montserrat', sans-serif",
          backgroundColor: 'white',
          
          }}>

           
         

<div style={{ fontFamily: "'montserrat', sans-serif",width: '100%', display: 'flex', height: '30px',
  marginBottom: '10px', marginTop: '30px',

}}>
            <h4 style={{
              fontSize: '25px', 
              marginTop: '10px',
             fontWeight: '600'
            }}>Your Classes</h4>

<button
            onClick={() => setShowCreateClassModal(true)}
            style={{
              marginRight: '4%', 
              backgroundColor: 'white',
              border: '1px solid lightgrey',
              marginLeft: 'auto',
              fontSize: '16px', 
              width: '140px',
              marginTop: '0px',
              transition: '.3s', 
              color: 'grey',
              borderRadius: '5px',
              padding: '10px 5px', 
              fontWeight: '600',
              fontFamily: "'montserrat', sans-serif",
              textAlign: 'center', 
              lineHeight: '20px',
              cursor: 'pointer',
              height: '40px',
            }}
            onMouseEnter={(e) => {
              e.target.style.color = '#45B434';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = 'grey';
            }}
          >
          
            Create Class +
          </button>
          
            </div>
           
       

            {modalOpen && (
          <div style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backdropFilter: 'blur(15px)',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
zIndex: '100'
          }}>
            <div style={{
              backgroundColor: 'transparent',
              padding: '20px',
              borderRadius: '10px',
              textAlign: 'center',
            }}>
              <h3
             
              style={{ fontSize: '80px', fontFamily: '"montserrat", sans-serif', marginTop:' -50px', marginBottom: '0px'}}
              >School Code</h3>
              <input
                type="text"
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value)}
              style={{  fontFamily: "'montserrat', sans-serif", fontSize: '100px',background: "white", borderRadius: '20px', border: '4px solid lightgrey',
                width: '440px',paddingLeft: '60px',paddingRight: '60px', paddingTop: '10px', paddingBottom: '10px', fontWeight: 'bold',
                 textAlign: 'Left', 
                  outline: 'none', }} />  
              <br />
              <button
                onClick={handleJoinOrganization}
                style={{ 
                  padding: '10px 20px', 
                  backgroundColor: '#AEF2A3',
              border: '5px solid #45B434',
              color: '#45B434',
                    borderRadius: '15px',
                     cursor: 'pointer', 
                    marginTop: '30px',
                     fontFamily: "'montserrat', sans-serif",
                     fontWeight: 'bold',
                     fontSize: '30px',
                     width: '45%',
                     marginRight: '10px' }}
              >
                Join
              </button>
              <button
                onClick={() => setModalOpen(false)}
                style={{ 

                  padding: '10px 20px', 
                  backgroundColor: '#f4f4f4',
              border: '5px solid lightgrey',
              color: 'grey',
                    borderRadius: '15px',
                     cursor: 'pointer', 
                    marginTop: '30px',
                     fontFamily: "'montserrat', sans-serif",
                     fontWeight: 'bold',
                     fontSize: '30px',
                     width: '45%',
                     marginRight: '10px'
                 }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}


   
            {classes && classes
          .sort((a, b) => a.className.localeCompare(b.className)) // Sort alphabetically by className
          .map((classItem, index) => {
            const periodNumber = parseInt(classItem.className.split(' ')[1]);
            const periodStyle = periodStyles[periodNumber] || { background: '#F4F4F4', color: 'grey' };
            return (
             
             
            
                <button 
                key={classItem.id}
                    onClick={() => navigate(`/class/${classItem.id}`)} 
                    style={{ 
                      marginRight: '3%',
                      flex: 1,
                      width: "30%",
                      maxWidth: '30%',
                      marginTop: '20px', 
                      height: '130px',
                      display: 'flex',
                      backgroundColor: 'transparent',  
                      color: 'grey', 
                      cursor: 'pointer',
                      border: '1px solid lightgrey', 
                      borderRadius: '15px', 
                      textAlign: 'left',
                      flexDirection: 'column',
                      alignItems: 'left',
                      transition: '.2s', 
                      position: 'relative',
                      zIndex: '1',
                      fontFamily: "'montserrat', sans-serif",
                      transform: 'scale(1)',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = '#dddddd';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = 'lightgrey';
                    }}
                    className="hoverableButton"
                  >
                    <h1 style={{fontSize: '35px', 
                    
                    
                    backgroundColor: periodStyle.background,
                    
                    color: periodStyle.color,
                    marginLeft: '15%',
                    height: '16px',
                    lineHeight: '16px',
                    marginTop: '40px', width: '180px',  textAlign: 'left',
                    paddingLeft: '5px', fontSize: '40px',
                      fontWeight: '600',}}>{classItem.className}</h1>
                
                
                <p style={{marginTop: '0px',  overflow: 'hidden',
                    textOverflow: 'ellipsis', marginLeft: '15%',
                    textAlign: 'left',color: 'lightgrey', fontWeight: '600', 
                    marginTop: '-10px',fontSize: '16px',
                    whiteSpace: 'nowrap',width: '268px', background: 'tranparent',   }}>{classItem.classChoice} </p>
                    
                
                
                  </button>
            
               );
              })
            }
</div>





<div style={{width: '1000px', marginRight: 'auto', marginLeft: 'auto', marginTop: '30px', display: 'flex'}}>

          {teacherData && teacherData.school ? (
         <div
         style={{ 
            
          

          marginTop: '10px', marginLeft: 'auto',
          marginRight: 'auto',
           fontSize: '30px',  color: 'lightgrey' }}>
            
         <h4 style={{ 
            marginLeft: '-400px',
            fontFamily: "'montserrat', sans-serif",
            marginTop: '0px', 
             fontSize: '30px',  color: 'lightgrey' }}> {teacherData.school}</h4>
             </div>
        ) : (
          <button
            onClick={() => setModalOpen(true)}
            style={{
              marginRight: 'auto',
              backgroundColor: 'white',
              border: '4px solid white',
              fontWeight: '600',
              color: 'grey',
              borderRadius: '10px',
              padding: '20px 20px',
              fontFamily: "'montserrat', sans-serif",
              height: '45px',
              cursor: 'pointer',
             marginTop: '0px',
             lineHeight: '0px',  boxShadow: '1px 1px 5px 1px rgb(0,0,155,.1)',
             
             marginLeft: '-570px',
              fontSize: '20px',
              transition: '.3s',
            }}
            onMouseEnter={(e) => {
              e.target.style.color = '#020CFF';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = 'grey';
            }}
          >
            Join School
          </button>
        )}


        </div>
       







        

        {showCreateClassModal && (
  <CreateClassModal 
    handleCreateClass={handleCreateClass}
    setShowCreateClassModal={setShowCreateClassModal}
  />
)}

      </main>

      <FooterAuth style={{marginTop: '100px'}}/>
      
    </div>
    
  );
  
};

export default TeacherHome;
