import React, { useState, useEffect, useRef, useCallback } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import {
  CornerDownRight,
  ClipboardList,
  ClipboardMinus,
  Pencil,
  PencilOff,
  Trash2,
  ArrowLeft,
  Search,
  Plus,
  ListOrdered,
} from 'lucide-react';
import {
  doc,
  collection,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../../../Universal/firebase';
import { useNavigate, useParams } from 'react-router-dom';
import QuestionResults from './QuestionResultsSAQ';
import { GlassContainer } from '../../../../styles';

// ─────────────────────────────────────────────────────────────────────────────
//  QuestionBankHeader (with search + average score + simple styling)
// ─────────────────────────────────────────────────────────────────────────────
const AddQuestionModal = ({ isOpen, onClose, onAdd }) => {
  const [question, setQuestion] = useState('');
  const [rubric, setRubric] = useState('');

  const handleSubmit = () => {
    if (!question.trim() || !rubric.trim()) {
      alert('Both question and rubric are required');
      return;
    }
    onAdd({ question, rubric });
    setQuestion('');
    setRubric('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100,
    }}>
      <GlassContainer
        variant="clear"
        size={0}
        contentStyle={{
          width: '600px',
          padding: '30px',
          zIndex: '2',
          position: 'relative',
        }}
      >
        <h2 style={{ 
          marginTop: 0, 
          marginBottom: '20px',
          fontSize: '1.5rem',
          fontWeight: '500',
          color: '#333'
        }}>Add New Question</h2>
        
        <div style={{ marginBottom: '20px' ,  width: '100%'}}>

          
         
          <div style={{display: 'flex', gap: '20px', alignItems: 'center', color: 'grey'}}></div>
               <div style={{display: 'flex', gap: '20px', alignItems: 'center', color: 'grey'}}>


            <ListOrdered
            size={60}
            strokeWidth={1}
            ></ListOrdered>
            
<div style={{height: '50px', width: '1px', background: '#ddd'}}/>
          <TextareaAutosize
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter your question..."
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #fff',
              outline:'none',
              fontSize: '1rem',
              resize: 'none',
              fontFamily: "'montserrat', sans-serif",
            }}
          />
        </div>
        </div>  
          <div style={{display: 'flex', gap: '20px', alignItems: 'center', color: 'grey', marginBottom: '30px', width: '100%'}}>


            <ClipboardList
            size={60}
            strokeWidth={1}
            ></ClipboardList>
<div style={{height: '50px', width: '1px', background: '#ddd'}}/>
          <TextareaAutosize
            value={rubric}
            onChange={(e) => setRubric(e.target.value)}
            placeholder="Enter rubric details...     E.g: 1 answer - blue"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #fff',
              fontSize: '1rem',
              resize: 'none',
              outline:'none',
              fontFamily: "'montserrat', sans-serif",
            }}
          />
          </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          gap: '10px',
          marginTop: '20px'
        }}>
        
          <GlassContainer
          
          enableRotation={true}
            variant={question.trim() && rubric.trim() ? 'green' : 'grey'}
            size={0}
            contentStyle={{
              padding: '5px 15px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              textAlign: 'center',
              color: question.trim() && rubric.trim() ? '#29c60f' : '#666',
              transition: 'all 0.2s ease',
            }}
            onClick={handleSubmit}
          >
            Add Question
          </GlassContainer>
            <button
            onClick={onClose}
            style={{
              padding: '5px 15px',
              borderRadius: '40px',
              border: '1px solid #ddd',
              background: 'white',
              cursor: 'pointer',
              fontSize: '0.9rem',
              color: '#666',
              
              fontFamily: "'montserrat', sans-serif",
              width: '120px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#ccc';
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#ddd';
              e.currentTarget.style.backgroundColor = 'white';
            }}
          >
            Cancel
          </button>
        </div>
      </GlassContainer>
    </div>
  );
};

