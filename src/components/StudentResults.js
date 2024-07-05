import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

function StudentResults() {
  const [assignmentName, setAssignmentName] = useState(null);
  const navigate = useNavigate();
  const { assignmentId } = useParams();
  const [results, setResults] = useState(null);
  const studentUid = auth.currentUser.uid;
  const [flaggedIndexes, setFlaggedIndexes] = useState({});

  useEffect(() => {
    const fetchResults = async () => {
      const resultsRef = doc(db, 'grades', `${studentUid}_${assignmentId}`);
      const resultsDoc = await getDoc(resultsRef);

      if (resultsDoc.exists()) {
        setResults(resultsDoc.data());
      }
    };

    const fetchAssignmentName = async () => {
      const assignmentRef = doc(db, 'assignments', assignmentId);
      const assignmentDoc = await getDoc(assignmentRef);
      if (assignmentDoc.exists()) {
        setAssignmentName(assignmentDoc.data().name);
      }
    };

    fetchAssignmentName();
    fetchResults();
  }, [assignmentId, studentUid]);

  if (!results || !assignmentName) {
    return <div>Loading...</div>;
  }

  const totalQuestions = results.gradedAnswers.length;
  const correctAnswers = results.gradedAnswers.filter(answer => answer.grade === 2).length;
  const partiallyCorrectAnswers = results.gradedAnswers.filter(answer => answer.grade === 1).length;
  const incorrectAnswers = totalQuestions - correctAnswers - partiallyCorrectAnswers;
  const percentageCorrect = Math.round((correctAnswers + partiallyCorrectAnswers * 0.5) / totalQuestions * 100);

  const getLetterGrade = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const letterGrade = getLetterGrade(percentageCorrect);

  const flagForReview = async (index) => {
    setFlaggedIndexes(prev => ({
      ...prev,
      [index]: !prev[index]
    }));

    const updatedResults = { ...results };
    updatedResults.gradedAnswers[index].review = !updatedResults.gradedAnswers[index].review;
    const resultsRef = doc(db, 'grades', `${studentUid}_${assignmentId}`);
    await updateDoc(resultsRef, updatedResults);

    setResults(updatedResults);
  };

  const handleBack = () => {
    navigate(-1);
  };

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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '-40px',
          justifyContent: 'space-around'
        }}>
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '70px', color: 'black', marginBottom: '100px' }}>{assignmentName}</h1>
        </div>
        <div style={{
          marginBottom: '40px',
          fontFamily: "'Radio Canada', sans-serif",
          backgroundColor: 'white',
          display: 'flex',
          width: '1000px',
          height: '70px',
          marginLeft: 'auto',
          marginRight: 'auto',
          borderRadius: '100px',
          border: '3px solid lightgrey',
          alignItems: 'center',
          justifyContent: 'space-around'
        }}>
          <div style={{
            fontSize: '40px',
            fontWeight: 'bold',
            color: 'black',
            display: 'flex',
            alignItems: 'center',
            marginLeft: '100px',
            justifyContent: 'space-around'
          }}>
            <img style={{ width: '50px', height: '40px' }} src='/greencheck.png' />
            <h1 style={{
              backgroundColor: 'white',
              borderRadius: '5px',
              margin: 'auto',
              marginLeft: '20px',
              marginTop: '0px',
              fontSize: '40px',
              alignItems: 'center',
              position: 'relative',
              fontFamily: "'Radio Canada', sans-serif"
            }}>{correctAnswers}</h1>
          </div>
          <div style={{
            fontSize: '40px',
            fontWeight: 'bold',
            color: 'black',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around'
          }}>
            <img style={{ width: '40px', height: '40px' }} src='/partial.png' />
            <h1 style={{
              backgroundColor: 'white',
              borderRadius: '5px',
              margin: 'auto',
              marginLeft: '20px',
              marginTop: '0px',
              fontSize: '40px',
              alignItems: 'center',
              position: 'relative',
              fontFamily: "'Radio Canada', sans-serif"
            }}>{partiallyCorrectAnswers}</h1>
          </div>
          <div style={{
            fontSize: '40px',
            fontWeight: 'bold',
            color: 'black',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around'
          }}>
            <img style={{ width: '40px', height: '40px' }} src='/redx.png' />
            <h1 style={{
              backgroundColor: 'white',
              borderRadius: '5px',
              margin: 'auto',
              marginLeft: '20px',
              marginTop: '0px',
              fontSize: '40px',
              alignItems: 'center',
              position: 'relative',
              fontFamily: "'Radio Canada', sans-serif"
            }}>{incorrectAnswers}</h1>
          </div>
          <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'black' }}>
            {percentageCorrect}%
          </div>
          <div style={{
            width: '100px',
            height: '100px',
            border: '10px solid #627BFF',
            borderRadius: '20px',
            background: '#020CFF',
            marginTop: '0px',
            marginRight: '100px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <h1 style={{
              backgroundColor: 'white',
              fontSize: '60px',
              margin: '0',
              padding: '7px 14px',
              borderRadius: '5px',
              lineHeight: '60px',
              fontFamily: "'Radio Canada', sans-serif",
              color: 'black'
            }}>{letterGrade}</h1>
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
        <p style={{ fontFamily: "'Radio Canada', sans-serif", marginBottom: '80px', color: 'lightgrey' }}> Completed: {new Date(results.dateTaken).toLocaleString()}</p>
        <ul style={{ listStyle: 'none', padding: '0' }}>
          {results.gradedAnswers.map((answer, index) => {
            const maxHeight = Math.max(
              answer.question.length,
              (answer.response || "Not provided").length,
              (answer.explanation || "Not provided").length
            ) * 0.5 + 40;
            return (
              <li key={index} style={{ position: 'relative', fontFamily: "'Poppins', sans-serif", marginBottom: '60px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', fontFamily: "'Radio Canada', sans-serif" }}>
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
  backgroundColor: answer.grade === 2 ? '#AEF2A3' : answer.grade === 1 ? '#FFDE67' : '#F2A3A3',
  marginRight: '20px',
  marginBottom: '4%',
  color: answer.grade === 2 ? '#00B512' : answer.grade === 1 ? '#F5A200' : '#CC0000',
  border: `10px solid ${answer.grade === 2 ? '#00B512' : answer.grade === 1 ? '#F4C10A' : '#CC0000'}`
}}>
  <button onClick={() => flagForReview(index)} style={{
    position: 'absolute',
    right: '-25px',
    top: '-25px',
    borderRadius: '100px',
    
 boxShadow: ' 0px 4px 4px 0px rgba(0, 0, 0, 0.25)',
    height: '50px',
    width: '50px',
    borderColor: flaggedIndexes[index] ? 'rgb(65, 93, 242,.8)' : 'lightgrey', borderStyle: 'solid',
    backgroundColor: 'rgb(255,255,255, .8)',
    backdropFilter: 'blur(5px)', 
    cursor: 'pointer',
   borderWidth: '4px',
  }}>
    <img src={flaggedIndexes[index] ? "/flagblue.png" : "/flaggrey.png"} style={{ width: '40px', opacity: '60%', marginLeft:'-5px' }} alt="flag icon"></img>
  </button>
  {answer.grade}
</div>

                    <div style={{ width: '23%', backgroundColor: 'white', borderRadius: '20px', border: '10px solid #EAB3FD', position: 'relative', height: `${maxHeight}px`, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: '20px', paddingBottom: '20px' }}>
                      <h3 style={{ width: '120px', marginLeft: 'auto', marginRight: 'auto', top: '0px', marginTop: '-28px', left: '70px', position: 'absolute', backgroundColor: '#FCD3FF', borderRadius: '10px', color: '#E01FFF', border: '4px solid white', fontSize: '24px', padding: '5px' }}>Question</h3>
                      <p style={{ width: '90%', marginLeft: 'auto', marginRight: 'auto' }}>{answer.question}</p>
                    </div>
                    <div style={{ width: '23%', marginLeft: '1%', backgroundColor: 'white', position: 'relative', borderRadius: '20px', height: `${maxHeight}px`, border: `10px solid ${answer.grade === 2 ? '#00B512' : answer.grade === 1 ? '#F4C10A' : '#CC0000'}`, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: '20px', paddingBottom: '20px' }}>
                      <h4 style={{
                        width: '150px', marginLeft: 'auto', marginRight: 'auto', marginTop: '-28px', top: '0px', left: '55px', position: 'absolute', background: answer.grade === 2 ? '#AEF2A3' : answer.grade === 1 ? '#FFDE67' : '#F2A3A3',
                        color: answer.grade === 2 ? '#00B512' : answer.grade === 1 ? '#E76F00' : '#CC0000', borderRadius: '10px', border: '4px solid white', fontSize: '24px', padding: '5px'
                      }}>Your Answer</h4>
                      <p style={{ width: '90%', marginLeft: 'auto', marginRight: 'auto' }}>{answer.response || "Not provided"}</p>
                    
                    </div>
                    <div style={{ width: '23%', marginLeft: '1%', backgroundColor: 'white', position: 'relative', borderRadius: '20px', border: '10px solid #B3DBDD', height: `${maxHeight}px`, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: '20px', paddingBottom: '20px' }}>
                      <h4 style={{ width: '120px', marginLeft: 'auto', marginRight: 'auto', marginTop: '-28px', backgroundColor: '#00858D', top: '0px', left: '70px', position: 'absolute', borderRadius: '10px', color: 'white', border: '4px solid white', fontSize: '24px', padding: '5px' }}>Feedback</h4>
                      <p style={{ width: '90%', marginLeft: 'auto', marginRight: 'auto' }}>{answer.explanation || "Not provided"}</p>
                    </div>
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
