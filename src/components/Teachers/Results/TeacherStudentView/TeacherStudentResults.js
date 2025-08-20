import React, { useState, useEffect, useCallback, useRef  } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { arrayRemove, arrayUnion, deleteField, doc, getDoc, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../../Universal/firebase';
import Navbar from '../../../Universal/Navbar';
import Tooltip from './ToolTip';
import axios from 'axios';
import { SquareCheck, SquareX, SquareSlash, Square, User, MessageSquareMore, Plus, Minus, YoutubeIcon, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, Flag, ArrowLeft, ClipboardList, ClipboardMinus, Check, Slash, X, Clock, Rewind, History, Play, RepeatDot, Repeat } from 'lucide-react';
import ResponsiveText from './ResponsiveText';
import Loader from '../../../Universal/Loader';
import { GlassContainer } from '../../../../styles';
import ConfirmationModal from '../../../Universal/ConfirmationModal';

function TeacherStudentResults() {
    const { assignmentId, studentUid } = useParams();
    const [assignmentName, setAssignmentName] = useState('');
    const [results, setResults] = useState(null);
    const [studentName, setStudentName] = useState('');
    const [correctCount, setCorrectCount] = useState(0);
    const [contentHeight, setContentHeight] = useState('auto');
    const [partialCount, setPartialCount] = useState(0);
    const [incorrectCount, setIncorrectCount] = useState(0);
    const [isScrolled, setIsScrolled] = useState(false);
    const navigate = useNavigate();
    const [isRegrading, setIsRegrading] = useState(false);
    const [halfCredit, setHalfCredit] = useState(false);
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(null);
    const questionRefs = React.useRef([]);
    const [useSlider, setUseSlider] = useState(false);
    const [debouncedFeedback, setDebouncedFeedback] = useState({});
    const debouncedUpdateRef = useRef(null);
    const [classId, setClassId] = useState(null);
    const [feedbackStates, setFeedbackStates] = useState({});
    const textareaRefs = useRef({});
    const [isLoadingProgress, setIsLoadingProgress] = useState(false);
    const [progressData, setProgressData] = useState(null);
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [isReplacing, setIsReplacing] = useState(false);
    const [showRubric, setShowRubric] = useState({});
    const [showQuestionMap, setShowQuestionMap] = useState(false);
      const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [showRenewConfirm, setShowRenewConfirm] = useState(false);
  const [replaceHoldProgress, setReplaceHoldProgress] = useState(0);
  const [renewHoldProgress, setRenewHoldProgress] = useState(0);
  const replaceHoldTimerRef = useRef(null);
  const renewHoldTimerRef = useRef(null);

  const handleReplaceHoldStart = () => {
    if (replaceHoldTimerRef.current) {
      clearInterval(replaceHoldTimerRef.current);
    }
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / 3000) * 100, 100);
      setReplaceHoldProgress(progress);
      
      if (progress >= 100) {
        clearInterval(timer);
        handleReplaceSubmission();
        setShowReplaceConfirm(false);
      }
    }, 10);
    replaceHoldTimerRef.current = timer;
  };

  const handleReplaceHoldEnd = () => {
    if (replaceHoldTimerRef.current) {
      clearInterval(replaceHoldTimerRef.current);
      replaceHoldTimerRef.current = null;
    }
    setReplaceHoldProgress(0);
  };

  const handleRenewHoldStart = () => {
    if (renewHoldTimerRef.current) {
      clearInterval(renewHoldTimerRef.current);
    }
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / 3000) * 100, 100);
      setRenewHoldProgress(progress);
      
      if (progress >= 100) {
        clearInterval(timer);
        handleRenewAccess();
        setShowRenewConfirm(false);
      }
    }, 10);
    renewHoldTimerRef.current = timer;
  };

  const handleRenewHoldEnd = () => {
    if (renewHoldTimerRef.current) {
      clearInterval(renewHoldTimerRef.current);
      renewHoldTimerRef.current = null;
    }
    setRenewHoldProgress(0);
  };

  useEffect(() => {
    return () => {
      if (replaceHoldTimerRef.current) {
        clearInterval(replaceHoldTimerRef.current);
      }
      if (renewHoldTimerRef.current) {
        clearInterval(renewHoldTimerRef.current);
      }
    };
  }, []);

    // Set initial state based on question count
    useEffect(() => {
      if (results?.questions) {
        setShowQuestionMap(results.questions.length > 10);
      }
    }, [results]);

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



    const loadingModalStyle = {
      position: 'fixed',
      top: '100px',
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '20'
    };
    
    const loadingModalContentStyle = {
      width: 300,
      height: 180,
      backgroundColor: 'white',
      borderRadius: 10,
      textAlign: 'center',
      padding: 20,
      color: 'white',
      alignItems: 'center',
      justifyContent: 'center'
    };
    




    const handleViewLastSave = async () => {
      setIsLoadingProgress(true);
      try {
        // First fetch both progress and grade docs to ensure we have all needed data
        const progressRef = doc(db, 'assignments(progress)', `${assignmentId}_${studentUid}`);
        const progressDoc = await getDoc(progressRef);
        
        if (progressDoc.exists() && progressDoc.data().status === 'submitted') {
          setProgressData(progressDoc.data());
          setShowProgressModal(true);
          // Hide question map when showing progress
          if (showQuestionMap) {
            setShowQuestionMap(false);
          }
          // Scroll to top smoothly
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        } else {
          alert('No saved progress found');
        }
      } catch (error) {
        console.error('Error fetching progress data:', error);
        alert('Error fetching progress data');
      } finally {
        setIsLoadingProgress(false);
      }
    };
    const handleRenewAccess = async () => {
      try {
        if (!classId) {
          console.error('No classId available');
          return;
        }
    
        // References to all documents we need to modify
        const progressRef = doc(db, 'assignments(progress)', `${assignmentId}_${studentUid}`);
        const gradeRef = doc(db, 'grades', `${assignmentId}_${studentUid}`);
        const studentRef = doc(db, 'students', studentUid);
        
        // Start a batch write to ensure all operations are atomic
        const batch = writeBatch(db);
        
        // 1. Update progress doc status back to in_progress
        batch.update(progressRef, {
          status: 'in_progress',
          lastUpdated: serverTimestamp(),
          // Reset any submission-related fields
          submittedAt: null,
          replacedAt: null
        });
        
        // 2. Delete the grade document completely
        batch.delete(gradeRef);
        
        // 3. Update student's assignment statuses and remove ALL grade information
        const studentUpdates = {
          // Remove from completed assignments
          assignmentsTaken: arrayRemove(assignmentId),
          // Add to in-progress assignments
          assignmentsInProgress: arrayUnion(assignmentId),
          // Remove from paused assignments (if it was there)
          assignmentsPaused: arrayRemove(assignmentId),
          // Remove the grade information from the class-specific grades
          [`class_${classId}.grades.${assignmentId}`]: deleteField(),
          // Remove the grade information from the root-level grades map
          [`grades.${assignmentId}`]: deleteField()
        };
        
        batch.update(studentRef, studentUpdates);
        
        // Commit all changes atomically
        await batch.commit();
        
        // Close the modal before navigating
        setShowProgressModal(false);
        
        // Navigate back to the assignments page
        navigate(`/class/${classId}/assignment/${assignmentId}/TeacherResults`);
    
      } catch (error) {
        console.error('Error renewing access:', error);
        // Provide more specific error feedback to the user
        if (error.code === 'permission-denied') {
          alert('You do not have permission to renew access to this assignment.');
        } else if (error.code === 'not-found') {
          alert('The assignment or student record could not be found.');
        } else {
          alert('Error renewing access. Please try again or contact support if the problem persists.');
        }
      }
    };
    const handleReplaceSubmission = async () => {
      if (!progressData) return;
      setIsReplacing(true);
      
      try {
        // Start batch for atomic operations
        const batch = writeBatch(db);
        
        // References we'll need
        const gradeRef = doc(db, 'grades', `${assignmentId}_${studentUid}`);
        const progressRef = doc(db, 'assignments(progress)', `${assignmentId}_${studentUid}`);
        const studentRef = doc(db, 'students', studentUid);
    
        // Calculate scores based on progress data
        const totalQuestions = progressData.questions.length;
        const maxRawScore = totalQuestions * (progressData.scaleMax - progressData.scaleMin);
    
        // Create the initial grade document structure, following the pattern from handleSubmit
        const initialGradeData = {
          assignmentId,
          studentUid,
          assignmentName,
          firstName: progressData.firstName,
          lastName: progressData.lastName,
          classId,
          halfCreditEnabled: progressData.halfCredit,
          submittedAt: serverTimestamp(),
          questions: progressData.questions.map(q => ({
            questionId: q.questionId,
            question: q.text,
            studentResponse: q.studentResponse || '',
            rubric: q.rubric,
            feedback: 'Responses haven\'t been graded yet',
            score: 0,
            flagged: false
          })),
          viewable: false,
          rawTotalScore: 0,
          maxRawScore,
          scaledScore: 0,
          scaleMin: progressData.scaleMin || 0,
          scaleMax: progressData.scaleMax || 2,
          percentageScore: 0
        };
    
        // Delete old grade and set new one
        batch.delete(gradeRef);
        batch.set(gradeRef, initialGradeData);
    
        // Update progress doc status
        batch.update(progressRef, {
          status: 'submitted',
          submittedAt: serverTimestamp(),
          replacedAt: serverTimestamp()
        });
    
        // Initial update to student's grade reference
        batch.update(studentRef, {
          assignmentsTaken: arrayUnion(assignmentId),
          assignmentsInProgress: arrayRemove(assignmentId),
          assignmentsPaused: arrayRemove(assignmentId),
          [`class_${classId}.grades.${assignmentId}`]: {
            score: 0,
            submittedAt: serverTimestamp(),
            assignmentId,
            assignmentName
          }
        });
    
        // Commit initial changes
        await batch.commit();
    
        // Format questions for grading API, matching the format used in handleSubmit
        const questionsToGrade = progressData.questions.map(q => ({
          questionId: q.questionId,
          question: q.text,
          rubric: q.rubric,
          studentResponse: q.studentResponse || ''
        }));
    
        // Make grading request
        const response = await axios.post('https://us-central1-square-score-ai.cloudfunctions.net/GradeSAQ', {
          questions: questionsToGrade,
          halfCreditEnabled: progressData.halfCredit,
          classId: classId
        });
    
        if (response.status === 200) {
          const gradingResults = response.data;
          
          // Calculate scores following the same pattern as handleSubmit
          const newTotalScore = gradingResults.reduce((sum, grade) => sum + grade.score, 0);
          const newPercentageScore = (newTotalScore / maxRawScore) * 100;
    
          // Create the final graded questions array
          const gradedQuestions = progressData.questions.map((q, index) => ({
            questionId: q.questionId,
            question: q.text,
            studentResponse: q.studentResponse || '',
            rubric: q.rubric,
            feedback: gradingResults[index].feedback,
            score: gradingResults[index].score,
            flagged: false
          }));
    
          // Update the grade document with final results
          await updateDoc(gradeRef, {
            questions: gradedQuestions,
            rawTotalScore: newTotalScore,
            scaledScore: newTotalScore / maxRawScore,
            percentageScore: newPercentageScore,
            viewable: true,
            gradedAt: serverTimestamp()
          });
    
          // Update student's final grade
          await updateDoc(studentRef, {
            [`class_${classId}.grades.${assignmentId}`]: {
              score: newPercentageScore,
              submittedAt: serverTimestamp(),
              assignmentId,
              assignmentName
            }
          });
    
          setShowProgressModal(false);
          window.location.reload();
        }
      } catch (error) {
        console.error('Error replacing submission:', error);
        alert('Error replacing submission. Please try again.');
      } finally {
        setIsReplacing(false);
      }
    };
    const handleBackToSubmission = () => {
      // Simply close the modal to return to the current submission view
      setShowProgressModal(false);
    };



