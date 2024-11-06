import React from 'react';
import { ChevronDown, ChevronUp, GlobeLock } from 'lucide-react';

const SecuritySettings = ({ saveAndExit, setSaveAndExit, lockdown, setLockdown }) => {

  return (
    <div style={{ width: '600px', marginTop: '-10px',   marginLeft: 'auto', marginRight: 'auto'  }}>
   
      <div >
        <div style={{ marginTop: '-20px',  }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0px' }}>
            <h1 style={{ fontSize: '20px', color: '#333333', marginLeft: '0px', flex: 1, width: '270px', fontWeight: '600' }}>Save & Exit</h1>
            <input
              style={{ marginRight: '0px' }}
              type="checkbox"
              className="greenSwitch"
              checked={saveAndExit}
              onChange={() => setSaveAndExit(!saveAndExit)}
            />
          </div>
          
         
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '-10px' }}>
            <h1 style={{ fontSize: '20px', color: '#333333', marginLeft: '0px', flex: 1, width: '270px', fontWeight: '600'}}>Lockdown</h1>
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