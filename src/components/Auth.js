import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Link as ScrollLink } from 'react-scroll';
import FeatureTicker from './FeatureTicker';
import FooterAuth from './FooterAuth';
import './BackgroundDivs.css'; // Import the CSS file
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
                    textAlign: 'center', transition: '.1s', fontFamily: "'Radio Canada', sans-serif",
                    fontSize: '18px', cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => { e.target.style.opacity = '65%'; }}
                  onMouseLeave={(e) => { e.target.style.opacity = '100%'; }}
                >
                  Privacy Policy
                 
                </Link>
              </div>
              <img style={{ width: '320px', marginLeft: 'auto', marginRight: 'auto' }} src="/SquareScore.png" alt="logo" />
            </div>
            <div style={{ width: '280px', display: 'flex', position: 'fixed', right: '20px' }}>
              <Link to="/signup" style={{
                height: '10px', marginTop: '20px', lineHeight: '10px', borderRadius: '8px',
                fontWeight: 'bold', background: '#FFEC87', border: '4px solid #FC8518 ', color: '#FC8518 ',
                textDecoration: 'none', width: '80px', marginLeft: '30px',
                padding: '10px', textAlign: 'center', transition: '.2s',
                fontFamily: "'Radio Canada', sans-serif", fontSize: '18px'
              }}
              onMouseEnter={(e) => {
                e.target.style.opacity = '85%';
                e.target.style.boxShadow = '0px 4px 4px 0px rgba(0, 0, 0, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.target.style.opacity = '100%';
                e.target.style.boxShadow = 'none';
              }}>Sign up</Link>
              <Link to="/login" style={{
                height: '10px', marginTop: '20px', lineHeight: '10px', borderRadius: '8px',
                fontWeight: 'bold', background: '#99B6FF', border: '4px solid #020CFF', color: '#020CFF',
                textDecoration: 'none', width: '60px', marginLeft: '10px',
                padding: '10px', textAlign: 'center', transition: '.2s',
                fontFamily: "'Radio Canada', sans-serif", fontSize: '18px'
              }}
              onMouseEnter={(e) => {
                e.target.style.opacity = '85%';
                e.target.style.boxShadow = '0px 4px 4px 0px rgba(0, 0, 0, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.target.style.opacity = '100%';
                e.target.style.boxShadow = 'none';
              }}>Login</Link>
            </div>
          </div>
        </div>



        <div  className="white-background" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '700px', marginTop: '150px' }}>
          
            <h1 style={{ color: 'black', width: '800px', marginLeft: 'auto', marginRight: 'auto', fontFamily: "'Radio Canada', sans-serif", fontSize: '70px', marginTop: '150px' }}>Empowering students AND teachers with AI</h1>
         
          <div style={{ width: '800px', marginTop: '-20px', borderRadius: '5px', display: 'flex' }}>
            <Link to="/signup"  style={{
              height: '70px', lineHeight: '70px', marginTop: '20px', marginBottom: '20px',
              background: '#FFEC87', color: '#FC8518', fontWeight: 'bold', display: 'block',
              width: '450px',  textDecoration: 'none', border: '6px solid #FC8518',
              borderRadius: '15px', textAlign: 'center', transition: '.3s', marginLeft: '50px',
              fontFamily: "'Radio Canada', sans-serif", fontSize: '40px'
            }}
            onMouseEnter={(e) => {
              e.target.style.opacity = '85%';
              e.target.style.boxShadow = '0px 4px 4px 0px rgba(0, 0, 0, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = '100%';
              e.target.style.boxShadow = 'none';
            }}>Sign up for free</Link>

            <Link to="/login"  style={{
              height: '70px', lineHeight: '70px', marginTop: '20px', marginBottom: '20px',
              background: '#99B6FF', border: '6px solid #020CFF', color: '#020CFF', fontWeight: 'bold',
              display: 'block', width: '250px', marginLeft: 'auto', marginRight: 'auto',
              textDecoration: 'none', borderRadius: '15px', textAlign: 'center',
              transition: '.3s', fontFamily: "'Radio Canada', sans-serif", fontSize: '40px'
            }}
            onMouseEnter={(e) => {
              e.target.style.opacity = '85%';
              e.target.style.boxShadow = '0px 4px 4px 0px rgba(0, 0, 0, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = '100%';
              e.target.style.boxShadow = 'none';
            }}>Login</Link>

           
          </div>
          <div style={{display: 'flex',  marginLeft: '-60px'}}>
              <h1>Add your school to the <ScrollLink 
  to="early-access-explanation"
  smooth={true}
  duration={500}
  style={{ cursor: 'pointer', textDecoration: 'underline', color: 'blue' }}
