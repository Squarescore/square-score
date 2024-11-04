import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Link as ScrollLink } from 'react-scroll';
import FeatureTicker from './FeatureTicker';
import FooterAuth from './FooterAuth';
import './BackgroundDivs.css'; // Import the CSS file
import { ArrowRight, ArrowRightFromLine, Bot, ChevronLeft, ChevronRight, MoveLeft, MoveRight } from 'lucide-react';
const Auth = () => {
  const [navbarBg, setNavbarBg] = useState('rgba(255,255,255,0.95)');

  const [selectedFormat, setSelectedFormat] = useState('SAQ*');
  const [currentSlide, setCurrentSlide] = useState(0);

  const formats = [
    {
      id: 'SAQ*',
      name: 'SAQ*',
      color: '#020CFF',
      description: 'Adaptive short answer assessments automatically adjust question difficulty based on student responses, making each assessment uniquely challenging. This format excels at providing personalized learning paths while accurately measuring student knowledge.'
    },
    {
      id: 'MCQ*',
      name: 'MCQ*',
      color: '#2BB514',
      description: 'These assessments intelligently select multiple choice questions based on previous answers, combining automated grading efficiency with personalized progression. This format is ideal for large-scale testing while maintaining individualized difficulty adjustment.'
    },
    {
      id: 'SAQ',
      name: 'SAQ',
      color: '#020CFF',
      description: 'Fixed-format open response questions that remain consistent for all students, allowing written explanations of understanding. This classic format effectively measures critical thinking and detailed knowledge expression.'
    },
    {
      id: 'MCQ',
      name: 'MCQ',
      color: '#2BB514',
      description: 'Standard multiple choice tests with preset questions and answer options, providing consistent assessment across all students. This format offers efficient grading and clear metrics while maintaining reliable evaluation standards.'
    }
  ];

  const handlePrevSlide = () => {
    const newSlide = currentSlide === 0 ? formats.length - 1 : currentSlide - 1;
    setCurrentSlide(newSlide);
    setSelectedFormat(formats[newSlide].id);
  };

  const handleNextSlide = () => {
    const newSlide = currentSlide === formats.length - 1 ? 0 : currentSlide + 1;
    setCurrentSlide(newSlide);
    setSelectedFormat(formats[newSlide].id);
  };

  const handleFormatSelect = (formatId) => {
    setSelectedFormat(formatId);
    setCurrentSlide(formats.findIndex(f => f.id === formatId));
  };
  const formatButtonText = (text) => {
    if (text.includes('*')) {
      return (
        <>
          {text.replace('*', '')}
          <span style={{ color: '#FFAE00' }}>*</span>
        </>
      );
    }
    return text;
  };




  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setNavbarBg('rgba(250, 250, 250, 0.7)');
      } else {
        setNavbarBg('rgba(255, 255, 255, 0.7)');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const generateUniquePositions = useCallback((count, size, margin) => {
    const positions = [];
    const documentHeight = document.documentElement.scrollHeight;
    const documentWidth = window.innerWidth;

    for (let i = 0; i < count; i++) {
      let newPos;
      let attempts = 0;
      do {
        newPos = {
          top: Math.random() * (documentHeight - size) + 'px',
          left: Math.random() * (documentWidth - size) + 'px',
        };
        attempts++;
      } while (positions.some(pos => {
        const dx = parseFloat(newPos.left) - parseFloat(pos.left);
        const dy = parseFloat(newPos.top) - parseFloat(pos.top);
        return Math.sqrt(dx * dx + dy * dy) < size + margin;
      }) && attempts < 100);

      if (attempts < 100) {
        positions.push(newPos);
      }
    }

    return positions;
  }, []);

  const getRandomColorClass = () => {
    const colors = ['color-1', 'color-2', 'color-3', 'color-4', 'color-5'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const positions = generateUniquePositions(20, 200, 100);

  return (
    <div style={{ position: 'relative', background: '#fcfcfc' }}>
      {/* Background Divs */}
   
      {/* Main Content */}
      <div  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ 
          position: 'fixed', top: 0, width: '100%', display: 'flex',boxShadow: '1px 1px 5px 1px rgb(0,0,155,.1)',
          padding: '0px 0', alignItems: 'center', height: '60px', color: 'grey', zIndex: 1000,
          backgroundColor: navbarBg, transition: 'background-color 0.3s ease',
          backdropFilter: 'blur(7px)',
        }}>
          <div style={{ marginLeft: 'auto', marginRight: 'auto', display: 'flex'}}>
            <div style={{ width: '1280px', display: 'flex', backgroundColor: 'transparent', padding: '0px 0', alignItems: 'center', height: '70px', color: 'grey', marginRight: 'auto', marginLeft: 'auto' }}>
              
            <div style={{display: 'flex',  position: 'absolute',
      left: '30px',
      top: '50%',
      transform: 'translateY( -50%)'}}>
              <img style={{width: '25px',  }} src="/SquareScore.svg" alt="logo" />
              <h1 style={{fontWeight: '600', color: 'black', paddingLeft: '10px', borderLeft: '4px solid #f4f4f4', marginLeft: '10px', fontSize: '20px'}}>SquareScore</h1>
              </div>
            </div>
            <div style={{ width: '380px', display: 'flex', position: 'fixed', right: '20px' }}>
            <Link to="/signup" style={{
                height: '30px', marginTop: '20px', lineHeight: '30px', borderRadius: '8px',
                fontWeight: '600', background: 'transparent',  color: 'black',

                textDecoration: 'none', width: '160px', marginLeft: 'auto',
               textAlign: 'center', transition: '.2s',
                fontFamily: "'montserrat', sans-serif", fontSize: '16px'
              }}
              onMouseEnter={(e) => {     e.target.style.background = '#f4f4f4';
                e.target.style.border = '3px solid lightgrey';
                
                e.target.style.color = 'grey';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                
                e.target.style.color = 'black';
                e.target.style.border = '3px solid transparent';
          
              }}>Create Account</Link>
            
              <Link to="/login" style={{
               height: '30px', marginTop: '20px', lineHeight: '30px', borderRadius: '8px',
               fontWeight: '600', background: 'transparent',  color: 'black',

               textDecoration: 'none', width: '100px', marginLeft: '10px',
              textAlign: 'center', transition: '.2s',
               fontFamily: "'montserrat', sans-serif", fontSize: '16px'
             }}
             onMouseEnter={(e) => {     e.target.style.background = '#f4f4f4';
               e.target.style.border = '3px solid lightgrey';
               
               e.target.style.color = 'grey';
             }}
             onMouseLeave={(e) => {
               e.target.style.background = 'transparent';
               
               e.target.style.color = 'black';
               e.target.style.border = '3px solid transparent';}}
               >Login</Link>
            </div>
          </div>
        </div>



        <div  className="white-background" style={{ display: 'flex', flexDirection: 'column', width: '100%',   marginTop: '150px' }}>
          
        
<div style={{width: '1000px',marginLeft: 'auto', marginRight: 'auto',}}>
        <div style={{ display: 'flex', width: '1200px', marginTop: '70px', marginLeft: '0px', position: 'relative'  }}>
          <h1 style={{ width: '800px', fontFamily: "'montserrat', sans-serif", color: 'black', marginTop: '-0px', marginLeft: '0px', fontWeight: '600', fontSize: '35px', lineHeight: '1.4' }}>
            <span style={{background: '#F5B6FF', color: '#E441FF', paddingLeft: '5px', marginRight: '10px', paddingRight: '5px'}}>Generate</span> 
            and 
            <span style={{background: '#92A3FF', color: '#020CFF', paddingLeft: '5px', paddingRight: '5px',marginRight: '10px', marginLeft: '10px',}}>grade</span>  
            <span style={{background: '#FFEAAF', color: '#FFAE00', paddingLeft: '5px', paddingRight: '5px', marginRight: '10px', marginLeft: '0px',}}>adaptive</span> <br></br>

            
            <span style={{background: '#92A3FF', color: '#020CFF', paddingLeft: '5px', paddingRight: '5px',marginRight: '10px', marginLeft: '0px', }}>short-answer</span>  
            
            and 
            <span style={{background: '#AEF2A3', color: '#2BB514', paddingLeft: '5px', paddingRight: '5px',marginRight: '10px', marginLeft: '10px', }}>multiple-choice</span> <br></br> 
           
          
           
            assignments with 
            <span style={{background: '#F5B6FF', color: '#E441FF', paddingLeft: '5px', marginRight: '10px',marginLeft: '10px',  paddingRight: '5px'}}>AI.</span> 
           
          </h1>
          <img src='/Mac.png' style={{ width: '450px', marginTop: '-20px', position: 'absolute', right: '150px', top: '-30px'}} />
          <a href="https://www.youtube.com/watch?v=vAT3O0b3eDA" 
            target="_blank" 
            rel="noopener noreferrer"  style={{

              height: '20px', lineHeight: '30px',  position: 'absolute', right: '200px', bottom: '-100px',
               fontWeight: '600', padding: '8px',
            width: '110px', display: 'flex',
              textDecoration: 'none', borderRadius: '10px', textAlign: 'center',color: 'black', background: 'white',boxShadow: '1px 1px 5px 1px rgb(0,0,155,.1)', 
              transition: '.2s', fontFamily: "'montserrat', sans-serif", fontSize: '20px'
            }}
          ><h1 style={{fontWeight: '600', fontSize: '20px',marginTop: '-5px', marginLeft: '10px' }}>Demo</h1> <ArrowRight style={{marginTop: '-1px', marginLeft: '10px'}}/></a>

          </div>

          <div style={{ width: '800px',  display: 'flex', marginLeft: '-50px', marginTop: '20px' }}>
            <Link to="/signup"  style={{
              height: '40px', lineHeight: '40px', marginTop: '20px', marginBottom: '20px',
              display: 'block', color: 'black', background: 'white',boxShadow: '1px 1px 5px 1px rgb(0,0,155,.1)', fontWeight: '600', padding: '8px',
              width: '320px',  textDecoration: 'none', 
              borderRadius: '10px', textAlign: 'center', transition: '.3s', marginLeft: '50px',
              fontFamily: "'montserrat', sans-serif", fontSize: '25px'
            }}
            onMouseEnter={(e) => {     e.target.style.boxShadow = '1px 1px 10px 1px rgb(0,0,155,.1)';
            }}
            onMouseLeave={(e) => {     e.target.style.boxShadow = '1px 1px 5px 1px rgb(0,0,155,.1)';
            }}>Create an Account +</Link>

            <Link to="/login"  style={{
              height: '40px', lineHeight: '40px', marginTop: '20px', marginBottom: '20px',
              color: 'black', background: 'white',boxShadow: '1px 1px 5px 1px rgb(0,0,155,.1)', fontWeight: '600', padding: '8px',
              display: 'block', width: '140px', marginLeft: '30px',
              textDecoration: 'none', borderRadius: '10px', textAlign: 'center',
              transition: '.2s', fontFamily: "'montserrat', sans-serif", fontSize: '25px'
            }}
            onMouseEnter={(e) => {     e.target.style.boxShadow = '1px 1px 10px 1px rgb(0,0,155,.1)';
            }}
            onMouseLeave={(e) => {     e.target.style.boxShadow = '1px 1px 5px 1px rgb(0,0,155,.1)';
            }}>Login</Link>

           
          </div>
          <h1 style={{fontSize: '20px', fontWeight: '600', marginLeft: '-0px', color: 'grey', marginTop:'0px'}}>Free for Teachers</h1>
        </div>






         
      
      
        </div>



     

        <div style={{ width: '1000px', marginTop: '100px' }}>
      <h1 style={{
        textAlign: 'left',
        fontSize: '50px',
        fontFamily: '"montserrat", sans-serif',
        fontWeight: '600',
        marginBottom: '40px'
      }}>
        4 Formats, <span style={{color: '#E01FFF', background: '#F5B6FF', paddingLeft: '10px'}}> Unlimited </span>Possibilities
      </h1>

      <div style={{
        display: 'flex', 
        width: '480px',
        justifyContent: 'center',
        gap: '20px',
        marginTop: '60px',
        marginBottom: '40px'
      }}>
        {formats.map(format => (
          <button
            key={format.id}
            onClick={() => handleFormatSelect(format.id)}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '5px',
              fontSize: '25px',
              fontFamily: '"montserrat", sans-serif',
              fontWeight: '700',
              color: format.color,
              background: selectedFormat === format.id ? 'white' : '#fcfcfc',
              boxShadow:selectedFormat === format.id ? '1px 1px 5px 1px rgb(0,0,155,.1)' : 'none' ,
              
              cursor: 'pointer'
            }}
          >
            {formatButtonText(format.id)}
          </button>
        ))}
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0px',
        borderRadius: '10px'
      }}>
        <ChevronLeft 
          size={40}
          style={{ cursor: 'pointer', color: 'grey' }}
          onClick={handlePrevSlide}
        />

        <div style={{
          textAlign: 'left',
          width: '90%',
          height: '260px',
          boxShadow: '1px 1px 5px 1px rgb(0,0,155,.1)',
          background: 'white',
          borderRadius: '20px'
        }}>
          <h2 style={{
            fontSize: '32px',
            fontFamily: '"montserrat", sans-serif',
            fontWeight: 'bold',
            marginBottom: '20px',
            marginTop: '60px',
            marginLeft: '100px',
            color: formats[currentSlide].color
          }}>
            {formatButtonText(formats[currentSlide].name)}
          </h2>
          <p style={{
            fontSize: '20px',
            fontFamily: '"montserrat", sans-serif',
            color: '#666',
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            {formats[currentSlide].description}
          </p>
        </div>

        <ChevronRight 
          size={40}
          style={{ cursor: 'pointer',color: 'grey' }}
          onClick={handleNextSlide}
        />
      </div>
    </div>



    <div  style={{  width: '100%', height: '450px', boxShadow: '1px 1px 5px 1px rgb(0,0,155,.1)', background: 'white', marginTop: '100px'}}>
        <div  style={{  width: '1000px', display: 'flex',marginLeft: 'auto', marginRight: 'auto', }}>
           <div>
           <h1 style={{fontSize: '40px', width: '500px', color: 'black', fontWeight: '600',}}>
                
                Adaptive Assignments
                </h1>   
          <img src='/Adaptive.svg' style={{width: '500px',  marginLeft: '-30px', marginTop: '30px' }}/>
          </div>
         <h1 style={{fontSize: '25px',  width: '410px', color: 'grey', fontWeight: '600', lineHeight: '2.5', marginTop: '40px', marginLeft:'20px',borderLeft: '4px solid #f4f4f4', paddingLeft: '50px'}}>Our adaptive assignments give 

students questions at  their level,

allowing students get the workload 

they need to succeed. Reducing stress

while increasing retention </h1>
          

         
</div>
       
             
        </div>






            <div style={{width: '1000px', marginLeft: 'auto', marginRight: 'auto', display: 'flex', position: 'relative'}}>

            <div style={{width: '460px', boxShadow: '1px 1px 5px 1px rgb(0,0,155,.1)', borderRadius: '20px',background: 'white', marginTop: '100px', padding: '10px 25px'}}>
            <h1 style={{fontSize: '38px',  fontWeight: '600',marginLeft:'10px',}}>100% Student X <br></br>Teacher Team</h1>
            <p style={{fontSize: '20px',  width: '470px', color: 'grey', fontWeight: '600', lineHeight: '2.5', marginTop: '30px', marginLeft:'10px', paddingLeft: '0px'}}>
            Understanding classroom dynamics and having used

dozens of software tools, we added features to make 

life easier for both teachers and students.

            </p>
            </div>
            <ArrowRight size={40} style={{position: 'absolute', top: '270px', zIndex: '100', left: '525px', color: 'grey'}}/>
            <div style={{width: '370px',borderRadius: '20px', boxShadow: '1px 1px 5px 1px rgb(0,0,155,.1)', background: 'white', marginTop: '100px', padding: '10px 25px', marginLeft: '70px'}}>
            <h1 style={{fontSize: '30px', fontWeight: '600',marginLeft:'20px', }}>User Favorites</h1>
            <p style={{fontSize: '25px',  width: '450px', color: 'grey', fontWeight: '600', lineHeight: '2.3', marginTop: '60px', marginLeft:'20px', paddingLeft: '0px'}}>
            - Instant tailored feedback
            <br></br>
            - Built in Extended Time
            <br></br>
            - Unlimited Sources
            <br></br>
            - Lockdown Browser

            </p>
            </div>
            </div>


   
            <div style={{width: '1000px',marginBottom: '100px', display: 'flex', boxShadow: '1px 1px 5px 1px rgb(0,0,155,.1)', background: 'white', borderRadius: '20px', height: '150px', marginTop: '100px'}}>
<div style={{width:'100px', height:' 130px', border: '10px solid #E01FFF', color: '#E01FFF',borderRadius: '20px 0px 0px 20px ', background: '#f7c4ff'}}>
<Bot size={80} style={{ marginTop: '20px', marginLeft: '10px'}} />

</div>

<div style={{width: '780px', marginLeft: '20px', position: 'relative'}}>
<div style={{display: 'flex',height: '25px', paddingBottom: '30px'}}><h1 style={{fontWeight: '600'}}>AI Safety</h1>
<Link to='/privacyPolicy'
             style={{background: 'none', color: 'blue', height: '30px', position: 'absolute', left: '160px', top: '30px', fontFamily: '"montserrat", sans- serif', fontWeight: 'bold', textDecoration: 'underline', }}
             >
             -  Privacy Policy
           
             </Link>
</div>  
  <p style={{ fontSize: '20px', fontWeight: '600', color: 'grey'}}>Squarescore uses Anthropic and OpenAI APIs for assessment generation and grading. Student data is not used to train AI models.</p>
</div>
</div>



         

     
   
          <FooterAuth style={{ marginTop: '100px', height: '200px' }} />
        
      </div>
    </div>
  );
};

export default Auth;
