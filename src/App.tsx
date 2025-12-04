import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import ProfileCapture from './components/ProfileCapture';
import TipsBoard from './components/TipsBoard';
import SavedTipsBoard from './components/SavedTipsBoard';
import { SavedTipsProvider } from './contexts/SavedTipsContext';

interface ProfileData {
  age: number;
  gender: string;
  goals: string[];
}

function App() {
  const handleProfileComplete = (profileData: ProfileData) => {
    // Persist profile so the board route can use it later
    try {
      window.localStorage.setItem('wellnessProfile', JSON.stringify(profileData));
    } catch {
      // ignore storage errors
    }
  };

  return (
    <SavedTipsProvider>
      <div className="App">
        <Routes>
          <Route path="/" element={<ProfileCapture onComplete={handleProfileComplete} />} />
          <Route path="/board" element={<TipsBoard />} />
          <Route path="/board/saved" element={<SavedTipsBoard />} />
          <Route path="/board/:tipId" element={<TipsBoard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </SavedTipsProvider>
  );
}

export default App;
