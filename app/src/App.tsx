// app/src/App.tsx
import React from 'react';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';
import './styles/globals.css';

function App({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-dark text-white">
      {children}
      <Toaster position="top-right" />
      <Analytics />
    </div>
  );
}

export default App;