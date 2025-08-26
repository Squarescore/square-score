import React, { useState, useEffect, Component } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, Share, Home, PencilRuler } from 'lucide-react';
import Confetti from 'react-confetti';
import AnimationAll from '../../Universal/AnimationAll';
import { doc, getDoc, writeBatch, arrayUnion, serverTimestamp, deleteDoc, setDoc, updateDoc, arrayRemove, collection, query, where, getDocs } from 'firebase/firestore';
import { Settings, CalendarCog, SquareDashedMousePointer, Sparkles, GlobeLock, EyeOff, Landmark, Eye, User, SendHorizonal, Folder, SquareX, ChevronUp, ChevronDown, FileText, CircleHelp } from 'lucide-react';
import { db, auth } from '../../Universal/firebase';
import TeacherPreview from './PreviewSAQ';
import '../../Universal/SwitchGreen.css';
import SelectStudents from './SelectStudents';
import Navbar from '../../Universal/Navbar';
import CustomDateTimePicker from './CustomDateTimePicker';
import DateSettings, { formatDate } from './DateSettings';
import SecuritySettings from './SecuritySettings';
import SelectStudentsDW from './SelectStudentsDW';
import { v4 as uuidv4 } from 'uuid';
import { AssignmentActionButtons, usePublishState } from './AssignmentActionButtons';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import CustomExpandingFormatSelector from './ExpandingFormatSelector';
import { 
  AssignmentName, 
  FormatSection, 
  PreferencesSection, 
  QuestionCountSection, 
  TimerSection, 
  ToggleSwitch,
  GradingScale,
  DateSettingsElement,
  SecuritySettingsElement 
} from './Elements';
import { safeClassUpdate, safeTeacherDataUpdate } from '../../teacherDataHelpers';
import Stepper from './Stepper.jsx';
import StepPreviewCards from './StepPreviewCards';
import SourcePreviewToggle from './SourcePreviewToggle';
import { StepContainer } from './ContainerPost';
import LoaderScreen from './LoaderScreen';
import { useAuthState } from 'react-firebase-hooks/auth';
import { GlassContainer } from '../../../styles.js';
// Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CreateSAQ Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          marginTop: '50px'
        }}>
          <h2>Something went wrong.</h2>
          <p style={{ color: 'gray' }}>Please try refreshing the page or going back to the previous screen.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              marginTop: '20px',
              border: 'none',
              borderRadius: '5px',
              backgroundColor: '#4CAF50',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function CreateAssignment() {
  const [showPreview, setShowPreview] = useState(false);
  const [className, setClassName] = useState('');
  const [assignmentName, setAssignmentName] = useState('');
  const [timer, setTimer] = useState('10');
  const [halfCredit, setHalfCredit] = useState( true);
  const [saveAndExit, setSaveAndExit] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [lockdown, setLockdown] = useState(false);
  const location = useLocation();
  const [scaleMin, setScaleMin] = useState('0');
  const [scaleMax, setScaleMax] = useState('2');
  const [teacherId, setTeacherId] = useState(null);
  const [assignDate, setAssignDate] = useState(new Date());
  const [isHovered, setIsHovered] = useState(false);
  const [dueDate, setDueDate] = useState(new Date(new Date().getTime() + 48 * 60 * 60 * 1000)); // 48 hours from now
  const [timerOn, setTimerOn] = useState(false);
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [publishedAssignmentId, setPublishedAssignmentId] = useState(null);
  const [hasShownConfetti, setHasShownConfetti] = useState(false);

  const handleReturnHome = () => {
    navigate(`/class/${classId}`, {
      state: {
        successMessage: `Success: ${assignmentName} published`,
        assignmentId: publishedAssignmentId,
        format: 'OE'
      }
    });
  };

  const handleShare = () => {
    setShowExportModal(true);
  };

  const handleExportModalClose = () => {
    setShowExportModal(false);
  };
  
  const [assignmentType, setAssignmentType] = useState('');
  const [isAdaptive, setIsAdaptive] = useState(false);
  const [sourceOption, setSourceOption] = useState(null);
  const [sourceText, setSourceText] = useState('');
  const [questionBank, setQuestionBank] = useState('10');
  const [questionStudent, setQuestionStudent] = useState('5');
  const [additionalInstructions, setAdditionalInstructions] = useState(['']);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [questionsGenerated, setQuestionsGenerated] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [visitedSteps, setVisitedSteps] = useState([]);
  const [onViolation, setOnViolation] = useState('pause');
  
  const [draftId, setDraftId] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('OE');

  const [isSaving, setIsSaving] = useState(false);

    const periodStyles = {
    1: { variant: 'teal', color: "#1EC8bc", borderColor: "#83E2F5" },
    2: { variant: 'purple', color: "#8324e1", borderColor: "#cf9eff" },
    3: { variant: 'orange', color: "#ff8800", borderColor: "#f1ab5a" },
    4: { variant: 'yellow', color: "#ffc300", borderColor: "#Ecca5a" },
    5: { variant: 'green', color: "#29c60f", borderColor: "#aef2a3" },
    6: { variant: 'blue', color: "#1651d4", borderColor: "#b5ccff" },
    7: { variant: 'pink', color: "#d138e9", borderColor: "#f198ff" },
    8: { variant: 'red', color: "#c63e3e", borderColor: "#ffa3a3" }
  };



  useEffect(() => {
    if (location.state) {
      const { assignmentType, isAdaptive } = location.state;
      setAssignmentType(assignmentType);
      setIsAdaptive(isAdaptive);
    }
  }, [location.state]);
  useEffect(() => {
    // Whenever currentStep changes, add it to visitedSteps if not already present
    setVisitedSteps(prev => {
      if (!prev.includes(currentStep)) {
        return [...prev, currentStep];
      }
      return prev;
    });
  }, [currentStep]);

  const handlePrevious = () => {
    if (currentStep === 1) {
      navigate(-1);
    } else {
      setCurrentStep(prev => Math.max(prev - 1, 1));
    }
  };
  useEffect(() => {
    // Set due date to 48 hours after assign date whenever assign date changes
    setDueDate(new Date(assignDate.getTime() + 48 * 60 * 60 * 1000));
  }, [assignDate]);
  const { classId, assignmentId } = useParams(); // Get assignmentId from params
  const navigate = useNavigate();
  const handlePreviewToggle = () => {
    setShowPreview(!showPreview);
  };

  const nextStep = () => {
    if (currentStep === 3 && showPreview && generatedQuestions.length > 0) {
      alert('Please generate questions before proceeding to Preview.');
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };
  

  useEffect(() => {
    const fetchTeacherId = async () => {
      try {
        const classDocRef = doc(db, 'classes', classId);
        const classDoc = await getDoc(classDocRef);
        if (classDoc.exists) {
          const data = classDoc.data();
          if (data && data.name) {
            setClassName(data.name);
          }
        } else {
          console.error("Class not found:", classId);
        }
    
        // Get the current user's UID (teacher ID)
        const user = auth.currentUser;
        if (user) {
          setTeacherId(user.uid);
        } else {
          console.error("No authenticated user found");
        }

        // Check if we're loading from a draft
        if (assignmentId && assignmentId.startsWith('DRAFT')) {
          const draftIdWithoutPrefix = assignmentId.slice(5); // Remove 'DRAFT' prefix
          setDraftId(draftIdWithoutPrefix);
          await loadDraft(draftIdWithoutPrefix);
        }
      } catch (error) {
        console.error("Error in fetchTeacherId:", error);
      }
    };
    
    fetchTeacherId();
  }, [classId, assignmentId]);
  const loadDraft = async (draftId) => {
    console.log("Starting draft load process...", { draftId });
    
    try {
      const draftRef = doc(db, 'drafts', draftId);
      console.log("Fetching draft document...");
      const draftDoc = await getDoc(draftRef);
      
      if (!draftDoc.exists) {
        console.error("Draft not found:", draftId);
        return;
      }

      console.log("Draft document found");
      const data = draftDoc.data();
      console.log("Draft data retrieved:", {
        ...data,
        questions: data.questions ? `${Object.keys(data.questions).length} questions` : 'No questions',
        selectedStudents: data.selectedStudents ? `${data.selectedStudents.length} students` : 'No students'
      });
      
      // Basic assignment settings
      setAssignmentName(data.assignmentName || '');
      setTimer(data.timer?.toString() || '0');
      setTimerOn(data.timerOn || false);
      setHalfCredit(data.halfCredit ?? true);
      
      // Scale settings
      if (data.scale) {
        setScaleMin(data.scale.min?.toString() || '0');
        setScaleMax(data.scale.max?.toString() || '2');
      }
      
      // Date settings
      try {
        const loadedAssignDate = data.assignDate ? new Date(data.assignDate) : new Date();
        setAssignDate(loadedAssignDate);
        
        if (data.dueDate) {
          setDueDate(new Date(data.dueDate));
        } else {
          setDueDate(new Date(loadedAssignDate.getTime() + 48 * 60 * 60 * 1000));
        }
      } catch (error) {
        console.error("Error parsing dates:", error);
        setAssignDate(new Date());
        setDueDate(new Date(Date.now() + 48 * 60 * 60 * 1000));
      }
  
      // Student and security settings
      setSelectedStudents(new Set(data.selectedStudents || []));
      setSaveAndExit(data.saveAndExit ?? true);
      setLockdown(data.lockdown || false);
      setOnViolation(data.onViolation || 'pause');
      
      // Question settings
      setQuestionBank(data.questionBank?.toString() || '10');
      setQuestionStudent(data.questionStudent?.toString() || '5');
      setAssignmentType(data.assignmentType || 'OE');
      setIsAdaptive(data.isAdaptive || false);
      setAdditionalInstructions(data.additionalInstructions || '');
  
      // Handle questions
      console.log("Processing questions data...");
      if (data.questions) {
        console.log("Questions found in draft:", {
          type: Array.isArray(data.questions) ? 'array' : 'object',
          rawData: data.questions
        });
        
        let loadedQuestions;
        if (Array.isArray(data.questions)) {
          console.log("Processing questions array...");
          loadedQuestions = data.questions.map(q => ({
            questionId: q.questionId || uuidv4(),
            ...q
          }));
        } else {
          console.log("Processing questions object...");
          loadedQuestions = Object.entries(data.questions).map(([id, questionData]) => ({
            questionId: id,
            ...questionData
          }));
        }
        
        console.log("Questions processed:", {
          count: loadedQuestions.length,
          sample: loadedQuestions.length > 0 ? {
            firstQuestion: { ...loadedQuestions[0], question: loadedQuestions[0].question.substring(0, 50) + '...' }
          } : 'No questions'
        });
        
        if (loadedQuestions.length > 0) {
          console.log("Setting questions in state...");
          setGeneratedQuestions(loadedQuestions);
          setQuestionsGenerated(true);
          setSourceOption('text');
          setSourceText("Questions have already been generated. Click 'Preview Questions' to view or regenerate.");
        } else {
          console.log("No valid questions found, resetting state...");
          setGeneratedQuestions([]);
          setQuestionsGenerated(false);
          setSourceText(data.sourceText || '');
        }
      } else {
        console.log("No questions found in draft, resetting state...");
        setGeneratedQuestions([]);
        setQuestionsGenerated(false);
        setSourceText(data.sourceText || '');
      }
    } catch (error) {
      console.error("Error loading draft:", error);
      alert("There was an error loading the draft. Please try again.");
    }
  };
  
  useEffect(() => {
    if (location.state && location.state.questions) {
      setGeneratedQuestions(location.state.questions);
    }
  }, [location]);

  const { isPublishDisabled, publishDisabledConditions } = usePublishState(
    assignmentName, 
    generatedQuestions
  );
// In CreateAssignment.js
// Export Modal Component
const PublishSuccessScreen = ({ assignmentId, assignmentName, onShare, onReturnHome, assignDate, dueDate, hasShownConfetti, onConfettiComplete }) => {
  const formatDateString = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };
    return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(5px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '30px'
    }}>
      <div>
        {!hasShownConfetti && (
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            overflow: 'hidden'
          }}>
            <Confetti
              width={window.innerWidth}
              height={window.innerHeight}
              recycle={false}
              numberOfPieces={50}
              initialVelocityY={2}
              gravity={.15}
              confettiSource={{
                x: 0,
                y: 0,
                w: window.innerWidth,
                h: 0
              }}
                          tweenDuration={5000}
            onComplete={onConfettiComplete}
          />
          </div>
        )}
      </div>
      <div style={{zIndex: '20'}}>
        <GlassContainer variant="clear"
          contentStyle={{padding: '40px',}}>
          <div style={{
            textAlign: 'center',
            marginTop: '0px'
          }}>
            <h1 style={{
              fontSize: '2.2rem',
              fontWeight: '400',
              color: 'black',
              marginBottom: '15px',
              fontFamily: "'Montserrat', sans-serif",
              maxWidth: '380px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              margin: '0 auto 15px'
            }}>
              Published!
            </h1>
            <p style={{
              fontSize: '1rem',
              color: '#666',
              fontFamily: "'Montserrat', sans-serif",
              marginBottom: '30px',
              width: "380px",
            }}>
              Submissions will be open from {formatDateString(assignDate)} to {formatDateString(dueDate)}
            </p>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            alignItems: 'center'
          }}>
            <div style={{
              display: 'flex',
              gap: '15px',
              marginBottom: '5px'
          }}>
            <button
              onClick={onShare}
              style={{
                width: '150px',
                padding: '12px 20px',
                border: '1px solid #ddd',
                borderRadius: '50px',
                background: 'white',
                color: 'grey',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                fontFamily: "'Montserrat', sans-serif",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.borderColor = '#ccc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.borderColor = '#ddd';
              }}
            >
              <Share size={18} />
              Export
            </button>

            <button
              onClick={() => navigate(`/class/${classId}/teacherassignmenthome`)}
              style={{
                width: '220px',
                padding: '12px 20px',
                border: '1px solid #ddd',
                borderRadius: '50px',
                background: 'white',
                color: 'grey',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                fontFamily: "'Montserrat', sans-serif",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.borderColor = '#ccc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.borderColor = '#ddd';
              }}
            >
              <PencilRuler size={18} />
              Create Another 
            </button>
            </div>

            <button
              onClick={onReturnHome}
              style={{
                width: '380px',
                padding: '12px 20px',
                border: '1px solid #ddd',
                borderRadius: '50px',
                background: 'white',
                color: 'grey',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                fontFamily: "'Montserrat', sans-serif",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.borderColor = '#ccc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.borderColor = '#ddd';
              }}
            >
              <Home size={18} />
              Return to Class Home
            </button>
          </div>
        </GlassContainer>
      </div>
    </div>
  );
};

