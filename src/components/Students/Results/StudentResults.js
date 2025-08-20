import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../Universal/firebase';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../Universal/Navbar';
import { useRef } from 'react';
import { Check, X, Slash, Flag, MessageSquareMore } from 'lucide-react';
import Tooltip from './ToolTip';
import ResponsiveText from '../../Teachers/Results/TeacherStudentView/ResponsiveText';
import { GlassContainer } from '../../../styles';

function StudentResults() {
  const [assignmentData, setAssignmentData] = useState(null);
  const navigate = useNavigate();
  const { assignmentId, studentUid } = useParams();

  const [contentHeight, setContentHeight] = useState('auto');
  const [assignmentName, setAssignmentName] = useState('');
  const [results, setResults] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [partialCount, setPartialCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [flaggedIndexes, setFlaggedIndexes] = useState({});
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(null);
  const questionRefs = useRef([]);
  const [useSlider, setUseSlider] = useState(false);
  const contentRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showRubric, setShowRubric] = useState({});

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleRubric = (index) => {
    setShowRubric(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const [isMapCollapsed, setIsMapCollapsed] = useState(false);

  const [isSticky, setIsSticky] = useState(false);
  const studentUID = auth.currentUser.uid;
  const scrollToQuestion = (index) => {
    setActiveQuestionIndex(index);
    questionRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const stickyRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
      const options = {
          root: null,
          rootMargin: "-70px 0px 0px 0px",
          threshold: 1
      };

      const observer = new IntersectionObserver(([entry]) => {
          setIsSticky(!entry.isIntersecting);
          console.log("Sticky state:", !entry.isIntersecting); // Debug log
      }, options);

      if (stickyRef.current) {
          observer.observe(stickyRef.current);
      }

      return () => {
          if (stickyRef.current) {
              observer.unobserve(stickyRef.current);
          }
      };
  }, []);

  useEffect(() => {
    const fetchStudentName = async () => {
      const studentDocRef = doc(db, 'students', studentUid);
      const studentDoc = await getDoc(studentDocRef);
      if (studentDoc.exists()) {
        const studentData = studentDoc.data();
        setStudentName(`${studentData.firstName} ${studentData.lastName}`);
      }
    };

    fetchStudentName();
  }, [studentUid]);

  useEffect(() => {
    const checkContentHeight = () => {
      if (contentRef.current) {
        const windowHeight = window.innerHeight;
        const contentHeight = contentRef.current.scrollHeight;
        setUseSlider(contentHeight > windowHeight - 230); // 230 = 180 (top) + 50 (header)
      }
    };

    checkContentHeight();
    window.addEventListener('resize', checkContentHeight);
    return () => window.removeEventListener('resize', checkContentHeight);
  }, [results]);
  
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

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const gradeDocRef = doc(db, 'grades', `${assignmentId}_${studentUid}`);
        const gradeDoc = await getDoc(gradeDocRef);

        if (gradeDoc.exists()) {
          const data = gradeDoc.data();
          console.log("Fetched data:", data);  // Log the entire fetched data
          setResults(data);
          setAssignmentName(data.assignmentName);
          
          // Calculate counts
          const correct = data.questions.filter(q => q.score === data.scaleMax).length;
          const partial = data.questions.filter(q => q.score > data.scaleMin && q.score < data.scaleMax).length;
          const incorrect = data.questions.filter(q => q.score === data.scaleMin).length;
          
          console.log("Correct count:", correct);
          console.log("Partial count:", partial);
          console.log("Incorrect count:", incorrect);

          setCorrectCount(correct);
          setPartialCount(partial);
          setIncorrectCount(incorrect);
          
          // Initialize flaggedIndexes state based on current flags
          const initialFlagged = {};
          data.questions.forEach((q, idx) => {
            if (q.flagged) {
              initialFlagged[idx] = true;
            }
          });
          setFlaggedIndexes(initialFlagged);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error('Error fetching results:', error);
      }
    };

    fetchResults();
    
  }, [assignmentId, studentUID]);

  // Function to toggle flag status for a specific question
  const flagForReview = async (index) => {
      if (!results) return;

      // Toggle the flagged status
      const updatedFlagged = !flaggedIndexes[index];
      setFlaggedIndexes(prev => ({
        ...prev,
        [index]: updatedFlagged
      }));

      // Update the flagged status in the questions array
      const updatedQuestions = [...results.questions];
      updatedQuestions[index].flagged = updatedFlagged;

      // Determine if any questions are still flagged
      const hasFlaggedQuestions = updatedQuestions.some(q => q.flagged);

      // Prepare the updated data
      const updatedData = { 
        ...results, 
        questions: updatedQuestions,
        hasFlaggedQuestions: hasFlaggedQuestions // Update hasFlaggedQuestions
      };

      try {
          // Update the Firestore document with the new flagged statuses and hasFlaggedQuestions
          const resultsRef = doc(db, 'grades', `${assignmentId}_${studentUid}`);
          await updateDoc(resultsRef, updatedData);

          // Update the local state to reflect changes
          setResults(updatedData);
      } catch (error) {
          console.error('Error toggling flag:', error);
          // Optionally, revert the local state change if the update fails
          setFlaggedIndexes(prev => ({
            ...prev,
            [index]: !updatedFlagged // Revert the toggle
          }));
      }
  };

  if (!results) {
    return <div>Loading...</div>;
  }
 
  const getLetterGrade = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

 
  
  const letterGrade = getLetterGrade(results.percentageScore);

  const getGradeColors = (grade) => {
    if (grade === undefined || grade === null || grade === 0) return { color: '#858585', variant: 'clear' };
    if (grade < 60) return { color: '#c63e3e', variant: 'red' };
    if (grade < 70) return { color: '#ff8800', variant: 'orange' };
    if (grade < 80) return { color: '#ffc300', variant: 'yellow' };
    if (grade < 90) return { color: '#29c60f', variant: 'green' };
    if (grade < 100) return { color: '#006400', variant: 'darkgreen' };
    return { color: '#f198ff', variant: 'pink' };
  };
  return (
    <div style={{   
      minHeight: '100vh',
      width: 'calc(100% - 200px)',
      marginLeft:'200px',
      backgroundColor: 'white',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative' 
    }}>
      <Navbar userType="student" />

      <div style={{  
        fontFamily: "'montserrat', sans-serif", 
        backgroundColor: '', 
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
            marginBottom: '30px',
            height: '80px',
            marginLeft: '4%',
            alignItems: 'center',
            display: 'flex',
            width: '92%', 
          }}>
            <h1 style={{
              fontSize: '1.3rem',
              color: 'black',
              fontFamily: "'montserrat', sans-serif",
              textAlign: 'left',
              fontWeight: '400'
            }}>
              {studentName} 
            </h1>

            <div style={{ marginLeft: '20px' }}>
              <GlassContainer
                variant={getGradeColors(results.percentageScore).variant}
                size={0}
                style={{ zIndex: '1' }}
                contentStyle={{
                  padding: '2px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <div style={{display:'flex', gap:'8px'}}>
                  <span style={{
                    fontSize: '.8rem',
                    color: getGradeColors(results.percentageScore).color,
                    fontWeight: '500'
                  }}>
                    {letterGrade}
                  </span>
                  <span style={{
                    width: '1px',
                    marginTop: '3px',
                    background: getGradeColors(results.percentageScore).color,
                    height: '10px',
                  }}/>
                  <span style={{
                    fontSize: '.8rem',
                    color: getGradeColors(results.percentageScore).color,
                    fontWeight: '500'
                  }}>
                    {results.percentageScore.toFixed(0)}%
                  </span>
                </div>
              </GlassContainer>
            </div>

            <div style={{marginLeft: 'auto', display: 'flex', alignItems: 'center'}}>
              <h1 style={{
                fontSize: '.9rem', 
                color: 'grey', 
                marginTop: '4px', 
                fontWeight: '500',
              }}>
                {assignmentName} 
                <span style={{
                  fontSize: '.9rem', 
                  fontWeight: '600', 
                  color: '#38BFB8',
                  marginTop: '4px', 
                  marginLeft: '5px' 
                }}>OE</span>
              </h1>
              <div style={{height: '20px', width: '1px', background: '#EDEDED', margin: '3px 10px'}}/>
              <h1 style={{
                fontSize: '12px', 
                color: 'grey', 
                marginTop: '4px', 
                fontWeight: '400'
              }}>
                {new Date(results.submittedAt.toDate()).toLocaleString()}
              </h1>
            </div>
          </div>
        </div>

        <div style={{
          position: 'sticky',
          height: '40px',
          top: '0px',
          left: '200px',
          width: 'calc(100%)',
          background: 'rgb(255,255,255,.9)',
          backdropFilter: 'blur(5px)',
          borderBottom: isScrolled ? '1px solid #ddd' : '1px solid transparent',
          marginTop: '-40px',
          transition: 'all 0.3s',
          zIndex: 20,
          display: 'flex',
          flexDirection: 'row'
        }}>
          <div style={{marginLeft: 'calc(4% - 10px)', width: '86%', display: 'flex', overflow: 'hidden', marginTop: '4px' }}>
            {results.questions.map((question, index) => (
              <div
                key={index}
                onClick={() => scrollToQuestion(index)}
                style={{
                  width: '30px',
                  cursor: 'pointer',
                  padding: '8px 2px',
                }}
              >
                
                  {question.score === results.scaleMax ? (
                    <Check size={16} color="#16a34a" />
                  ) : question.score === results.scaleMin ? (
                    <X size={16} color="#dc2626" />
                  ) : (
                    <Slash strokeWidth={4} size={10} style={{padding: '2px'}} color="#FF8800" />
                  )}
              </div>
            ))}
          </div>
          <div style={{
            fontSize: '20px', 
            marginRight: '4%', 
            marginLeft: 'auto', 
            marginTop: '4px',
            opacity: isScrolled ? 1 : 0,
            visibility: isScrolled ? 'visible' : 'hidden',
            transition: 'opacity 0.2s ease-in-out, visibility 0.2s ease-in-out'
          }}>
            <GlassContainer
              variant={getGradeColors(results.percentageScore).variant}
              size={0}
              style={{ zIndex: '1' }}
              contentStyle={{
                display: 'flex',
                padding: '2px 10px',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <span style={{
                fontSize: '.9rem',
                color: getGradeColors(results.percentageScore).color,
                fontWeight: '500'
              }}>
                {results.percentageScore.toFixed(0)}%
              </span>
            </GlassContainer>
          </div>
        </div>

        <ul style={{ listStyle: 'none', padding: '0', marginTop: '10px', width: '100%', marginLeft: 'auto', marginRight: 'auto', borderRadius: '20px' }}>
          {results.questions && results.questions.map((question, index) => (
            <li key={index} 
              ref={el => questionRefs.current[index] = el} 
              style={{ 
                position: 'relative', 
                fontFamily: "'montserrat', sans-serif", 
                marginBottom: '20px', 
                background: 'white',
                width: '92%', 
                padding: '0% 2%', 
                margin: '20px 2%', 
                borderBottom: '1px solid lightgrey',     
                paddingBottom:'35px'  
              }}>
              <div style={{ display: 'flex', fontFamily: "'montserrat', sans-serif", alignItems: 'center', width: '100%' }}>
                <GlassContainer
                  variant={question.score === results.scaleMax ? 'green' : question.score === results.scaleMin ? 'red' : 'yellow'}
                  size={0}
                  style={{ 
                    marginRight: '15px',
                    zIndex: '1' 
                  }}
                  contentStyle={{
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {question.score === results.scaleMax ? (
                    <Check size={16} color="#16a34a" />
                  ) : question.score === results.scaleMin ? (
                    <X size={16} color="#dc2626" />
                  ) : (
                    <Slash strokeWidth={4} size={10} style={{padding: '2px'}} color="#FF8800" />
                  )}
                </GlassContainer>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  style={{ 
                    flex: 1,
                    maxWidth: '800px',
                    backgroundColor: 'white', 
                    lineHeight: '1.4', 
                    fontSize: '1rem', 
                    textAlign: 'left', 
                    border: 'none', 
                    position: 'relative', 
                    display: 'flex', 
                    flexDirection: 'column',
                    fontWeight: '500', 
                    padding: '0',
                    fontFamily: 'inherit'
                  }}
                >
                  <ResponsiveText
                    text={question.question}
                    maxFontSize={20} 
                    minFontSize={14} 
                  />
                </button>

                {question.flagged ? (
                  <GlassContainer
                    variant="blue"
                    size={0}
                    style={{
                      cursor: 'pointer',
                      marginLeft: 'auto',
                      zIndex: '1'
                    }}
                    contentStyle={{
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onClick={() => flagForReview(index)}
                  >
                    <Flag size={16} color="#020CFF" />
                  </GlassContainer>
                ) : (
                  <button
                    onClick={() => flagForReview(index)}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      padding: '5px',
                      marginLeft: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      color: 'grey',
                      justifyContent: 'center',
                   
                    }}
                  >
                    <Flag size={16}  />
                  </button>
                )}
              </div>

              <div style={{ marginTop: '0px'}}>
                <GlassContainer
                  variant={question.score === results.scaleMax ? 'green' : question.score === results.scaleMin ? 'red' : 'yellow'}
                  size={0}
                  style={{
                    marginTop: '15px',
                    maxWidth: 'fit-content',
                    opacity: 0.7,
                    zIndex: '1'
                  }}
                  contentStyle={{
                    padding: '10px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    color: `${question.score === results.scaleMax ? '#20BF00' : question.score === results.scaleMin ? '#FF0000' : '#E76F00'}`
                  }}
                >
                  <p style={{
                    fontSize: '16px',
                    fontWeight: '500',
                    textAlign: 'left',
                    margin: 0,
                    width: 'auto',
                    padding: '0px',
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'break-word',
                  }}>
                    {question.studentResponse || "Not provided"}
                  </p>
                </GlassContainer>

                <div style={{
                  alignItems: 'center',
                  marginBottom: '10px',
                  fontWeight: '500',
                  color: 'grey',
                  marginTop: '25px',
                  textAlign: 'left',
                  width: '96%',
                  display: 'flex',
                }}>
                  <MessageSquareMore size={16} strokeWidth={1.5} style={{ marginRight: '10px' }} />
                  <div style={{
                    margin: 0,
                    fontWeight: '400',
                    display: 'flex',
                    fontSize: '14px',
                    alignItems: 'center',
                    color: 'grey',
                  }}>
                    Feedback
                  </div>
                </div>

                <p style={{
                  fontSize: '.8rem',
                  color: 'grey',
                  textAlign: 'left',
                  width: '100%',
                  marginTop: '-5px',
                  fontFamily: "'montserrat', sans-serif",
                  lineHeight: '1.5',
                }}>
                  {question.feedback || "Not provided"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default StudentResults;
