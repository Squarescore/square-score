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
    <div style={{ width: '700px', marginTop: '-50px', }}>
      <div
      
        style={{
          width: '100%',
          padding: '0px',
          fontSize: '30px',
          backgroundColor: 'white',
          color: 'black',
          border: 'none',
          height: '50px',
          marginBottom: '-30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <CalendarCog size={20} color="lightgrey" />
        <h1 style={{ fontSize: '16px', marginLeft: '5px', marginRight: 'auto', fontFamily: "'montserrat', sans-serif", color: 'lightgrey', fontWeight: '600' }}> Dates</h1>
      </div>

      <div>
        <div style={{ marginTop: '-10px', height: '150px' , marginBottom: '-30px'}}>
          <div style={{ position: 'relative', alignItems: 'center',  height: '60px', borderRadius:'10px', width: '690px',  marginTop: '10px', display: 'flex' }}>
            <h1 style={{ marginLeft: '0px', marginBottom: '10px', fontSize: '25px', fontWeight: '600', marginTop: '10px', color: 'black'}}>Assign on:</h1>
            <div style={{ marginLeft: 'auto', zIndex: '2', }}>
              <CustomDateTimePicker
                selected={assignDate}
                onChange={(date) => setAssignDate(date)}
                label="Assign Date"
              />
            </div>
          </div>
          <div style={{ position: 'relative', alignItems: 'center',  height: '60px', borderRadius:'10px', width: '690px',  marginTop: '-5px', display: 'flex'  }}>
            <h1 style={{ marginLeft: '0px', marginBottom: '10px', fontSize: '25px', fontWeight: '600', marginTop: '10px', color: 'black'}}>Due on:</h1>
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