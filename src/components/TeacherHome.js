import React from 'react';
import { Link } from 'react-router-dom';
import { db, auth } from './firebase';
import { collection, query, where, doc, deleteDoc } from "firebase/firestore";
import { useCollection } from 'react-firebase-hooks/firestore';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import HomeNavbar from './HomeNavbar';
import FooterAuth from './FooterAuth';
const TeacherHome = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleDeleteClass = async (classId) => {
    if (window.confirm("Are you sure you want to delete this class?")) {
      const classDocRef = doc(db, 'classes', classId);
      await deleteDoc(classDocRef);
    }
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
         fontFamily: "'Radio Canada', sans-serif",
          backgroundColor: 'white',
          
          marginLeft: 'auto',
          marginRight: 'auto'
          }}>
            <h4 style={{width: '90%', marginLeft: '32px', fontSize: '60px', marginBottom: '10px', marginTop: '70px'}}>Your Classes</h4>
       
   
        {classes && classes
  .sort((a, b) => a.period - b.period) 
  .map((classItem, index) => (    
         



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
                 <p style={{ width: ' fit-content;',maxWidth: '200px', backgroundColor: 'white',paddingLeft: '10px', paddingRight: '10px', marginLeft: '0px'}}>{classItem.classChoice}</p></h1> 
            
            <button 
              onClick={() => navigate(`/class/${classItem.id}`)} 
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
        <Link to="/createclass" style={{
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
        }}>Create Class +</Link>
        
        </div>
       







        





      </main>

      <FooterAuth style={{marginTop: '100px'}}/>
      
    </div>
    
  );
  
};

export default TeacherHome;
