import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PageNotFound from './PageNotFound';

const StudentRouteHandler = () => {
  const location = useLocation();
  const hasRefreshed = sessionStorage.getItem('hasRefreshed');
  const [shouldShow404, setShouldShow404] = useState(false);

  useEffect(() => {
    // If the path includes studenthome and we haven't refreshed yet
    if (location.pathname.includes('studenthome') && !hasRefreshed) {
      // Set the flag immediately to prevent refresh loops
      sessionStorage.setItem('hasRefreshed', 'true');
      
      // Add a small delay before refreshing
      const refreshTimer = setTimeout(() => {
        window.location.reload();
      }, 500);

      return () => clearTimeout(refreshTimer);
    } else {
      // If we've already refreshed or it's a different path, show 404
      const showTimer = setTimeout(() => {
        setShouldShow404(true);
      }, 500);

      return () => clearTimeout(showTimer);
    }
  }, [location.pathname]);

  // Clear the refresh flag when leaving the page
  useEffect(() => {
    return () => {
      sessionStorage.removeItem('hasRefreshed');
    };
  }, []);

  if (!shouldShow404) {
    return null;
  }

  return <PageNotFound />;
};

export default StudentRouteHandler;