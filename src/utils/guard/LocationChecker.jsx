import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';


const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371000;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const LocationChecker = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  // Target location
  const allowedLat = 11.0274; 
  const allowedLon = 77.0307; 
  const maxDistance = 100; 

  useEffect(() => {
    if (!navigator.geolocation) {
      navigate('/no-access');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
          console.log('User\'s current location:');
      console.log('Latitude:', latitude);
      console.log('Longitude:', longitude);
        const distance = getDistanceFromLatLonInMeters(
          latitude,
          longitude,
          allowedLat,
          allowedLon
        );

        if (distance <= maxDistance) {
          setChecking(false); 
        } else {
          navigate('/no-access');
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        navigate('/no-access');
      },
      { enableHighAccuracy: true }
    );
  }, [navigate]);

  if (checking) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          textAlign: 'center',
          backgroundColor: '#f4f6f8',
          padding: 3,
        }}
      >
        <CircularProgress color="primary" />
        <Typography variant="h6" sx={{ mt: 2, fontWeight: 500 }}>
          Verifying your location...
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
          Please enable location services to continue using the application.
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
};

export default LocationChecker;
