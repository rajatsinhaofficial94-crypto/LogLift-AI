import React from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, Activity, Edit3, TrendingUp, History } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useWorkoutStore } from '../store/useWorkoutStore';
import ExerciseHistory from './ExerciseHistory';

function WorkoutDetail({ workout, onClose }) {
  const navigate = useNavigate();
  const { editWorkout, getExerciseHistory } = useWorkoutStore();
  const [historyExerciseId, setHistoryExerciseId] = React.useState(null);

  if (!workout) return null;

  const handleEdit = () => {
    editWorkout(workout.id);
    navigate('/workout');
    onClose();
  };

  const getWorkoutName = () => {
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

  const totalVolume = workout.workoutExercises.reduce((acc, we) => {
    return acc + we.sets.reduce((sAcc, s) => sAcc + (Number(s.reps || 0) * Number(s.weight || 0)), 0);
  }, 0);

  return createPortal(
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 400 }}>
      <div className="action-sheet flex flex-col h-[90vh] bg-bg-secondary">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-col gap-1 w-full" style={{ overflow: 'hidden' }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-primary px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest leading-none">Completed</span>
            </div>
            <h2 className="title text-2xl font-bold leading-tight truncate">{getWorkoutName()}</h2>
            <div className="flex items-center gap-3 mt-1 text-muted text-xs font-medium">
              <div className="flex items-center gap-1">
                <Calendar size={12} className="text-accent" />
                {format(new Date(workout.date), 'MMM d, yyyy')}
              </div>
              <div className="flex items-center gap-1">
                <Clock size={12} className="text-accent" />
                {format(new Date(workout.date), 'h:mm a')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={handleEdit} 
              className="btn badge-primary px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 border border-accent/20"
            >
              <Edit3 size={12} /> Edit
            </button>
            <button onClick={onClose} className="btn-icon bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors shrink-0">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="metric-box flex-1 py-3 px-2 bg-white/5 border border-white/5 text-center">
            <span className="metric-value text-lg text-accent">{workout.workoutExercises.length}</span>
            <span className="metric-label text-[10px]">Exercises</span>
          </div>
          <div className="metric-box flex-1 py-3 px-2 bg-white/5 border border-white/5 text-center">
            <span className="metric-value text-lg text-accent">
              {workout.workoutExercises.reduce((acc, we) => acc + we.sets.length, 0)}
            </span>
            <span className="metric-label text-[10px]">Total Sets</span>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 pb-safe pr-2 -mr-2 gap-6 flex flex-col">
          {workout.workoutExercises.map((we, index) => (
            <div key={index} className="flex flex-col gap-3">
              <div className="flex justify-between items-end border-b border-white/5 pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-base leading-none">{we.exercise.name}</h3>
                    <p className="text-muted text-[11px] mt-1 uppercase tracking-wider font-semibold">{we.exercise.bodyPart}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setHistoryExerciseId(we.exercise.id)} 
                  className="btn-icon bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors ml-2" 
                  title="View History Trends"
                >
                  <History size={16} className="text-accent" />
                </button>
              </div>

              {(() => {
                const history = getExerciseHistory(we.exercise.id);
                // Find most recent session BEFORE this workout date
                const prevSession = history
                  .filter(h => new Date(h.date) < new Date(workout.date))
                  .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

                const currentSets = we.sets.length;
                const currentReps = we.sets.reduce((acc, s) => acc + Number(s.reps || 0), 0);
                const currentMax = Math.max(0, ...we.sets.map(s => Number(s.weight) || 0));
                const currentVol = we.sets.reduce((acc, s) => acc + (Number(s.reps || 0) * Number(s.weight || 0)), 0);

                let prevSets = 0, prevReps = 0, prevMax = 0, prevVol = 0;
                let hasPrev = !!prevSession;

                if (hasPrev) {
                  prevSets = prevSession.sets.length;
                  prevReps = prevSession.sets.reduce((acc, s) => acc + Number(s.reps || 0), 0);
                  prevMax = Math.max(0, ...prevSession.sets.map(s => Number(s.weight) || 0));
                  prevVol = prevSession.sets.reduce((acc, s) => acc + (Number(s.reps || 0) * Number(s.weight || 0)), 0);
                }

                const renderDiff = (current, prev, isVolume = false) => {
                  if (!hasPrev) return null;
                  const diff = current - prev;
                  if (diff === 0) return <span className="text-[9px] text-muted">=</span>;
                  const sign = diff > 0 ? '+' : '';
                  const color = diff > 0 ? 'text-green-400' : 'text-red-400';
                  const displayValue = isVolume ? diff.toLocaleString() : diff;
                  return <span className={`text-[9px] ${color} font-bold`}>({sign}{displayValue})</span>;
                };

                return (
                  <div className="grid grid-cols-4 gap-2 mb-3 bg-black/20 p-2 rounded-lg border border-white/5">
                    <div className="text-center flex flex-col justify-center">
                      <span className="text-[10px] text-muted uppercase font-black tracking-widest block mb-1">Sets</span>
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className="text-sm font-bold text-purple-400 leading-none">{currentSets}</span>
                        {renderDiff(currentSets, prevSets)}
                      </div>
                    </div>
                    <div className="text-center flex flex-col justify-center">
                      <span className="text-[10px] text-muted uppercase font-black tracking-widest block mb-1">Reps</span>
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className="text-sm font-bold text-blue-400 leading-none">{currentReps}</span>
                        {renderDiff(currentReps, prevReps)}
                      </div>
                    </div>
                    <div className="text-center flex flex-col justify-center">
                      <span className="text-[10px] text-muted uppercase font-black tracking-widest block mb-1">Max</span>
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className="text-sm font-bold text-yellow-500 leading-none">{currentMax}<span className="text-[9px] ml-0.5">kg</span></span>
                        {renderDiff(currentMax, prevMax)}
                      </div>
                    </div>
                    <div className="text-center flex flex-col justify-center">
                      <span className="text-[10px] text-muted uppercase font-black tracking-widest block mb-1">Vol</span>
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className="text-sm font-bold text-accent leading-none">{currentVol.toLocaleString()}<span className="text-[9px] ml-0.5">kg</span></span>
                        {renderDiff(currentVol, prevVol, true)}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="bg-black/20 rounded-xl overflow-hidden border border-white/5">
                <div className="grid grid-cols-4 gap-2 p-2 bg-white/5 text-[10px] uppercase font-bold text-muted text-center tracking-widest">
                  <div>SET</div>
                  <div>REPS</div>
                  <div>WEIGHT</div>
                  <div>RIR</div>
                </div>
                <div className="flex flex-col">
                  {we.sets.map((set, sIdx) => (
                    <div key={sIdx} className="grid grid-cols-4 gap-2 px-2 py-2.5 text-sm text-center border-t border-white/5 items-center">
                      <div className="text-muted font-bold text-xs">{sIdx + 1}</div>
                      <div className="font-bold text-white">{set.reps || '-'}</div>
                      <div className="font-bold text-white">{set.weight || '-'}</div>
                      <div className="text-muted bg-white/5 rounded py-0.5">{set.rir || '-'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Large bottom button removed to prevent overlap */}

        {historyExerciseId && (
          <ExerciseHistory 
            exerciseId={historyExerciseId} 
            onClose={() => setHistoryExerciseId(null)} 
          />
        )}
      </div>
    </div>,
    document.body
  );
}

export default WorkoutDetail;
