import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, Calendar, Dumbbell, Archive } from 'lucide-react';
import { useWorkoutStore } from '../store/useWorkoutStore';

function Layout() {
  const activeWorkout = useWorkoutStore(state => state.activeWorkout);

  return (
    <>
      <div className="page-content animate-fade-in">
        <Outlet />
      </div>
      
      <nav className="bottom-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Home size={24} />
          <span>Home</span>
        </NavLink>

        <NavLink to="/lifts" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Archive size={24} />
          <span>Lifts</span>
        </NavLink>
        
        {activeWorkout ? (
          <NavLink to="/workout" className="nav-item">
            <div style={{
              background: 'var(--accent-gradient)',
              padding: '12px',
              borderRadius: '50%',
              color: '#fff',
              marginTop: '-24px',
              border: '4px solid #0d0f12',
              boxShadow: 'var(--shadow-glow)'
            }}>
              <Dumbbell size={24} />
            </div>
            <span>Active</span>
          </NavLink>
        ) : (
          <div className="nav-item" style={{ opacity: 0.5 }}>
            <Dumbbell size={24} />
            <span>Workout</span>
          </div>
        )}

        <NavLink to="/calendar" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Calendar size={24} />
          <span>History</span>
        </NavLink>
      </nav>
    </>
  );
}

export default Layout;
