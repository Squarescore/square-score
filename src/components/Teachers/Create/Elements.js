
import React, { useState } from 'react';
import { Landmark, User, Settings, LineChart, ChevronDown, ChevronUp } from 'lucide-react';
import CustomExpandingFormatSelector from './ExpandingFormatSelector';
import { CustomSwitch } from '../../../styles';
import CustomDateTimePicker from './CustomDateTimePicker';
import { GlassContainer } from '../../../styles';
import { resolveObjectURL } from 'buffer';

// Common styles used across components
const styles = {
  sectionWrapper: {
    width: '490px',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: '0px'
  },
  elementContainer: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    width: '100%',
    height: '40px',
    marginBottom: '10px'
  },
  heading: {
    fontSize: '18px',
    marginRight: 'auto',
    fontFamily: "'montserrat', sans-serif",
    color: 'lightgrey',
    fontWeight: '500'
  },
  sectionHeading: {
    fontSize: '16px',
    color: 'grey',
    width: '200px',
    fontWeight: '500',
  },
  input: {
    width: '290px',
    fontSize: '.9rem',
    padding: '7px 15px',
    outline: 'none',
    border: '1px solid #ddd',
    borderRadius: '50px',
    fontFamily: "'montserrat', sans-serif",
    fontWeight: '400',
    background: 'white'
  },
  numberInput: {
    width: '40px',
    marginBottom: '0px',
    textAlign: 'left',
    fontFamily: "'montserrat', sans-serif",
    marginTop: '0px',
    marginRight: '20px',
    padding: '0px 0px ',
    outline: 'none' ,
    paddingLeft: '20px',
    marginLeft: '-20px',
   background: 'transparent',
    height: '20px',
    fontSize: '.9rem',
    fontWeight: '400',
    border: 'none',
    borderRadius: '3px'
  },
  choicesWrapper: {
    width: '490px',
    display: 'flex',
    position: 'relative',
    alignItems: 'center',
    borderRadius: '4px',
    padding: '10px',
    marginLeft: '-15px',
    height: '40px',
    marginBottom: '20px'
  },
  choicesHeading: {
    fontSize: '16px',
    color: 'grey',
    width: '400px',
    fontWeight: '500'
  },
  choicesContainer: {
    marginLeft: 'auto',
    marginTop: '0px',
    border: '2px solid white',
    borderRadius: '5px',

    background: '#f4f4f4',
    height:'28px',
    paddingRight: '4px',
    display: 'flex',
    position: 'relative',
    alignItems: 'center'
  },
  choiceButton: (isSelected) => ({
    width: '30px',
    height: '20px',
    marginLeft: '5px',
    marginTop: '0px',
    
    boxShadow: isSelected ? '1px 1px 5px 1px rgb(0,0,155,.06)': 'none',
    backgroundColor: isSelected ? "white" : '#f4f4f4',
    border:  'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  }),
  choiceText: (isSelected ) => ({
    fontSize: '16px',
    lineHeight: '10px',
    fontWeight: '500',
    fontFamily: "'montserrat', sans-serif",
    color: isSelected ? 'grey' : 'lightgrey',
    margin: 0
  }),
  scaleInput: {
    width: '30px',
    height: '18px',
    fontWeight: '400',
    textAlign: 'center',
    fontSize: '.9rem',
    outline: 'none',
    border: 'none',
    borderRadius: '20px',
    fontFamily: "'montserrat', sans-serif",
    color: 'black'
  },
  scaleContainer: {
    display: 'flex',
    border: '1px solid #ddd',
    borderRadius: '50px',
    height: '30px',
 marginLeft: 'auto',
    alignItems: 'center',
    padding: '0 15px',
    background: 'white'
  },
  dateContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    height: '40px',
    width: '100%'
  },
  dateLabel: {
    fontSize: '1rem',
    fontWeight: '500',
    color: 'grey',
    marginRight: 'auto'
  },
  datesWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0px',
    marginBottom: '0px' // Compensate for the last element's marginBottom
  },
  feedbackOption: (isSelected) => ({
    height: '20px',
    lineHeight: '20px',
    fontSize: '12px',
    textAlign: 'center',
    transition: '.3s',
    borderRadius: '3px',
    fontWeight: isSelected ? '600' : '500',
    backgroundColor: isSelected ? 'white' : 'transparent',
    color: isSelected ? 'black' : 'grey',
    cursor: 'pointer',
    boxShadow: isSelected ? '1px 1px 5px 1px rgb(0,0,155,.03)' : 'none'
  }),
  feedbackContainer: {
    display: 'flex',
    borderRadius: '25px',
    justifyContent: 'space-around',
    width: '210px',
    marginLeft: 'auto',
    alignItems: 'center',
    border: '1px solid #ddd',
    height: '32px'
  },
  dropdownButton: {
    display: 'flex',
    alignItems: 'center',
    borderRadius: '3px',
    cursor: 'pointer',
    background: 'white',
    minWidth: '70px',
    marginRight: '4px',
    paddingLeft: '10px',
    height: '20px',
    boxShadow: '1px 1px 5px 1px rgb(0,0,155,.03)',
    justifyContent: 'space-between'
  },
  dropdownOption: (isSelected) => ({
    padding: '8px 10px',
    cursor: 'pointer',
    fontSize: "14px",
    color: isSelected ? '#afafafff' : '#333333',
    fontWeight: isSelected ? '500' : '400',
    background: isSelected ? '#f8f8ff' : 'white'
  }),
  violationContainer: {
    display: 'flex',
    alignItems: 'center',
    height: '27px',
    borderRadius: '25px',
    border: '1px solid #ddd',
    marginLeft: '10px',
    marginRight: '10px'
  }
};

