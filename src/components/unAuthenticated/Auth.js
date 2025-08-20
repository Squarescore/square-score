import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Link as ScrollLink } from 'react-scroll';
import FeatureTicker from './FeatureTicker';
import FooterAuth from './FooterAuth';
import './BackgroundDivs.css'; // Import the CSS file
import emailjs from 'emailjs-com'; // Import EmailJS
import { GlassContainer } from '../../styles.js'; // Import GlassContainer
import { motion } from 'framer-motion';
import { Element } from 'react-scroll';

import { ArrowRight, ArrowRightFromLine, Bot, ChevronLeft, ChevronRight, MoveLeft, MoveRight, ChevronDown, SquareX, SendHorizonal, Rabbit, TimerIcon, Hourglass, Palette, Lock, NotebookPen, PlusCircle, Signature, HousePlus, Code, Code2, Scan, Barcode, FormInput, Users, BookPlus, CheckCircle2, CheckCircle } from 'lucide-react';
const Auth = () => {
  const [navbarBg, setNavbarBg] = useState('rgba(255,255,255,0.95)');
  const [showBorder, setShowBorder] = useState(false);

  const [selectedFormat, setSelectedFormat] = useState('OE*');
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state
  const [feedback, setFeedback] = useState({ from_name: '', reply_to: '', message: '' }); // Feedback form state
  const [isSending, setIsSending] = useState(false); // Sending state
  const [sendStatus, setSendStatus] = useState(null); 
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedTile, setSelectedTile] = useState(null);
  const [selectedFaq, setSelectedFaq] = useState(null);
  const [isVisible, setIsVisible] = useState(true); // For initial animation

  const formats = [
    {
      id: 'OE*',
      name: 'OE*',
      color: '#00CCB4',
      description: 'Adaptive Open Ended assessments automatically adjust question difficulty based on student responses, making each assessment uniquely challenging. This format excels at providing personalized learning paths while accurately measuring student knowledge.'
    },
    {
      id: 'MCQ*',
      name: 'MCQ*',
      color: '#7D00EA',
      description: 'These assessments intelligently select multiple choice questions based on previous answers, combining automated grading efficiency with personalized progression. This format is ideal for large-scale testing while maintaining individualized difficulty adjustment.'
    },
    {
      id: 'OE',
      name: 'OE',
      color: '#00CCB4',
      description: ' Open Ended questions that remain consistent for all students, allowing written explanations of understanding. This classic format effectively measures critical thinking and detailed knowledge expression.'
    },
    {
      id: 'MCQ',
      name: 'MCQ',
      color: '#7D00EA',
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

  const openModal = () => {
    setIsModalOpen(true);
  };

  // Handler to close the modal
  const closeModal = () => {
    setIsModalOpen(false);
    setFeedback({ from_name: '', reply_to: '', message: '' });
    setSendStatus(null);
  };

  // Handler for form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFeedback((prev) => ({ ...prev, [name]: value }));
  };

  // Handler for form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSending(true);

    // Replace these with your actual EmailJS credentials
    const service_id = 'service_t17hzxi';
    const template_id = 'template_nnojgxd';
    const user_id = 'GvU568KbWouvXYWUh';

    emailjs.send(service_id, template_id, feedback, user_id)
      .then((response) => {
        console.log('SUCCESS!', response.status, response.text);
        setSendStatus('success');
        setIsSending(false);
        // Optionally, you can close the modal after sending
        // setTimeout(() => {
        //   closeModal();
        // }, 2000);
      })
      .catch((err) => {
        console.error('FAILED...', err);
        setSendStatus('error');
        setIsSending(false);
      });
  };


  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setNavbarBg('rgba(255, 255, 255, 0.7)');
        setShowBorder(true);
      } else {
        setNavbarBg('rgba(255, 255, 255, 0.7)');
        setShowBorder(false);
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

  const wordVariants = {
    hidden: { 
      opacity: 0,
      y: 20
    },
    visible: { 
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  useEffect(() => {
    // Declare Tawk_API in the global scope
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    try {
      const s1 = document.createElement("script");
      s1.async = true;
      s1.src = 'https://embed.tawk.to/688660e88beeee192b5d70d6/1j16el3em';
      s1.charset = 'UTF-8';
      s1.setAttribute('crossorigin', '*');
      
      document.head.appendChild(s1);

      // Cleanup function
      return () => {
        if (s1.parentNode) {
          s1.parentNode.removeChild(s1);
        }
        // Clean up the global variables
        delete window.Tawk_API;
        delete window.Tawk_LoadStart;
      };
    } catch (error) {
      console.error('Error initializing Tawk.to:', error);
    }
  }, []); // Empty dependency array means this runs once on mount

  return (
    <div style={{ position: 'relative', background: '#white' }}>
      {/* Background Divs */}
   
      {/* Main Content */}
      <div  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          width: '100%', 
          display: 'flex', 
          borderBottom: showBorder ? '1px solid #ddd' : '1px solid transparent',
          alignItems: 'center', 
          height: '70px', 
          color: 'grey', 
          zIndex: 1000,
          backgroundColor: navbarBg, 
          transition: 'background-color 0.3s ease, border-bottom 0.3s ease',
          backdropFilter: 'blur(7px)',
        }}>
          <div style={{ 
            width: '100%',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            height: '100%'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              position: 'absolute',
              left: '30px'
            }}>
              <img style={{width: '45px'}} src="/favicon.svg" alt="logo" />
              <h1 style={{
                fontWeight: '400', 
                color: 'black', 
                paddingLeft: '20px', 
                borderLeft: '1px solid #ddd', 
                marginLeft: '20px', 
                fontSize: '20px',
                lineHeight: '30px'
              }}>Amoeba.Education</h1>
               <button
                onClick={openModal}
                style={{
                  padding: '0 20px',
                  background: 'none',
                  fontSize: '12px',
                  marginLeft: '230px',
                  color: 'grey',
                  border: 'none',
                  fontWeight: '400',
                  fontFamily: "'Montserrat', sans-serif",
                  cursor: 'pointer',
                  transition: 'color 0.2s ease',
                  height: '100%'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#b8b8b8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'grey';
                }}
              >
                Send Feedback 
              </button>

              <button
                style={{
                  padding: '0 20px',
                  background: 'none',
                  fontSize: '12px',
                  color: 'grey',
                  border: 'none',
                  fontWeight: '400',
                  fontFamily: "'Montserrat', sans-serif",
                  cursor: 'pointer',
                  transition: 'color 0.2s ease',
                  height: '100%'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#b8b8b8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'grey';
                }}
              >
                Tutorials
              </button>

              <Link 
                to="/privacypolicy"
                style={{
                  padding: '0 20px',
                  background: 'none',
                  color: 'grey',
                  fontSize: '12px',
                  border: 'none',
                  fontWeight: '400',
                  fontFamily: "'Montserrat', sans-serif",
                  cursor: 'pointer',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  height: '100%',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#b8b8b8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'grey';
                }}
              >
                Privacy Policy
              </Link>
              <Link 
                to="/privacypolicy"
                style={{
                  padding: '0 20px',
                  background: 'none',
                  color: 'grey',
                  fontSize: '12px',
                  border: 'none',
                  fontWeight: '400',
                  fontFamily: "'Montserrat', sans-serif",
                  cursor: 'pointer',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  height: '100%',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#b8b8b8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'grey';
                }}
              >
            Help
              </Link>
              <ScrollLink 
                to="faq-section"
                spy={true}
                smooth={true}
                offset={-100}
                duration={500}
                style={{
                  padding: '0 20px',
                  background: 'none',
                  color: 'grey',
                  fontSize: '12px',
                  border: 'none',
                  marginRight: '40px',
                  fontWeight: '400',
                  fontFamily: "'montserrat', sans-serif",
                  cursor: 'pointer',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  height: '100%',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#b8b8b8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'grey';
                }}
              >
            FAQ
              </ScrollLink>
            </div>

            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              position: 'absolute',
              right: '20px',
              height: '100%'
            }}>
             

              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginLeft: 'auto',
                gap: '20px',
                height: '100%'
              }}>
                <Link to="/login" style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '5px 20px',
                  borderRadius: '20px',
                  fontWeight: '400',
                  color: 'grey',
                  textDecoration: 'none',
                  fontFamily: "'montserrat', sans-serif",
                  fontSize: '16px',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#b8b8b8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'grey';
                }}
                >Login</Link>

             <div style={{width: '.5px', height: '30px', background: '#ddd', margin: '-10px -10px'}}/>
                <Link to="/signup" style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '5px 20px',
                  borderRadius: '20px',
                  fontWeight: '400',
                  color: 'grey',
                  textDecoration: 'none',
                  fontFamily: "'montserrat', sans-serif",
                  fontSize: '16px',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#b8b8b8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'grey';
                }}
                >Create Account</Link>
              </div>
            </div>
          </div>
        </div>



        <div style={{width: '100%', borderBottom: '1px solid #ddd', paddingBottom: '3rem', marginTop:'160px', }}>
          <div style={{ margin: '0px 4%', padding: '0 15px', }}>
       
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.15
                }
              }
            }}
            style={{ width: '45rem', zIndex: '200',
            maxWidth: '100%', fontFamily: "'montserrat', sans-serif", color: 'black', marginTop: '0rem', marginLeft: '0rem', fontSize: '3rem', lineHeight: '1.4', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem', position: 'relative', boxShadow: '0 0 50px 20px rgba(255,255,255,1)', background: 'rgb(255,255,255,.5)', backdropFilter: 'blur(2px)' }}>
            <motion.div variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { 
                opacity: 1, 
                y: 0,
                transition: {
                  duration: 0.5,
                  ease: "easeOut"
                }
              }
            }}>
              <GlassContainer size={1} variant="green" contentStyle={{ padding: '0.2rem 1.5rem', fontSize: '3rem', fontWeight: '400', fontFamily: "'montserrat', sans-serif", color: '#29c60f' }}>
                Make
              </GlassContainer>
            </motion.div>


            <motion.div variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { 
                opacity: 1, 
                y: 0,
                transition: {
                  duration: 0.5,
                  ease: "easeOut"
                }
              }
            }}>
              <GlassContainer size={1} variant="pink" contentStyle={{ padding: '0.2rem 1.5rem', fontSize: '3rem', fontWeight: '400', fontFamily: "'montserrat', sans-serif", color: '#d138e9' }}>
                Any Assessment
              </GlassContainer>
            </motion.div>

            <motion.div variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { 
                opacity: 1, 
                y: 0,
                transition: {
                  duration: 0.5,
                  ease: "easeOut"
                }
              }
            }}>
              <GlassContainer size={1} variant="blue" contentStyle={{ padding: '0.2rem 1.5rem', fontSize: '3rem', fontWeight: '400', fontFamily: "'montserrat', sans-serif", color: '#1651d4' }}>
                Adaptive,
              </GlassContainer>
            </motion.div>

    

            <motion.div variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { 
                opacity: 1, 
                y: 0,
                transition: {
                  duration: 0.5,
                  ease: "easeOut"
                }
              }
            }}>
              <GlassContainer size={1} variant="yellow" contentStyle={{ padding: '0.2rem 1.5rem', fontSize: '3rem', fontWeight: '400', fontFamily: "'montserrat', sans-serif", color: '#ffc300' }}>
            Instantly
              </GlassContainer>
            </motion.div>

            <motion.h1 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { 
                  opacity: 1, 
                  y: 0,
                  transition: {
                    duration: 0.5,
                    ease: "easeOut",
                    delay: 0.3
                  }
                }
              }}
              style={{fontSize: '1rem', fontWeight: '400', marginLeft: '-0px', color: 'grey', marginTop:'15px', width: '35rem'}}>
              Increase class time and ensure understanding with faster evaluation through adaptive assessments. Free for teachers*
            </motion.h1>
          </motion.div>

          <motion.div
          
          style={{ width: '45%', marginTop: '140px', position: 'absolute', right: '0', top: '-30px', overflow: "hidden", padding: '2px'
            ,zIndex: '1'
          }} 
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}>
          <GlassContainer variant="clear"
                  size={1}
          contentStyle={{width: '100%', padding: ' 20px 10px', overflow: 'hidden'}}>
          <img
          
            src='/ScreenshotAmoebaClassHome.png' 
            style={{ height: '360px', }} 
          />
          </GlassContainer>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
          <a href="https://www.youtube.com/watch?v=2vN0NrMrjtY" 
            target="_blank" 
              rel="noopener noreferrer"  
              style={{
                height: '20px', 
                lineHeight: '30px',  
                position: 'absolute', 
                right: '200px', 
                bottom: '-100px',
                fontWeight: '600', 
                padding: '8px',
                width: '110px', 
                display: 'flex',
                textDecoration: 'none', 
                borderRadius: '10px', 
                textAlign: 'center',
                color: 'white', 
                background: 'white', 
                transition: '.2s', 
                fontFamily: "'montserrat', sans-serif", 
                fontSize: '20px'
              }}
            >
              <h1 style={{fontWeight: '500', fontSize: '20px',marginTop: '-5px', marginLeft: '10px' }}>Demo</h1> 
              <ArrowRight style={{marginTop: '-1px', marginLeft: '10px'}}/>
            </a>
          </motion.div>

       









<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: 0.9 }}
  style={{ width: '25rem', marginTop: '2rem', border: '1px solid #ddd', borderRadius: '2rem'}}
>
  <div style={{display: 'flex'}}>
            <Link to="/signup" style={{
              height: '40px', 
              lineHeight: '40px',
              display: 'block', 
              color: 'grey',  
              fontWeight: '400', 
              padding: '4px',
              width: '16rem',  
              textDecoration: 'none', 
              borderRadius: '10px', 
              textAlign: 'center', 
              transition: '.3s', 
              fontFamily: "'montserrat', sans-serif", 
              fontSize: '1.3rem',
              
            }}
         >Create an Account +</Link>
<div style={{height: "1.5rem", width: '1px', marginTop: '12px', borderRadius: '10px', backgroundColor: '#ddd'}}/>
            <Link to="/login" style={{
              height: '40px', 
              lineHeight: '40px',
              color: 'grey', 
              background: 'white', 
              fontWeight: '400', 
              padding: '4px',
              display: 'block', 
              width: '4rem', 
              marginLeft: '30px',
              textDecoration: 'none', 
              borderRadius: '10px', 
              textAlign: 'center',
              transition: '.2s', 
              fontFamily: "'montserrat', sans-serif", 
              fontSize: '1.3rem'
            }}
          >Login</Link>
           
          </div>
