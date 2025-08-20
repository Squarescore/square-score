import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { X } from 'lucide-react';

// Custom Input Component with clear button
const CustomInput = React.forwardRef(({ value, onClick, onChange, selected }, ref) => (
  <div className="relative w-48">
    <input
      onClick={onClick}
      onChange={onChange}
      value={value}
      ref={ref}
      readOnly
      placeholder="Select a date"
  style={{borderRadius: '5px', padding: '5px 5px', border: '1px solid lightgrey',
    fontFamily: "'Montserrat', sans-serif",}}  />
  </div>
));

const StyledDatePicker = (props) => {
  return (
    <div className="datepicker-wrapper">
      <style jsx>{`
        .datepicker-wrapper .react-datepicker {
          font-family: 'Montserrat', sans-serif;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 0.5rem;
          background-color: white;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        .datepicker-wrapper .react-datepicker__header {
          background-color: white;
          border-bottom: none;
          padding: 0.5rem 0;
          font-weight: 500;
        }
        .datepicker-wrapper .react-datepicker__current-month {
          font-size: 1rem;
          color: #111827;
          font-family: 'Montserrat', sans-serif;
        }
        .datepicker-wrapper .react-datepicker__day-name {
          color: #6b7280;
          font-weight: 500;
          width: 2rem;
          font-size: 0.875rem;
        }
        .datepicker-wrapper .react-datepicker__day {
          width: 2rem;
          line-height: 2rem;
          color: #374151;
          border-radius: 5px;
          margin: 0.166rem;
        }
        .datepicker-wrapper .react-datepicker__day:hover {
          background-color: #FFF8E7;
          color: #FFAE00;
        }
        .datepicker-wrapper .react-datepicker__day--selected {
          background-color: #FFAE00 !important;
          color: white !important;
        }
        .datepicker-wrapper .react-datepicker__day--in-selecting-range,
        .datepicker-wrapper .react-datepicker__day--in-range {
          background-color: #FFF8E7 !important;
          color: #FFAE00 !important;
        }
        .datepicker-wrapper .react-datepicker__day--selecting-range-start,
        .datepicker-wrapper .react-datepicker__day--range-start {
          background-color: #FFAE00 !important;
          color: white !important;
        }
        .datepicker-wrapper .react-datepicker__day--selecting-range-end,
        .datepicker-wrapper .react-datepicker__day--range-end {
          background-color: #FFAE00 !important;
          color: white !important;
        }
        .datepicker-wrapper .react-datepicker__day--keyboard-selected {
          background-color: #FFF8E7;
          color: #FFAE00;
        }
        .datepicker-wrapper .react-datepicker__day--today {
          font-weight: bold;
        }
        .datepicker-wrapper .react-datepicker__day--outside-month {
          color: #9ca3af;
        }
        .datepicker-wrapper .react-datepicker__navigation {
          top: 0.75rem;
        }
        .datepicker-wrapper .react-datepicker__navigation--previous {
          left: 0.5rem;
        }
        .datepicker-wrapper .react-datepicker__navigation--next {
          right: 0.5rem;
        }
        /* Style the built-in clear button */
        .datepicker-wrapper .react-datepicker__close-icon {
          right: 2px;
          height: 16px;
          width: 16px;
             top: 4px;
          padding: 0;
        }
        .datepicker-wrapper .react-datepicker__close-icon::after {
          background-color: transparent;
          color: #9ca3af;
          font-size: 16px;
          padding: 0;
          top: 4px;
          font-weight: normal;
          height: auto;
          width: auto;
        }
        .datepicker-wrapper .react-datepicker__close-icon:hover::after {
          color: #4b5563;
        }
      `}</style>
      <DatePicker
        {...props}
        customInput={<CustomInput />}
        className="w-full"
        isClearable={true}
      />
    </div>
  );
};

export default StyledDatePicker;