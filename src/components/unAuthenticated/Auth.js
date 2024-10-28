import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Link as ScrollLink } from 'react-scroll';
import FeatureTicker from './FeatureTicker';
import FooterAuth from './FooterAuth';
import './BackgroundDivs.css'; // Import the CSS file
import { SquareArrowRight } from 'lucide-react';
const Auth = () => {
  const [navbarBg, setNavbarBg] = useState('rgba(255,255,255,0.7)');







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
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Background Divs */}
      {positions.map((pos, index) => (
          <div
            key={index}
            className={`background-div ${getRandomColorClass()}`}
            style={{
              top: pos.top,
              left: pos.left,
              position: 'absolute',
              width: '200px',
              height: '200px',
             
            }}
          />
        ))}
      
      {/* Main Content */}
      <div  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ 
          position: 'fixed', top: 0, width: '100%', display: 'flex',
          padding: '0px 0', alignItems: 'center', height: '70px', color: 'grey', zIndex: 1000,
          backgroundColor: navbarBg, transition: 'background-color 0.3s ease',
          backdropFilter: 'blur(7px)',
        }}>
          <div style={{ marginLeft: 'auto', marginRight: 'auto', display: 'flex'}}>
            <div style={{ width: '1280px', display: 'flex', backgroundColor: 'transparent', padding: '0px 0', alignItems: 'center', height: '70px', color: 'grey', marginRight: 'auto', marginLeft: 'auto' }}>
              <div style={{ width: '250px', display: 'flex', position: 'fixed', left: '-40px' }}>
                <Link
                 to="/privacyPolicy"
                  smooth={true}
                  duration={500}
                  style={{
                    height: '20px', marginTop: '0px', lineHeight: '20px',
                    background: 'transparent', borderRadius: '10px',
                    fontWeight: 'bold',
                   textDecoration: 'none', color: 'black',
                    width: '200px', marginLeft: '90px', padding: '10px 20px 10px 20px',
                    textAlign: 'center', transition: '.1s', fontFamily: "'montserrat', sans-serif",
                    fontSize: '16px', cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => { e.target.style.opacity = '65%'; }}
                  onMouseLeave={(e) => { e.target.style.opacity = '100%'; }}
                >
                  Privacy Policy
                 
                </Link>
              </div>
              <img style={{ width: '320px', marginLeft: 'auto', marginRight: 'auto' }} src="/SquareScoreLong.svg" alt="logo" />
            </div>
            <div style={{ width: '380px', display: 'flex', position: 'fixed', right: '20px' }}>
              <Link to="/signup" style={{
                height: '10px', marginTop: '20px', width: '160px', lineHeight: '10px', borderRadius: '8px',
                fontWeight: 'bold',  background: '#AEF2A3', color: '#2BB514',border: '4px solid #2BB514 ', 
                textDecoration: 'none',  marginLeft: '30px',
                padding: '10px', textAlign: 'center', transition: '.2s',
                fontFamily: "'montserrat', sans-serif", fontSize: '18px'
              }}
              onMouseEnter={(e) => {     e.target.style.borderColor = '#00A007';
              }}
              onMouseLeave={(e) => {     e.target.style.borderColor = '#2BB514';
              }}>Create Account</Link>
              <Link to="/login" style={{
                height: '10px', marginTop: '20px', lineHeight: '10px', borderRadius: '8px',
                fontWeight: 'bold', background: '#F5BBFF', border: '4px solid #E01FFF', color: '#E01FFF',
                textDecoration: 'none', width: '60px', marginLeft: '10px',
                padding: '10px', textAlign: 'center', transition: '.2s',
                fontFamily: "'montserrat', sans-serif", fontSize: '18px'
              }}
              onMouseEnter={(e) => {     e.target.style.borderColor = '#D94BF0';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = '#E01FFF';
          
              }}>Login</Link>
            </div>
          </div>
        </div>



        <div  className="white-background" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '700px', marginTop: '150px' }}>
          
            <h1 style={{ color: 'black', width: '800px', marginLeft: 'auto', marginRight: 'auto', fontFamily: "'montserrat', sans-serif", fontSize: '60px', marginTop: '100px', fontWeight: 'bold' }}>
              Empowering students AND teachers with AI</h1>
         
          <div style={{ width: '800px', marginTop: '-20px', borderRadius: '5px', display: 'flex' }}>
            <Link to="/signup"  style={{
              height: '40px', lineHeight: '40px', marginTop: '20px', marginBottom: '20px',
              background: '#AEF2A3', color: '#2BB514', fontWeight: 'bold', display: 'block',
              width: '320px',  textDecoration: 'none', border: '4px solid #2BB514',
              borderRadius: '10px', textAlign: 'center', transition: '.3s', marginLeft: '50px',
              fontFamily: "'montserrat', sans-serif", fontSize: '25px'
            }}
            onMouseEnter={(e) => {     e.target.style.borderColor = '#00A007';
            }}
            onMouseLeave={(e) => {     e.target.style.borderColor = '#2BB514';
            }}>Create an Account +</Link>

            <Link to="/login"  style={{
              height: '40px', lineHeight: '40px', marginTop: '20px', marginBottom: '20px',
              background: '#F5BBFF', border: '4px solid #E01FFF', color: '#E01FFF', fontWeight: 'bold',
              display: 'block', width: '140px', marginLeft: '30px',
              textDecoration: 'none', borderRadius: '10px', textAlign: 'center',
              transition: '.2s', fontFamily: "'montserrat', sans-serif", fontSize: '25px'
            }}
            onMouseEnter={(e) => {     e.target.style.borderColor = '#D94BF0';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#E01FFF';
        
            }}>Login</Link>

           
          </div>
      
        </div>

        <div className="white-background" style={{ display: 'flex', width: '700px', marginTop: '70px' }}>
          <img src='/SquareScore.svg' style={{ width: '150px', marginTop: '-20px'}} />
          <div style={{height: '90px', background: '#e4e4e4', width: '2px', marginLeft: '20px', marginTop: '15px', marginRight: '20px'}}></div>
          <h1 style={{ width: '600px', fontFamily: "'montserrat', sans-serif", color: 'grey', marginTop: '-0px', marginLeft: '20px', fontSize: '25px', lineHeight: '1.6' }}>
            <span style={{background: '#AEF2A3', color: '#2BB514', paddingLeft: '5px', marginRight: '10px', paddingRight: '5px'}}>Generate</span> 
            and 
            <span style={{background: '#92A3FF', color: '#020CFF', paddingLeft: '5px', paddingRight: '5px',marginRight: '10px', marginLeft: '10px',}}>grade</span>  
            <span style={{background: '#FFEAAF', color: '#FFAE00', paddingLeft: '5px', paddingRight: '5px', marginRight: '10px', marginLeft: '0px',}}>adaptive</span> <br></br>

            
            <span style={{background: '#92A3FF', color: '#020CFF', paddingLeft: '5px', paddingRight: '5px',marginRight: '10px', marginLeft: '0px', }}>short-answer</span>  
            
            and 
            <span style={{background: '#AEF2A3', color: '#2BB514', paddingLeft: '5px', paddingRight: '5px',marginRight: '10px', marginLeft: '10px', }}>multiple-choice</span> <br></br> 
           
          
           
            assignments with 
            <span style={{background: '#F5B6FF', color: '#E441FF', paddingLeft: '5px', marginRight: '10px',marginLeft: '10px',  paddingRight: '5px'}}>AI.</span> 
           
          </h1>
        </div>


        <div style={{width: '100%', background: '#f4f4f4', marginBottom: '100px', borderTop: '4px solid lightgrey', borderBottom: '4px solid lightgrey',marginTop: '50px'}}>
