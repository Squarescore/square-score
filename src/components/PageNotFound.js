import React from 'react';
import { useNavigate } from 'react-router-dom';

const PageNotFound = () => {
  const navigate = useNavigate();

  return (
    <div style={{width: '800px', marginLeft: 'auto', marginRight: 'auto',}}>
      <h1 style={{fontFamily: '"Rajdhani", sans- serif', fontSize: '79px', marginTop: '200px'}}>404 - Page Not Found</h1>
      <p style={{fontFamily: '"Radio Canada", sans- serif', fontSize: '30px', fontWeight: 'bold'}}>The page you are looking for does not exist, if you require assistance - <br></br> 
      email: rodrigo.squarescore@gmail.com</p>
      <button
        onClick={() => navigate('/')}
        style={{border: '6px solid blue', borderRadius: '15px', padding: '5px', fontFamily: '"Radio Canada", sans- serif', fontSize: '30px', width: '300px',  fontWeight: 'bold', color: 'blue', cursor: 'pointer', background: '#A9B7FF' }}
      >
        Return Home
      </button>
    </div>
  );
};

export default PageNotFound;