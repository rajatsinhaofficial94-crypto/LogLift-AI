import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { Search, X, Plus } from 'lucide-react';

function ExerciseSelector({ onClose }) {
  const { exercises, addExerciseToWorkout } = useWorkoutStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const bodyParts = useMemo(() => {
    const parts = new Set();
    exercises.forEach(ex => {
      if (ex.bodyPart) {
        ex.bodyPart.split(',').forEach(p => parts.add(p.trim()));
      }
    });
    return ['All', ...Array.from(parts).filter(Boolean).sort()];
  }, [exercises]);

  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
      const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'All' || (ex.bodyPart && ex.bodyPart.includes(filter));
      return matchSearch && matchFilter;
    });
  }, [exercises, search, filter]);

  const handleAdd = (id) => {
    addExerciseToWorkout(id);
    onClose();
  };

  return createPortal(
    <div className="modal-overlay animate-fade-in">
      <div className="action-sheet" style={{ height: '85vh', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="flex justify-between items-center mb-2">
          <h2 className="title text-lg font-bold">Select Exercise</h2>
          <button onClick={onClose} className="btn-icon bg-white/5">
            <X size={20} />
          </button>
        </div>

        <div className="flex bg-black/30 p-3 rounded-lg border border-white/5 items-center gap-2">
          <Search size={18} className="text-muted" />
          <input
            type="text"
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none text-white p-0 flex-1 outline-none text-sm w-full"
            style={{ padding: 0, border: 'none' }}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none" style={{ whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch' }}>
          {bodyParts.map(bp => (
            <button
              key={bp}
              onClick={() => setFilter(bp)}
              className={`badge ${filter === bp ? 'badge-primary' : ''} px-3 py-1.5 cursor-pointer whitespace-nowrap border-none font-medium`}
              style={{ fontSize: '0.8rem' }}
            >
              {bp}
            </button>
          ))}
        </div>

        <div className="flex-col gap-2 overflow-y-auto" style={{ flex: 1, paddingRight: '4px' }}>
          {filteredExercises.map(ex => (
            <div key={ex.id} className="list-item bg-white/5 backdrop-blur-md rounded-lg p-3 border border-white/5 flex justify-between items-center cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleAdd(ex.id)}>
              <div>
                <h4 className="font-semibold text-sm">{ex.name}</h4>
                <p className="text-xs text-muted mt-0.5">{ex.bodyPart || 'Uncategorized'}</p>
              </div>
              <Plus size={20} className="text-accent" />
            </div>
          ))}
          {filteredExercises.length === 0 && (
            <div className="text-center text-muted p-6 text-sm">
              No exercises found matching "{search}"
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ExerciseSelector;
