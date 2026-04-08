import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { X, TrendingUp, Calendar, AlertCircle, BarChart2, List } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';

function ExerciseHistory({ exerciseId, onClose }) {
  const { exercises, getExerciseHistory } = useWorkoutStore();
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'analytics'
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Set ready state and trigger resize re-render when switching to analytics tab
  useEffect(() => {
    if (viewMode === 'analytics') {
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 400); // More time to settle

      return () => {
        setIsReady(false);
        clearTimeout(timer);
      };
    }
  }, [viewMode]);

  // Robust measurement of the container width
  useEffect(() => {
    if (!isReady || !containerRef.current) return;

    const observeTarget = containerRef.current;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });

    resizeObserver.observe(observeTarget);
    
    // Initial measurement
    const initialWidth = observeTarget.offsetWidth;
    if (initialWidth > 0) setContainerWidth(initialWidth);

    return () => resizeObserver.disconnect();
  }, [isReady]);

  const exercise = useMemo(() => exercises.find(e => e.id === exerciseId), [exercises, exerciseId]);
  const history = useMemo(() => getExerciseHistory(exerciseId), [getExerciseHistory, exerciseId]);

  const chartData = useMemo(() => {
    return [...history]
      .reverse()
      .filter(record => record.sets.length > 0)
      .map((record, index) => ({
        date: new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        displayDate: `${new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} (#${index + 1})`,
        volume: record.sets.reduce((acc, curr) => acc + (Number(curr.reps || 0) * Number(curr.weight || 0)), 0),
        maxWeight: Math.max(0, ...record.sets.map(s => Number(s.weight) || 0)),
        reps: record.sets.reduce((acc, curr) => acc + Number(curr.reps || 0), 0),
        sets: record.sets.length
      }));
  }, [history]);

  const stats = useMemo(() => {
    if (chartData.length === 0) return null;
    const latest = chartData[chartData.length - 1];
    const previous = chartData[chartData.length - 2];
    
    const calcDiff = (curr, prev) => {
      if (!prev || prev === 0) return null;
      const diff = ((curr - prev) / prev) * 100;
      return diff.toFixed(1);
    };

    return {
      volumeDiff: calcDiff(latest.volume, previous?.volume),
      weightDiff: calcDiff(latest.maxWeight, previous?.maxWeight),
      repsDiff: calcDiff(latest.reps, previous?.reps),
      latest
    };
  }, [chartData]);

  return createPortal(
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 400 }}>
      <div className="action-sheet flex flex-col h-[95vh] bg-bg-secondary">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-accent text-xs font-semibold uppercase tracking-wider mb-1 block">Exercise Analytics</span>
            <h2 className="title text-xl font-bold leading-tight truncate max-w-[250px] font-display uppercase tracking-widest">{exercise?.name}</h2>
          </div>
          <button onClick={onClose} className="btn-icon bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors ml-4 shrink-0">
            <X size={20} />
          </button>
        </div>

        {history.length > 0 && (
          <div className="flex bg-white/5 p-1 rounded-lg mb-6 border border-white/5">
            <button 
              onClick={() => setViewMode('list')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-black uppercase tracking-wider transition-all ${viewMode === 'list' ? 'bg-accent text-black' : 'text-muted'}`}
            >
              <List size={16} /> History
            </button>
            <button 
              onClick={() => setViewMode('analytics')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-black uppercase tracking-wider transition-all ${viewMode === 'analytics' ? 'bg-accent text-black' : 'text-muted'}`}
            >
              <BarChart2 size={16} /> Analytics
            </button>
          </div>
        )}

        <div className="overflow-y-auto flex-1 pb-safe pr-1 no-scrollbar" ref={containerRef}>
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-black/20 rounded-xl border border-white/5 text-center mt-8">
              <AlertCircle size={40} className="text-muted/50 mb-3" />
              <p className="text-muted text-sm font-medium">No history available yet.</p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="flex flex-col space-y-4">
              {history.map((record, index) => {
                const prevSession = history
                  .filter(h => new Date(h.date) < new Date(record.date))
                  .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

                const currentSets = record.sets.length;
                const currentReps = record.sets.reduce((acc, curr) => acc + Number(curr.reps || 0), 0);
                const currentMax = Math.max(0, ...record.sets.map(s => Number(s.weight) || 0));
                const currentVol = record.sets.reduce((acc, curr) => acc + (Number(curr.reps || 0) * Number(curr.weight || 0)), 0);

                let prevSets = 0, prevReps = 0, prevMax = 0, prevVol = 0;
                let hasPrev = !!prevSession;

                if (hasPrev) {
                  prevSets = prevSession.sets.length;
                  prevReps = prevSession.sets.reduce((acc, s) => acc + Number(s.reps || 0), 0);
                  prevMax = Math.max(0, ...prevSession.sets.map(s => Number(s.weight) || 0));
                  prevVol = prevSession.sets.reduce((acc, s) => acc + (Number(s.reps || 0) * Number(s.weight || 0)), 0);
                }

                const renderDiff = (current, prev, isVolume = false) => {
                  if (!hasPrev) return <span className="text-[9px] text-transparent leading-none select-none">-</span>;
                  const diff = current - prev;
                  if (diff === 0) return <span className="text-[9px] text-muted leading-none">=</span>;
                  const sign = diff > 0 ? '+' : '';
                  const color = diff > 0 ? 'text-green-400' : 'text-red-400';
                  const displayValue = isVolume ? diff.toLocaleString() : diff;
                  return <span className={`text-[9px] ${color} font-bold leading-none`}>({sign}{displayValue})</span>;
                };

                return (
                  <div key={index} className="bg-white/5 rounded-xl border border-white/10 p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2 text-sm font-bold">
                        <Calendar size={14} className="text-accent" />
                        {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>

                    {record.sets.length === 0 ? (
                      <p className="text-[10px] text-red-500/70 font-semibold italic p-2 text-center bg-red-500/5 rounded border border-red-500/10">No completed sets in this session.</p>
                    ) : (
                      <>
                        <div className="grid grid-cols-4 gap-2 text-center text-[10px] text-muted border-t border-white/5 pt-3 mb-1 font-black uppercase tracking-tighter">
                          <div>SET</div>
                          <div>REPS</div>
                          <div>WEIGHT</div>
                          <div>RIR</div>
                        </div>
                        {record.sets.map((s, i) => (
                          <div key={i} className="grid grid-cols-4 gap-2 text-center text-sm py-2 border-b border-white/5 last:border-0 font-medium">
                            <div className="text-muted font-bold">{i+1}</div>
                            <div className="font-bold">{s.reps || '-'}</div>
                            <div className="font-bold text-accent">{s.weight || '-'}</div>
                            <div className="text-muted">{s.rir || '-'}</div>
                          </div>
                        ))}

                        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-white/5">
                          <div className="bg-white/5 p-2 rounded-lg text-center border border-white/5 flex flex-col justify-center">
                            <span className="text-[10px] text-muted uppercase font-black tracking-widest block mb-1">Sets</span>
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-xs font-bold text-purple-400 leading-none">{currentSets}</span>
                              {renderDiff(currentSets, prevSets)}
                            </div>
                          </div>
                          <div className="bg-white/5 p-2 rounded-lg text-center border border-white/5 flex flex-col justify-center">
                            <span className="text-[10px] text-muted uppercase font-black tracking-widest block mb-1">Reps</span>
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-xs font-bold text-blue-400 leading-none">{currentReps}</span>
                              {renderDiff(currentReps, prevReps)}
                            </div>
                          </div>
                          <div className="bg-white/5 p-2 rounded-lg text-center border border-white/5 flex flex-col justify-center">
                            <span className="text-[10px] text-muted uppercase font-black tracking-widest block mb-1">Max</span>
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-xs font-bold text-yellow-500 leading-none">{currentMax}<span className="text-[9px] ml-0.5 text-muted">kg</span></span>
                              {renderDiff(currentMax, prevMax)}
                            </div>
                          </div>
                          <div className="bg-white/5 p-2 rounded-lg text-center border border-white/5 flex flex-col justify-center">
                            <span className="text-[10px] text-muted uppercase font-black tracking-widest block mb-1">Vol</span>
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-xs font-bold text-accent leading-none">{currentVol.toLocaleString()}<span className="text-[9px] ml-0.5 text-muted">kg</span></span>
                              {renderDiff(currentVol, prevVol, true)}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : !isReady || chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-black/20 rounded-xl border border-white/5 text-center mt-8">
              <TrendingUp size={40} className="text-accent/30 mb-3" />
              <p className="text-muted text-sm font-medium">No completed sets to chart.</p>
              <p className="text-muted/50 text-xs mt-1">Make sure you mark sets as <span className="text-accent">completed</span> in your workout!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6 animate-fade-in no-scrollbar pb-10">
              {/* Volume Progress Graph */}
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <h3 className="text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <TrendingUp size={14} /> 1. WORKLOAD PROGRESS (VOL)
                </h3>
                  <div className="h-[180px] w-full" style={{ minHeight: '180px' }}>
                    {containerWidth > 0 && (
                      <ResponsiveContainer width={Math.max(0, containerWidth - 40)} height={180} key={`vol-${viewMode}-${isReady}-${chartData.length}`}>
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="displayDate" fontSize={9} tickLine={false} axisLine={false} tick={{fill: '#8e95a5'}} dy={10} />
                          <YAxis hide domain={['auto', 'auto']} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#161921', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                            itemStyle={{ color: 'var(--accent-color)', fontWeight: 'bold' }}
                          />
                          <Area type="monotone" dataKey="volume" stroke="var(--accent-color)" fillOpacity={1} fill="url(#colorVol)" strokeWidth={3} isAnimationActive={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
              </div>

              {/* Weight Progress Graph */}
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <h3 className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <TrendingUp size={14} /> 2. STRENGTH PROGRESS (WEIGHT)
                </h3>
                  <div className="h-[180px] w-full" style={{ minHeight: '180px' }}>
                    {containerWidth > 0 && (
                      <ResponsiveContainer width={Math.max(0, containerWidth - 40)} height={180} key={`weight-${viewMode}-${isReady}-${chartData.length}`}>
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="displayDate" fontSize={9} tickLine={false} axisLine={false} tick={{fill: '#8e95a5'}} dy={10} />
                          <YAxis hide domain={['auto', 'auto']} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#161921', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                            itemStyle={{ color: '#eab308', fontWeight: 'bold' }}
                          />
                          <Line type="stepAfter" dataKey="maxWeight" stroke="#eab308" strokeWidth={3} dot={{ r: 4, fill: '#eab308' }} isAnimationActive={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
              </div>

              {/* Reps Progress Graph */}
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <TrendingUp size={14} /> 3. ENDURANCE PROGRESS (REPS)
                </h3>
                  <div className="h-[180px] w-full" style={{ minHeight: '180px' }}>
                    {containerWidth > 0 && (
                      <ResponsiveContainer width={Math.max(0, containerWidth - 40)} height={180} key={`reps-${viewMode}-${isReady}-${chartData.length}`}>
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="displayDate" fontSize={9} tickLine={false} axisLine={false} tick={{fill: '#8e95a5'}} dy={10} />
                          <YAxis hide domain={['auto', 'auto']} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#161921', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                            itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }}
                          />
                          <Line type="monotone" dataKey="reps" stroke="#60a5fa" strokeWidth={3} isAnimationActive={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
              </div>

              {/* Sets Progress Graph */}
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-8">
                <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <TrendingUp size={14} /> 4. DENSITY PROGRESS (SETS)
                </h3>
                  <div className="h-[180px] w-full" style={{ minHeight: '180px' }}>
                    {containerWidth > 0 && (
                      <ResponsiveContainer width={Math.max(0, containerWidth - 40)} height={180} key={`sets-${viewMode}-${isReady}-${chartData.length}`}>
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="displayDate" fontSize={9} tickLine={false} axisLine={false} tick={{fill: '#8e95a5'}} dy={10} />
                          <YAxis hide domain={['auto', 'auto']} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#161921', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                            itemStyle={{ color: '#a78bfa', fontWeight: 'bold' }}
                          />
                          <Line type="monotone" dataKey="sets" stroke="#a78bfa" strokeWidth={3} isAnimationActive={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ExerciseHistory;
