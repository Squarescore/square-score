import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { useRef } from 'react';
import { SquareCheck, SquareX, SquareSlash, Flag, Square } from 'lucide-react';
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
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(null);
  const questionRefs = useRef([]);
  const studentUID = auth.currentUser.uid;
  const scrollToQuestion = (index) => {
    setActiveQuestionIndex(index);
    questionRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

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
      <div style={{ width: '1200px', marginLeft: 'auto', marginTop: '30px', marginRight: 'auto', textAlign: 'center', backgroundColor: 'white', borderRadius: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '-10px', justifyContent: 'space-around' }}>
                    
                        <h1 style={{ fontSize: '60px', color: 'black', marginTop: '50px',fontFamily: "'Rajdhani', sans-serif", textAlign: 'left', width: '800px' }}> {assignmentName}</h1>
                   
                </div>



                <div style={{ marginBottom: '40px', fontFamily: "'Radio Canada', sans-serif", backgroundColor: 'white', display: 'flex', width: '950px', height: '70px', marginLeft: '130px', borderRadius: '15px',  border: '4px solid #F4F4F4', alignItems: 'center', justifyContent: 'space-around' }}>
                    <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'black', display: 'flex', alignItems: 'center', marginLeft: '20px', justifyContent: 'space-around' }}>
                    <SquareCheck size={50} color="#00d12a" />
                        <h1 style={{ backgroundColor: 'white', borderRadius: '5px', margin: 'auto', marginLeft: '20px', marginTop: '0px', fontSize: '40px', alignItems: 'center', position: 'relative', fontFamily: "'Radio Canada', sans-serif" }}>{correctCount}</h1>
                    </div>
                    <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
                    <SquareSlash size={50} color="#FFD13B" />
                        <h1 style={{ backgroundColor: 'white', borderRadius: '5px', margin: 'auto', marginLeft: '20px', marginTop: '0px', fontSize: '40px', alignItems: 'center', position: 'relative', fontFamily: "'Radio Canada', sans-serif" }}>{partialCount}</h1>
                    </div>
                    <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
                    <SquareX size={50} color="#ff0000" />
                        <h1 style={{ backgroundColor: 'white', borderRadius: '5px', margin: 'auto', marginLeft: '20px', marginTop: '0px', fontSize: '40px', alignItems: 'center', position: 'relative', fontFamily: "'Radio Canada', sans-serif" }}>{incorrectCount}</h1>
                    </div>
                    <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'black' }}>
                    {results.percentageScore.toFixed(1)}%
                    </div>
                    <div style={{ width: '100px', height: '100px', border: '10px solid #627BFF', borderRadius: '20px', background: '#020CFF', marginTop: '0px', marginRight: '00px' }}>
                        <div style={{ width: '79px', height: '79px', backgroundColor: 'white', borderRadius: '5px', margin: 'auto', marginTop: '10px', justifyContent: 'space-around', fontSize: '60px', alignItems: 'center', position: 'relative', fontFamily: "'Radio Canada', sans-serif" }}>
                            <h1 style={{ backgroundColor: 'transparent', borderRadius: '5px', marginTop: '11px', justifyContent: 'space-around', fontSize: '60px', alignItems: 'center', position: 'relative', fontFamily: "'Rajdhani', sans-serif" }}>{letterGrade}</h1>
                        </div>
                    </div>
                </div>
                </div>
      <div style={{
        width: '870px',
        marginLeft: 'auto',
        marginTop: '-20px',
        marginRight: 'auto',
       
        textAlign: 'center',
        backgroundColor: 'white',
        borderRadius: '10px',
        position: 'relative'
      }}>
       <div style={{position: 'relative', height: '90px'}}>
        <p style={{ fontFamily: "'Radio Canada', sans-serif", fontSize:'20px', fontWeight: 'bold', marginBottom: '60px', color: 'grey', position:'absolute', left: '30px' }}> Completed: {new Date(results.submittedAt.toDate()).toLocaleString()}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '25px', marginBottom: '40px', position:'absolute', left: '30px', top: '60px'  }}>
          {results.questions.map((question, index) => (
            <Square
              key={index}
              size={20}
              style={{ cursor: 'pointer' }}
              strokeWidth={5}
              color={question.score === results.scaleMax ? "#00d12a" : question.score === results.scaleMin ? "#FF0000" : "#FFD13B"}
          
              onClick={() => scrollToQuestion(index)}
            />
          ))}
        </div>
        </div>
        <ul style={{ listStyle: 'none', padding: '0' }}>
        {results.questions && results.questions.map((question, index) => {
            const maxHeight = Math.max(
              question.question.length,
              (question.studentResponse || "Not provided").length,
              (question.feedback || "Not provided").length
            ) * 0.5 + 50;
            return (
              <li key={index} 
              ref={el => questionRefs.current[index] = el} style={{ position: 'relative', fontFamily: "'Radio Canada', sans-serif", marginBottom: '20px', width: '840px', borderRadius: '15px',padding: '20px', border: '4px solid #f4f4f4',marginLeft: 'auto', marginRight: 'auto',}}>
               <div style={{ display: 'flex', fontFamily: "'Radio Canada', sans-serif",   alignItems: 'center' }}>
                 
                  <div >
                    {question.score === 2 ? (
                      <SquareCheck size={60} color="#00d12a" />
                    ) : question.score === 1 ? (
                      <SquareSlash size={60} color="#F5A200" />
                    ) : (
                      <SquareX size={60} color="#FF0000" />
                    )}
                  </div>
                  <div style={{ width: '700px', backgroundColor: 'white', fontWeight: 'bold',   lineHeight: '1.4',fontSize: '20px', textAlign: 'left', border: '0px solid lightgrey', position: 'relative', display: 'flex', flexDirection: 'column', marginLeft: '20px' }}>
                    {question.question}
                  </div>
                  <button onClick={() => flagForReview(index)} style={{
             marginLeft: '20px',
                      borderRadius: '7px',
                      height: '50px',
                      width: '50px',

                      borderColor: flaggedIndexes[index] ? 'rgb(65, 93, 242,.8)' : 'lightgrey',
                      borderStyle: 'solid',
                      backgroundColor: 'rgb(255,255,255)',
                      backdropFilter: 'blur(5px)',
                      cursor: 'pointer',
                      borderWidth: '5px',
                    }}>
                      {flaggedIndexes[index] ? <Flag size={30} strokeWidth={3}  color="#002aff" /> : <Flag size={30} color="#8c8c8c" strokeWidth={3} />}
                    </button>
                    </div>
                 <div style={{display: 'flex', marginTop: '40px'}}>
                  <div style={{width: '380px', backgroundColor: 'white', position: 'relative', borderRadius: '20px', border: `8px solid ${question.score === 2 ? '#20BF00' : question.score === 1 ? '#F4C10A' : '#FF0000'}`, display: 'flex', flexDirection: 'column', justifyContent: 'center', marginRight: '20px' }}>
                    <h4 style={{
                      width: '150px',  marginTop: '-28px', top: '4px', left: '20px', position: 'absolute', background: `${question.score === 2 ? '#AEF2A3' : question.score === 1 ? '#FFDE67' : '#FFD3D3'}`,
                      color: `${question.score === 2 ? '#20BF00' : question.score === 1 ? '#E76F00' : '#FF0000'}`, borderRadius: '10px', border: '4px solid white', fontSize: '20px', padding: '2px', 
                    }}>Your Answer</h4>
                    <p style={{ width: '90%', marginLeft: 'auto', marginRight: 'auto' ,fontWeight: '', fontSize: '18px', textAlign: 'left' }}>
                      {question.studentResponse || "Not provided"}</p>
                  </div>
                  <div style={{width: '370px', marginLeft: '20px'}}>
                <h1 style={{fontSize: '20px', marginTop: '0px', fontFamily: '"Radio Canada", sans-serif', color: 'grey', fontStyle: 'italic', textAlign: 'left' }}>
                  Feedback</h1>
                  <p style={{fontSize: '18px', color: 'lightgrey', fontStyle: 'italic',textAlign: 'left'  }}>
                  {question.feedback || "Not provided"}</p>
                
                </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default StudentResults;
