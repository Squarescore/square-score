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
 
  return (
    <div style={{ width: '600px', marginTop: '0px',  marginLeft: 'auto', marginRight: 'auto',  height: '80px', marginLeft: '-5px'}}>
     

      <div>
        <div style={{ marginTop: '-10px', height: '150px' , marginBottom: '-30px', display: 'flex'}}>
          <div style={{ position: 'relative', alignItems: 'center',  height: '60px', borderRadius:'10px', width: '600px',  marginTop: '-5px',  }}>
            <h1 style={{ marginLeft: '5px', marginBottom: '5px', fontSize: '14px', fontWeight: '600', marginTop: '10px', color: 'black'}}>Assign on:</h1>
            <div style={{ marginLeft: 'auto', zIndex: '2', }}>
              <CustomDateTimePicker
                selected={assignDate}
                onChange={(date) => setAssignDate(date)}
                label="Assign Date"
              />
            </div>
          </div>
          <div style={{ position: 'relative', alignItems: 'center',  height: '60px', borderRadius:'10px', width: '600px',  marginTop: '-5px', }}>
            <h1 style={{ marginLeft: '10px', marginBottom: '5px', fontSize: '14px', fontWeight: '600', marginTop: '10px', color: 'black'}}>Due on:</h1>
            <div style={{ marginLeft: 'auto', zIndex: '2',  }}>
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