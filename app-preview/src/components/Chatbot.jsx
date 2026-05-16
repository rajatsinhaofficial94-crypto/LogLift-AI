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
    const recentWorkouts = history.slice(-3).map(w => `${w.name || 'Workout'} on ${new Date(w.date).toLocaleDateString()}`).join(', ');
    
    // Build a concise exercise list grouped by body part for the AI to reference
    const exerciseByPart = {};
    exercises.forEach(ex => {
      const parts = (ex.bodyPart || 'Other').split(',').map(p => p.trim());
      parts.forEach(part => {
        if (!exerciseByPart[part]) exerciseByPart[part] = [];
        exerciseByPart[part].push(ex.name);
      });
    });
    const exerciseList = Object.entries(exerciseByPart)
      .map(([part, names]) => `${part}: ${names.slice(0, 10).join(', ')}`)
      .join('\n');

    return `
You are a personal fitness coach embedded in LogLift, a workout tracking app. You have exactly three jobs:

1. **Workout planning** — Build workout plans tailored to the user's available equipment, time, and goals.
2. **Exercise substitution** — When asked, suggest alternatives that train the same muscle group.
3. **Progress analysis** — Analyse the user's logged history: frequency, consistency, volume, and what to prioritise next.

## Knowledge sources
You have two sources of truth — use both:
- **Exercise database** (below): Every exercise recommendation MUST come from this list. Never invent an exercise name not on this list.
- **Expert book context** (injected above if relevant): Use this to inform rep ranges, tempo, rest periods, volume, and periodization principles. Cite it naturally, not literally.

## Exercise database (by body part)
${exerciseList}

## User context
- Total workouts logged: ${history.length}
- Recent sessions: ${recentWorkouts || 'None yet'}

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
