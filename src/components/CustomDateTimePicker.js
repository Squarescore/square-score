import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './CustomDatePicker.css';

const CustomDateTimePicker = ({ selected, onChange }) => {
  return (
    <DatePicker
      selected={selected}
      onChange={onChange}
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

export default CustomDateTimePicker;
