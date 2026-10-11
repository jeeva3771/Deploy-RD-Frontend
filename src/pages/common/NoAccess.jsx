import React from 'react';
import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '20px',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: '2.5rem',
    marginBottom: '1rem',
    color: '#d32f2f',
  },
  message: {
    fontSize: '1.2rem',
    marginBottom: '2rem',
    color: '#333',
  },
    message2: {
    fontSize: '1rem',
    marginTop: '1rem',
    color: '#333',
  },
};

const NoAccess = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🚫 Access Denied</h1>
      <p style={styles.message}>
        This application is only accessible within a specific geographic area.
      </p>
      <Button variant="contained" color="primary" onClick={() => navigate('/')}>
        Go to Login
      </Button>
      <p style={styles.message2}>You have denied location access. Please enable location permissions in your browser settings.</p>
    </div>
  );
};
export default NoAccess;