const ExportModal = ({ onClose, assignmentId, assignmentName }) => {
  const [user] = useAuthState(auth);
  const [teacherData, setTeacherData] = useState(null);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState([]);

  useEffect(() => {
    const fetchTeacherData = async () => {
      if (!user) return;

      try {
        const teacherRef = doc(db, 'teachers', user.uid);
        const teacherSnap = await getDoc(teacherRef);
        
        if (teacherSnap.exists()) {
          const teacherData = teacherSnap.data();
          
          const classesQuery = query(
            collection(db, 'classes'),
            where('teacherUID', '==', user.uid)
          );
          
          const classesSnap = await getDocs(classesQuery);
          const classes = [];
          
          classesSnap.forEach((doc) => {
            if (doc.id !== classId) { // Don't include current class
              classes.push({
                id: doc.id,
                ...doc.data()
              });
            }
          });
          
          setTeacherData({
            ...teacherData,
            classes: classes
          });
        }
      } catch (error) {
        console.error("Error fetching teacher data:", error);
      }
    };

    fetchTeacherData();
  }, [user]);

  const handleClassSelect = (classId) => {
    setSelectedClasses(prev => {
      if (prev.includes(classId)) {
        return prev.filter(id => id !== classId);
      } else {
        return [...prev, classId];
      }
    });
  };

  const handleExport = async () => {
    if (selectedClasses.length === 0) return;

    try {
      // Export to each selected class
      for (const classId of selectedClasses) {
        const batch = writeBatch(db);
        
        const assignmentRef = doc(db, 'assignments', assignmentId);
        const assignmentDoc = await getDoc(assignmentRef);
        
        if (!assignmentDoc.exists()) {
          console.error("Assignment not found");
          return;
        }

        const timestamp = Date.now();
        const assignmentData = assignmentDoc.data();
        const format = assignmentId.split('+').pop();
        const newDraftId = `${classId}+${timestamp}+${format}`;
        
        const draftRef = doc(db, 'drafts', newDraftId);
        const draftData = {
          ...assignmentData,
          classId: classId,
          selectedStudents: [],
          createdAt: serverTimestamp(),
          questions: assignmentData.questions || {},
        };
        delete draftData.id;
        
        batch.set(draftRef, draftData);

        const classRef = doc(db, 'classes', classId);
        batch.update(classRef, {
          drafts: arrayUnion({
            id: newDraftId,
            name: assignmentData.assignmentName || 'Untitled Assignment'
          })
        });
        
        await batch.commit();
      }

      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
        onClose();
      }, 1000);
    } catch (error) {
      console.error("Error during export:", error);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(5px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <GlassContainer
        variant="clear"
        size={2}
        style={{
          width: '620px',
          backgroundColor: 'white'
        }}
        contentStyle={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: '400',
            marginLeft: '10px',
            color: 'black',
            fontFamily: "'Montserrat', sans-serif"
          }}>
            Export Assessment
          </h2>
        </div>

        <h1 style={{
          fontWeight: '500', 
          fontSize: '.8rem', 
          marginLeft: '10px',
          marginBottom: '-10px',
          fontFamily: "'montserrat', sans-serif",
          color: 'lightgrey'
        }}>
          Click on Class to Share -
          The assessment will appear in drafts
        </h1>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '15px',
          padding: '10px'
        }}>
          {teacherData?.classes
            ?.sort((a, b) => (a.period || 0) - (b.period || 0))
            .map((classItem) => {
              const periodNumber = classItem.period || 1;
              const periodStyle = periodStyles[periodNumber] || { variant: 'clear', color: 'grey', borderColor: '#ddd' };
              
              return (
                <GlassContainer
                  key={classItem.id}
                  variant={selectedClasses.includes(classItem.id) ? periodStyle.variant : 'clear'}
                  size={1}
                  onClick={() => handleClassSelect(classItem.id)}
                  style={{
                    width: '180px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                  contentStyle={{
                    padding: '10px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <div style={{display: 'flex', alignItems: 'center'}}>
                    <h1 style={{
                      fontSize: '20px',
                      color: selectedClasses.includes(classItem.id) ? periodStyle.color : 'grey',
                      fontWeight: '500',
                      margin: 0,
                    }}>
                      Period {periodNumber}
                    </h1>
                  </div>

                  <div style={{
                    fontFamily: "'montserrat', sans-serif",
                    fontWeight: "500",
                    color: selectedClasses.includes(classItem.id) ? periodStyle.borderColor : '#ddd',
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize: '.7rem',
                    marginTop: '5px'
                  }}>
                    {classItem.classChoice}
                  </div>
                </GlassContainer>
              );
            })}
        </div>

        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'space-between',
        }}>
          <GlassContainer
            variant={selectedClasses.length > 0 ? 'green' : 'clear'}
            size={0}
            onClick={selectedClasses.length > 0 ? handleExport : undefined}
            style={{
              cursor: selectedClasses.length > 0 ? 'pointer' : 'default',
              opacity: selectedClasses.length > 0 ? 1 : 0.5,
            }}
            contentStyle={{
              padding: '5px 30px',
            }}
          >
            <span style={{
              color: selectedClasses.length > 0 ? '#2BB514' : 'grey',
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: "'montserrat', sans-serif"
            }}>
              Export to {selectedClasses.length === 1 ? '1 class' : `${selectedClasses.length} classes`}
            </span>
          </GlassContainer>

          <button
            onClick={onClose}
            style={{
              padding: '5px 30px',
              border: '1px solid #ddd',
              borderRadius: '81px',
              background: 'white',
              color: 'grey',
              cursor: 'pointer',
              fontFamily: "'montserrat', sans-serif",
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            Cancel
          </button>
        </div>
      </GlassContainer>

      {exportSuccess && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '15px'
          }}>
            <Check size={40} color="#2BB514" />
            <h2 style={{
              margin: 0,
              color: '#2BB514',
              fontSize: '1.5rem',
              fontWeight: '500',
              fontFamily: "'Montserrat', sans-serif"
            }}>
              Successfully Exported
            </h2>
          </div>
        </div>
      )}
    </div>
  );
};

