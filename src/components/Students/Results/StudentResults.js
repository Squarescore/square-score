import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../Universal/firebase';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../Universal/Navbar';
import { useRef } from 'react';
import { SquareCheck, SquareX, SquareSlash, Flag, Square, User, MessageSquareMore } from 'lucide-react';
import Tooltip from './ToolTip';
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
        const gradeDocRef = doc(db, 'grades(saq)', `${assignmentId}_${studentUid}`);
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
          
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error('Error fetching results:', error);
      }
    };
  
    fetchResults();
    
  }, [assignmentId, studentUID]);

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

  const flagForReview = async (index) => {
    const updatedFlagged = !flaggedIndexes[index];
    setFlaggedIndexes(prev => ({
      ...prev,
      [index]: updatedFlagged
    }));
  
    const updatedQuestions = [...results.questions];
    updatedQuestions[index].flagged = updatedFlagged;
    const updatedData = { ...results, questions: updatedQuestions };
    const resultsRef = doc(db, 'grades(saq)', `${assignmentId}_${studentUid}`);
    await updateDoc(resultsRef, updatedData);
  
    setResults(updatedData);
  };
  const letterGrade = getLetterGrade(results.percentageScore);


  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fcfcfc' }}>
      <Navbar userType="student" />

             

        <div style={{
      position: 'fixed',
      height: isMapCollapsed ? '50px' : contentHeight,
      overflow: isMapCollapsed ? 'hidden' : 'auto',
      top: '200px',
      left: '40px',
      width: '80px',
      paddingBottom: isMapCollapsed ? '0px' : '30px',
      backgroundColor: 'white',
      boxShadow: '1px 1px 5px 1px rgb(0,0,155,.1)',
      borderRadius: '10px',
      transition: 'all 0.3s',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        display: 'flex',
        width: '50px',
        marginLeft: 'auto',
        marginRight: 'auto',
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
          {isMapCollapsed ? '+' : '-'}
        </button>
      </div>
      <div ref={contentRef} style={{ overflowY: 'auto', flex: 1 }}>
        {results.questions.map((question, index) => (
          <div
            key={index}
            onClick={() => scrollToQuestion(index)}
            style={{
              width: '50px',
              marginLeft: 'auto',
              marginRight: 'auto',
              alignItems: 'center',
              padding: '10px 5px',
              display: 'flex',
              borderTop: ' 2px solid #f4f4f4'
            }}
          >
            <span style={{ marginLeft: '0px', fontWeight: '700', marginRight: 'auto' }}>{index + 1}.</span>
            {question.score === results.scaleMax ? (
              <SquareCheck size={25} color="#00d12a" style={{ marginRight: '0px' }} />
            ) : question.score === results.scaleMin ? (
              <SquareX size={25} color="#FF0000" style={{ marginRight: '0px' }} />
            ) : (
              <SquareSlash size={25} color="#FFD13B" style={{ marginRight: '0px' }} />
            )}
          </div>
         ))}
                </div>
            </div>

            <div style={{  fontFamily: "'montserrat', sans-serif", backgroundColor: '#fcfcfc', width: '860px', zIndex: '100', alignItems: 'center', marginLeft: 'auto', marginRight: 'auto', marginTop: '100px'}}>
           
           
           
       
               
                  
                  



           <div style={{display: 'flex',  boxShadow: '1px 1px 5px 1px rgb(0,0,155,.1)',  background: 'white', paddingRight: '0px', width: '880px ', borderRadius: '15px', marginBottom: '20px', height: '200px', marginLeft: '-10px', marginTop: '100px' }}>
       <div style={{marginLeft: '30px', marginBottom: '40px'}}>
       <h1 style={{ fontSize: '40px', color: 'black', marginBottom: '0px',  marginLeft: '-5px',fontFamily: "'montserrat', sans-serif", textAlign: 'left',  }}>{assignmentName}</h1>
     
       <h1 style={{ fontSize: '30px', fontFamily: "'montserrat', sans-serif", textAlign: 'left', color: 'grey', fontWeight: '700',   }}> {studentName}
      </h1>
       <h1 style={{ fontSize: '20px', fontFamily: "'montserrat', sans-serif", textAlign: 'left',  color: 'grey', fontWeight: '500', marginTop: '-5px' }}> Submitted: {new Date(results.submittedAt.toDate()).toLocaleString()} </h1>
            
        
         
         

       </div>
       <div style={{width: '100px', marginLeft: 'auto', marginRight: '80px', marginTop: '-10px'}}>
           <div style={{ width: '110px', height: '110px', border: '15px solid #627BFF', borderRadius: '30px', background: '#020CFF', marginTop: '40px',  marginLeft: '10px' }}>
                       <div style={{ width: '85px', height: '85px', backgroundColor: 'white', borderRadius: '7px', margin: 'auto', marginTop: '14px', justifyContent: 'space-around', fontSize: '40px', alignItems: 'center', position: 'relative', fontFamily: "'montserrat', sans-serif" }}>
                           <h1 style={{ backgroundColor: 'transparent', borderRadius: '5px', marginTop: '11px', justifyContent: 'space-around', fontSize: '60px', alignItems: 'center', position: 'relative', fontFamily: "'montserrat', sans-serif", textAlign: 'center', lineHeight: '80px',  }}>{letterGrade}</h1>
                       </div>
                   </div>
                   </div>
           </div>
           <div style={{display: 'flex', width: '880px'}}>
               <div style={{width: '430px',  boxShadow: '1px 1px 5px 1px rgb(0,0,155,.1)', background: 'white', borderRadius: '15px', height: '135px',  padding: '0px 0px', marginLeft: '-10px'}}>
                   <h1 style={{  marginBottom: '-20px', marginTop:'15px', marginLeft: '30px', fontSize: '25px', }}> Point Distribution</h1>
                 <div style={{display: 'flex', justifyContent: 'space-around'}}> 
                   <div style={{ fontSize: '30px', fontWeight: 'bold', color: 'black', display: 'flex', alignItems: 'center',  justifyContent: 'space-around', marginLeft: '5px', width: '90px', marginTop: '50px' , }}>
                   
                       <div style={{width: '40px'}}>
                       <SquareCheck size={40} color="#00d12a" />
                       </div>
                       <h1 style={{ backgroundColor: 'white', borderRadius: '5px', margin: 'auto', marginLeft: '5px', marginTop: '0px', fontSize: '35px', alignItems: 'center', position: 'relative', fontFamily: "'montserrat', sans-serif" }}>{correctCount}</h1>
                
                   </div>
               
               
                   
                   <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'black', display: 'flex', alignItems: 'center',  justifyContent: 'space-around', marginLeft: '5px',  width: '90px' ,  marginTop: '50px'}}>
                   <div style={{width: '40px'}}>
                       <SquareSlash size={40} color="#FFD13B"  />
                       </div>
                       <h1 style={{backgroundColor: 'white', borderRadius: '5px', margin: 'auto', marginLeft: '5px', marginTop: '0px', fontSize: '35px', alignItems: 'center', position: 'relative', fontFamily: "'montserrat', sans-serif" }}>{partialCount}</h1>
                       
                   </div>
            
                   <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'black', display: 'flex', alignItems: 'center',  justifyContent: 'space-around', marginLeft: '5px',  width: '90px', marginTop: '50px' }}>
                     
                   <div style={{width: '40px'}}>
                         <SquareX size={40} color="#ff0000" />
                       </div>
                       <h1 style={{backgroundColor: 'white', borderRadius: '5px', margin: 'auto', marginLeft: '5px', marginTop: '0px', fontSize: '35px', alignItems: 'center', position: 'relative', fontFamily: "'montserrat', sans-serif" }}>{incorrectCount}</h1>
                   </div>
                   </div>
                   </div>


                   <div style={{width: '430px',  boxShadow: '1px 1px 5px 1px rgb(0,0,155,.1)', background: 'white',  borderRadius: '15px', height: '135px',  padding: '0px 0px', marginLeft: '20px' }}>
                   <h1 style={{  marginBottom: '-20px', marginTop:'15px', marginLeft: '30px', fontSize: '25px', }}>Grade</h1>
                   <div style={{display: 'flex', justifyContent: 'space-around', marginTop: '25px'}}> 
                   <p style={{fontSize: '25px', width: '20px',color: 'grey', padding: '5px 30px', background: '#f4f4f4', borderRadius: '5px', fontWeight: 'bold',  textAlign: 'center'}}>{letterGrade}</p>
                   <p style={{fontSize: '25px', width: '60px',color: 'grey', padding: '5px 25px', background: '#f4f4f4', borderRadius: '5px', fontWeight: 'bold',  textAlign: 'center'}}>   {results.percentageScore.toFixed(0)}%</p>
                   <p style={{fontSize: '25px', width: '90px',color: 'grey', padding: '5px 0px', background: '#f4f4f4', borderRadius: '5px', fontWeight: 'bold',  textAlign: 'center'}}>     {`${results.rawTotalScore}/${results.questions.length * results.scaleMax}`}</p>

                   </div>
              </div>
              
               </div>


         <div style={{position: 'fixed', bottom: '50px', height: '60px' , left: '-5px', width: '90px',  fontWeight: '600', paddingLeft: '10px', color: 'grey' , paddingTop: '10px', fontSize: '13px',}}>
       
         </div>
       

                 
               </div>





               
           <div style={{ width: '1200px', marginLeft: 'auto', marginTop: '10px', marginRight: 'auto', textAlign: 'center', backgroundColor: 'transparent', borderRadius: '15px' }}>
              
              


              
           </div>
        
             
              
           <div ref={containerRef} style={{ width: '100%', marginTop: '10px', 
                       
                       backgroundColor: 'rgb(255,255,255,.8)',
                       backdropFilter: 'blur(5px)',
               
               marginLeft: 'auto', marginRight: 'auto', textAlign: 'center',  borderRadius: '10px', position: 'relative' }}>
           
        <ul style={{ listStyle: 'none', padding: '0' , marginTop: '0px',  boxShadow: '1px 1px 5px 1px rgb(0,0,155,.1)', background: 'white', width: '880px',marginLeft: 'auto', marginRight: 'auto', borderRadius: '15px'}}>
        {results.questions && results.questions.map((question, index) => {
            const studentResponseLength = (question.studentResponse || "").length;
            const isShortResponse = studentResponseLength < 50;
            const studentResponseWidth = isShortResponse ? 280 : 380;
            const feedbackWidth = isShortResponse ? 540 : 440;
            
            return (
              <li key={index} 
              ref={el => questionRefs.current[index] = el} style={{ position: 'relative', fontFamily: "'montserrat', sans-serif", marginBottom: '20px', width: '840px', borderBottom: ' 2px solid #f4f4f4', padding: '20px 0px 30px 0px',marginLeft: 'auto', marginRight: 'auto',}}>
               <div style={{ display: 'flex', fontFamily: "'montserrat', sans-serif",   alignItems: 'center', marginTop: '-20px' }}>
                 
                  <div style={{marginTop: '20px'}}>
                    {question.score === 2 ? (
                      <SquareCheck size={60} color="#00d12a" />
                    ) : question.score === 1 ? (
                      <SquareSlash size={60} color="#F5A200" />
                    ) : (
                      <SquareX size={60} color="#FF0000" />
                    )}
                  </div>
                  <div style={{ width: '700px', backgroundColor: 'white', marginTop: '10px', fontWeight: 'bold',   lineHeight: '1.4',fontSize: '20px', textAlign: 'left', border: '0px solid lightgrey', position: 'relative', display: 'flex', flexDirection: 'column', marginLeft: '20px' }}>
                    {question.question}
                  </div>
                  <button onClick={() => flagForReview(index)} style={{
             marginLeft: '20px',
                      borderRadius: '7px',
                      height: '50px',
                      width: '50px',

                      borderColor: flaggedIndexes[index] ? 'rgb(65, 93, 242,.8)' : 'lightgrey',
                      borderStyle: 'solid',
                      backgroundColor: 'rgb(255,255,255)',
                      backdropFilter: 'blur(5px)',
                      cursor: 'pointer',
                      borderWidth: '5px',
                    }}>
                      {flaggedIndexes[index] ? <Flag size={30} strokeWidth={3}  color="#002aff" /> : <Flag size={30} color="#8c8c8c" strokeWidth={3} />}
                    </button>
                    </div>
                 <div style={{display: 'flex', marginTop: '20px'}}>
                 <div style={{
       width: `${studentResponseWidth}px`,
      backgroundColor: 'white',
      position: 'relative',
      borderRadius: '20px',
      display: 'flex',
      border: '4px solid #f4f4f4',
      marginRight: '20px',
    }}>
      <div style={{
        width: '50px',
        position: 'absolute',
        borderRadius: '15px 0px 0px 15px',
        left:'-4px',
        top: '-4px',
        bottom:'-4px',
                         background: `${question.score === 2 ? '#AEF2A3' : question.score === 1 ? '#FFDE67' : '#FFD3D3'}`,
                         border: `4px solid ${question.score === 2 ? '#20BF00' : question.score === 1 ? '#F4C10A' : '#FF0000'}`, 
                      color: `${question.score === 2 ? '#20BF00' : question.score === 1 ? '#E76F00' : '#FF0000'}`, 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}> 
                  
                      <User size={40} style={{}}/>
                      
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
                    minHeight: '100px', // Ensure a minimum height for short responses
                  }}>
                    <p style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      textAlign: 'left',
                      margin: 0, // Remove default margins
                      width: '88%', // Ensure the paragraph takes full width
                      padding: '0px', // Add some padding inside the border
                    }}>
                      {question.studentResponse || "Not provided"}
                    </p>
                  </div>
                </div>
                <div style={{
      width: `${feedbackWidth}px`,
      backgroundColor: 'white',
      position: 'relative',
      borderRadius: '20px',
      display: 'flex',
      border: '4px solid #f4f4f4',
      marginRight: '0px',
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
                      color: `grey`, 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}> 
                  
                      <MessageSquareMore size={40} style={{}}/>
                      </div>
       
                
                  <p style={{fontSize: '16px', color: 'lightgrey', fontStyle: 'italic',textAlign: 'left', marginLeft: '70px',   width: `${feedbackWidth}px`,  }}>
                  {question.feedback || "Not provided"}</p>
                </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default StudentResults;
