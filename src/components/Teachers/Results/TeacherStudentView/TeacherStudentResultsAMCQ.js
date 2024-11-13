import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../Universal/firebase';
import Navbar from '../../../Universal/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { SquareCheck, SquareX, ChevronUp, ChevronDown,  Square, User, MessageSquareMore, Check, UserX } from 'lucide-react';
import { useRef } from 'react';
function TeacherStudentResultsAMCQ() {
    const { assignmentId, studentUid, classId } = useParams();
    const [assignmentName, setAssignmentName] = useState('');
    const [results, setResults] = useState(null);
    const [studentName, setStudentName] = useState('');
    const [correctCount, setCorrectCount] = useState(0);
    
    const [completedCoun, setCompletedCount] = useState(0);
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
                const gradeDocRef = doc(db, 'grades', `${assignmentId}_${studentUid}`);
                const gradeDoc = await getDoc(gradeDocRef);

                if (gradeDoc.exists()) {
                    const data = gradeDoc.data();
                    setResults(data);
                    setAssignmentName(data.assignmentName);

                    // Calculate counts
                    setCorrectCount(data.correctQuestions.length);
                    setIncorrectCount(data.incorrectQuestions.length);
                    setCompletedCount(data.completedQuestions.length);

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

    const AMCQMap = ({ allQuestions, results, scrollToQuestion }) => {
        const [isMapCollapsed, setIsMapCollapsed] = useState(false);
        const contentRef = useRef(null);
        const [contentHeight, setContentHeight] = useState('auto');
    
        useEffect(() => {
            const updateHeight = () => {
                if (contentRef.current) {
                    const headerHeight = 50; // Height of the header
                    const maxHeight = window.innerHeight - 230; // 230 = 180 (top) + 50 (header)
                    const contentScrollHeight = contentRef.current.scrollHeight + headerHeight;
                    
                    if (contentScrollHeight > maxHeight) {
                        setContentHeight(`${maxHeight}px`);
                    } else {
                        setContentHeight(`${contentScrollHeight}px`);
                    }
                }
            };
    
            updateHeight();
            window.addEventListener('resize', updateHeight);
            return () => window.removeEventListener('resize', updateHeight);
        }, [results]);
    
        const handleQuestionClick = (index) => {
            const element = document.getElementById(`question-${index}`);
            if (element) {
                const elementRect = element.getBoundingClientRect();
                const absoluteElementTop = elementRect.top + window.pageYOffset;
                const middle = absoluteElementTop - (window.innerHeight / 2);
                window.scrollTo({
                    top: middle,
                    behavior: 'smooth'
                });
            }
        };
    
        return (
            <div style={{
                position: 'fixed',
                height: isMapCollapsed ? '50px' : contentHeight,
                top: '180px',
                left: '40px',
                width: '80px',
                paddingBottom: isMapCollapsed ? '0px' : '30px',
                backgroundColor: 'white',
                boxShadow: '1px 1px 5px 1px rgb(0,0,155,.1)',
                borderRadius: '10px',
                transition: 'all 0.3s',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden' // Add this to prevent content from overflowing when collapsed
            }}>
                <div style={{
                    display: 'flex',
                    width: '50px',
                    marginLeft: 'auto', marginRight: 'auto',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px',
                    height: '30px'
                }}>
                    <span style={{ fontWeight: 'bold' }}>Map</span>
                    <button
                        onClick={() => setIsMapCollapsed(!isMapCollapsed)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}
                    >
                        {isMapCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                    </button>
                </div>
                {!isMapCollapsed && (
                    <div ref={contentRef} style={{ 
                        overflowY: 'auto', 
                        flex: 1,
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#888 #f1f1f1',
                        '&::-webkit-scrollbar': {
                            width: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                            background: '#f1f1f1',
                            borderRadius: '10px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: '#888',
                            borderRadius: '10px',
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                            background: '#555',
                        },
                    }}>
                        {allQuestions.map((question, index) => {
                            const isCorrect = results.correctQuestions.some(q => q.question === question.question);
                            
                            return (
                                <div
                                    key={index}
                                    onClick={() => handleQuestionClick(index)}
                                    style={{
                                        width: '50px',
                                        marginLeft: 'auto', marginRight: 'auto',
                                        alignItems: 'center',
                                        padding: '10px 5px',
                                        display: 'flex',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <span style={{ marginLeft: '0px', fontWeight: '700', marginRight: 'auto' }}>{index + 1}.</span>
                                    {isCorrect ? (
                                        <SquareCheck size={25} color="#00d12a" style={{ marginRight: '0px' }} />
                                    ) : (
                                        <SquareX size={25} color="#FF0000" style={{ marginRight: '0px' }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };
    const scrollToQuestion = (index) => {
        const element = document.getElementById(`question-${index}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };
    
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
                    fontFamily: "'montserrat', sans-serif",
                    marginBottom: '0px',
                    marginTop: '0px',
                 
                    padding: '10px 0px',
                    width: '750px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    textAlign: 'left',
                    borderBottom: ' 2px solid #f4f4f4' ,
                    listStyleType: 'none'
                }}
            >
                  <div style={{ display:'flex', alignItems: 'center', marginBottom: '0px',    }}>
               
                  <div>
                    {isCorrect ? 
                      <SquareCheck size={40} color="#00d12a" /> :  <SquareX size={40} color="#FF0000" />}
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
                       {isExpanded ?<ChevronUp size={25} color="#666666" /> : <ChevronDown size={25} color="#666666" />}
                
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
  border: '4px solid #f4f4f4',
   flexDirection: 'column',
  alignItems: 'center'
}}>
  <div style={{
                                            width: '50px',
                                            position: 'absolute',
                                            borderRadius: '15px 0px 0px 15px',
                                            left:'-4px',
                                            top: '-4px',
                                            bottom:'-4px',
                                            background:  '#AEF2A3' ,
                                            border:  ' 4px solid #20BF00' , 
                                            color: '#20BF00' , 
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}> 
                                            <User size={40} />
                                        </div>
                                        <div style={{
                                            flexGrow: 1,
                                            paddingLeft: '30px',
                                            paddingRight: '0px',
                                            marginLeft: '20px',
                                            position: 'relative',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            minHeight: '100px',
                                        }}>
                                            <p style={{
                                                fontSize: '16px',
                                                fontWeight: 'bold',
                                                textAlign: 'left',
                                                margin: 0,
                                                width: '88%',
                                                padding: '0px',
                                            }}>
                            {questionData.choiceContent}</p>
                            </div>
                        </div>
                       
                        <div style={{
  width:'380px' ,
  borderRadius: '20px',
  position: 'relative',
  marginLeft: '20px',
  border: '4px solid #f4f4f4',
   flexDirection: 'column',
  alignItems: 'center'
}}>
  <div style={{
                                            width: '50px',
                                            position: 'absolute',
                                            borderRadius: '15px 0px 0px 15px',
                                            left:'-4px',
                                            top: '-4px',
                                            bottom:'-4px',
                                            background: `#f4f4f4`,
                                            border: `4px solid lightgrey`, 
                                            display: 'flex',
                                            color: `grey`, 
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}> 
                                             <MessageSquareMore size={40} />
                                        </div>
                                        <div style={{
                                            flexGrow: 1,
                                            paddingLeft: '30px',
                                            paddingRight: '0px',
                                            marginLeft: '20px',
                                            position: 'relative',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            minHeight: '100px',
                                        }}>
                                            <p style={{
                                                fontSize: '16px',
                                                fontWeight: 'bold',
                                                textAlign: 'left',
                                                color: 'grey',
                                                margin: 0,
                                                width: '88%',
                                                padding: '0px',
                                            }}>
                            {questionData.correctExplanation}</p>
                            </div>
                        </div>
                           
                            </div>
                        ) : (
                            <div style={{paddingBottom: '30px'}}>
                            <div style={{ display: 'flex',borderBottom: '4px solid #f4f4f4' , paddingBottom: '30px'}}>
                            <div style={{
  width:'380px' ,
  borderRadius: '20px',
  position: 'relative',
  border: '4px solid #f4f4f4',
   flexDirection: 'column',
  alignItems: 'center'
}}>
  <div style={{
                                            width: '50px',
                                            position: 'absolute',
                                            borderRadius: '15px 0px 0px 15px',
                                            left:'-4px',
                                            top: '-4px',
                                            bottom:'-4px',
                                            background:  '#FFD3D3' ,
                                            border:  ' 4px solid red' , 
                                            color: 'red' , 
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}> 
                                            <UserX  size={40} />
                                        </div>
                                        <div style={{
                                            flexGrow: 1,
                                            paddingLeft: '30px',
                                            paddingRight: '0px',
                                            marginLeft: '20px',
                                            position: 'relative',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            minHeight: '100px',
                                        }}>
                                            <p style={{
                                                fontSize: '16px',
                                                fontWeight: 'bold',
                                                textAlign: 'left',
                                                margin: 0,
                                                width: '88%',
                                                padding: '0px',
                                            }}>
                            {questionData.choiceContent}</p>
                            </div>
                        </div>
                       
                        <div style={{
  width:'380px' ,
  borderRadius: '20px',
  position: 'relative',
  marginLeft: '20px',
  border: '4px solid #f4f4f4',
   flexDirection: 'column',
  alignItems: 'center'
}}>
  <div style={{
                                            width: '50px',
                                            position: 'absolute',
                                            borderRadius: '15px 0px 0px 15px',
                                            left:'-4px',
                                            top: '-4px',
                                            bottom:'-4px',
                                            background: `#f4f4f4`,
                                            border: `4px solid lightgrey`, 
                                            display: 'flex',
                                            color: `grey`, 
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}> 
                                             <MessageSquareMore size={40} />
                                        </div>
                                        <div style={{
                                            flexGrow: 1,
                                            paddingLeft: '30px',
                                            paddingRight: '0px',
                                            marginLeft: '20px',
                                            position: 'relative',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            minHeight: '100px',
                                        }}>
                                            <p style={{
                                                fontSize: '16px',
                                                fontWeight: 'bold',
                                                textAlign: 'left',
                                                margin: 0,
                                                
                                                color: 'grey',
                                                width: '88%',
                                                padding: '0px',
                                            }}>
                            {questionData.incorrectExplanation}</p>
                            </div>
                        </div>
                           </div>



                            <div style={{ display: 'flex', marginTop: '40px'}}>
                            <div style={{
  width:'380px' ,
  borderRadius: '20px',
  position: 'relative',
  border: '4px solid #f4f4f4',
   flexDirection: 'column',
  alignItems: 'center'
}}>
  <div style={{
                                            width: '50px',
                                            position: 'absolute',
                                            borderRadius: '15px 0px 0px 15px',
                                            left:'-4px',
                                            top: '-4px',
                                            bottom:'-4px',
                                            background:  '#AEF2A3' ,
                                            border:  ' 4px solid #20BF00' , 
                                            color: '#20BF00' , 
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}> 
                                            <Check  strokeWidth={3} size={30} />
                                        </div>
                                        <div style={{
                                            flexGrow: 1,
                                            paddingLeft: '30px',
                                            paddingRight: '0px',
                                            marginLeft: '20px',
                                            position: 'relative',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            minHeight: '100px',
                                        }}>
                                            <p style={{
                                                fontSize: '16px',
                                                fontWeight: 'bold',
                                                textAlign: 'left',
                                                margin: 0,
                                                width: '88%',
                                                padding: '0px',
                                            }}>
                            {questionData.correctContent}</p>
                            </div>
                        </div>
                       
                        <div style={{
  width:'380px' ,
  borderRadius: '20px',
  position: 'relative',
  marginLeft: '20px',
  border: '4px solid #f4f4f4',
   flexDirection: 'column',
  alignItems: 'center'
}}>
  <div style={{
                                            width: '50px',
                                            position: 'absolute',
                                            borderRadius: '15px 0px 0px 15px',
                                            left:'-4px',
                                            top: '-4px',
                                            bottom:'-4px',
                                            background: `#f4f4f4`,
                                            border: `4px solid lightgrey`, 
                                            display: 'flex',
                                            color: `grey`, 
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}> 
                                             <MessageSquareMore size={40} />
                                        </div>
                                        <div style={{
                                            flexGrow: 1,
                                            paddingLeft: '30px',
                                            paddingRight: '0px',
                                            marginLeft: '20px',
                                            position: 'relative',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            minHeight: '100px',
                                        }}>
                                            <p style={{
                                                fontSize: '16px',
                                                fontWeight: 'bold',
                                                textAlign: 'left',
                                                
                                                color: 'grey',
                                                margin: 0,
                                                width: '88%',
                                                padding: '0px',
                                            }}>
                            {questionData.correctExplanation}</p>
                            </div>
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
                minHeight: '100vh',
                width: '100%',
                backgroundColor: '#white',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
            }}
        >

            
            <Navbar userType="teacher" />



           
 
           
           
           
            <div style={{  fontFamily: "'montserrat', sans-serif", backgroundColor: '', width: '820px', zIndex: '100', alignItems: 'center', marginLeft: 'auto', marginRight: 'auto', marginTop: '190px'}}>
           
           
    


<div style={{display: 'flex'}}>
    <div style={{display: 'flex',
       boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)' , paddingRight: '0px', width: '605px ', borderRadius: '15px', marginBottom: '20px', height: '190px', marginLeft: '-10px',background: 'white' }}>
<div style={{marginLeft: '30px', marginBottom: '40px'}}>
<h1 style={{ fontSize: '40px', color: 'black', marginBottom: '0px',  marginLeft: '-5px',fontFamily: "'montserrat', sans-serif", textAlign: 'left',  }}>{studentName}</h1>

<h1 style={{ fontSize: '30px', fontFamily: "'montserrat', sans-serif", textAlign: 'left', color: 'grey', fontWeight: '600', marginTop: '10px'   }}> {assignmentName}
</h1>
<h1 style={{ fontSize: '20px', fontFamily: "'montserrat', sans-serif", textAlign: 'left',  color: 'grey', fontWeight: '500', marginTop: '-10px' }}> Submitted: {new Date(results.submittedAt.toDate()).toLocaleString()} </h1>
    

</div>
 

</div>



       <div style={{height: '190px ', position: 'relative', marginLeft:'auto', boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)' , borderRadius: '15px', width: '190px ', background: 'white'}}>
       <img style={{ width: '150px', marginLeft: '20px' , marginTop: '23px' }} src="/Score.svg" alt="logo" />
     
       <div style={{fontSize: '60px', fontWeight: 'bold', width: '150px', height: '150px',position: 'absolute', background: 'transparent',  borderRadius:  '10px', top: '20px', left: '20px', textAlign: 'center', lineHeight: '150px'}}> 
       {letterGrade}

          </div>
                      
                   
           </div>
           </div>
           <div style={{display: 'flex', width: '880px', marginTop:'15px'}}>
               <div style={{width: '335px', boxShadow: '1px 1px 5px 1px rgb(0,0,155,.1)', borderRadius: '15px', height: '135px',  padding: '0px 0px', marginLeft: '-10px'}}>
                   <h1 style={{  marginBottom: '-20px', marginTop:'15px', marginLeft: '30px', fontSize: '25px', }}> Point Distribution</h1>
                 <div style={{display: 'flex', }}> 
                   <div style={{ fontSize: '30px', fontWeight: 'bold',marginLeft: '30px',color: 'black', display: 'flex', alignItems: 'center',  justifyContent: 'space-around',  width: '90px', marginTop: '50px' , }}>
                   
                       <div style={{width: '40px', }}>
                       <SquareCheck size={40} color="#00d12a" />
                       </div>
                       <h1 style={{ backgroundColor: 'white', borderRadius: '5px', margin: 'auto', marginLeft: '5px', marginTop: '0px', fontSize: '35px', alignItems: 'center', position: 'relative', fontFamily: "'montserrat', sans-serif" }}>{correctCount}</h1>
                
                   </div>
               
               
                   
                
            
                   <div style={{ fontSize: '40px',marginLeft: '40px', fontWeight: 'bold', color: 'black', display: 'flex', alignItems: 'center',  justifyContent: 'space-around',   width: '90px', marginTop: '50px' }}>
                     
                   <div style={{width: '40px'}}>
                         <SquareX size={40} color="#ff0000" />
                       </div>
                       <h1 style={{backgroundColor: 'white', borderRadius: '5px', margin: 'auto', marginLeft: '5px', marginTop: '0px', fontSize: '35px', alignItems: 'center', position: 'relative', fontFamily: "'montserrat', sans-serif" }}>{incorrectCount}</h1>
                   </div>
                   </div>
                   </div>


                   <div style={{width: '440px', boxShadow: '1px 1px 5px 1px rgb(0,0,155,.1)', borderRadius: '15px', height: '135px',  padding: '0px 10px', marginLeft: '35px' }}>
                   <h1 style={{  marginBottom: '-20px', marginTop:'15px', marginLeft: '10px', fontSize: '25px', }}>Grade</h1>
                   <div style={{display: 'flex', justifyContent: 'space-around', marginTop: '25px'}}> 
                   <p style={{fontSize: '25px', width: '20px',color: 'grey', padding: '5px 10px', background: '#f4f4f4', borderRadius: '5px', fontWeight: 'bold',  textAlign: 'center'}}>{letterGrade}</p>
                   
                   <p style={{fontSize: '25px', width: '90px',color: 'grey', padding: '5px 0px', background: '#f4f4f4', borderRadius: '5px', fontWeight: 'bold',  textAlign: 'center'}}>{`${correctCount}/${completedCoun}`}</p>
                   <p style={{fontSize: '20px', width: '170px',color: 'grey', height: '30px', marginTop: '25px', padding: '5px 25px', background: '#f4f4f4', borderRadius: '5px', fontWeight: 'bold',  textAlign: 'center', lineHeight: '30px'}}>   SquareScore: {results.SquareScore}</p>

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
              
           
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '25px', marginBottom: '40px', position:'absolute', left: '30px', top: '-50px', 
                    
                  }}>
              
                <AMCQMap allQuestions={allQuestions} results={results} scrollToQuestion={scrollToQuestion} />    </div>
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
 </div>
 <div style={{marginLeft: 'auto', marginRight: 'auto', width: '800px', marginTop: '20px',}}>
    <ul style={{ listStyle: 'none', padding: '0',  marginTop: '0px', boxShadow: '1px 1px 5px 1px rgb(0,0,155,.1)', width: '830px', borderRadius: '15px',marginLeft: '-20px',}}>
                 <div style={{width: '800px'}}>
           {allQuestions.map((question, index) => renderQuestion(question.question, index))}
            </div>
        </ul>
           </div>
        </div>
    );
}

export default TeacherStudentResultsAMCQ;
