// QuestionBankHeader.js

import React from 'react';
import { Search } from 'lucide-react';

const QuestionBankHeader = ({ questionsCount, averageScore, onSearchChange, searchTerm, getGradeColors }) => (
  <div style={{ 
    width: '100%',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    background: '#FCFCFF',
    borderBottom: "1px solid #ededed",
    marginTop: '-100px'
  }}>
    <div style={{ 
      marginLeft: '4%', 
      width: '460px', 
      display: 'flex', 
      alignItems: 'center',
      position: 'relative',
      zIndex: 1,
    }}>
      <h1 style={{  
        fontWeight: '500',
        fontSize: '16px',
        margin: '0',
        display: 'flex',
        alignItems: 'center',
        color: '#555CFF',
        height: '100%'
      }}>
        {questionsCount} Questions 
      </h1>
    </div>

    <div style={{
      marginLeft: 'auto',
      marginRight: '4%',
      position: 'relative',
      width: '300px'
    }}>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search questions..."
        style={{
          width: '254px',
          padding: '8px 12px',
          paddingLeft: '35px',
          borderRadius: '5px',
          border: '1px solid lightgrey',
          fontSize: '14px',
          fontFamily: "'montserrat', sans-serif",
          outline: 'none'
        }}
      />
      <Search
        size={18} 
        style={{
          position: 'absolute',
          left: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'grey'
        }}
      />
    </div>
    <div style={{
        fontSize: '16px',
        padding: '5px',
        marginRight: '4%',
        textAlign: 'center',
        width: "40px",
        borderRadius: '5px',
        background: averageScore ? getGradeColors(averageScore).background : 'white',
        color: averageScore ? getGradeColors(averageScore).color : '#858585',
      }}> 
        {averageScore !== null ? averageScore : '-'}%
      </div>
  </div>
);

export default QuestionBankHeader;
