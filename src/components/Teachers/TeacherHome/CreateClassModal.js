import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CalendarClock, Shapes, Plus } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../Universal/firebase';
import { nanoid } from 'nanoid';
import { GlassContainer } from '../../../styles';

const CreateClassModal = ({ handleCreateClass, setShowCreateClassModal, isInline = false }) => {
  const [period, setPeriod] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Ref for the input
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Memoize class options to prevent recreation on every render
  const classOptions = React.useMemo(() => [
    'AP African American Studies', 'AP Art History', 'AP Biology',
    'AP Comparative Government', 'AP Macroeconomics', 'AP Microeconomics',
    'AP English Literature', 'AP English Language and Composition',
    'AP Environmental Science', 'AP European History', 'AP Human Geography',
    'AP Psychology', 'AP Spanish Language', 'AP Spanish Literature',
    'AP US Government and Politics', 'AP US History', 'AP World History',
    'Biology', 'Civics', 'English 1', 'English 2', 'English 3', 'Spanish', 'US History',
    'World History', 'Chemistry', 'Journalism', 'Personal Fitness',
    'AP Calculus AB', 'AP Calculus BC', 'AP Statistics', 'AP Physics 1',
    'AP Physics 2', 'AP Physics C: Mechanics', 'AP Physics C: Electricity and Magnetism',
    'AP Computer Science A', 'AP Computer Science Principles',
    'AP French Language and Culture', 'AP German Language and Culture',
    'AP Italian Language and Culture', 'AP Japanese Language and Culture',
    'AP Chinese Language and Culture', 'AP Latin', 'AP Music Theory',
    'AP Studio Art: 2-D Design', 'AP Studio Art: 3-D Design', 'AP Studio Art: Drawing',
    'Algebra 1', 'Algebra 2', 'Geometry', 'Precalculus', 'Trigonometry',
    'Earth Science', 'Physics', 'Anatomy and Physiology', 'Environmental Studies',
    'Economics', 'Sociology', 'Psychology', 'Anthropology', 'Philosophy',
    'Creative Writing', 'Public Speaking', 'Debate', 'Film Studies',
    'Computer Science', 'Web Design', 'Graphic Design', 'Photography',
    'Theatre Arts', 'Dance', 'Choir', 'Band', 'Orchestra',
    'Culinary Arts', 'Woodworking', 'Auto Mechanics', 'Robotics',
    'Engineering Design', 'Business Management', 'Accounting',
    'Marketing', 'Entrepreneurship', 'Personal Finance',
    'Health', 'Nutrition', 'Physical Education', 'Yoga',
    'Mindfulness and Meditation', 'Study Skills', 'Career Planning',
    'Community Service', 'Leadership', 'Model United Nations',
    'Environmental Sustainability', 'Forensic Science', 'Astronomy',
    'Oceanography', 'Geology', 'Meteorology', 'Zoology', 'Botany',
    'Microbiology', 'Genetics', 'Organic Chemistry', 'Biochemistry',
    'Calculus III', 'Linear Algebra', 'Differential Equations',
    'Number Theory', 'Discrete Mathematics', 'Art History',
    'Studio Art', 'Ceramics', 'Sculpture', 'Printmaking',
    'Digital Media', 'Video Production', 'Animation',
    'Game Design', 'Mobile App Development', 'Artificial Intelligence',
    'Cybersecurity', 'Data Science', 'Machine Learning',
    'AP Seminar', 'AP Research', 'IB Theory of Knowledge',
    'IB Extended Essay', 'IB Biology', 'IB Chemistry', 'IB Physics',
    'IB Mathematics', 'IB English A: Literature', 'IB History',
    'American Sign Language', 'Russian', 'Arabic', 'Hebrew',
    'Ancient Greek', 'Sanskrit', 'Mandarin Chinese',
    'Sports Medicine', 'Athletic Training', 'Kinesiology',
    'Comparative Religions', 'Ethics', 'Logic',
    'Classical Literature', 'Modern Literature', 'World Mythology',
    'Architectural Design', 'Interior Design', 'Fashion Design',
    '3D Modeling and Printing', 'Drone Technology', 'Blockchain and Cryptocurrency',
    'Sustainable Agriculture', 'Horticulture', 'Veterinary Science',
    'Honors Biology', 'Honors Chemistry', 'Honors Physics',
    'Honors Algebra 1', 'Honors Algebra 2', 'Honors Geometry',
    'Honors Precalculus', 'Honors English 1', 'Honors English 2',
    'Honors English 3', 'Honors English 4', 'Honors World History',
    'Honors US History', 'Honors Government', 'Honors Economics',
    'Advanced Biology', 'Advanced Chemistry', 'Advanced Physics',
    'Advanced Mathematics', 'Advanced Computer Science',
    'Advanced Spanish', 'Advanced French', 'Advanced German',
    'Advanced Art', 'Advanced Music Theory', 'Advanced Theatre',
    'College Preparatory Writing', 'College Preparatory Mathematics',
    'Dual Enrollment English', 'Dual Enrollment Mathematics',
    'Dual Enrollment History', 'Dual Enrollment Science',
    'STEM Research', 'Biotechnology', 'Nanotechnology',
    'Quantum Computing', 'Space Science', 'Climate Science',
    'Cognitive Science', 'Neuroscience', 'Bioinformatics',
    'Data Analytics', 'Financial Technology', 'Digital Marketing',
    'Social Media Management', 'E-commerce', 'International Business',
    'Global Studies', 'Peace and Conflict Studies', 'Human Rights',
    'Gender Studies', 'African Studies', 'Asian Studies',
    'Latin American Studies', 'Middle Eastern Studies',
    'Indigenous Studies', 'Diaspora Studies', 'Migration Studies',
    'Urban Planning', 'Environmental Policy', 'Public Policy',
    'Constitutional Law', 'Criminal Justice', 'Forensic Psychology',
    'Abnormal Psychology', 'Developmental Psychology', 'Social Psychology',
    'Positive Psychology', 'Sports Psychology', 'Industrial-Organizational Psychology',
    'Cognitive Behavioral Therapy', 'Art Therapy', 'Music Therapy',
    'Dance Therapy', 'Occupational Therapy', 'Physical Therapy',
    'Speech and Language Therapy', 'Nutritional Science', 'Exercise Science',
    'Biomechanics', 'Ergonomics', 'Human Factors Engineering',
    'Biomedical Engineering', 'Chemical Engineering', 'Civil Engineering',
    'Electrical Engineering', 'Mechanical Engineering', 'Software Engineering',
    'Systems Engineering', 'Aerospace Engineering', 'Marine Engineering'
  ], []);

  // NEW refs
const inputAreaRef = useRef(null);     // you already have this

// Handle click outside suggestions
useEffect(() => {
  const handlePointerDown = (event) => {
    // Don't do anything if clicking inside input area or suggestions
    if (inputAreaRef.current?.contains(event.target) || suggestionsRef.current?.contains(event.target)) {
      return;
    }
    
    // If clicking outside, close suggestions but don't blur input
    if (showSuggestions) {
      event.preventDefault();
      setShowSuggestions(false);
    }
  };

  document.addEventListener('mousedown', handlePointerDown, true);
  return () => document.removeEventListener('mousedown', handlePointerDown, true);
}, [showSuggestions]);

// Keep focus in the input when suggestions open
useEffect(() => {
  if (showSuggestions) {
    inputRef.current?.focus({ preventScroll: true });
  }
}, [showSuggestions]);




  const periodStyles = {
    1: { variant: 'teal', color: "#1EC8bc", borderColor: "#83E2F5" },
    2: { variant: 'purple', color: "#8324e1", borderColor: "#cf9eff" },
    3: { variant: 'orange', color: "#ff8800", borderColor: "#f1ab5a" },
    4: { variant: 'yellow', color: "#ffc300", borderColor: "#Ecca5a" },
    5: { variant: 'green', color: "#29c60f", borderColor: "#aef2a3" },
    6: { variant: 'blue', color: "#1651d4", borderColor: "#b5ccff" },
    7: { variant: 'pink', color: "#d138e9", borderColor: "#f198ff" },
    8: { variant: 'red', color: "#c63e3e", borderColor: "#ffa3a3" },
  };

  // Memoize the filtering logic
  useEffect(() => {
    if (inputValue.trim() === '') {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = classOptions.filter(option =>
      option.toLowerCase().includes(inputValue.toLowerCase())
    );
    setFilteredSuggestions(filtered);
    setShowSuggestions(true);
  }, [inputValue, classOptions]);

  // Use useCallback to prevent function recreation
  const handleInputChange = useCallback((e) => {
    setInputValue(e.target.value);
  }, []);

  const handleSuggestionClick = useCallback((suggestion) => {
    console.log('Selected class:', suggestion);
    setInputValue(suggestion);
    setShowSuggestions(false);
  }, []);

  const handleCreateCustomClass = useCallback(() => {
    if (inputValue.trim() !== '') {
      console.log('Creating custom class:', inputValue.trim());
      setShowSuggestions(false);
    }
  }, [inputValue]);

  const isFormValid = period !== null && inputValue.trim() !== '';



  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isFormValid && !isSubmitting) {
      setIsSubmitting(true);
      try {
        const classCode = nanoid(6).toUpperCase();
        await handleCreateClass(e, period, inputValue.trim(), { classCode });
        setShowCreateClassModal(false);
      } catch (error) {
        console.error('Error creating class:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  const selectPeriod = useCallback((selectedPeriod) => {
    setPeriod(selectedPeriod);
  }, []);

  // Conditional wrapper
  const ContentWrapper = ({ children }) => {
    const wrapperStyle = isInline ? {
      backgroundColor: 'rgba(255,255,255,.8)',
      padding: '40px',
      borderRadius: '15px',
      width: '960%',
      position: 'relative',
      margin: '0 auto',
    } : {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100,
    };

    const contentStyle = isInline ? {} : {
      backgroundColor: 'rgba(255,255,255,.8)',
      border: '1px solid lightgrey',
      padding: '40px',
      borderRadius: '15px',
      width: '80%',
      position: 'relative',
      maxWidth: '800px',
    };

    return (
      <div 
        style={wrapperStyle}
        onClick={(e) => {
          // Prevent clicks from reaching TeacherHome
          e.stopPropagation();
        }}
      >
        <div 
          style={contentStyle}
          onClick={(e) => {
            // Prevent clicks from reaching the wrapper
            e.stopPropagation();
          }}
        >
          {children}
        </div>
      </div>
    );
  };

  return (
    <ContentWrapper>
      <form 
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        style={{ isolation: 'isolate' }}>
        {/* Period Selector */}
        <GlassContainer
        size={0}
        style={{zIndex: '4'}}
        contentStyle={{padding:" 30px"}}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            padding: '0px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{marginLeft: '20px'}}><CalendarClock size={20} strokeWidth={1.5} /></div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '400' }}>Class Period:</h1>
            
            {/* Selected/Unselected Period */}
            <div style={{
                width: '40px',
                height: '40px',
                cursor: period ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: '1'
              }}>
            <GlassContainer
              variant={period ? periodStyles[period].variant : "clear"}
              onClick={() => period && selectPeriod(period)}
              size={0}
                        enableRotation={true}
              contentStyle={{
                fontSize: '30px',
                fontWeight: '500',
                color: period ? periodStyles[period].color : 'grey',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {period || '-'}
            </GlassContainer>
            </div>
            {/* Vertical Divider */}
            <div style={{
              width: '1px',
              height: '40px',
              backgroundColor: '#ccc',
              margin: '0 10px'
            }} />

            {/* Other Periods */}
            <div style={{
              display: 'flex',
              gap: '15px'
            }}>
              {Object.keys(periodStyles).map((num) => (
                <div key={num} style={{
                  zIndex: '2', 
                  border: `2px solid ${Number(num) === period ? 'lightgrey' : 'transparent'}`, 
                  padding: '6px', 
                  borderRadius: '200px'
                }}>
                  <GlassContainer
                    size={0}
                              enableRotation={true}
                    variant={periodStyles[num].variant}
                    onClick={() => selectPeriod(Number(num))}
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    contentStyle={{
                      fontSize: '30px',
                      fontWeight: '500',
                      color: periodStyles[num].color,
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {num}
                  </GlassContainer>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Class Input */}
        <div style={{ 
          borderTop: '1px solid #ccc', 
          marginBottom: '20px', 
          paddingTop: '2rem',
          width: '100%'
        }}>
          <div style={{
            padding: '0px',
            borderRadius: '5px',
            width: '100%',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <div style={{marginLeft: '20px'}}><Shapes size={25} strokeWidth={1.5} /></div>
            <h1 style={{ fontSize: '25px', marginLeft: '20px', fontWeight: '400' }}>Enter Class Name:</h1>
            
                        <div
                      ref={inputAreaRef}
                      style={{ marginLeft: 'auto', position: 'relative', width: '300px', marginRight: '80px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        inputRef.current?.focus();
                      }}
                    >
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => {
                          e.stopPropagation();
                          setInputValue(e.target.value);
                        }}
                        onKeyDown={(e) => { 
                          e.stopPropagation();
                          if (e.key === 'Enter') e.preventDefault(); 
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          inputRef.current?.focus();
                        }}
                        onFocus={(e) => {
                          e.stopPropagation();
                          if (inputValue.trim() !== '') {
                            setShowSuggestions(true);
                          }
                        }}
                        autoComplete="off"
                        placeholder="Enter class name"
                        style={{
                          width: '100%',
                          padding: '10px 20px',
                          borderRadius: showSuggestions ? '20px 20px 0 0' : '50px',
                          fontFamily: "'montserrat', sans-serif",
                          fontWeight: '500',
                          outline: 'none',
                          background: 'white',
                          fontSize: '16px',
                          border: '1px solid #ccc',
                          borderBottom: showSuggestions ? 'none' : '1px solid #ccc'
                        }}
                      />

              
             {showSuggestions && (
    <div
      ref={suggestionsRef}
      tabIndex={-1}                       // NEW: don't take focus
      onMouseDown={(e) => e.preventDefault()} // keep focus in input
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        maxHeight: '200px',
        overflowY: 'auto',
        background: 'white',
        width: 'calc(100% + 40px)',
        border: '1px solid #ccc',
        borderTop: 'none',
        borderRadius: '0 0 20px 20px',
        zIndex: 1000,
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}
    >
                  {filteredSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent input blur
                        handleSuggestionClick(suggestion);
                      }}
                      style={{
                        padding: '10px 20px',
                        cursor: 'pointer',
                        borderBottom: index < filteredSuggestions.length - 1 ? '1px solid #eee' : 'none',
                        transition: 'background-color 0.2s',
                        ':hover': {
                          backgroundColor: '#f5f5f5'
                        }
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                    >
                      {suggestion}
                    </div>
                  ))}
                  {inputValue.trim() !== '' && !filteredSuggestions.includes(inputValue) && (
                    <div
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent input blur
                        handleCreateCustomClass();
                      }}
                      style={{
                        padding: '10px 20px',
                        cursor: 'pointer',
                        borderTop: filteredSuggestions.length > 0 ? '1px solid #eee' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#1EC8bc',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                    >
                      <Plus size={16} />
                      Create "{inputValue}" class
                    </div>
                  )}
                </div>
              )}
            
            </div>
</div>
        </div>

        <div style={{marginTop: '30px.'}}>
          <GlassContainer
            size={0}
                      enableRotation={true}
            variant={isFormValid ? "teal" : "clear"}
            onClick={(e) => {
              if (isFormValid && !isSubmitting) {
                handleSubmit(e);
              }
            }}
            style={{
              width: '200px',
              marginLeft: '0px',
              cursor: isFormValid && !isSubmitting ? 'pointer' : 'not-allowed',
              opacity: 1,
              zIndex:'1',
              transition: '.2s',
            }}
            contentStyle={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '8px'
            }}
          >
            <h1 style={{ 
              margin: 0,
              fontSize: '1rem',
              pointerEvents: 'none',
              color: isFormValid ? '#008080' : '#808080',
              fontWeight: '500',
              fontFamily: "'montserrat', sans-serif"
            }}>
              {isSubmitting ? 'Creating...' : 'Create Class'}
            </h1>
          </GlassContainer>
          
          <button 
            type="button"
            onClick={() => setShowCreateClassModal(false)}
            style={{
              width: '160px',
              marginRight: 'auto',
              marginLeft: '20px',
              height: '40px',
              lineHeight: '10PX',
              padding: '5px 5px',
              fontWeight: '500',
              fontSize: '16px',
              borderRadius: '5px',
              marginTop: '-10px',
              fontFamily: '"montserrat", sans-serif',
              backgroundColor: 'white',
              border: 'none',
              color: 'grey',
              cursor: 'pointer',
              transition: '.3s',
              marginBottom: '10px'
            }}
          >
            return home
          </button>
        </div>
        </GlassContainer>
      </form>
    </ContentWrapper>
  );
};

export default CreateClassModal;