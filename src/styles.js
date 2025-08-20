// Glass variant styles with 10 color options
// All variants have 50% opacity, 100% border radius, and gradient borders

import React, { useState, useEffect, useRef } from 'react';
import { Check, X } from "lucide-react";

export const glassStyles = {
  // Clear glass variant - 102 degrees
  clear: {
    container: {
      position: 'relative',
      display: 'inline-block',
      padding: '0',
      border: 'none',
      background: 'transparent',
      borderRadius: '40px'
    },
    gradientBorder: {
      position: 'absolute',
      top: '-2px',
      left: '-2px',
      right: '-2px',
      bottom: '3px',
      borderRadius: '40px',
      zIndex: '-1',
      transition: 'background 0.6s ease'
    },
    gradientAngle: 190,
    hoverAngleDelta: 180,
    gradientColors: 'rgba(255, 255, 255, 1) 1%, rgb(221, 221, 221) 50%, rgba(255, 255, 255, 1) 100%',
    content: {
      backgroundColor: 'rgba(255, 255, 255, 1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '38px',
      margin: '2px',
      boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.05), inset 2px 2px 3px 0px rgba(255, 255, 255, 1), inset -2px -2px 3px 0px rgba(255, 255, 255, 1)',
      position: 'relative',
      zIndex: '1',
    }
  },

  // Teal glass variant - 190 degrees
  teal: {
    container: {
      position: 'relative',
      display: 'inline-block',
      padding: '0',
      border: 'none',
      background: 'transparent',
      borderRadius: '300px'
    },
    gradientBorder: {
      position: 'absolute',
      top: '-2px',
      left: '-2px',
      right: '-2px',
      bottom: '2px',
      borderRadius: '300px',
      zIndex: '-1',
      transition: 'background 0.3s ease'
    },
    gradientAngle: 190,
    hoverAngleDelta: 180,
    gradientColors: 'rgba(0, 215, 188, 0.00) 1%, rgba(0, 215, 188, .5) 50%, rgba(0, 215, 188, 0.00) 100%',
    content: {
      backgroundColor: 'rgba(233, 255, 253, 1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '298px',
      margin: '2px',
      boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.05), inset 2px 2px 3px 0px rgba(255, 255, 255, 1), inset -2px -2px 3px 0px rgba(255, 255, 255, 1)',
      position: 'relative',
      zIndex: '1',
    }
  },

  // Blue glass variant - 20 degrees
  blue: {
    container: {
      position: 'relative',
      display: 'inline-block',
      padding: '0',
      border: 'none',
      background: 'transparent',
      borderRadius: '300px'
    },
    gradientBorder: {
      position: 'absolute',
      top: '-2px',
      left: '-2px',
      right: '-2px',
      bottom: '2px',
      borderRadius: '300px',
      zIndex: '-1',
      transition: 'background 0.3s ease'
    },
    gradientAngle: 20,
    hoverAngleDelta: 160,
    gradientColors: 'rgba(151, 183, 255, 0.05) 1%, rgba(151, 183, 255, 1) 50%, rgba(151, 183, 255, 0.05) 100%',
    content: {
      backgroundColor: 'rgba(225, 230, 255, 1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '298px',
      margin: '2px',
      boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.05), inset 2px 2px 3px 0px rgba(255, 255, 255, 1), inset -2px -2px 3px 0px rgba(255, 255, 255, 1)',
      position: 'relative',
      zIndex: '1',
    }
  },

  // Green glass variant - 20 degrees
  green: {
    container: {
      position: 'relative',
      display: 'inline-block',
      padding: '0',
      border: 'none',
      background: 'transparent',
      borderRadius: '300px'
    },
    gradientBorder: {
      position: 'absolute',
      top: '-2px',
      left: '-2px',
      right: '-2px',
      bottom: '2px',
      borderRadius: '300px',
      zIndex: '-1',
      transition: 'background 0.3s ease'
    },
    gradientAngle: 20,
    hoverAngleDelta: 140,
    gradientColors: 'rgba(151, 247, 135, 0.05) 1%, rgba(151, 247, 135, 1) 50%, rgba(151, 247, 135, 0.05) 100%',
    content: {
      backgroundColor: 'rgba(234, 255, 231, 1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '298px',
      margin: '2px',
      boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.05), inset 2px 2px 3px 0px rgba(255, 255, 255, 1), inset -2px -2px 3px 0px rgba(255, 255, 255, 1)',
      position: 'relative',
      zIndex: '1',
    }
  },

  // Purple glass variant - 205 degrees
  purple: {
    container: {
      position: 'relative',
      display: 'inline-block',
      padding: '0',
      border: 'none',
      background: 'transparent',
      borderRadius: '300px'
    },
    gradientBorder: {
      position: 'absolute',
      top: '-2px',
      left: '-2px',
      right: '-2px',
      bottom: '2px',
      borderRadius: '300px',
      zIndex: '-1',
      transition: 'background 0.3s ease'
    },
    gradientAngle: 205,
    hoverAngleDelta: 120,
    gradientColors: 'rgba(255, 255, 255, 0.05) 1%, rgb(190, 149, 255) 50%, rgba(149, 97, 200,  0.05) 100%',
    content: {
      backgroundColor: 'rgba(243, 230, 255, 1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '298px',
      margin: '2px',
      boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.05), inset 2px 2px 3px 0px rgba(255, 255, 255, .5), inset -2px -2px 3px 0px rgba(255, 255, 255, .5)',
      position: 'relative',
      zIndex: '1',
    }
  },

  // Pink glass variant - 20 degrees
  pink: {
    container: {
      position: 'relative',
      display: 'inline-block',
      padding: '0',
      border: 'none',
      background: 'transparent',
      borderRadius: '300px'
    },
    gradientBorder: {
      position: 'absolute',
      top: '-2px',
      left: '-2px',
      right: '-2px',
      bottom: '2px',
      borderRadius: '300px',
      zIndex: '-1',
      transition: 'background 0.3s ease'
    },
    gradientAngle: 20,
    hoverAngleDelta: 200,
    gradientColors: 'rgba(213, 152, 223, .05) 1%, rgb(245, 178, 255) 50%, rgba(213, 152, 223, 0.05) 100%',
    content: {
      backgroundColor: 'rgba(252, 237, 255,1 )',
      backdropFilter: 'blur(10px)',
      borderRadius: '298px',
      margin: '2px',
      boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.05), inset 2px 2px 3px 0px rgba(255, 255, 255, 1), inset -2px -2px 3px 0px rgba(255, 255, 255, 1)',
      position: 'relative',
      zIndex: '1',
    }
  },

  // Yellow glass variant - 205 degrees
  yellow: {
    container: {
      position: 'relative',
      display: 'inline-block',
      padding: '0',
      border: 'none',
      background: 'transparent',
      borderRadius: '300px'
    },
    gradientBorder: {
      position: 'absolute',
      top: '-2px',
      left: '-2px',
      right: '-2px',
      bottom: '2px',
      borderRadius: '300px',
      zIndex: '-1',
      transition: 'background 0.3s ease'
    },
    gradientAngle: 205,
    hoverAngleDelta: 90,
    gradientColors: 'rgba(255, 243, 204, 0.05) 1%, rgba(255, 195, 0, 1) 50%, rgba(255, 193, 7, 0.05) 100%',
    content: {
      backgroundColor: 'rgba(255, 243, 204, 1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '298px',
      margin: '2px',
      boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.05), inset 2px 2px 3px 0px rgba(255, 255, 255, 1), inset -2px -2px 3px 0px rgba(255, 255, 255, 1)',
      position: 'relative',
      zIndex: '1',
    }
  },

  // Orange glass variant - 189 degrees
  orange: {
    container: {
      position: 'relative',
      display: 'inline-block',
      padding: '0',
      border: 'none',
      background: 'transparent',
      borderRadius: '300px'
    },
    gradientBorder: {
      position: 'absolute',
      top: '-2px',
      left: '-2px',
      right: '-2px',
      bottom: '2px',
      borderRadius: '300px',
      zIndex: '-1',
      transition: 'background 0.3s ease'
    },
    gradientAngle: 189,
    hoverAngleDelta: 110,
    gradientColors: 'rgba(233, 130, 58, 0.05) 1%, rgba(253, 126, 20, .7) 50%, rgba(253, 126, 20, 0.05) 100%',
    content: {
      backgroundColor: 'rgba(255, 231, 210, 1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '298px',
      margin: '2px',
      boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.05), inset 2px 2px 3px 0px rgba(255, 255, 255, 1), inset -2px -2px 3px 0px rgba(255, 255, 255, 1)',
      position: 'relative',
      zIndex: '1',
    }
  },

  // Grey glass variant - 20 degrees
  grey: {
    container: {
      position: 'relative',
      display: 'inline-block',
      padding: '0',
      border: 'none',
      background: 'transparent',
      borderRadius: '300px'
    },
    gradientBorder: {
      position: 'absolute',
      top: '-2px',
      left: '-2px',
      right: '-2px',
      bottom: '2px',
      borderRadius: '300px',
      zIndex: '-1',
      transition: 'background 0.3s ease'
    },
    gradientAngle: 20,
    hoverAngleDelta: 170,
    gradientColors: 'rgba(108, 117, 125, 0.05) 1%, rgb(200, 207, 214) 50%, rgba(108, 117, 125, 0.05) 100%',
    content: {
      backgroundColor: 'rgb(240, 240, 240)',
      backdropFilter: 'blur(10px)',
      borderRadius: '298px',
      margin: '2px',
      boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.05), inset 2px 2px 3px 0px rgba(255, 255, 255, 1), inset -2px -2px 3px 0px rgba(255, 255, 255, 1)',
      position: 'relative',
      zIndex: '1',
    }
  },

    // darkgreen  glass variant - 20 degrees
  darkgreen: {
    container: {
      position: 'relative',
      display: 'inline-block',
      padding: '0',
      border: 'none',
      background: 'transparent',
      borderRadius: '300px'
    },
    gradientBorder: {
      position: 'absolute',
      top: '-2px',
      left: '-2px',
      right: '-2px',
      bottom: '2px',
      borderRadius: '300px',
      zIndex: '-1',
      transition: 'background 0.3s ease'
    },
    gradientAngle: 20,
    hoverAngleDelta: 170,
    gradientColors: 'rgba(9, 129, 29, 0.05) 1%, rgba(13, 158, 61, 1) 50%, rgba(9, 129, 29, 0.05) 100%',
    content: {
      backgroundColor: 'rgba(201, 240, 190, 1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '298px',
      margin: '2px',
      boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.05), inset 2px 2px 3px 0px rgba(255, 255, 255, 1), inset -2px -2px 3px 0px rgba(255, 255, 255, 1)',
      position: 'relative',
      zIndex: '1',
    }
  },



  // Red glass variant - 205 degrees
  red: {
    container: {
      position: 'relative',
      display: 'inline-block',
      padding: '0',
      border: 'none',
      background: 'transparent',
      borderRadius: '300px'
    },
    gradientBorder: {
      position: 'absolute',
      top: '-2px',
      left: '-2px',
      right: '-2px',
      bottom: '2px',
      borderRadius: '300px',
      zIndex: '-1',
      transition: 'background 0.3s ease'
    },
    gradientAngle: 205,
    hoverAngleDelta: 130,
    gradientColors: 'rgba(255, 167, 167, 0.05) 1%, rgb(255, 93, 93) 50%, rgba(255, 167, 167, 0.05) 100%',
    content: {
      backgroundColor: 'rgba(255, 200,200, 1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '298px',
      margin: '2px',
      boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.05), inset 2px 2px 3px 0px rgba(255, 255, 255, .5), inset -2px -2px 3px 0px rgba(255, 255, 255, .5)',
      position: 'relative',
      zIndex: '1',
    }
  },
};