const QuestionBankHeader = ({
  questionsCount,
  averageScore,
  onSearchChange,
  searchTerm,
  getGradeColors,
  hasScrolled,
  onAddClick,
}) => {
  return (
    <div
      style={{
        width: 'calc(100% - 200px)',
        height: '60px',
        display: 'flex',
        top: '60px',
        marginTop: '-2px',
        alignItems: 'center',
        background: 'rgb(255,255,255,.9)',
        backdropFilter: 'blur(5px)',
        zIndex: '10',
        borderBottom: hasScrolled ? "1px solid #ddd" : "1px solid transparent",
        transition: 'border-bottom 0.3s ease',
        position: 'fixed',
      }}
    >
      <div
        style={{
          marginLeft: '4%',
          width: '460px',
          display: 'flex',
          marginTop: '5px',
          position: 'relative',
          zIndex: 1,
          alignItems: 'center',
        }}
      >
        <h1
          style={{
            fontWeight: '400',
            fontSize: '1rem',
            margin: '0',
            display: 'flex',
            alignItems: 'center',
            color: 'grey',
            height: '100%',
          }}
        >
          Questions {questionsCount}
        </h1>
      </div>

      {/* Search input */}
      <div
        style={{
          marginLeft: 'auto',
          marginRight: '0%',
          position: 'relative',
          width: '300px',
        }}
      >
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search questions..."
          style={{
            width: '200px',
            padding: '5px 15px',
            paddingLeft: '35px',
            borderRadius: '40px',
            border: '1px solid #ddd',
            fontSize: '.9rem',
            fontFamily: "'montserrat', sans-serif",
            outline: 'none',
          }}
        />
        <Search
          size={18}
          style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'grey',
          }}
        />
      </div>

      {/* Average Score display */}
      <div style={{
          marginRight: '4%',
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
        <GlassContainer
          variant={averageScore ? getGradeColors(averageScore).variant : 'clear'}
          size={0}
          style={{}}
          contentStyle={{
            padding: '3px 10px',
            fontWeight:'500',
            fontSize: '.9rem',
            textAlign: 'center',
            color: getGradeColors(averageScore).color,
          }}
        >
          {averageScore !== null ? averageScore : '-'}%
        </GlassContainer>

        <button
          onClick={onAddClick}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '8px',
            borderRadius: '50%',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Plus size={24} color="grey" />
        </button>
      </div>
    </div>
  );
};
const QuestionBankSAQ = ({
  questionsWithIds,
  setQuestionsWithIds,
  classId,
  assignmentId,
  autoOpenQuestionId,
}) => {
  const containerRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingQuestions, setEditingQuestions] = useState({});
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const [showRubrics, setShowRubrics] = useState({});
  const [questionStats, setQuestionStats] = useState({});

  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // For opening a single question's results in a panel
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const navigate = useNavigate();
  const { questionId } = useParams();

  // ─────────────────────────────────────────────────────────────────────────
  //  Firestore Updater: Single "big" update on blur/unload
  // ─────────────────────────────────────────────────────────────────────────
  const saveQuestionsToFirestore = async (allQuestions) => {
    try {
      const assignmentRef = doc(db, 'assignments', assignmentId);

      // Construct the question object for Firestore
      const questionsObject = {};
      allQuestions.forEach((q) => {
        questionsObject[q.questionId] = {
          question: q.question,
          rubric: q.rubric,
          questionId: q.questionId,
        };
      });

      await updateDoc(assignmentRef, { questions: questionsObject });
      console.log('All questions saved to Firestore');
    } catch (error) {
      console.error('Error saving questions:', error);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  Type in local state: absolutely seamless
  // ─────────────────────────────────────────────────────────────────────────
  const handleEditQuestion = (qId, field, value) => {
    const updatedList = questionsWithIds.map((q) =>
      q.questionId === qId ? { ...q, [field]: value } : q
    );
    setQuestionsWithIds(updatedList);
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  On blur => push the entire question set to Firestore
  // ─────────────────────────────────────────────────────────────────────────
  const handleBlur = async () => {
    await saveQuestionsToFirestore(questionsWithIds);
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  Page Unload => also push the entire question set
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleUnload = () => {
      saveQuestionsToFirestore(questionsWithIds);
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      handleUnload(); // Also commit on unmount
    };
  }, [questionsWithIds]);

  // ─────────────────────────────────────────────────────────────────────────
  //  Toggle editing mode
  // ─────────────────────────────────────────────────────────────────────────
  const handleEditQuestionToggle = async (qId) => {
    const isCurrentlyEditing = editingQuestions[qId];
    
    // If we're exiting edit mode, save the changes first
    if (isCurrentlyEditing) {
      await handleBlur();
    }

    setEditingQuestions((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  Delete question
  // ─────────────────────────────────────────────────────────────────────────
  const handleDeleteQuestion = async (questionIdToDelete) => {
    const updated = questionsWithIds.filter((q) => q.questionId !== questionIdToDelete);
    await saveQuestionsToFirestore(updated);
    setQuestionsWithIds(updated);

    setEditingQuestions((prev) => {
      const newEdits = { ...prev };
      delete newEdits[questionIdToDelete];
      return newEdits;
    });
    setShowRubrics((prev) => {
      const newRubrics = { ...prev };
      delete newRubrics[questionIdToDelete];
      return newRubrics;
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  Toggle rubric visibility
  // ─────────────────────────────────────────────────────────────────────────
  const toggleRubric = (qId) => {
    setShowRubrics((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  Basic search
  // ─────────────────────────────────────────────────────────────────────────
  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  Stats Calculation + Average Score
  // ─────────────────────────────────────────────────────────────────────────
  const calculateAverageScore = () => {
    const validScores = Object.values(questionStats).filter((val) => val !== null);
    if (validScores.length === 0) return null;
    const sum = validScores.reduce((a, b) => a + b, 0);
    return Math.round(sum / validScores.length);
  };

  // Example color function for question percentages
  const getGradeColors = (grade) => {
    if (grade === undefined || grade === null || grade === 0) return { color: '#858585', variant: 'clear' };
    if (grade < 50) return { color: '#c63e3e', variant: 'red' };
    if (grade < 60) return { color: '#ff8800', variant: 'orange' };
    if (grade < 70) return { color: '#ffc300', variant: 'yellow' };
    if (grade < 80) return { color: '#29c60f', variant: 'green' };
    if (grade < 90) return { color: '#006400', variant: 'darkgreen' };
    return { color: '#f198ff', variant: 'pink' };
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  Optionally fetch stats from "grades" or wherever your data is
  //  Here is an example that calculates a random # just to show the percentage
  //  You can replace with your actual logic
  // ─────────────────────────────────────────────────────────────────────────
  const calculateQuestionStats = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Calculating stats for:', {
        assignmentId,
        classId,
        questionsCount: questionsWithIds.length,
      });
  
      const gradesRef = collection(db, 'grades');
      const gradesQuery = query(
        gradesRef,
        where('assignmentId', '==', assignmentId),
        where('classId', '==', classId)
      );
  
      const gradesSnapshot = await getDocs(gradesQuery);
  
      // Create a map to store stats for each question
      const questionStatsMap = {};
      questionsWithIds.forEach((question) => {
        questionStatsMap[question.questionId] = {
          stats: {
            totalAttempts: 0,
            totalScore: 0,
            scores: [],
          },
        };
      });
  
      // Helper function to find the best matching question
      const findMatchingQuestion = (gradeQuestion, questions) => {
        // First try exact match by questionId
        const exactMatch = questions.find(q => q.questionId === gradeQuestion.questionId);
        if (exactMatch) return exactMatch;
  
        // Then try exact text match
        const textMatch = questions.find(q => 
          q.question.toLowerCase().trim() === gradeQuestion.question.toLowerCase().trim()
        );
        if (textMatch) return textMatch;
  
        // Finally, try similarity matching for edited questions
        // Convert questions to lowercase and remove extra spaces for comparison
        const normalizeText = text => text.toLowerCase().replace(/\s+/g, ' ').trim();
        const gradeQuestionNormalized = normalizeText(gradeQuestion.question);
        
        // Find the question with the highest similarity
        let bestMatch = null;
        let highestSimilarity = 0;
        
        questions.forEach(q => {
          const questionNormalized = normalizeText(q.question);
          
          // Calculate similarity (you can adjust these criteria)
          const lengthDiff = Math.abs(questionNormalized.length - gradeQuestionNormalized.length);
          const maxLength = Math.max(questionNormalized.length, gradeQuestionNormalized.length);
          
          // If length difference is too great, skip this question
          if (lengthDiff / maxLength > 0.3) return; // 30% length difference threshold
          
          // Calculate word-based similarity
          const words1 = questionNormalized.split(' ');
          const words2 = gradeQuestionNormalized.split(' ');
          const commonWords = words1.filter(word => words2.includes(word));
          const similarity = (2 * commonWords.length) / (words1.length + words2.length);
          
          if (similarity > highestSimilarity && similarity > 0.7) { // 70% similarity threshold
            highestSimilarity = similarity;
            bestMatch = q;
          }
        });
        
        return bestMatch;
      };
  
      // Process grades with improved matching
      gradesSnapshot.forEach((doc) => {
        const gradeData = doc.data();
        if (!gradeData.questions || !Array.isArray(gradeData.questions)) {
          console.warn('Invalid grade document structure:', doc.id);
          return;
        }
  
        gradeData.questions.forEach((gradeQuestion) => {
          const matchingQuestion = findMatchingQuestion(gradeQuestion, questionsWithIds);
          
          if (!matchingQuestion) {
            console.warn('No matching question found for:', gradeQuestion.question);
            return;
          }
  
          const score = Number(gradeQuestion.score);
          if (isNaN(score)) {
            console.warn('Invalid score for question:', gradeQuestion.question);
            return;
          }
  
          const statsEntry = questionStatsMap[matchingQuestion.questionId];
          statsEntry.stats.totalAttempts++;
          statsEntry.stats.totalScore += score;
          statsEntry.stats.scores.push(score);
        });
      });
  
      // Calculate percentages with improved matching
      const percentages = {};
      Object.entries(questionStatsMap).forEach(([questionId, data]) => {
        if (data.stats.totalAttempts > 0) {
          const averageScore = data.stats.totalScore / data.stats.totalAttempts;
          const percentage = Math.round((averageScore / 2) * 100);
          percentages[questionId] = percentage;
        } else {
          percentages[questionId] = null;
        }
      });
  
      console.log('Calculated percentages:', percentages);
      setQuestionStats(percentages);
      setIsLoading(false);
    } catch (error) {
      console.error('Error calculating question stats:', error);
      setIsLoading(false);
    }
  }, [assignmentId, classId, questionsWithIds]);



useEffect(() => {
  if (questionsWithIds.length > 0 && classId && assignmentId) {
    calculateQuestionStats();
  }

  return () => {
    setIsLoading(true);
  };
}, [calculateQuestionStats, questionsWithIds, classId, assignmentId]);

// Render stats badge (unchanged)
const renderStatsBadge = (questionId) => {
  const percentage = questionStats[questionId];
  if (percentage === null) return null;

  let textColor = '#2BB514';
  if (percentage < 80) textColor = '#FFA500';
  if (percentage < 60) textColor = '#FF0000';

  const isQuestionViewable = (questionId) => {
    const percentage = questionStats[questionId];
    return percentage !== null && percentage !== undefined;
  };
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Opening modal for question:', questionId); // Debug log
        setSelectedQuestionId(questionId);
        setIsModalOpen(true);
      }}
      style={{
        position: 'absolute',
        right: '2%',
        top: '50%',
        height: '30px',
        transform: 'translateY(-50%)',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '500',
        background: 'white',
        border: 'none',
        display: 'flex',
        lineHeight: '10px',
        color: textColor,
        cursor: 'pointer',
        minWidth: '40px',
        textAlign: 'center',
      }}
    >
        <div style={{
          marginRight: '2%',}}>
      <GlassContainer
        variant={getGradeColors(percentage).variant}
        size={0}
     
        contentStyle={{
          padding: '3px 8px',
          fontSize: '.8rem',
          
              fontFamily: "'montserrat', sans-serif",
              lineHeight: '1.2',
          textAlign: 'center',
          color: getGradeColors(percentage).color,
        }}
      >
        {percentage}%
      </GlassContainer>
      </div>
    </button>
  );
};
  // Close the question results panel
  const handleCloseResults = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedQuestionId(null);
      setIsTransitioning(false);
    }, 300);
  };

  // only open results if not editing
  const handleQuestionSelect = (qId, isEditing) => {
    if (isEditing) return;
    setSelectedQuestionId(qId);
  };

  // Filter and sort questions
  const filteredQuestions = questionsWithIds
    .filter((q) => {
      const lowerQ = q.question.toLowerCase();
      const lowerR = q.rubric.toLowerCase();
      const term = searchTerm.toLowerCase();
      return lowerQ.includes(term) || lowerR.includes(term);
    })
    // Only sort if no questions are being edited
    .sort((a, b) => {
      const isAnyEditing = Object.values(editingQuestions).some(isEditing => isEditing);
      if (isAnyEditing) {
        // Maintain current order during editing
        return 0;
      }
      return a.question.toLowerCase().localeCompare(b.question.toLowerCase());
    });

  // If a question is auto-opened (e.g., user clicked from somewhere else)
  useEffect(() => {
    if (autoOpenQuestionId) {
      setSelectedQuestionId(autoOpenQuestionId);
      setIsTransitioning(false);
    }
  }, [autoOpenQuestionId]);

  // ─────────────────────────────────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────────────────────────────────
  const handleAddQuestion = async (newQuestion) => {
    const questionId = Date.now().toString(); // Simple unique ID generation
    const questionWithId = {
      ...newQuestion,
      questionId,
    };

    const updatedQuestions = [...questionsWithIds, questionWithId];
    setQuestionsWithIds(updatedQuestions);
    await saveQuestionsToFirestore(updatedQuestions);
  };

  return (
    <div ref={containerRef} style={{ width: '100%', marginTop: '-40px', position: 'relative' }}>
      <QuestionBankHeader
        questionsCount={questionsWithIds.length}
        averageScore={calculateAverageScore()}
        onSearchChange={handleSearchChange}
        searchTerm={searchTerm}
        getGradeColors={getGradeColors}
        hasScrolled={hasScrolled}
        onAddClick={() => setIsAddModalOpen(true)}
      />

      <AddQuestionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddQuestion}
      />

      {/* The question results panel (slide over) */}
      {selectedQuestionId && (
        <div
          style={{
            position: 'absolute',
            top: '160px',
            left: '200px',
            right: '0',
            bottom: '0',
            backgroundColor: 'white',
            zIndex: 10,
            transition: 'opacity 0.3s ease-in-out',
            opacity: isTransitioning ? 0 : 1,
          }}
        >
          <button
            onClick={handleCloseResults}
            style={{
              top: '85px',
              left: '210px',
              position: 'fixed',
              zIndex: '20',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={20} color="grey" />
          </button>
          <QuestionResults
            assignmentId={assignmentId}
            questionId={selectedQuestionId}
            inModal={false}
          />
        </div>
      )}

      {/* Main List of Questions */}
      <div
        style={{
          opacity: selectedQuestionId ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out',
          pointerEvents: selectedQuestionId ? 'none' : 'auto',
          position: 'relative',
        }}
      >
        {filteredQuestions.map((q, idx) => {
          const isEditing = editingQuestions[q.questionId];
          const isRubricOpen = showRubrics[q.questionId];

          return (
            <div
              key={q.questionId}
              style={{
                paddingBottom: '5px',
                margin: '0px 2%',
                marginBottom: '20px',
                paddingLeft: '2%',
                borderBottom: '1px solid #ddd',
                width: '94%',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
              }}
              onClick={() => handleQuestionSelect(q.questionId, isEditing)}
            >
              {/* Q row */}
              <div
                style={{
                  width: '100%',
                  borderRadius: '10px',
                  display: 'flex',
                  fontSize: '12px',
                  position: 'relative',
                  marginBottom: '10px',
                }}
              >
          

                {/* Main question text (editable / static) */}
                {isEditing ? (
                  <TextareaAutosize
                    style={{
                      padding: '15px',
                      outline: 'none',
                      fontWeight: '500',
                      border: 'none',
                      fontSize: '1rem',
                      width: 'calc(80% - 120px)',
                      lineHeight: '1.2',
                      background: 'white',
                      resize: 'none',
                    }}
                    value={q.question}
                    onChange={(e) =>
                      handleEditQuestion(q.questionId, 'question', e.target.value)
                    }
                    onBlur={handleBlur}
                  />
                ) : (
                  <div
                    style={{
                      padding: '15px',
                      paddingRight: '8%',
                      fontWeight: '500',
                      fontSize: '16px',
                      width: 'calc(80% - 120px)',
                      lineHeight: '1.2',
                      background: 'white',
                    }}
                  >
                    {q.question}
                  </div>
                )}

                {/* Rubric Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRubric(q.questionId);
                  }}
                  style={{
                    position: 'absolute',
                    transform: 'translateY(-50%)',
                    top: '50%',
                    right: '17%',
                    cursor: 'pointer',
                    fontSize: '16px',
                    background: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    height: '40px',
                    width: '40px',
                    color: 'grey',
                    padding: '8px',
                  }}
                >
                  {isRubricOpen ? 
                    <ClipboardMinus strokeWidth={1.5} /> : 
                    <ClipboardList strokeWidth={1.5} />
                  }
                </button>

                {/* Edit Mode Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditQuestionToggle(q.questionId);
                  }}
                  style={{
                    position: 'absolute',
                    right: '12%',
                    transform: 'translateY(-50%)',
                    top: '50%',
                    fontSize: '16px',
                    zIndex: '1',
                    height: '40px',
                    width: '40px',
                    borderRadius: '8px',
                    background: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                  }}
                >
                  {isEditing ? (
                    <PencilOff size={24} strokeWidth={1.5} color="grey" />
                  ) : (
                    <Pencil size={24} strokeWidth={1.5} color="grey" />
                  )}
                </button>

                {/* Stats Badge */}
                {renderStatsBadge(q.questionId)}
              </div>

              {/* Rubric Section */}
              {isRubricOpen && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginLeft: '-80px',
                    position: 'relative',
                    marginBottom: '20px',
                  }}
                >
                  {/* Delete if in edit mode */}
                  {isEditing && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteQuestion(q.questionId);
                      }}
                      style={{
                        position: 'absolute',
                        right: '60px',
                        bottom: '0px',
                        fontSize: '16px',
                        zIndex: '10',
                        height: '30px',
                        width: '30px',
                        borderRadius: '6px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={20} strokeWidth={1.5} color="grey" />
                    </button>
                  )}

             
                  <div
                    style={{
                      width: '30px',
                      padding: '8px',
                      background: 'white',
                      border: '4px solid white',
                      color: 'grey',
                      borderRadius: '10px 0px 0px 10px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginLeft: '100px',
                      alignSelf: 'stretch',
                    }}
                  >
                    <ClipboardList size={30}  strokeWidth={1}/>
                  </div>

                  {/* Editable or static rubric */}
                  {isEditing ? (
                    <TextareaAutosize
                      style={{
                        width: '70%',
                        padding: '5px 15px',
                        fontWeight: '400',
                        color: 'grey',
                        outline: 'none',
                        fontSize: '14px',
                        border: 'none',
                        borderLeft: '1px solid #ddd',
                        paddingLeft: '20px',
                        marginLeft: '-4px',
                        resize: 'none',
                        background: 'white',
                      }}
                      value={q.rubric}
                      onChange={(e) =>
                        handleEditQuestion(q.questionId, 'rubric', e.target.value)
                      }
                      onBlur={handleBlur}
                    />
                  ) : (
                    <div
                      style={{
                        width: '70%',
                        padding: '5px 15px',
                        fontWeight: '400',
                        color: 'grey',
                        fontSize: '14px',
                        paddingLeft: '20px',
                        
                        borderLeft: '1px solid #ddd',
                        marginLeft: '-4px',
                        borderRadius: '0px 10px 10px 0px',
                        background: 'white',
                      }}
                    >
                      {q.rubric}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredQuestions.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '40px',
              color: 'grey',
              fontFamily: "'montserrat', sans-serif",
              fontSize: '16px',
            }}
          >
            No questions match your search
          </div>
        )}

        {/* Bottom Add Question Button */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '20px 0 40px 0',
        }}>
          <GlassContainer
          variant='green'
          
          enableRotation={true}
            onClick={() => setIsAddModalOpen(true)}
            contentStyle={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 40px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              color: 'darkgreen',
              transition: 'all 0.2s ease',
            }}
       
          >
            <div
            style={{display: 'flex', gap: '20px', fontSize: '1rem'}}>
            <Plus size={20} />
            
            Add New Question
            </div>
          </GlassContainer>
        </div>
      </div>
    </div>
  );
};

export default QuestionBankSAQ;