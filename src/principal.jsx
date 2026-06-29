import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import AuthGate from './PaginaInicial.jsx'; 
import { LanguageProvider } from './i18n/ContextoIdioma';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <HashRouter>
        <AuthGate />
      </HashRouter>
    </LanguageProvider>
  </React.StrictMode>,
)