</motion.div>
  </div>
</div>






         {isModalOpen && (
             <div style={{
               position: 'fixed',
               top: 0,
               left: 0,
               width: '100%',
               height: '100%',
               backgroundColor: 'rgba(255,255,255,0.9)',
               backdropFilter: 'blur(5px)',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               zIndex: 100,
             }}>
               <GlassContainer
                 variant="clear"
                 size={1}
                 style={{
                   position: 'relative',
                 }}
                 contentStyle={{
                   padding: '30px',
                 }}
               >
                 
                 <h2 style={{ 
                   fontSize: '1.5rem',
                   fontWeight: '400',
                   color: 'black',
                   marginTop:'0px',
                   marginBottom: '20px',
                   fontFamily: "'montserrat', sans-serif",
                 }}>Send Feedback</h2>
     
                 <form onSubmit={handleSubmit}>
                   {/* Name Input */}
                   <div style={{ 
                     display: 'flex', 
                     alignItems: 'center',
                     marginBottom: '0px',
                     height: '40px'
                   }}>
                     <label 
                       htmlFor="from_name" 
                       style={{ 
                         width: '100px',
                         fontSize: '1rem',
                         color: 'grey',
                         fontWeight: '500',
                         fontFamily: "'montserrat', sans-serif",
                       }}
                     >
                       Name
                     </label>
                     <input
                       type="text"
                       id="from_name"
                       name="from_name"
                       value={feedback.from_name}
                       onChange={handleChange}
                       required
                       placeholder="Enter your name"
                       style={{
                         flex: 1,
                         padding: '5px 15px',
                         fontFamily: "'montserrat', sans-serif",
                         fontSize: '0.8rem',
                         borderRadius: '25px',
                         border: '1px solid #ddd',
                         outline: 'none',
                       }}
                     />
                   </div>
     
                   {/* Email Input */}
                   <div style={{ 
                     display: 'flex', 
                     alignItems: 'center',
                     marginBottom: '20px',
                     height: '40px'
                   }}>
                     <label 
                       htmlFor="reply_to" 
                       style={{ 
                         width: '100px',
                         fontSize: '1rem',
                         color: 'grey',
                         fontWeight: '500',
                         fontFamily: "'montserrat', sans-serif",
                       }}
                     >
                       Email
                     </label>
                     <input
                       type="email"
                       id="reply_to"
                       name="reply_to"
                       value={feedback.reply_to}
                       onChange={handleChange}
                       required
                       placeholder="Enter your email"
                       style={{
                            padding: '5px 15px',
                         fontFamily: "'montserrat', sans-serif",
                         fontSize: '0.8rem',
                         borderRadius: '25px',
                         border: '1px solid #ddd',
                         outline: 'none',
                       }}
                     />
                   </div>
     
                   {/* Message Input */}
                   <div style={{ 
                     display: 'flex', 
                     marginBottom: '30px',
                   }}>
                    
                     <textarea
                       id="message"
                       name="message"
                       value={feedback.message}
                       onChange={handleChange}
                       required
                       rows="4"
                       placeholder="Enter your feedback"
                       style={{
                         flex: 1,
                         padding: '8px 12px',
                         fontFamily: "'montserrat', sans-serif",
                         fontSize: '0.85rem',
                         borderRadius: '15px',
                         border: '1px solid #ddd',
                         outline: 'none',
                         resize: 'vertical',
                         minHeight: '100px'
                       }}
                     />
                   </div>
     
                   {/* Buttons Container */}
                   <div style={{
                     display: 'flex',
                     gap: '10px',
                     height: '30px',
                     marginTop: '20px'
                   }}>
                     <button
                     
                       onClick={closeModal}
                       style={{padding: '8px 20px',
                         fontSize: '0.85rem',
                         fontWeight: '500',
                         fontFamily: "'montserrat', sans-serif",
                         color: 'grey',
                         display: 'flex',
                         alignItems: 'center',
                         gap: '8px',
                         background: 'white',
                         border: '1px solid #ddd',
                         borderRadius: '35px',
                         cursor: 'pointer',
                       }}>
                    
                       Cancel
                     </button>
     <div>
                     <GlassContainer
                       variant={
                         feedback.from_name && 
                         feedback.reply_to && 
                         feedback.message ? 'green' : 'clear'
                       }
                       size={0}
                       type="submit"
                       disabled={isSending}
                       style={{
                         cursor: 'pointer',
                       }}
                       
                       contentStyle={{
                         fontSize: '0.8rem',
                         fontWeight: '500',
                         height:'28px',
                         width: '100px',
                         fontFamily: "'montserrat', sans-serif",
                         color: feedback.from_name && feedback.reply_to && feedback.message ? 'green' : 'grey',
                         display: 'flex',
                         alignItems: 'center',
                       
                       }}
                     >
                       <div style={{display: 'flex', gap: '10px', marginTop: '-6px',
                         alignItems: 'center',}}>
                         <p>
                       {isSending ? 'Sending...' : 'Send'}   </p> 
                       <SendHorizonal size={16} />
                   </div> 
                     </GlassContainer>
                     </div>
                   </div>
                 </form>
     
                 {sendStatus === 'success' && (
                   <p style={{ 
                     color: 'green', 
                     marginTop: '15px',
                     fontSize: '0.85rem',
                     fontFamily: "'montserrat', sans-serif",
                   }}>
                     Feedback sent successfully!
                   </p>
                 )}
                 {sendStatus === 'error' && (
                   <p style={{ 
                     color: 'red', 
                     marginTop: '15px',
                     fontSize: '0.85rem',
                     fontFamily: "'montserrat', sans-serif",
                   }}>
                     Failed to send feedback. Please try again.
                   </p>
                 )}
               </GlassContainer>
             </div>
           )}
















<motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          style={{ width: '1000px', marginTop: '100px' }}
        >
          <div style={{display: 'flex', alignItems: 'flex-start', gap: '2rem'}}>
            <motion.div
              variants={{
                hidden: { scale: 0.5, opacity: 0 },
                visible: { 
                  scale: 1, 
                  opacity: 1,
                  transition: {
                    type: "spring",
                    stiffness: 200,
                    damping: 20,
                    duration: 0.6
                  }
                }
              }}
            >
              <GlassContainer variant="yellow" style={{ marginRight: '2rem' }} contentStyle={{ 
                padding: '1.5rem 2.5rem', 
                fontSize: '5rem', 
                fontWeight: '400', 
                fontFamily: '"montserrat", sans-serif',
                color: '#ffc300',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                50%
              </GlassContainer>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, x: 50 },
                visible: { 
                  opacity: 1, 
                  x: 0,
                  transition: {
                    duration: 0.5,
                    delay: 0.3,
                    staggerChildren: 0.1
                  }
                }
              }}
            >
              <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { 
                      opacity: 1, 
                      y: 0,
                      transition: {
                        duration: 0.4
                      }
                    }
                  }}
                >
                  <GlassContainer variant="yellow"
                  size={.5}
                  style={{ marginRight: '0rem' }} contentStyle={{ 
                    padding: '0.2rem 2rem', 
                    fontSize: '2.3rem', 
                    fontWeight: '400', 
                    fontFamily: '"montserrat", sans-serif',
                    color: '#ffc300',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    Faster
                  </GlassContainer>
                </motion.div>

                <motion.h1 
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { 
                      opacity: 1, 
                      y: 0,
                      transition: {
                        duration: 0.4
                      }
                    }
                  }}
                  style={{
        textAlign: 'left',
                    fontSize: '2.3REM',
                    fontFamily: '"montserrat", sans-serif',
                    fontWeight: '500',
                    marginBottom: '1.1rem'
                  }}
                >
                  Evaluation
                </motion.h1>
              </div>

              <motion.h1 
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { 
                    opacity: 1, 
                    y: 0,
                    transition: {
                      duration: 0.4,
                      delay: 0.2
                    }
                  }
                }}
                style={{
                  textAlign: 'left',
                  fontSize: '1.3rem', 
                  fontWeight: '400', 
                  marginLeft: '-0px', 
                  color: 'grey',
        fontFamily: '"montserrat", sans-serif',
 
        marginBottom: '40px'
                }}
              >
                Evaluate students in half the time of traditional MCQ assessments, with a higher degree of evaluation accuracy. So, you can spend more class time teaching.
              </motion.h1>
            </motion.div>
          </div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { 
                opacity: 1, 
                y: 0,
                transition: {
                  duration: 0.6,
                  delay: 0.4
                }
              }
            }}
          >
            <GlassContainer variant="clear"
             size={1}
              style={{ width: '100%' }}>
      <div style={{
        width: '100%',
                marginTop: '0rem',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '2rem'
              }}>
                <motion.img 
                  variants={{
                    hidden: { opacity: 0, scale: 0.95 },
                    visible: { 
                      opacity: 1, 
                      scale: 1,
                      transition: {
                        duration: 0.5,
                        delay: 0.6
                      }
                    }
                  }}
                 
            src='/ScreenshotAMCQ.png' 
            style={{
                    width: '50%', 
                    borderRight: '1px solid #ddd',
                    paddingRight: '20px', marginRight: '8rem',
               
                  }}
                />

                <motion.div
                  variants={{
                    hidden: { opacity: 0, scale: 0.8, rotate: -10 },
                    visible: { 
                      opacity: 1, 
                      scale: 1,
                      rotate: 0,
                      transition: {
                        type: "spring",
                        stiffness: 200,
                        damping: 20,
                        delay: 0.7
                      }
                    }
                  }}
                >
                  <GlassContainer variant="yellow" style={{ marginRight: '4rem' }} contentStyle={{ 
                    padding: '1rem 2rem', 
                    fontSize: '2.3rem', 
                    fontWeight: '400', 
                    fontFamily: '"montserrat", sans-serif',
                    color: '#ffc300',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Rabbit size={80} strokeWidth={1.5} />
                  </GlassContainer>
                </motion.div>
      </div>
            </GlassContainer>
          </motion.div>
        </motion.div>





<div style={{ width: '1000px', marginTop: '100px' }}>
     <div style={{display: 'flex', alignItems: 'center', gap: '1rem' }}>
       <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
         <GlassContainer variant="pink" 
                 size={1}
                 contentStyle={{ 
           padding: '0.5rem 2rem', 
           fontSize: '2.3rem', 
           fontWeight: '400', 
           fontFamily: '"montserrat", sans-serif',
           color: '#d138e9',
        display: 'flex',
        alignItems: 'center',
           justifyContent: 'center'
         }}>
           Any Subject, 
         </GlassContainer>
         <GlassContainer variant="pink"
                 size={1}
                  contentStyle={{ 
           padding: '0.5rem 2rem', 
           fontSize: '2.3rem', 
           fontWeight: '400', 
           fontFamily: '"montserrat", sans-serif',
           color: '#d138e9',
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'center'
         }}>
           Any Topic, 
         </GlassContainer>
       </div>
       <div>
         <img src='/AnyResource.svg' style={{height: '6rem', marginLeft: '1rem', 
           marginTop: '-2rem',}}/>
       </div>  

   
</div>  



<motion.div 
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: "-100px" }}
  style={{display: 'flex', marginTop: '100px', position: 'relative'}}
