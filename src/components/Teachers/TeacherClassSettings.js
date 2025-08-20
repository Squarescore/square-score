import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { auth, db } from '../Universal/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Navbar from '../Universal/Navbar';
import { Pencil, Check, X, Copy, Users, BookOpen, Brain, CalendarClock, Shapes, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { GlassContainer } from '../../styles';

const TeacherClassSettings = () => {
  const { classId } = useParams();
  const [loading, setLoading] = useState(false);
  const [classData, setClassData] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState({ classChoice: '', period: '' });
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [showTrainingData, setShowTrainingData] = useState(false);
  const [editingTrainingData, setEditingTrainingData] = useState(null);
  const [selectedTrainingData, setSelectedTrainingData] = useState(null);
  const [tempScore, setTempScore] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const inputAreaRef = useRef(null);

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

  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser || !classId) return;

    const fetchClass = async () => {
      setLoading(true);
      try {
        const classRef = doc(db, 'classes', classId);
        const classSnap = await getDoc(classRef);

        if (classSnap.exists()) {
          const data = { id: classId, ...classSnap.data() };
          setClassData(data);
          setInputValue(data.classChoice);
        }
      } catch (error) {
        console.error("Error fetching class:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClass();
  }, [currentUser, classId]);

  const handleSave = async () => {
    if (!classData) return;

    try {
      const classRef = doc(db, 'classes', classId);
      await updateDoc(classRef, {
        classChoice: inputValue,
        period: tempValue.period
      });

      setClassData(prev => ({
        ...prev,
        classChoice: inputValue,
        period: tempValue.period
      }));
      setEditingField(null);
    } catch (error) {
      console.error("Error updating class:", error);
    }
  };

  const handleCopyLink = async () => {
    if (!classData) return;

    const baseUrl = 'https://square-score-ai.web.app/signup';
    const encodedClassName = encodeURIComponent(`Period ${classData.period}`);
    const encodedClassChoice = encodeURIComponent(classData.classChoice);
    const signupUrl = `${baseUrl}/${classData.classCode}+${encodedClassName}+${encodedClassChoice}`;

    try {
      await navigator.clipboard.writeText(signupUrl);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Class options from CreateClassModal
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

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!inputAreaRef.current?.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (showSuggestions) {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [showSuggestions]);

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        width: '100%',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Navbar userType="teacher" />
        <p style={{ color: 'grey' }}>Loading class settings...</p>
      </div>
    );
  }

  if (!classData) {
    return (
      <div style={{ 
        minHeight: '100vh',
        width: '100%',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Navbar userType="teacher" />
        <p style={{ color: 'grey' }}>Class not found</p>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      width: '100%',
      backgroundColor: 'white',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Navbar userType="teacher" />
      
      <div style={{
        width: 'calc(92% - 200px)',
        marginLeft: '200px',
        padding: '0 4%'
      }}>
        <div style={{
          position: 'fixed',
          top: '0',
          left: '200px',
          right: '0',
          height: '70px',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 4%',
          gap: '20px',
          zIndex: '99'
        }}>
          <h1 style={{
            fontSize: '1.3rem',
            fontWeight: '400',
            color: 'black',
            margin: 0
          }}>
           {classData.classChoice} 
          </h1>
          <div
          style={{
            width: '1px ',
            background: '#ddd',
            height: '20px',
          }}/> 

             <h1 style={{
            fontSize: '1.3rem',
            fontWeight: '400',
            color: 'black',
            margin: 0
          }}>
           Period {classData.period} 
          </h1>
        </div>

        <div style={{ marginTop: '120px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
            gap: '20px'
          }}>
            {/* Class Info */}
            <GlassContainer
              variant="clear"
              size={0}
              style={{
                zIndex: '2',
              }}
              contentStyle={{
                padding: '30px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{
                display: 'flex',
                width: '100%',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px'
                }}>
                  <BookOpen size={20} color="grey" />
                  <h3 style={{
                    margin: 0,
                    fontSize: '1rem',
                    fontWeight: '500',
                    color: 'black'
                  }}>
                    Class Information
                  </h3>
                </div>
                {editingField === 'classInfo' ? (
                  <div style={{
                    display: 'flex',
                    marginLeft: 'auto',
                    gap: '15px'
                  }}>
                    <button
                      onClick={handleSave}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      <Check size={16} color="green" />
                    </button>
                    <button
                      onClick={() => setEditingField(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      <X size={16} color="grey" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingField('classInfo');
                      setTempValue({
                        classChoice: classData.classChoice,
                        period: classData.period
                      });
                      setInputValue(classData.classChoice);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0,
                      marginLeft: 'auto'
                    }}
                  >
                    <Pencil size={16} color="grey" />
                  </button>
                )}
              </div>

              {editingField === 'classInfo' ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '30px'
                }}>
                  {/* Period Selector */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ marginLeft: '0px' }}><CalendarClock size={20} strokeWidth={1.5} /></div>
                    <h1 style={{ fontSize: '1rem', fontWeight: '400', margin: 0 }}>Period:</h1>
                    
                    {/* Selected Period */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      cursor: tempValue.period ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: '1'
                    }}>
                      <GlassContainer
                        variant={tempValue.period ? periodStyles[tempValue.period].variant : "clear"}
                        size={0}
                        contentStyle={{
                          fontSize: '.9rem',
                          fontWeight: '500',
                          color: tempValue.period ? periodStyles[tempValue.period].color : 'grey',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {tempValue.period || '-'}
                      </GlassContainer>
                    </div>

                    {/* Vertical Divider */}
                    <div style={{
                      width: '1px',
                      height: '40px',
                      backgroundColor: '#ccc',
                      margin: '0 10px'
                    }} />

                    {/* Period Options */}
                    <div style={{
                      display: 'flex',
                      gap: '5px'
                    }}>
                      {Object.keys(periodStyles).map((num) => (
                        <div key={num} style={{
                          zIndex: '2',
                          border: `2px solid ${Number(num) === Number(tempValue.period) ? 'lightgrey' : 'transparent'}`,
                          padding: '2px',
                          borderRadius: '200px'
                        }}>
                          <GlassContainer
                            size={0}
                            variant={periodStyles[num].variant}
                            onClick={() => setTempValue(prev => ({ ...prev, period: Number(num) }))}
                            style={{
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            contentStyle={{
                              fontSize: '.9rem',
                              fontWeight: '500',
                              color: periodStyles[num].color,
                              width: '20px',
                              height: '20px',
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

                  {/* Class Name Input */}
                  <div style={{
                    display: 'flex',
                    marginTop: '-30px',
                    alignItems: 'center',
                    width: '100%',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '20px'
                    }}>
                      <Shapes size={20} strokeWidth={1.5} />
                      <h1 style={{ fontSize: '1rem', fontWeight: '400', margin: 0 }}>Class Name:</h1>
                    </div>
                    <div
                      ref={inputAreaRef}
                      style={{
                        marginLeft: 'auto',
                        position: 'relative',
                        width: '300px'
                      }}
                    >
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
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
                          onMouseDown={(e) => e.preventDefault()}
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            maxHeight: '200px',
                            overflowY: 'auto',
                            width: 'calc(100% + 40px)',
                            background: 'white',
                            border: '1px solid #ccc',
                            borderTop: 'none',
                            borderRadius: '0 0 20px 20px',
                            zIndex: 1000,
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                          }}
                        >
                          {filteredSuggestions.length > 0 ? (
                            filteredSuggestions.map((suggestion, index) => (
                              <div
                                key={index}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setInputValue(suggestion);
                                  setShowSuggestions(false);
                                }}
                                style={{
                                  padding: '10px 20px',
                                  cursor: 'pointer',
                                  borderBottom: index < filteredSuggestions.length - 1 ? '1px solid #eee' : 'none'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                              >
                                {suggestion}
                              </div>
                            ))
                          ) : (
                            <div
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setInputValue(inputValue);
                                setShowSuggestions(false);
                              }}
                              style={{
                                padding: '10px 20px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: '#1EC8bc'
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                            >
                              <Plus size={16} />
                              Create "{inputValue}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '15px'
                }}>
                 

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    
                    gap: '10px',
                  }}>
                     <div style={{ marginLeft: '0px' }}><CalendarClock size={20} strokeWidth={1.5} /></div>
                    <h1 style={{ fontSize: '1rem', fontWeight: '400', margin: 0 }}>Period: 
                     </h1>
                   
                        <p style={{
                      margin: 0,
                      fontSize: '1rem', marginLeft: '20px',
                      color: 'black'
                    }}> {classData.period}
                    </p>
                  </div>
                   <div style={{
                    display: 'flex',
                    alignItems: 'center', 
                    gap: '10px',
                  }}>
                        <Shapes size={20} strokeWidth={1.5} />
                      <h1 style={{ fontSize: '1rem', fontWeight: '400', margin: 0 }}>Class Name:</h1>
                    <p style={{
                      margin: 0,
                      fontSize: '1rem', marginLeft: '20px',
                      color: 'black'
                    }}>
                      {classData.classChoice}
                    </p>
                  </div>

                </div>
              )}
            </GlassContainer>

            {/* Join Code */}
            <div>
            <GlassContainer
              variant="clear"
                size={0}
                style={{
                  zIndex: '2',
                }}
              contentStyle={{
                  padding: '30px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Users size={20} color="grey" />
                <h3 style={{
                  margin: 0,
                  fontSize: '1rem',
                  fontWeight: '500',
                  color: 'black'
                }}>
                  Join Code
                </h3>
              </div>

              <p style={{
                margin: 0,
                fontSize: '0.9rem',
                color: 'grey'
              }}>
                Share this code with students to join the class
              </p>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{
                  fontSize: '1rem',
                  color: 'black',
                  letterSpacing: '1px'
                }}>
                  {classData.classCode}
                </span>
                <button
                  onClick={handleCopyLink}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    position: 'relative'
                  }}
                >
                  {showCopySuccess ? (
                    <Check size={16} color="green" />
                  ) : (
                    <Copy size={16} color="grey" />
                  )}
                </button>
              </div>
            </GlassContainer>
            </div>

            {/* Training Data Management */}
            <GlassContainer
              variant="clear"
              size={0}
              style={{
                zIndex: '1',
                cursor: 'pointer'
              }}
              contentStyle={{
                padding: '30px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
              onClick={() => setShowTrainingData(true)}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Brain size={20} color="grey" />
                <h3 style={{
                  margin: 0,
                  fontSize: '1rem',
                  fontWeight: '500',
                  color: 'black'
                }}>
                  AI Training Data
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: '1rem',
                  color: 'grey',
                  marginLeft: '10px'
                }}>
                  ({classData.aiTrainingData?.length || 0}/50)
                </p>
              </div>
            </GlassContainer>
          </div>
        </div>
              </div>

      {/* Training Data Modal */}
      {showTrainingData && (
        <div style={{
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
          zIndex: 1000,
        }}>
          <GlassContainer
          style={{}}
          size={1}
          contentStyle={{ padding: '40px',
            
            maxWidth: '800px',
            position: 'relative',
            maxHeight: '80vh',
            overflowY: 'auto'}}>
          <div style={{
           
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Brain size={20} color="grey" />
                <h2 style={{
                  margin: 0,
                  fontSize: '1.2rem',
                  fontWeight: '500'
                }}>
                  AI Training Data
                </h2>
              <p style={{
                margin: 0,
                  fontSize: '1rem',
                  color: 'grey',
                  marginLeft: '10px'
                }}>
                  ({classData.aiTrainingData?.length || 0}/50)
                </p>
              </div>
              <button
                onClick={() => setShowTrainingData(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px'
                }}
              >
                <X size={20} color="grey" />
              </button>
            </div>

            <p style={{
              margin: '0 0 20px 0',
                fontSize: '0.9rem',
                color: 'grey'
              }}>
              Training examples collected from graded responses
              </p>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
              gap: '15px'
              }}>
              {classData.aiTrainingData?.map((item, index) => (
                <div
                    key={index}
                    style={{
                    padding: '15px',
                    borderBottom: '1px solid #ddd',
                    paddingBottom: '20px',
                    background: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => {
                    setSelectedTrainingData(index);
                    setTempScore(item.score);
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px'
                  }}>
                    <p style={{
                      margin: 0,
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      color: 'black'
                    }}>
                      Example #{index + 1}
                    </p>
                    <p style={{
                      margin: 0,
                      fontSize: '0.8rem',
                      color: 'grey'
                    }}>
                      Score: {item.score}/2
                    </p>
              </div>

                  <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
                  }}>
                    <div>
                      <p style={{
                        margin: 0,
                        fontSize: '0.8rem',
                        color: 'grey'
                      }}>
                        Question:
                      </p>
                      <p style={{
                        margin: '5px 0 0 0',
                        fontSize: '0.9rem',
                        color: 'black',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: '2',
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {item.question}
                      </p>
                    </div>

                    <div>
                      <p style={{
                        margin: 0,
                        fontSize: '0.8rem',
                        color: 'grey'
                      }}>
                        Response:
                      </p>
                      <p style={{
                        margin: '5px 0 0 0',
                        fontSize: '0.9rem',
                        color: 'black',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: '2',
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {item.studentResponse}
                      </p>
                    </div>

                    <div>
                      <p style={{
                        margin: 0,
                        fontSize: '0.8rem',
                        color: 'grey'
                      }}>
                        Feedback:
                      </p>
                      <p style={{
                        margin: '5px 0 0 0',
                        fontSize: '0.9rem',
                        color: 'black',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: '2',
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {item.feedback || 'No feedback provided'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  try {
                    const classRef = doc(db, 'classes', classId);
                    updateDoc(classRef, {
                      aiTrainingData: []
                    });
                    setClassData(prev => ({
                      ...prev,
                      aiTrainingData: []
                    }));
                    setShowTrainingData(false);
                  } catch (error) {
                    console.error("Error clearing training data:", error);
                  }
                }}
                style={{
                  background: 'none',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  color: '#ef4444',
                  fontSize: '0.9rem',
                  width: 'fit-content',
                  marginTop: '10px'
                }}
              >
                Clear Training Data
              </button>
            </div>
          </div>
          </GlassContainer>
        </div>
      )}

      {/* Training Data Edit Modal */}
      {selectedTrainingData !== null && (
              <div style={{
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
          zIndex: 1001,
        }}>
          <div style={{
            backgroundColor: 'white',
            border: '1px solid lightgrey',
            padding: '40px',
            borderRadius: '15px',
            width: '80%',
            maxWidth: '800px',
            position: 'relative',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{
                  margin: 0,
                fontSize: '1.2rem',
                fontWeight: '500'
              }}>
                Training Example #{selectedTrainingData + 1}
              </h2>
              <button
                onClick={() => {
                  setSelectedTrainingData(null);
                  setEditingTrainingData(null);
                  setTempScore(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px'
                }}
              >
                <X size={20} color="grey" />
              </button>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <div>
                <p style={{
                  margin: '0 0 10px 0',
                  fontSize: '0.9rem',
                  color: 'grey'
                }}>
                  Score:
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  {editingTrainingData === selectedTrainingData ? (
                    <>
                      <input
                        type="number"
                        min="0"
                        max="2"
                        value={tempScore}
                        onChange={(e) => setTempScore(Math.min(2, Math.max(0, parseInt(e.target.value) || 0)))}
                        style={{
                          width: '60px',
                          padding: '8px 15px',
                          borderRadius: '8px',
                          border: '1px solid #ddd',
                          fontSize: '0.9rem',
                          fontFamily: "'montserrat', sans-serif"
                        }}
                      />
                      <span style={{ color: 'grey' }}>/2</span>
                      <div style={{
                        display: 'flex',
                        gap: '10px',
                        marginLeft: '10px'
                      }}>
                        <button
                          onClick={() => {
                            const updatedData = [...classData.aiTrainingData];
                            updatedData[selectedTrainingData] = {
                              ...updatedData[selectedTrainingData],
                              score: tempScore,
                              feedback: updatedData[selectedTrainingData].tempFeedback || updatedData[selectedTrainingData].feedback
                            };
                            const classRef = doc(db, 'classes', classId);
                            updateDoc(classRef, {
                              aiTrainingData: updatedData
                            });
                            setClassData(prev => ({
                              ...prev,
                              aiTrainingData: updatedData
                            }));
                            setEditingTrainingData(null);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          <Check size={16} color="green" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingTrainingData(null);
                            setTempScore(classData.aiTrainingData[selectedTrainingData].score);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          <X size={16} color="grey" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span style={{
                        fontSize: '0.9rem',
                  color: 'black'
                }}>
                        {classData.aiTrainingData[selectedTrainingData].score}/2
                      </span>
                      <button
                        onClick={() => {
                          setEditingTrainingData(selectedTrainingData);
                          setTempScore(classData.aiTrainingData[selectedTrainingData].score);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          marginLeft: '10px'
                        }}
                      >
                        <Pencil size={16} color="grey" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div>
                <p style={{
                  margin: '0 0 10px 0',
                  fontSize: '0.9rem',
                  color: 'grey'
                }}>
                  Question:
                </p>
              <p style={{
                margin: 0,
                  fontSize: '0.9rem',
                  color: 'black'
                }}>
                  {classData.aiTrainingData[selectedTrainingData].question}
                </p>
              </div>

              <div>
                <p style={{
                  margin: '0 0 10px 0',
                fontSize: '0.9rem',
                color: 'grey'
              }}>
                  Response:
                </p>
                <p style={{
                  margin: 0,
                  fontSize: '0.9rem',
                  color: 'black'
                }}>
                  {classData.aiTrainingData[selectedTrainingData].studentResponse}
                </p>
              </div>

              <div>
                <p style={{
                  margin: '0 0 10px 0',
                  fontSize: '0.9rem',
                  color: 'grey'
                }}>
                  Feedback:
                </p>
                {editingTrainingData === selectedTrainingData ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                    <textarea
                      value={classData.aiTrainingData[selectedTrainingData].tempFeedback || classData.aiTrainingData[selectedTrainingData].feedback || ''}
                      onChange={(e) => {
                        const updatedData = [...classData.aiTrainingData];
                        updatedData[selectedTrainingData] = {
                          ...updatedData[selectedTrainingData],
                          tempFeedback: e.target.value
                        };
                        setClassData(prev => ({
                          ...prev,
                          aiTrainingData: updatedData
                        }));
                      }}
                    style={{
                        width: '100%',
                        padding: '8px 15px',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        fontSize: '0.9rem',
                        fontFamily: "'montserrat', sans-serif",
                        minHeight: '100px',
                        resize: 'vertical'
                      }}
                    />
                    <div style={{
                      display: 'flex',
                      gap: '10px',
                      justifyContent: 'flex-end'
                    }}>
                      <button
                        onClick={() => {
                          const updatedData = [...classData.aiTrainingData];
                          updatedData[selectedTrainingData] = {
                            ...updatedData[selectedTrainingData],
                            feedback: updatedData[selectedTrainingData].tempFeedback,
                            score: tempScore
                          };
                          const classRef = doc(db, 'classes', classId);
                          updateDoc(classRef, {
                            aiTrainingData: updatedData
                          });
                          setClassData(prev => ({
                            ...prev,
                            aiTrainingData: updatedData
                          }));
                          setEditingTrainingData(null);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        <Check size={16} color="green" />
                      </button>
                      <button
                        onClick={() => setEditingTrainingData(null)}
                      style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        <X size={16} color="grey" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}>
                    <p style={{
                      margin: 0,
                      fontSize: '0.9rem',
                      color: 'black'
                    }}>
                      {classData.aiTrainingData[selectedTrainingData].feedback || 'No feedback provided'}
                    </p>
                    <button
                      onClick={() => setEditingTrainingData(selectedTrainingData)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        marginLeft: '10px'
                      }}
                    >
                      <Pencil size={16} color="grey" />
                    </button>
              </div>
                )}
          </div>
        </div>
      </div>
        </div>
      )}
    </div>
  );
};

export default TeacherClassSettings;