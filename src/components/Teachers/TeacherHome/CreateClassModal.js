import React, { useState, useEffect } from 'react';
import { CalendarClock, SquareX, ChevronDown, ChevronUp, Shapes, SquarePlus } from 'lucide-react';

const CreateClassModal = ({ handleCreateClass, setShowCreateClassModal }) => {
  const [period, setPeriod] = useState(1);
  const [classChoice, setClassChoice] = useState('');
  const [customClass, setCustomClass] = useState('');
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [isClassSelectorOpen, setIsClassSelectorOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  const classOptions = [
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
'Systems Engineering', 'Aerospace Engineering', 'Marine Engineering', 
  ];

  const [filteredClasses, setFilteredClasses] = useState(classOptions);

  const periodColors = {
    1: { background: '#A3F2ED', color: '#1CC7BC' },
    2: { background: '#F8CFFF', color: '#E01FFF' },
    3: { background: '#FFCEB2', color: '#FD772C' },
    4: { background: '#FFECA9', color: '#F0BC6E' },
    5: { background: '#AEF2A3', color: '#4BD682' },
    6: { background: '#BAA9FF', color: '#8364FF' },
    7: { background: '#8296FF', color: '#3D44EA' },
    8: { background: '#FF8E8E', color: '#D23F3F' },
  };

  useEffect(() => {
    setFilteredClasses(
      classOptions.filter(cls => 
        cls.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm]);

  const togglePeriodDropdown = () => {
    setIsPeriodDropdownOpen(!isPeriodDropdownOpen);
  };
  const isFormValid = period !== null && (classChoice !== '' || customClass.trim() !== '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isFormValid) {
      handleCreateClass(e, period, classChoice || customClass);
    }
  };
  const selectPeriod = (selectedPeriod) => {
    setPeriod(selectedPeriod);
    setIsPeriodDropdownOpen(false);
  };

  const toggleClassSelector = () => {
    setIsClassSelectorOpen(!isClassSelectorOpen);
  };

  const selectClass = (cls) => {
    setClassChoice(cls);
    setIsClassSelectorOpen(false);
  };

  const toggleCustomMode = () => {
    setIsCustomMode(!isCustomMode);
    if (!isCustomMode) {
      // Entering custom mode
      setClassChoice(''); // Clear the selected class
      setCustomClass(''); // Clear any previously entered custom class
    } else {
      // Exiting custom mode
      setSearchTerm('');
    }
  };

  const handleCustomClassSubmit = () => {
    if (customClass.trim()) {
      setClassChoice(customClass.trim());
      setIsClassSelectorOpen(false);
      setIsCustomMode(false);
    }
  };

  return (
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
      zIndex: 100,
    }}>
      <div style={{
        backgroundColor: 'rgba(255,255,255,.8)',
        border: '1px solid lightgrey',
        padding: '40px',
        borderRadius: '15px',
        width: '80%',
        position: 'relative',
        maxWidth: '800px',
      }}>
     
        
        <h2 style={{
          fontFamily: "'montserrat', sans-serif",
          fontWeight: '600',
          marginTop: '-10px' ,
          marginLeft: '0px',
          fontSize: '40px',
          

        }}>Create Class</h2>
       
        <form onSubmit={handleSubmit}>
          {/* Period Selector */}
          <div style={{ border: '2px solid #f4f4f4', borderRadius: '10px', marginBottom: '20px' }}>
            <div 
              onClick={togglePeriodDropdown}
              style={{
                cursor: 'pointer',
                padding: '0px',
                borderRadius: '5px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <div style={{marginLeft: '20px', fontWeight: '600'}}><CalendarClock size={25} /></div>
              <h1 style={{ fontSize: '25px', marginLeft: '20px', fontWeight: '600' }}>Class Period:</h1>
              <h1 style={{
                fontSize: '30px',
                width: '40px',
                height: '40px',
                marginLeft: '30px',
                textAlign: 'center',
                borderRadius: '5px',
                backgroundColor: periodColors[period].background,
                color: periodColors[period].color,
              }}>{period}</h1>
              {isPeriodDropdownOpen ? <ChevronUp style={{ marginLeft: 'auto', marginRight:'20px' }} /> : <ChevronDown style={{ marginLeft: 'auto',marginRight:'20px' }} />}
            </div>
            {isPeriodDropdownOpen && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '15px',
                margin: '20px',
              }}>
                {Object.keys(periodColors).map((num) => (
                  <div
                    key={num}
                    onClick={() => selectPeriod(Number(num))}
                    style={{
                      cursor: 'pointer',
                      fontSize: '30px',
                      width: '40px',
                      height: '40px',
                      textAlign: 'center',
                      borderRadius: '10px',
                      fontFamily: "'montserrat', sans-serif",
                      fontWeight: 'bold',
                      backgroundColor: 'white',
                      border: '2px solid #f4f4f4',
                      color: periodColors[num].color,
                    }}
                  >
                    {num}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Class Selector */}
          <div style={{ borderTop: '1px solid lightgrey',  marginBottom: '20px' }}>
            <div 
              onClick={toggleClassSelector}
              style={{
                cursor: 'pointer',
                padding: '0px',
                borderRadius: '5px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <div style={{marginLeft: '20px'}}><Shapes size={25} /></div>
              <h1 style={{ fontSize: '25px', marginLeft: '20px', fontWeight: '600'}}>Select Class:</h1>
              <h1 style={{
                fontSize: '16px',
                marginLeft: '20px',
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontWeight: '600',
                whiteSpace: 'nowrap',
                color: classChoice? 'black':'grey' ,
              }}>{classChoice || 'not selected'}</h1>
              {isClassSelectorOpen ? <ChevronUp style={{ marginLeft: 'auto', marginRight:'20px' }} /> : <ChevronDown style={{ marginLeft: 'auto',marginRight:'20px' }} />}
            </div>
            {isClassSelectorOpen && (
              <div style={{
                margin: '20px',
                maxHeight: '500px',
                overflow: 'hidden'
              }}>
                {isCustomMode ? (
                  <>
                    <input
                      type="text"
                      value={customClass}
                      onChange={(e) => setCustomClass(e.target.value)}
                      placeholder="Custom Class Name"
                      style={{
                        width: '64%',
                        marginRight: '-22%',
                        padding: '10px',
                        marginBottom: '20px',
                        paddingLeft: '20px',
                        borderRadius: '10px',
                        fontFamily: "'montserrat', sans-serif",
                        fontWeight: '600',
                        outline: 'none',
                        background: '#f4f4f4',
                        fontSize: '25px',
                        border: '0px solid #ccc',
                      }}
                    />
                    <button
                      onClick={handleCustomClassSubmit}
                      style={{
                        width: '22%',
                        padding: '8px',
                        marginRight: '5%',
                        color: '#348900',
                        marginBottom: '20px',
                        paddingLeft: '20px',
                        borderRadius: '10px',
                        fontFamily: "'montserrat', sans-serif",
                        fontWeight: '600',
                        outline: 'none',
                        background: 'transparent',
                        fontSize: '30px',
                        cursor: 'pointer',
                        border: 'none',
                        position: 'relative'
                      }}
                    >
                      <div style={{marginTop: '20px', background: 'white', width: '40px', height: '40px', borderRadius: '10px', right: '10px', position: 'absolute', top: '-40px'}}>
                      <SquarePlus size={40} /></div>
                    </button> 
                     <button
                      onClick={toggleCustomMode}
                      style={{
                        width: '25%',
                        color: 'grey',
                        cursor: 'pointer',
                        marginBottom: '20px',
                        height: '50px',
                        borderRadius: '10px',
                        fontFamily: "'montserrat', sans-serif",
                        fontWeight: '600',
                        outline: 'none',
                        background: '#f4f4f4',
                        fontSize: '25px',
                        border: '2px solid lightgrey',
                      }}
                    >
                      Presets
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Search classes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        width: '67%',
                        marginRight: '4%',
                        padding: '10px',
                        marginBottom: '20px',
                        paddingLeft: '20px',
                        borderRadius: '10px',
                        fontFamily: "'montserrat', sans-serif",
                        fontWeight: '600',
                        outline: 'none',
                        background: '#f4f4f4',
                        fontSize: '25px',
                        border: '0px solid #ccc',
                      }}
                    />
                    <button
                      onClick={toggleCustomMode}
                      style={{
                        width: '22%',
                        height: '50px',
                        color: '#FCAC18',
                        marginBottom: '20px',
                        borderRadius: '10px',
                        fontFamily: "'montserrat', sans-serif",
                        fontWeight: '600',
                        outline: 'none',
                        background: '#FFEF9C',
                        cursor: 'pointer',
                        fontSize: '25px',
                        border: '2px solid #FCAC18',
                      }}
                    >
                      Custom
                    </button>
                  </>
                )}
                
                {!isCustomMode && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '10px',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    paddingRight: '10px'
                  }}>
                    {filteredClasses.map(cls => (
                      <button
                        key={cls}
                        onClick={() => selectClass(cls)}
                        style={{
                          padding: '10px',
                          color: 'grey',
                          background: 'white',
                          borderRadius: '10px',
                          fontFamily: "'montserrat', sans-serif",
                          fontWeight: 'bold',
                          border: '2px solid #f4f4f4',
                          height: '60px',
                          paddingLeft: '10px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '12px',
                        }}
                      >
                        {cls}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
          <button 
              type="submit"
              disabled={!isFormValid}
              style={{
                width: '200px',
                marginLeft: '0px',
                height: '40px',
                lineHeight: '10PX',
                padding: '5px 5px',
                fontWeight: '600',
                fontSize: '16px',
                borderRadius: '5px',
                marginTop: '-10px',
                fontFamily: '"montserrat", sans-serif',
                backgroundColor: 'white',
                border: '1px solid lightgrey',
                color: isFormValid ? '#348900' : '#a3a3a3',
                cursor: 'pointer',
                transition: '.3s',
                marginBottom: '10px', 

               
                fontSize: '18px',
                fontWeight: '600'
              }}
            >
              Create Class
            </button>
            
          <button 
                  onClick={() => setShowCreateClassModal(false)}
         
            style={{
              width: '100px',
              marginRight: 'auto',
              marginLeft: '30px',
              height: '40px',
              lineHeight: '10PX',
              padding: '5px 5px',
              fontWeight: '600',
              fontSize: '16px',
              borderRadius: '5px',
              marginTop: '-10px',
              fontFamily: '"montserrat", sans-serif',
              backgroundColor: 'white',
              border: '1px solid lightgrey',
              color: 'grey',
              cursor: 'pointer',
              transition: '.3s',
              marginBottom: '10px'
            }}
     
          >
            Cancel
          </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateClassModal;