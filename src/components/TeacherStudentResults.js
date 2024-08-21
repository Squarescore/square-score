import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import Navbar from './Navbar';
import axios from 'axios';
function TeacherStudentResults() {
    const { assignmentId, studentUid } = useParams();
    const [assignmentName, setAssignmentName] = useState('');
    const [results, setResults] = useState(null);
    const [studentName, setStudentName] = useState('');
    const [correctCount, setCorrectCount] = useState(0);
const [partialCount, setPartialCount] = useState(0);
const [incorrectCount, setIncorrectCount] = useState(0);
const { classId } = useParams();
    const navigate = useNavigate();
    
    const [isRegrading, setIsRegrading] = useState(false);
    const [halfCredit, setHalfCredit] = useState(false);

    const handleRegrade = async () => {
        if (window.confirm("Are you sure you want to regrade this assignment? This will replace the current grades.")) {
            setIsRegrading(true);
            try {
                const questionsToGrade = results.questions.map(q => ({
                    question: q.question,
                    expectedResponse: q.expectedResponse,
                    studentResponse: q.studentResponse
                }));

                const response = await axios.post('https://us-central1-square-score-ai.cloudfunctions.net/GradeSAQ', {
                    questions: questionsToGrade,
                    halfCreditEnabled: halfCredit
                });

                if (response.status === 200) {
                    const newGrades = response.data;
                    
                    // Calculate new scores
                    const newTotalScore = newGrades.reduce((sum, grade) => sum + grade.score, 0);
                    const maxRawScore = results.questions.length * 2; // Assuming max score per question is 2
                    const newScaledScore = ((newTotalScore / maxRawScore) * (results.scaleMax - results.scaleMin)) + results.scaleMin;
                    const newPercentageScore = ((newScaledScore - results.scaleMin) / (results.scaleMax - results.scaleMin)) * 100;

                    // Update questions with new grades
                    const updatedQuestions = results.questions.map((q, index) => ({
                        ...q,
                        score: newGrades[index].score,
                        feedback: newGrades[index].feedback
                    }));

                    // Update Firestore document
                    const gradeDocRef = doc(db, 'grades(saq)', `${assignmentId}_${studentUid}`);
                    await updateDoc(gradeDocRef, {
                        questions: updatedQuestions,
                        rawTotalScore: newTotalScore,
                        scaledScore: newScaledScore,
                        percentageScore: newPercentageScore,
                        halfCreditEnabled: halfCredit
                    });

                    // Update local state
                    setResults(prevResults => ({
                        ...prevResults,
                        questions: updatedQuestions,
                        rawTotalScore: newTotalScore,
                        scaledScore: newScaledScore,
                        percentageScore: newPercentageScore,
                        halfCreditEnabled: halfCredit
                    }));

                    // Update counts
                    const newCorrectCount = updatedQuestions.filter(q => q.score === results.scaleMax).length;
                    const newPartialCount = halfCredit ? updatedQuestions.filter(q => q.score > results.scaleMin && q.score < results.scaleMax).length : 0;
                    const newIncorrectCount = updatedQuestions.filter(q => q.score === results.scaleMin).length;
                    
                    setCorrectCount(newCorrectCount);
                    setPartialCount(newPartialCount);
                    setIncorrectCount(newIncorrectCount);

                    alert("Assignment regraded successfully!");
                }
            } catch (error) {
                console.error("Error regrading assignment:", error);
                alert("An error occurred while regrading the assignment. Please try again.");
            } finally {
                setIsRegrading(false);
            }
        }
    };
    useEffect(() => {
        const fetchResults = async () => {
            try {
                const gradeDocRef = doc(db, 'grades(saq)', `${assignmentId}_${studentUid}`);
                const gradeDoc = await getDoc(gradeDocRef);
    
                if (gradeDoc.exists()) {
                    const data = gradeDoc.data();
                    setResults(data);
                    setAssignmentName(data.assignmentName);
                    
                    // Calculate counts
                    const correct = data.questions.filter(q => q.score === data.scaleMax).length;
                    const partial = data.questions.filter(q => q.score > data.scaleMin && q.score < data.scaleMax).length;
                    const incorrect = data.questions.filter(q => q.score === data.scaleMin).length;
                    
                    setCorrectCount(correct);
                    setPartialCount(partial);
                    setIncorrectCount(incorrect);
                    
                    // Fetch student document
                    const studentDocRef = doc(db, 'students', studentUid);
                    const studentDoc = await getDoc(studentDocRef);
                    
                    if (studentDoc.exists()) {
                        const studentData = studentDoc.data();
                        setStudentName(studentData.name);
                        
                        // Log both grade and student documents
                        console.log('Grade Document:', data);
                        console.log('Student Document:', studentData);
                    } else {
                        console.log('No student document found');
                    }
                }
            } catch (error) {
                console.error('Error fetching results:', error);
            }
        };
    
        fetchResults();
    }, [assignmentId]);

    const updateGradeAndFeedback = async (index, score, feedback) => {
        if (!results) return;
    
        const updatedQuestions = [...results.questions];
        updatedQuestions[index] = {
            ...updatedQuestions[index],
            score: Math.max(results.scaleMin, Math.min(results.scaleMax, score)), // Clamp score between scaleMin and scaleMax
            feedback: feedback
        };
    
        const newTotalScore = updatedQuestions.reduce((sum, question) => sum + question.score, 0);
        const newPercentageScore = (newTotalScore / (results.scaleMax * results.questions.length)) * 100;
    
        try {
            await updateDoc(doc(db, 'grades(saq)', `${assignmentId}_${studentUid}`), {
                questions: updatedQuestions,
                totalScore: newTotalScore,
                percentageScore: newPercentageScore
            });

            setResults({
                ...results,
                questions: updatedQuestions,
                totalScore: newTotalScore,
                percentageScore: newPercentageScore
            });
        } catch (error) {
            console.error('Error updating grade and feedback:', error);
        }
    };

    if (!results) {
        return ;
    }

    const getLetterGrade = (percentage) => {
        if (percentage >= 90) return 'A';
        if (percentage >= 80) return 'B';
        if (percentage >= 70) return 'C';
        if (percentage >= 60) return 'D';
        return 'F';
    };

    const letterGrade = getLetterGrade(results.percentageScore);

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
            <Navbar userType="teacher" />
            <header style={{ backgroundColor: 'white', borderRadius: '10px', color: 'white', marginTop: '-50px', height: '14%', display: 'flex', marginBottom: '-46px', alignItems: 'center', justifyContent: 'center', position: 'relative', margin: '1% auto', width: '70%' }}>
                <h1 style={{ fontWeight: 'normal', color: 'black', fontSize: '60px', fontFamily: "'Radio Canada', sans-serif" }}></h1>
            </header>
            <div style={{ width: '1200px', marginLeft: 'auto', marginTop: '30px', marginRight: 'auto', textAlign: 'center', backgroundColor: 'white', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '-40px', justifyContent: 'space-around' }}>
                    <h1 style={{ fontFamily: "'Radio Canada', sans-serif", fontSize: '40px', color: 'grey' }}>
                        {assignmentName}
                        <h1 style={{ fontSize: '80px', color: 'black', fontFamily: "'Rajdhani', sans-serif",marginTop: '20px' }}> Rodrigo Duran{studentName}</h1>
                    </h1>
                </div>
                <div style={{ marginBottom: '40px', fontFamily: "'Radio Canada', sans-serif", backgroundColor: 'white', display: 'flex', width: '1000px', height: '70px', marginLeft: 'auto', marginRight: 'auto', borderRadius: '100px',  border: '6px solid #F4F4F4', alignItems: 'center', justifyContent: 'space-around' }}>
                    <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'black', display: 'flex', alignItems: 'center', marginLeft: '100px', justifyContent: 'space-around' }}>
                        <img style={{ width: '50px', height: '40px' }} src='/greencheck.png' />
                        <h1 style={{ backgroundColor: 'white', borderRadius: '5px', margin: 'auto', marginLeft: '20px', marginTop: '0px', fontSize: '40px', alignItems: 'center', position: 'relative', fontFamily: "'Radio Canada', sans-serif" }}>
                            {correctCount}</h1>
                    </div>
                    <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
                        <img style={{ width: '40px', height: '40px' }} src='/partial.png' />
                        <h1 style={{ backgroundColor: 'white', borderRadius: '5px', margin: 'auto', marginLeft: '20px', marginTop: '0px', fontSize: '40px', alignItems: 'center', position: 'relative', fontFamily: "'Radio Canada', sans-serif" }}>
                            {partialCount}</h1>
                    </div>
                    <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
                        <img style={{ width: '40px', height: '40px' }} src='/redx.png' />
                        <h1 style={{ backgroundColor: 'white', borderRadius: '5px', margin: 'auto', marginLeft: '20px', marginTop: '0px', fontSize: '40px', alignItems: 'center', position: 'relative', fontFamily: "'Radio Canada', sans-serif" }}>
                            {incorrectCount}</h1>
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
                <div style={{display: 'flex', width:'700px',marginLeft: 'auto', marginRight: 'auto', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ fontFamily: "'Radio Canada', sans-serif", marginBottom: '40px', color: 'lightgrey' }}> Completed: {new Date(results.submittedAt.toDate()).toLocaleString()}</p>
                <div style={{ marginBottom: '0px', border: '0px solid grey',background: '#f4f4f4', height: '40px', marginTop: '-20px', borderRadius: '10px', marginLeft: '30px' }}>
                    <label style={{ fontFamily: "'Radio Canada', sans-serif",}}>
                        <input
                            type="checkbox"
                            checked={halfCredit}
                            onChange={(e) => setHalfCredit(e.target.checked)}
                        />
                        Enable Half Credit
                    </label>
                
                <button
                    onClick={handleRegrade}
                    disabled={isRegrading}
                    style={{
                        backgroundColor: isRegrading ? '#A0A0A0' : '#f4f4f4',
                        color: isRegrading ? 'grey' : 'blue',
                        padding: '8px 20px',
                        fontSize: '18px',
                        borderRadius: '5px',
                        fontFamily: "'Radio Canada', sans-serif",
                        fontWeight: 'bold',
                        border: 'none',
                        cursor: isRegrading ? 'not-allowed' : 'pointer',
                        marginBottom: '20px'
                    }}
                >
                    {isRegrading ? 'Regrading...' : 'Regrade Assignment'}
                </button>
                </div>
                </div>
                <ul style={{ listStyle: 'none', padding: '0' }}>
                    {results.questions && results.questions.map((question, index) => {
                        const maxHeight = Math.max(
                            question.question.length,
                            (question.studentResponse || "Not provided").length,
                            (question.feedback || "Not provided").length
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
                                        onChange={(e) => updateGradeAndFeedback(index, Number(e.target.value), question.feedback)}
                                    />
                                    <div style={{ width: '23%', backgroundColor: 'white', borderRadius: '20px', border: '10px solid #EAB3FD', position: 'relative', height: `${maxHeight}px`, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: '20px', paddingBottom: '20px' }}>
                                        <h3 style={{ width: '120px', marginLeft: 'auto', marginRight: 'auto', top: '0px', marginTop: '-28px', left: '70px', position: 'absolute', backgroundColor: '#FCD3FF', borderRadius: '10px', color: '#E01FFF', border: '4px solid white', fontSize: '24px', padding: '5px' }}>
                                            Question</h3>
                                        <p style={{ width: '90%', marginLeft: 'auto', marginRight: 'auto', fontWeight: 'bold', fontSize: '20px' }}>
                                            {question.question}</p>
                                    </div>
                                    <div style={{ width: '23%', marginLeft: '1%', backgroundColor: 'white', position: 'relative', borderRadius: '20px', height: `${maxHeight}px`, border: `10px solid ${question.score === 2 ? '#00B512' : question.score === 1 ? '#F4C10A' : '#CC0000'}`, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: '20px', paddingBottom: '20px' }}>
                                        <h4 style={{
                                            width: '150px', marginLeft: 'auto', marginRight: 'auto', marginTop: '-28px', top: '0px', left: '55px', position: 'absolute', background: `${question.score === 2 ? '#AEF2A3' : question.score === 1 ? '#FFDE67' : '#F2A3A3'}`,
                                            color: `${question.score === 2 ? '#00B512' : question.score === 1 ? '#E76F00' : '#CC0000'}`, borderRadius: '10px', border: '4px solid white', fontSize: '24px', padding: '5px', 
                                        }}>Response</h4>
                                        <p style={{ width: '90%', marginLeft: 'auto', marginRight: 'auto',fontWeight: 'bold', fontSize: '23px' }}> 
                                            {question.studentResponse || "Not provided"}</p>
                                    </div>
                                    <div style={{ width: '23%', marginLeft: '1%', backgroundColor: 'white', position: 'relative', borderRadius: '20px', border: '10px solid #B3DBDD', height: `${maxHeight}px`, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: '20px', paddingBottom: '20px' }}>
                                        <h4 style={{ width: '120px', marginLeft: 'auto', marginRight: 'auto', marginTop: '-28px', backgroundColor: '#00858D', top: '0px', left: '70px', position: 'absolute', borderRadius: '10px', color: 'white', border: '4px solid white', fontSize: '24px', padding: '5px' }}>Feedback</h4>
                                        <textarea
                                            style={{ width: '90%', marginLeft: 'auto', marginRight: 'auto', borderColor: 'transparent', height: '80%', fontFamily: "'Radio Canada', sans-serif", resize: 'none', fontSize: '13px' }}
                                            value={question.feedback || "Not provided"}
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