const optionStyles = {
  2: { background: '#A3F2ED', color: '#00645E' },
  3: { background: '#AEF2A3', color: '#006428' },
  4: { background: '#F8CFFF', color: '#E01FFF' },
  5: { background: '#FFECA8', color: '#CE7C00' }
};

export const AssignmentName = ({ value, onChange, maxLength = 25 }) => {
  return (
    <div style={styles.elementContainer}>
      <h1 style={styles.sectionHeading}>Name</h1>
      <div style={{ position: 'relative', marginLeft: 'auto' }}>
        <input
          type="text"
          placeholder='Enter name'
          maxLength={maxLength}
          style={styles.input}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <span style={{
          position: 'absolute',
          right: '15px',
          top: '10px',
          fontSize: '.6rem',
          color: 'grey',
          fontFamily: "'montserrat', sans-serif",
        }}>
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  );
};

export const FormatSection = ({ classId, selectedFormat, onFormatChange }) => {
  return (
    <div style={styles.elementContainer}>
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
    <div style={styles.elementContainer}>
      <h1 style={styles.sectionHeading}>Timer</h1>
      {timerOn && (
        <div style={{ 
          border: '1px solid #ddd',
          height: '28px',
          borderRadius: '20px',
          width: '110px',
          alignItems: 'center',
          paddingLeft:" 5px",
          display: 'flex',
          marginRight: '20px',
          marginLeft: '100px'
        }}>
          <input
            type="number"
            style={{
              width: '40px',
              textAlign: 'center',
              border: 'none',
              outline: 'none',
              borderRadius: '5px',
              fontSize: '12px',
              fontFamily: "'montserrat', sans-serif",
              fontWeight: '500',
              marginLeft: '3px',
              height: '20px'
            }}
            placeholder="10"
            value={timer}
            onChange={(e) => onTimerChange(e.target.value)}
          />
          <h1 style={{ 
            fontSize: '12px', 
            fontWeight: '500', 
            color: 'grey',
            display: 'inline'
          }}>Minutes</h1>
        </div>
      )}
      <div style={{ marginLeft: 'auto' }}>
        <CustomSwitch
          checked={timerOn}
          onChange={onToggle}
          variant="teal"
        />
      </div>
    </div>
  );
};

