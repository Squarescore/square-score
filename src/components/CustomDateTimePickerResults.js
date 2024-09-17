import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './CustomDatePickerResults.css';

const CustomDateTimePicker = ({ selected, onChange }) => {
  const handleChange = (date) => {
    onChange(formatDate(date));
  };

  return (
    <DatePicker
      selected={selected}
      onChange={handleChange}
      showTimeSelect
      timeFormat="hh:mm aa"
      timeIntervals={15}
      dateFormat="MMMM d, yyyy h:mm aa"
      className="custom-date-input"
      customInput={<CustomDateInput />}
    />
  );
};

const CustomDateInput = React.forwardRef(({ value, onClick }, ref) => (
  <button className="custom-date-input" onClick={onClick} ref={ref}>
    {value || 'Select Date'}
  </button>
));

const formatDate = (date) => {
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
  
  // Remove commas and adjust the format
  return formattedDate
    .replace(',', '') // Remove the comma after the day of week
    .replace(',', '') // Remove the comma after the day
    .replace(' at ', ' ') // Remove 'at'
    .replace(/(\d{1,2}):(\d{2}):00/, '$1:$2') // Remove seconds
    .replace(' PM', ' PM ') // Add space before timezone
    .replace(' AM', ' AM '); // Add space before timezone
};


export default CustomDateTimePicker;
