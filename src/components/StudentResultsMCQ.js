import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import Navbar from './Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { SquareCheck, SquareX, ChevronUp, ChevronDown,  Square } from 'lucide-react';

function StudentResultsMCQ() {
    const { assignmentId, studentUid } = useParams();
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
                    border: '4px solid #F4F4F4' ,
                    borderRadius: '15px',
                    padding: '0px 20px',
                    width: '800px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    textAlign: 'left',
                    listStyleType: 'none',
                }}
            >
                
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0px' }}>
                <div>
                    {isCorrect ? 
                      <SquareCheck size={60} color="#00d12a" /> :  <SquareX size={60} color="#FF0000" />}
                    </div>



                    <p style={{
                        fontWeight: 'bold',
                        fontSize: '25px',
                        color: 'black',
                        marginLeft: '20px',
                        marginRight: '10px',
                        flex: 1,
                    }}>
                        {questionData.question}
                    </p>
                    
                  
                    
                  
                    <button onClick={() => toggleExpanded(index)}
                        
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '20px',
                        }}>
                    {isExpanded ?<ChevronUp size={40} color="#666666" /> : <ChevronDown size={40} color="#666666" />}
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
  <div style={{ display: 'flex', paddingBottom: '20px', width: '100%', marginTop: '20px' }}>
    <div style={{
      width: hasExplanation ? '380px' : '100%',
      borderRadius: '20px',
      position: 'relative',
      border: '8px solid #20BF00',
       flexDirection: 'column',
      alignItems: 'center'
    }}>
      <h4 style={{
        width: '150px',
        marginTop: '-28px',
        top: '4px',
        left: '20px',
        position: 'absolute',
        background: '#BFFBB6',
        color: '#20BF00',
        textAlign: 'center',
        borderRadius: '10px',
        border: '4px solid white',
        fontSize: '20px',
        padding: '2px'
      }}>
        Your Answer
      </h4>
      <p style={{
        fontSize: '18px',
        color: 'black',
        width: '320px',
        marginLeft: '20px',
        fontWeight: 'bold',     
      }}>
        {questionData.choices[questionData.selectedAnswer]}
      </p>
    </div>
    {hasExplanation && (
      <div style={{width: '370px', marginLeft: '20px' }}>

           <h1 style={{fontSize: '20px', marginTop: '0px', fontFamily: '"Radio Canada", sans-serif', color: 'grey', fontStyle: 'italic' }}>
                                 
          Explanation
        </h1>
        <p style={{fontSize: '18px',color: 'lightgrey', fontStyle: 'italic'}}>
                          
        {questionData.explanation}
    </p>
    </div>
        )}
    </div>
                                ) : (
                                    <div style={{paddingBottom: '20px', width: '100%', marginTop:'15px'}}>
                                        <div style={{ display: 'flex', borderBottom: '4px solid #f4f4f4', paddingBottom: '20px' }}>
                                        <div style={{
      width: hasExplanation ? '380px' : '100%',
      borderRadius: '20px',
      position: 'relative',
      border: '8px solid #F60000',
       flexDirection: 'column',
      alignItems: 'center'
    }}>
      <h4 style={{
        width: '150px',
        marginTop: '-28px',
        top: '4px',
        left: '20px',
        position: 'absolute',
        background: '#FFE4E4',
        color: '#F60000',
        textAlign: 'center',
        borderRadius: '10px',
        border: '4px solid white',
        fontSize: '20px',
        padding: '2px'
      }}>
        Your Answer
      </h4>
      <p style={{
        fontSize: '18px',
        color: 'black',
        width: '320px',
        marginLeft: '20px',
        fontWeight: 'bold',     
      }}>   {questionData.choices[questionData.selectedAnswer]}
                                                </p>
                                            </div>
                                            {hasExplanation && (
                                        <div style={{width: '370px', marginLeft: '20px'}}>

                                           <h1 style={{fontSize: '20px', marginTop: '0px', fontFamily: '"Radio Canada", sans-serif', color: 'grey', fontStyle: 'italic' }}>
                                 
                                          Explanation
                                        </h1>
                                        <p style={{fontSize: '18px', color: 'lightgrey', fontStyle: 'italic' }}>
                             
                                      {questionData.explanation}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', marginTop: '30px' }}>
                                        <div style={{
      width: hasExplanation ? '380px' : '100%',
      borderRadius: '20px',
      position: 'relative',
      border: '8px solid #20BF00',
       flexDirection: 'column',
      alignItems: 'center'
    }}>
      <h4 style={{
        width: '150px',
        marginTop: '-28px',
        top: '4px',
        left: '20px',
        position: 'absolute',
        background: '#BFFBB6',
        color: '#20BF00',
        textAlign: 'center',
        borderRadius: '10px',
        border: '4px solid white',
        fontSize: '20px',
        padding: '2px'
      }}>
        Correct Answer
      </h4>
      <p style={{
        fontSize: '18px',
        color: 'black',
        width: '320px',
        marginLeft: '20px',
        fontWeight: 'bold',     
      }}>  {questionData.choices[questionData.correctAnswer]}
                                                </p>
                                            </div>
                                            {hasExplanation && (
                                                   <div style={{width: '370px', marginLeft: '20px'}}>

                                                      <h1 style={{fontSize: '20px', marginTop: '0px', fontFamily: '"Radio Canada", sans-serif', color: 'grey', fontStyle: 'italic' }}>
                                 
                                                      Explanation
                                                    </h1>
                                                    <p style={{fontSize: '18px', color: 'lightgrey', fontStyle: 'italic' }}>
                             
                                                   {questionData.explanation}</p>
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
            <Navbar userType="student" />
      
            <div style={{ /* ... main div styles ... */ }}>
               



            <div style={{ display: 'flex',marginTop: '70px', alignItems: 'center', marginBottom: '-10px', justifyContent: 'space-around' }}>
                    
                    <h1 style={{ fontSize: '60px', color: 'black', marginTop: '50px',fontFamily: "'Rajdhani', sans-serif", textAlign: 'left', width: '800px' }}> {assignmentName}</h1>
               
            </div>
                <div style={{ marginBottom: '40px', fontFamily: "'Radio Canada', sans-serif", backgroundColor: 'white', display: 'flex', width: '900px', height: '70px', marginLeft: 'auto', marginRight: 'auto', borderRadius: '15px',  border: '4px solid #F4F4F4', alignItems: 'center',}}>
                   
                <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'black' }}>
       
               </div>
                   
                   
               <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'black', display: 'flex', alignItems: 'center', marginLeft: '50px', justifyContent: 'space-around' }}>
                    <SquareCheck size={50} color="#00d12a" />
                        <h1 style={{ backgroundColor: 'white', borderRadius: '5px', margin: 'auto', marginLeft: '20px', marginTop: '0px', fontSize: '40px', alignItems: 'center', position: 'relative', fontFamily: "'Radio Canada', sans-serif" }}>
                            {correctCount}</h1>
                    </div>
                    
                    <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'space-around', marginLeft: '60px', }}>
                    <SquareX size={50} color="#ff0000" />
                        <h1 style={{ backgroundColor: 'white', borderRadius: '5px', margin: 'auto', marginLeft: '20px', marginTop: '0px', fontSize: '40px', alignItems: 'center', position: 'relative', fontFamily: "'Radio Canada', sans-serif" }}>
                            {incorrectCount}</h1>
                    </div>
                    
                    <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'black', marginLeft: '60px',  }}>
                    {Math.round((results.rawTotalScore / results.maxRawScore) * 100)}%
                    </div>
                    <div style={{ width: '100px', height: '100px', border: '10px solid #627BFF', borderRadius: '20px', background: '#020CFF', marginTop: '0px', marginLeft: 'auto' , marginRight: '125px', zIndex: '100' }}>
                        <div style={{ width: '79px', height: '79px', backgroundColor: 'white', borderRadius: '5px', margin: 'auto', marginTop: '10px', justifyContent: 'space-around', fontSize: '60px', alignItems: 'center', position: 'relative', fontFamily: "'Radio Canada', sans-serif" }}>
                            <h1 style={{ backgroundColor: 'transparent', borderRadius: '5px', marginTop: '11px', justifyContent: 'space-around', fontSize: '60px', textAlign: 'center', alignItems: 'center', position: 'relative', fontFamily: "'Radio Canada', sans-serif" }}>
                            {calculateLetterGrade(Math.round((results.rawTotalScore / results.maxRawScore) * 100))}
                        
                       </h1>
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
                <p style={{ fontFamily: "'Radio Canada', sans-serif", fontSize:'20px', fontWeight: 'bold', marginBottom: '60px', color: 'grey', position:'absolute', left: '40px',top: '-10px'   }}> Completed: {new Date(results.submittedAt.toDate()).toLocaleString()}</p>
       
           
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '25px', marginBottom: '40px', position:'absolute', left: '40px', top: '60px'  }}>
                {results.questions.map((question, index) => (
                        <Square
                            key={index}
                            color={question.score > 0 ? '#00d12a' : '#FF0000'}
                            style={{ cursor: 'pointer' }}
                            strokeWidth={5}
                            size={20}
                            onClick={() => handleCircleClick(index)}
                        />
                    ))}
                </div>
             </div>
        </div>

          


              
             

                <ul style={{ listStyle: 'none', padding: '0' }}>
                    {results.questions.map((question, index) => renderQuestion(question, index))}
                </ul>
            </div>
        </div>
    );
}

export default StudentResultsMCQ;