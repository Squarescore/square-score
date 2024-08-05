import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import Navbar from './Navbar';
import { motion, AnimatePresence } from 'framer-motion';
function TeacherStudentResultsAMCQ() {
    const { assignmentId, studentUid, classId } = useParams();
    const [assignmentName, setAssignmentName] = useState('');
    const [results, setResults] = useState(null);
    const [studentName, setStudentName] = useState('');
    const [correctCount, setCorrectCount] = useState(0);
    const [incorrectCount, setIncorrectCount] = useState(0);
    const navigate = useNavigate();
    const [hoveredQuestion, setHoveredQuestion] = useState(null);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const gradeDocRef = doc(db, 'grades(AMCQ)', `${assignmentId}_${studentUid}`);
                const gradeDoc = await getDoc(gradeDocRef);

                if (gradeDoc.exists()) {
                    const data = gradeDoc.data();
                    setResults(data);
                    setAssignmentName(data.assignmentName);

                    // Calculate counts
                    setCorrectCount(data.correctQuestions.length);
                    setIncorrectCount(data.incorrectQuestions.length);

                    setStudentName(`${data.firstName} ${data.lastName}`);

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

    const getLetterGrade = (score) => {
        const percentage = parseInt(score);
        if (percentage >= 90) return 'A';
        if (percentage >= 80) return 'B';
        if (percentage >= 70) return 'C';
        if (percentage >= 60) return 'D';
        return 'F';
    };

    const letterGrade = getLetterGrade(results.SquareScore);

 
        const renderQuestion = (question) => {
            const isCorrect = results.correctQuestions.some(q => q.question === question);
            const correctQuestion = results.correctQuestions.find(q => q.question === question);
            const incorrectQuestion = results.incorrectQuestions.find(q => q.question === question);
        
            return (
                <li
                    key={question}
                    style={{
                        position: 'relative',
                        fontFamily: "'Poppins', sans-serif",
                        marginBottom: '60px',
                        marginLeft: 'auto', 
                        marginRight: 'auto',
                        width: '800px',
                        textAlign: 'left'
                    }}
                >
                    <div
                        style={{
                            justifyContent: 'center',
                            fontFamily: "'Radio Canada', sans-serif"
                        }}
                    >
                        <div
                            style={{
                                width: '800px',
                                backgroundColor: 'white',
                                borderRadius: '20px',
                                position: 'relative',
                                minHeight: '100px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                padding: '20px'
                            }}
                        >
                            <p
                                style={{
                                    width: '100%',
                                    marginLeft: 'auto',
                                    marginRight: 'auto',
                                    fontWeight: 'bold',
                                    
                                color: `${isCorrect ? 'black' : 'red'}`,
                                    fontSize: '30px'
                                }}
                            >
                                {question}
                            </p>
                        </div>
                        <div
                            style={{
                                width: '800px',
                                marginLeft: '1%',
                                backgroundColor: 'white',
                                position: 'relative',
                                borderRadius: '20px',
                                minHeight: '20px',
                                color: `${isCorrect ? '#00B512' : '#9D9D9D'}`,
                                background: `${isCorrect ? '#AEF2A3' : '#E5E5E5'}`,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                padding: '10px 20px ',
                                zIndex: 2
                            }}
                        >
                            {isCorrect ? (
                                <p style={{ fontWeight: 'bold', fontSize: '20px', position: 'relative' }}>
                                    {correctQuestion.choiceContent}
                                </p>
                            ) : (
                                <p style={{ fontWeight: 'bold', fontSize: '20px' }}>
                                    {incorrectQuestion.choiceContent}
                                </p>
                            )}
                        </div>
                        {!isCorrect && (
                            <div
                                style={{ 
                                    backgroundColor: '#AEF2A3', 
                                    padding: '10px 20px', 
                                    borderRadius: '20px',
                                    marginLeft: '8px',
                                    paddingTop: '30px',
                                    marginTop: '-30px',
                                    width: '800px',
                                }}
                            >
                                <p style={{ fontWeight: 'bold', fontSize: '20px', color: '#00B512',  }}>
                                    Correct Answer: {incorrectQuestion.correctContent}
                                </p>
                                
                            </div>
                        )}
                        {isCorrect && hoveredQuestion === question && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                style={{ 
                                    backgroundColor: '#E1FFDC', 
                                    padding: '20px', 
                                    borderRadius: '10px',
                                    position: 'absolute',
                                    marginTop: '-20px',
                                    marginLeft: '8px',
                                    width: '800px',
                                    zIndex: 1,
                                }}
                            >
                                <p>{correctQuestion.correctExplanation}</p>
                            </motion.div>
                        )}
                    </div>
                    <div
                        style={{
                            width: '880px',
                            height: '3px',
                            background: 'lightgrey',
                            marginTop: '60px'
                        }}
                    ></div>
                </li>
           
            );
        };

    return (
        <div
            style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'white'
            }}
        >
            <Navbar userType="teacher" />
            <header
                style={{
                    backgroundColor: 'white',
                    borderRadius: '10px',
                    color: 'white',
                    marginTop: '-50px',
                    height: '14%',
                    display: 'flex',
                    marginBottom: '-46px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    margin: '1% auto',
                    width: '70%'
                }}
            >
                <h1
                    style={{
                        fontWeight: 'normal',
                        color: 'black',
                        fontSize: '60px',
                        fontFamily: "'Radio Canada', sans-serif"
                    }}
                ></h1>
            </header>
            <div
                style={{
                    width: '1200px',
                    marginLeft: 'auto',
                    marginTop: '30px',
                    marginRight: 'auto',
                    textAlign: 'center',
                    backgroundColor: 'white',
                    borderRadius: '10px'
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '-40px',
                        justifyContent: 'space-around'
                    }}
                >
                    <h1
                        style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontSize: '40px',
                            color: 'grey'
                        }}
                    >
                        {assignmentName}
                        <h1
                            style={{
                                fontSize: '80px',
                                color: 'black',
                                marginTop: '20px'
                            }}
                        >
                            {studentName}
                            
                        </h1>
                    </h1>
                </div>
                <div
                    style={{
                        marginBottom: '40px',
                        fontFamily: "'Radio Canada', sans-serif",
                        backgroundColor: 'white',
                        display: 'flex',
                        width: '1000px',
                        height: '70px',
                        marginLeft: 'auto',
                        marginRight: 'auto',
                        borderRadius: '100px',
                        border: '6px solid #F4F4F4',
                        alignItems: 'center',
                        justifyContent: 'space-around'
                    }}
                >
                    <div
                        style={{
                            fontSize: '40px',
                            fontWeight: 'bold',
                            color: 'black',
                            display: 'flex',
                            alignItems: 'center',
                            marginLeft: '100px',
                            justifyContent: 'space-around'
                        }}
                    >
                        <img
                            style={{
                                width: '50px',
                                height: '40px'
                            }}
                            src='/greencheck.png'
                            alt="Correct"
                        />
                        <h1
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '5px',
                                margin: 'auto',
                                marginLeft: '20px',
                                marginTop: '0px',
                                fontSize: '40px',
                                alignItems: 'center',
                                position: 'relative',
                                fontFamily: "'Radio Canada', sans-serif"
                            }}
                        >
                            {correctCount}
                        </h1>
                    </div>
                    <div
                        style={{
                            fontSize: '40px',
                            fontWeight: 'bold',
                            color: 'black',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-around'
                        }}
                    >
                        <img
                            style={{
                                width: '40px',
                                height: '40px'
                            }}
                            src='/redx.png'
                            alt="Incorrect"
                        />
                        <h1
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '5px',
                                margin: 'auto',
                                marginLeft: '20px',
                                marginTop: '0px',
                                fontSize: '40px',
                                alignItems: 'center',
                                position: 'relative',
                                fontFamily: "'Radio Canada', sans-serif"
                            }}
                        >
                            {incorrectCount}
                        </h1>
                    </div>
                    <div
                        style={{
                            fontSize: '40px',
                            fontWeight: 'bold',
                            color: 'black'
                        }}
                    >
                      
                    </div>
                    <div
                        style={{
                            width: '100px',
                            height: '100px',
                            border: '10px solid #627BFF',
                            borderRadius: '20px',
                            background: '#020CFF',
                            marginTop: '0px',
                            marginRight: '100px'
                        }}
                    >
                        <div
                            style={{
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
                            }}
                        >
                            <h1
                                style={{
                                    backgroundColor: 'transparent',
                                    borderRadius: '5px',
                                    marginTop: '11px',
                                    justifyContent: 'space-around',
                                    fontSize: '60px',
                                    alignItems: 'center',
                                    position: 'relative',
                                    fontFamily: "'Rajdhani, sans-serif"
                                }}
                            >
                                                        {results.SquareScore}

                            </h1>
                        </div>
                    </div>
                </div>
                <p
                    style={{
                        fontFamily: "'Radio Canada', sans-serif",
                        marginBottom: '80px',
                        color: 'lightgrey'
                    }}
                >
                    Completed: {new Date(results.submittedAt.toDate()).toLocaleString()}
                </p>

                {results.cycledThroughAll && (
                    <p
                        style={{
                            color: 'red',
                            fontWeight: 'bold'
                        }}
                    >
                        Student may require assistance. Completed {results.completedQuestions.length} questions to get to a score of {results.SquareScore}.
                    </p>
                )}

                <ul
                    style={{
                        listStyle: 'none',
                        padding: '0'
                    }}
                >
                    {results.completedQuestions.map((question, index) => renderQuestion(question))}
                </ul>
            </div>
        </div>
    );
}

export default TeacherStudentResultsAMCQ;