>
  <motion.div
    variants={{
      hidden: { opacity: 0, x: -50 },
      visible: { 
        opacity: 1, 
        x: 0,
        transition: {
          type: "spring",
          stiffness: 100,
          damping: 20,
          duration: 0.8
        }
      }
    }}
    style={{ position: 'relative' }}
  >
    <video
      ref={(el) => {
        if (!el) return;
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              el.play();
            } else {
              el.pause();
            }
          },
          { threshold: 0.5 }
        );
        observer.observe(el);
        return () => observer.disconnect();
      }}
      muted
      loop
      playsInline
      style={{
        width: '100%',
        marginLeft: '80px', 
        marginTop: '-2rem',
        borderRadius: '10px',
        objectFit: 'cover'
      }}
    >
      <source src="/CreateScreen.mp4" type="video/mp4" />
    </video>
  </motion.div>
  <motion.h1 
    variants={{
      hidden: { opacity: 0, x: 50 },
      visible: { 
        opacity: 1, 
        x: 0,
        transition: {
          duration: 0.6,
          delay: 0.2
        }
      }
    }}
    style={{
      textAlign: 'left',
      fontSize: '1.3rem', 
      fontWeight: '400', 
      marginTop: '3rem', 
      color: 'white',
      fontFamily: '"montserrat", sans-serif',
      lineHeight: '2rem',
      marginBottom: '40px', 
      marginLeft: '1rem', 
    }}
  >
    Who said adaptive assessments need to be pre made? <br></br>
    <br></br>Make your own, from your resources, instantly.
  </motion.h1>
</motion.div>

</div>






<div style={{ width: '1000px', marginTop: '100px', }}>

