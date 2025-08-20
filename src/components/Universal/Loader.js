import React, { useState, useEffect } from 'react';
import { GlassContainer } from '../../styles';

const Loader = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const colors = ['yellow', 'pink', 'blue', 'green'];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % colors.length);
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
      height: '30px'
    }}>
      {colors.map((color, index) => (
        <GlassContainer
          key={color}
          variant={index === activeIndex ? color : 'clear'}
          size={0}
          style={{
            transition: 'all 0.2s ease',
            transform: index === activeIndex ? 'scale(1.1)' : 'scale(1)'
          }}
          contentStyle={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            padding: '0'
          }}
        >
          <div />
        </GlassContainer>
      ))}
    </div>
  );
};

export default Loader;