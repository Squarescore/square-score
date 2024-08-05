import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

function StudentResults() {
  const [assignmentData, setAssignmentData] = useState(null);
  const navigate = useNavigate();
  const { assignmentId, studentUid } = useParams();

  const [assignmentName, setAssignmentName] = useState('');
  const [results, setResults] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
const [partialCount, setPartialCount] = useState(0);
const [incorrectCount, setIncorrectCount] = useState(0);
  const [flaggedIndexes, setFlaggedIndexes] = useState({});
  const studentUID = auth.currentUser.uid;

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const gradeDocRef = doc(db, 'grades(saq)', `${assignmentId}_${studentUid}`);
        const gradeDoc = await getDoc(gradeDocRef);
  
        if (gradeDoc.exists()) {
          const data = gradeDoc.data();
          console.log("Fetched data:", data);  // Log the entire fetched data
          setResults(data);
          setAssignmentName(data.assignmentName);
          
          // Calculate counts
          const correct = data.questions.filter(q => q.score === data.scaleMax).length;
          const partial = data.questions.filter(q => q.score > data.scaleMin && q.score < data.scaleMax).length;
          const incorrect = data.questions.filter(q => q.score === data.scaleMin).length;
          
          console.log("Correct count:", correct);
          console.log("Partial count:", partial);
          console.log("Incorrect count:", incorrect);
  
          setCorrectCount(correct);
          setPartialCount(partial);
          setIncorrectCount(incorrect);
          
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error('Error fetching results:', error);
      }
    };
  
    fetchResults();
  }, [assignmentId, studentUID]);

  if (!results) {
    return <div>Loading...</div>;
  }
 
  const getLetterGrade = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const flagForReview = async (index) => {
    const updatedFlagged = !flaggedIndexes[index];
    setFlaggedIndexes(prev => ({
      ...prev,
      [index]: updatedFlagged
    }));
  
    const updatedQuestions = [...results.questions];
    updatedQuestions[index].flagged = updatedFlagged;
    const updatedData = { ...results, questions: updatedQuestions };
    const resultsRef = doc(db, 'grades(saq)', `${assignmentId}_${studentUid}`);
    await updateDoc(resultsRef, updatedData);
  
    setResults(updatedData);
  };
  const letterGrade = getLetterGrade(results.percentageScore);


  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
      <Navbar userType="student" />
      <header style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        color: 'white',
        marginTop: '80px',
        height: '14%',
        display: 'flex',
        marginBottom: '-46px',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        margin: '1% auto',
        width: '70%'
      }}>
      </header>
      <div style={{ width: '1200px', marginLeft: 'auto', marginTop: '30px', marginRight: 'auto', textAlign: 'center', backgroundColor: 'white', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '-40px', justifyContent: 'space-around' }}>
                    <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '40px', color: 'grey' }}>
                    {studentName}
                        <h1 style={{ fontSize: '80px', color: 'black', marginTop: '20px' }}> {assignmentName}</h1>
                    </h1>
                </div>
                <div style={{ marginBottom: '40px', fontFamily: "'Radio Canada', sans-serif", backgroundColor: 'white', display: 'flex', width: '1000px', height: '70px', marginLeft: 'auto', marginRight: 'auto', borderRadius: '100px',  border: '6px solid #F4F4F4', alignItems: 'center', justifyContent: 'space-around' }}>
                    <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'black', display: 'flex', alignItems: 'center', marginLeft: '100px', justifyContent: 'space-around' }}>
                        <img style={{ width: '50px', height: '40px' }} src='/greencheck.png' />
                        <h1 style={{ backgroundColor: 'white', borderRadius: '5px', margin: 'auto', marginLeft: '20px', marginTop: '0px', fontSize: '40px', alignItems: 'center', position: 'relative', fontFamily: "'Radio Canada', sans-serif" }}>{correctCount}</h1>
                    </div>
                    <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
                        <img style={{ width: '40px', height: '40px' }} src='/partial.png' />
                        <h1 style={{ backgroundColor: 'white', borderRadius: '5px', margin: 'auto', marginLeft: '20px', marginTop: '0px', fontSize: '40px', alignItems: 'center', position: 'relative', fontFamily: "'Radio Canada', sans-serif" }}>{partialCount}</h1>
                    </div>
                    <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
                        <img style={{ width: '40px', height: '40px' }} src='/redx.png' />
                        <h1 style={{ backgroundColor: 'white', borderRadius: '5px', margin: 'auto', marginLeft: '20px', marginTop: '0px', fontSize: '40px', alignItems: 'center', position: 'relative', fontFamily: "'Radio Canada', sans-serif" }}>{incorrectCount}</h1>
                    </div>
                    <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'black' }}>
                    {results.percentageScore.toFixed(1)}%
                    </div>
                    <div style={{ width: '100px', height: '100px', border: '10px solid #627BFF', borderRadius: '20px', background: '#020CFF', marginTop: '0px', marginRight: '100px' }}>
                        <div style={{ width: '79px', height: '79px', backgroundColor: 'white', borderRadius: '5px', margin: 'auto', marginTop: '10px', justifyContent: 'space-around', fontSize: '60px', alignItems: 'center', position: 'relative', fontFamily: "'Radio Canada', sans-serif" }}>
                            <h1 style={{ backgroundColor: 'transparent', borderRadius: '5px', marginTop: '11px', justifyContent: 'space-around', fontSize: '60px', alignItems: 'center', position: 'relative', fontFamily: "'Radio Canada', sans-serif" }}>{letterGrade}</h1>
                        </div>
                    </div>
                </div>
                </div>
      <div style={{
        width: '1200px',
        marginLeft: 'auto',
        marginTop: '0px',
        marginRight: 'auto',
        textAlign: 'center',
        backgroundColor: 'white',
        borderRadius: '10px',
      }}>
        <p style={{ fontFamily: "'Radio Canada', sans-serif", marginBottom: '80px', color: 'lightgrey' }}> Completed: {new Date(results.submittedAt.toDate()).toLocaleString()}</p>
        <ul style={{ listStyle: 'none', padding: '0' }}>
        {results.questions && results.questions.map((question, index) => {
            const maxHeight = Math.max(
              question.question.length,
              (question.studentResponse || "Not provided").length,
              (question.feedback || "Not provided").length
            ) * 0.5 + 50;
            return (
              <li key={index} style={{ position: 'relative', fontFamily: "'Poppins', sans-serif", marginBottom: '60px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', fontFamily: "'Radio Canada', sans-serif" }}>
                  <div style={{
                    fontFamily: "'Radio Canada', sans-serif",
                    width: '100px',
                    height: `${maxHeight}px`,
                    paddingLeft: '20px',
                    paddingRight: '20px',
                    paddingTop: '20px',
                    paddingBottom: '20px',
                    fontSize: '66px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'relative',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    borderRadius: '20px',
                    backgroundColor: `${question.score === 2 ? '#AEF2A3' : question.score === 1 ? '#FFDE67' : '#F2A3A3'}`,
                    marginRight: '20px',
                    marginBottom: '4%',
                    color: `${question.score === 2 ? '#00B512' : question.score === 1 ? '#F5A200' : '#CC0000'}`,
                    border: `10px solid ${question.score === 2 ? '#00B512' : question.score === 1 ? '#F4C10A' : '#CC0000'}`
               }}>
                    <button onClick={() => flagForReview(index)} style={{
                      position: 'absolute',
                      right: '-25px',
                      top: '-25px',
                      borderRadius: '100px',
                      boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.25)',
                      height: '50px',
                      width: '50px',
                      borderColor: flaggedIndexes[index] ? 'rgb(65, 93, 242,.8)' : 'lightgrey',
                      borderStyle: 'solid',
                      backgroundColor: 'rgb(255,255,255, .8)',
                      backdropFilter: 'blur(5px)',
                      cursor: 'pointer',
                      borderWidth: '4px',
                    }}>
                      <img src={flaggedIndexes[index] ? "/flagblue.png" : "/flaggrey.png"} style={{ width: '40px', opacity: '60%', marginLeft: '-5px' }} alt="flag icon"></img>
                    </button>
                    {question.score}
                  </div>
                  <div style={{ width: '23%', backgroundColor: 'white', borderRadius: '20px', border: '10px solid #EAB3FD', position: 'relative', height: `${maxHeight}px`, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: '20px', paddingBottom: '20px' }}>
                    <h3 style={{ width: '120px', marginLeft: 'auto', marginRight: 'auto', top: '0px', marginTop: '-28px', left: '70px', position: 'absolute', backgroundColor: '#FCD3FF', borderRadius: '10px', color: '#E01FFF', border: '4px solid white', fontSize: '24px', padding: '5px' }}>
                      Question</h3>
                    <p style={{ width: '90%', marginLeft: 'auto', marginRight: 'auto', fontWeight: 'bold', fontSize: '20px' }}>
                      {question.question}</p>
                  </div>
                  <div style={{ width: '23%', marginLeft: '1%', backgroundColor: 'white', position: 'relative', borderRadius: '20px', height: `${maxHeight}px`,  border: `10px solid ${question.score === 2 ? '#00B512' : question.score === 1 ? '#F4C10A' : '#CC0000'}`, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: '20px', paddingBottom: '20px' }}>
                    <h4 style={{
                      width: '150px', marginLeft: 'auto', marginRight: 'auto', marginTop: '-28px', top: '0px', left: '55px', position: 'absolute', background: `${question.score === 2 ? '#AEF2A3' : question.score === 1 ? '#FFDE67' : '#F2A3A3'}`,
                      color: `${question.score === 2 ? '#00B512' : question.score === 1 ? '#E76F00' : '#CC0000'}`, borderRadius: '10px', border: '4px solid white', fontSize: '24px', padding: '5px', 
                    }}>Your Answer</h4>
                    <p style={{ width: '90%', marginLeft: 'auto', marginRight: 'auto' ,fontWeight: 'bold', fontSize: '20px' }}>
                      {question.studentResponse || "Not provided"}</p>
                  </div>
                  <div style={{ width: '23%', marginLeft: '1%', backgroundColor: 'white', position: 'relative', borderRadius: '20px', border: '10px solid #B3DBDD', height: `${maxHeight}px`, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: '20px', paddingBottom: '20px' }}>
                    <h4 style={{ width: '120px', marginLeft: 'auto', marginRight: 'auto', marginTop: '-28px', backgroundColor: '#00858D', top: '0px', left: '70px', position: 'absolute', borderRadius: '10px', color: 'white', border: '4px solid white', fontSize: '24px', padding: '5px' }}>
                      Feedback</h4>
                    <p style={{ width: '90%', marginLeft: 'auto', marginRight: 'auto',}}>
                      {question.feedback || "Not provided"}</p>
                  </div>
                </div>
                <div style={{ width: '100%', height: '3px', background: 'lightgrey', marginBottom: '60px' }}></div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default StudentResults;
