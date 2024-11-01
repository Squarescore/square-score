import React, { useState } from 'react';
import { CalendarCog, ChevronDown, ChevronUp } from 'lucide-react';
import CustomDateTimePicker from './CustomDateTimePicker';

export const formatDate = (date) => {
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  };
  
  const formattedDate = date.toLocaleString('en-US', options);
  
  return formattedDate
    .replace(',', '')
    .replace(',', '')
    .replace(' at ', ' ')
    .replace(/(\d{1,2}):(\d{2}):00/, '$1:$2')
    .replace(' PM', ' PM ')
    .replace(' AM', ' AM ');
};

const DateSettings = ({ assignDate, setAssignDate, dueDate, setDueDate }) => {
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);

  return (
    <div style={{ width: '770px', padding: '10px', border: ' 2px solid #f4f4f4', borderRadius: '10px' }}>
      <button
        onClick={() => setTimeDropdownOpen(!timeDropdownOpen)}
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
        <CalendarCog size={40} color="#000000" />
        <h1 style={{ fontSize: '30px', marginLeft: '20px', marginRight: 'auto', fontFamily: "'montserrat', sans-serif" }}> Dates</h1>
        {timeDropdownOpen ? <ChevronUp  style={{color: 'grey'}}/> : <ChevronDown style={{color: 'grey'}}/>}
      </button>

      <div className={`dropdown-content ${timeDropdownOpen ? 'open' : ''}`}>
        <div style={{ marginTop: '0px', display: 'flex', height: '100px' , marginBottom: '20px'}}>
          <div style={{ position: 'relative', alignItems: 'center',  height: '60px', borderRadius:'10px', width: '350px', paddingLeft: '10px', marginLeft: '10px', marginTop: '10px' }}>
            <h1 style={{ marginLeft: '15px', marginBottom: '10px', fontSize: '16px', fontWeight: '600', marginTop: '10px', color: 'black'}}>Assign on:</h1>
            <div style={{ marginLeft: '5px', zIndex: '100', }}>
              <CustomDateTimePicker
                selected={assignDate}
                onChange={(date) => setAssignDate(date)}
                label="Assign Date"
              />
            </div>
          </div>
          <div style={{ position: 'relative', alignItems: 'center',  height: '60px', borderRadius:'10px', width: '350px', paddingLeft: '10px', marginLeft: '10px', marginTop: '10px' }}>
            <h1 style={{ marginLeft: '15px', marginBottom: '10px', fontSize: '16px', fontWeight: '600', marginTop: '10px', color: 'black'}}>Due on:</h1>
            <div style={{ marginLeft: '5px', zIndex: '100', }}>
              <CustomDateTimePicker
                selected={dueDate}
                onChange={(date) => setDueDate(date)}
                label="Due Date"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateSettings;