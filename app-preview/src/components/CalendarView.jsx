import React, { useState, useMemo } from 'react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Activity, Edit3, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import WorkoutDetail from './WorkoutDetail';

function CalendarView() {
  const navigate = useNavigate();
  const { history, editWorkout } = useWorkoutStore();
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedWorkoutForDetail, setSelectedWorkoutForDetail] = useState(null);
  
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const [selectedDate, setSelectedDate] = useState(new Date());

  const workoutsOnSelectedDate = history.filter(workout => 
    isSameDay(new Date(workout.date), selectedDate)
  );

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

  // Group history for the list view
  const groupedHistory = useMemo(() => {
    const groups = {};
    [...history]
      .sort((a, b) => new Date(b.date) - new Date(a.date)) // Newest first
      .forEach(workout => {
        const dateKey = format(new Date(workout.date), 'yyyy-MM-dd');
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(workout);
      });
    return Object.entries(groups);
  }, [history]);

  return (
    <div className="flex flex-col gap-4 animate-fade-in" style={{ paddingBottom: '80px' }}>
      <div className="glass-header flex flex-col items-start text-left gap-4 w-full" style={{ position: 'relative', background: 'transparent', padding: '16px 0', border: 'none' }}>
        <div className="w-full">
          <div className="flex items-center gap-2">
            <History size={24} className="text-accent" />
            <h1 className="title font-bold text-xl uppercase tracking-widest">History</h1>
          </div>
          <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em] mt-1 opacity-60">Review your past workouts</p>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-lg border border-white/5 w-full mt-2">
           <button 
             onClick={() => setViewMode('calendar')}
             className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-black uppercase tracking-wider transition-all border-none outline-none ${viewMode === 'calendar' ? 'bg-accent text-black' : 'bg-transparent text-muted hover:text-white'}`}
             style={{ WebkitAppearance: 'none' }}
           >
             <CalendarIcon size={16} /> Calendar
           </button>
           <button 
             onClick={() => setViewMode('list')}
             className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-black uppercase tracking-wider transition-all border-none outline-none ${viewMode === 'list' ? 'bg-accent text-black' : 'bg-transparent text-muted hover:text-white'}`}
             style={{ WebkitAppearance: 'none' }}
           >
             <Activity size={16} /> List
           </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <>
          <div className="glass-panel p-4 mb-4" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <button onClick={prevMonth} className="btn-icon bg-white/5 hover:bg-white/10 p-2 border-none">
                <ChevronLeft size={20} />
              </button>
              <h2 className="font-bold text-accent" style={{ fontSize: '1.1rem' }}>
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              <button onClick={nextMonth} className="btn-icon bg-white/5 hover:bg-white/10 p-2 border-none">
                <ChevronRight size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', marginBottom: '8px' }}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-muted text-xs font-semibold">{day}</div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
              {Array.from({ length: startOfMonth(currentDate).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              
              {daysInMonth.map((day, i) => {
                const hasWorkout = history.some(w => isSameDay(new Date(w.date), day));
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentDate);
                
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(day)}
                    disabled={!isCurrentMonth}
                    style={{
                      aspectRatio: '1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      border: isSelected ? '1px solid var(--accent-color)' : '1px solid transparent',
                      background: isSelected ? 'var(--accent-color)' : (hasWorkout ? 'rgba(0, 229, 255, 0.1)' : 'transparent'),
                      color: isSelected ? '#000' : (hasWorkout ? 'var(--accent-color)' : 'var(--text-main)'),
                      fontWeight: (isSelected || hasWorkout) ? 'bold' : 'normal',
                      fontSize: '0.9rem',
                      opacity: isCurrentMonth ? 1 : 0.3,
                      cursor: isCurrentMonth ? 'pointer' : 'default',
                      transition: 'all 0.2s',
                      borderRadius: '50%'
                    }}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 className="font-semibold text-muted text-sm border-b border-white/10 pb-2">
              {isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMMM do, yyyy')}
            </h3>

            {workoutsOnSelectedDate.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                 <CalendarIcon size={32} style={{ color: 'var(--text-muted)', opacity: 0.5, marginBottom: '12px' }} />
                 <p className="text-muted text-sm">No workouts logged on this date.</p>
              </div>
            ) : (
              workoutsOnSelectedDate.map(workout => (
                <WorkoutCard 
                  key={workout.id} 
                  workout={workout} 
                  onView={() => setSelectedWorkoutForDetail(workout)}
                  onEdit={() => {
                    editWorkout(workout.id);
                    navigate('/workout');
                  }}
                  getWorkoutName={getWorkoutName}
                />
              ))
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-8">
          {groupedHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white/5 rounded-2xl border border-white/5 mt-10">
               <Activity size={48} className="text-muted opacity-20 mb-4" />
               <p className="text-muted font-bold text-sm">No history yet. Start your first session!</p>
            </div>
          ) : (
            groupedHistory.map(([dateKey, sessions]) => (
              <div key={dateKey} className="flex flex-col gap-4">
                <h3 className="text-sm font-black text-accent uppercase tracking-widest sticky top-0 py-2 bg-bg-main/80 backdrop-blur-md z-10">
                  {format(new Date(dateKey), 'MMMM do, yyyy')}
                </h3>
                <div className="flex flex-col gap-3">
                  {sessions.map(workout => (
                    <WorkoutCard 
                      key={workout.id} 
                      workout={workout} 
                      onView={() => setSelectedWorkoutForDetail(workout)}
                      onEdit={() => {
                        editWorkout(workout.id);
                        navigate('/workout');
                      }}
                      getWorkoutName={getWorkoutName}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
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

// Internal reusable WorkoutCard component
function WorkoutCard({ workout, onView, onEdit, getWorkoutName }) {
  return (
    <div 
      className="glass-panel p-4 cursor-pointer hover:bg-white/5 transition-all" 
      style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
      onClick={onView}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ background: 'var(--accent-gradient)', padding: '6px', borderRadius: '8px' }}>
            <Activity size={16} color="#000" />
          </div>
          <h4 className="font-bold">{getWorkoutName(workout)}</h4>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="btn-icon p-2 bg-white/5 hover:bg-white/10"
            title="Edit Session"
          >
            <Edit3 size={16} className="text-accent" />
          </button>
          <div className="badge badge-primary">Completed</div>
        </div>
      </div>
      <p className="text-xs text-muted">
        {format(new Date(workout.date), 'h:mm a')} - {format(new Date(workout.endTime || Date.now()), 'h:mm a')}
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
        {workout.workoutExercises.map(we => {
          const completedSets = we.sets.filter(s => s.completed).length;
          return (
            <div key={we.workoutExerciseId} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <span className="text-sm font-semibold">{we.exercise.name}</span>
              <span className="text-xs text-muted" style={{ fontWeight: 600 }}>{completedSets} sets</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CalendarView;
