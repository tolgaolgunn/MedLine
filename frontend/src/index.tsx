import React from 'react';
import ReactDOM from 'react-dom/client';
import "@radix-ui/themes/styles.css";
import './index.css';
import App from './App';

const domNode = document.getElementById('root');

if (!domNode) {
  throw new Error('Root element not found');
}

const root = ReactDOM.createRoot(domNode);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
