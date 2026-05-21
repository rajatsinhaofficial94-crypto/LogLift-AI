import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { Plus, X, Trash2, Check, ArrowLeft, History } from 'lucide-react';
import { format } from 'date-fns';
import ExerciseSelector from './ExerciseSelector';
import ExerciseHistory from './ExerciseHistory';
import WorkoutTimer from './WorkoutTimer';

function ActiveWorkout() {
  const navigate = useNavigate();
  const { 
    activeWorkout, 
    finishWorkout, 
    cancelWorkout, 
    addSet, 
    removeSet, 
    updateSet, 
    toggleSetComplete,
    removeExerciseFromWorkout,
    updateWorkoutName,
    updateWorkoutDate,
    deleteWorkout,
    getExerciseHistory
  } = useWorkoutStore();

  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [historyExerciseId, setHistoryExerciseId] = useState(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);

  if (!activeWorkout) return null;

  const handleFinish = () => {
    finishWorkout();
    navigate('/');
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      deleteWorkout(activeWorkout.id);
      navigate('/calendar');
    } else {
      setDeleteConfirm(true);
      setCancelConfirm(false); // Reset other
      setTimeout(() => setDeleteConfirm(false), 3000); // Reset after 3s
    }
  };

  const handleCancelClick = () => {
    if (cancelConfirm) {
      cancelWorkout();
      navigate('/');
    } else {
      setCancelConfirm(true);
      setDeleteConfirm(false); // Reset other
      setTimeout(() => setCancelConfirm(false), 3000); // Reset after 3s
    }
  };

  const getDayLabel = () => {
    if (activeWorkout.isEditing) return "Edit Session";
    let day = "Workout";
    const bodyParts = new Set();
    activeWorkout.workoutExercises.forEach(we => {
      if (we.exercise.bodyPart) {
        we.exercise.bodyPart.split(',').forEach(bp => bodyParts.add(bp.trim()));
      }
    });

    if (bodyParts.size > 0 && bodyParts.size <= 2) {
      day = Array.from(bodyParts).join(' & ');
    } else if (bodyParts.size > 2) {
      day = "Full Body";
    }
    return day;
  };

  return (
    <div className="flex-col gap-4 animate-slide-up h-full">
      <div className="glass-header flex items-center justify-between gap-4" style={{ position: 'sticky', top: 0, padding: '16px 20px', zIndex: 100 }}>
        <div className="flex items-center gap-3 overflow-hidden">
          <button onClick={() => navigate('/')} className="btn-icon shrink-0" style={{ background: 'transparent' }}>
            <ArrowLeft size={24} />
          </button>
          <div className="flex-col w-full" style={{ overflow: 'hidden' }}>
            {isEditingTitle ? (
              <input 
                autoFocus
                onBlur={() => setIsEditingTitle(false)}
                className="title font-bold text-lg bg-black/50 px-2 py-1 -ml-2 rounded w-full text-white"
                value={activeWorkout.name || ''} 
                onChange={e => updateWorkoutName(e.target.value)} 
                placeholder={getDayLabel()}
              />
            ) : (
              <h1 
                className="title font-bold text-lg cursor-pointer truncate" 
                onClick={() => setIsEditingTitle(true)}
                title="Click to rename session"
              >
                {activeWorkout.name || getDayLabel()}
              </h1>
            )}
            <input 
              type="datetime-local" 
              className="text-muted text-[11px] bg-transparent border-none p-0 outline-none w-fit font-semibold opacity-80" 
              value={format(new Date(activeWorkout.date), "yyyy-MM-dd'T'HH:mm")}
              onChange={(e) => updateWorkoutDate(new Date(e.target.value).toISOString())}
              style={{ padding: 0, marginTop: '2px', cursor: 'pointer' }}
            />
          </div>
        </div>
        <button onClick={handleFinish} className="btn badge-primary px-3 py-1.5 shrink-0 text-[10px] font-black uppercase tracking-widest">
          Finish
        </button>
      </div>

      <div className="flex-col gap-6 px-4 pb-24">
        <WorkoutTimer startDate={activeWorkout.date} />
        {activeWorkout.workoutExercises.map((we, index) => (
          <div key={we.workoutExerciseId} className="glass-panel p-4 flex-col gap-3 relative">
            
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-accent text-sm font-semibold mb-1 block">Exercise {index+1}</span>
                <h3 className="font-bold text-lg">{we.exercise.name}</h3>
                <p className="text-muted text-xs">{we.exercise.bodyPart}</p>
              </div>
              <div className="flex gap-2">
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(we.exercise.name + ' tutorial')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-icon btn-secondary p-2"
                  title="Watch on YouTube"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#ff0000" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
                <button onClick={() => setHistoryExerciseId(we.exercise.id)} className="btn-icon btn-secondary p-2" title="View History">
                  <History size={16} className="text-accent" />
                </button>
                <button onClick={() => removeExerciseFromWorkout(we.workoutExerciseId)} className="btn-icon btn-secondary p-2 group text-muted" title="Remove">
                  <X size={16} />
                </button>
              </div>
            </div>

            {(() => {
              const history = getExerciseHistory(we.exercise.id);
              const prevSession = history
                  .filter(h => new Date(h.date) < new Date(activeWorkout.date))
                  .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

              const completedSets = we.sets.filter(s => s.completed);
              if (completedSets.length === 0) return null;
              
              const totalSets = completedSets.length;
              const totalReps = completedSets.reduce((acc, s) => acc + Number(s.reps || 0), 0);
              const maxWeight = Math.max(0, ...completedSets.map(s => Number(s.weight) || 0));
              const totalVolume = completedSets.reduce((acc, s) => acc + (Number(s.reps || 0) * Number(s.weight || 0)), 0);

              let prevSets = 0, prevReps = 0, prevMax = 0, prevVol = 0;
              if (prevSession) {
                prevSets = prevSession.sets.length;
                prevReps = prevSession.sets.reduce((acc, s) => acc + Number(s.reps || 0), 0);
                prevMax = Math.max(0, ...prevSession.sets.map(s => Number(s.weight) || 0));
                prevVol = prevSession.sets.reduce((acc, s) => acc + (Number(s.reps || 0) * Number(s.weight || 0)), 0);
              }

              const getColor = (current, previous, defaultColor) => {
                if (!prevSession) return defaultColor;
                if (current > previous) return 'text-green-400';
                if (current < previous) return 'text-red-400';
                return 'text-white';
              };

              const renderToBeat = (current, previous, isVol = false) => {
                if (!prevSession) return <span className="text-[9px] text-transparent leading-none select-none">-</span>;
                
                const diff = previous - current;
                if (diff > 0) {
                  return <span className="text-[9px] text-red-400 leading-none font-bold whitespace-nowrap">({isVol ? diff.toLocaleString() : diff} left)</span>;
                } else if (diff === 0) {
                  return <span className="text-[9px] text-white leading-none font-bold tracking-wider whitespace-nowrap">=</span>;
                } else {
                  return <span className="text-[9px] text-green-400 leading-none font-bold whitespace-nowrap">+{isVol ? (-diff).toLocaleString() : -diff}</span>;
                }
              };

              return (
                <div className="grid grid-cols-4 gap-2 mb-3 bg-black/20 p-2 rounded-lg border border-white/5">
                  <div className="bg-white/5 p-2 rounded-lg text-center border border-white/5 flex flex-col justify-center">
                    <span className="text-[10px] text-muted uppercase font-black tracking-widest block mb-1">Sets</span>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className={`text-xs font-bold leading-none transition-colors duration-300 ${getColor(totalSets, prevSets, 'text-purple-400')}`}>{totalSets}</span>
                      {renderToBeat(totalSets, prevSets)}
                    </div>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg text-center border border-white/5 flex flex-col justify-center">
                    <span className="text-[10px] text-muted uppercase font-black tracking-widest block mb-1">Reps</span>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className={`text-xs font-bold leading-none transition-colors duration-300 ${getColor(totalReps, prevReps, 'text-blue-400')}`}>{totalReps}</span>
                      {renderToBeat(totalReps, prevReps)}
                    </div>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg text-center border border-white/5 flex flex-col justify-center">
                    <span className="text-[10px] text-muted uppercase font-black tracking-widest block mb-1">Max</span>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className={`text-xs font-bold leading-none transition-colors duration-300 ${getColor(maxWeight, prevMax, 'text-yellow-500')}`}>{maxWeight}<span className="text-[9px] ml-0.5 text-muted font-normal">kg</span></span>
                      {renderToBeat(maxWeight, prevMax)}
                    </div>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg text-center border border-white/5 flex flex-col justify-center">
                    <span className="text-[10px] text-muted uppercase font-black tracking-widest block mb-1">Vol</span>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className={`text-xs font-bold leading-none transition-colors duration-300 ${getColor(totalVolume, prevVol, 'text-accent')}`}>{totalVolume.toLocaleString()}<span className="text-[9px] ml-0.5 text-muted font-normal">kg</span></span>
                      {renderToBeat(totalVolume, prevVol, true)}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="set-row">
              <div className="set-header">Set</div>
              <div className="set-header">Reps</div>
              <div className="set-header">Weight</div>
              <div className="set-header">RIR</div>
              <div className="set-header">Done</div>
            </div>

            {we.sets.map((set, setIndex) => (
              <div key={set.id} className="set-row">
                <div className="flex items-center justify-center font-semibold text-muted text-sm">{setIndex + 1}</div>
                <input
                  type="number"
                  placeholder="Reps"
                  className={`set-input ${set.completed ? 'bg-opacity-50 text-muted' : ''}`}
                  value={set.reps}
                  onChange={(e) => updateSet(we.workoutExerciseId, set.id, 'reps', e.target.value)}
                  disabled={set.completed}
                />
                <input
                  type="number"
                  placeholder="kg/lbs"
                  className={`set-input ${set.completed ? 'bg-opacity-50 text-muted' : ''}`}
                  value={set.weight}
                  onChange={(e) => updateSet(we.workoutExerciseId, set.id, 'weight', e.target.value)}
                  disabled={set.completed}
                />
                <input
                  type="number"
                  placeholder="RIR"
                  className={`set-input ${set.completed ? 'bg-opacity-50 text-muted' : ''}`}
                  value={set.rir}
                  onChange={(e) => updateSet(we.workoutExerciseId, set.id, 'rir', e.target.value)}
                  disabled={set.completed}
                />
                <button
                  onClick={() => toggleSetComplete(we.workoutExerciseId, set.id)}
                  className={`btn-icon w-full p-2 flex justify-center border transition-all ${set.completed ? 'bg-accent/20 border-accent text-accent' : 'bg-transparent text-muted'} rounded-lg`}
                  style={{ background: set.completed ? 'rgba(0, 229, 255, 0.2)' : 'transparent', borderColor: set.completed ? 'var(--accent-color)' : 'var(--border-color)', color: set.completed ? 'var(--accent-color)' : 'var(--text-muted)' }}
                >
                  <Check size={18} strokeWidth={set.completed ? 3 : 2} />
                </button>
              </div>
            ))}
            
            <button 
              onClick={() => addSet(we.workoutExerciseId)}
              className="mt-2 text-accent text-sm font-semibold text-center py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
            >
              + Add Set
            </button>
          </div>
        ))}
        
        <div className="flex-col gap-3">
          <button 
            onClick={() => setIsSelectorOpen(true)} 
            className="btn btn-secondary w-full p-4 text-accent border border-accent/30 bg-accent/5 backdrop-blur-md font-bold mb-4"
            style={{ fontSize: '1.1rem', borderColor: 'rgba(0, 229, 255, 0.3)', background: 'rgba(0, 229, 255, 0.05)' }}
          >
            <Plus size={20} /> Add Exercise
          </button>
          
          {activeWorkout.isEditing && (
            <button 
              onClick={handleDelete} 
              className={`btn w-full p-4 mt-6 border font-bold transition-all ${deleteConfirm ? 'bg-red-600 border-red-700 text-white animate-pulse' : 'bg-red-500/5 border-red-500/20 text-red-500'} backdrop-blur-md`}
              style={{ fontSize: '1.1rem' }}
            >
              <Trash2 size={20} /> {deleteConfirm ? "TAP AGAIN TO DELETE FOREVER" : "Delete Workout"}
            </button>
          )}

          <button 
            onClick={handleCancelClick} 
            className={`text-sm font-semibold p-4 text-center mt-4 w-full transition-all rounded-xl ${cancelConfirm ? 'bg-red-500/10 text-red-500' : 'text-red-400'}`}
          >
            {cancelConfirm ? "TAP AGAIN TO DISCARD CHANGES" : (activeWorkout.isEditing ? "Exit Without Saving" : "Cancel Session")}
          </button>
        </div>
      </div>

      {isSelectorOpen && (
        <ExerciseSelector onClose={() => setIsSelectorOpen(false)} />
      )}
      
      {historyExerciseId && (
         <ExerciseHistory exerciseId={historyExerciseId} onClose={() => setHistoryExerciseId(null)} />
      )}
    </div>
  );
}

export default ActiveWorkout;