<GlassContainer variant="blue" size={2} style={{ 
         width: '100%',
         marginTop: '4rem',
         marginBottom: '4rem',
         borderRadius: '1.5rem',
       }} contentStyle={{
         padding: '1rem',
       }}>
        <div style={{
           width: '100%',
           display: 'flex',
           alignItems: 'flex-start',
           gap: '3rem'
         }}>
           <div style={{
             padding: '1rem',
             background: 'rgb(255,255,255,.8)',
             borderRadius: '4rem',
          boxShadow: 'rgba(50, 50, 205, 0.05) 0px 2px 5px 0px, rgba(0, 0, 0, 0.05) 0px 1px 1px 0px',
             display: 'flex',
             alignItems: 'center',
             alignSelf: 'center',
             height: '100%',
             marginLeft: '1rem'
           }}>
             <TimerIcon size={80} color="#1651d4"/>
           </div>
           <div style={{flex: 1}}>
             <h1 style={{
               fontSize: '2.5rem',
               fontWeight: '400',
               color: '#1651d4',
               marginBottom: '1.5rem',
            fontFamily: '"montserrat", sans-serif',
             }}>No Grading Time Necessary</h1>
          <p style={{
               fontSize: '1.3rem',
               fontWeight: '500',
            color: '#666',
               fontFamily: '"montserrat", sans-serif',
               lineHeight: '2rem',
               maxWidth: '90%'
          }}>
               Teachers have a lot on their plates. Why add the burden of grading? Amoeba grades instantly, giving teachers back their time while providing students with results and feedback instantly.
          </p>
        </div>
         </div>
       </GlassContainer>

      </div>






<motion.div 
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: "-100px" }}
  style={{ width: '1000px', marginTop: '100px' }}
>
  <div>
    <motion.div 
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
      }}
      style={{display: 'flex', alignItems: 'center', gap: '1rem' }}
    >
      <motion.h1 
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { 
            opacity: 1, 
            y: 0,
            transition: {
              duration: 0.6,
              ease: "easeOut"
            }
          }
        }}
        style={{ 
          fontSize: '2.3rem', 
          fontWeight: '400', 
          fontFamily: '"montserrat", sans-serif',
          color: 'black',
        }}
      >
        Built ground up
      </motion.h1>

      <motion.div
        variants={{
          hidden: { opacity: 0, x: -20 },
          visible: { 
            opacity: 1, 
            x: 0,
            transition: {
              duration: 0.6,
              delay: 0.3,
              ease: "easeOut"
            }
          }
        }}
      >
        <GlassContainer variant="green" 
                size={1}
                contentStyle={{ 
          padding: '0.5rem 2rem', 
          fontSize: '2.3rem', 
          fontWeight: '400', 
          fontFamily: '"montserrat", sans-serif',
          color: '#29c60f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          by teachers and students,
        </GlassContainer>
      </motion.div>
    </motion.div>

    <motion.div
      variants={{
        hidden: { opacity: 0, x: -20 },
        visible: { 
          opacity: 1, 
          x: 0,
          transition: {
            duration: 0.6,
            delay: 0.6,
            ease: "easeOut"
          }
        }
      }}
    >
      <GlassContainer variant="green"
              size={1}
        style={{marginLeft: '-2rem'}} 
        contentStyle={{ 
          padding: '0.5rem 2rem', 
          fontSize: '2.3rem', 
          fontWeight: '400', 
          fontFamily: '"montserrat", sans-serif',
          color: '#29c60f',
          display: 'flex',
          alignItems: 'center', 
          marginLeft: '2px',
          justifyContent: 'center'
        }}
      >
        for teachers and students
      </GlassContainer>
    </motion.div>
    </div>

  <motion.div 
    variants={{
      hidden: { opacity: 0 },
      visible: { 
        opacity: 1,
        transition: {
          duration: 0.6,
          delay: 0.9,
          staggerChildren: 0.1
        }
      }
    }}
    style={{marginTop: '10px'}}
  >
    <motion.p
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: {
            duration: 0.6
          }
        }
      }}
      style={{
        fontSize: '1.3rem',
        fontWeight: '400',
        color: '#666',
        fontFamily: '"montserrat", sans-serif',
        lineHeight: '2rem',
        maxWidth: '90%',
        marginBottom: '4rem'
      }}
    >
      We know how to make everything that much easier, because we're you:
    </motion.p>

    <GlassContainer variant="clear" size={1} style={{ width: '100%' }}>
      <div style={{ 
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '1rem 0px',
        gap: '0rem'
      }}>
        {[
          { 
            icon: <Hourglass size={60}  strokeWidth={1.5} color="#666" />, 
            title: "Time Saving",
            description: "Extended time "
          },
          { 
            icon: <Palette size={60}  strokeWidth={1.5} color="#666" />, 
            title: "Customizable",
            description: "Color coded classes"
          },
          { 
            icon: <Lock size={60}  strokeWidth={1.5} color="#666" />, 
            title: "Secure",
            description: "exam security"
          },
          { 
            icon: <NotebookPen size={60}  strokeWidth={1.5} color="#666" />, 
            title: "Smart Feedback",
            description: "Roster organization"
          },
          { 
            icon: <PlusCircle size={60} strokeWidth={1.5} color="#666" />, 
            title: "Expandable",
            description: "So much more"
          }
        ].map((item, index) => (
          <>
            <motion.div 
              key={index}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { 
                  opacity: 1, 
                  y: 0,
                  transition: {
                    duration: 0.5,
                    delay: index * 0.2
                  }
                }
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                flex: 1,
              }}
            >
              <div 
                style={{
                  padding: '2rem',
                  marginBottom: '-1rem'
                }}
              >
                {item.icon}
              </div>

              <motion.p 
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1 }
                }}
                style={{
                  fontSize: '1rem',
                  color: '#666',
                  fontWeight: '500',
                  fontFamily: '"montserrat", sans-serif'
                }}
              >
                {item.description}
              </motion.p>
            </motion.div>
            {index < 4 && (
              <motion.div 
                variants={{
                  hidden: { opacity: 0 },
                  visible: { 
                    opacity: 1,
                    transition: {
                      duration: 0.3,
                      delay: (index * 0.2) + 0.1
                    }
                  }
                }}
                style={{
                  width: '1px',
                  alignSelf: 'stretch',
                  background: '#ddd',
                  margin: '1rem 0'
                }} 
              />
            )}
          </>
        ))}
      </div>
    </GlassContainer>
  </motion.div>
</motion.div>









