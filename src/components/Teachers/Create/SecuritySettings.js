import React from 'react';
import { ChevronDown, ChevronUp, GlobeLock } from 'lucide-react';

const SecuritySettings = ({ saveAndExit, setSaveAndExit, lockdown, setLockdown }) => {

  return (
    <div style={{ width: '700px', marginTop: '10px',    }}>
      <div

        style={{
          width: '100%',
          padding: '0px',
          fontSize: '30px',
          backgroundColor: 'white',
          color: 'black',
          border: 'none',
          height: '50px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <GlobeLock size={20} color="lightgrey" />    
        <h1 style={{ fontSize: '16px', marginLeft: '5px', marginRight: 'auto', fontFamily: "'montserrat', sans-serif", color: 'lightgrey', fontWeight: '600' }}>Permissions</h1>
      
      </div>
      <div >
        <div style={{ marginTop: '-20px',  }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0px' }}>
            <h1 style={{ fontSize: '24px', color: '#333333', marginLeft: '0px', flex: 1, width: '270px', fontWeight: '600' }}>Save & Exit</h1>
            <input
              style={{ marginRight: '0px' }}
              type="checkbox"
              className="greenSwitch"
              checked={saveAndExit}
              onChange={() => setSaveAndExit(!saveAndExit)}
            />
          </div>
          
         
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '-10px' }}>
            <h1 style={{ fontSize: '25px', color: '#333333', marginLeft: '0px', flex: 1, width: '270px', fontWeight: '600'}}>Lockdown</h1>
            <input
              style={{ marginRight: '0px' }}
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