import { Component, type ErrorInfo, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import AnalysisResult from './components/AnalysisResult';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', backgroundColor: '#001D39', padding: '40px', color: '#BDD8E9', fontFamily: 'monospace' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '20px' }}>React Crashed!</h1>
          <div style={{ backgroundColor: '#0A4174', padding: '20px', borderRadius: '12px', border: '1px solid #49769F', overflow: 'auto', marginBottom: '20px' }}>
            <strong>{this.state.error?.toString()}</strong>
          </div>
          <div style={{ backgroundColor: '#0A4174', padding: '20px', borderRadius: '12px', border: '1px solid #49769F', overflow: 'auto', fontSize: '0.875rem' }}>
            <pre>{this.state.error?.stack}</pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analysis" element={<AnalysisResult />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