// Add to imports at the top

// Update the ProgressModal component
const ProgressModal = ({ onClose }) => {
  if (!progressData) return null;
  
  return (
  
      <div style={{
     position: 'absolute',
        width: 'calc(100% )',
        top: '130px',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'white',
        zIndex: '2',
     
        overflow: 'auto',
      }}>
     










        <div style={{ marginTop: '20px', }}>
          {progressData.questions.map((question, index) => (
            <div key={index} style={{ marginBottom: '40px', paddingBottom: '40px',
              paddingLeft: '4%', borderBottom: '1px solid #ededed', 
             }}>
              <div style={{ 
                fontWeight: '400',
                fontSize: '18px',
                  maxWidth: '90%',
                marginBottom: '10px',
                color: 'black'
              }}>
                {question.text}
              </div>
              <GlassContainer
                variant="grey"
                size={0}
                style={{
                  marginLeft: '0px',
                  marginTop: '10px',
                  zIndex: '1',
                  display: 'inline-block',
                  maxWidth: '90%'
                }}
                contentStyle={{
                  padding: '10px 20px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <p style={{
                  fontSize: '.9rem',
                  fontWeight: '500',
                  textAlign: 'left',
                  margin: 0,
                  width: 'auto',
                  padding: '0px',
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'break-word',
                  color: 'grey'
                }}>
                  {question.studentResponse || "Not provided"}
                </p>
              </GlassContainer>
            </div>
          ))}
      </div>
      </div>
   
  );
};



    const pendingUpdateRef = useRef(null);
    const getGradeColors = (grade) => {
      if (grade === undefined || grade === null || grade === 0) return { color: '#858585', variant: 'clear' };
      if (grade < 60) return { color: '#c63e3e', variant: 'red' };
      if (grade < 70) return { color: '#ff8800', variant: 'orange' };
      if (grade < 80) return { color: '#ffc300', variant: 'yellow' };
      if (grade < 90) return { color: '#29c60f', variant: 'green' };
      if (grade < 100) return { color: '#006400', variant: 'darkgreen' };
      return { color: '#f198ff', variant: 'pink' };
    };
    // Add cleanup effect
    useEffect(() => {
      // Cleanup function that runs before component unmounts or re-renders
      return () => {
        // If there's a pending update in the debounce timer, execute it immediately
        if (debouncedUpdateRef.current) {
          debouncedUpdateRef.current.flush();
        }
    
        // If there's a pending firestore update, execute it immediately
        if (pendingUpdateRef.current) {
          pendingUpdateRef.current();
        }
      };
    }, []);
    
    // Modify handleFeedbackChange to track pending updates
    const handleFeedbackChange = (index, newFeedback) => {
      // Update local state immediately
      setFeedbackStates(prev => ({
        ...prev,
        [index]: newFeedback
      }));
    
      // Cancel any existing debounced update
      if (debouncedUpdateRef.current) {
        debouncedUpdateRef.current.cancel();
      }
    
      // Create the update function
      const updateFunction = async () => {
        try {
          const updatedQuestions = results.questions.map((q, i) => 
            i === index ? { ...q, feedback: newFeedback } : q
          );
    
          const hasFlaggedQuestions = updatedQuestions.some(q => q.flagged);
    
          await updateDoc(doc(db, 'grades', `${assignmentId}_${studentUid}`), {
            questions: updatedQuestions,
            hasFlaggedQuestions
          });
    
          setResults(prev => ({
            ...prev,
            questions: updatedQuestions,
            hasFlaggedQuestions
          }));
    
          // Clear the pending update reference after successful update
          pendingUpdateRef.current = null;
        } catch (error) {
          console.error('Error updating feedback:', error);
        }
      };
    
      // Store the update function in the ref
      pendingUpdateRef.current = updateFunction;
    
      // Create a debounced version that clears the pending ref after execution
      debouncedUpdateRef.current = debounce(() => {
        updateFunction();
      }, 1000);
    
      // Execute the debounced update
      debouncedUpdateRef.current();
    };
    
    // Modify the debounce function to include a flush method
    const debounce = (func, wait) => {
        let timeout;
        let lastArgs;
        let lastThis;
      
        const debouncedFunction = (...args) => {
          lastArgs = args;
          lastThis = this;
      
          const later = () => {
            func.apply(lastThis, lastArgs);
            timeout = null;
            lastArgs = null;
            lastThis = null;
          };
      
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
        };
      
        debouncedFunction.cancel = () => {
          clearTimeout(timeout);
          timeout = null;
          lastArgs = null;
          lastThis = null;
        };
      
        debouncedFunction.flush = () => {
          if (timeout) {
            func.apply(lastThis, lastArgs);
            debouncedFunction.cancel();
          }
        };
      
        return debouncedFunction;
      };
      
      // Update the cleanup effect
      useEffect(() => {
        return () => {
          // Safely check if the debounced update ref exists and has a flush method
          if (debouncedUpdateRef.current?.flush) {
            debouncedUpdateRef.current.flush();
          }
      
          // If there's a pending update, execute it immediately
          if (pendingUpdateRef.current) {
            pendingUpdateRef.current();
          }
        };
      }, []);
      
      // Update how we create the debounced update reference
      useEffect(() => {
        const debouncedUpdate = debounce((index, newScore, newFeedback) => {
          updateGradeAndFeedback(index, newScore, newFeedback);
        }, 1000);
      
        debouncedUpdateRef.current = debouncedUpdate;
      
        return () => {
          if (debouncedUpdateRef.current?.cancel) {
            debouncedUpdateRef.current.cancel();
          }
        };
      }, []);



    const scrollToQuestion = (index) => {
        setActiveQuestionIndex(index);
        questionRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const handleQuestionClick = (questionId) => {
        navigate(`/class/${classId}/assignment/${assignmentId}/TeacherResults/`, {
          state: {
            targetTab: 'questionBank',
            targetQuestionId: questionId,
            openQuestionResults: true
          }
        });
      };

    const contentRef = useRef(null);


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

    // Debounce Feedback Updates
    useEffect(() => {
        debouncedUpdateRef.current = debounce((index, newScore, newFeedback) => {
            updateGradeAndFeedback(index, newScore, newFeedback);
        }, 5000);

        // Cleanup function
        return () => {
            if (debouncedUpdateRef.current) {
                debouncedUpdateRef.current.cancel();
            }
        };
    }, []);

    useEffect(() => {
        // Initialize feedback states from results
        if (results?.questions) {
          const initialFeedback = {};
          results.questions.forEach((question, index) => {
            initialFeedback[index] = question.feedback || '';
          });
          setFeedbackStates(initialFeedback);
        }
      }, [results]);

    // Initialize feedback states and set initial heights
    useEffect(() => {
        if (results?.questions) {
          const initialFeedback = {};
          results.questions.forEach((question, index) => {
            initialFeedback[index] = question.feedback || '';
          });
          setFeedbackStates(initialFeedback);
      
          // Set initial heights after a short delay to ensure content is rendered
          setTimeout(() => {
            results.questions.forEach((_, index) => {
              const textarea = textareaRefs.current[index];
              if (textarea) {
                textarea.style.height = '24px'; // Set to one line initially
                textarea.style.height = textarea.value ? `${textarea.scrollHeight}px` : '24px';
              }
            });
          }, 0);
        }
      }, [results]);


    // Fetch Results on Component Mount
    useEffect(() => {
        const fetchResults = async () => {
            try {
                const gradeDocRef = doc(db, 'grades', `${assignmentId}_${studentUid}`);
                const gradeDoc = await getDoc(gradeDocRef);
    
                if (gradeDoc.exists()) {
                    const data = gradeDoc.data();
                    setResults(data);
                    setAssignmentName(data.assignmentName);
                    
                    setClassId(data.classId);
                    const correct = data.questions.filter(q => q.score === data.scaleMax).length;
                    const partial = data.questions.filter(q => q.score > data.scaleMin && q.score < data.scaleMax).length;
                    const incorrect = data.questions.filter(q => q.score === data.scaleMin).length;
                    
                    setCorrectCount(correct);
                    setPartialCount(partial);
                    setIncorrectCount(incorrect);
                    
                    const studentDocRef = doc(db, 'students', studentUid);
                    const studentDoc = await getDoc(studentDocRef);
                    
                    if (studentDoc.exists()) {
                        const studentData = studentDoc.data();
                        setStudentName(`${studentData.firstName} ${studentData.lastName}`);
                        console.log("Student Name:", `${studentData.firstName} ${studentData.lastName}`); // Added log statement
                    } else {
                        console.log("Student document does not exist");
                    }
                }
            } catch (error) {
                console.error('Error fetching results:', error);
            }
        };
    
        fetchResults();
    }, [assignmentId, studentUid]);

    // Handle Regrading Assignment
    const handleRegrade = async () => {
      if (window.confirm("Are you sure you want to regrade this assignment? This will replace the current grades.")) {
          setIsRegrading(true);
          try {
              const questionsToGrade = results.questions.map(q => ({
                  question: q.question,
                  rubric: q.rubric,
                  studentResponse: q.studentResponse
              }));
  
              const response = await axios.post('https://us-central1-square-score-ai.cloudfunctions.net/GradeSAQ', {
                  questions: questionsToGrade,
                  halfCreditEnabled: halfCredit,
                  classId: classId
              });
  
              if (response.status === 200) {
                  const newGrades = response.data;
                  const newTotalScore = newGrades.reduce((sum, grade) => sum + grade.score, 0);
                  const maxRawScore = results.questions.length * (results.scaleMax - results.scaleMin);
                  const newPercentageScore = (newTotalScore / maxRawScore) * 100;
  
                  const updatedQuestions = results.questions.map((q, index) => ({
                      ...q,
                      score: newGrades[index].score,
                      feedback: newGrades[index].feedback,
                      flagged: false
                  }));
  
                  const hasFlaggedQuestions = updatedQuestions.some(q => q.flagged);
  
                  // Start batch write for atomic operations
                  const batch = writeBatch(db);
                  const gradeRef = doc(db, 'grades', `${assignmentId}_${studentUid}`);
                  const studentRef = doc(db, 'students', studentUid);
  
                  // Update grade document
                  batch.update(gradeRef, {
                      questions: updatedQuestions,
                      rawTotalScore: newTotalScore,
                      percentageScore: newPercentageScore,
                      scaledScore: newTotalScore / maxRawScore,
                      hasFlaggedQuestions,
                      halfCreditEnabled: halfCredit,
                      gradedAt: serverTimestamp()
                  });
  
                  // Update student's grade in class grades
                  batch.update(studentRef, {
                      [`class_${classId}.grades.${assignmentId}`]: {
                          score: newPercentageScore,
                          submittedAt: results.submittedAt,
                          assignmentId,
                          assignmentName
                      }
                  });
  
                  await batch.commit();
  
                  // Update local state
                  setResults(prevResults => ({
                      ...prevResults,
                      questions: updatedQuestions,
                      rawTotalScore: newTotalScore,
                      percentageScore: newPercentageScore,
                      scaledScore: newTotalScore / maxRawScore,
                      hasFlaggedQuestions,
                      halfCreditEnabled: halfCredit
                  }));
  
                  // Update counts
                  const newCorrectCount = updatedQuestions.filter(q => q.score === results.scaleMax).length;
                  const newPartialCount = halfCredit ? updatedQuestions.filter(q => q.score > results.scaleMin && q.score < results.scaleMax).length : 0;
                  const newIncorrectCount = updatedQuestions.filter(q => q.score === results.scaleMin).length;
                  
                  setCorrectCount(newCorrectCount);
                  setPartialCount(newPartialCount);
                  setIncorrectCount(newIncorrectCount);
  
                  alert("Assignment regraded successfully!");
              }
          } catch (error) {
              console.error("Error regrading assignment:", error);
              alert("An error occurred while regrading the assignment. Please try again.");
          } finally {
              setIsRegrading(false);
          }
      }
  };
    const updateCounts = (questions) => {
      const correct = questions.filter(q => q.score === results.scaleMax).length;
      const partial = questions.filter(q => q.score > results.scaleMin && q.score < results.scaleMax).length;
      const incorrect = questions.filter(q => q.score === results.scaleMin).length;
      
      setCorrectCount(correct);
      setPartialCount(partial);
      setIncorrectCount(incorrect);
    };
    // Function to update a student's grade and feedback
    const updateGradeAndFeedback = async (index, newScore, feedback) => {
      if (!results) return;
    
      try {
        const updatedQuestions = [...results.questions];
        updatedQuestions[index] = {
          ...updatedQuestions[index],
          score: Math.max(results.scaleMin, Math.min(results.scaleMax, newScore)),
          feedback: feedback
        };
    
        const newRawTotal = updatedQuestions.reduce((sum, q) => sum + q.score, 0);
        const maxScore = results.rawMaxScore || (updatedQuestions.length * 2);
        const newPercentageScore = (newRawTotal / maxScore) * 100;
        const newScaledScore = (newRawTotal / maxScore);
        const hasFlaggedQuestions = updatedQuestions.some(q => q.flagged);
    
        const batch = writeBatch(db);
        const gradeRef = doc(db, 'grades', `${assignmentId}_${studentUid}`);
        const studentRef = doc(db, 'students', studentUid);
    
        // Update grade document
        batch.update(gradeRef, {
          questions: updatedQuestions,
          rawTotalScore: newRawTotal,
          percentageScore: newPercentageScore,
          scaledScore: newScaledScore,
          hasFlaggedQuestions
        });
    
        // Update student's class grades
        batch.update(studentRef, {
          [`class_${classId}.grades.${assignmentId}`]: {
            score: newPercentageScore,
            submittedAt: results.submittedAt,
            assignmentId,
            assignmentName,
          }
        });
    
        await batch.commit();
    
        // Update local state
        setResults({
          ...results,
          questions: updatedQuestions,
          rawTotalScore: newRawTotal,
          percentageScore: newPercentageScore,
          scaledScore: newScaledScore,
          hasFlaggedQuestions
        });
    
        // Update counts
        updateCounts(updatedQuestions);
    
      } catch (error) {
        console.error('Error updating grade and feedback:', error);
      }
    };

    // Toggle flag status for a specific question
    const toggleFlag = async (index) => {
        if (!results) return;

        const updatedQuestions = [...results.questions];
        updatedQuestions[index].flagged = !updatedQuestions[index].flagged;

        // Determine if any questions are still flagged
        const hasFlaggedQuestions = updatedQuestions.some(q => q.flagged);

        try {
            await updateDoc(doc(db, 'grades', `${assignmentId}_${studentUid}`), {
                questions: updatedQuestions,
                hasFlaggedQuestions: hasFlaggedQuestions // Update flag status
            });

            setResults({
                ...results,
                questions: updatedQuestions,
                hasFlaggedQuestions: hasFlaggedQuestions
            });
        } catch (error) {
            console.error('Error toggling flag:', error);
        }
    };

    // Handle navigation clicks
    const handleGradeClick = (studentUid) => {
        navigate(`/teacherStudentResults/${assignmentId}/${studentUid}`);
    };
    const handleStudentClick = (studentUid) => {
        navigate(`/class/${classId}/student/${studentUid}/grades`);
    };
    const handleAssignmentClick = () => {
        navigate(`/class/${classId}/assignment/${assignmentId}/TeacherResults`);
    };

    // Determine letter grade based on percentage
    const getLetterGrade = (percentage) => {
        if (percentage >= 90) return 'A';
        if (percentage >= 80) return 'B';
        if (percentage >= 70) return 'C';
        if (percentage >= 60) return 'D';
        return 'F';
    };

    // Render Loading State
    if (!results) {
        return <div>Loading...</div>;
    }
    const letterGrade = getLetterGrade(results.percentageScore);

    return (
        <div style={{   minHeight: '100vh',
            width: 'calc(100% - 200px)',
            marginLeft:'200px',
            backgroundColor: 'white',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative' }}>
<Navbar 
  userType="teacher"
  navItems={[
    {
      type: 'assignmentName',
      id: assignmentId,
      label: assignmentName,
      onClick: () => navigate(`/class/${classId}/assignment/${assignmentId}/TeacherResults`)
    },
    {
      type: 'studentGrades',
      id: studentUid,
      label: studentName
    }
  ]}
  classId={classId}
/>


{(isRegrading || isReplacing) && (
  <div style={loadingModalStyle}>
    <div style={loadingModalContentStyle}>
      <p style={{ 
        fontSize: '20px', 
        fontFamily: "'montserrat', sans-serif", 
        fontWeight: '500', 
        justifyContent: 'center',
        position: 'absolute', 
        color: 'black', 
        top: '45%', 
        left: '50%', 
        transform: 'translate(-50%, -45%)', 
        marginBottom: '0px' 
      }}>
        {isRegrading ? 'Regrading Assignment' : 'Replacing Submission'}
      </p>
      <Loader/>
    
    </div>
  </div>
)}


            <div style={{  
              fontFamily: "'montserrat', sans-serif", 
              backgroundColor: 'rgb(255,255,255,.9)', 
              backdropFilter: 'blur(5px)',
              width: '100%', 
              zIndex: '30', 
              alignItems: 'center', 
              marginLeft: 'auto', 
              marginRight: 'auto', 
              marginTop: '0px',
              position: 'sticky',
              top: '0',
              borderBottom: isScrolled ? '1px solid #ddd' : 'none',
              paddingBottom: '10px'
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

    <h1
                                   onClick={() => navigate(`/class/${classId}/student/${studentUid}/grades`)}
                           
                                    style={{
                                        fontSize: '1.3rem',
                                        color: 'black',
                                        cursor: 'pointer',
                                        fontFamily: "'montserrat', sans-serif",
                                        textAlign: 'left',
                                        fontWeight: '400'
                                    }}
                                    onMouseEnter={(e) => { e.target.style.textDecoration = 'underline'; }}
                                    onMouseLeave={(e) => { e.target.style.textDecoration = 'none'; }}
                                >
                                    {studentName} 
                                </h1>

<div style={{
                        marginLeft: '20px',}}>
                                <GlassContainer
                    variant={getGradeColors(results.percentageScore).variant}
                    size={0}
                    style={{
                        zIndex: '1'
                    }}
                    contentStyle={{
                        padding: '2px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                                        <div style={{display: 'flex', gap: '10px', padding: '2px 5px', marginTop: '-2px', paddingBottom: '4px', alignItems: 'center'}}>
                      <span style={{
                         fontSize: '1rem',
                         height: '1rem',
                          color: getGradeColors(results.percentageScore).color,
                          fontWeight: '500'
                      }}>
                          {letterGrade}
                      </span>
                    
                         
                      <span style={{
                        borderLeft: ' 2px solid ',
                        borderColor: getGradeColors(results.percentageScore).color,
                        fontSize: '1rem',
                        paddingLeft: ' 10px',
                        lineHeight: '.9',
                        marginTop: '4px',
                        height: '.8rem',
                        color: getGradeColors(results.percentageScore).color,
                        fontWeight: '500'
                      }}>
                        {results.percentageScore.toFixed(0)}%
                      </span>

                                            <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!showProgressModal) {
                              setShowQuestionMap(prev => !prev);
                            }
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: showProgressModal ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0',
                            marginTop: '3px',
                            marginLeft: '0px',
                            color: showProgressModal ? '#9ca3af' : getGradeColors(results.percentageScore).color,
                            opacity: showProgressModal ? 0.5 : 1,
                          }}
                      >
                        {showQuestionMap ? 
                          <ChevronUp size={16} /> : 
                          <ChevronDown size={16} />
                        }
                      </button>
                     </div>
                </GlassContainer>
                </div>       

        
        

                <div 
                style={{marginLeft: 'auto', display: 'flex',
                  alignItems: 'center',}}>
                <h1 
                    onClick={() => navigate(`/class/${classId}/assignment/${assignmentId}/TeacherResults`)}
                    style={{
                        fontSize: '.9rem', 
                        color: 'grey', 
                        marginLeft: 'auto',
                        marginTop: '4px', 
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => { e.target.style.color = '#020CFF'; }}
                    onMouseLeave={(e) => { e.target.style.color = 'grey'; }}
                >
                    {assignmentName} 
                    <span style={{
                        fontSize: '.9rem', 
                        fontWeight: '600', 
                        color: '#38BFB8',
                        marginTop: '4px', 
                        marginLeft: '5px' 
                    }}>OE</span>
                </h1>
                <div style={{height: '20px', width: '1px', background: '#EDEDED ', margin: '3px 10px'}}/>
                   
                <h1 style={{fontSize: '12px', color: 'grey', 
                    marginTop: '4px', fontWeight: '400'}}>
                    {new Date(results.submittedAt.toDate()).toLocaleString()}
                </h1>
                
                <div style={{ display: 'flex', gap: '10px', marginLeft: '20px',
                      alignItems: 'center',  }}>
                  {!showProgressModal && (<button
                    onClick={handleViewLastSave}
                    style={{
                      backgroundColor: 'white',
                      color: 'grey',
                      border: '1px solid #ddd',
                      borderRadius: '100px',
                      display: 'flex',
                      height: '30px',
                      padding: '0 12px',
                      fontSize: '.9rem',
                      cursor: 'pointer',
                      alignItems: 'center',
                      fontFamily: "'montserrat', sans-serif",
                    }}
                  >
                    <History size={14} style={{ marginRight: '8px', marginTop: '1px' }}/>
                    <p style={{ fontSize: '.8rem', fontWeight: '500', margin: 0 }}>
                      Last Saved Progress
                    </p>
                  </button>)}

                  <button
                    onClick={() => setShowRenewConfirm(true)}
                    disabled={isRegrading || isReplacing}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 12px',   backgroundColor: 'white',
                 color: 'grey',
                 height: '30px',
                 border: '1px solid #ddd',
                      borderRadius: '100px',
                      cursor: isRegrading || isReplacing ? 'not-allowed' : 'pointer',
                      fontFamily: "'montserrat', sans-serif",
                      fontWeight: '500',
                      fontSize: '.8rem',
                      opacity: isRegrading || isReplacing ? 0.7 : 1,
              
                    }}
                  >
                    <Play size={14} style={{ marginRight: '8px', marginTop: '1px' }}/>
                    Renew Access
                  </button>
                </div>
                </div>

            </div>





                    </div>
     <div style={{
     marginLeft: 'calc(4% )', 
     width: '92%', 
     display: 'flex', 
     overflow: 'hidden', 
     marginTop: '-40px',
     position: 'relative'
   }}>
     {showQuestionMap && results.questions.map((question, index) => (
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
              <Check size={20} color="#00d12a" style={{ marginRight: '0px',
                cursor: 'pointer', }} />
            ) : question.score === results.scaleMin ? (
              <X size={20} color="#FF0000" style={{ marginRight: '0px' ,
                cursor: 'pointer',}} />
            ) : (
              <Slash size={10} color="#FF8800" 
              strokeWidth={5}
              style={{ marginRight: '0px',
                marginTop: '3px',
                cursor: 'pointer', }} />
                         )}
           </div>
          ))}


          
  {showProgressModal && (
   
    <div style={{ display: 'flex',  marginTop: '-6px',  width: '100%'}}>
      <h2 style={{ fontWeight: '400', fontSize: '.9rem', marginTop: '14px', color: 'grey' }}>Last Saved Progress</h2>
          <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
        

            <button
              onClick={() => setShowReplaceConfirm(true)}
              disabled={isRegrading || isReplacing}
              style={{  padding: '5px 16px',
                height: '30px',
                marginTop: '8px', 
               backgroundColor: 'white',
                 color: 'grey',
                 border: '1px solid #ddd',
                 fontSize: '.8rem',
                borderRadius: '50px',
                cursor: isRegrading || isReplacing ? 'not-allowed' : 'pointer',
                fontFamily: "'montserrat', sans-serif",
                fontWeight: '500',
                alignItems: 'center',
                opacity: isRegrading || isReplacing ? 0.7 : 1
              }}
            >

                             <Repeat size={14} style={{ marginRight: '8px', marginTop: '1px' }}/>
               Replace Submission
              </button>
      <button
               onClick={() => setShowProgressModal(false)}
               disabled={isRegrading || isReplacing}
               style={{
                 padding: '5px 16px',
                 backgroundColor: 'white',
                 color: 'grey',
                 height: '30px',
                 marginTop: '8px',
                 border: '1px solid #ddd',
                 borderRadius: '100px',
                 cursor: isRegrading || isReplacing ? 'not-allowed' : 'pointer',
                 fontFamily: "'montserrat', sans-serif",
                 fontWeight: '500',
                 opacity: isRegrading || isReplacing ? 0.7 : 1,
                 display: 'flex',
                 alignItems: 'center'
               }}
              >
                               Cancel
              </button>
            </div>
          </div>

         
  
                  
               )}
          
            </div>    
       


  
                    </div>
          
             



            
       

                 
              
              
       
                
              
                <ul style={{ listStyle: 'none', padding: '0', marginTop: '-20px', width: '100%', marginLeft: 'auto', marginRight: 'auto', borderRadius: '20px' }}>
                    {results.questions && results.questions.map((question, index) => {
                        const studentResponseLength = (question.studentResponse || "").length;
                        const isShortResponse = studentResponseLength < 50;
                        const studentResponseWidth = isShortResponse ? 280 : 380;
                        const feedbackWidth = isShortResponse ? 540 : 440;
                        
                        return (
                            <li key={index} 
                                ref={el => questionRefs.current[index] = el} 
                                style={{ position: 'relative', fontFamily: "'montserrat', sans-serif", marginBottom: '20px', background: 'white',
                                     width: '92%', padding: '0% 2%', margin: '20px 2%', borderBottom: ' 1px solid lightgrey',     paddingBottom:'35px',  }}>
                             <div style={{ display: 'flex', fontFamily: "'montserrat', sans-serif", alignItems: 'center' }}>
                      
        
        {/* Question Text */}
        <button
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    handleQuestionClick(question.questionId);
  }}
  style={{ 
    width: '100%', 
    backgroundColor: 'white', 
    lineHeight: '1.4', 
    fontSize: '1rem', 
    textAlign: 'left', 
    border: 'none', 
    position: 'relative', 
    display: 'flex', 
    flexDirection: 'column',
    fontWeight: '500', 
    cursor: 'pointer',
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
  <button
    onClick={() => toggleRubric(index)}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: 'none',
      border: 'none',
      color: '#9ca3af',
      cursor: 'pointer',
      fontSize: '14px',
      fontFamily: "'montserrat', sans-serif",
      padding: '4px 8px',
      marginRight: '15px'
    }}
  >
    
    {!showRubric[index] ? <ClipboardList size={20} strokeWidth={1.5} /> : <ClipboardMinus size={20} strokeWidth={1.5} />}
  </button>
  
        {/* Score Buttons and Flag Button */}
        <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginLeft: 'auto',
            gap: '10px' 
        }}>
            {/* Score 2 Button */}
            {question.score === 2 ? (
                <GlassContainer
                    variant="green"
                    size={0}
                    style={{
                        cursor: 'pointer',
                        zIndex: '1'
                    }}
                    contentStyle={{
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onClick={() => updateGradeAndFeedback(index, 2, question.feedback)}
                >
                    <Check size={16} color="#16a34a" />
                </GlassContainer>
            ) : (
                <button
                    onClick={() => updateGradeAndFeedback(index, 2, question.feedback)}
                    style={{
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.5
                    }}
                >
                    <Check size={16} color="#9ca3af" />
                </button>
            )}

            {/* Score 1 Button */}
            {question.score === 1 ? (
                <GlassContainer
                    variant="yellow"
                    size={0}
                    style={{
                        cursor: 'pointer',
                        zIndex: '1'
                    }}
                    contentStyle={{
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onClick={() => updateGradeAndFeedback(index, 1, question.feedback)}
                >
                    <Slash strokeWidth={4} size={10} color="#FF8800" />
                </GlassContainer>
            ) : (
                <button
                    onClick={() => updateGradeAndFeedback(index, 1, question.feedback)}
                    style={{
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.5
                    }}
                >
                    <Slash  strokeWidth={4} size={10}  color="#9ca3af" />
                </button>
            )}

            {/* Score 0 Button */}
            {question.score === 0 ? (
                <GlassContainer
                    variant="red"
                    size={0}
                    style={{
                        cursor: 'pointer',
                        zIndex: '1'
                    }}
                    contentStyle={{
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onClick={() => updateGradeAndFeedback(index, 0, question.feedback)}
                >
                    <X size={16} color="#dc2626" />
                </GlassContainer>
            ) : (
                <button
                    onClick={() => updateGradeAndFeedback(index, 0, question.feedback)}
                    style={{
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.5
                    }}
                >
                    <X size={16} color="#9ca3af" />
                </button>
            )}

            {/* Flag Button */}
            {question.flagged ? (
                <GlassContainer
                    variant="blue"
                    size={0}
                    style={{
                        cursor: 'pointer',
                        marginLeft: '10px',
                        zIndex: '1'
                    }}
                    contentStyle={{
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onClick={() => toggleFlag(index)}
                >
                    <Flag size={14} color="#020CFF" />
                </GlassContainer>
            ) : (
                <button
                    onClick={() => toggleFlag(index)}
                    style={{
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        marginLeft: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.5
                    }}
                >
                    <Flag size={14} color="#9ca3af" />
                </button>
            )}
        </div>
                                </div>
                                <div style={{ marginTop: '0px'}}>
                               
 
{showRubric[index] && (
    <div style={{
      marginTop: '-10px',
      padding: '15px',
      marginBottom: '10px',
      borderRadius: '8px',
      fontSize: '14px',
      color: '#495057',
      fontFamily: "'montserrat', sans-serif",
      maxWidth: '800px',
      
        alignItems: 'center',
        justifyContent: 'center',
      display: 'flex',
      gap: '15px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <ClipboardList size={34} strokeWidth={1} color="#495057" />
      </div>
      <div style={{
        width: '1px',
        backgroundColor: '#ddd',
        alignSelf: 'stretch'
      }} />
      <div style={{
        flex: 1,
        paddingTop: '7px',
        fontSize: '.9rem',
      }}>
        {question.rubric}
      </div>
    </div>
  )}   
                                    
                                <GlassContainer
    variant={question.score === 2 ? 'green' : question.score === 1 ? 'yellow' : 'red'}
    size={0}
    style={{
        marginLeft: '0px',
        marginTop: '10px',
        zIndex: '1',
        display: 'inline-block',
        maxWidth: '100%'
    }}
    contentStyle={{
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center'
    }}
>
    <p style={{
        fontSize: '1rem',
        fontWeight: '500',
        textAlign: 'left',
        margin: 0,
        width: 'auto',
        padding: '0px',
        whiteSpace: 'pre-wrap',
        overflowWrap: 'break-word',
        color: question.score === 2 ? '#16a34a' : question.score === 1 ? '#FF8800' : '#dc2626'
    }}>
        {question.studentResponse || "Not provided"}
    </p>
</GlassContainer>

                                 
<div
                    style={{
                      alignItems: 'center',
                      marginBottom: '10px',
                      fontWeight: '500',  color: 'lightgrey',
                      marginTop: '25px' ,
                    
    textAlign: 'left',
    width: '96%',
                      display: 'flex',
                    }}
                  >
                    <MessageSquareMore size={16} style={{ marginRight: '10px' }} />
                    <div
                      style={{
                        margin: 0,
                        fontWeight: '400',
                        display: 'flex', fontSize: '.9rem',
                        alignItems: 'center',color: 'lightgrey',
                      }}
                    >
                      Feedback
                
                    </div>
                  </div>
                  <textarea
  style={{
    fontSize: '.9rem',
    color: 'grey',
    textAlign: 'left',
    width: '100%',
    border: 'none',
    resize: 'none',
    overflow: 'hidden',
    fontFamily: "'montserrat', sans-serif",
    marginTop: '-5px',
    background: 'transparent',
    lineHeight: '1.5',
    minHeight: '24px' // This sets exactly one line height (16px * 1.5)
  }}
  value={feedbackStates[index] || ''}
  onChange={(e) => {
    e.target.style.height = '24px'; // Reset to one line
    e.target.style.height = `${e.target.scrollHeight}px`;
    handleFeedbackChange(index, e.target.value);
  }}
  placeholder="Enter feedback here..."
  onFocus={(e) => {
    e.target.style.height = '24px'; // Reset to one line
    e.target.style.height = `${e.target.scrollHeight}px`;
  }}
/>
                

              
                                </div>
                            </li>
                        );
                    })}
                </ul>
                <div style={{ 
      display: 'flex', 
      justifyContent: 'center',
      marginLeft: '-2%', 
      marginTop: '-35px' 
    }}>
      <div style={{ 
        marginBottom: '0px',  
        width: '100%',  

        height: '40px',  
        marginLeft: '30px', 
        display: 'flex', 
        alignItems: 'center', 
        padding: '20px 0px',
      }}>
            <label style={{ 
          display: 'flex',
          alignItems: 'center',
          fontFamily: "'montserrat', sans-serif", 
          marginRight: '10px', 
          padding: '8px 12px', 
          borderRadius: '5px', 
          color: 'grey',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          userSelect: 'none',
          marginLeft: 'auto',
        }}>
          <div style={{
            position: 'relative',
            display: 'inline-block',
            width: '18px',
            height: '18px',
            marginRight: '8px'
          }}>
            <input
              type="checkbox"
              checked={halfCredit}
              onChange={(e) => setHalfCredit(e.target.checked)}
              style={{
                position: 'absolute',
                opacity: 0,
                cursor: 'pointer',
                height: 0,
                width: 0
              }}
            />
            <span style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '18px',
              width: '18px',
              backgroundColor: halfCredit ? 'grey' : 'white',
              border: '1px solid #ddd',
              borderRadius: '20px',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {halfCredit && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  style={{
                    transform: 'scale(1.2)',
                  }}
                >
                  <path
                    d="M2 6L5 9L10 3"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
          </div>
          Half Credit
        </label>

        <button
          onClick={handleRegrade}
          disabled={isRegrading}
          style={{
            color: isRegrading ? 'lightgrey' : 'grey',
            padding: '8px 20px',
            background: 'transparent',
            fontSize: '18px',
            borderRadius: '50px',
            fontFamily: "'montserrat', sans-serif",
            fontWeight: '500',
            border: '1px solid #ddd',
            cursor: isRegrading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            opacity: isRegrading ? 0.7 : 1,
            marginLeft: '10px',
            marginRight: '4%'
          }}
        >
          {isRegrading ? 'Regrading...' : 'Regrade Assignment'}
        </button>
    
      </div>
    </div>{showProgressModal && (
  <ProgressModal
    onClose={() => setShowProgressModal(false)}
    progressData={progressData}
    handleRenewAccess={handleRenewAccess}
    handleReplaceSubmission={handleReplaceSubmission}
    handleBackToSubmission={handleBackToSubmission}
  />
)}
      {showReplaceConfirm && (
            <ConfirmationModal
              title={`Replace "${assignmentName}" Submission?`}
              message="This will replace the current submission with the last saved progress. The current submission will be permanently deleted."
                             onConfirm={handleReplaceSubmission}
               onCancel={() => setShowReplaceConfirm(false)}
               onHoldStart={handleReplaceHoldStart}
               onHoldEnd={handleReplaceHoldEnd}
               confirmText="Replace"
               confirmVariant="pink"
               confirmColor="#E01FFF"
               showHoldToConfirm={true}
               holdProgress={replaceHoldProgress}
               isLoading={isReplacing}
             />
          )}

          {showRenewConfirm && (
            <ConfirmationModal
              title={`Renew Access to "${assignmentName}"?`}
              message="This will allow the student to continue working on their last saved progress. The current submission will be permanently deleted."
                             onConfirm={handleRenewAccess}
               onCancel={() => setShowRenewConfirm(false)}
               onHoldStart={handleRenewHoldStart}
               onHoldEnd={handleRenewHoldEnd}
               confirmText="Renew Access"
               confirmVariant="blue"
               confirmColor="#00BBFF"
               showHoldToConfirm={true}
               holdProgress={renewHoldProgress}
               isLoading={isRegrading || isReplacing}
            />
          )}

        </div>
    );
}

export default TeacherStudentResults;