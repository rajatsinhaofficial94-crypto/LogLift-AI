import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import exercisesData from '../data/exercises.json';

// Initialize store with persistent storage
export const useWorkoutStore = create(
  persist(
    (set, get) => ({
      exercises: exercisesData,
      history: [],
      activeWorkout: null,

      // App state
      startWorkout: () => {
        set({
          activeWorkout: {
            id: Date.now().toString(),
            name: '',
            date: new Date().toISOString(),
            workoutExercises: [],
            isFinished: false,
            isEditing: false, // New flag
          }
        });
      },

      editWorkout: (workoutId) => {
        const { history } = get();
        const workoutToEdit = history.find(w => w.id === workoutId);
        if (!workoutToEdit) return;

        set({
          activeWorkout: {
            ...JSON.parse(JSON.stringify(workoutToEdit)), // Deep copy 
            isEditing: true,
            isFinished: false,
          }
        });
      },

      deleteWorkout: (workoutId) => {
        const { history, activeWorkout } = get();
        set({
          history: history.filter(w => w.id !== workoutId),
          // If we are currently editing this workout, cancel it
          activeWorkout: activeWorkout?.id === workoutId ? null : activeWorkout
        });
      },

      finishWorkout: () => {
        const { activeWorkout, history } = get();
        if (!activeWorkout) return;
        
        const completedWorkout = {
          ...activeWorkout,
          isFinished: true,
          endTime: new Date().toISOString(),
          isEditing: undefined, // Clear edit flag
        };

        if (activeWorkout.isEditing) {
          // Replace existing
          set({
            history: history.map(w => w.id === activeWorkout.id ? completedWorkout : w),
            activeWorkout: null
          });
        } else {
          // Push new
          set({
            history: [...history, completedWorkout],
            activeWorkout: null
          });
        }
      },

      cancelWorkout: () => {
        set({ activeWorkout: null });
      },

      updateWorkoutName: (name) => {
        const { activeWorkout } = get();
        if (!activeWorkout) return;
        set({ activeWorkout: { ...activeWorkout, name } });
      },

      updateWorkoutDate: (date) => {
        const { activeWorkout } = get();
        if (!activeWorkout) return;
        set({ activeWorkout: { ...activeWorkout, date } });
      },

      addExerciseToWorkout: (exerciseId) => {
        const { activeWorkout, exercises } = get();
        if (!activeWorkout) return;
        
        const exerciseDetails = exercises.find(e => e.id === exerciseId);
        if (!exerciseDetails) return;

        const newExercise = {
          workoutExerciseId: Date.now().toString(),
          exercise: exerciseDetails,
          sets: [{ id: Date.now().toString(), reps: '', weight: '', rir: '', completed: false }]
        };

        set({
          activeWorkout: {
            ...activeWorkout,
            workoutExercises: [...activeWorkout.workoutExercises, newExercise]
          }
        });
      },

      removeExerciseFromWorkout: (workoutExerciseId) => {
        const { activeWorkout } = get();
        if (!activeWorkout) return;

        set({
          activeWorkout: {
            ...activeWorkout,
            workoutExercises: activeWorkout.workoutExercises.filter(e => e.workoutExerciseId !== workoutExerciseId)
          }
        });
      },

      updateSet: (workoutExerciseId, setId, field, value) => {
        const { activeWorkout } = get();
        if (!activeWorkout) return;

        const updatedExercises = activeWorkout.workoutExercises.map(ex => {
          if (ex.workoutExerciseId !== workoutExerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s)
          };
        });

        set({ activeWorkout: { ...activeWorkout, workoutExercises: updatedExercises } });
      },

      addSet: (workoutExerciseId) => {
        const { activeWorkout } = get();
        if (!activeWorkout) return;

        const updatedExercises = activeWorkout.workoutExercises.map(ex => {
          if (ex.workoutExerciseId !== workoutExerciseId) return ex;
          // Copy last set values if available
          const lastSet = ex.sets[ex.sets.length - 1];
          const newSet = {
            id: Date.now().toString(),
            reps: lastSet ? lastSet.reps : '',
            weight: lastSet ? lastSet.weight : '',
            rir: lastSet ? lastSet.rir : '',
            completed: false
          };
          return { ...ex, sets: [...ex.sets, newSet] };
        });

        set({ activeWorkout: { ...activeWorkout, workoutExercises: updatedExercises } });
      },

      removeSet: (workoutExerciseId, setId) => {
        const { activeWorkout } = get();
        if (!activeWorkout) return;

        const updatedExercises = activeWorkout.workoutExercises.map(ex => {
          if (ex.workoutExerciseId !== workoutExerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.filter(s => s.id !== setId)
          };
        });

        set({ activeWorkout: { ...activeWorkout, workoutExercises: updatedExercises } });
      },

      toggleSetComplete: (workoutExerciseId, setId) => {
        const { activeWorkout } = get();
        if (!activeWorkout) return;

        const updatedExercises = activeWorkout.workoutExercises.map(ex => {
          if (ex.workoutExerciseId !== workoutExerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map(s => s.id === setId ? { ...s, completed: !s.completed } : s)
          };
        });

        set({ activeWorkout: { ...activeWorkout, workoutExercises: updatedExercises } });
      },

      // Analytics helper
      getExerciseHistory: (exerciseId) => {
        const { history } = get();
        let exerciseHistory = [];

        history.forEach(workout => {
          const ex = workout.workoutExercises.find(e => e.exercise.id === exerciseId);
          if (ex) {
            exerciseHistory.push({
              date: workout.date,
              sets: ex.sets.filter(s => s.completed)
            });
          }
        });

        // Sort by newest first
        return exerciseHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
      }
    }),
    {
      name: 'workout-storage', // local storage key
    }
  )
);
