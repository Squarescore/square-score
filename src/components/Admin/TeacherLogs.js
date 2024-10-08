import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../Universal/firebase';
import { doc, getDoc } from "firebase/firestore";
import HomeNavbar from '../Universal/HomeNavbar';
import Footer from '../Universal/Footer';

const TeacherLogs = () => {
  const { teacherId } = useParams();
  const [usageLogs, setUsageLogs] = useState([]);

  useEffect(() => {
    const fetchTeacherLogs = async () => {
      try {
        const teacherRef = doc(db, "teachers", teacherId);
        const teacherDoc = await getDoc(teacherRef);
        if (teacherDoc.exists()) {
          setUsageLogs(teacherDoc.data().usageHistory || []);
        } else {
          console.error("No such document!");
        }
      } catch (error) {
        console.error("Error fetching teacher logs:", error);
      }
    };

    fetchTeacherLogs();
  }, [teacherId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontFamily: "'montserrat', sans-serif", fontWeight: 'bold', minHeight: '100vh', backgroundColor: 'white' }}>
      <HomeNavbar userType="admin" />
      <main style={{ flexGrow: 1, padding: '20px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Usage Logs for Teacher {teacherId}</h2>
        <div style={{ border: '1px solid #ccc', borderRadius: '10px', padding: '20px' }}>
          <h3>Usage History</h3>
          <ul>
            {usageLogs.map((log, index) => (
              <li key={index}>
                {log.timestamp}: {log.function} - {log.inputTokens} input tokens, {log.outputTokens} output tokens
              </li>
            ))}
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TeacherLogs;