>
  early access
</ScrollLink>  waitlist</h1>
<Link to="/signupadmin" style={{marginRight: '-100px', background: 'transparent', border: 'none', marginLeft: '20px', cursor: 'pointer', marginTop: '30px'}}>
<img src='ArrowAuth.png'/>
</Link>
              
            </div>
        </div>

        <div className="white-background" style={{ display: 'flex', width: '800px', marginTop: '70px' }}>
          <img src='/BoxLogo.png' style={{ width: '200px',height: '200px' }} />
          <h1 style={{ width: '700px', fontFamily: "'Radio Canada', sans-serif", color: 'grey', marginTop: '-0px', marginLeft: '70px', fontSize: '40px' }}>
            Generate and grade adaptive open ended and multiple choice assignments with AI
          </h1>
        </div>
        <div >
          <FeatureTicker />
        </div>
        <div className="white-background" style={{ marginTop: '-50px' }}>
          <div style={{display: 'flex'}}>
            <h1 style={{fontFamily: '"Rajdhani", sans- serif', fontSize: '70px'}}>4 Formats</h1>
            <h1 style={{fontFamily: '"Radio Canada", sans- serif', fontSize: '40px', marginTop: '75px', marginLeft: '20px'}}>-Unlimited Possibilities</h1>
          </div>
          <img style={{ width: '750px', }} src='/4Formats.png' />
        </div>





        <div className="white-background" style={{ marginTop: '100px', width: '1000px' }}>
          <h1 style={{fontFamily: '"Rajdhani", sans- serif', fontSize: '70px'}}>It's Simple!</h1>
          <div style={{display: 'flex'}}>
            <div>
            <img src='AuthDemo1.png' style={{width: '520px', height: '734px', padding: '10px', background: '#f4f4f4'}}/>
            </div>
            <div style={{marginLeft: '40px'}}>
              <h1 style={{fontFamily: '"Radio Canada", sans- serif', fontSize: '70px', marginTop: '-20px'}}>Teachers</h1>
                 <ul style={{fontFamily: '"Radio Canada", sans- serif',width: '400px', fontSize: '45px', fontWeight: 'bold', color: 'grey'}}>
                  <li>
                  Create a class
                  </li>
                  <li>
                  Choose your assignment type
                  </li>
                  <li>
                  Add your source
                  </li>
                  <li>
                  Generate questions
                  </li>
                  <li>
                  Publish the assignment
                  </li>
                  <li>
                  That's it! No need to grade for hours on end
                  </li>
                 </ul>
              
            </div>
          </div>


          <div style={{display: 'flex', marginTop: '30px'}}>
          <div>
              <h1 style={{fontFamily: '"Radio Canada", sans- serif', fontSize: '60px', marginTop: '-0px'}}>Students</h1>
                 <ul style={{fontFamily: '"Radio Canada", sans- serif',width: '400px', fontSize: '30px', fontWeight: 'bold', color: 'grey'}}>
                  <li>
                  Join a class
                  </li>
                  <li>
                  Open your assignment
                  </li>
                  <li>
                  Take questions at your level
                  </li>
                  <li>
                  Achieve mastery
                  </li>
                  <li>
                  Submit
                  </li>
                  <li>
                  Receive instant feedback
                  </li>
                 </ul>
              
            </div>
            <div>
            <img src='AuthDemo2.png' style={{width: '660px', height: '364px', padding: '10px', background: '#f4f4f4'}}/>
            </div>
           
          </div>

             
        </div>


<div className="white-background"  style={{width: '1000px'}}>
<h1 style={{fontFamily: '"Rajdhani", sans- serif', fontSize: '70px'}}>Adaptive Assignments</h1>
<p style={{width: '1200px', marginRight: '-100px', fontFamily: '"Radio Canada", sans- serif', fontSize: '20px',}}> 
  At <strong>SquareScore</strong>, we revolutionize learning with our <strong>adaptive </strong>Multiple Choice and Short Answer assignments.
  <br></br><br></br>
   Our platform uniquely allows teachers to create <strong>personalized</strong>, adaptive content from their own custom material. 
   <br></br><br></br>
  
  </p>
