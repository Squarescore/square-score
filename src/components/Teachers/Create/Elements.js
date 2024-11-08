import React from 'react';
import { Landmark, User, Settings } from 'lucide-react';
import CustomExpandingFormatSelector from './ExpandingFormatSelector';

// Common styles used across components
const styles = {
  sectionWrapper: {
    width: '600px',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: '30px'
  },
  heading: {
    fontSize: '18px',
    marginRight: 'auto',
    fontFamily: "'montserrat', sans-serif",
    color: 'lightgrey',
    fontWeight: '600'
  },
  sectionHeading: {
    fontSize: '16px',
    color: 'grey',
    width: '200px',
    fontWeight: '600',
  },
  input: {
    width: '550px',
    height: '30px',
    fontSize: '20px',
    padding: '10px',
    paddingLeft: '25px',
    outline: 'none',
    border: '1px solid #ddd',
    borderRadius: '10px',
    fontFamily: "'montserrat', sans-serif",
    fontWeight: 'bold',
    marginBottom: '20px'
  },
  numberInput: {
    width: '50px',
    fontWeight: 'bold',
    marginBottom: '0px',
    textAlign: 'center',
    fontFamily: "'montserrat', sans-serif",
    marginTop: '0px',
    marginLeft: 'auto',
    marginRight: '20px',
    padding: '0px',
    paddingLeft: '15px',
    height: '35px',
    fontSize: '30px',
    border: '2px solid #f4f4f4',
    borderRadius: '10px'
  },
  choicesWrapper: {
    width: '700px',
    height: '80px',
    border: '4px solid transparent',
    display: 'flex',
    position: 'relative',
    alignItems: 'center',
    borderRadius: '10px',
    padding: '10px',
    marginLeft: '-15px',
    marginTop: '-20px'
  },
  choicesHeading: {
    fontSize: '25px',
    color: 'black',
    width: '400px',
    paddingLeft: '10px',
    fontWeight: '600'
  },
  choicesContainer: {
    marginLeft: 'auto',
    marginTop: '45px',
    display: 'flex',
    position: 'relative',
    alignItems: 'center'
  },
  choiceButton: (isSelected, optionStyle) => ({
    width: '60px',
    height: '40px',
    marginLeft: '20px',
    marginTop: '-45px',
    backgroundColor: isSelected ? optionStyle.background : 'white',
    border: isSelected ? `4px solid ${optionStyle.color}` : '2px solid #f4f4f4',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  }),
  choiceText: (isSelected, optionStyle) => ({
    fontSize: '24px',
    fontFamily: "'montserrat', sans-serif",
    color: isSelected ? optionStyle.color : 'black',
    margin: 0
  })
};


const optionStyles = {
    2: { background: '#A3F2ED', color: '#00645E' },
    3: { background: '#AEF2A3', color: '#006428' },
    4: { background: '#F8CFFF', color: '#E01FFF' },
    5: { background: '#FFECA8', color: '#CE7C00' }
  };
