import React from 'react';
import { Link } from 'react-router-dom';
import { db, auth } from '../../Universal/firebase';
import { collection, query, where, doc, getDoc, getDocs, addDoc } from "firebase/firestore";
import { CalendarClock, SquareX, ChevronDown, ChevronUp , Shapes, CheckSquare, UserPlus} from 'lucide-react';
import { glassStyles, GlassContainer } from '../../../styles';

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
import TabButtons from '../../Universal/TabButtons';
import { createClassWithGrouping,updateExistingClassGroups } from './FunctionsGC';
import Tutorials from './Tutorials';
const TeacherHome = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useAuthState(auth);
  const [teacherData, setTeacherData] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [newClassId, setNewClassId] = useState('');

  const [showCreateClassModal, setShowCreateClassModal] = useState(false); // Add this line
  useEffect(() => {
    const updateGroups = async () => {
      if (user && !localStorage.getItem('groupsUpdated')) {
        try {
          await updateExistingClassGroups(user.uid);
          localStorage.setItem('groupsUpdated', 'true');
        } catch (error) {
          console.error('Error updating class groups:', error);
        }
      }
    };
    updateGroups();
  }, [user]);

  // Modify your existing handleCreateClass function
  const handleCreateClass = async (e, period, classChoice, classData) => {
    e.preventDefault();
    
    try {
      const classId = uuidv4();
      const teacherUID = auth.currentUser.uid;
  
      const result = await createClassWithGrouping({
        teacherUID,
        classId,
        period,
        classChoice,
        classCode: classData.classCode
      }, teacherUID);
      
      if (result.success) {
        setSuccessMessage(`Period ${period}, ${classChoice} Created Successfully`);
        setNewClassId(classId);
        setActiveTab('Classes'); // Switch back to Classes tab
        return true;
      } else {
        throw new Error('Class creation failed');
      }
    } catch (err) {
      console.error('Error creating class:', err);
      alert(`Error creating class: ${err.message}. Please try again.`);
      throw err;
    }
  };
  useEffect(() => {
    const fetchTeacherData = async () => {
      if (!user) return;

      try {
        // First get the teacher document
        const teacherRef = doc(db, 'teachers', user.uid);
        const teacherSnap = await getDoc(teacherRef);
        
        if (teacherSnap.exists()) {
          const teacherData = teacherSnap.data();
          
          // Then fetch all classes where this teacher is the owner
          const classesQuery = query(
            collection(db, 'classes'),
            where('teacherUID', '==', user.uid)
          );
          
          const classesSnap = await getDocs(classesQuery);
          const classes = [];
          
          classesSnap.forEach((doc) => {
            classes.push({
              classId: doc.id,
              ...doc.data()
            });
          });
          
          setTeacherData({
            ...teacherData,
            classes: classes
          });
        }
      } catch (error) {
        console.error("Error fetching teacher data:", error);
      }
    };

    fetchTeacherData();
  }, [user]);


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

  
  const hoverColors = [
    { background: '#F8CFFF', border: '#E01FFF' },
    { background: '#A3F2ED', border: '#4BD682' },
    { background: '#AEF2A3', border: '#006428' },
    { background: '#FFECA8', border: '#CE7C00' },
    { background: '#627BFF', border: '#020CFF' }
  ];
  
  const periodStyles = {
    1: { variant: 'teal', color: "#1EC8bc", borderColor: "#83E2F5" },
    2: { variant: 'purple', color: "#8324e1", borderColor: "#cf9eff" },
    3: { variant: 'orange', color: "#ff8800", borderColor: "#f1ab5a" },
    4: { variant: 'yellow', color: "#ffc300", borderColor: "#Ecca5a" },
    5: { variant: 'green', color: "#29c60f", borderColor: "#aef2a3" },
    6: { variant: 'blue', color: "#1651d4", borderColor: "#b5ccff" },
    7: { variant: 'pink', color: "#d138e9", borderColor: "#f198ff" },
    8: { variant: 'red', color: "#c63e3e", borderColor: "#ffa3a3" },
  };


  const classesRef = collection(db, 'classes');
  const [activeTab, setActiveTab] = useState('Classes'); // State for active tab

 
 
  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

   return (
    <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#white', flexWrap: 'wrap' }}>
      <HomeNav userType="teacher" />
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'left', marginTop: '10px', backgroundColor: '#white', marginBottom: '230px' }}>
        
        {/* Success Message */}
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
            <GlassContainer
            variant={"green"}
            
            size={1}
            >
            <div style={{
           
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'transparent', // green-500
              color: 'green',
              padding: '0px 16px',
              borderRadius: '8px',
              animation: 'fadeIn 0.3s ease-in-out',
              zIndex: 50,
              fontFamily: "'Montserrat', sans-serif"
            }}>
              <CheckSquare style={{ width: '20px', height: '20px' }} />
              <p style={{ color: 'green', fontWeight: '500', marginRight: '20px' }}>{successMessage}</p>
              <button
                onClick={handleAddStudents}
                style={{
                  backgroundColor: 'transparent',
                  color: 'grey',
                  fontSize: '14px',
                  fontFamily: "'montserrat', sans-serif",
                  fontWeight: '500',
                  height: '30px',
                  border: 'none',
                  opacity: '90%',
                  borderRadius: '5px',
                  marginRight: '10px',
                  cursor: 'pointer'
                }}
              >
              Add Students  <UserPlus size={14}/> 
              </button>
              <button
                onClick={handleDismiss}
                style={{
                  backgroundColor: 'transparent',
                  opacity: '100%',
                  color: 'grey',
                  fontSize: '14px',
                  fontFamily: "'montserrat', sans-serif",
                  fontWeight: '500',
                  height: '30px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Dismiss
              </button>
            </div>
            </GlassContainer>
          </div>
        )}

        {/* Loading and Error States */}
       
        {/* Tab Navigation */}
        <div style={{ width: '100%', marginBottom: '-40px', alignItems: 'center', display: 'flex' }}>
          <h1 style={{
            fontSize: '1.5rem',
            marginLeft: 'calc(4% + 200px)',
            fontWeight: '400'
          }}>
            Welcome, {teacherData?.firstName}
          </h1>

          <div style={{
            marginLeft: 'auto',
            display: 'flex',
            gap: '20px',
            marginRight: 'calc(4% )',
            alignItems: 'center'
          }}>
            <TabButtons
              tabs={[
                { id: 'Classes', label: 'Classes' },
                { id: 'Tutorials', label: 'Tutorials' },
                { id: 'Create Class', label: 'Create Class +' }
              ]}
              activeTab={activeTab}
              onTabClick={handleTabClick}
              variant="teal"
              color="#00BBFF"
             
            />
          </div>
        </div>

        {/* Content Area */}
        <div style={{
          marginTop: '100px',
          display: 'flex',
          flexWrap: 'wrap',
          width: 'calc(92% - 200px)',
          marginLeft: 'calc(200px + 4%)',
          fontFamily: "'montserrat', sans-serif", 
          backgroundColor: 'white',
        }}>
          {activeTab === 'Classes' ? (
            <>
              {/* Classes List */}
              {teacherData && teacherData.classes && teacherData.classes
                .sort((a, b) => a.period - b.period)
                .map((classItem, index) => {
                  const periodNumber = classItem.period;
                  const periodStyle = periodStyles[periodNumber] || { background: '#F4F4F4', color: 'grey' };
                 return (
                    <GlassContainer
                      key={classItem.classId}
                      variant={periodStyle.variant}
                      
          enableRotation={true}
                      size={3}
                      onClick={() => navigate(`/class/${classItem.classId}/`)} 
                      style={{ 
                        marginRight: '3%',
                        width: "20rem",
                        marginTop: '40px', 
                        height: '120px',
                        cursor: 'pointer',
                        transition: '.2s', 
                        alignContent: 'center',
                        fontFamily: "'montserrat', sans-serif",
                        transform: 'scale(1)',
                      }}
                      contentStyle={{
                        padding: '20px 50px',
                        margin: '0',
                        height: '100%',
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                      }}
                      className="hoverableButton"
                    >
                      <div style={{ display: 'flex' }}>
                      <h1 style={{
                        fontSize: '2rem',
                        color: periodStyle.color,
                        margin: '0',
                        fontWeight: '500',
                        textShadow: '0px 2px 3px rgba(255, 255, 255, 0.8)',
                        WebkitBackgroundClip: 'text',
                        MozBackgroundClip: 'text',
                        backgroundClip: 'text'
                      }}>
                        Period {periodNumber}
                      </h1>
                      </div>

                      <p style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        textAlign: 'left',
                        color: periodStyle.borderColor,
                        fontWeight: '500', 
                        fontSize: '1.3rem',
                        whiteSpace: 'nowrap',
                        background: 'transparent',
                        margin: '0',
                        marginTop: '10px',
                        textShadow: '0px 2px 3px rgba(255, 255, 255, 0.8)',
                        WebkitBackgroundClip: 'text',
                        MozBackgroundClip: 'text',
                        backgroundClip: 'text'
                      }}>
                        {classItem.classChoice}
                      </p>
                    </GlassContainer>
                  );
                })
              }
            </>
          ) : activeTab === 'Tutorials' ? (
            // Render Tutorials Component
            <Tutorials />
          ) : activeTab === 'Create Class' ? (
            // Render Create Class Component
            <CreateClassModal 
              handleCreateClass={handleCreateClass}
              setShowCreateClassModal={() => setActiveTab('Classes')}
              isInline={true}
            />
          ) : null}
        </div>







      </main>
      <FooterAuth style={{ marginTop: '100px' }}/>
    </div>
  );
};

export default TeacherHome;