<div style={{display: 'flex', fontFamily: '"Radio Canada", sans- serif', fontSize: '20px', marginTop: '-30px' }}>
       
  <p style={{width: '800px', marginRight: '-100px'}}> 

   Students work at their <strong>individual</strong> pace until mastery – those who grasp concepts quickly can <strong>progress faster,</strong> while those needing reinforcement receive <strong>targeted support</strong>. 
   <br></br><br></br>
   This approach aligns with <strong>global</strong> trends in education, exemplified by recent changes to standardized tests like the <strong>SAT</strong>.
   <br></br><br></br>
    By <strong>optimizing learning time and providing accurate assessments</strong>, SquareScore ensures each student receives a <strong>tailored</strong>  educational experience, making it an <strong>indispensable tool for modern, efficient, and effective teaching.</strong> 

  </p>
<img style={{width: '500px', height: '250px', marginLeft: '100px', marginRight: 'auto', marginTop: '40px'}}src='AdaptiveLogic.png'/>
</div>
</div>



<div className="white-background" style={{marginTop: '70px'}}>
  <h1 style={{fontFamily: '"Rajdhani", sans- serif', fontSize: '70px'}}>What's a SquareScore?</h1>
  <div style={{display: 'flex'}}>
    <img  style={{height: '150px'}} src='QMarkSquareScore.png'/>
    <div>
<p style={{width: '750px', fontFamily: '"Radio Canada", sans- serif', marginTop: '20px', fontSize: '30px', marginLeft: '30px', fontWeight: 'normal' }}>
  A <strong>SquareScore</strong> is a performance metric 
  for students on <strong>adaptive</strong>  assignments. 
  It provides teachers insight into both 
  <strong> student achievement  </strong>  and <strong>effort</strong> . 




</p>
    </div>
  </div>
  <h1 style={{fontFamily: '"Radio Canada", sans- serif', fontSize: '40px', marginBottom: '60px'}}>Through SquareScore:</h1>
<div style={{ width: '1050px'}}>
  <div style={{display: 'flex', justifyContent: 'space-between',}}>
<div style={{ width: '320px', height: '170px', borderRadius: '20px',  border: '10px solid #f4f4f4 ', background: 'white', color: 'grey'}}>
<h1 style={{marginLeft: '20px', marginTop: '20px', fontSize: '28px',fontWeight: 'normal'}}>
Students get questions on their level 
</h1>

</div>
<div style={{ width: '320px', height: '170px', borderRadius: '20px',  border: '10px solid #f4f4f4 ', background: 'white', color: 'grey'}}>
<h1 style={{marginLeft: '20px', marginTop: '20px', fontSize: '28px',fontWeight: 'normal'}}>
Students who know the material finish faster
</h1>

</div>
<div style={{ width: '320px', height: '170px', borderRadius: '20px',  border: '10px solid #f4f4f4 ', background: 'white', color: 'grey'}}>
<h1 style={{marginLeft: '20px', marginTop: '20px', fontSize: '28px',fontWeight: 'normal'}}>
Students struggling get reinforcement until mastery
</h1>

</div>

  </div>
 

  <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '20px'}}>
<div style={{ width: '320px', height: '170px', borderRadius: '20px',  border: '10px solid #f4f4f4 ', background: 'white', color: 'grey'}}>
<h1 style={{marginLeft: '20px', marginTop: '20px', fontSize: '28px',fontWeight: 'normal'}}>
Students can choose when to end the assignment
</h1>

</div>
<div style={{ width: '320px', height: '170px', borderRadius: '20px',  border: '10px solid #f4f4f4 ', background: 'white', color: 'grey'}}>
<h1 style={{marginLeft: '20px', marginTop: '20px', fontSize: '28px',fontWeight: 'normal'}}>
Students enjoy a streak saving system to account for one off student mistakes
</h1>

</div>
<div style={{ width: '320px', height: '170px', borderRadius: '20px', border: '10px solid #f4f4f4 ', background: 'white', color: 'grey'}}>
<h1 style={{marginLeft: '20px', marginTop: '20px', fontSize: '28px', fontWeight: 'normal'}}>
Students get positive reinforcement while minimizing negative reinforcement
</h1>

