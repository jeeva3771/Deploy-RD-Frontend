// src/contexts/ThemeContext.jsx (Updated for your app)
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      return savedTheme;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'light';
    }
    
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    
    // Remove previous theme classes
    root.classList.remove('light', 'dark');
    body.classList.remove('light-theme', 'dark-theme');
    
    // Add current theme class for Tailwind
    root.classList.add(theme);
    
    // Also support body classes for compatibility with your existing styles
    body.classList.add(`${theme}-theme`);
    
    // Save to localStorage
    localStorage.setItem('app-theme', theme);
    
    // Add scrollbar theme to body
    body.classList.add('scrollbar-theme-body');
    
  }, [theme]);

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Only update if user hasn't manually set a preference
      const savedTheme = localStorage.getItem('app-theme');
      if (!savedTheme) {
        setTheme(e.matches ? 'light' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setLightTheme = () => setTheme('light');
  const setDarkTheme = () => setTheme('dark');

  // Helper function to get theme-aware classes
  const getThemeClasses = (lightClass, darkClass) => {
    return `${lightClass} dark:${darkClass}`;
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    getThemeClasses // Helper for conditional classes
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
