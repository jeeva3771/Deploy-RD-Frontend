import React, { createContext, useCallback, useContext, useState } from 'react';
import { Backdrop, Box, Typography } from '@mui/material';
import { ClipLoader } from 'react-spinners'; 

const LoaderContext = createContext();

export const LoaderProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);

  const showLoader = useCallback(() => setLoading(true), []);

  const hideLoader = useCallback(() => setLoading(false), []);

  return (
    <LoaderContext.Provider value={{ showLoader, hideLoader }}>
      {children}
      <Backdrop 
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.7)', 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transition: 'background-color 0.3s ease', 
        }} 
        open={loading}
      >
        <Box 
          sx={{
            textAlign: 'center',
            padding: 4,
            backgroundColor: 'rgba(0, 0, 0, 0.8)', 
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: 3, 
          }}
        >
          <ClipLoader 
            size={50} 
            color="#4caf50" 
            loading={loading}
            aria-label="loading"
          />
          <Typography variant="h6" color="white" sx={{ marginTop: 2 }}>Loading...</Typography>
        </Box>
      </Backdrop>
    </LoaderContext.Provider>
  );
};

export const useLoader = () => {
  return useContext(LoaderContext);
};
