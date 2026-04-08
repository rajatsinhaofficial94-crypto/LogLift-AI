import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HomeScreen from './components/HomeScreen';
import ActiveWorkout from './components/ActiveWorkout';
import CalendarView from './components/CalendarView';
import MyLifts from './components/MyLifts';
import { useWorkoutStore } from './store/useWorkoutStore';

function App() {
  const activeWorkout = useWorkoutStore(state => state.activeWorkout);

  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* Main Layout routes */}
          <Route element={<Layout />}>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/lifts" element={<MyLifts />} />
            <Route path="/calendar" element={<CalendarView />} />
          </Route>

          {/* Standalone full-screen routes */}
          <Route path="/workout" element={
            activeWorkout ? <ActiveWorkout /> : <Navigate to="/" />
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