// Helper function to get glass style by variant name
export const getGlassStyle = (variant = 'clear') => {
  return glassStyles[variant] || glassStyles.clear;
};

// Helper function to apply glass style to an element
export const applyGlassStyle = (element, variant = 'clear') => {
  const style = getGlassStyle(variant);
  Object.assign(element.style, style);
};

// Helper component for glass effect with optional hover rotation
export const GlassContainer = ({ variant = 'clear', children, style = {}, contentStyle = {}, size = 2, enableRotation = false, ...props }) => {
  const [currentAngle, setCurrentAngle] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const animationRef = useRef(null);
  
  const glassVariant = glassStyles[variant] || glassStyles.clear;
  
  // Initialize current angle to the base angle
  useEffect(() => {
    setCurrentAngle(glassVariant.gradientAngle);
  }, [glassVariant.gradientAngle]);
  
  // Handle smooth rotation animation (only if enableRotation is true)
  useEffect(() => {
    if (!enableRotation) return; // Skip animation if rotation is disabled
    
    const targetAngle = glassVariant.gradientAngle + (isHovered ? glassVariant.hoverAngleDelta : 0);
    
    // Calculate timing for 360 degrees in 1.8 seconds
    const totalDegrees = 360;
    const totalTime = 1800; // 1.8 seconds in milliseconds
    const degreesPerMs = totalDegrees / totalTime; // ~0.2 degrees per ms
    const intervalMs = 8; // Update every 8ms for smooth animation
    const degreesPerInterval = degreesPerMs * intervalMs; // ~1.6 degrees per interval
    
    // Start animation
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }
    
    animationRef.current = setInterval(() => {
      setCurrentAngle(prevAngle => {
        // Normalize angles to 0-360 range
        const normalizedPrev = ((prevAngle % 360) + 360) % 360;
        const normalizedTarget = ((targetAngle % 360) + 360) % 360;
        
        // Calculate the shortest path (considering wrap-around)
        let diff = normalizedTarget - normalizedPrev;
        
        // Adjust for shortest path around the circle
        if (diff > 180) {
          diff -= 360; // Go the other way (shorter path)
        } else if (diff < -180) {
          diff += 360; // Go the other way (shorter path)
        }
        
        // If we're close enough (within one interval step), snap to target
        if (Math.abs(diff) <= degreesPerInterval) {
          clearInterval(animationRef.current);
          return targetAngle; // Return the actual target, not normalized
        }
        
        // Move closer to target at the calculated rate
        const direction = diff > 0 ? 1 : -1;
        return prevAngle + (direction * degreesPerInterval);
      });
    }, intervalMs); // 8ms interval for smooth animation
    
    // Cleanup on unmount
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [isHovered, glassVariant.gradientAngle, glassVariant.hoverAngleDelta, enableRotation]);
  
  // Create custom gradient border positioning based on size parameter
  const customGradientBorder = {
    ...glassVariant.gradientBorder,
    top: `-${size}px`,
    left: `-${size}px`,
    right: `-${size}px`,
    bottom: `${-size + 0}px`,
    background: enableRotation 
      ? `linear-gradient(${currentAngle}deg, ${glassVariant.gradientColors})`
      : `linear-gradient(${glassVariant.gradientAngle}deg, ${glassVariant.gradientColors})`,
    transition: 'none', // No transitions when rotation is disabled
  };
  
  return (
    <div 
      style={{ ...glassVariant.container, ...style }} 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      <div style={customGradientBorder}></div>
      <div style={{ 
        ...glassVariant.content, 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        textAlign: 'left',
        ...contentStyle 
      }}>
        {children}
      </div>
    </div>
  );
};

