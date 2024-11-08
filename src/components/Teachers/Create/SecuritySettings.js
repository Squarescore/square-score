import React, { useState } from 'react';
import { ChevronDown, ChevronUp, GlobeLock } from 'lucide-react';

const SecuritySettings = ({ 
  saveAndExit, 
  setSaveAndExit, 
  lockdown, 
  setLockdown,
  onViolation = 'pause', // Add default value
  setOnViolation // Add new prop for violation handling
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div style={{ width: '490px', marginTop: '-10px', marginLeft: 'auto', marginRight: 'auto',  }}>
      <div style={{marginLeft:'-5px'}}>
        <div style={{ marginTop: '-20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0px' , marginTop: '10px'}}>
            <h1 style={{ fontSize: '16px', color: 'grey', marginLeft: '5px', flex: 1, width: '270px', fontWeight: '600' }}>
              Save & Exit
            </h1>
            <div style={{ position: 'relative' , marginRight:'4px'}}>
              <input
                style={{ marginRight: '0px' }}
                type="checkbox"
                className="greenSwitch"
                checked={saveAndExit}
                onChange={() => setSaveAndExit(!saveAndExit)}
              />
              <span>On</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', marginTop: '0px' }}>
            <h1 style={{ fontSize: '16px', color: 'grey', marginLeft: '5px', flex: 1, width: '270px', fontWeight: '600' }}>
              Lockdown:
            </h1>
            {lockdown && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
             height: '27px',
              marginTop: '-4px',
              borderRadius: '6px',
              background: '#f4f4f4',
              marginLeft: '10px',

              marginRight: '10px',
            }}>
              <h1 style={{ 
                fontSize: '12px', 
                color: '#666666', 
                
                marginLeft: '10px', 
                marginRight: '10px', 
                fontWeight: '600' 
              }}>
                On Violation:
              </h1>
              <div style={{ position: 'relative',  }}>
                <div
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    background: 'white',
                    minWidth: '70px',
                    marginRight: '4px',
                    paddingLeft: '10px',
                    height: '20px',
                    boxShadow: '1px 1px 5px 1px rgb(0,0,155,.03)' ,
                
                    justifyContent: 'space-between'
                  }}
                >
                  <span style={{ 
                    color: '#333333',
                    fontSize: '12px',
                    userSelect: 'none',
                    fontWeight: '600'
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
                        padding: '8px 10px',
                        cursor: 'pointer',
                        fontSize: "14px",
                        borderBottom: '1px solid #e0e0e0',
                        color: onViolation === 'pause' ? '#020CFF' : '#333333',
                        fontWeight: onViolation === 'pause' ? '600' : '400',
                        background: onViolation === 'pause' ? '#f8f8ff' : 'white'
                      }}
                    >
                      Pause
                    </div>
                    <div
                      onClick={() => {
                        setOnViolation('submit');
                        setDropdownOpen(false);
                      }}
                      style={{
                        padding: '8px 10px',
                        cursor: 'pointer',
                        
                        fontSize: "14px",
                        color: onViolation === 'submit' ? '#020CFF' : '#333333',
                        fontWeight: onViolation === 'submit' ? '600' : '400',
                        background: onViolation === 'submit' ? '#f8f8ff' : 'white'
                      }}
                    >
                      Submit
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
            <div style={{ position: 'relative', marginRight:'5px' }}>
              <input
                style={{ marginRight: '0px' }}
                type="checkbox"
                className="greenSwitch"
                checked={lockdown}
                onChange={() => setLockdown(!lockdown)}
              />
              <span>On</span>
            </div>
          </div>

        
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;