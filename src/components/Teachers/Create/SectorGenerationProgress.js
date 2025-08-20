import React, { useState, useEffect, useCallback } from 'react';
import { GlassContainer } from '../../../styles';
import { Check } from 'lucide-react';

const TypewriterText = ({ text, onComplete, speed = 50 }) => {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Reset when text changes
    setCurrentText('');
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setCurrentText(text.slice(0, currentIndex + 1));
        setCurrentIndex(i => i + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (currentIndex === text.length && onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return (
    <span style={{ 
      whiteSpace: 'pre',
      minWidth: '20px',

    fontSize: '1.5rem',
    fontWeight: '400',
      display: 'inline-block'
    }}>
      {currentText}
    </span>
  );
};

const LoadingDots = ({ currentDot }) => (
  <div style={{
    display: 'flex',
    gap: '8px',
    marginLeft: 'auto',
    paddingLeft: '15px',
    opacity: 0,
    animation: 'fadeIn 0.3s ease forwards'
  }}>
    {[0, 1, 2].map((index) => (
      <GlassContainer
        key={index}
        variant={currentDot === index ? "green" : "clear"}
        size={0}
        contentStyle={{
          width: '8px',
          height: '8px',
          transition: 'all 0.3s ease'
        }}
      />
    ))}
  </div>
);

const SectorGenerationProgress = ({ sectors, completedSectors }) => {
  const [showTitle, setShowTitle] = useState(false);
  const [showSectors, setShowSectors] = useState(false);
  const [showLoadingDots, setShowLoadingDots] = useState(false);
  const [currentDot, setCurrentDot] = useState(0);
  const [titlePhase, setTitlePhase] = useState('identifying');

  const startGeneratingPhase = useCallback(() => {
    setTimeout(() => {
      setTitlePhase('generating');
      setTimeout(() => {
        setShowLoadingDots(true);
      }, 1000);
    }, 3000); // Increased wait time to 3 seconds
  }, []);

  useEffect(() => {
    const sequence = async () => {
      setShowTitle(true);
    };

    sequence();

    const dotInterval = setInterval(() => {
      setCurrentDot(prev => (prev + 1) % 3);
    }, 600);

    return () => clearInterval(dotInterval);
  }, [sectors.length]);

  const handleTitleComplete = () => {
    setTimeout(() => {
      setShowSectors(true);
      startGeneratingPhase();
    }, 500); // Changed from 2000 to 500 milliseconds
  };

  const initialTitle = `${sectors.length} Modules Identified`;
  const generatingTitle = `Generating Questions for ${sectors.length} Modules`;

  return (
    <div style={{
      width: '100%',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      position: 'relative',
      zIndex: 1001
    }}>
      <GlassContainer
        variant="clear"
        size={2}
        style={{
          width: '100%',
          marginBottom: '20px'
        }}
        contentStyle={{
          padding: '30px'
        }}
      >
        <h2 style={{
          margin: '0 0 20px 0',
          color: '#333',
          fontSize: '1.5rem',
          fontWeight: '500',
          textAlign: 'center',
          fontFamily: "'Montserrat', sans-serif",
          minHeight: '36px'
        }}>
          {showTitle && (
            <TypewriterText 
              text={titlePhase === 'identifying' ? initialTitle : generatingTitle}
              speed={50}
              onComplete={titlePhase === 'identifying' ? handleTitleComplete : undefined}
            />
          )}
        </h2>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          width: '100%'
        }}>
          {sectors.map((sector, index) => (
            <div
              key={index}
              style={{
                opacity: showSectors ? 1 : 0,
                transform: showSectors ? 'translateY(0)' : 'translateY(20px)',
                transition: `all 0.5s ease ${index * 200}ms`,
                padding: completedSectors.has(sector.sectorNumber) ? '0px' : '10px 15px',
                border: titlePhase === 'generating' && !completedSectors.has(sector.sectorNumber) ? '1px solid #ddd' : 'none',
                borderRadius: completedSectors.has(sector.sectorNumber) ? '0px' : '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: completedSectors.has(sector.sectorNumber) ? 'transparent' : 'white',
                width: completedSectors.has(sector.sectorNumber) ? '100%' : 'calc(100% - 30px)',
                marginLeft: titlePhase === 'identifying' ? '15px' : '0'
              }}
            >
              {completedSectors.has(sector.sectorNumber) ? (
                <GlassContainer
                  variant="green"
                  size={0}
                  style={{
                    width: '100%'
                  }}
                  contentStyle={{
                    padding: '10px 20px',
              height: '20px'
                  }}
                >

                  <div style={{      display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'}}> 
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    flex: 1
                  }}>
                    <span style={{
                      fontSize: '1rem',
                      color: '#2BB514',
                      fontWeight: '500'
                    }}>
                      Module {sector.sectorNumber}
                    </span>
                    <span style={{
                      fontSize: '0.9rem',
                      color: '#666'
                    }}>
                      {sector.sectorName}
                    </span>
                  </div>
                  <Check size={20} color="#2BB514" style={{ marginLeft: '15px' }} />
                  </div>
                </GlassContainer>
              ) : (
                <>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    flex: 1
                  }}>
                    <span style={{
                      fontSize: '1rem',
                      color: '#666',
                      fontWeight: '500'
                    }}>
                      Module {sector.sectorNumber}
                    </span>
                    <span style={{
                      fontSize: '0.9rem',
                      color: '#666'
                    }}>
                      {sector.sectorName}
                    </span>
                  </div>
                  {showLoadingDots && <LoadingDots currentDot={currentDot} />}
                </>
              )}
            </div>
          ))}
        </div>
      </GlassContainer>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};

export default SectorGenerationProgress; 