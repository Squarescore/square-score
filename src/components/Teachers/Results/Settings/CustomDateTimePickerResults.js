import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../../Create/CustomDatePicker.css';

const CustomDateTimePicker = ({ selected, onChange, updateAssignmentSetting, settingName }) => {
  const [selectedDate, setSelectedDate] = useState(selected);
  useEffect(() => {
    setSelectedDate(selected);
  }, [selected]);

  const handleChange = (date) => {
    console.log('DatePicker onChange called with:', date);
    
    if (date && date instanceof Date && !isNaN(date)) {
      setSelectedDate(date);
      const formattedDate = formatDate(date);
      console.log('Formatted date:', formattedDate);
      onChange(formattedDate);
    } else {
      console.warn('Invalid date selected:', date);
      setSelectedDate(null);
      onChange(null);
    updateAssignmentSetting(settingName, date);
    }
  };

  return (
    <DatePicker
      selected={selectedDate}
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
  if (!(date instanceof Date) || isNaN(date)) {
    console.warn('Invalid date passed to formatDate:', date);
    return '';
  }

  try {
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
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

export default CustomDateTimePicker;