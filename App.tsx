import React, { useState, useEffect } from 'react';
import { generateSimulation, chatWithAssistant } from './services/geminiService';
import { SimulationData, ChatMessage, TimelineStep } from './types';
import { Scene } from './components/Scene';
import { ChatInterface } from './components/ChatInterface';
import { Play, Pause, SkipForward, RotateCcw, Sparkles, AlertTriangle, Atom, Eye, EyeOff } from 'lucide-react';

const INITIAL_QUERY = "Show me how a prism refracts light";

function App() {
  // State
  const [query, setQuery] = useState(INITIAL_QUERY);
  const [mode, setMode] = useState<'STANDARD' | 'WHAT_IF_REMIX'>('STANDARD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulation, setSimulation] = useState<SimulationData | null>(null);
  
  // Playback State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showLabels, setShowLabels] = useState(true);

  // Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatTyping, setIsChatTyping] = useState(false);

  // Generate Simulation
  const handleGenerate = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setIsPlaying(false);
    setChatHistory([]); // Reset chat on new sim
    
    try {
      const data = await generateSimulation(query, mode);
      setSimulation(data);
      setCurrentStepIndex(0);
      
      // Initial Bot Message
      setChatHistory([{
        role: 'model',
        text: `Simulation loaded: "${data.meta_data.title}". ${data.lab_assistant_config.context_brief.split('.')[0]}.`
      }]);

    } catch (err) {
      setError("Failed to generate simulation. Please try a different query.");
    } finally {
      setLoading(false);
    }
  };

  // Chat Handler
  const handleSendMessage = async (text: string) => {
    if (!simulation) return;
    
    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', text }];
    setChatHistory(newHistory);
    setIsChatTyping(true);

    const response = await chatWithAssistant(
      text, 
      newHistory, 
      simulation.lab_assistant_config.context_brief
    );

    setChatHistory(prev => [...prev, { role: 'model', text: response }]);
    setIsChatTyping(false);
  };

  // Timeline Loop
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && simulation) {
      interval = setInterval(() => {
        setCurrentStepIndex(prev => {
          if (prev < simulation.sync_timeline.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false); // Stop at end
            return prev;
          }
        });
      }, simulation.sync_timeline[currentStepIndex].duration_seconds * 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, simulation, currentStepIndex]);

  const currentStepData: TimelineStep | undefined = simulation?.sync_timeline[currentStepIndex];

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden font-sans">
      
      {/* Top Navbar */}
      <header className="h-16 border-b border-zinc-800 bg-zinc-950 flex items-center px-6 justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-1.5 rounded-lg">
            <Atom className="text-white" size={20} />
          </div>
          <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
            Omni-Engine <span className="text-cyan-500">17.0</span>
          </span>
        </div>

        <div className="flex items-center gap-4 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-64 px-3 text-zinc-200 placeholder-zinc-500"
              placeholder="Describe a simulation..."
            />
            <div className="h-4 w-[1px] bg-zinc-700"></div>
            <button 
              onClick={() => setMode(prev => prev === 'STANDARD' ? 'WHAT_IF_REMIX' : 'STANDARD')}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                mode === 'WHAT_IF_REMIX' 
                  ? 'bg-purple-900/50 text-purple-300 border border-purple-500/30' 
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {mode === 'WHAT_IF_REMIX' && <Sparkles size={12} />}
              {mode === 'STANDARD' ? 'Standard Mode' : 'What-If Remix'}
            </button>
            <button 
              onClick={handleGenerate}
              disabled={loading}
              className="bg-white text-black hover:bg-zinc-200 text-xs font-bold px-4 py-1.5 rounded-lg transition-colors flex items-center gap-2"
            >
              {loading ? 'Generating...' : 'Visualize'}
              {!loading && <Sparkles size={12} className="text-cyan-600" />}
            </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: 3D Viewport */}
        <div className="flex-1 relative bg-zinc-900 flex flex-col">
          {simulation ? (
            <>
               <div className="absolute top-6 left-6 z-10 max-w-md pointer-events-none">
                  <h1 className="text-3xl font-light text-white drop-shadow-lg mb-1">{simulation.meta_data.title}</h1>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md border ${
                    simulation.meta_data.is_remix 
                      ? 'bg-purple-500/20 border-purple-500/40 text-purple-200' 
                      : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-200'
                  }`}>
                    {simulation.meta_data.is_remix ? <Sparkles size={12} /> : <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                    {simulation.meta_data.scientific_verdict}
                  </div>
               </div>

               <Scene 
                 data={simulation} 
                 currentStepIndex={currentStepIndex}
                 showLabels={showLabels}
               />
               
               {/* Playback Controls */}
               <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 p-2 pl-4 pr-4 bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                  <button onClick={() => setIsPlaying(!isPlaying)} className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform">
                    {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                  </button>
                  
                  <div className="flex flex-col gap-1 w-64">
                    <div className="flex justify-between text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                      <span>Step {currentStepIndex + 1}/{simulation.sync_timeline.length}</span>
                      <span>{currentStepData?.ui_display.chapter_title}</span>
                    </div>
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-cyan-500 transition-all duration-500"
                        style={{ width: `${((currentStepIndex + 1) / simulation.sync_timeline.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  <button onClick={() => setCurrentStepIndex(0)} className="text-zinc-400 hover:text-white transition-colors" title="Restart">
                    <RotateCcw size={18} />
                  </button>
                  
                  <div className="h-8 w-[1px] bg-white/10 mx-1"></div>

                  <button 
                    onClick={() => setShowLabels(!showLabels)} 
                    className={`transition-colors ${showLabels ? 'text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                    title={showLabels ? "Hide Labels" : "Show Labels"}
                  >
                    {showLabels ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
               </div>
               
               {/* Sidebar Explanation Toast */}
               <div className="absolute top-1/2 right-8 -translate-y-1/2 w-72 bg-black/60 backdrop-blur-xl border-l-2 border-cyan-500 p-6 rounded-r-xl shadow-2xl text-sm leading-relaxed text-zinc-200 pointer-events-none">
                  <h4 className="text-cyan-400 font-bold mb-2 uppercase text-xs tracking-widest">Scientific Context</h4>
                  {currentStepData?.ui_display.sidebar_explanation}
               </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500">
               {loading ? (
                 <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                    <p className="text-sm tracking-widest uppercase">Synthesizing Physics Model...</p>
                 </div>
               ) : error ? (
                 <div className="text-red-400 flex flex-col items-center gap-2">
                   <AlertTriangle />
                   <p>{error}</p>
                 </div>
               ) : (
                 <>
                   <div className="w-24 h-24 rounded-full bg-zinc-800/50 flex items-center justify-center mb-6 border border-zinc-700">
                     <Atom size={48} className="text-zinc-600" />
                   </div>
                   <h2 className="text-xl font-medium text-zinc-300">Ready to Visualize</h2>
                   <p className="max-w-md text-center mt-2 text-sm opacity-60">
                     Enter a scientific query above or try "What if the sun disappeared?"
                   </p>
                 </>
               )}
            </div>
          )}
        </div>

        {/* Right: Chat Panel */}
        <div className="w-96 border-l border-zinc-800 bg-zinc-950 relative z-20 shadow-xl">
          <ChatInterface 
            messages={chatHistory}
            onSendMessage={handleSendMessage}
            botName={simulation?.lab_assistant_config.bot_name || "Omni-Bot"}
            isTyping={isChatTyping}
            suggestions={simulation?.lab_assistant_config.suggested_questions || []}
          />
        </div>

      </div>
    </div>
  );
}

export default App;