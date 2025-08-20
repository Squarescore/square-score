import React from 'react';
import { GlassContainer } from '../../../styles';

import TabButtons from '../../Universal/TabButtons';

const ResultsHeader = ({ 
  assignmentName, 
  format, 
  tabs, 
  activeTab, 
  onTabClick, 
  periodStyle,
  hasScrolled,
}) => {
  return (
    <div style={{          
      width: 'calc(92% - 200px)', 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: '0px', 
      marginLeft: 'auto', 
      borderBottom: hasScrolled && activeTab !== 'questionBank' ? "1px solid #ddd" : "1px solid transparent", 
      height: '70px', 
      position: 'fixed',
      zIndex: '50', 
      top: '0px', 
      left: '200px',
      background: 'rgb(255,255,255,.9)', 
      backdropFilter: 'blur(5px)',
      padding: '0 4%',
      transition: 'border-bottom 0.3s ease'
    }}>
      {/* Left side with title and format */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <h1 style={{
          fontSize: '1.3rem',
          color: 'black',
          fontFamily: "'montserrat', sans-serif",
          margin: 0,
          marginLeft: '-10px',
          fontWeight: '400'
        }}>
          {assignmentName}
        </h1>
        <span style={{
          fontSize: '14px',
          fontWeight: '600',
          color: format.color || '#00CCB4',
          marginLeft: '5px'
        }}>
          {format.label}
        </span>
      </div>

      {/* Right side with tabs */}
      <div>
      <TabButtons
        tabs={tabs}
        activeTab={activeTab}
        onTabClick={onTabClick}
        variant={periodStyle.variant}
        color={periodStyle.color}
        size={0}
        style={{
          gap: '15px'
        }}
        badgeActiveBackground={`${periodStyle.borderColor}30`}
      />
      </div>
    </div>
  );
};

export default ResultsHeader;