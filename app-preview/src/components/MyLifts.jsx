import React, { useState, useMemo } from 'react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { Search, Dumbbell, Activity, Calendar } from 'lucide-react';
import ExerciseHistory from './ExerciseHistory';

function MyLifts() {
  const { history } = useWorkoutStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);

  // Extract unique logged exercises and compute stats
  const loggedExercises = useMemo(() => {
    const exerciseStats = new Map();

    history.forEach(workout => {
      workout.workoutExercises.forEach(we => {
        const completedSets = we.sets.filter(s => s.completed);
        if (completedSets.length === 0) return;

        const exId = we.exercise.id;
        if (!exerciseStats.has(exId)) {
          exerciseStats.set(exId, {
            ...we.exercise, // id, name, bodyPart
            totalSessions: 0,
            maxWeight: 0,
            totalVolume: 0,
            lastWorkoutDate: new Date(workout.date)
          });
        }

        const stats = exerciseStats.get(exId);
        
        // Update stats
        stats.totalSessions += 1; // Assuming 1 session count = 1 appearance in a workout
        
        const currentMax = Math.max(0, ...completedSets.map(s => Number(s.weight) || 0));
        if (currentMax > stats.maxWeight) {
          stats.maxWeight = currentMax;
        }

        const currentVol = completedSets.reduce((acc, s) => acc + (Number(s.reps || 0) * Number(s.weight || 0)), 0);
        stats.totalVolume += currentVol;

        // Keep most recent date
        const workoutDate = new Date(workout.date);
        if (workoutDate > stats.lastWorkoutDate) {
          stats.lastWorkoutDate = workoutDate;
        }
      });
    });

    // Convert map to array and sort alphabetically
    return Array.from(exerciseStats.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [history]);

  // Filter based on search term
  const filteredExercises = useMemo(() => {
    if (!searchTerm) return loggedExercises;
    return loggedExercises.filter(ex => 
      ex.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      ex.bodyPart?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [loggedExercises, searchTerm]);

  return (
    <div className="flex-col gap-4 animate-fade-in h-full flex pt-4 px-4 pb-24 overflow-hidden">
      <div className="flex-col gap-1 mb-2">
        <h1 className="title text-2xl font-bold title-gradient">My Lifts</h1>
        <p className="text-muted text-sm">Your exercise archive & all-time records.</p>
      </div>

      <div className="relative mb-2 shrink-0">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input 
          type="text" 
          placeholder="Search for an exercise..." 
          className="search-input bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 w-full text-sm outline-none focus:border-accent/50 transition-colors text-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex-col gap-3 overflow-y-auto no-scrollbar pb-6" style={{ flex: 1 }}>
        {filteredExercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-black/20 rounded-xl border border-white/5 text-center mt-4">
            <Dumbbell size={40} className="text-muted/50 mb-3" />
            <p className="text-muted text-sm font-medium">No lifts found.</p>
            {searchTerm ? (
              <p className="text-muted/50 text-xs mt-1">Try a different search term.</p>
            ) : (
              <p className="text-muted/50 text-xs mt-1">Complete some workouts to see them here.</p>
            )}
          </div>
        ) : (
          filteredExercises.map((ex) => (
            <div 
              key={ex.id} 
              className="glass-panel p-4 cursor-pointer hover:bg-white/5 active:scale-[0.98] transition-all flex flex-col gap-3"
              onClick={() => setSelectedExerciseId(ex.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-base leading-tight">{ex.name}</h3>
                  <p className="text-accent text-[11px] uppercase tracking-wider font-semibold mt-0.5">{ex.bodyPart}</p>
                </div>
                <div className="bg-white/5 rounded-md px-2 py-1 flex items-center gap-1.5 border border-white/5">
                  <Calendar size={12} className="text-muted" />
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider">{ex.totalSessions} Sessions</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="bg-black/20 rounded-lg p-2.5 flex flex-col justify-center border border-white/5 text-center">
                  <span className="text-[10px] text-muted uppercase font-black tracking-widest mb-0.5">Max Weight</span>
                  <span className="text-sm font-bold text-yellow-500">{ex.maxWeight} <span className="text-[10px] ml-0.5 font-normal">kg</span></span>
                </div>
                <div className="bg-black/20 rounded-lg p-2.5 flex flex-col justify-center border border-white/5 text-center">
                  <span className="text-[10px] text-muted uppercase font-black tracking-widest mb-0.5">Total Volume</span>
                  <span className="text-sm font-bold text-accent">{ex.totalVolume.toLocaleString()} <span className="text-[10px] ml-0.5 font-normal">kg</span></span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedExerciseId && (
        <ExerciseHistory 
          exerciseId={selectedExerciseId} 
          onClose={() => setSelectedExerciseId(null)} 
        />
      )}
    </div>
  );
}

export default MyLifts;