<h1 style={{width: '400px', fontSize: '40px', marginLeft: 'auto', marginRight: 'auto',  }}>Free For Teachers</h1>

</div>


        <div className="white-background">
        <img style={{ width: '1000px', padding: '15px', border: ' 2px solid #f4f4f4', borderRadius: '15px' }} src='/CountlessFeatures.png' />
        </div>
        <div className="white-background" style={{ marginTop: '0px' }}>
          <div style={{display: 'flex'}}>
            <h1 style={{fontFamily: '"montserrat", sans- serif', fontSize: '70px'}}>4 Formats</h1>
            <h1 style={{fontFamily: '"montserrat", sans- serif', fontSize: '40px', marginTop: '75px', marginLeft: '20px'}}>-Unlimited Possibilities</h1>
          </div>
          <img style={{ width: '750px', }} src='/4Formats.png' />
        </div>


<div className="white-background"  style={{display: 'flex', padding: '60px 60px 0px 60px', border: ' 2px solid #f4f4f4'}}>
  <div style={{fontSize: '80px', width: '350px', fontFamily: '"montserrat", sans- serif', fontWeight: 'bold', marginTop: '10px', borderRight: ' 2px solid #f4f4f4',
    height: '190px'
  }}>
    Just 6 Steps
  </div>
<div style={{marginLeft: '40px', marginBottom: '50px'}}>
              
                 <ul style={{fontFamily: '"montserrat", sans- serif',width: '500px', marginTop: '0px', fontSize: '25px', fontWeight: '600', color: 'grey',listStyleType: 'none'}}>
                  <li style={{marginBottom: '10px'}}>
                 1.  Create a class
                  </li>
                  <li style={{marginBottom: '10px'}}>
                 2.  Add Your Students
                  </li>
                  <li style={{marginBottom: '10px'}}>
                  3. Input Your Source
                  </li>
                  <li style={{marginBottom: '10px'}}>
                  4. Generate questions
                  </li>
                  <li style={{marginBottom: '10px'}}>
                 5. Publish
                  </li>
                  <li style={{marginBottom: '10px'}}>
                 6. Grade Automatically!
                  </li>
                 </ul>
              
            </div>

