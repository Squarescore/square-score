import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import Navbar from './Navbar';

function TeacherStudentResults() {
    const { assignmentId, studentUid } = useParams();
    const [assignmentName, setAssignmentName] = useState('');
    const [results, setResults] = useState(null);
    const [studentName, setStudentName] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchResultsAndAssignment = async () => {
            const assignmentRef = doc(db, 'assignments(saq)', assignmentId);
            const assignmentDoc = await getDoc(assignmentRef);
            if (assignmentDoc.exists()) {
                setAssignmentName(assignmentDoc.data().assignmentName);
            }

            const resultsRef = doc(db, 'grades(saq)', `${assignmentId}_${studentUid}`);
            const resultsDoc = await getDoc(resultsRef);
            if (resultsDoc.exists()) {
                setResults(resultsDoc.data());
            }

            const studentRef = doc(db, 'students', studentUid);
            const studentDoc = await getDoc(studentRef);
            if (studentDoc.exists()) {
                const studentData = studentDoc.data();
                setStudentName(`${studentData.firstName} ${studentData.lastName}`);
            }
        };

        fetchResultsAndAssignment();
    }, [assignmentId, studentUid]);

    const updateGradeAndFeedback = async (index, grade, explanation) => {
        const updatedResults = { ...results };
        updatedResults.questions[index].score = grade;
        updatedResults.questions[index].explanation = explanation;

        const newTotalScore = updatedResults.questions.reduce((sum, question) => sum + question.score, 0);
        updatedResults.totalScore = newTotalScore;
        updatedResults.percentageScore = (newTotalScore / (updatedResults.questions.length * 2)) * 100;

        try {
            await updateDoc(doc(db, 'grades(saq)', `${assignmentId}_${studentUid}`), updatedResults);
            setResults(updatedResults);
        } catch (error) {
            console.error('Error updating grade and feedback:', error);
        }
    };

    if (!results) {
        return <div>Loading...</div>;
    }

    const totalQuestions = results.questions ? results.questions.length : 0;
    const correctAnswers = results.questions ? results.questions.filter(question => question.score === 2).length : 0;
    const partiallyCorrectAnswers = results.questions ? results.questions.filter(question => question.score === 1).length : 0;
    const incorrectAnswers = totalQuestions - correctAnswers - partiallyCorrectAnswers;
    const percentageCorrect = totalQuestions ? Math.round((correctAnswers + partiallyCorrectAnswers * 0.5) / totalQuestions * 100) : 0;

    const getLetterGrade = (percentage) => {
        if (percentage >= 90) return 'A';
        if (percentage >= 80) return 'B';
        if (percentage >= 70) return 'C';
        if (percentage >= 60) return 'D';
        return 'F';
    };

    const letterGrade = getLetterGrade(percentageCorrect);

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
            <Navbar userType="teacher" />
            <header style={{ backgroundColor: 'white', borderRadius: '10px', color: 'white', marginTop: '-50px', height: '14%', display: 'flex', marginBottom: '-46px', alignItems: 'center', justifyContent: 'center', position: 'relative', margin: '1% auto', width: '70%' }}>
                <h1 style={{ fontWeight: 'normal', color: 'black', fontSize: '60px', fontFamily: "'Radio Canada', sans-serif" }}></h1>
            </header>
            <div style={{ width: '1200px', marginLeft: 'auto', marginTop: '30px', marginRight: 'auto', textAlign: 'center', backgroundColor: 'white', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '-40px', justifyContent: 'space-around' }}>
                    <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '40px', color: 'grey' }}>
                        {assignmentName}
                        <h1 style={{ fontSize: '80px', color: 'black', marginTop: '20px' }}>{studentName}</h1>
                    </h1>
                </div>
                <div style={{ marginBottom: '40px', fontFamily: "'Radio Canada', sans-serif", backgroundColor: 'white', display: 'flex', width: '1000px', height: '70px', marginLeft: 'auto', marginRight: 'auto', borderRadius: '100px', border: '3px solid lightgrey', alignItems: 'center', justifyContent: 'space-around' }}>
                    <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'black', display: 'flex', alignItems: 'center', marginLeft: '100px', justifyContent: 'space-around' }}>
                        <img style={{ width: '50px', height: '40px' }} src='/greencheck.png' />
                        <h1 style={{ backgroundColor: 'white', borderRadius: '5px', margin: 'auto', marginLeft: '20px', marginTop: '0px', fontSize: '40px', alignItems: 'center', position: 'relative', fontFamily: "'Radio Canada', sans-serif" }}>{correctAnswers}</h1>
                    </div>
                    <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
                        <img style={{ width: '40px', height: '40px' }} src='/partial.png' />
                        <h1 style={{ backgroundColor: 'white', borderRadius: '5px', margin: 'auto', marginLeft: '20px', marginTop: '0px', fontSize: '40px', alignItems: 'center', position: 'relative', fontFamily: "'Radio Canada', sans-serif" }}>{partiallyCorrectAnswers}</h1>
                    </div>
                    <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
                        <img style={{ width: '40px', height: '40px' }} src='/redx.png' />
                        <h1 style={{ backgroundColor: 'white', borderRadius: '5px', margin: 'auto', marginLeft: '20px', marginTop: '0px', fontSize: '40px', alignItems: 'center', position: 'relative', fontFamily: "'Radio Canada', sans-serif" }}>{incorrectAnswers}</h1>
                    </div>
                    <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'black' }}>
                        {percentageCorrect}%
                    </div>
                    <div style={{ width: '100px', height: '100px', border: '10px solid #627BFF', borderRadius: '20px', background: '#020CFF', marginTop: '0px', marginRight: '100px' }}>
                        <div style={{ width: '79px', height: '79px', backgroundColor: 'white', borderRadius: '5px', margin: 'auto', marginTop: '10px', justifyContent: 'space-around', fontSize: '60px', alignItems: 'center', position: 'relative', fontFamily: "'Radio Canada', sans-serif" }}>
                            <h1 style={{ backgroundColor: 'transparent', borderRadius: '5px', marginTop: '11px', justifyContent: 'space-around', fontSize: '60px', alignItems: 'center', position: 'relative', fontFamily: "'Radio Canada', sans-serif" }}>{letterGrade}</h1>
                        </div>
                    </div>
                </div>
                <p style={{ fontFamily: "'Radio Canada', sans-serif", marginBottom: '80px', color: 'lightgrey' }}> Completed: {new Date(results.submittedAt.seconds * 1000).toLocaleString()}</p>
                <ul style={{ listStyle: 'none', padding: '0' }}>
                    {results.questions && results.questions.map((question, index) => {
                        const maxHeight = Math.max(
                            question.question.length,
                            (question.studentResponse || "Not provided").length,
                            (question.explanation || "Not provided").length
                        ) * 0.5 + 40;
                        return (
                            <li key={index} style={{ position: 'relative', fontFamily: "'Poppins', sans-serif", marginBottom: '60px' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', fontFamily: "'Radio Canada', sans-serif" }}>
                                    <input
                                        style={{
                                            fontFamily: "'Radio Canada', sans-serif",
                                            width: '100px',
                                            height: `${maxHeight}px`,
                                            paddingLeft: '20px',
                                            fontSize: '66px',
                                            paddingTop: '20px',
                                            paddingBottom: '20px',
                                            fontWeight: 'bold',
                                            textAlign: 'center',
                                            borderRadius: '20px',
                                            backgroundColor: `${question.score === 2 ? '#AEF2A3' : question.score === 1 ? '#FFDE67' : '#F2A3A3'}`,
                                            marginRight: '20px',
                                            marginBottom: '4%',
                                            color: `${question.score === 2 ? '#00B512' : question.score === 1 ? '#F5A200' : '#CC0000'}`,
                                            border: `10px solid ${question.score === 2 ? '#00B512' : question.score === 1 ? '#F4C10A' : '#CC0000'}`
                                        }}
                                        type="number"
                                        value={question.score}
                                        onChange={(e) => updateGradeAndFeedback(index, Number(e.target.value), question.explanation)}
                                    />
                                    <div style={{ width: '23%', backgroundColor: 'white', borderRadius: '20px', border: '10px solid #EAB3FD', position: 'relative', height: `${maxHeight}px`, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: '20px', paddingBottom: '20px' }}>
                                        <h3 style={{ width: '120px', marginLeft: 'auto', marginRight: 'auto', top: '0px', marginTop: '-28px', left: '70px', position: 'absolute', backgroundColor: '#FCD3FF', borderRadius: '10px', color: '#E01FFF', border: '4px solid white', fontSize: '24px', padding: '5px' }}>Question</h3>
                                        <p style={{ width: '90%', marginLeft: 'auto', marginRight: 'auto', fontWeight: 'bold', fontSize: '20px' }}>{question.question}</p>
                                    </div>
                                    <div style={{ width: '23%', marginLeft: '1%', backgroundColor: 'white', position: 'relative', borderRadius: '20px', height: `${maxHeight}px`, border: `10px solid ${question.score === 2 ? '#00B512' : question.score === 1 ? '#F4C10A' : '#CC0000'}`, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: '20px', paddingBottom: '20px' }}>
                                        <h4 style={{
                                            width: '150px', marginLeft: 'auto', marginRight: 'auto', marginTop: '-28px', top: '0px', left: '55px', position: 'absolute', background: `${question.score === 2 ? '#AEF2A3' : question.score === 1 ? '#FFDE67' : '#F2A3A3'}`,
                                            color: `${question.score === 2 ? '#00B512' : question.score === 1 ? '#E76F00' : '#CC0000'}`, borderRadius: '10px', border: '4px solid white', fontSize: '24px', padding: '5px'
                                        }}>Response</h4>
                                        <p style={{ width: '90%', marginLeft: 'auto', marginRight: 'auto' }}> {question.studentResponse || "Not provided"}</p>
                                    </div>
                                    <div style={{ width: '23%', marginLeft: '1%', backgroundColor: 'white', position: 'relative', borderRadius: '20px', border: '10px solid #B3DBDD', height: `${maxHeight}px`, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: '20px', paddingBottom: '20px' }}>
                                        <h4 style={{ width: '120px', marginLeft: 'auto', marginRight: 'auto', marginTop: '-28px', backgroundColor: '#00858D', top: '0px', left: '70px', position: 'absolute', borderRadius: '10px', color: 'white', border: '4px solid white', fontSize: '24px', padding: '5px' }}>Feedback</h4>
                                        <textarea
                                            style={{ width: '90%', marginLeft: 'auto', marginRight: 'auto', borderColor: 'transparent', height: '80%', fontFamily: "'Radio Canada', sans-serif", resize: 'none' }}
                                            value={question.explanation || "Not provided"}
                                            onChange={(e) => updateGradeAndFeedback(index, question.score, e.target.value)}
                                        />
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

export default TeacherStudentResults;