</div>

  </div>


</div>
<img style={{marginTop: '100px', width: '1000px', marginLeft: '20px'}}src='Efffects.png'/>
</div>


<div style={{width:'100%', background: 'rgba(239, 239, 239, 0.8)' , display: 'flex', marginTop: '100px'}}>
<div style={{width: '880px', marginLeft: 'auto', marginRight: 'auto', display:'flex', height: '100px',}}>
<img style={{height: '70px', marginTop: '15px'}} src='100Percent.png'/>
<h1 style={{fontFamily: '"Rajdhani", sans- serif', fontSize: '70px', marginTop: '10px', marginLeft: '20px'}}>Student X Teacher Team</h1>
</div>
</div>

<div className="white-background" style={{marginTop:'100px'}}>
  <img  style={{width: '1056px', }}src='MeetTheFounders.png'/>
</div>



        <div   className="white-background"style={{width: '1000px', marginTop: '100px'}}>
            
            <h1 style={{fontFamily: '"Rajdhani", sans- serif', fontSize: '70px'}}>State of The Art Design</h1>
            
              <div style={{display: 'flex'}}>
              <img  style={{padding: '10px', background: '#f4f4f4'}}src='HomeScreen.png'/>
                <div>
                <h1 style={{fontSize: '50px', width: '400px',fontFamily: '"Radio Canada", sans- serif', marginTop:'40px', marginLeft: '30px'}}>More intuitive than ever</h1>
                <h1 style={{fontSize: '50px', width: '400px',fontFamily: '"Radio Canada", sans- serif', marginTop:'-0px', marginLeft: '30px'}}>More 
                  <span style={{fontSize: '50px',fontFamily: '"Radio Canada", sans- serif', color: '#D84E00' }}> c</span>
                  <span style={{fontSize: '50px',fontFamily: '"Radio Canada", sans- serif', color: '#627BFF' }}>o</span>
                  <span style={{fontSize: '50px',fontFamily: '"Radio Canada", sans- serif', color: '#56C200' }}>l</span>
                  <span style={{fontSize: '50px',fontFamily: '"Radio Canada", sans- serif', color: '#FCD718' }}>o</span>
                  <span style={{fontSize: '50px',fontFamily: '"Radio Canada", sans- serif', color: '#9800F5' }}>rf</span>
                  <span style={{fontSize: '50px',fontFamily: '"Radio Canada", sans- serif', color: '#18C1A3' }}>ul </span>
                  than ever</h1>
               
                </div>
              </div>

               

                  </div>




              <div className="white-background"  style={{ marginTop: '100px', width: '1000px'}}>
              <h1 style={{fontFamily: '"Rajdhani", sans- serif', lineHeight: '.8', fontSize: '70px', position: 'relative', }}>Watch Our Demo</h1>
         <iframe width="1000" height="600"
                  src="https://www.youtube.com/embed/vAT3O0b3eDA">
                  </iframe>
          
  
                  </div>



            <div className="white-background"  style={{width: '1000px'}}>
            <h1 style={{fontFamily: '"Rajdhani", sans- serif', fontSize: '70px', position: 'relative'}}>Referral Program</h1>
            <div style={{display: 'flex'}}>
              <img  style={{padding: '10px', background: '#f4f4f4'}}src='Referral.png'/>
              <div style={{marginLeft: '20px', width: '500px'}}>

              <h1 style={{fontFamily: '"Radio Canada", sans- serif', fontSize: '40px', position: 'relative',  width: '400px'}}> Referring teachers to the SquareScore waitlist earns you </h1>
              <ul>
                <li  style={{fontFamily: '"Radio Canada", sans- serif', fontSize: '35px', marginBottom: '50px'}}>
                4 spots higher on the waitlist for earlier access per teacher
                </li>
                <li style={{fontFamily: '"Radio Canada", sans- serif', fontSize: '35px',}}>
                 10% off for a month once the full product launches (non-stackable)
                </li>
              </ul>
              
          </div>
            </div>

            </div>


            <div className="white-background"  id="early-access-explanation"  style={{width: '1000px'}}>
            <h1 style={{fontFamily: '"Rajdhani", sans- serif', fontSize: '70px', position: 'relative'}}>Early Access</h1>
            <div style={{fontSize: '35px', fontFamily: '"Radio Canada", sans- serif', fontWeight: 'bold', color: '#9800F5' }}>
            SquareScore is in its beta stage, however select schools and teachers can sign up for <ScrollLink to=''>early access </ScrollLink>and help us develop the best thing ever! 
            </div>
            <div style={{display: 'flex'}}>
              <div style={{width: '800px', fontSize: '25px', fontFamily: '"Radio Canada", sans- serif',}}>
              <h1 style={{fontFamily: '"Radio Canada", sans- serif', fontSize: '60px', position: 'relative'}}>What Does This Mean?</h1>
              Since we are still working out the kinks, interested teachers and organizations can be part of our beta pilots 
