import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, ZoomIn } from 'lucide-react';
import { GlassContainer } from '../../styles';

const PageNotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showContent, setShowContent] = useState(false);
  
  // Use sessionStorage to prevent refresh loops
  const hasRefreshed = sessionStorage.getItem('hasRefreshed');
  const isSuccess = location.state?.success || location.pathname === '/studenthome';

  useEffect(() => {
    // If we haven't refreshed yet and we're on the success page
    if (!hasRefreshed && isSuccess) {
      // Set the flag immediately to prevent multiple refreshes
      sessionStorage.setItem('hasRefreshed', 'true');
      
      // Wait a brief moment before refreshing
      const refreshTimeout = setTimeout(() => {
        window.location.reload();
      }, 500);

      return () => clearTimeout(refreshTimeout);
    } else {
      // If we've already refreshed or it's not the success page,
      // show the content after a delay
      const showTimeout = setTimeout(() => {
        setShowContent(true);
      }, 500);

      return () => clearTimeout(showTimeout);
    }
  }, [hasRefreshed, isSuccess]);

  // Clear the refresh flag when leaving the page
  useEffect(() => {
    return () => {
      sessionStorage.removeItem('hasRefreshed');
    };
  }, []);

  const content = isSuccess ? {
    title: "Class Added Successfully",
    message: "Class has been added to your roster - refresh to see changes",
    buttonText: "Refresh",
    isSuccess: true
  } : {
    title: "404 - Page Not Found",
    message: "The page you are looking for does not exist. If you require assistance, please contact us.",
    contactEmail: "rodrigo.squarescore@gmail.com",
    buttonText: "Return Home",
    isSuccess: false
  };

  const handleButtonClick = () => {
    if (isSuccess) {
      window.location.reload();
    } else {
      navigate('/');
    }
  };

  // If content shouldn't be shown yet, show nothing
  if (!showContent) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100vh',
        paddingTop: '150px'
      }}/>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      paddingTop: '200px',
      opacity: showContent ? 1 : 0,
      transition: 'opacity 0.3s ease-in'
    }}>
      <GlassContainer variant="clear"
      contentStyle={{padding: '30px'}}>
      <div style={{
        width: '450px',
        marginLeft: 'auto',
        marginRight: 'auto',
        textAlign: 'center',
      }}>
        {content.isSuccess && (
          <CheckCircle 
            style={{
              margin: '0 auto 20px auto',
              color: '#2BB514',
              background: '#AEF2A3',
              padding: '10px',
              borderRadius: '10px'
            }}
            size={48}
          />
        )}
        
        <h1 style={{
          fontFamily: '"montserrat", sans-serif',
          fontSize: '1.5rem',
          marginBottom: '30px',
          fontWeight: '400',
          color: content.isSuccess ? '#2BB514' : 'black'
        }}>
          {content.title}
        </h1>
        
        <p style={{
          fontFamily: '"montserrat", sans-serif',
          fontSize: '1rem',
          fontWeight: '500',
          marginBottom: '40px',
          color: 'grey',
          lineHeight: '1.6'
        }}>
          {content.message}
          {!content.isSuccess && (
            <>
              <br />   <br />
              <span style={{color: '#666'}}>
                Email: {content.contactEmail}
              </span>
            </>
          )}
        </p>
        
        <button
          onClick={handleButtonClick}
          style={{
            fontFamily: '"montserrat", sans-serif',
           border: 'none',
           background: 'transparent',
            fontWeight: '500',
            color: content.isSuccess ? '#2BB514' : 'grey',
            cursor: 'pointer',
          }}
       
        >
          <GlassContainer variant='teal' size={0}
          style={{zindex: '20'}}
          contentStyle={{padding: '5px 15px', fontWeight: '500', color: '#1DC2B8'}}>
          {content.buttonText}
          </GlassContainer>
        </button>



      </div></GlassContainer>
    </div>
  );
};

export default PageNotFound;