const saveAssignment = async () => {
  if (isSaving) return;
  setIsSaving(true);

  try {
    const finalAssignmentId = assignmentId.startsWith('DRAFT') ? assignmentId.slice(5) : assignmentId;
    const batch = writeBatch(db);

    // Save assignment document
    const assignmentRef = doc(db, 'assignments', finalAssignmentId);
    batch.set(assignmentRef, {
      classId,
      format: 'OE',
      assignmentName,
      timer: timerOn ? Number(timer) : 0,
      halfCredit,
      assignDate: formatDate(assignDate),
      dueDate: formatDate(dueDate),
      scale: {
        min: scaleMin,
        max: scaleMax,
      },
      selectedStudents: Array.from(selectedStudents),
      questionCount: {
        bank: questionBank,
        student: questionStudent,
      },
      createdAt: serverTimestamp(),
      questions: generatedQuestions.reduce((acc, question) => {
        acc[question.questionId] = {
          question: question.question,
          rubric: question.rubric
        };
        return acc;
      }, {}),
      lockdown,
      onViolation: lockdown ? onViolation : null, 
      saveAndExit,
      isAdaptive,
      additionalInstructions,
    });

    // Update class document directly - add to assignments array
    const classRef = doc(db, 'classes', classId);
    batch.update(classRef, {
      assignments: arrayUnion({
        id: finalAssignmentId,
        name: assignmentName
      })
    });

    // If publishing from a draft, handle draft cleanup
    if (draftId) {
      // Remove from drafts array
      batch.update(classRef, {
        drafts: arrayRemove({
          id: draftId,
          name: assignmentName
        })
      });
      
      // Delete draft document
      const draftRef = doc(db, 'drafts', draftId);
      batch.delete(draftRef);
    }

    // Assign to selected students
    const selectedStudentIds = Array.from(selectedStudents);
    selectedStudentIds.forEach(studentUid => {
      const studentRef = doc(db, 'students', studentUid);
      batch.update(studentRef, {
        assignmentsToTake: arrayUnion(finalAssignmentId)
      });
    });

    // Commit all operations in a single batch
    await batch.commit();

    // Show success screen
    setPublishedAssignmentId(finalAssignmentId);
    setShowPublishSuccess(true);
    setHasShownConfetti(false); // Reset confetti state for new success
    setIsSaving(false);
  } catch (error) {
    console.error("Error saving assignment:", error);
    alert(`Error publishing assignment: ${error.message}. Please try again.`);
    setIsSaving(false);
  }
};