</div>


        <div className="white-background" style={{ marginTop: '100px', width: '1000px' }}>
          <h1 style={{fontFamily: '"montserrat", sans- serif', fontSize: '70px'}}>Simple, Clean, Intuitive.</h1>
          <div style={{display: 'flex', marginTop: '80px'}}>
          <div style={{width: '500px'}}>
          <h1 style={{fontFamily: '"montserrat", sans- serif', fontSize: '25px', marginTop: '-20px', color: 'grey'}}>Designed For Teachers</h1>
              
            <img src='AuthTeachers.png' style={{width: '441px',  padding: '15px', background: 'white', borderRadius: '15px', border: ' 2px solid #f4f4f4'}}/>
          
       
          </div>
          <div style={{width: '500px', marginLeft: '80px'}}>

<h1 style={{fontFamily: '"montserrat", sans- serif', fontSize: '25px', marginTop: '-20px', color: 'grey'}}>Designed For Students</h1>
    
  <img src='AuthStudents.png' style={{width: '425px',  padding: '15px', background: 'white', borderRadius: '15px', border: ' 2px solid #f4f4f4'}}/>

</div>
</div>
       
             
        </div>


<div className="white-background"  style={{width: '1000px'}}>
<h1 style={{fontFamily: '"montserrat", sans- serif', fontSize: '70px'}}>Adaptive Assignments</h1>

<div style={{display: 'flex', fontFamily: '"montserrat", sans- serif', marginTop: '10px' }}>
       
<img style={{width: '500px',  marginRight: '50px', marginTop: '10px'}}src='AdaptiveLogic.svg'/>
  <p style={{width: '420px', marginRight: '-100px', fontWeight: '600', fontSize: '25px', color: 'grey', lineHeight: '2'}}> 

  SquareScore focuses on 

adaptive assignments to allow 

students to take questions at 

their level so students get the 

workload they need to succeed 
  </p>
</div>
</div>









   


              <div className="white-background"  style={{ marginTop: '100px', width: '1000px'}}>
              <h1 style={{fontFamily: '"montserrat", sans- serif', lineHeight: '.8', fontSize: '70px', position: 'relative', }}>Watch Our Demo</h1>
         <iframe width="1000" height="600"
                  src="https://www.youtube.com/embed/vAT3O0b3eDA">
                  </iframe>
          
  
                  </div>



                  <div className="white-background">
        <img style={{ width: '1000px', padding: '15px', border: '0px solid #e4e4e4', borderRadius: '15px' , opacity: '80%'}} src='/MeetTheTeam.svg' />
        </div>
       
                 
              <div className="white-background" style={{width: '1000px', marginTop: '100px', position: 'relative'}}>
            
            <h1 style={{fontFamily: '"montserrat", sans- serif', fontSize: '70px'}}>Privacy</h1>
            <h1 style={{fontFamily: '"montserrat", sans- serif', fontSize: '40px'}}>We never sell any user information to anyone!</h1>

              <div style={{display: 'flex', marginTop: '-50px'}}>
              <div>
              <h1 style={{fontFamily: '"montserrat", sans- serif', fontSize: '40px', color: 'green',marginTop: '100px',  marginBottom: '-30px'}}>Students</h1>
              <p style={{fontSize: '35px', width: '500px', fontWeight: 'normal'}}>
            We store students: <strong> name, email, classes in, and grades. </strong>
              </p>
              </div>
              <div style={{}}>
              <h1 style={{fontFamily: '"montserrat", sans- serif', fontSize: '40px', color: 'blue',marginTop: '100px', marginBottom: '-30px', marginLeft: '20px'}}>Teachers</h1>
              <p style={{fontSize: '35px', width: '500px', fontWeight: 'normal', marginLeft: '20px'}}>
            We store <strong>teachers name, email, school if applicable and assignment data</strong>, however we never store source data. 
              </p>
              </div>
               
              </div>
       
             <Link to='/privacyPolicy'
             style={{background: 'none',padding: '10px', width: '400px', fontSize: '30px', color: 'black', fontFamily: '"montserrat", sans- serif', fontWeight: 'bold', textDecoration: 'none', borderRadius: '15px', position: 'relative', bottom: '50px'}}
             >
             Privacy Policy
             <img style={{marginTop: '20px', marginLeft: '20px'}} src='ArrowAuth.png'/>

             </Link>
                </div>
  
                <div style={{width: '1000px', background: '#627BFF', padding: ' 5px 20px', borderRadius: '20px', color: 'white', marginTop: '100px'}}>
            <h1 style={{fontFamily: '"montserrat", sans- serif', fontSize: '70px'}}>AI Safety</h1>
           
            <h1 style={{fontFamily: '"montserrat", sans- serif', fontSize: '40px'}}>At SquareScore we use Anthropic API, Anthropic is commited to AI safety and will not train any models off of data entered through services like ours</h1>

            </div>


         

     
   
          <FooterAuth style={{ marginTop: '100px', height: '200px' }} />
        
      </div>
    </div>
  );
};

export default Auth;
