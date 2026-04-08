import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, RotateCcw } from 'lucide-react';

const AnalogClock = ({ elapsed }) => {
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  const minuteAngle = (minutes + seconds / 60) * 6;
  const secondAngle = seconds * 6;

  return (
    <svg width="32" height="32" viewBox="0 0 24 24" className="text-muted opacity-80 shrink-0 select-none">
      <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="12" y1="12" x2="12" y2="6.5" stroke="white" strokeWidth="2" strokeLinecap="round" transform={`rotate(${minuteAngle} 12 12)`} />
      <line x1="12" y1="12" x2="12" y2="3.5" stroke="var(--accent-color)" strokeWidth="1.5" strokeLinecap="round" transform={`rotate(${secondAngle} 12 12)`} />
      <circle cx="12" cy="12" r="1.5" fill="white" />
    </svg>
  );
};

const WorkoutTimer = ({ startDate }) => {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    // Initial state is 0, no auto-syncing with workout date anymore
    setElapsed(0);
  }, [startDate]);

  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ];

    if (hours > 0) {
      parts.unshift(hours.toString().padStart(2, '0'));
    }

    return parts.join(':');
  };

  const handleReset = () => {
    setElapsed(0);
    setIsRunning(false);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-2 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <AnalogClock elapsed={elapsed} />
        <div className="w-px h-5 bg-white/10 mx-1"></div>
        <Timer size={18} className={`${isRunning ? 'text-accent animate-pulse' : 'text-muted'}`} />
        <span className={`text-xl font-bold font-mono tracking-wider tabular-nums leading-none ${isRunning ? 'text-white' : 'text-muted'}`}>
          {formatTime(elapsed)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={() => setIsRunning(!isRunning)}
          className={`p-2 rounded-lg transition-all ${isRunning ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-accent text-black font-bold'}`}
        >
          {isRunning ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button 
          onClick={handleReset}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted hover:text-white transition-colors"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
};

export default WorkoutTimer;
