import React from 'react';
import { GlobeLock } from 'lucide-react';

const SecuritySettings = ({ saveAndExit, setSaveAndExit, lockdown, setLockdown }) => {
  const [securityDropdownOpen, setSecurityDropdownOpen] = React.useState(false);

  return (
    <div style={{ width: '770px', padding: '10px', marginTop: '20px', border: '2px solid #eeeeee', borderRadius: '10px', marginBottom: '20px' }}>
      <button
        onClick={() => setSecurityDropdownOpen(!securityDropdownOpen)}
        style={{
          width: '100%',
          padding: '10px',
          fontSize: '30px',
          backgroundColor: 'white',
          color: 'black',
          border: 'none',
          cursor: 'pointer',
          height: '50px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <GlobeLock size={40} color="#000000" />    
        <h1 style={{ fontSize: '30px', marginLeft: '20px', marginRight: 'auto', fontFamily: "'montserrat', sans-serif" }}>Security</h1>
        <img
          src={securityDropdownOpen ? '/Up.png' : '/Down.png'}
          alt={securityDropdownOpen ? "Collapse" : "Expand"}
          style={{ width: '20px' }}
        />
      </button>
      <div className={`dropdown-content ${securityDropdownOpen ? 'open' : ''}`}>
        <div style={{ marginTop: '0px', display: 'flex' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0px' }}>
            <h1 style={{ fontSize: '24px', color: '#333333', marginLeft: '20px', flex: 1, width: '270px' }}>Save & Exit</h1>
            <input
              style={{ marginRight: '20px' }}
              type="checkbox"
              className="greenSwitch"
              checked={saveAndExit}
              onChange={() => setSaveAndExit(!saveAndExit)}
            />
          </div>
          
          <div style={{height: '50px', width: '4px', background: '#f4f4f4', marginTop: '5px'}}></div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h1 style={{ fontSize: '25px', color: '#333333', marginLeft: '40px', flex: 1, width: '270px'}}>Lockdown</h1>
            <input
              style={{ marginRight: '10px' }}
              type="checkbox"
              className="greenSwitch"
              checked={lockdown}
              onChange={() => setLockdown(!lockdown)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;