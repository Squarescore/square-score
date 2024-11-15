// src/components/ResponsiveText.js
import React, { useState, useEffect, useRef } from 'react';

const ResponsiveText = ({ text, maxFontSize, minFontSize, style }) => {
  const [fontSize, setFontSize] = useState(maxFontSize);
  const textRef = useRef(null);

  useEffect(() => {
    const adjustFontSize = () => {
      if (textRef.current) {
        let currentFontSize = maxFontSize;
        textRef.current.style.fontSize = `${currentFontSize}px`;

        // Reduce font size until the text fits within its container or reaches minFontSize
        while (
          textRef.current.scrollWidth > textRef.current.offsetWidth &&
          currentFontSize > minFontSize
        ) {
          currentFontSize -= 1;
          textRef.current.style.fontSize = `${currentFontSize}px`;
        }

        setFontSize(currentFontSize);
      }
    };

    adjustFontSize();
    window.addEventListener('resize', adjustFontSize);

    return () => {
      window.removeEventListener('resize', adjustFontSize);
    };
  }, [text, maxFontSize, minFontSize]);

  return (
    <h3
      ref={textRef}
      style={{
        fontSize: `${fontSize}px`,
        fontWeight: '600',
        cursor: 'pointer',
        width: '100%',
        fontFamily: "'montserrat', sans-serif",
        whiteSpace: fontSize > minFontSize ? 'nowrap' : 'normal', // Allow wrapping when at min font size
      
        ...style
      }}
      onMouseEnter={(e) => { e.target.style.textDecoration = 'underline'; }}
      onMouseLeave={(e) => { e.target.style.textDecoration = 'none'; }}
    >
      {text}
    </h3>
  );
};

export default ResponsiveText;
