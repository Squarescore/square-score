import React, { useState } from 'react';
import { CalendarCog } from 'lucide-react';
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
    <div style={{ width: '770px', padding: '10px', border: '4px solid #F4F4F4', borderRadius: '10px' }}>
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
        <h1 style={{ fontSize: '30px', marginLeft: '20px', marginRight: 'auto', fontFamily: "'Radio Canada', sans-serif" }}> Dates</h1>
        <img
          src={timeDropdownOpen ? '/Up.png' : '/Down.png'}
          alt={timeDropdownOpen ? "Collapse" : "Expand"}
          style={{ width: '20px' }}
        />
      </button>

      <div className={`dropdown-content ${timeDropdownOpen ? 'open' : ''}`}>
        <div style={{ marginTop: '0px', display: 'flex', height: '100px' }}>
          <div style={{ position: 'relative', alignItems: 'center', background: '#f4f4f4', height: '80px', borderRadius:'10px', width: '350px', paddingLeft: '10px', marginLeft: '10px', marginTop: '10px' }}>
            <h1 style={{ marginLeft: '15px', marginBottom: '-10px', fontSize: '25px', marginTop: '10px', color: '#4B4B4B'}}>Assign on:</h1>
            <div style={{ marginLeft: '-30px', zIndex: '100' }}>
              <CustomDateTimePicker
                selected={assignDate}
                onChange={(date) => setAssignDate(date)}
                label="Assign Date"
              />
            </div>
          </div>
          <div style={{ position: 'relative', alignItems: 'center', background: '#f4f4f4', borderRadius:'10px', height: '80px', marginLeft: 'auto', width: '350px', paddingLeft: '10px', marginTop: '10px', marginRight: '20px' }}>
            <h1 style={{ marginLeft: '15px', marginBottom: '-10px', fontSize: '25px', marginTop: '10px', color: '#4B4B4B'}}>Due on:</h1>
            <div style={{ marginLeft: '-30px' }}>
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