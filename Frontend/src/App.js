import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-react';
import Header from './components/layout/Header';
import MatrixBackground from './components/common/MatrixBackground';
import Home from './pages/Home';
import About from './pages/About';
import Auth from './pages/Auth';
import SSOCallback from './pages/SSOCallback';
import Contact from './pages/Contact';
import History from './pages/History';
import Monitoring from './pages/Monitoring';
import './App.css';

// Get Clerk publishable key from environment
const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error('Missing Clerk Publishable Key');
}

// Protected Route Component (Clerk version)
const ProtectedRoute = ({ children }) => {
  return (
    <>
      <SignedIn>
        {children}
      </SignedIn>
      <SignedOut>
        <Navigate to="/auth" replace />
      </SignedOut>
    </>
  );
};

function AppContent() {
  return (
    <div className="text-white min-h-screen">
      <MatrixBackground />
      <Header />
      
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/sso-callback" element={<SSOCallback />} />
        <Route path="/contact" element={<Contact />} />
        
        {/* Protected routes */}
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />
        <Route
          path="/monitoring"
          element={
            <ProtectedRoute>
              <Monitoring />
            </ProtectedRoute>
          }
        />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <Router>
        <AppContent />
      </Router>
    </ClerkProvider>
  );
}

export default App;