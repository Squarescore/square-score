// hooks/useFirestoreMonitoring.js
import { useState, useEffect } from 'react';

export const useFirestoreMonitoring = () => {
  const [stats, setStats] = useState({
    reads: 0,
    writes: 0,
    subscriptions: 0,
    operations: []
  });

  useEffect(() => {
    const originalConsoleLog = console.log;
    
    console.log = (...args) => {
      if (typeof args[0] === 'string' && args[0].includes('[Firestore')) {
        setStats(prev => {
          const newStats = { ...prev };
          if (args[0].includes('Read')) newStats.reads++;
          if (args[0].includes('Write')) newStats.writes++;
          if (args[0].includes('Subscribe')) newStats.subscriptions++;
          
          newStats.operations.push({
            type: args[0],
            timestamp: new Date().toISOString(),
            details: args.slice(1)
          });
          
          return newStats;
        });
      }
      originalConsoleLog.apply(console, args);
    };

    return () => {
      console.log = originalConsoleLog;
    };
  }, []);

  return stats;
};