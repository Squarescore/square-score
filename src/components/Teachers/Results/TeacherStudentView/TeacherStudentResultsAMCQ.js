import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../Universal/firebase';
import Navbar from '../../../Universal/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { SquareCheck, SquareX, ChevronUp, ChevronDown, Square, User, MessageSquareMore, Check, UserX, UserCheck } from 'lucide-react';

function TeacherStudentResultsAMCQ() {
    const { assignmentId, studentUid, classId } = useParams();
    const [assignmentName, setAssignmentName] = useState('');
    const [results, setResults] = useState(null);
    const [studentName, setStudentName] = useState('');
    const [correctCount, setCorrectCount] = useState(0);
    const [completedCount, setCompletedCount] = useState(0);
    const [incorrectCount, setIncorrectCount] = useState(0);
    const [allQuestions, setAllQuestions] = useState([]);
    const navigate = useNavigate();
    const [expandedQuestions, setExpandedQuestions] = useState({});
    const [selectedChoices, setSelectedChoices] = useState({});

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const gradeDocRef = doc(db, 'grades', `${assignmentId}_${studentUid}`);
                const gradeDoc = await getDoc(gradeDocRef);

                if (gradeDoc.exists()) {
                    const data = gradeDoc.data();
                    setResults(data);
                    setAssignmentName(data.assignmentName);
                    setCorrectCount(data.correctQuestions.length);
                    setIncorrectCount(data.incorrectQuestions.length);
                    setCompletedCount(data.completedQuestions.length);
                    setStudentName(`${data.firstName} ${data.lastName}`);

                    const combined = [
                        ...data.correctQuestions,
                        ...data.incorrectQuestions
                    ];
                    setAllQuestions(combined);
                }
            } catch (error) {
                console.error('Error fetching results:', error);
            }
        };

        fetchResults();
    }, [assignmentId, studentUid]);
    const getLetterGrade = (score) => {
        const percentage = parseInt(score);
        if (percentage >= 90) return 'A';
        if (percentage >= 80) return 'B';
        if (percentage >= 70) return 'C';
        if (percentage >= 60) return 'D';
        return 'F';
    };

    const getGradeColors = (grade) => {
        if (grade === undefined || grade === null || grade === 0) return { color: '#858585', background: 'white' };
        if (grade < 50) return { color: '#FF0000', background: '#FFCBCB' };
        if (grade < 70) return { color: '#FF4400', background: '#FFC6A8' };
        if (grade < 80) return { color: '#EFAA14', background: '#FFF4DC' };
        if (grade < 90) return { color: '#9ED604', background: '#EDFFC1' };
        if (grade > 99) return { color: '#E01FFF', background: '#F7C7FF' };
        return { color: '#2BB514', background: '#D3FFCC' };
    };

    if (!results) return <div>Loading...</div>;

    const letterGrade = getLetterGrade(results.SquareScore);
    if (!results) return <div>Loading...</div>;

 
   
    const renderChoice = (questionData, choiceKey, index) => {
        const isSelected = questionData.selectedChoice === choiceKey;
        const isCorrect = questionData.correctChoice === choiceKey;
        const isSelectedCorrect = isSelected && isCorrect;
        const isSelectedIncorrect = isSelected && !isCorrect;
        const isClicked = selectedChoices[index] === choiceKey;
        
        const boxStyle = {
            width: '92%',
            borderRadius: '20px',
            position: 'relative',
            
                    marginLeft: '4%',
            marginBottom: '10px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
        };

        const getIconProps = () => {
            if (isSelectedCorrect) {
                return {
                    icon: <UserCheck size={20} />,
                    color: '#20BF00'
                };
            } else if (isSelectedIncorrect) {
                return {
                    icon: <UserX size={20} />,
                    color: 'red'
                };
            } else if (isCorrect) {
                return {
                    icon: <Check strokeWidth={3} size={20} />,
                    color: '#20BF00'
                };
            } else {
                return {
                    icon: <Square size={20} />,
                    color: 'white'
                };
            }
        };
        const choiceStyles = {
            a: { background: '#C7CFFF', color: '#020CFF' },
            c: { background: '#D6FFCF', color: '#2BB514' },
            b: { background: '#F6C1FF', color: '#E441FF' },
            d: { background: '#FFEFCC', color: '#FFAE00' },
            e: { background: '#CAFFF4', color: '#00F1C2' },
            f: { background: '#C2FBFF', color: '#CC0000' },
            g: { background: '#E3BFFF', color: '#8364FF' },
            h: { background: '#9E9E9E', color: '#000000' },
        };
    
        const iconProps = getIconProps();
        const style = choiceStyles[choiceKey] || { background: '#f4f4f4', color: 'grey' };

        return (
            <div 
                style={boxStyle} 
                onClick={() => setSelectedChoices(prev => ({
                    ...prev,
                    [index]: choiceKey
                }))}
            >
                <div style={{
                    width: '50px',
                    position: 'absolute',
                    borderRadius: '15px 0px 0px 15px',
                    left: '-50px',
                    top: '-4px',
                    bottom: '-4px',
                    color: iconProps.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {iconProps.icon}
                </div>
                <div style={{
                    padding: '0px 20px',
                  borderRadius: '3px', 
                    borderLeft: isClicked ? `5px solid ${style.color}`: '5px solid grey',
                    background: isClicked ? style.background : '#f4f4f4',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.3s ease'
                }}>
                    <p style={{
                        fontSize: '16px',
                        fontWeight: '500',
                        color: isClicked ? style.color : 'grey',
                       margin: '-0px',
                       padding: '10px 20px',
                        transition: 'color 0.3s ease'
                    }}>
                        {questionData[choiceKey]}
                    </p>
                </div>
            </div>
        );
    };
    const renderExplanation = (questionData, selectedChoice) => {
        if (!selectedChoice) return null;

        const explanationKey = `explanation_${selectedChoice}`;
        const explanation = questionData[explanationKey];

        return explanation ? (
            <div style={{
                marginTop: '30px',
                width: '92%',
                marginLeft: '4%',
                marginBottom: '30px',
            }}>
              <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '10px',
                    fontWeight: '500',
                    color: 'lightgrey',
                }}>
                    <MessageSquareMore size={20} style={{ marginRight: '10px' }} />
                    <h4 style={{ margin: 0 , fontWeight: '600', fontSize: '16px'}}>Explanation</h4>
                </div>
                <p style={{ margin: 0 }}>{explanation}</p>
            </div>
        ) : null;
    };

    const renderQuestion = (questionData, index) => {
        const toggleExpanded = () => {
            setExpandedQuestions(prev => {
                const newState = {
                    ...prev,
                    [index]: !prev[index]
                };
                // Set selected choice to student's selection when expanding
                if (newState[index]) {
                    setSelectedChoices(prev => ({
                        ...prev,
                        [index]: questionData.selectedChoice
                    }));
                }
                return newState;
            });
        };

        const isExpanded = expandedQuestions[index] || false;

        return (
            <div 
                key={index}
                style={{
                    borderBottom: '1px solid #ededed',
                    width: '100%', background: 'white',
                    padding: '20px 0px',
                }}
            >
             <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    height: '30px', 
    marginTop: '20px',
    marginBottom: '20px',
    marginLeft: '4%'
}}>
    {/* Replace Square with conditional icon */}
    {questionData.selectedChoice === questionData.correctChoice ? 
        <SquareCheck size={25} color="#20BF00" /> : 
        <SquareX size={25} color="#FF0000" />
    }
    <h3 style={{ 
        fontSize: '20px',
        marginLeft: '20px',
        fontWeight: '600'
    }}>
        {questionData.question}
    </h3>
    <button 
        onClick={toggleExpanded}
        style={{
            background: 'none',
            border: 'none',
            marginLeft: 'auto',
            marginRight: '4%',
            cursor: 'pointer'
        }}
    >
        {isExpanded ? <ChevronUp size={25} /> : <ChevronDown size={25} />}
    </button>
