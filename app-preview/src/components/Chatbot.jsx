import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useWorkoutStore } from '../store/useWorkoutStore';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', text: "Hi! I'm your AI workout assistant. How can I help you train today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Phase 2: Gather context from the app state
  const exercises = useWorkoutStore(state => state.exercises) || [];
  const history = useWorkoutStore(state => state.history) || [];

  const toggleChat = () => setIsOpen(!isOpen);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const buildSystemContext = () => {
    // Build exercise list grouped by body part
    const exerciseByPart = {};
    exercises.forEach(ex => {
      const parts = (ex.bodyPart || 'Other').split(',').map(p => p.trim());
      parts.forEach(part => {
        if (!exerciseByPart[part]) exerciseByPart[part] = [];
        exerciseByPart[part].push(ex.name);
      });
    });
    const exerciseList = Object.entries(exerciseByPart)
      .map(([part, names]) => `${part}: ${names.join(', ')}`)
      .join('\n');

    // Build detailed workout history (last 10 sessions)
    const recentHistory = history.slice(-10).reverse().map(w => {
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

## Knowledge sources
You have two sources of truth — use both together:
- **Expert book context** (injected above when relevant): This is your primary guide. Use it to decide *which* exercises to prioritise (e.g. compound before isolation, evidence-based selections), *how* to structure sets/reps/tempo/rest, and *why* certain approaches work. Let the book's principles drive your recommendations.
- **Exercise database** (below): Every exercise you recommend MUST appear in this list by exact name. Use the book's principles to choose the best options from it — never invent a name not on this list.

## Exercise database (by body part)
${exerciseList}

## User's workout history (last 10 sessions, newest first)
Total sessions logged: ${history.length}
${recentHistory || 'No workouts logged yet.'}

## Formatting rules
- Use **bold** for section headers (**Warm-up**, **Biceps**, **Cool-down**, etc.).
- One line per exercise: **Exercise Name** — X sets × Y reps | Rest: Xs | Tempo: WXYZ
- No nested sub-bullets for sets/reps/weight/tempo — flat, single line per exercise.
- Muscle group name IS the section header — never write "Muscle Groups:" as a label.
- Be direct and concise. Do not add sign-offs, follow-up questions, or closing remarks.
    `;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);
    
    try {
      const contextStr = buildSystemContext();
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: contextStr
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch from API');
      }

      const data = await response.json();
      console.log('[RAG] Pinecone status:', data.pineconeStatus);
      setMessages(prev => [...prev, { role: 'model', text: data.reply }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: `Error connecting to AI: ${error.message}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button 
        className={`chatbot-fab ${isOpen ? 'hidden' : ''}`}
        onClick={toggleChat}
        aria-label="Open AI Assistant"
      >
        <MessageCircle size={24} />
      </button>

      {/* Chat Window */}
      <div className={`chatbot-window glass-panel ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="chatbot-header">
          <div className="flex items-center gap-2">
            <Bot size={20} className="text-accent" />
            <h3 className="font-semibold text-base">AI Assistant</h3>
          </div>
          <button onClick={toggleChat} className="btn-icon hover:bg-white/10" aria-label="Close Chat">
            <X size={20} />
          </button>
        </div>

        {/* Messages List */}
        <div className="chatbot-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message-bubble-wrapper ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`message-bubble whitespace-pre-wrap ${msg.role === 'user' ? 'user' : 'model'}`}>
                {msg.role === 'model' ? (
                  <div className="prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                ) : (
                  msg.text
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message-bubble-wrapper justify-start">
              <div className="message-bubble model opacity-70">
                Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
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
