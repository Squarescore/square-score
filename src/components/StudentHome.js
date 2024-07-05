import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from './firebase'; // Ensure this path is correct
import { collection, query, where, getDocs } from "firebase/firestore";
import { signOut } from 'firebase/auth'; // Import signOut function
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import HomeNavbar from './HomeNavbar';
import FooterAuth from './FooterAuth';
const StudentHome = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const studentUID = auth.currentUser.uid;

  useEffect(() => {
    const fetchClasses = async () => {
      const classesRef = collection(db, 'classes');
      const classQuery = query(classesRef, where('students', 'array-contains', studentUID));
      const classesSnapshot = await getDocs(classQuery);
      const classesData = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setClasses(classesData);
    };

    fetchClasses();
  }, [studentUID]);
  const handleLeaveClass = async (classId) => {
    if (window.confirm("Are you sure you want to leave this class?")) {
    try {
      const classRef = doc(db, 'classes', classId);
      const classDoc = await getDoc(classRef);
      const classData = classDoc.data();
  
      if (classData.students.includes(studentUID)) {
        const updatedStudents = classData.students.filter(uid => uid !== studentUID);
        await updateDoc(classRef, { students: updatedStudents });
        // Optionally, you can also update the local state to reflect the change immediately
        setClasses(prevClasses => prevClasses.filter(classItem => classItem.id !== classId));
      }
    } catch (error) {
      console.error("Error leaving class:", error);
    }}
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    
    <div style={{  display: 'flex', flexDirection: 'column', backgroundColor: 'white', flexWrap: 'wrap' }}>
    <HomeNavbar userType="student" />
     
        
    <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px', backgroundColor: 'white',marginBottom: '230px'  }}>
      
    <div style={{
          marginTop: '70px',
          display: 'flex',
         flexWrap:'wrap', 
         width: '1000px',
         fontFamily: "'Radio Canada', sans-serif",
          backgroundColor: 'white',
          
          marginLeft: 'auto',
          marginRight: 'auto'
          }}>
            <h4 style={{width: '90%', marginLeft: '32px', fontSize: '40px', marginBottom: '0px', marginTop: '10px'}}>Your Classes</h4>
       
       {classes.map(classItem => (

        
          <div key={classItem.id} style={{ 
            marginBottom: '10px',
            width: '300px',
             marginLeft:'32px',
               display: 'inline-block',
                flexDirection: 'column',
                 flexWrap: 'wrap',
                  alignItems: 'center', 
                  fontFamily: "'Poppins', sans-serif" ,
                  position: 'relative',
                  marginTop: '20px', 
                   }}>
                    <h1 style={{fontSize: '16px',
      
       height: '50px',
       marginLeft: 'auto',
       marginRight: 'auto',
       fontFamily: "'Radio Canada', sans-serif",
   
        textAlign: 'center',
        marginBottom: '-27px',
         zIndex: '20',
          color: 'grey',  position: 'relative',
          fontWeight: 'lighter', backgroundColor: 'transparent', alignItems: 'center', lineHeight: '1',
           display: 'flex', justifyContent: 'center'}}>
            <p style={{ width: ' fit-content;', backgroundColor: 'white',paddingLeft: '10px', paddingRight: '10px', marginLeft: '0px'}}>{classItem.classChoice}</p></h1> 
            
            <button
              onClick={() => navigate(`/studentassignments/${classItem.id}`)} 
              style={{ 
                
                marginLeft: 'auto',
                marginRight: 'auto',
                flex: 1,
                fontWeight: 'bold',
                width: '280px',
                height: '140px',
                justifyContent: 'center',
                display: 'flex',
                backgroundColor: 'transparent',  
                color: 'grey', 
                border: '6px solid lightgrey', 
                borderRadius: '15px', 
                textAlign: 'center',
                flexDirection: 'column',
          alignItems: 'center',
                fontSize: '35px',
                transition: '.2s', 
                position: 'relative',
                zIndex: '1',
               
          marginTop:'0px',
          fontFamily: "'Radio Canada', sans-serif",
                transform: 'scale(1)',
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#627BFF';
             
             
                
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'lightgrey';
              
              
              }}
              
              className="hoverableButton"
            >
              
              {classItem.className}
            </button>
              
        

              
            </div>
        ))}
</div>

       
        
<div style={{width: '1000px', marginRight: 'auto', marginLeft: 'auto', marginTop: '30px'}}>
        <Link to="/joinclass" style={{
           marginRight: 'auto', 
           textDecoration: 'none',
            backgroundColor: '#AEF2A3' , 
            marginBottom: '100px',
           border: '5px solid #45B434',
            marginLeft: '32px',
            
            fontSize: '20px', 
            transition: '.3s', 
            color: '#45B434',
             borderRadius: '10px',
              padding: '10px 20px', 
             
               width: '145px', 
               textAlign: 'center', 
               fontWeight: 'bold' }}
         onMouseEnter={(e) => {
           e.target.style.opacity = '90%';
           e.target.style.boxShadow = ' 0px 4px 4px 0px rgba(0, 0, 0, 0.25)';
       }}
       onMouseLeave={(e) => {
           e.target.style.opacity = '100%';
           e.target.style.boxShadow = ' none ';
       }}>Join Class </Link>
       </div>
       







        




        



      </main>

     
      <FooterAuth style={{marginTop: '100px'}}/>
      
    </div>
  );
};

export default StudentHome;