// Importing React and necessary hooks
import React from 'react';

// Define the TestPage component
const TestPage = () => {
  // Component's return statement
  return (
    <div style={{ paddingBottom: '80px', marginLeft: '-3px', marginRight: '-3px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' }}>
    <button
      
      style={{
        backgroundColor: '#0E19FF',
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)',
        padding: '10px',
        width: '140px',
        fontSize: '25px',
        position: 'fixed',
        right: '60px',
        top: '20px',
        borderColor: 'transparent',
        cursor: 'pointer',
        borderRadius: '15px',
        fontFamily: "'Radio Canada', sans-serif",
        color: 'white',
        fontWeight: 'bold',
        zIndex: '100',
        transition: 'transform 0.3s ease'
      }}
      onMouseEnter={(e) => e.target.style.transform = 'scale(1.01)'}
      onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
    >
      Submit
    </button>
   
    <div
      style={{
        color: 'grey' ,
        left: '100px',
        top: '10px',
        fontSize: '44px',
        fontWeight: 'bold',
        width: '120px',
        zIndex: '100',
        fontFamily: "'Radio Canada', sans-serif",
        position: 'fixed',
        padding: '5px',
        borderRadius: '5px',
      }}
    >
    
      10:10
      <button
      
        style={{
          position: 'absolute',
          top: '0px',
          left: '-70px',
          backgroundColor: 'transparent',
          border: 'none',
          color: 'black',
          fontWeight: 'bold',
          cursor: 'pointer',
        }}
      >
         <img style={{ width: '60px', opacity: '90%' }} src='/hidecon.png' />
      </button>
    </div>
 
    <header
      style={{
        backgroundColor: 'white', position: 'fixed',
        borderRadius: '10px',
        color: 'white',
        height: '90px',
        display: 'flex',
        borderBottom: '5px solid lightgrey',
        marginTop: '0px',
        marginBottom: '40px',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      <img style={{ width: '390px', marginLeft: '20px', marginTop: '-20px' }} src="/SquareScore.png" alt="logo" />
    </header>
   
      <button
    
        style={{
          backgroundColor: 'transparent',
          color: 'grey',
          padding: '10px',
          width: '200px',
          background: 'lightgrey',
          textAlign: 'center',
          fontSize: '20px',
          position: 'fixed',
          left: '0px',
          top: '90px',
          borderColor: 'transparent',
          cursor: 'pointer',
          borderBottomRightRadius: '15px',
          fontFamily: "'Radio Canada', sans-serif",
          fontWeight: 'bold',
          zIndex: '100',
          transition: 'transform 0.3s ease'
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.01)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
      >
        Save & Exit
      </button>
   
      <div style={{ width: '1000px', marginLeft: 'auto', marginRight: 'auto', marginTop: '150px', position: 'relative' }}>
        <div style={{
          backgroundColor: 'white', width: '700px', color: 'black', border: '10px solid #EAB3FD',
          textAlign: 'center', fontWeight: 'bold', padding: '40px', borderRadius: '30px', fontSize: '30px', position: 'relative',
          marginLeft: 'auto', marginRight: 'auto', marginTop: '40px', fontFamily: "'Radio Canada', sans-serif", userSelect: 'none'
        }}>
          question itself goes here
          <h3 style={{
            width: 'auto',
            top: '0px',
            marginTop: '-43px',
            left: '50%',
            transform: 'translateX(-50%)',
            position: 'absolute',
            backgroundColor: '#FCD3FF',
            borderRadius: '20px',
            color: '#E01FFF',
            border: '10px solid white',
            fontSize: '34px',
            padding: '10px 20px',
            whiteSpace: 'nowrap'
          }}>
            AssignmentName
          </h3>
        </div>
   
    
      </div>
    
  </div>
);
}

// Define some basic styles
const styles = {
  container: {
    padding: '20px',
    textAlign: 'center',
  },
  title: {
    fontSize: '2em',
    marginBottom: '20px',
  },
  paragraph: {
    fontSize: '1.2em',
  },
};

// Export the TestPage component
export default TestPage;
