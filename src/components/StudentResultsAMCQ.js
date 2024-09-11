import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import Navbar from './Navbar';
import { motion, AnimatePresence } from 'framer-motion';

function StudentResultsAMCQ() {
    const { assignmentId, studentUid, classId } = useParams();
    const [assignmentName, setAssignmentName] = useState('');
    const [results, setResults] = useState(null);
    const [studentName, setStudentName] = useState('');
    const [correctCount, setCorrectCount] = useState(0);
    const [incorrectCount, setIncorrectCount] = useState(0);
    const navigate = useNavigate();
    const [allQuestions, setAllQuestions] = useState([]);
    const [expandedQuestions, setExpandedQuestions] = useState({});

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

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const gradeDocRef = doc(db, 'grades(AMCQ)', `${assignmentId}_${studentUid}`);
                const gradeDoc = await getDoc(gradeDocRef);

                if (gradeDoc.exists()) {
                    const data = gradeDoc.data();
                    setResults(data);
                    setAssignmentName(data.assignmentName);
                    setStudentName(`${data.firstName} ${data.lastName}`);

                    // Calculate counts
                    setCorrectCount(data.correctQuestions.length);
                    setIncorrectCount(data.incorrectQuestions.length);

                    // Set all questions
                    setAllQuestions([...data.correctQuestions, ...data.incorrectQuestions].sort((a, b) => a.index - b.index));

                    console.log('Grade Document:', data);
                } else {
                    console.log('No grade document found');
                }
            } catch (error) {
                console.error('Error fetching results:', error);
            }
        };

        fetchResults();
    }, [assignmentId, studentUid]);

    if (!results) {
        return <div>Loading...</div>;
    }

    const handleCircleClick = (index) => {
        const element = document.getElementById(`question-${index}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const getLetterGrade = (score) => {
        const percentage = parseInt(score);
        if (percentage >= 90) return 'A';
        if (percentage >= 80) return 'B';
        if (percentage >= 70) return 'C';
        if (percentage >= 60) return 'D';
        return 'F';
    };

    const letterGrade = getLetterGrade(results.SquareScore);

    const renderQuestion = (question, index) => {
        const isCorrect = results.correctQuestions.some(q => q.question === question);
        const questionData = isCorrect 
            ? results.correctQuestions.find(q => q.question === question)
            : results.incorrectQuestions.find(q => q.question === question);
    
        const toggleExpanded = () => {
            setExpandedQuestions(prev => ({
                ...prev,
                [index]: !prev[index]
            }));
        };
    
        const isExpanded = expandedQuestions[index] || false;

        return (
            <li
                id={`question-${index}`}
                key={question}
                style={{
                    fontFamily: "'Radio Canada', sans-serif",
                    marginBottom: '20px',
                    userSelect: 'none' ,
                    border: '3px solid #F4F4F4',
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
                        color: isCorrect ? 'black' : 'red',
                        marginRight: '10px',
                        flex: 1,
                    }}>
                        {question}
                    </p>
                    <img
                        src={isCorrect ? '/greencheck.png' : '/redx.png'}
                        alt={isCorrect ? "Correct" : "Incorrect"}
                        style={{ width: '25px', height: '20px', marginRight: '10px', objectFit: 'contain' }}
                    />
                    <button 
                        onClick={toggleExpanded}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '20px',
                        }}
                    >
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
                            <div style={{ display: 'flex' }}>
                                {isCorrect ? (
                                    <div style={{ display: 'flex' }}>
                                        <div style={{width: '380px'}}>
                                            <h1 style={{color: 'darkgreen', fontSize: '28px', marginTop: '0px', fontFamily: '"Rajdhani", sans-serif'}}>Your Answer</h1>
                                            <p style={{fontSize: '20px', color: 'darkgreen', width: '320px'}}>{questionData.choiceContent}</p>
                                        </div>
                                        <div style={{width: '400px', marginLeft: '20px'}}>
                                            <h1 style={{ fontSize: '28px', marginTop: '0px', fontFamily: '"Rajdhani", sans-serif', color: 'green' }}>
                                                Explanation
                                            </h1>
                                            <p style={{fontSize: '20px', color: 'green' }}>
                                                {questionData.correctExplanation}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div style={{ display: 'flex'}}>
                                            <div style={{width: '380px'}}>
                                                <h1 style={{color: 'darkred', fontSize: '28px', marginTop: '0px', fontFamily: '"Rajdhani", sans-serif'}}>Your Answer</h1>
                                                <p style={{fontSize: '20px', color: 'darkRed', width: '320px'}}>{questionData.choiceContent}</p>
                                            </div>
                                            <div style={{width: '400px', marginLeft: '20px'}}>
                                                <h1 style={{ fontSize: '28px', marginTop: '0px', fontFamily: '"Rajdhani", sans-serif', color: 'grey' }}>
                                                    Explanation
                                                </h1>
                                                <p style={{fontSize: '20px', color: 'grey'}}>
                                                    {questionData.incorrectExplanation}
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', marginTop: '40px'}}>
                                            <div style={{width: '380px'}}>
                                                <h1 style={{color: 'darkgreen', fontSize: '28px', marginTop: '0px', fontFamily: '"Rajdhani", sans-serif'}}>Correct Answer</h1>
                                                <p style={{fontSize: '20px', color: 'darkgreen', width: '320px'}}>{questionData.correctContent}</p>
                                            </div>
                                            <div style={{width: '400px', marginLeft: '20px'}}>
                                                <h1 style={{ fontSize: '28px', marginTop: '0px', fontFamily: '"Rajdhani", sans-serif', color: 'green' }}>
                                                    Explanation
                                                </h1>
                                                <p style={{fontSize: '20px', color: 'green' }}>
                                                    {questionData.correctExplanation}
                                                </p>
                                            </div>
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
            <Navbar userType="student" />
            <div style={{ width: '1200px', marginLeft: 'auto', marginTop: '40px', marginRight: 'auto', textAlign: 'center', backgroundColor: 'white', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '-40px', justifyContent: 'space-around' }}>
                    <h1 style={{ fontFamily: "'Radio Canada', sans-serif", fontSize: '40px', color: 'grey' }}>
                        {assignmentName} 
                        <h1 style={{ fontSize: '80px', color: 'black', marginTop: '20px' }}>
                            {studentName}
                        </h1>
                    </h1>
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
                    fontSize: '30px',
                    border: '4px solid #F4F4F4',
                    alignItems: 'center',
                    justifyContent: 'space-around'
                }}>
                    <p style={{
                        fontFamily: "'Radio Canada', sans-serif",
                        marginBottom: '80px',
                        width: '350px',
                        fontWeight: 'bold',
                        color: 'grey',
                        marginTop: '80px',
                        marginLeft: '20px',
                        marginRight: '-100px'
                    }}>
                        {new Date(results.submittedAt.toDate()).toLocaleString()}
                    </p>

                    <div style={{
                        fontSize: '40px',
                        fontWeight: 'bold',
                        color: 'black',
                        display: 'flex',
                        alignItems: 'center',
                        marginLeft: '100px',
                        justifyContent: 'space-around'
                    }}>
                        <img style={{ width: '50px', height: '40px' }} src='/greencheck.png' alt="Correct" />
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
                        }}>
                            {correctCount}
                        </h1>
                    </div>
                    <div style={{
                        fontSize: '40px',
                        fontWeight: 'bold',
                        color: 'black',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-around'
                    }}>
                        <img style={{ width: '40px', height: '40px' }} src='/redx.png' alt="Incorrect" />
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
                        }}>
                            {incorrectCount}
                        </h1>
                    </div>

                    <div style={{
                        width: '100px',
                        height: '100px',
                        border: '10px solid #627BFF',
                        borderRadius: '20px',
                        background: '#020CFF',
                        marginTop: '0px',
                        marginRight: '100px'
                    }}>
                        <div style={{
                            width: '79px',
                            height: '79px',
                            backgroundColor: 'white',
                            borderRadius: '5px',
                            margin: 'auto',
                            marginTop: '10px',
                            justifyContent: 'space-around',
                            fontSize: '60px',
                            alignItems: 'center',
                            position: 'relative',
                            fontFamily: "'Rajdhani', sans-serif"
                        }}>
                            <h1 style={{
                                backgroundColor: 'transparent',
                                borderRadius: '5px',
                                marginTop: '11px',
                                justifyContent: 'space-around',
                                fontSize: '60px',
                                alignItems: 'center',
                                lineHeight: '80px',
                                position: 'relative',
                                fontFamily: "'Rajdhani', sans-serif",
                            }}>
                                {results.SquareScore}
                            </h1>
                        </div>
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    maxWidth: '1000px',
                    margin: '10px auto',
                }}>
                    {allQuestions.map((question, index) => (
                        <PerformanceCircle
                            key={index}
                            isCorrect={results.correctQuestions.some(q => q.question === question.question)}
                            onClick={() => handleCircleClick(index)}
                        />
                    ))}
                </div>

                {results.cycledThroughAll && (
                    <p style={{ color: 'red', fontWeight: 'bold' }}>
                          You may require assistance. You completed {results.completedQuestions.length} questions to get to a score of {results.SquareScore}.
                </p>
            )}

            <ul style={{ listStyle: 'none', padding: '0' }}>
                {allQuestions.map((question, index) => renderQuestion(question.question, index))}
            </ul>
        </div>
    </div>
    );
}

export default StudentResultsAMCQ;