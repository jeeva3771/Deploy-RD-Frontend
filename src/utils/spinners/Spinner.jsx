  
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Spinner = ({ path = "" }) => {
  const [count, setCount] = useState(null); 
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prevValue) => prevValue - 1);
    }, 1000);

    if (count === 0) {
      navigate(`/${path}`, { state: location.pathname });
    }

    return () => clearInterval(interval);
  }, [count, navigate, location.pathname, path]);


  return null;
};

export default Spinner;
