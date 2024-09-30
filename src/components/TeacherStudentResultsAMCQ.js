import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import Navbar from './Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { SquareCheck, SquareX, ChevronUp, ChevronDown,  Square } from 'lucide-react';

function TeacherStudentResultsAMCQ() {
    const { assignmentId, studentUid, classId } = useParams();
    const [assignmentName, setAssignmentName] = useState('');
    const [results, setResults] = useState(null);
    const [studentName, setStudentName] = useState('');
    const [correctCount, setCorrectCount] = useState(0);
    const [incorrectCount, setIncorrectCount] = useState(0);
    const navigate = useNavigate();
    const [hoveredQuestion, setHoveredQuestion] = useState(null);
    const [allQuestions, setAllQuestions] = useState([]);
    const [isExpanded, setIsExpanded] = useState(false);
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

                    // Calculate counts
                    setCorrectCount(data.correctQuestions.length);
                    setIncorrectCount(data.incorrectQuestions.length);

                    setStudentName(`${data.firstName} ${data.lastName}`);

                    // Set all questions and sort them by the order field
                    const sortedQuestions = [...data.correctQuestions, ...data.incorrectQuestions]
                        .sort((a, b) => a.order - b.order);
                    setAllQuestions(sortedQuestions);

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
                    border: '4px solid #F4F4F4' ,
                    borderRadius: '15px',
                    padding: '0px 20px',
                    width: '800px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    textAlign: 'left',
                    listStyleType: 'none'
                }}
            >
                  <div style={{ display:'flex', alignItems: 'center', marginBottom: '0px' }}>
               
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
                   <button 
                    onClick={toggleExpanded}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '20px',
                    }}
                >
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
                    <div style={{ display: 'flex'}}>
                       
                      {isCorrect ? (





<div style={{ display: 'flex', paddingBottom: '20px', width: '100%', marginTop: '20px' }}>
<div style={{
  width:'380px' ,
  borderRadius: '20px',
  position: 'relative',
  border: '8px solid #20BF00',
   flexDirection: 'column',
  alignItems: 'center'
}}>
  <h4 style={{
    width: '170px',
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
    Student Choice
  </h4>
  <p style={{
    fontSize: '18px',
    color: 'black',
    width: '340px',
    marginLeft: '20px',
    fontWeight: 'bold',     
  }}>
                            {questionData.choiceContent}</p>
                        </div>
                       
                              <div style={{width: '370px', marginLeft: '20px'}}>

                                <h1 style={{ fontSize: '20px',fontStyle: 'italic',  marginTop: '0px', fontFamily: '"Radio Canada", sans-serif', color: 'grey' }}>
                                    Explanation</h1>

                            <p style={{ fontSize: '16px', color: 'lightgrey', fontStyle: 'italic',  }}>
                                 {questionData.correctExplanation}</p>

                            </div>
                            </div>
                        ) : (
                            <div style={{paddingBottom: '30px'}}>
                            <div style={{ display: 'flex',borderBottom: '4px solid #f4f4f4' , paddingBottom: '30px'}}>
                            <div style={{width: '380px',
                             borderRadius: '20px',
                             position: 'relative',
                             marginTop:'20px',
                             border: '8px solid #F60000',
                              flexDirection: 'column',
                             alignItems: 'center'
                           }}>
                             <h4 style={{
                               width: '170px',
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
                               Student Choice
                             </h4>
                             <p style={{
                               fontSize: '18px',
                               color: 'black',
                               width: '320px',
                               marginLeft: '20px',
                               fontWeight: 'bold',     
                             }}>{questionData.choiceContent}</p>
                        </div>
                       
                              <div style={{width: '370px', marginLeft: '20px' }}>

                                <h1 style={{  fontSize: '20px', marginTop: '20px', fontFamily: '"Radio Canada", sans-serif', color: 'grey', fontStyle: 'italic'}}>
                                    Explanation</h1>

                            <p style={{fontSize: '18px',color: 'lightgrey', fontStyle: 'italic'}}>
                                 {questionData.incorrectExplanation}</p>

                            </div>
                            </div>




                            <div style={{ display: 'flex', marginTop: '40px'}}>
                            <div style={{ width: '380px', borderRadius: '20px',
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
        Correct Choice
      </h4>
      <p style={{
        fontSize: '18px',
        color: 'black',
        width: '320px',
        marginLeft: '20px',
        fontWeight: 'bold',     
      }}>{questionData.correctContent}</p>
                        </div>
                       
                              <div style={{width: '370px', marginLeft: '20px'}}>

                                <h1 style={{fontSize: '20px', marginTop: '0px', fontFamily: '"Radio Canada", sans-serif', color: 'grey', fontStyle: 'italic' }}>
                                    Explanation</h1>

                            <p style={{fontSize: '18px', color: 'lightgrey', fontStyle: 'italic' }}>
                                 {questionData.correctExplanation}</p>

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
                    marginTop: '-90px',
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
                    width: '800px',
                    marginLeft: 'auto',
                    marginTop: '-40px',
                    marginRight: 'auto',
                    textAlign: 'center',
                    backgroundColor: 'white',
                    borderRadius: '10px'
                }}
            >
                <div
                    style={{
                        textAlign: 'left'  ,
                        marginBottom: '-40px',
                        justifyContent: 'space-around'
                    }}
                >
                    <h1
                        style={{
                            fontFamily: "'Radio Canada', sans-serif",
                            fontSize: '40px',
                            color: 'grey',
                            marginBottom: '-20px',
                            marginLeft: '30px',
                        }}
                    >
                       {studentName}
                       
                    </h1>
                    <h1
                            style={{
                                fontFamily: "'Rajdhani', sans-serif",
                                fontSize: '80px',
                                color: 'black',
                                marginTop: '20px',
                                marginLeft: '30px',
                            }}
                        >
                          {assignmentName}
                            
                        </h1>
                </div>


                <div
                    style={{
                        fontFamily: "'Radio Canada', sans-serif",
                        backgroundColor: 'white',
                        display: 'flex',
                        width: '900px',
                        height: '70px',
                       marginLeft: '-20px',
                        borderRadius: '15px',
                        fontSize: '30px',
                        border: '4px solid #F4F4F4',
                        alignItems: 'center',
                        justifyContent: 'space-around',
                        marginBottom: '100px'
                    }}
                >
                      
                 
                <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'black', display: 'flex', alignItems: 'center', marginLeft: '40px', justifyContent: 'space-around' }}>
                    <SquareCheck size={50} color="#00d12a" />
                        <h1 style={{ backgroundColor: 'white', borderRadius: '5px', margin: 'auto', marginLeft: '20px', marginTop: '0px', fontSize: '40px', alignItems: 'center', position: 'relative', fontFamily: "'Radio Canada', sans-serif" }}>
                            {correctCount}</h1>
                    </div>
                    <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'space-around', marginLeft: '60px', }}>
                    <SquareX size={50} color="#ff0000" />
                        <h1 style={{ backgroundColor: 'white', borderRadius: '5px', margin: 'auto', marginLeft: '20px', marginTop: '0px', fontSize: '40px', alignItems: 'center', position: 'relative', fontFamily: "'Radio Canada', sans-serif" }}>
                            {incorrectCount}</h1>
                    </div>
                    
                    <p style={{ fontFamily: "'Radio Canada', sans-serif", fontSize:'20px', fontWeight: 'bold', marginBottom: '20px', color: 'lightgrey', width: '300px', textAlign: 'left', marginLeft: '60px'   }}> Completed: <br></br>{new Date(results.submittedAt.toDate()).toLocaleString()}</p>
       
            
                    <div
                        style={{
                            fontSize: '40px',
                            fontWeight: 'bold',
                            color: 'black'
                        }}
                    >
                      
                    </div>





                    <div style={{ width: '100px', height: '100px', border: '10px solid #627BFF', borderRadius: '20px', background: '#020CFF', marginTop: '0px', marginLeft: 'auto' , marginRight: '40px', zIndex: '100' }}>
                    



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
                                    lineHeight: '80px',
                                    position: 'relative',
                                    fontFamily: "'Rajdhani', sans-serif",
                                }}
                            >
                                                        {results.SquareScore}

                            </h1>
                        </div>
                    </div>
                    
                </div>
                <div style={{
        width: '870px',
        marginLeft: 'auto',
        marginTop: '20px',
        marginRight: 'auto',
       
        textAlign: 'center',
        backgroundColor: 'white',
        borderRadius: '10px',
        position: 'relative'
      }}>
              
           
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '25px', marginBottom: '40px', position:'absolute', left: '30px', top: '-50px'  }}>
              
{allQuestions.map((question, index) => {
        const isCorrect = results.correctQuestions.some(q => q.question === question.question);
        
        return (
          <Square
            key={index}
            onClick={() => handleCircleClick(index)}
            color={isCorrect ? '#00d12a' : '#FF0000'}
            style={{ cursor: 'pointer' }}
            strokeWidth={5}
            size={20}
          />
        );
      })}
    </div>
    </div>

               
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

    <ul style={{ listStyle: 'none', padding: '0' }}>
            {allQuestions.map((question, index) => renderQuestion(question.question, index))}
        </ul>
            </div>
        </div>
    );
}

export default TeacherStudentResultsAMCQ;
