import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/dm-sans';
import '@fontsource-variable/manrope';
import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource-variable/playfair-display';
import '@fontsource-variable/playfair-display/wght-italic.css';
import App from './App.jsx';
import './styles.css';
import './landing.css';
import './polish.css';
import './theme.css';
import './auth.css';

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
