import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from './firebase'; // Import the db instance and auth
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { useAuthState } from 'react-firebase-hooks/auth';
import HomeNavbar from './HomeNavbar';
import FooterAuth from './FooterAuth';
const AdminUB = () => {
  const [teachers, setTeachers] = useState([]);
  const [totals, setTotals] = useState({ simple: 0, advanced: 0 });
  const [adminSchoolCode, setAdminSchoolCode] = useState(null);
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  
  const [schoolCode, setSchoolCode] = useState(null);

  useEffect(() => {
    const fetchSchoolCode = async () => {
      if (user) {
        try {
          // Fetch the school document using the admin's UID as the document ID
          const schoolDocRef = doc(db, "schools", user.uid);
          const schoolDocSnap = await getDoc(schoolDocRef);
          if (schoolDocSnap.exists()) {
            const schoolData = schoolDocSnap.data();
            setSchoolCode(schoolData.joinCode);
          } else {
            console.log("No school found for this admin");
          }
        } catch (error) {
          console.error("Error fetching school code:", error);
        }
      }
    };

    fetchSchoolCode();
  }, [user]);

  useEffect(() => {
    const fetchTeachers = async () => {
      if (schoolCode) {
        try {
          const teachersQuery = query(collection(db, "teachers"), where("schoolCode", "==", schoolCode));
          const querySnapshot = await getDocs(teachersQuery);
          const teacherData = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const type1Input = data.geninput || 0;
            const type1Output = data.genoutput || 0;
            const type2Input = 124245; // Hardcoded value
            const type2Output = 12513; // Hardcoded value
            const cost = calculateCost(type1Input, type1Output, type2Input, type2Output);
            return { id: doc.id, ...data, type1Input, type1Output, type2Input, type2Output, cost };
          });

          setTeachers(teacherData);

          const totalType1Input = teacherData.reduce((sum, teacher) => sum + teacher.type1Input, 0);
          const totalType1Output = teacherData.reduce((sum, teacher) => sum + teacher.type1Output, 0);
          const totalType2Input = teacherData.reduce((sum, teacher) => sum + teacher.type2Input, 0);
          const totalType2Output = teacherData.reduce((sum, teacher) => sum + teacher.type2Output, 0);
          const totalCost = teacherData.reduce((sum, teacher) => sum + teacher.cost, 0);

          setTotals({
            type1Input: totalType1Input,
            type1Output: totalType1Output,
            type2Input: totalType2Input,
            type2Output: totalType2Output,
            cost: totalCost
          });

        } catch (error) {
          console.error("Error fetching teacher data:", error);
        }
      }
    };

    fetchTeachers();
  }, [schoolCode]);

  const calculateCost = (type1Input, type1Output, type2Input, type2Output) => {
    const type1Cost = (type1Input / 1000000) * 0.25 + (type1Output / 1000000) * 1.25;
    const type2Cost = (type2Input / 1000000) * 3 + (type2Output / 1000000) * 15;
    return type1Cost + type2Cost;
  };

  const handleTeacherClick = (teacherId) => {
    navigate(`/teacher-logs/${teacherId}`);
  };
 
  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontFamily: "'Radio Canada', sans-serif", fontWeight: 'bold', minHeight: '100vh', backgroundColor: 'white' }}>
      <HomeNavbar userType="admin" />
      <main style={{ flexGrow: 1, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Usage & Billing</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', width: '1000px' }}>
          <div>Total Cost: ${totals.cost.toFixed(2)}</div>
        </div>
        <div style={{ border: '1px solid #ccc', borderRadius: '10px', padding: '20px', width: '1000px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', width: '100%' }}>
            <div style={{ fontWeight: 'bold', borderBottom: '1px solid #ccc', padding: '10px' }}>Teacher Name</div>
            <div style={{ fontWeight: 'bold', borderBottom: '1px solid #ccc', padding: '10px' }}>Type 1 Input (Tokens)</div>
            <div style={{ fontWeight: 'bold', borderBottom: '1px solid #ccc', padding: '10px' }}>Type 1 Output (Tokens)</div>
            <div style={{ fontWeight: 'bold', borderBottom: '1px solid #ccc', padding: '10px' }}>Type 2 Input (Tokens)</div>
            <div style={{ fontWeight: 'bold', borderBottom: '1px solid #ccc', padding: '10px' }}>Type 2 Output (Tokens)</div>
            <div style={{ fontWeight: 'bold', borderBottom: '1px solid #ccc', padding: '10px' }}>Cost</div>

            {teachers.map(teacher => (
              <React.Fragment key={teacher.id}>
                <div style={{ borderBottom: '1px solid #ccc', padding: '10px', cursor: 'pointer' }} onClick={() => handleTeacherClick(teacher.id)}>{teacher.lastName}</div>
                <div style={{ borderBottom: '1px solid #ccc', padding: '10px' }}>{teacher.type1Input}</div>
                <div style={{ borderBottom: '1px solid #ccc', padding: '10px' }}>{teacher.type1Output}</div>
                <div style={{ borderBottom: '1px solid #ccc', padding: '10px' }}>{teacher.type2Input}</div>
                <div style={{ borderBottom: '1px solid #ccc', padding: '10px' }}>{teacher.type2Output}</div>
                <div style={{ borderBottom: '1px solid #ccc', padding: '10px' }}>${teacher.cost.toFixed(2)}</div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </main>
      <FooterAuth />
    </div>
  );
};

export default AdminUB;