const saveDraft = async () => {
  if (isSaving) {
    console.log("Save draft cancelled - already saving");
    return;
  }
  
  console.log("Starting draft save process...");
  setIsSaving(true);
  
  try {
    const finalDraftId = assignmentId.startsWith('DRAFT') ? assignmentId.slice(5) : assignmentId;
    console.log("Draft ID:", finalDraftId);
    
    const batch = writeBatch(db);

    // Prepare draft data
    const draftData = {
      classId,
      assignmentName,
      timer: timerOn ? Number(timer) : 0,
      timerOn,
      halfCredit,
      assignDate: formatDate(assignDate),
      dueDate: formatDate(dueDate),
      scale: {
        min: scaleMin,
        max: scaleMax,
      },
      selectedStudents: Array.from(selectedStudents),
      saveAndExit,
      lockdown,
      onViolation: lockdown ? onViolation : null, 
      questionBank,
      questionStudent,
      createdAt: serverTimestamp(),
      isAdaptive,
      sourceText,
      additionalInstructions,
      questions: generatedQuestions.reduce((acc, question) => {
        acc[question.questionId] = {
          question: question.question,
          rubric: question.rubric
        };
        return acc;
      }, {}),
      format: 'OE'
    };

    console.log("Draft data prepared:", {
      ...draftData,
      questions: `${Object.keys(draftData.questions).length} questions`,
      selectedStudents: `${draftData.selectedStudents.length} students`
    });

    // Save draft document
    const draftRef = doc(db, 'drafts', finalDraftId);
    batch.set(draftRef, draftData);
    console.log("Draft document write prepared");

    // Update class document
    const classRef = doc(db, 'classes', classId);
    const draftEntry = {
      id: finalDraftId,
      name: assignmentName
    };
    batch.update(classRef, {
      drafts: arrayUnion(draftEntry)
    });
    console.log("Class update prepared:", draftEntry);

    // Commit batch
    console.log("Committing batch operation...");
    await batch.commit();
    console.log("Batch commit successful");

    console.log("Draft saved successfully, preparing for navigation");
    
    // Navigate using React Router
    navigate(`/class/${classId}/`, {
      state: {
        showDrafts: true,
        newDraftId: finalDraftId,
        format: 'OE',
        successMessage: `Draft saved: ${assignmentName}`
      }
    });
  } catch (error) {
    console.error("Error saving draft:", {
      error,
      message: error.message,
      stack: error.stack
    });
    alert(`Error saving draft: ${error.message}. Please try again.`);
  } finally {
    setIsSaving(false);
    console.log("Draft save process finished");
  }
};
  

    
const formatDate = (date) => {
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  };
  
  const formattedDate = date.toLocaleString('en-US', options);
  
  // Remove commas and adjust the format
  return formattedDate
    .replace(',', '') // Remove the comma after the day of week
    .replace(',', '') // Remove the comma after the day
    .replace(' at ', ' ') // Remove 'at'
    .replace(/(\d{1,2}):(\d{2}):00/, '$1:$2') // Remove seconds
    .replace(' PM', ' PM ') // Add space before timezone
    .replace(' AM', ' AM '); // Add space before timezone
};
const GenerateSAQ = async (sourceText, questionCount, additionalInstructions, classId) => {
  try {
    const response = await axios.post('https://us-central1-square-score-ai.cloudfunctions.net/GenerateSAQ', {
      sourceText: sourceText,
      questionCount: questionCount,
      additionalInstructions: additionalInstructions,
      classId: classId,
      teacherId: teacherId 
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status !== 200) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = response.data;
    console.log('API response data:', data);

    if (Array.isArray(data)) {
      const questionsWithIds = data.map(question => ({
        questionId: uuidv4(), // Generate UUID for each question
        ...question
      }));
      console.log('Generated questions:', questionsWithIds);
      setGeneratedQuestions(questionsWithIds);
      setQuestionsGenerated(true);
      return questionsWithIds;
    } else {
      console.error("Unexpected response format:", data);
      return [];
    }
  } catch (error) {
    console.error("Error calling generateQuestions function:", error);
    throw error;
  }
};

  const isFormValid = () => {
    return assignmentName !== '' && assignDate !== '' && dueDate !== '';
  };

  const handleGenerateClick = async () => {
    if (generatedQuestions.length > 0) {
      setCurrentStep(4);
    } else {
      setGenerating(true);
      try {
        const questions = await GenerateSAQ(sourceText, questionBank, additionalInstructions, classId, teacherId);
        setGeneratedQuestions(questions);
        setQuestionsGenerated(true);
        setCurrentStep(4);
      } catch (error) {
        console.error("Error generating questions:", error);
        // You might want to add error handling/user feedback here
      } finally {
        setGenerating(false);
      }
    }
  };


  
  const steps = [
    {
      name: 'Settings',
      backgroundColor: 'white',
      borderColor: 'white',
      textColor: 'black',
      condition: assignmentName.trim() !== '', // Example condition

    },
    {
      name: 'Select Students',
      
      backgroundColor: 'white',
      borderColor: 'white',
      textColor: 'black',
      condition: selectedStudents.size > -1,

    },
    {
      name: 'Generate Questions',
      
      backgroundColor: 'white',
      borderColor: 'white',
      condition: sourceText.trim() !== '',

      textColor: 'black'
    },
    {
      name: 'Preview',
      
      backgroundColor: 'white',
      borderColor: 'white',
      condition: true, // Always accessible
 
      textColor: 'black'
    }
  ];

  const StepContainerConfig = {
    settings: {
      width: '550px',
      titleWidth: '512px'
    },
    students: {
      width: '600px',
      titleWidth: '562px'
    },
    generate: {
      width: '710px',
      titleWidth: '672px'
    },
    preview: {
      width: '800px',
      titleWidth: '780px'
    }
  };


    const isStepCompleted = (stepNumber) => {
      const step = steps.find((s) => s.number === stepNumber);
      if (!step) return false;
      return step.condition;
    };
    const handleStepClick = (stepNumber) => {
      // Only allow navigation if the step is completed or it's the current step
      if (isStepCompleted(stepNumber - 1) || stepNumber === currentStep) {
        setCurrentStep(stepNumber);
      }
    };
    return (
      <div style={{    position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,    overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',}}>  
        <Navbar userType="teacher" />
                       {showPublishSuccess && (
                        <PublishSuccessScreen
                assignmentId={publishedAssignmentId}
                assignmentName={assignmentName}
                onShare={handleShare}
                onReturnHome={handleReturnHome}
                assignDate={assignDate}
                dueDate={dueDate}
                hasShownConfetti={hasShownConfetti}
                onConfettiComplete={() => setHasShownConfetti(true)}
              />
  )}
        {showExportModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1100 }}>
            <ExportModal
              assignmentId={publishedAssignmentId}
              assignmentName={assignmentName}
              onClose={() => setShowExportModal(false)}
            />
          </div>
        )}
   
        {isSaving && !showExportModal && !showPublishSuccess && <LoaderScreen />}





<div style={{marginTop: '100px'}}>
 
<div style={{marginTop: '100px', zIndex: '100'}}>
<Stepper
  currentStep={currentStep}
  setCurrentStep={setCurrentStep}
  steps={steps}
  isPreviewAccessible={questionsGenerated}
  visitedSteps={visitedSteps}
  onSaveDraft={saveDraft}
  onPublish={saveAssignment}
  isPublishDisabled={isPublishDisabled}
  classId={classId}
  selectedFormat={selectedFormat}
  onFormatChange={setSelectedFormat}
/>
</div>


{currentStep === 1 && (



<div style={{width: '900px',  height: '500px',marginLeft: 'auto', marginRight: 'auto', marginTop: '50px', position: 'relative'}}>



<StepPreviewCards
  currentStep={currentStep}
  canProgress={isFormValid()}
  onNextStep={nextStep}
  onPrevStep={handlePrevious}
  assignmentName={assignmentName}
  hasGeneratedQuestions={generatedQuestions.length > 0}
/>









<StepContainer 
          title="Settings" 
          icon={Settings}
          color="black"
          
          backgroundColor="white"
          width={StepContainerConfig.settings.width}
          titleWidth={StepContainerConfig.settings.titleWidth}
        >
        

        
   <PreferencesSection>
   <AssignmentName
     value={assignmentName}
     onChange={setAssignmentName}
   />
   

   <DateSettingsElement
     assignDate={assignDate}
     setAssignDate={setAssignDate}
     dueDate={dueDate}
     setDueDate={setDueDate}
   />

  
  
   <QuestionCountSection
        bankCount={questionBank}
        studentCount={questionStudent}
        onBankChange={setQuestionBank}
        onStudentChange={setQuestionStudent}
      />
      
    


        <TimerSection
     timerOn={timerOn}
     timer={timer}
     onTimerChange={setTimer}
     onToggle={() => setTimerOn(!timerOn)}
   />
   
    
<ToggleSwitch
        label="Half Credit"
        value={halfCredit}
        onChange={setHalfCredit}
      />
      

     <SecuritySettingsElement
       saveAndExit={saveAndExit}
       setSaveAndExit={setSaveAndExit}
       lockdown={lockdown}
       setLockdown={setLockdown}
       onViolation={onViolation}
       setOnViolation={setOnViolation}
     />
   </PreferencesSection>


           
        


 
</StepContainer>


 </div>
    )}

    {currentStep === 2 && (
      <div style={{width: '900px',  height: '500px',marginLeft: 'auto', marginRight: 'auto', marginTop: '50px', position: 'relative'}}>


<StepPreviewCards
  currentStep={currentStep}
  canProgress={isFormValid()}
  onNextStep={nextStep}
  onPrevStep={handlePrevious}
  assignmentName={assignmentName}
  hasGeneratedQuestions={generatedQuestions.length > 0}
/>


<StepContainer 
          title="Select Students" 
          icon={SquareDashedMousePointer}
          color="black"   widt
          
          backgroundColor="white"
          width={StepContainerConfig.students.width}
          titleWidth={StepContainerConfig.students.titleWidth}
        >
      <SelectStudentsDW
        classId={classId}
        selectedStudents={selectedStudents}
        setSelectedStudents={setSelectedStudents}
      />

    </StepContainer>
      </div>
    
    )}

    {currentStep === 3 && (
     <div style={{width: '900px', height: '500px',marginLeft: 'auto', marginRight: 'auto', marginTop: '50px', position: 'relative'}}>

<StepPreviewCards
currentStep={currentStep}
canProgress={isFormValid()}
onNextStep={nextStep}
onPrevStep={handlePrevious}
assignmentName={assignmentName}
hasGeneratedQuestions={generatedQuestions.length > 0}
/>
<StepContainer 
          title="Generate Questions" 
          icon={Sparkles}
          color="black"
          
          backgroundColor="white"
          width={StepContainerConfig.generate.width}
          titleWidth={StepContainerConfig.generate.titleWidth}
        >
       


     

              <div style={{ width: '700px', marginLeft: '10px', marginTop: '-40px'}}>
           

              <SourcePreviewToggle 
  sourceText={sourceText}
  onSourceChange={setSourceText}
  additionalInstructions={additionalInstructions}
  onAdditionalInstructionsChange={setAdditionalInstructions}
  onPreviewClick={handlePreviewToggle}
  onGenerateClick={handleGenerateClick}
  generating={generating}
  generatedQuestions={generatedQuestions}
  questionBank={questionBank}
  questionStudent={questionStudent}
  setQuestionBank={setQuestionBank}
  setQuestionStudent={setQuestionStudent}
/>


</div>
</StepContainer>
  
          </div>

    
         
    )}

    {currentStep === 4 && (
       <div style={{width: '900px',  height: '500px',marginLeft: 'auto', marginRight: 'auto', marginTop: '50px', position: 'relative'}}>

       <StepPreviewCards
       currentStep={currentStep}
       canProgress={isFormValid()}
       onNextStep={nextStep}
       onPrevStep={handlePrevious}
       assignmentName={assignmentName}
       hasGeneratedQuestions={generatedQuestions.length > 0}
       />
     {/* Step 4: Preview */}
     <TeacherPreview
        questionsWithIds={generatedQuestions}
        setQuestionsWithIds={setGeneratedQuestions}
        sourceText={sourceText}
        questionCount={questionBank}
        classId={classId}
        teacherId={teacherId} // Hide the close button in stepper flow
     />
 <div
       onClick={saveAssignment}
 onMouseEnter={() => setIsHovered(true)}
 onMouseLeave={() => setIsHovered(false)}
  style={{height: '250px', width: '400px', border: '2px solid lightgreen', position: 'absolute', right: '0px', top: '0px ',     transform: `scale(${isHovered ? 1.1 : 1})`,
            transition: 'transform 0.3s ease, opacity 0.3s ease',
            
            color: 'lightgreen',
            cursor: 'pointer',
            borderRadius: '20px 20px 20px 0px',
            
            alignItems: 'center',
            
            }}>
  <SendHorizonal size={40} style={{position: 'absolute', right: '20px', top: '50%', transform: 'translatey(-50%)'}}/>
  <h1>Publish</h1>
  </div>
   </div>
 )}



 
</div>      </div>
    );
  };

  

const CreateAssignmentWithErrorBoundary = () => (
  <ErrorBoundary>
    <CreateAssignment />
  </ErrorBoundary>
);

export default CreateAssignmentWithErrorBoundary;
