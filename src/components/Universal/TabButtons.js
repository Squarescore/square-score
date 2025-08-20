import React from 'react';
import { GlassContainer } from '../../styles';

const TabButtons = ({ 
  tabs, // Array of tab objects: [{ id: string, label: string, count?: number }, ...]
  activeTab,
  onTabClick,
  variant = 'teal', // Default variant for active tab
  size = 0, // Default size for GlassContainer
  color = '#1EC8bc', // Default color for active tab text
  style = {}, // Additional style for the container
  buttonStyle = {}, // Additional style for individual buttons
  badgeStyle = {}, // Additional style for count badges
  badgeActiveStyle = {}, // Additional style for active count badges
  badgeBackground, // Background color for inactive badges (default: #f4f4f4)
  badgeActiveBackground, // Background color for active badges (default: 30% opacity of color)
}) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      ...style
    }}>
      {tabs.map((tab) => (
        tab.id === activeTab ? (
          <GlassContainer
            key={tab.id}
            
          enableRotation={true}
            variant={variant}
            size={size}
            onClick={() => onTabClick(tab.id)}
            style={{
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
              transform: 'scale(1)',
              '&:hover': {
                transform: 'scale(1.05)'
              },
              ...buttonStyle
            }}
            contentStyle={{
              padding: '5px 15px',
              fontFamily: "'Montserrat', sans-serif",
              fontSize: '.9rem',
              fontWeight: "400",
              color: color,
              height: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
                         <div style={{display: 'flex', alignItems: 'center'}}>
               {tab.label}
               {tab.count > 0 && (
                 <span style={{
                   background: badgeActiveBackground || `${color}30`,
                   padding: '3px 4px',
                   borderRadius: '10px',
                   fontSize: '10px',
                   marginLeft: '5px',
                   ...badgeActiveStyle
                 }}>
                   {tab.count}
                 </span>
               )}
             </div>
           </GlassContainer>
         ) : (
           <button
             key={tab.id}
             onClick={() => onTabClick(tab.id)}
             style={{
               background: 'none',
               border: 'none',
               fontSize: '.9rem',
               cursor: 'pointer',
               fontWeight: "400",
               padding: '5px 15px',
               fontFamily: "'Montserrat', sans-serif",
               color: 'grey',
               transition: 'transform 0.2s ease',
               display: 'flex',
               alignItems: 'center',
               ...buttonStyle
             }}
             onMouseEnter={(e) => {
               e.currentTarget.style.transform = 'scale(1.05)';
             }}
             onMouseLeave={(e) => {
               e.currentTarget.style.transform = 'scale(1)';
             }}
           >
             {tab.label}
             {tab.count > 0 && (
               <span style={{
                 background: badgeBackground || '#f4f4f4',
                 padding: '2px 8px',
                 borderRadius: '10px',
                 fontSize: '12px',
                 marginLeft: '5px',
                 ...badgeStyle
               }}>
                 {tab.count}
               </span>
             )}
          </button>
        )
      ))}
    </div>
  );
};

export default TabButtons;