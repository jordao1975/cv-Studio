import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CVBuilder from './pages/CVBuilder';
import CoverLetter from './pages/CoverLetter';
import LetterView from './pages/LetterView';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

const ProtectedRoute = ({ children }) => {
  const token = sessionStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <GoogleOAuthProvider clientId="YOUR_CLIENT_ID_HERE">
      <HashRouter>
        <ErrorBoundary fallbackMessage="Ocorreu um erro na aplicação. Tente recarregar.">
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/cv/:id" element={
              <ProtectedRoute>
                <ErrorBoundary fallbackMessage="Erro no editor de CV. Os seus dados estão seguros.">
                  <CVBuilder />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/cv/new" element={
              <ProtectedRoute>
                <ErrorBoundary fallbackMessage="Erro no editor de CV.">
                  <CVBuilder />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/cover-letter" element={
              <ProtectedRoute>
                <CoverLetter />
              </ProtectedRoute>
            } />
            <Route path="/letter/:id" element={
              <ProtectedRoute>
                <LetterView />
              </ProtectedRoute>
            } />
          </Routes>
        </Layout>
        </ErrorBoundary>
      </HashRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