export const QuestionCountSection = ({ bankCount, studentCount, onBankChange, onStudentChange }) => {
  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const inputStyle = {
    width: '30px',
    height: '28px',
    border: '1px solid #ddd',
    borderRadius: '24px',
    outline: 'none',
    background: 'transparent',
    padding: ' 0px 0px 0px 35px',
    fontSize: '.8rem',
    fontFamily: "'montserrat', sans-serif"
  };

  return (
    <div style={styles.elementContainer}>
      <h1 style={styles.sectionHeading}>Questions</h1>
      <div style={{ display: 'flex', gap: '20px', marginLeft: 'auto', alignItems: 'center' }}>
        <div style={containerStyle}>
          <Landmark size={16} color="grey" style={{marginRight: '-34px'}}/>
          <input
            type="number"
            min="1"
            value={bankCount}
            onChange={(e) => onBankChange(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={containerStyle}>
          <User size={16} color="grey" style={{marginRight: '-34px'}} />
          <input
            type="number"
            min="1"
            value={studentCount}
            onChange={(e) => onStudentChange(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>
    </div>
  );
};

export const ToggleSwitch = ({ label, value, onChange }) => {
  return (
    <div style={styles.elementContainer}>
      <h1 style={styles.sectionHeading}>{label}</h1>
      <div style={{ marginLeft: 'auto' }}>
        <CustomSwitch
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          variant="teal"
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
      // Don't allow deselecting if it's the last option
      if (selectedOptions.length > 1) {
        onChange(selectedOptions.filter(n => n !== num));
      }
    } else {
      onChange([...selectedOptions, num].sort());
    }
  };

  return (
    <div style={styles.elementContainer}>
      <h1 style={styles.sectionHeading}>Choices Per Question</h1>
      <div style={{
        display: 'flex',
        borderRadius: '265px',
        justifyContent: 'space-around',
        border: '1px solid #ddd',
        marginLeft: 'auto',
        alignItems: 'center',
        background: 'white',
        height: '32px',
        padding: '0px 10px',
        gap: '8px'
      }}>
        {[2, 3, 4, 5].map((num) => (
          selectedOptions.includes(num) ? (
            <GlassContainer
              key={num}
              onClick={() => handleOptionClick(num)}
              variant="green"
              size={0}
              style={{
                width: '30px',
                zIndex: '1'
              }}
              contentStyle={{
                padding: '2px 0',
                display: 'flex',
                userSelect: 'none',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <span style={{
                fontSize: '.8rem',
                fontWeight: '500',
                color: 'green'
              }}>
                {num}
              </span>
            </GlassContainer>
          ) : (
            <button
              key={num}
              onClick={() => handleOptionClick(num)}
              style={{
                width: '30px',
                height: '20px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              <span style={{
                fontSize: '12px',
                fontWeight: '500',
                fontFamily: "'montserrat', sans-serif",
                color: 'grey'
              }}>
                {num}
              </span>
            </button>
          )
        ))}
      </div>
      <div style={{
        marginLeft: '10px',
        fontSize: '0.8rem',
        color: '#666',
        fontStyle: 'italic'
      }}>

      </div>
    </div>
  );
};

export const FeedbackSelector = ({ value, onChange }) => {
  return (
    <div style={styles.elementContainer}>
      <h1 style={styles.sectionHeading}>Feedback</h1>
      <div style={styles.feedbackContainer}>
        {value === 'instant' ? (
          <GlassContainer
            variant="green"
            size={0}
            style={{
              width: '80px',
              marginLeft: '4px',
              zIndex: '1'
            }}
            contentStyle={{
              padding: '2px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span style={{
              fontSize: '.8rem',
              fontWeight: '500',
              color: 'green'
            }}>
              Instant
            </span>
          </GlassContainer>
        ) : (
          <div
            style={{
              ...styles.feedbackOption(false),
              marginLeft: '4px',
              width: '80px',
              
              fontSize: '.8rem',
            }}
            onClick={() => onChange('instant')}
          >
            Instant
          </div>
        )}

        {value === 'at_completion' ? (
          <GlassContainer
            variant="green"
            size={0}
            style={{
              width: '120px',
              
              zIndex: '1',
              marginLeft: 'auto',
              marginRight: '4px'
            }}
            contentStyle={{
              padding: '2px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span style={{
              fontSize: '.8rem',
              fontWeight: '500',
              color: 'green'
            }}>
              At Completion
            </span>
          </GlassContainer>
        ) : (
          <div
            style={{
              ...styles.feedbackOption(false),
              marginLeft: 'auto',
              marginRight: '4px',
              width: '120px',
              
              fontSize: '.8rem',
            }}
            onClick={() => onChange('at_completion')}
          >
            At Completion
          </div>
        )}
      </div>
    </div>
  );
};

export const GradingScale = ({ minValue, maxValue, onMinChange, onMaxChange }) => {
  return (
    <div style={styles.elementContainer}>
      <h1 style={styles.sectionHeading}>Grading Scale</h1>
      <div style={styles.scaleContainer}>
        <input
          type="number"
          placeholder="0"
          style={styles.scaleInput}
          value={minValue}
          onChange={(e) => onMinChange(e.target.value)}
        />
        <span style={{ 
          fontSize: '16px', 
          color: 'grey', 
          margin: '0 5px',
          fontWeight: '500'
        }}>-</span>
        <input
          type="number"
          placeholder="2"
          style={styles.scaleInput}
          value={maxValue}
          onChange={(e) => onMaxChange(e.target.value)}
        />
      </div>
    </div>
  );
};

export const DateSettingsElement = ({ assignDate, setAssignDate, dueDate, setDueDate }) => {
  return (
    <div style={styles.datesWrapper}>
      <div style={styles.elementContainer}>
        <h1 style={styles.sectionHeading}>Access Opens</h1>
        <div style={{ marginLeft: 'auto' }}>
          <CustomDateTimePicker
            selected={assignDate}
            onChange={(date) => setAssignDate(date)}
            label="Assign Date"
          />
        </div>
      </div>

      <div style={styles.elementContainer}>
        <h1 style={styles.sectionHeading}>Due By</h1>
        <div style={{ marginLeft: 'auto' }}>
          <CustomDateTimePicker
            selected={dueDate}
            onChange={(date) => setDueDate(date)}
            label="Due Date"
          />
        </div>
      </div>
    </div>
  );
};

export const SecuritySettingsElement = ({ 
  saveAndExit, 
  setSaveAndExit, 
  lockdown, 
  setLockdown,
  onViolation = 'pause',
  setOnViolation
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div style={styles.datesWrapper}>
      <div style={styles.elementContainer}>
        <h1 style={styles.sectionHeading}>Save & Exit</h1>
        <div style={{ marginLeft: 'auto' }}>
          <CustomSwitch
            checked={saveAndExit}
            onChange={() => setSaveAndExit(!saveAndExit)}
            variant="teal"
          />
        </div>
      </div>

      <div style={styles.elementContainer}>
        <h1 style={styles.sectionHeading}>Lockdown</h1>
        <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
          {lockdown && (
            <div style={styles.violationContainer}>
              <h1 style={{ 
                fontSize: '.8rem', 
                color: '#666666', 
                marginLeft: '10px', 
                marginRight: '10px', 
                fontWeight: '400' 
              }}>
                On Violation:
              </h1>
              <div style={{ position: 'relative' }}>
                <div
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={styles.dropdownButton}
                >
                  <span style={{ 
                    color: '#bebebeff',
                    fontSize: '.8rem',
                    userSelect: 'none',
                    fontWeight: '500'
                  }}>
                    {onViolation.charAt(0).toUpperCase() + onViolation.slice(1)}
                  </span>
                  {dropdownOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </div>
                {dropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    background: 'white',
                    padding: '5px',
                    borderRadius: '8px',
                    marginTop: '5px',
                    width: '100%',
                    zIndex: 100,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                  }}>
                    <div
                      onClick={() => {
                        setOnViolation('pause');
                        setDropdownOpen(false);
                      }}
                      style={{
                        ...styles.dropdownOption(onViolation === 'pause'),
                        borderBottom: '1px solid #e0e0e0'
                      }}
                    >
                      Pause
                    </div>
                    <div
                      onClick={() => {
                        setOnViolation('submit');
                        setDropdownOpen(false);
                      }}
                      style={styles.dropdownOption(onViolation === 'submit')}
                    >
                      Submit
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <div style={{ marginLeft: 'auto' }}>
            <CustomSwitch
              checked={lockdown}
              onChange={() => setLockdown(!lockdown)}
              variant="teal"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const SectorDisplay = ({ sectors, currentSector, onSectorChange }) => {
  return (
    <div style={{
      marginBottom: '20px',
      padding: '15px',
      border: '1px solid #ddd',
      borderRadius: '8px'
    }}>
      <h3 style={{
        margin: '0 0 10px',
        fontSize: '1rem',
        fontWeight: '500',
        color: '#333'
      }}>Content Sectors</h3>
      
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {sectors.map((sector) => (
          <button
            key={sector.sectorNumber}
            onClick={() => onSectorChange(sector.sectorNumber)}
            style={{
              padding: '8px 15px',
              border: '1px solid #ddd',
              borderRadius: '20px',
              background: currentSector === sector.sectorNumber ? '#f0f0f0' : 'white',
              cursor: 'pointer',
              color: '#666',
              fontSize: '0.9rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <span style={{ fontWeight: '500' }}>{sector.sectorName}</span>
            <span style={{ fontSize: '0.8rem', color: '#999' }}>
              Words {sector.sectorStart}-{sector.sectorEnd}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export { optionStyles };