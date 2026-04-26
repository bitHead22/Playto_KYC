import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import MerchantFlow from './pages/MerchantFlow';
import MerchantDashboard from './pages/MerchantDashboard';
import MerchantDetails from './pages/MerchantDetails';
import ReviewerDashboard from './pages/ReviewerDashboard';
import ReviewerDetails from './pages/ReviewerDetails';
import ReviewerArchives from './pages/ReviewerArchives';

// Basic Auth Guard
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('access_token');
  if (!token) return <Navigate to="/login" />;
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/merchant" 
          element={
            <PrivateRoute>
              <MerchantDashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/merchant/details/:id" 
          element={
            <PrivateRoute>
              <MerchantDetails />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/merchant/onboarding" 
          element={
            <PrivateRoute>
              <MerchantFlow />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/reviewer" 
          element={
            <PrivateRoute>
              <ReviewerDashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/reviewer/details/:id" 
          element={
            <PrivateRoute>
              <ReviewerDetails />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/reviewer/archives" 
          element={
            <PrivateRoute>
              <ReviewerArchives />
            </PrivateRoute>
          } 
        />
        {/* Default route */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
