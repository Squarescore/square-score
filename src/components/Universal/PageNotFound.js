import React from 'react';
import { useNavigate } from 'react-router-dom';

const PageNotFound = () => {
  const navigate = useNavigate();

  return (
    <div style={{width: '580px', marginLeft: 'auto', marginRight: 'auto',}}>
      <h1 style={{fontFamily: '"montserrat", sans- serif', fontSize: '40px', marginTop: '200px'}}>404 - Page Not Found</h1>
      <p style={{fontFamily: '"montserrat", sans- serif', fontSize: '25px', fontWeight: '600'}}>The page you are looking for does not exist, if you require assistance - <br></br> 
      email: rodrigo.squarescore@gmail.com</p>
      <button
        onClick={() => navigate('/')}
        style={{border: '1px solid lightgrey', borderRadius: '5px', padding: '10px', fontFamily: '"montserrat", sans- serif', fontSize: '16px', width: '140px',  fontWeight: '600', color: 'blue', cursor: 'pointer', background: 'white' }}
      >
        Return Home
      </button>
    </div>
  );
};

export default PageNotFound;