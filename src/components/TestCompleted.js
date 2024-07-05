import { useLocation, useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

function TestCompleted() {
  const { classId } = useParams();
  const { gradeDocId } = useParams();
  const [score, setScore] = useState(null);
  const [totalQuestions, setTotalQuestions] = useState(null);

  useEffect(() => {
    const fetchScore = async () => {
      try {
        const gradeRef = doc(db, 'grades', gradeDocId);
        const gradeDoc = await getDoc(gradeRef);

        if (gradeDoc.exists()) {
          const gradeData = gradeDoc.data();
          setScore(gradeData.grade);
          setTotalQuestions(gradeData.totalQuestions);
          console.log('Fetched score:', gradeData.grade);
          console.log('Fetched total questions:', gradeData.totalQuestions);
        } else {
          console.log('Grade document does not exist');
        }
      } catch (error) {
        console.error('Error fetching score:', error);
      }
    };

    console.log('gradeDocId:', gradeDocId);
    fetchScore();
  }, [gradeDocId]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
      <header style={{ backgroundColor: 'white', borderRadius: '10px', color: 'white', height: '14%', display: 'flex', marginBottom: '-46px', alignItems: 'center', justifyContent: 'center', position: 'relative', margin: '1% auto', width: '70%', }} >
        <h1 style={{ fontSize: '30px', color: 'black', fontWeight: 'bold', fontFamily: "'Poppins', sans-serif" }}> Assignment Completed </h1>
      </header>
      <div style={{ marginLeft: 'auto', marginRight: 'auto', textAlign: 'center' }}>
        <p style={{ fontSize: '20px', fontFamily: "'Radio Canada', sans-serif", marginBottom: '-20px', backgroundColor: 'white', padding: '0px', position: 'relative', zIndex: '100', width: '200px', fontWeight: 'bold', marginLeft: 'auto', marginRight: 'auto', }} > Your Score: </p>
        <div style={{ backgroundColor: 'white', border: '6px solid black', textAlign: 'center', position: 'relative', boxShadow: '5px 5px 15px rgba(0, 0, 0, 0.3)', fontSize: '70px', width: '260px', height: '140px', marginLeft: 'auto', marginRight: 'auto', }} >
          <p style={{ marginTop: '20px', fontFamily: "'Poppins', sans-serif" }}> {score}/{totalQuestions} </p>
        </div>
        <div style={{ marginTop: '50%', marginRight: 'auto' }}>
          <Link  to={`/studentclasshome/${classId}`}  style={{ fontSize: '20px', textDecoration: 'none', borderRadius: '10px', width: '0%', paddingLeft: '100px', paddingRight: '100px', paddingBottom: '30px', paddingTop: '30px', zIndex: '10', position: 'relative', backgroundColor: 'black', color: 'white', borderColor: 'transparent', transition: ' .6s', fontFamily: "'Radio Canada', sans-serif", }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '5px 5px 15px rgba(0, 0, 0, 0.3)'; }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }} > Return Home </Link>
        </div>
      </div>
    </div>
  );
}

export default TestCompleted;