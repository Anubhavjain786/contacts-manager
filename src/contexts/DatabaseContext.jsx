import { createContext, useContext, useState, useEffect } from 'react';
import database from '../db/database';

const DatabaseContext = createContext(null);

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within DatabaseProvider');
  }
  return context;
};

export const DatabaseProvider = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initDatabase = async () => {
      try {
        await database.init();
        setIsReady(true);
      } catch (err) {
        setError(err.message);
        console.error('Failed to initialize database:', err);
      }
    };

    initDatabase();
  }, []);

  return (
    <DatabaseContext.Provider value={{ isReady, error, database }}>
      {children}
    </DatabaseContext.Provider>
  );
};