export const AssignmentName = ({ value, onChange, maxLength = 25 }) => {
  return (
    <div style={{ position: 'relative' }}>
      <h1 style={{
        zIndex: '20',
        textAlign: 'left',
        backgroundColor: 'white',
        marginTop: '0px',
        fontSize: '16px',
        fontWeight: '600',
        color: 'grey',
      }}>
        Assignment Name
      </h1>
      <input
        type="text"
        maxLength={maxLength}
        style={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <span style={{
        position: 'absolute',
        right: '20px',
        bottom: '30px',
        fontSize: '14px',
        color: 'grey',
        fontFamily: "'montserrat', sans-serif",
      }}>
        {value.length}/{maxLength}
      </span>
    </div>
  );
};

export const FormatSection = ({ classId, selectedFormat, onFormatChange }) => {
    return (
      <div style={{ 
        width: '710px', 
        marginLeft: '0px', 
        height: '60px', 
        display: 'flex', 
        position: 'relative', 
        alignItems: 'center',
        marginBottom: '-20px',
        
        marginTop: '-20px'
      }}>
        <h1 style={styles.sectionHeading}>Format</h1>
        <div style={{ marginLeft: 'auto' }}>
          <CustomExpandingFormatSelector
            classId={classId}
            selectedFormat={selectedFormat}
            onFormatChange={onFormatChange}
          />
        </div>
      </div>
    );
  };

export const TimerSection = ({ timerOn, timer, onTimerChange, onToggle }) => {
  return (
    <div style={{ width: '600px', marginLeft: '0px', height: '30px', display: 'flex', position: 'relative', alignItems: 'center', marginTop: '5px',marginBottom: '0px' }}>
      <h1 style={styles.sectionHeading}>Timer:</h1>
      {timerOn  ?
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative', marginLeft: '100px', background:'#f4f4f4', height: '26px', borderRadius: '5px', width:' 130px', marginTop: '-8px' }}>
          <input
            type="number"
            style={{
              marginLeft: '3px',
              height: '20px',
              width: '40px',
              fontFamily: "'montserrat', sans-serif",
              textAlign: 'center',
              fontWeight: '600',
              border: 'none' ,
              outline: 'none',
              borderRadius: '5px',
              fontSize: '12px',
              boxShadow: '1px 1px 5px 1px rgb(0,0,155,.03)',
                  
            }}
            placeholder="10"
            value={timer}
            onChange={(e) => onTimerChange(e.target.value)}
          />
          <h1 style={{  fontSize: '12px', fontWeight: '600', marginLeft: '10px', color: 'grey' }}>Minutes</h1>
        </div>
      :''
          }
          <div style={{ position: 'relative', marginLeft: "auto" }}>
      <input
        style={{ marginLeft: 'auto', marginRight: '14px' }}
        type="checkbox"
        className="greenSwitch"
        checked={timerOn}
        onChange={onToggle}
      />
 <span style={{marginRight: '16px'}}>On</span>
 </div>
      
    </div>
    
  );
};

export const QuestionCountSection = ({ bankCount, studentCount, onBankChange, onStudentChange }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
      <h1 style={styles.sectionHeading}>Questions:</h1>
      
      <div style={{ display: 'flex', marginLeft: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ marginRight: '10px' }}> 
            <Landmark size={30} color="#000000" />
          </div>
          <input
            type="number"
            placeholder="10"
            value={bankCount}
            onChange={(e) => onBankChange(e.target.value)}
            style={styles.numberInput}
          />
        </div>
      </div>

      <div style={{ display: 'flex', marginLeft: '30px', marginRight: '-15px', alignItems: 'center' }}>
        <div style={{ marginRight: '10px' }}> 
          <User size={30} color="#000000" />
        </div>
        <input
          type="number"
          placeholder="5"
          value={studentCount}
          onChange={(e) => onStudentChange(e.target.value)}
          style={styles.numberInput}
        />
      </div>
    </div>
  );
};

export const ToggleSwitch = ({ label, value, onChange }) => {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      height: '80px', 
      width: '600px', 
      borderBottom: '0px solid lightgrey', 
      position: 'relative', 
      marginTop: '-40px', 
      paddingBottom: '10px' 
    }}>
      <label style={{ 
        fontSize: '25px', 
        color: 'black', 
        marginRight: '38px', 
        marginTop: '13px', 
        fontFamily: "'montserrat', sans-serif", 
        fontWeight: '600', 
        marginLeft: '0px' 
      }}>
        {label}
      </label>
      <div style={{ marginLeft: 'auto', marginRight: '10px', marginTop: '20px' }}>
        <input
          type="checkbox"
          className="greenSwitch"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
        />
      </div>
    </div>
  );
};

export const PreferencesSection = ({ children }) => {
  return (
    <div style={styles.sectionWrapper}>
    
      {children}
    </div>
  );
};
export const ChoicesPerQuestion = ({ selectedOptions, onChange }) => {
    const handleOptionClick = (num) => {
      if (selectedOptions.includes(num)) {
        onChange(selectedOptions.filter(n => n !== num));
      } else {
        onChange([...selectedOptions, num]);
      }
    };
  
    return (
      <div style={styles.choicesWrapper}>
        <h1 style={styles.choicesHeading}>
          Choices Per Question:
        </h1>
        <div style={styles.choicesContainer}>
          {[2, 3, 4, 5].map((num) => (
            <button
              key={num}
              onClick={() => handleOptionClick(num)}
              style={styles.choiceButton(selectedOptions.includes(num), optionStyles[num])}
            >
              <h1 style={styles.choiceText(selectedOptions.includes(num), optionStyles[num])}>
                {num}
              </h1>
            </button>
          ))}
        </div>
      </div>
    );
  };
export default {
  AssignmentName,
  TimerSection,
  QuestionCountSection,
  ToggleSwitch,
  PreferencesSection,
  optionStyles 
};