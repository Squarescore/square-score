import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Link as ScrollLink } from 'react-scroll';
import PricingElement from './PricingElement';
import FeatureTicker from './FeatureTicker';
import FooterAuth from './FooterAuth';
import './BackgroundDivs.css'; // Import the CSS file
const Auth = () => {
  const [navbarBg, setNavbarBg] = useState('rgba(255,255,255,0.7)');




  const [inputs, setInputs] = useState(Array(40).fill(''));
  const [squareScore, setSquareScore] = useState(0);
  const [requiredQuestions, setRequiredQuestions] = useState(20);
  const [currentStreak, setCurrentStreak] = useState(0);

  const handleInputChange = (index, value) => {
    const newValue = value.toLowerCase() === 'correct' ? 'correct' : '';
    const newInputs = [...inputs];
    newInputs[index] = newValue;
    setInputs(newInputs);
    calculateScore(newInputs);
  };

  const calculateScore = (currentInputs) => {
    let score = 0;
    let streak = 0;
    let wrongCount = 0;
    let answeredQuestions = 0;

    for (let i = 0; i < currentInputs.length; i++) {
      if (answeredQuestions >= requiredQuestions) break;

      if (currentInputs[i] === 'correct') {
        const baseScore = 2 + (streak * 0.25);
        score += Math.max(baseScore, 1); // Ensure at least 1 point is added
        streak++;
        answeredQuestions++;
      } else if (currentInputs[i] !== '') {
        if (score > 70) {
          score = Math.max(score - 1, 70); // Implement safety net at 70
        } else {
          const penalty = Math.max(2 - (streak * 0.2), 0.5);
          score = Math.max(score - penalty, 0); // Ensure score doesn't go below 0
        }
        streak = 0;
        wrongCount++;
        answeredQuestions++;
      }
    }

    setCurrentStreak(streak);

    // Calculate new required questions
    let additionalQuestions = wrongCount * 0.25;
    if (streak >= 8) {
      additionalQuestions = Math.floor(additionalQuestions);
    } else {
      additionalQuestions = Math.ceil(additionalQuestions);
    }
    const newRequiredQuestions = 20 + additionalQuestions;
    setRequiredQuestions(newRequiredQuestions);

    // Cap the score at 99 if the first question was wrong
    if (currentInputs[0] !== 'correct') {
      score = Math.min(score, 99);
    }

    setSquareScore(Math.max(Math.min(Math.round(score), 100), 0));
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
                <ScrollLink
                  to="pricing"
                  smooth={true}
                  duration={500}
                  style={{
                    height: '20px', marginTop: '0px', lineHeight: '18px',
                    borderRadius: '1px', textDecoration: 'none', color: 'grey',
                    width: '100px', marginLeft: '90px', padding: '10px 20px 10px 20px',
                    textAlign: 'center', transition: '.1s', fontFamily: "'Radio Canada', sans-serif",
                    fontSize: '18px', cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => { e.target.style.opacity = '65%'; }}
                  onMouseLeave={(e) => { e.target.style.opacity = '100%'; }}
                >
                  Pricing
                </ScrollLink>
              </div>
              <img style={{ width: '320px', marginLeft: 'auto', marginRight: 'auto' }} src="/SquareScore.png" alt="logo" />
            </div>
            <div style={{ width: '280px', display: 'flex', position: 'fixed', right: '20px' }}>
              <Link to="/signup" style={{
                height: '0px', marginTop: '10px', lineHeight: '2px', borderRadius: '10px',
                fontWeight: 'bold', background: '#F4C10A', border: '8px solid #F4C10A',
                textDecoration: 'none', color: 'white', width: '80px', marginLeft: '30px',
                padding: '15px', textAlign: 'center', transition: '.2s',
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
                height: '0px', marginTop: '10px', lineHeight: '2px', borderRadius: '10px',
                fontWeight: 'bold', background: '#627BFF', border: '8px solid #627BFF',
                textDecoration: 'none', color: 'white', width: '50px', marginLeft: '30px',
                padding: '15px', textAlign: 'center', transition: '.2s',
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
          
            <h1 style={{ color: 'black', width: '640px', marginLeft: 'auto', marginRight: 'auto', fontFamily: "'Radio Canada', sans-serif", fontSize: '60px' }}>Empowering students AND teachers with AI</h1>
         
          <div style={{ width: '500px', marginTop: '-20px', borderRadius: '5px', display: 'flex' }}>
            <Link to="/signup"  style={{
              height: '50px', lineHeight: '50px', marginTop: '20px', marginBottom: '20px',
              background: '#F4C10A', color: 'white', fontWeight: 'bold', display: 'block',
              width: '300px', marginLeft: 'auto', marginRight: 'auto', textDecoration: 'none',
              borderRadius: '10px', textAlign: 'center', transition: '.3s',
              fontFamily: "'Radio Canada', sans-serif", fontSize: '26px'
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
              height: '34px', lineHeight: '34px', marginTop: '20px', marginBottom: '20px',
              background: '#627BFF', border: '8px solid #627BFF', color: 'white', fontWeight: 'bold',
              display: 'block', width: '150px', marginLeft: 'auto', marginRight: 'auto',
              textDecoration: 'none', borderRadius: '10px', textAlign: 'center',
              transition: '.3s', fontFamily: "'Radio Canada', sans-serif", fontSize: '26px'
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

        <div className="white-background" style={{ display: 'flex', width: '600px', marginTop: '100px' }}>
          <img src='/BoxLogo.png' style={{ width: '200px' }} />
          <h1 style={{ width: '380px', fontFamily: "'Radio Canada', sans-serif", color: 'grey', marginLeft: '70px' }}>
            Generate and grade adaptive open ended and multiple choice assignments with AI
          </h1>
        </div>
        <div >
          <FeatureTicker />
        </div>
        <div className="white-background" style={{ marginTop: '20px' }}>
          <img style={{ width: '800px' }} src='/HowItWorks.png' />
        </div>
        <div className="white-background" style={{ marginTop: '140px' }}>
          <img style={{ width: '1000px' }} src='/OurTeam.png' />
        </div>
        <div id="pricing" className="white-background" style={{ marginTop: '140px', width: '800px' }}>
          <PricingElement />
        </div>
        <div>
        <h1>squarescore: {squareScore}</h1>
        <div>
          {inputs.map((input, index) => (
            <input
              key={index}
              type="text"
              value={input}
              onChange={(e) => handleInputChange(index, e.target.value)}
              style={{
                margin: '5px',
                backgroundColor: input === 'correct' ? 'lightgreen' : (input === '' ? 'white' : 'lightcoral'),
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '5px'
              }}
            />
          ))}
        </div>
</div>
   
          <FooterAuth style={{ marginTop: '100px', height: '200px' }} />
        
      </div>
    </div>
  );
};

export default Auth;