<div style={{ width: '1000px', marginTop: '100px', }}>
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-100px" }}
    variants={{
      hidden: {},
      visible: {
        transition: {
          staggerChildren: 0.2
        }
      }
    }}
  >
    <motion.div 
      style={{display: 'flex', alignItems: 'center', gap: '1rem' }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.2
          }
        }
      }}
    >
      <motion.h1 
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { 
            opacity: 1, 
            y: 0,
            transition: {
              duration: 0.5
            }
          }
        }}
        style={{ 
          fontSize: '2.3rem', 
          fontWeight: '400', 
          fontFamily: '"montserrat", sans-serif',
          color: 'black',
        }}
      >
        Get started at
      </motion.h1>

      <motion.div
        variants={{
          hidden: { opacity: 0, x: -20 },
          visible: { 
            opacity: 1, 
            x: 0,
            transition: {
              duration: 0.6,
              ease: "easeOut"
            }
          }
        }}
      >
        <GlassContainer variant="pink"
                size={1} contentStyle={{ 

          padding: '0.5rem 2rem', 
          fontSize: '2.3rem', 
          fontWeight: '400', 
          fontFamily: '"montserrat", sans-serif',
          color: '#d138e9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          lightning speed
        </GlassContainer>
      </motion.div>
    </motion.div>  

    <motion.div style={{}}>
      <motion.p 
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { 
            opacity: 1, 
            y: 0,
            transition: {
              duration: 0.5,
              delay: 0.3
            }
          }
        }}
        style={{
          fontSize: '1.3rem',
          fontWeight: '400',
          color: '#666',
          fontFamily: '"montserrat", sans-serif',
          lineHeight: '2rem',
          maxWidth: '90%',
          marginBottom: '4rem',
          marginTop: '-0rem'
        }}
      >
        click on a tile to learn more about each step
      </motion.p>

      <div style={{ 
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '1rem 0px',
        gap: '0rem'
      }}>
        {[
          { 
            icon: <Signature size={60} strokeWidth={1} color="grey" />, 
            title: "Sign Up",
            description: "Create your free account in seconds. No credit card required.",
            longDescription: "Getting started with Amoeba is quick and easy. Simply enter your email and create a password. You can choose between a teacher or student account. Teachers get immediate access to all features, while students can join their teacher's classes instantly."
          },
          { 
            icon: <HousePlus size={60} strokeWidth={1.5} color="grey" />, 
            title: "Create Class",
            description: "Set up your virtual classroom",
            longDescription: "Create your first class in just a few clicks. Name your class, add a description, and customize settings like grading scales and late submission policies. You can create multiple classes and organize them by subject, period, or any way you prefer."
          },
          { 
            icon: <Users size={60} strokeWidth={1.5} color="grey" />, 
            title: "Send Join Code",
            description: "Invite your students",
            longDescription: "Each class gets a unique join code. Share this code with your students and they can instantly join your class. You can also generate a direct join link or integrate with Google Classroom for seamless enrollment. Monitor who joins in real-time."
          },
          { 
            icon: <BookPlus size={60}  strokeWidth={1.5} color="grey" />, 
            title: "Create Test",
            description: "Build your first assignment",
            longDescription: "Choose from multiple assessment types including adaptive questions, multiple choice, and open-ended responses. Our intuitive editor lets you create engaging assessments with rich text, images, and mathematical notation. Set due dates, time limits, and customize scoring options."
          },
          { 
            icon: <CheckCircle size={60} strokeWidth={1.5} color="grey" />, 
            title: "Done!",
            description: "Ready to go",
            longDescription: "That's it! Your class is set up and ready for your first assignment. Students will receive instant feedback on their work, and you'll get detailed analytics on their performance. Our adaptive technology ensures each student is appropriately challenged."
          }
        ].map((item, index) => (
          <>
            <motion.div
              key={index}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { 
                  opacity: 1, 
                  y: 0,
                  transition: {
                    duration: 0.5,
                    delay: 0.4 + (index * 0.1)
                  }
                }
              }}
            >
              <GlassContainer 
                variant="clear" 
                size={1} 
                onClick={() => setSelectedTile(index)}
                style={{
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  ...(selectedTile === index ? {
                    boxShadow: '0 8px 20px rgba(187, 145, 221, 0.15)',
                    transform: 'translateY(-5px)',
                    border: '2px solid #f0f0f0'
                  } : {
                    ':hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 5px 15px rgba(152, 92, 175, 0.1)'
                    }
                  })
                }}
                contentStyle={{ 
                  height: '180px',
                  width: '180px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '0rem'
                }}
              >
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  flex: 1,
                }}>
                  <div style={{
                    padding: '2rem',
                    marginBottom: '-1rem'
                  }}>
                    {item.icon}
                  </div>
                  <p style={{
                    fontSize: '1rem',
                    color: '#666',
                    fontWeight: '500',
                    fontFamily: '"montserrat", sans-serif'
                  }}>{item.title}</p>
                </div>
              </GlassContainer>
            </motion.div>
            {index < 4 && (
              <motion.div 
                variants={{
                  hidden: { opacity: 0 },
                  visible: { 
                    opacity: 1,
                    transition: {
                      duration: 0.3,
                      delay: 0.6 + (index * 0.1)
                    }
                  }
                }}
                style={{
                  width: '3px',
                  alignSelf: 'stretch',
                  borderRadius: '10px',
                  background: '#e0e0e0',
                  margin: '.5rem 10px'
                }} 
              />
            )}
          </>
        ))}
      </div>

      {selectedTile !== null && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <GlassContainer 
                  size={1}
            variant="clear"
            style={{
              marginTop: '2rem',
              width: '100%'
            }}
            contentStyle={{
              padding: '2rem'
            }}
          >
            <p style={{
              fontSize: '1.2rem',
              color: '#666',
              fontWeight: '400',
              fontFamily: '"montserrat", sans-serif',
              lineHeight: '1.8',
              margin: 0
            }}>
              {[
                { 
                  icon: <Signature size={60} color="grey" />, 
                  title: "Sign Up",
                  description: "Create your free account in seconds. No credit card required.",
                  longDescription: "Getting started with Amoeba is quick and easy. Simply enter your email and create a password. You can choose between a teacher or student account. Teachers get immediate access to all features, while students can join their teacher's classes instantly."
                },
                { 
                  icon: <HousePlus size={60} color="grey" />, 
                  title: "Create Class",
                  description: "Set up your virtual classroom",
                  longDescription: "Create your first class in just a few clicks. Name your class, add a description, and customize settings like grading scales and late submission policies. You can create multiple classes and organize them by subject, period, or any way you prefer."
                },
                { 
                  icon: <Users size={60} color="grey" />, 
                  title: "Send Join Code",
                  description: "Invite your students",
                  longDescription: "Each class gets a unique join code. Share this code with your students and they can instantly join your class. You can also generate a direct join link or integrate with Google Classroom for seamless enrollment. Monitor who joins in real-time."
                },
                { 
                  icon: <BookPlus size={60} color="grey" />, 
                  title: "Create Test",
                  description: "Build your first assignment",
                  longDescription: "Choose from multiple assessment types including adaptive questions, multiple choice, and open-ended responses. Our intuitive editor lets you create engaging assessments with rich text, images, and mathematical notation. Set due dates, time limits, and customize scoring options."
                },
                { 
                  icon: <CheckCircle size={60} color="grey" />, 
                  title: "Done!",
                  description: "Ready to go",
                  longDescription: "That's it! Your class is set up and ready for your first assignment. Students will receive instant feedback on their work, and you'll get detailed analytics on their performance. Our adaptive technology ensures each student is appropriately challenged."
                }
              ][selectedTile].longDescription}
            </p>
          </GlassContainer>
        </motion.div>
      )}
    </motion.div>
  </motion.div>
