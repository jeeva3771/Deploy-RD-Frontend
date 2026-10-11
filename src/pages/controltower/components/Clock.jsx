import React, { useState, useEffect } from 'react';
import { gNow } from './constants';

export default function Clock() {
  const [t, setT] = useState(gNow());
  useEffect(() => {
    const i = setInterval(() => setT(gNow()), 1000);
    return () => clearInterval(i);
  }, []);
  return <span className="clock">{t}</span>;
}