// Export individual variants for direct use
export const {
  clear,
  teal,
  blue,
  green,
  
  darkgreen,
  purple,
  pink,
  yellow,
  orange,
  grey,
  red
} = glassStyles; 

// Custom Switch Component
export const CustomSwitch = ({ checked, onChange, variant = "teal", disabled = false }) => {
  const switchStyles = {
    container: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      marginLeft: 'auto',
      gap: '8px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
    },
    input: {
      position: 'absolute',
      width: '54px',
      height: '28px',
      appearance: 'none',
      backgroundColor: disabled ? 'white' : 'white',
      borderRadius: '20px',
      transition: 'all 0.3s ease',
      cursor: disabled ? 'disabled' : 'pointer',
      border: `1px solid ${disabled ? '#e0e0e0' : '#ddd'}`,
      '&:checked': {
        backgroundColor: disabled ? 'white' : 'white',
      },
    },
    switchContainer: {
      position: 'relative',
      width: '54px',
      height: '26px',
      padding: '1px',
    },
    label: {
      fontSize: '14px',
      color: disabled ? '#a0a0a0' : (checked ? 'grey' : 'grey'),
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: '400',
      userSelect: 'none',
      marginLeft: '4px',
      transition: 'color 0.3s ease',
    }
  };

  const handleClick = () => {
    if (!disabled) {
      onChange?.({ target: { checked: !checked } });
    }
  };

  return (
    <div style={switchStyles.container} onClick={handleClick}>
      
      <div style={switchStyles.switchContainer}>
        <input
          type="checkbox"
          checked={checked}
          onChange={() => {}}
          disabled={disabled}
          style={{
            ...switchStyles.input,
            margin: 0,
            outline: 'none',
          }}
        />
        <div style={{
          position: 'absolute',
          top: '1px',
          left: checked ? '25px' : '3px',
          transition: 'left 0.3s ease',
          transform: 'scale(0.8)',
          pointerEvents: 'none',
          opacity: disabled ? 0.6 : 1,
        }}>
          <GlassContainer
            variant={checked ? 'green' : 'clear'}
            size={0}
            
          enableRotation={true}
            style={{
              pointerEvents: 'none',
            }}
            contentStyle={{
              borderRadius: '50%',
              width: '24px',
              color: checked ? 'green' : '#ddd',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div style={{ 
              display: 'flex',
              alignItems: 'center', 
              justifyContent: 'center'
            }}>
              {checked ? 
                <Check size={14}/> 
              : 
                <X size={14}/>
              }
            </div>
          </GlassContainer>
        </div>
      </div>
    
    </div>
  );
};