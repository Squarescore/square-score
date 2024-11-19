import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../Universal/firebase';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../Universal/Navbar';
import { useRef } from 'react';
import { SquareCheck, SquareX, SquareSlash, Flag, Square, User, MessageSquareMore } from 'lucide-react';
import Tooltip from './ToolTip';
import ResponsiveText from '../../Teachers/Results/TeacherStudentView/ResponsiveText';
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


  return (
    <div style={{   minHeight: '100vh',
      width: 'calc(100% - 200px)',
      marginLeft:'200px',
      backgroundColor: 'white',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative' }}>   <Navbar userType="student" />

      <div style={{  fontFamily: "'montserrat', sans-serif", width: '100%', zIndex: '20', alignItems: 'center', marginLeft: 'auto', marginRight: 'auto', marginTop: '0px', }}>
           
           
           
       
               
                  
                  


           <div style={{display: 'flex'}}>
               <div style={{display: 'flex', 
              paddingRight: '0px', width: '655px ', borderRadius: '15px', marginBottom: '20px', height: '190px', marginLeft: '4%', }}>
          <div style={{marginBottom: '40px', }}>
          <h1 style={{ fontSize: '30px', color: 'black', marginBottom: '0px',  marginLeft: '-5px',fontFamily: "'montserrat', sans-serif", textAlign: 'left',  }}
                      
          
          
          >   {assignmentName}
          </h1>
        
          <h1
          
                             
          style={{ fontSize: '16px', fontFamily: "'montserrat', sans-serif", textAlign: 'left', color: 'lightgrey', fontWeight: '600', marginTop: '10px',   }}
          
          
         
       > 
         {studentName}
         </h1>
          <h1 style={{ fontSize: '16px', fontFamily: "'montserrat', sans-serif", textAlign: 'left',  color: 'grey', fontWeight: '500', marginTop: '30px' }}> {new Date(results.submittedAt.toDate()).toLocaleString()} </h1>
               
           
          </div>
            
   
          </div>
          <div style={{height: '100px ', position: 'relative', marginLeft:'auto',  borderRadius: '15px', width: '100px ',  marginTop:'30px' ,background: 'white', marginRight: '4%', }}>
          <img style={{ width: '100px',   }} src="/Score.svg" alt="logo" />
        
          <div style={{fontSize: '40px', fontWeight: 'bold', width: '90px', height: '70px',position: 'absolute', background: 'transparent',  borderRadius:  '10px', top: '-25px', left: '5px', textAlign: 'center', lineHeight: '150px'}}> 
          {letterGrade}
   
             </div>
                         
                      
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
      
      borderTop: '1px solid lightgrey',
      borderBottom: '1px solid lightgrey',
    marginTop: '-40px',
      transition: 'all 0.3s',
      zIndex: 50,
      display: 'flex',
      flexDirection: 'row'
    }}>
     <div style={{marginLeft: '4%', width: '86%', display: 'flex', overflow: 'hidden', }}>
      {results.questions.map((question, index) => (
          <div
            key={index}
            onClick={() => scrollToQuestion(index)}
            style={{
              width: '30px',
           cursor: 'pointer',
              padding: '10px 5px',
            }}
          >
            {question.score === results.scaleMax ? (
              <SquareCheck size={25} color="#00d12a" style={{ marginRight: '0px',
                cursor: 'pointer', }} />
            ) : question.score === results.scaleMin ? (
              <SquareX size={25} color="#FF0000" style={{ marginRight: '0px' ,
                cursor: 'pointer',}} />
            ) : (
              <SquareSlash size={25} color="#FFD13B" style={{ marginRight: '0px',
                cursor: 'pointer', }} />
            )}
          </div>
         ))}
           </div>  
           <div style={{fontSize: '20px', marginRight: '4%', marginLeft: 'auto', borderLeft: '1px solid lightgrey', paddingLeft: '20px', lineHeight: '50px'}}>
          
{results.percentageScore.toFixed(0)}%
            </div> 
            </div>

          
       





             
   
            <ul style={{ listStyle: 'none', padding: '0', marginTop: '20px',  width: '100%',marginLeft: 'auto', marginRight: 'auto', borderRadius: '20px' }}>
            {results.questions && results.questions.map((question, index) => {
            const studentResponseLength = (question.studentResponse || "").length;
            const isShortResponse = studentResponseLength < 50;
            const studentResponseWidth = isShortResponse ? 280 : 380;
            const feedbackWidth = isShortResponse ? 540 : 440;
            
            return (
              <li key={index} 
              ref={el => questionRefs.current[index] = el} 
              style={{ position: 'relative', fontFamily: "'montserrat', sans-serif", marginBottom: '20px', background: 'white',
                   width: '92%', marginRight: 'auto', paddingLeft: '4%',paddingRight: '4%', borderBottom: ' 1px solid lightgrey',  marginTop: '0px',   paddingBottom:'35px', marginLeft: '-5px' }}>
       <div style={{ display: 'flex', fontFamily: "'montserrat', sans-serif",   alignItems: 'center', marginTop: '-20px' }}>
                 
                  <div style={{marginTop: '20px'}}>
                    {question.score === 2 ? (
                      <SquareCheck size={30} color="#00d12a" />
                    ) : question.score === 1 ? (
                      <SquareSlash size={30} color="#F5A200" />
                    ) : (
                      <SquareX size={30} color="#FF0000" />
                    )}
                  </div>
                  <div style={{ width: '100%', backgroundColor: 'white', marginTop: '10px', fontWeight: '600',   lineHeight: '1.2',fontSize: '16px', textAlign: 'left', border: '0px solid lightgrey', position: 'relative', display: 'flex', flexDirection: 'column', marginLeft: '20px' }}>
                  <ResponsiveText
        text={question.question}
        maxFontSize={20} 
        minFontSize={14} 
    />  </div>
                  <button onClick={() => flagForReview(index)} style={{
             marginLeft: '20px',
                      borderRadius: '7px',
                      height: '50px',
                      width: '50px',

                      border: 'none',
                      backgroundColor: 'rgb(255,255,255)',
                      backdropFilter: 'blur(5px)',
                      cursor: 'pointer',
                      marginTop: '20px',
                      borderWidth: '5px',
                    }}>
                      {flaggedIndexes[index] ? <Flag size={30} strokeWidth={2}  color="#002aff" /> : <Flag size={30} color="lightgrey" strokeWidth={2} />}
                    </button>
                    </div>




                <div style={{ marginTop: '0px'}}>
                               
                                    
                                <div style={{
    flexGrow: 0, // Changed from 1 to 0 to prevent full width
    paddingLeft: '30px',
    paddingRight: '0px',
    marginLeft: '0px',
    position: 'relative',
    padding: '10px 40px 10px 10px',
    minWidth: '100px',
    maxWidth: 'fit-content', // Added to make it inline
    background: `${question.score === 2 ? '#CCFFC3' : question.score === 1 ? '#FFF5D2' : '#FFCDCD'}`,
    borderLeft: `4px solid ${question.score === 2 ? '#20BF00' : question.score === 1 ? '#F4C10A' : '#FF0000'}`, 
    color: `${question.score === 2 ? '#20BF00' : question.score === 1 ? '#E76F00' : '#FF0000'}`, 
    display: 'inline-flex', // Changed from flex to inline-flex
    alignItems: 'center',
}}>
    <p style={{
        fontSize: '16px',
        fontWeight: '600',
        textAlign: 'left',
        margin: 0,
        width: 'auto', // Changed from 100% to auto
        padding: '0px',
        whiteSpace: 'pre-wrap', // Added to preserve line breaks
        overflowWrap: 'break-word', // Added to handle long words
    }}>
        {question.studentResponse || "Not provided"}
    </p>
</div>
                                  
                  
                
             
       <div style={{
                                        width: `calc(100% - 40px)`,
                                        backgroundColor: 'white',
                                        position: 'relative',
                                        borderRadius: '20px',
                                        display: 'flex',
                                        marginTop: '20px',
                                        marginRight: '0px',
                                    }}>
                                      
                                            <MessageSquareMore size={25}  style={{position: 'absolute', left: '0px', top: '50%', transform: 'translatey(-50%)', color: 'grey'}}/>
                   
                    
                
                  <p style={{fontSize: '16px', color: 'grey', width: '100% ', marginLeft: '40px',
    
                                      fontStyle: 'italic',textAlign: 'left', }}>
                  {question.feedback || "Not provided"} 
                  </p>
                </div>
                </div>
       
              </li>
            );
          })}
        </ul>
      </div>
  );
}

export default StudentResults;
