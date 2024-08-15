import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Link as ScrollLink } from 'react-scroll';
import PricingElement from './PricingElement';
import FeatureTicker from './FeatureTicker';
import FooterAuth from './FooterAuth';
import './Auth.css'; // Import the new CSS file

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
    <div className="auth-container">
      {positions.map((pos, index) => (
        <div
          key={index}
          className={`background-div ${getRandomColorClass()}`}
          style={{
            top: pos.top,
            left: pos.left,
          }}
        />
      ))}

      <div className="main-content">
        <div className="navbar" style={{ backgroundColor: navbarBg }}>
          <div className="navbar-content">
            <div className="navbar-left">
              <ScrollLink
                to="pricing"
                smooth={true}
                duration={500}
                className="navbar-link"
              >
                Pricing
              </ScrollLink>
            </div>
            <img className="navbar-logo" src="/SquareScore.png" alt="logo" />
            <div className="navbar-right">
              <Link to="/signup" className="auth-button signup-button">
                Sign up
              </Link>
              <Link to="/login" className="auth-button login-button">
                Login
              </Link>
            </div>
          </div>
        </div>

        <div className="white-background intro" style={{marginTop :'120px'}}>
          <h1 className="intro-title">Empowering students AND teachers with AI</h1>
          <div className="intro-buttons">
            <Link to="/signup" className="intro-button signup-button">
              Sign up for free
            </Link>
            <Link to="/login" className="intro-button login-button">
              Login
            </Link>
          </div>
        </div>

        <div className="white-background feature">
          <img src='/BoxLogo.png' className="feature-image" />
          <h1 className="feature-text">
            Generate and grade adaptive open ended and multiple choice assignments with AI
          </h1>
        </div>

        <FeatureTicker />

        <div className="white-background how-it-works">
          <img className="how-it-works-image" src='/HowItWorks.png' />
        </div>

        <div className="white-background our-team">
          <img className="our-team-image" src='/OurTeam.png' />
        </div>

        <div id="pricing" className="white-background pricing">
          <PricingElement />
        </div>

        <FooterAuth className="footer-auth" />
      </div>
    </div>
  );
};

export default Auth;
