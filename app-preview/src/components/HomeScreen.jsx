import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { Play, Activity, TrendingUp, Bot } from 'lucide-react';
import WorkoutDetail from './WorkoutDetail';

function HomeScreen() {
  const navigate = useNavigate();
  const { startWorkout, activeWorkout, history } = useWorkoutStore();

  const [selectedWorkoutForDetail, setSelectedWorkoutForDetail] = React.useState(null);

  const handleStartWorkout = () => {
    if (activeWorkout) {
      navigate('/workout');
    } else {
      startWorkout();
      navigate('/workout');
    }
  };

  const getWorkoutName = (workout) => {
    if (workout.name) return workout.name;
    const bodyParts = new Set();
    workout.workoutExercises.forEach(we => {
      if (we.exercise.bodyPart) {
        we.exercise.bodyPart.split(',').forEach(bp => bodyParts.add(bp.trim()));
      }
    });
    if (bodyParts.size > 0 && bodyParts.size <= 2) {
      return Array.from(bodyParts).join(' & ');
    } else if (bodyParts.size > 2) {
      return "Full Body";
    }
    return "Workout Session";
  };

  const totalTonnage = history.reduce((total, workout) => {
    const workoutTonnage = workout.workoutExercises.reduce((weTotal, we) => {
      const weMax = we.sets.reduce((setTotal, set) => {
        // If completed is missing or true, we count it towards total volume
        if (set.completed !== false) {
          return setTotal + (Number(set.weight) || 0) * (Number(set.reps) || 0);
        }
        return setTotal;
      }, 0);
      return weTotal + weMax;
    }, 0);
    return total + workoutTonnage;
  }, 0);

  const formatTonnage = (tons) => {
    if (tons === 0) return '0';
    if (tons >= 1000000) return (tons / 1000000).toFixed(1) + 'M';
    if (tons >= 1000) return (tons / 1000).toFixed(1) + 'k';
    return tons.toLocaleString();
  };

  return (
    <div className="flex-col gap-4 animate-fade-in">
      <div className="glass-header" style={{ position: 'relative', background: 'transparent', padding: '0 0 16px 0', border: 'none' }}>
        <div>
          <h1 className="title title-gradient tracking-tight">LogLift</h1>
          <p className="text-muted text-xs mt-1 opacity-80">Your strength. Coached by AI. Backed by science.</p>
        </div>
        <div className="shrink-0 overflow-hidden shadow-lg border border-white/10 bg-white/5 flex items-center justify-center" style={{ width: '64px', height: '64px', borderRadius: '16px' }}>
          <img src="/logo.png" alt="LogLift Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.5)' }} />
        </div>
      </div>

      <div className="glass-panel p-4 mb-4">
        <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-widest text-muted">
          <TrendingUp size={16} className="text-accent"/> 
          Quick Stats
        </h2>
        <div className="flex gap-3">
          <div className="metric-box flex-1">
            <span className="metric-value">{history.length}</span>
            <span className="metric-label">Sessions Completed</span>
          </div>
          <div className="metric-box flex-1">
            <span className="metric-value text-accent">{formatTonnage(totalTonnage)}</span>
            <span className="metric-label">Total Tonnage</span>
          </div>
        </div>
      </div>

      <div className="flex-col gap-2 mt-4">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-chatbot'))}
          className="ai-coach-btn w-full p-4"
        >
          <Bot size={20} />
          Talk to Your AI Coach
        </button>
        {activeWorkout ? (
          <button onClick={handleStartWorkout} className="btn btn-primary w-full p-4" style={{ fontSize: '1.1rem' }}>
            <Play size={20} fill="currentColor" /> Resume Workout
          </button>
        ) : (
          <button onClick={handleStartWorkout} className="btn btn-primary w-full p-4" style={{ fontSize: '1.1rem' }}>
            <Play size={20} fill="currentColor" /> Start Workout
          </button>
        )}
      </div>
      
      {history.length > 0 && (
        <div className="mt-4 pb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-muted text-sm uppercase tracking-wider">Recent Activity</h3>
            <button 
              onClick={() => navigate('/calendar')} 
              className="px-3 py-1.5 rounded-md bg-white/5 border border-white/5 text-[10px] font-black uppercase text-muted hover:text-white tracking-widest transition-all outline-none"
              style={{ WebkitAppearance: 'none' }}
            >
              View All
            </button>
          </div>
          <div className="flex-col gap-2">
            {history.slice(-3).reverse().map((workout, idx) => (
              <div 
                key={workout.id} 
                className="list-item cursor-pointer hover:bg-white/5 active:scale-[0.98] transition-all"
                onClick={() => setSelectedWorkoutForDetail(workout)}
              >
                <div className="flex-col">
                  <span className="font-semibold">{getWorkoutName(workout)}</span>
                  <span className="text-xs text-muted">
                    {new Date(workout.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {workout.workoutExercises.length} exercises
                  </span>
                </div>
                <div className="badge badge-primary">Completed</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedWorkoutForDetail && (
        <WorkoutDetail 
          workout={selectedWorkoutForDetail} 
          onClose={() => setSelectedWorkoutForDetail(null)} 
        />
      )}
    </div>
  );
}

export default HomeScreen;
