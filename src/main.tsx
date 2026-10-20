import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {AccountGate} from './components/AccountGate';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AccountGate><App /></AccountGate>
  </StrictMode>,
);