<br></br><br></br>
If selected for early access, you will be eligible for our net 0 pricing exclusive for this beta testing phase.
<br></br><br></br>
Under this model teachers and organizations have to pay for only what they use!
Some individual teachers may even receive free access through our referral program!
<br></br><br></br>
Every bill for beta testers will have transparent pricing, admin accounts will also be able to view their costs


              </div>
            </div>
              </div>
       

       
                 
              <div className="white-background" style={{width: '1000px', marginTop: '100px', position: 'relative'}}>
            
            <h1 style={{fontFamily: '"Rajdhani", sans- serif', fontSize: '70px'}}>Privacy</h1>
            <h1 style={{fontFamily: '"Radio Canada", sans- serif', fontSize: '40px'}}>We never sell any user information to anyone!</h1>

              <div style={{display: 'flex', marginTop: '-50px'}}>
              <div>
              <h1 style={{fontFamily: '"Radio Canada", sans- serif', fontSize: '40px', color: 'green',marginTop: '100px',  marginBottom: '-30px'}}>Students</h1>
              <p style={{fontSize: '35px', width: '500px', fontWeight: 'normal'}}>
            We store students: <strong> name, email, classes in, and grades. </strong>
              </p>
              </div>
              <div style={{}}>
              <h1 style={{fontFamily: '"Radio Canada", sans- serif', fontSize: '40px', color: 'blue',marginTop: '100px', marginBottom: '-30px', marginLeft: '20px'}}>Teachers</h1>
              <p style={{fontSize: '35px', width: '500px', fontWeight: 'normal', marginLeft: '20px'}}>
            We store <strong>teachers name, email, school if applicable and assignment data</strong>, however we never store source data. 
              </p>
              </div>
               
              </div>
       
             <Link to='/privacyPolicy'
             style={{background: 'none',padding: '10px', width: '400px', fontSize: '30px', color: 'black', fontFamily: '"Radio Canada", sans- serif', fontWeight: 'bold', textDecoration: 'none', borderRadius: '15px', position: 'relative', bottom: '50px'}}
             >
             Privacy Policy
             <img style={{marginTop: '20px', marginLeft: '20px'}} src='ArrowAuth.png'/>

             </Link>
                </div>
  
                <div style={{width: '1000px', background: '#627BFF', padding: ' 5px 20px', borderRadius: '20px', color: 'white', marginTop: '100px'}}>
            <h1 style={{fontFamily: '"Rajdhani", sans- serif', fontSize: '70px'}}>AI Safety</h1>
           
            <h1 style={{fontFamily: '"Radio Canada", sans- serif', fontSize: '40px'}}>At SquareScore we use Anthropic API, Anthropic is commited to AI safety and will not train any models off of data entered through services like ours</h1>

            </div>


                <div className="white-background" style={{width: '1000px', marginTop: '50px', marginBottom: '100px'}}>
            
            <h1 style={{fontFamily: '"Rajdhani", sans- serif', fontSize: '70px', position: 'relative'}}>Assignment Security<span style={{fontFamily: '"Radio Canada", sans- serif', fontSize: '100px', position: 'absolute', left: '620px', color: '#FCBC18' }}>*</span></h1>

              <p style={{fontFamily: '"Radio Canada", sans- serif', fontSize: '40px', color: 'black', marginBottom: '-30px'}}>
              SquareScore has systems in place to detect <strong>tab switches, window changes, copying of test material and more,</strong>  these features are optional for <strong>all</strong> assignment types
              </p>
              </div>

     
   
          <FooterAuth style={{ marginTop: '100px', height: '200px' }} />
        
      </div>
    </div>
  );
};

export default Auth;