</div>








   


<Element name="faq-section" style={{ width: '1000px', marginTop: '100px', marginBottom: '100px' }}>
  <h1 style={{ 
    fontSize: '2.3rem', 
    fontWeight: '400', 
    fontFamily: '"montserrat", sans-serif',
    color: 'black',
    marginBottom: '2rem'
  }}>
    Frequently Asked Questions
  </h1>

  <div style={{ 
    border: '1px solid #e0e0e0',
    borderRadius: '25px',
    overflow: 'hidden'
  }}>
    {[
      {
        question: "Is Amoeba Free?",
        answer: " Amoeba is currently free for both teachers and students under our pilot program. We believe in making quality education tools accessible to everyone. "
      },
      {
        question: "What is an adaptive assessment?",
        answer: "An adaptive assessment is a dynamic test that adjusts its difficulty based on student responses in real-time. As students answer questions correctly, they receive more challenging questions. If they struggle, the difficulty adjusts to help them build confidence. This creates a personalized learning experience that accurately measures student knowledge."
      },
      {
        question: "Why are adaptive assessments better than traditional?",
        answer: "Adaptive assessments offer several advantages: they provide more accurate measurement of student abilities, reduce test anxiety by matching question difficulty to student level, save time by requiring fewer questions to assess knowledge, and offer immediate personalized feedback. They also help identify knowledge gaps more precisely and keep students engaged by providing appropriate challenges."
      },
      {
        question: "Does Amoeba use AI?",
        answer: "Yes, Amoeba uses AI responsibly to enhance the learning experience. We utilize AI for automated grading, generating personalized feedback, and adapting question difficulty. Our AI implementation follows strict educational guidelines and is continuously monitored to ensure accuracy and fairness. "
      },
      {
        question: "Are interactions with Amoeba used to train AI?",
        answer: "No. Our API providers do not train with anything we pass them. Your interactions, responses, and data are never used for AI training purposes. This ensures complete privacy and separation between our service and AI model training."
      },
      {
        question: "Does Amoeba sell data?",
        answer: "Absolutely not. We never sell or share student or teacher data with third parties. Your privacy is our top priority. All data is encrypted, stored securely, and used solely to provide and improve our educational services. We comply with all educational privacy laws and regulations, including FERPA and COPPA."
      }
    ].map((item, index, array) => (
      <div 
        key={index}
        onClick={() => setSelectedFaq(selectedFaq === index ? null : index)}
        style={{
          cursor: 'pointer',
          borderBottom: index < array.length - 1 ? '1px solid #e0e0e0' : 'none',
          background: 'white'
        }}
      >
        <div style={{
          padding: '1.5rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: selectedFaq === index ? '#f9f9f9' : 'white',
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '1.1rem',
            fontWeight: '500',
            color: '#333',
            fontFamily: '"montserrat", sans-serif'
          }}>{item.question}</h3>
          <ChevronDown 
            size={20} 
            style={{
              transform: selectedFaq === index ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.2s ease',
              color: '#666'
            }}
          />
</div>  
        {selectedFaq === index && (
          <div style={{
            padding: '0 2rem 1.5rem 2rem',
            background: '#f9f9f9',
          }}>
            <p style={{
              margin: 0,
              fontSize: '1rem',
              lineHeight: '1.6',
              color: '#666',
              fontFamily: '"montserrat", sans-serif'
            }}>{item.answer}</p>
          </div>
        )}
      </div>
    ))}
  </div>
</Element>


         

     
   
          <FooterAuth style={{ marginTop: '100px', height: '200px' }} />
        
      </div>
    </div>


  );
};

export default Auth;