</div>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {['a', 'b', 'c', 'd'].map(choiceKey => 
                                renderChoice(questionData, choiceKey, index)
                            )}
                            {renderExplanation(questionData, selectedChoices[index])}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    return (
            <div style={{
                minHeight: '100vh',
                width: 'calc(100% - 200px)',
                marginLeft: '200px',
                backgroundColor: 'white',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
            }}>
                <Navbar 
                    userType="teacher"
                    navItems={[
                        {
                            type: 'assignmentName',
                            id: assignmentId,
                            label: assignmentName
                        },
                        {
                            type: 'studentGrades',
                            id: studentUid,
                            label: studentName
                        }
                    ]}
                    classId={classId}
                />
    
                <div style={{
                    fontFamily: "'montserrat', sans-serif",
                    width: '100%',
                    zIndex: '20',
                    alignItems: 'center',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    marginTop: '0px'
                }}>
                    <div style={{display: 'flex'}}>
                        <div style={{
                            paddingRight: '0px',
                            width: '655px',
                            borderRadius: '15px',
                            marginBottom: '20px',
                            height: '140px',
                            marginLeft: '4%',
                        }}>


                            <div style={{display: 'flex', marginBottom: '30px'}}>
                                <h1
                                   onClick={() => navigate(`/class/${classId}/student/${studentUid}/grades`)}
                           
                                    style={{
                                        fontSize: '30px',
                                        color: 'black',
                                        marginBottom: '-10px',
                                        cursor: 'pointer',
                                        marginLeft: '-5px',
                                        fontFamily: "'montserrat', sans-serif",
                                        textAlign: 'left',
                                        fontWeight: '500'
                                    }}
                                    onMouseEnter={(e) => { e.target.style.textDecoration = 'underline'; }}
                                    onMouseLeave={(e) => { e.target.style.textDecoration = 'none'; }}
                                >
                                    {studentName} 
                                </h1>



                             

                                
                           
                            </div>
    
    <div style={{display: 'flex',  height: '26px'}}>

    <div style={{    width: '30px',
                                textAlign: 'center',
                                height: '20px',
                                marginTop: '3px',
                                lineHeight: '20px',
                                fontSize: '16px',
                                borderRadius: '3px',
                                    background: getGradeColors(results.SquareScore).background,
                                    color: getGradeColors(results.SquareScore).color
                                }}>{letterGrade}</div>
                                <div style={{height: '20px', width: '1px', background: '#EDEDED ', margin: '3px 10px'}}/>
                            <h1 style={{
                                fontSize: '16px',
                                color: 'grey',
                                marginBottom: '0px',
                                cursor: 'pointer',
                                marginTop: '3px',
                                fontFamily: "'montserrat', sans-serif",
                                textAlign: 'left',
                                fontWeight: '500'
                            }}
                            onClick={() => navigate(`/class/${classId}/assignment/${assignmentId}/TeacherResultsAMCQ`)}
                                   
                         onMouseEnter={(e) => { e.target.style.textDecoration = 'underline'; }}
                            onMouseLeave={(e) => { e.target.style.textDecoration = 'none'; }}
                            >
                              {assignmentName} 
                            </h1>
                            <div style={{height: '20px', width: '1px', background: '#EDEDED ', margin: '3px 10px'}}/>
                       
<span style={{fontSize: '14px', fontWeight: '600', color: '#7D00EA',
                                marginTop: '4px', }}>MC<span style={{color: '#FFAE00'}}>*</span></span>
<div style={{height: '20px', width: '1px', background: '#EDEDED ', margin: '3px 10px'}}/>
                       
                            <h1 style={{fontSize: '14px', color: 'grey', 
                                marginTop: '4px', fontWeight: '500'}}>
                                     {new Date(results.submittedAt.toDate()).toLocaleString()}
                                </h1>


                              
                            </div>
                        </div>
                    </div>
    
                    <div style={{
                        position: 'sticky',
                        height: '50px',
                        top: '-1px',
                        left: '200px',
                        width: 'calc(100%)',
                        background: 'rgb(255,255,255,.9)',
                        backdropFilter: 'blur(5px)',
                        borderBottom: '1px solid lightgrey',
                        borderTop: '1px solid lightgrey',
                        marginTop: '-40px',
                        transition: 'all 0.1s',
                        zIndex: 50,
                        display: 'flex',
                        flexDirection: 'row'
                    }}>
                        <div style={{marginLeft: '4%', width: '86%', display: 'flex', overflow: 'hidden', marginTop: '2px'}}>
                            {allQuestions.map((question, index) => (
                                <div key={index} style={{width: '30px', padding: '10px 5px'}}>
                                    {question.selectedChoice === question.correctChoice ? (
                                        <SquareCheck size={25} color="#00d12a" />
                                    ) : (
                                        <SquareX size={25} color="#FF0000" />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div style={{
                            fontSize: '20px',
                            marginRight: '4%',
                            marginLeft: 'auto',
                            paddingLeft: '20px',
                            lineHeight: '50px',
                            display: 'flex'
                        }}>
                            <div style={{
                                width: '60px',
                                textAlign: 'center',
                                height: '26px',
                                marginTop: '12px',
                                lineHeight: '26px',
                                fontSize: '16px',
                                borderRadius: '5px',
                                background: getGradeColors(results.SquareScore).background,
                                color: getGradeColors(results.SquareScore).color
                            }}>
                                {results.SquareScore}%
                            </div>
                        </div>
                    </div>

                <div style={{ marginTop: '0px', }}>
                    {allQuestions.map((question, index) => renderQuestion(question, index))}
                </div>
            </div>
        </div>
    );
}

export default TeacherStudentResultsAMCQ;