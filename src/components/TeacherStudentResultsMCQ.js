import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import Navbar from './Navbar';
import { motion, AnimatePresence } from 'framer-motion';

function TeacherStudentResultsMCQ() {
    const { assignmentId, studentUid, classId } = useParams();
    const [assignmentName, setAssignmentName] = useState('');
    const [studentName, setStudentName] = useState('');
    const [results, setResults] = useState(null);
    const [expandedQuestions, setExpandedQuestions] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const gradeDocRef = doc(db, 'grades(mcq)', `${assignmentId}_${studentUid}`);
                const gradeDoc = await getDoc(gradeDocRef);

                if (gradeDoc.exists()) {
                    const data = gradeDoc.data();
                    setResults(data);
                    setAssignmentName(data.assignmentName);
                    setStudentName(`${data.firstName} ${data.lastName}`);
                } else {
                    console.log("No such document!");
                }
            } catch (error) {
                console.error("Error fetching results:", error);
            }
        };

        fetchResults();
    }, [assignmentId, studentUid]);

    if (!results) {
        return <div>Loading...</div>;
    }

    const correctCount = results.questions.filter(q => q.score > 0).length;
    const incorrectCount = results.questions.length - correctCount;

    const handleCircleClick = (index) => {
        const element = document.getElementById(`question-${index}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const toggleExpanded = (index) => {
        setExpandedQuestions(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };
    const calculateLetterGrade = (percentage) => {
        if (percentage >= 90) return 'A';
        if (percentage >= 80) return 'B';
        if (percentage >= 70) return 'C';
        if (percentage >= 60) return 'D';
        return 'F';
      };
    const PerformanceCircle = ({ isCorrect, onClick }) => (
        <div
            onClick={onClick}
            style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: isCorrect ? 'green' : 'red',
                display: 'inline-block',
                margin: '5px',
                cursor: 'pointer',
            }}
        />
    );

    const renderQuestion = (questionData, index) => {
        const isCorrect = questionData.score > 0;
        const isExpanded = expandedQuestions[index] || false;
        const hasExplanation = questionData.explanation && questionData.explanation.trim() !== '';

       
        return (
            <li
                id={`question-${index}`}
                key={questionData.questionId}
                style={{
                    fontFamily: "'Radio Canada', sans-serif",
                    marginBottom: '20px',
                    border: isCorrect ? '4px solid #F4F4F4' : '4px solid #F2A3A3',
                    borderRadius: '15px',
                    padding: '0px 20px',
                    width: '800px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    textAlign: 'left',
                    listStyleType: 'none',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    <p style={{
                        fontWeight: 'bold',
                        fontSize: '25px',
                        color: 'black',
                        marginRight: '10px',
                        flex: 1,
                    }}>
                        {questionData.question}
                    </p>
                    <img
                        src={isCorrect ? '/greencheck.png' : '/redx.png'}
                        alt={isCorrect ? "Correct" : "Incorrect"}
                        style={{ width: '25px', height: '20px', marginRight: '10px', objectFit: 'contain' }}
                    />
                    <button onClick={() => toggleExpanded(index)}
                        
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '20px',
                        }}>
                    {isExpanded ? '▲' : '▼'}
                   </button>
                </div>
                
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            style={{ overflow: 'hidden' }}
                        >
                            <div style={{ display: 'flex', }}>
                                {isCorrect ? (
                                    <div style={{ display: 'flex', paddingBottom: '30px', width: '100%' }}>
                                        <div style={{ 
                                            width: hasExplanation ? '380px' : '100%', 
                                            borderRadius: '15px', 
                                            background: '#AEF2A3', 
                                            border: '10px solid #2BB514' 
                                        }}>
                                            <h1 style={{ color: '#2BB514', fontSize: '28px', marginTop: '10px', fontFamily: '"Radio Canada", sans-serif', marginLeft: '20px' }}>
                                                Student Answer
                                            </h1>
                                            <p style={{ fontSize: '20px', color: '#2BB514', width: '320px', marginLeft: '20px', fontWeight: 'bold' }}>
                                                {questionData.choices[questionData.selectedAnswer]}
                                            </p>
                                        </div>
                                        {hasExplanation && (
                                            <div style={{ width: '370px', marginLeft: '20px' }}>
                                                <h1 style={{ fontSize: '28px', marginTop: '0px', fontFamily: '"Radio Canada", sans-serif', color: 'black' }}>Explanation</h1>
                                                <p style={{ fontSize: '20px', color: 'grey' }}>{questionData.explanation}</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{paddingBottom: '30px', width: '100%'}}>
                                        <div style={{ display: 'flex', borderBottom: '4px solid lightgrey', paddingBottom: '30px' }}>
                                            <div style={{ 
                                                width: hasExplanation ? '380px' : '100%', 
                                                borderRadius: '15px', 
                                                background: '#F2A3A3', 
                                                border: '10px solid #B51414'
                                            }}>
                                                <h1 style={{ color: 'darkred', fontSize: '28px', marginTop: '10px', fontFamily: '"Radio Canada", sans-serif', marginLeft: '20px' }}>
                                                    Student Answer
                                                </h1>
                                                <p style={{ fontSize: '20px', marginLeft: '20px', color: 'darkRed', width: '320px', fontWeight: 'bold' }}>
                                                    {questionData.choices[questionData.selectedAnswer]}
                                                </p>
                                            </div>
                                            {hasExplanation && (
                                                <div style={{ width: '370px', marginLeft: '20px' }}>
                                                    <h1 style={{ fontSize: '28px', marginTop: '0px', fontFamily: '"Radio Canada", sans-serif', color: 'black' }}>
                                                        Explanation
                                                    </h1>
                                                    <p style={{ fontSize: '20px', color: 'grey' }}>{questionData.explanation}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', marginTop: '40px' }}>
                                            <div style={{ 
                                                width: hasExplanation ? '380px' : '100%', 
                                                borderRadius: '15px', 
                                                background: '#AEF2A3', 
                                                border: '10px solid #2BB514' 
                                            }}>
                                                <h1 style={{ color: '#2BB514', fontSize: '28px', marginTop: '10px', fontFamily: '"Radio Canada", sans-serif', marginLeft: '20px' }}>
                                                    Correct Answer
                                                </h1>
                                                <p style={{ fontSize: '20px', color: '#2BB514', fontWeight: 'bold', width: '320px', marginLeft: '20px' }}>
                                                    {questionData.choices[questionData.correctAnswer]}
                                                </p>
                                            </div>
                                            {hasExplanation && (
                                                <div style={{ width: '370px', marginLeft: '20px' }}>
                                                    <h1 style={{ fontSize: '28px', marginTop: '0px', fontFamily: '"Radio Canada", sans-serif', color: 'black' }}>
                                                        Explanation
                                                    </h1>
                                                    <p style={{ fontSize: '20px', color: 'grey' }}>{questionData.explanation}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </li>
        );
    };

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
            <Navbar userType="teacher" />
      
            <div style={{ /* ... main div styles ... */ }}>
               



               <div style={{ display: 'flex', alignItems: 'center', marginBottom: '-40px', justifyContent: 'space-around' }}>
                    <h1 style={{ fontFamily: "'Radio Canada', sans-serif", fontSize: '40px', color: 'grey', width: '1000px', textAlign: 'center', marginTop: '100px' }}>
                        {assignmentName}
                        <h1 style={{ fontSize: '80px', color: 'black', fontFamily: "'Rajdhani', sans-serif",marginTop: '20px' }}> {studentName}</h1>
                    </h1>
                </div>
                <div style={{ marginBottom: '40px', fontFamily: "'Radio Canada', sans-serif", backgroundColor: 'white', display: 'flex', width: '1000px', height: '70px', marginLeft: 'auto', marginRight: 'auto', borderRadius: '100px',  border: '4px solid #F4F4F4', alignItems: 'center', justifyContent: 'space-around' }}>
                   
                <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'black' }}>
       
               </div>
                   
                   
                    <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'black', display: 'flex', alignItems: 'center', marginLeft: '0px', justifyContent: 'space-around' }}>
                        <img style={{ width: '50px', height: '40px' }} src='/greencheck.png' />
                        <h1 style={{ backgroundColor: 'white', borderRadius: '5px', margin: 'auto', marginLeft: '20px', marginTop: '0px', fontSize: '40px', alignItems: 'center', position: 'relative', fontFamily: "'Radio Canada', sans-serif" }}>
                            {correctCount}</h1>
                    </div>
                    
                    <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
                        <img style={{ width: '40px', height: '40px' }} src='/redx.png' />
                        <h1 style={{ backgroundColor: 'white', borderRadius: '5px', margin: 'auto', marginLeft: '20px', marginTop: '0px', fontSize: '40px', alignItems: 'center', position: 'relative', fontFamily: "'Radio Canada', sans-serif" }}>
                            {incorrectCount}</h1>
                    </div>
                    <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'black' }}>
                    {Math.round((results.rawTotalScore / results.maxRawScore) * 100)}%
                    </div>
                    <div style={{ width: '100px', height: '100px', border: '10px solid #627BFF', borderRadius: '20px', background: '#020CFF', marginTop: '0px', marginRight: '-85px', zIndex: '100' }}>
                        <div style={{ width: '79px', height: '79px', backgroundColor: 'white', borderRadius: '5px', margin: 'auto', marginTop: '10px', justifyContent: 'space-around', fontSize: '60px', alignItems: 'center', position: 'relative', fontFamily: "'Radio Canada', sans-serif" }}>
                            <h1 style={{ backgroundColor: 'transparent', borderRadius: '5px', marginTop: '11px', justifyContent: 'space-around', fontSize: '60px', textAlign: 'center', alignItems: 'center', position: 'relative', fontFamily: "'Radio Canada', sans-serif" }}>
                            {calculateLetterGrade(Math.round((results.rawTotalScore / results.maxRawScore) * 100))}
                        
                       </h1>
                        </div>
                    </div>
                                  
                <div style={{ fontFamily: "'Radio Canada', sans-serif", background: '#f4f4f4', padding: '15px', borderRadius: '10px', height: '50px', width: '220px', borderTopRightRadius: '100px', borderBottomRightRadius: '100px', marginRight: '-50px',marginBottom: '0px', color: 'grey', fontSize: '20px', fontWeight: 'bold' }}>
                     <p style={{textAlign: 'left', marginBottom: '0px', marginTop: '0px'}}>
                    Completed:</p> {new Date(results.submittedAt.toDate()).toLocaleString()}</div>
                </div>
                <div style={{display: 'flex', width:'700px',marginLeft: 'auto', marginRight: 'auto', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ marginTop: '-20px', }}>
                    {results.questions.map((question, index) => (
                        <PerformanceCircle
                            key={index}
                            isCorrect={question.score > 0}
                            onClick={() => handleCircleClick(index)}
                        />
                    ))}
                </div>
             
               </div>



              
             

                <ul style={{ listStyle: 'none', padding: '0' }}>
                    {results.questions.map((question, index) => renderQuestion(question, index))}
                </ul>
            </div>
        </div>
    );
}

export default TeacherStudentResultsMCQ;