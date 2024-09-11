import React from 'react';
import { Link } from 'react-router-dom';

const PricingElement = () => {
  const containerStyle = {
    fontFamily: "'Radio Canada', sans-serif",
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    
    borderRadius: '20px', // Increased border radius
    fontSize: '18px', // Increased overall font size
  };

  const headerStyle = {
    textAlign: 'center',
    fontSize: '72px', // Increased font size
    marginBottom: '20px',
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    padding: '20px',
    border: '4px solid #ccc', // Increased border width
    borderRadius: '30px', // Increased border radius
  };

  const columnStyle = {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative', // For positioning the divider
  };

  const titleStyle = {
    fontSize: '54px', // Increased font size
    marginBottom: '20px',
  };

  const listStyle = {
    listStyleType: 'none',
    padding: 0,
  };

  const listItemStyle = {
    margin: '25px 0', // Increased spacing between list items
    display: 'flex',
    alignItems: 'center',
  };

  const bulletStyle = {
    width: '10px',
    height: '10px',
    backgroundColor: 'black',
    borderRadius: '50%',
    marginRight: '15px',
  };

  const buttonStyle = {
    padding: '15px 25px',
    border: 'none',
    borderRadius: '10px',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
    textDecoration: 'none',
    textAlign: 'center',
    display: 'inline-block',
    marginTop: '20px',
    fontSize: '20px', // Increased font size
  };

  const dividerStyle = {
    position: 'absolute',
    top: '0',
    bottom: '0',
    right: '-10px',
    width: '3px',
    backgroundColor: '#ccc',
  };

  return (
    <div style={containerStyle}>
      <h2 style={headerStyle}>Pricing</h2>
      <div style={gridStyle}>
        <div style={columnStyle}>
          <h3 style={titleStyle}>Basic</h3>
          <ul style={listStyle}>
            <li style={listItemStyle}><span style={bulletStyle}></span>Multiple Choice assignments</li>
            <li style={listItemStyle}><span style={bulletStyle}></span>Short answer assignments</li>
            <li style={listItemStyle}><span style={bulletStyle}></span>6 assignments per class per month</li>
            <li style={listItemStyle}><span style={bulletStyle}></span>Unlimited Classes</li>
          </ul>
          <div style={{fontSize: '34px', fontWeight: 'bold', marginTop: '30px'}}>FREE</div>
          <Link to="/signup" style={{...buttonStyle, backgroundColor: '#F4C10A'}}>Sign Up</Link>
          <div style={dividerStyle}></div> {/* Added divider */}
        </div>
        <div style={columnStyle}>
          <h3 style={titleStyle}><span style={{color: '#F4C10A'}}>★</span> Super</h3>
          <ul style={listStyle}>
            <li style={listItemStyle}><span style={bulletStyle}></span>Adaptive short answer assignments</li>
            <li style={listItemStyle}><span style={bulletStyle}></span>Adaptive multiple Choice assignments</li>
            <li style={listItemStyle}><span style={bulletStyle}></span>Student time accommodations</li>
            <li style={listItemStyle}><span style={bulletStyle}></span>Additional specifications for question generation</li>
            <li style={listItemStyle}><span style={bulletStyle}></span>Multiple Choice assignments</li>
            <li style={listItemStyle}><span style={bulletStyle}></span>Short answer assignments</li>
            <li style={listItemStyle}><span style={bulletStyle}></span>100 assignments per class per month</li>
            <li style={listItemStyle}><span style={bulletStyle}></span>Unlimited Classes</li>
          </ul>
          <div style={{fontSize: '34px', fontWeight: 'bold', marginTop: '30px'}}>$2.50<br/><span style={{fontSize: '20px'}}>per student per month</span></div>
          <Link to="/purchase" style={{...buttonStyle, backgroundColor: '#020CFF'}}>Purchase license</Link>
          <p style={{fontSize: '18px', marginTop: '15px'}}>Schools and districts may be eligible for discounted price →</p>
        </div>
      </div>
    </div>
  );
};

export default PricingElement;