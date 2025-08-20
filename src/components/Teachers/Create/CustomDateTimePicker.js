import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './CustomDatePicker.css';
import { Calendar } from 'lucide-react';

const CustomDateTimePicker = ({ selected, onChange }) => {
  return (
    <DatePicker
      selected={selected}
      onChange={onChange}
      showTimeSelect
      timeFormat="hh:mm aa"
      timeIntervals={15}
      dateFormat="   eee h:mm aa MM/dd/yy "
      className="custom-date-input"
      customInput={<CustomDateInput />}
    />
  );
};

const CustomDateInput = React.forwardRef(({ value, onClick }, ref) => (
  <button 
    className="custom-date-input" 
    onClick={onClick} 
    ref={ref} 
    style={{
      display: 'flex',
      border: '1px solid #ddd',
      borderRadius: '20px',
      padding: '5px 10px',
      background: 'white',
      height: '30px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':focus': {
        outline: 'none',
        borderColor: '#29c60f',
      }
    }}
  >
    <Calendar size={14} strokeWidth={1.5} style={{marginTop: '2px', marginRight: '10px'}}/> 
    <p style={{marginTop: '1px', marginRight: '5px'}}>{value || 'Select Date'}</p>
  </button>
));

export default CustomDateTimePicker;
