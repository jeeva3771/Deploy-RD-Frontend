import React from 'react';
import { Box, CircularProgress, LinearProgress } from '@mui/material';

const Loader = () => (
  <>
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 1301,
      }}
    >
      <LinearProgress color="primary" />
    </Box>

    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100%',
      }}
    >
      <CircularProgress color="primary" />
    </Box>
  </>
);

export default Loader;
