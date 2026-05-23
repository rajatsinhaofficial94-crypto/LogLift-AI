import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { Play, Activity, TrendingUp, Bot, Info, X } from 'lucide-react';
import WorkoutDetail from './WorkoutDetail';

function HomeScreen() {
  const navigate = useNavigate();
  const { startWorkout, activeWorkout, history } = useWorkoutStore();

  const [selectedWorkoutForDetail, setSelectedWorkoutForDetail] = React.useState(null);
  const [showReadme, setShowReadme] = React.useState(false);

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
        <div style={{ flex: 1 }}>
          <div className="flex items-center gap-2">
            <h1 className="title title-gradient tracking-tight">LogLift</h1>
            <button
              onClick={() => setShowReadme(true)}
              className="btn-icon"
              style={{ marginTop: '2px', opacity: 0.6 }}
              aria-label="About this app"
            >
              <Info size={16} />
            </button>
          </div>
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

      {showReadme && (
        <div className="readme-overlay" onClick={() => setShowReadme(false)}>
          <div className="readme-modal glass-panel" onClick={e => e.stopPropagation()}>
            <div className="readme-header">
              <h2 className="font-bold text-base title-gradient">About LogLift AI</h2>
              <button className="btn-icon hover:bg-white/10" onClick={() => setShowReadme(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="readme-body">
              <p className="readme-intro">
                LogLift is a full-stack AI-powered bodybuilding and strength training app built as a portfolio project to demonstrate modern web development and AI integration.
              </p>

              <div className="readme-section">
                <h3>🤖 AI Coach</h3>
                <ul>
                  <li>Powered by <strong>Claude (Anthropic)</strong> with <strong>Llama 3.3 (Groq)</strong> as a fallback — user-switchable via toggle</li>
                  <li>RAG pipeline using <strong>Pinecone</strong> vector database — responses are grounded in two expert strength training books for evidence-based advice</li>
                  <li>Generates personalised workout plans, exercise substitutions, and progress analysis based on the user's logged history</li>
                  <li>Workout plans render as interactive tables and can be started with one tap</li>
                  <li>Exercise names in responses are hyperlinked to YouTube tutorial searches</li>
                  <li>Chat history persists across sessions via localStorage</li>
                </ul>
              </div>

              <div className="readme-section">
                <h3>🏋️ Workout Tracker</h3>
                <ul>
                  <li>Full exercise database with hundreds of movements across all muscle groups</li>
                  <li>Log sets, reps, weight, and RIR (Reps in Reserve) per set</li>
                  <li>Per-exercise history and volume tracking with per-session edit support</li>
                  <li>Workout data persists locally — survives browser restarts and app updates</li>
                </ul>
              </div>

              <div className="readme-section">
                <h3>⚙️ Tech Stack</h3>
                <ul>
                  <li><strong>Frontend:</strong> React + Vite, Zustand, Tailwind CSS, PWA (installable)</li>
                  <li><strong>Backend:</strong> Vercel Serverless Functions</li>
                  <li><strong>AI:</strong> Anthropic Claude API, Groq API, Pinecone vector DB</li>
                  <li><strong>Deployment:</strong> Vercel (CI/CD via GitHub)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomeScreen;
