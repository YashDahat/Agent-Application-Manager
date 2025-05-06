import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import * as React from "react";
import { Toaster } from "@/components/ui/sonner"

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <App />
    <Toaster />
  </StrictMode> as React.ReactNode
)
