import React from 'react';
import { Link } from 'react-router-dom';
import { db, auth } from '../../Universal/firebase';
import { collection, query, where, doc, getDoc, getDocs, updateDoc, arrayUnion, addDoc } from "firebase/firestore";
import { CalendarClock, SquareX, ChevronDown, ChevronUp , Shapes} from 'lucide-react';

import { useState, useEffect } from 'react';
import {  useNavigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import HomeNavbar from '../../Universal/HomeNavbar';
import FooterAuth from '../../unAuthenticated/FooterAuth'; 
import CreateClassModal from './CreateClassModal';// Make sure this file exists in the same directory
import AnimationGreen from '../../Universal/AnimationGreen';
import AnimationAll from '../../Universal/AnimationAll';
import Loader from '../../Universal/Loader';
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





  const handleCreateClass = async (e, period, classChoice) => {
    e.preventDefault();
    const classCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    const teacherUID = auth.currentUser.uid;
    const className = `Period ${period}`;
    const periodStyle = periodStyles[period];
  
    const classData = {
      className,
      classChoice,
      classCode,
      teacherUID,
      students: [],
      background: periodStyle.background,
      color: periodStyle.color
    };
  
    try {
      const classDocRef = await addDoc(collection(db, 'classes'), classData);
      
      setSuccessMessage(`${classData.classChoice}, ${className}, was successfully added to your roster`);
      setNewClassId(classDocRef.id);
      setShowCreateClassModal(false);
    } catch (err) {
      console.error('Error creating class:', err);
      alert('Error creating class. Please try again.');
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
    <div style={{  display: 'flex', flexDirection: 'column', backgroundColor: 'white', flexWrap: 'wrap' }}>
     <HomeNavbar userType="teacher" />
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px', backgroundColor: 'white', marginBottom: '230px' }}>
        {loading && <p>Loading...</p>}
        {error && <p>Error: {error.message}</p>}

        <div style={{
          marginTop: '70px',
          display: 'flex',
         flexWrap:'wrap', 
         width: '1000px',
         fontFamily: "'montserrat', sans-serif",
          backgroundColor: 'white',
          
          marginLeft: 'auto',
          marginRight: 'auto'
          }}>
            {successMessage && (
  <div style={{
    position: 'fixed',
    top: '70px',
    zIndex: '10000',
    left: '0',
    right: '0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  }}>
    <div style={{width: '100%', background: '#4BD682', height: '6px'}}></div>


   

    <div style={{
      backgroundColor: '#AEF2A3',
      border: '6px solid #4BD682',
      borderBottomLeftRadius: '20px',
      borderTop: '0px',
      borderBottomRightRadius: '20px',
      padding: '0px 20px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      marginTop: '0px',
      marginBottom: '20px',
      whiteSpace: 'nowrap'
    }}>
      <p style={{ color: '#45B434', fontWeight: 'bold', marginRight: '20px' }}>{successMessage}</p>
      <button
        onClick={handleAddStudents}
        style={{
          backgroundColor: '#FFECA9',
          color: '#CE7C00',
          fontSize: '16px',
          fontFamily: "'montserrat', sans-serif",
          fontWeight: 'BOLD',
          height: '30px',
          border: '4px solid #CE7C00',
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
          backgroundColor: 'white',
          color: '#4BD682',
          fontSize: '16px',
          fontFamily: "'montserrat', sans-serif",
          fontWeight: 'BOLD',
          height: '30px',
          border: '4px solid #4BD682',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Dismiss
      </button>
    </div>
  </div>
)}

<div style={{ fontFamily: "'montserrat', sans-serif",width: '90%', display: 'flex',marginLeft: '32px', fontSize: '60px',  marginTop: '0px', height: '70px',
  marginBottom: '100px',
}}>
            <h4 style={{
              fontSize: '60px', 
             
            }}>Your Classes</h4>


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
              <div key={classItem.id} style={{ 
                marginBottom: '10px',
                width: '300px',
                marginLeft:'32px',
                display: 'inline-block',
                flexDirection: 'column',
                flexWrap: 'wrap',
                alignItems: 'center', 
                fontFamily: "'montserrat', sans-serif" ,
                position: 'relative',
                marginTop: '20px', 
              }}>
                <div style={{
                  fontSize: '16px',
                  height: '50px',
                  marginLeft: 'auto',
                  
                  marginRight: 'auto',
                  fontFamily: "'montserrat', sans-serif",
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
                  <div style={{
                    width: '268px',
                    border: `6px solid ${periodStyle.color}`,
                    backgroundColor: periodStyle.background,
                    paddingLeft: '0px',
                    paddingRight: '0px',
                    marginLeft: '0px',
                    height: '30px',
                    fontWeight: 'bold',
                    color: periodStyle.color,
                    lineHeight: '30px',
                    borderTopLeftRadius: '15px',
                    borderTopRightRadius: '15px',
                   
                  }}>
                    <p style={{marginTop: '0px',  overflow: 'hidden',
                    textOverflow: 'ellipsis', 
                    textAlign: 'left',
                    whiteSpace: 'nowrap',width: '240px', background: 'tranparent', marginLeft: '20px',  }}>{classItem.classChoice}</p>
                    
                  </div>
                </div>
            
                <button 
                    onClick={() => navigate(`/class/${classItem.id}`)} 
                    style={{ 
                      marginLeft: 'auto',
                      marginRight: 'auto',
                      flex: 1,
                      fontWeight: '800',
                      width: '280px',
                      height: '100px',
                      justifyContent: 'center',
                      display: 'flex',
                      backgroundColor: 'transparent',  
                      color: 'grey', 
                      cursor: 'pointer',
                      border: '6px solid #F4F4F4', 
                      borderRadius: '15px', 
                      lineHeight: '90px',
                      textAlign: 'left',
                      flexDirection: 'column',
                      alignItems: 'center',
                      transition: '.2s', 
                      position: 'relative',
                      zIndex: '1',
                      marginTop:'0px',
                      fontFamily: "'montserrat', sans-serif",
                      transform: 'scale(1)',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = '#E8E8E8';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = '#f4f4f4';
                    }}
                    className="hoverableButton"
                  >
                    <h1 style={{fontSize: '30px', marginTop: '30px', width: '250px',  textAlign: 'left', marginLeft: '20px',
                      fontWeight: '600',}}>{classItem.className}</h1>
                  </button>
              </div>
               );
              })
            }
</div>





<div style={{width: '1000px', marginRight: 'auto', marginLeft: 'auto', marginTop: '30px', display: 'flex'}}>
<button
            onClick={() => setShowCreateClassModal(true)}
            style={{
              marginRight: 'auto', 
              backgroundColor: '#AEF2A3',
              border: '4px solid #45B434',
              marginLeft: '32px',
              fontSize: '20px', 
              transition: '.3s', 
              color: '#45B434',
              borderRadius: '10px',
              padding: '10px 20px', 
              width: '200px', 
              fontFamily: "'montserrat', sans-serif",
              textAlign: 'center', 
              fontWeight: 'bold',
              cursor: 'pointer',
              
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#138E00';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#45B434';
            }}
          >
            Create Class +
          </button>
          
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
              backgroundColor: '#9CACFF',
              border: '4px solid #020CFF',
              color: '#020CFF',
              borderRadius: '10px',
              padding: '20px 20px',
              fontFamily: "'montserrat', sans-serif",
              height: '40px',
              fontWeight: 'bold',
              cursor: 'pointer',
             marginTop: '0px',
             lineHeight: '0px',
             marginLeft: '-570px',
              fontSize: '20px',
              transition: '.3s',
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#001CAE';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#020CFF';
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
