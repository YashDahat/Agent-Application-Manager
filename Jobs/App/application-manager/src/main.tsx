import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import * as React from "react";

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <App />
  </StrictMode> as React.ReactNode
)
