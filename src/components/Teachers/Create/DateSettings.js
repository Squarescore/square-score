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
    <div style={{ width: '490px', marginTop: '0px', marginLeft: 'auto', marginRight: 'auto', height: '95px', }}>
      <div>
        <div style={{ display: 'flex', flexDirection: 'column',  gap: '10px'}}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '40px', width: '100%' }}>
            <h1 style={{ fontSize: '1rem', fontWeight: '500', color: 'grey', marginRight: 'auto'}}>Access Opens</h1>
            <div style={{ }}>
              <CustomDateTimePicker
                selected={assignDate}
                onChange={(date) => setAssignDate(date)}
                label="Assign Date"
              />
            </div>
          </div>


          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '40px', width: '100%' , }}>
            <h1 style={{ fontSize: '1rem', fontWeight: '500', color: 'grey',marginRight: 'auto'  }}>Due By</h1>
            <div style={{  }}>
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