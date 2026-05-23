import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, Bot, Play } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useWorkoutStore } from '../store/useWorkoutStore';

const WORKOUT_PLAN_REGEX = /```workout-plan\n([\s\S]*?)\n```/g;

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const linkifyExercises = (text, exercises) => {
  if (!text || !exercises?.length) return text;
  // Build variants: full name + stripped trailing parenthetical
  // e.g. "Barbell Military Press (Overhead press)" also matches as "Barbell Military Press"
  const variants = [];
  exercises.forEach(ex => {
    variants.push(ex.name);
    const stripped = ex.name.replace(/\s*\([^)]*\)\s*$/, '').trim();
    if (stripped !== ex.name && stripped.length > 3) variants.push(stripped);
  });
  const unique = [...new Set(variants)];
  const lowerText = text.toLowerCase();
  const present = unique
    .filter(name => lowerText.includes(name.toLowerCase()))
    .sort((a, b) => b.length - a.length);
  if (!present.length) return text;
  const pattern = present.map(name => escapeRegex(name)).join('|');
  const regex = new RegExp(`(?<![a-zA-Z0-9])(${pattern})(?![a-zA-Z0-9])`, 'gi');
  return text.replace(regex, (match) => {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(match + ' tutorial')}`;
    return `[${match}](${url})`;
  });
};
const CHAT_STORAGE_KEY = 'loglift-chat-history';
const CHAT_MAX_MESSAGES = 100;
const DEFAULT_MESSAGES = [
  { role: 'model', text: "Hi! I'm your AI workout assistant. Ask me to plan a workout, suggest exercise substitutions, or review your progress." }
];

const HINT_FLOWS = [
  {
    label: "Create my training plan",
    steps: [
      { question: "What's your goal?", options: ["Build muscle", "Lose fat", "Improve fitness"] },
      { question: "Equipment available?", options: ["Full gym", "Dumbbells only", "Bodyweight"] },
      { question: "Days per week?", options: ["3 days", "4 days", "5 days"] },
    ],
    buildPrompt: (a) => `Create a training plan for me. Goal: ${a[0]}. Equipment: ${a[1]}. Availability: ${a[2]} per week.`,
  },
  {
    label: "Get exercise advice",
    steps: [
      { question: "Which muscle group?", options: ["Chest & Back", "Legs & Glutes", "Shoulders & Arms", "Full Body"] },
      { question: "Any equipment limits?", options: ["Full gym", "Dumbbells only", "Bodyweight"] },
    ],
    buildPrompt: (a) => `Recommend the best exercises for ${a[0]} with ${a[1].toLowerCase()} available.`,
  },
  {
    label: "Review my progress",
    steps: [
      { question: "What to focus on?", options: ["Volume & tonnage", "Strength gains", "Consistency"] },
    ],
    buildPrompt: (a) => `Review my workout progress and give me feedback, focusing on ${a[0].toLowerCase()}.`,
  },
];

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFlow, setActiveFlow] = useState(null); // { flowIndex, step, answers }
  const [selectedModel, setSelectedModel] = useState('anthropic');
  const [messages, setMessages] = useState(() => {
    try {
      const stored = localStorage.getItem(CHAT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_MESSAGES;
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  const exercises = useWorkoutStore(state => state.exercises) || [];
  const history = useWorkoutStore(state => state.history) || [];
  const startWorkout = useWorkoutStore(state => state.startWorkout);
  const addExerciseWithPrescription = useWorkoutStore(state => state.addExerciseWithPrescription);
  const updateWorkoutName = useWorkoutStore(state => state.updateWorkoutName);

  const toggleChat = () => setIsOpen(!isOpen);

  const handleChipClick = (flowIndex) => {
    setActiveFlow({ flowIndex, step: 0, answers: [] });
  };

  const handleFlowOption = (option) => {
    const flow = HINT_FLOWS[activeFlow.flowIndex];
    const answers = [...activeFlow.answers, option];
    if (answers.length < flow.steps.length) {
      setActiveFlow({ ...activeFlow, step: activeFlow.step + 1, answers });
    } else {
      setInput(flow.buildPrompt(answers));
      setActiveFlow(null);
      setIsOpen(true);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-CHAT_MAX_MESSAGES)));
    } catch {}
  }, [messages]);

  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener('open-chatbot', handler);
    return () => window.removeEventListener('open-chatbot', handler);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const getRelevantBodyParts = (conversationText) => {
    const t = conversationText.toLowerCase();
    const map = [
      { keywords: ['bicep', 'curl', 'arm', 'arms'],            parts: ['Biceps', 'Triceps', 'Forearm'] },
      { keywords: ['tricep', 'pushdown', 'extension', 'dip'],  parts: ['Triceps', 'Biceps', 'Forearm'] },
      { keywords: ['leg', 'legs', 'quad', 'hamstring', 'squat', 'lunge', 'glute'], parts: ['Leg', 'Hip', 'Calf'] },
      { keywords: ['chest', 'bench', 'push', 'pec'],           parts: ['Chest', 'Triceps', 'Shoulders'] },
      { keywords: ['back', 'row', 'pull', 'lat', 'deadlift'],  parts: ['Back / Wing', 'Erector Spinae', 'Trapezius', 'Biceps'] },
      { keywords: ['shoulder', 'delt', 'press', 'overhead'],   parts: ['Shoulders', 'Trapezius'] },
      { keywords: ['abs', 'core', 'plank', 'crunch'],          parts: ['Abs'] },
      { keywords: ['calf', 'calves'],                          parts: ['Calf', 'Leg'] },
      { keywords: ['full body', 'whole body', 'compound'],     parts: null }, // null = send all
    ];
    const matched = new Set();
    for (const { keywords, parts } of map) {
      if (keywords.some(k => t.includes(k))) {
        if (parts === null) return null; // full body = send all
        parts.forEach(p => matched.add(p));
      }
    }
    return matched.size > 0 ? matched : null;
  };

  const buildSystemContext = (userMessage = '') => {
    const recentText = messages.slice(-6).map(m => m.text).join(' ') + ' ' + userMessage;
    const relevantParts = getRelevantBodyParts(recentText);

    // Find exercises whose name matches a specific type mentioned in the message
    const words = recentText.toLowerCase().split(/\s+/);
    const nameMatched = new Set(
      exercises
        .filter(ex => words.some(w => w.length > 3 && ex.name.toLowerCase().includes(w)))
        .map(ex => ex.name)
    );

    const exerciseByPart = {};
    exercises.forEach(ex => {
      const parts = (ex.bodyPart || 'Other').split(',').map(p => p.trim());
      parts.forEach(part => {
        if (!exerciseByPart[part]) exerciseByPart[part] = [];
        exerciseByPart[part].push(ex.name);
      });
    });

    const exerciseList = Object.entries(exerciseByPart)
      .filter(([part]) => !relevantParts || relevantParts.has(part))
      .map(([part, names]) => {
        const limit = relevantParts ? 30 : 8;
        // Always include name-matched exercises even if beyond the cap
        const prioritised = [
          ...names.filter(n => nameMatched.has(n)),
          ...names.filter(n => !nameMatched.has(n)).slice(0, limit),
        ];
        return `${part}: ${prioritised.join(', ')}`;
      })
      .join('\n');

    const recentHistory = history.slice(-5).reverse().map(w => {
      const date = new Date(w.date).toLocaleDateString();
      const name = w.name || 'Workout';
      const exerciseLines = (w.workoutExercises || []).map(ex => {
        const completedSets = (ex.sets || []).filter(s => s.completed);
        if (!completedSets.length) return null;
        const setStr = completedSets.map(s =>
          `${s.reps || '?'}reps@${s.weight || '?'}kg${s.rir !== '' && s.rir != null ? ` RIR:${s.rir}` : ''}`
        ).join(', ');
        return `    ${ex.exercise?.name}: ${setStr}`;
      }).filter(Boolean).join('\n');
      return `  ${date} — ${name}:\n${exerciseLines || '    (no sets logged)'}`;
    }).join('\n');

    return `
You are a personal fitness coach embedded in LogLift, a workout tracking app. You have exactly three jobs:

1. **Workout planning** — Build workout plans tailored to the user's available equipment, time, and goals.
2. **Exercise substitution** — When asked, suggest alternatives that train the same muscle group.
3. **Progress analysis** — Analyse the user's logged history: frequency, consistency, volume, and what to prioritise next.

**Critical constraint:** You can only plan ONE workout session at a time. The app lets the user start and log a single session. If asked for a multi-week or multi-day program, briefly explain the split structure (e.g. "Here's a 4-day PPL split — let's start with Day 1: Push"), then plan only today's session and offer to plan the next day when they're ready.

## Knowledge sources
You have two sources of truth — use both together:
- **Expert knowledge context** (injected above when relevant): This is your primary guide. Use it to decide *which* exercises to prioritise (e.g. compound before isolation, evidence-based selections), *how* to structure sets/reps/tempo/rest, and *why* certain approaches work. Apply the principles naturally — never mention book titles, author names, or cite any source by name.
- **Exercise database** (below): Every exercise you recommend MUST appear in this list by exact name. Use the principles above to choose the best options from it — never invent a name not on this list. **If the expert knowledge context uses a different name for an exercise, find the closest match in the exercise database and use that exact name instead.**

## Exercise database (by body part)
${exerciseList}

## User's workout history (last 10 sessions, newest first)
Total sessions logged: ${history.length}
${recentHistory || 'No workouts logged yet.'}

## When outputting a full workout plan
The app renders exercises automatically as a clean table — your text must NOT contain any exercise names, sets, reps, tempo, or rest values. Violating this creates a cluttered duplicate.

Your text body must contain ONLY:
1. One sentence intro (e.g. "Here's your push day — chest, shoulders, triceps.")
2. Warm-up: a single line (e.g. "Warm up with 5 min light cardio and arm circles.")
3. Cool-down: a single line (e.g. "Cool down with a chest stretch and forward fold.")
4. One sentence of key coaching advice (e.g. "Rest 2 min between sets and focus on the eccentric.")

Then append EXACTLY this block — nothing after it:

\`\`\`workout-plan
[{"name":"Exercise Name 1","sets":3,"reps":10},{"name":"Exercise Name 2","sets":3,"reps":12}]
\`\`\`

List only the main working exercises in the JSON (exclude warm-up and cool-down). Use exact names from the exercise database. Include the sets and reps you prescribed. Only add this block for full workout plans — not for substitution suggestions or general advice.
    `;
  };

  const handleStartWorkout = (plan) => {
    startWorkout();
    updateWorkoutName('AI Workout');
    plan.forEach(({ name, sets, reps }) => {
      const match = exercises.find(
        e => e.name.toLowerCase() === name.toLowerCase()
      );
      if (match) addExerciseWithPrescription(match.id, sets, reps);
    });
    setIsOpen(false);
    navigate('/workout');
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const contextStr = buildSystemContext(userMessage);

      // Last 6 messages only (3 turns), skip initial greeting
      const conversationHistory = messages.slice(1).slice(-6).map(m => ({
        role: m.role === 'model' ? 'assistant' : 'user',
        content: m.text
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, context: contextStr, history: conversationHistory, selectedModel })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const raw = errorData.error || '';
        if (raw.includes('overloaded')) throw new Error('overloaded');
        if (raw.includes('429') || raw.includes('rate_limit')) throw new Error('rate_limit');
        throw new Error('api_error');
      }

      const data = await response.json();
      console.log('[RAG] Pinecone status:', data.pineconeStatus);

      const rawReply = data.reply;
      // Extract the last workout-plan block (in case AI outputs multiple)
      const PLAN_EXTRACT = /```workout-plan\n([\s\S]*?)\n```/g;
      let workoutPlan = null;
      let match;
      while ((match = PLAN_EXTRACT.exec(rawReply)) !== null) {
        try { workoutPlan = JSON.parse(match[1]); } catch (e) {}
      }
      const displayText = rawReply.replace(WORKOUT_PLAN_REGEX, '').trim();

      setMessages(prev => [...prev, { role: 'model', text: displayText, workoutPlan }]);
    } catch (error) {
      console.error(error);
      let friendlyError, nudge;
      if (error.message === 'overloaded' && selectedModel === 'anthropic') {
        friendlyError = "Claude servers are busy right now. You can switch to Llama (Groq) for instant responses.";
        nudge = 'switch-to-groq';
      } else if (error.message === 'overloaded' && selectedModel === 'groq') {
        friendlyError = "Llama servers are busy right now. Try switching back to Claude.";
        nudge = 'switch-to-anthropic';
      } else {
        friendlyError = {
          rate_limit: "Too many requests at once. Give it a moment and try again.",
          api_error:  "Something went wrong on our end. Please try again.",
        }[error.message] || "Couldn't reach the AI. Check your connection and try again.";
      }
      setMessages(prev => [...prev, { role: 'model', text: friendlyError, nudge }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isHome && !isOpen && (
        <div className="chatbot-hints">
          {activeFlow ? (
            <div className="chatbot-flow">
              <div className="chatbot-flow-header">
                <button className="chatbot-flow-back" onClick={() => setActiveFlow(null)}>← Back</button>
                <span className="chatbot-flow-step">{activeFlow.step + 1}/{HINT_FLOWS[activeFlow.flowIndex].steps.length}</span>
              </div>
              <p className="chatbot-flow-question">
                {HINT_FLOWS[activeFlow.flowIndex].steps[activeFlow.step].question}
              </p>
              <div className="chatbot-flow-options">
                {HINT_FLOWS[activeFlow.flowIndex].steps[activeFlow.step].options.map((opt, i) => (
                  <button key={i} className="chatbot-flow-option" onClick={() => handleFlowOption(opt)}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            HINT_FLOWS.map((flow, i) => (
              <button
                key={i}
                className="chatbot-hint-chip"
                style={{ animationDelay: `${i * 0.06}s` }}
                onClick={() => handleChipClick(i)}
              >
                {flow.label}
                <span className="chatbot-hint-arrow">→</span>
              </button>
            ))
          )}
        </div>
      )}

      <button
        className={`chatbot-fab ${isOpen ? 'hidden' : ''}`}
        onClick={toggleChat}
        aria-label="Open AI Assistant"
      >
        <MessageCircle size={24} />
      </button>

      <div className={`chatbot-window glass-panel ${isOpen ? 'open' : ''}`}>
        <div className="chatbot-header">
          <div className="flex items-center gap-2">
            <Bot size={20} className="text-accent" />
            <h3 className="font-semibold text-base">AI Assistant</h3>
          </div>
          <div className="model-toggle">
            <button
              className={`model-pill ${selectedModel === 'anthropic' ? 'active' : ''}`}
              onClick={() => setSelectedModel('anthropic')}
              title="Claude (Anthropic)"
            >Claude</button>
            <button
              className={`model-pill ${selectedModel === 'groq' ? 'active' : ''}`}
              onClick={() => setSelectedModel('groq')}
              title="Llama 3.3 (Groq)"
            >Llama</button>
          </div>
          <button onClick={toggleChat} className="btn-icon hover:bg-white/10" aria-label="Close Chat">
            <X size={20} />
          </button>
        </div>

        <div className="chatbot-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message-bubble-wrapper ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="flex flex-col gap-2 max-w-[85%]">
                <div className={`message-bubble whitespace-pre-wrap ${msg.role === 'user' ? 'user' : 'model'}`}>
                  {msg.role === 'model' ? (
                    <div className="prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown>{linkifyExercises(msg.text, exercises)}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>
                {msg.nudge === 'switch-to-groq' && (
                  <button className="model-nudge-btn" onClick={() => setSelectedModel('groq')}>
                    Switch to Llama →
                  </button>
                )}
                {msg.nudge === 'switch-to-anthropic' && (
                  <button className="model-nudge-btn" onClick={() => setSelectedModel('anthropic')}>
                    Try Claude again →
                  </button>
                )}
                {msg.workoutPlan && (
                  <div className="workout-plan-card">
                    <p className="workout-plan-title">Workout Plan</p>
                    <table className="workout-plan-table">
                      <thead>
                        <tr>
                          <th>Exercise</th>
                          <th>Sets</th>
                          <th>Reps</th>
                        </tr>
                      </thead>
                      <tbody>
                        {msg.workoutPlan.map((ex, i) => (
                          <tr key={i}>
                            <td>
                              <a
                                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name + ' tutorial')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: 'inherit', textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.3)' }}
                              >
                                {ex.name}
                              </a>
                            </td>
                            <td>{ex.sets}</td>
                            <td>{ex.reps}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button
                      className="start-workout-btn"
                      onClick={() => handleStartWorkout(msg.workoutPlan)}
                    >
                      <Play size={14} />
                      Start this workout
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message-bubble-wrapper justify-start">
              <div className="message-bubble model opacity-70">Thinking...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chatbot-input-area" onSubmit={handleSend}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about exercises or workouts..."
            className="chatbot-input"
          />
          <button type="submit" className="chatbot-send-btn btn-primary" disabled={!input.trim()}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </>
  );
};

export default Chatbot;
