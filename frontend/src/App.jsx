import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Cpu, Zap, Activity, Save, ChevronRight, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

function App() {
  const [task, setTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [logs, setLogs] = useState([]);
  const terminalRef = useRef(null);

  const pollTask = async (taskId) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8001/task/${taskId}`);
        const data = await response.json();
        setResults(data);
        
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(interval);
          setLoading(false);
          setLogs(prev => [...prev, `> Task ${data.status}.`]);
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 1000);
  };

  const handleExecute = async () => {
    if (!task) return;
    setLoading(true);
    setLogs([`> Initiating task: ${task}`, `> Spawning Primary Agent (Frontier LLM)...`]);
    
    try {
      const response = await fetch('http://localhost:8001/task/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task }),
      });
      const { task_id } = await response.json();
      
      // Start polling
      pollTask(task_id);
      
      // Simulate log streaming
      let currentLogs = [...logs];
      data.steps.forEach((step, i) => {
        currentLogs.push(`> [Step ${i+1}] Executing: ${step.command}`);
        currentLogs.push(`> [SLM] Intercepted ${step.raw_log_size} bytes of raw logs.`);
        currentLogs.push(`> [SLM] Summarizing execution...`);
        currentLogs.push(`> [Primary] Received summary: ${step.summary.substring(0, 50)}...`);
      });
      currentLogs.push(`> Task Complete.`);
      setLogs(currentLogs);

    } catch (error) {
      setLogs(prev => [...prev, `! Error connecting to Terminus-Lite Backend: ${error.message}`]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="app-container">
      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Zap size={24} color="var(--accent-primary)" fill="var(--accent-primary)" style={{ filter: 'drop-shadow(0 0 8px var(--accent-primary))' }} />
          <div className="logo">TERMINUS-LITE</div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="badge badge-slm">SLM Active</div>
          <div className="badge badge-primary">Primary Linked</div>
        </div>
      </header>

      <aside className="sidebar">
        <div className="stats-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>
            <Save size={18} />
            <span style={{ fontWeight: 600 }}>Token Savings</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>
            {results ? results.total_tokens_saved.toLocaleString() : '0'}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Context preserved by SLM offloading
          </div>
        </div>

        <div className="stats-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-secondary)', marginBottom: '0.5rem' }}>
            <Activity size={18} />
            <span style={{ fontWeight: 600 }}>Performance</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
             <div style={{ fontSize: '2rem', fontWeight: 800 }}>240ms</div>
             <div style={{ fontSize: '0.8rem', color: 'var(--success)' }}>12ms queue</div>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Avg. end-to-end latency
          </div>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '1rem' }}>SYSTEM STATUS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span>vLLM Endpoint</span>
              <span style={{ color: 'var(--success)' }}>ONLINE</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span>Primary Model</span>
              <span style={{ color: 'var(--success)' }}>GPT-4O</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <section style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            placeholder="Describe the terminal task (e.g., 'Run tests and fix build errors')" 
            className="stats-card"
            style={{ flex: 1, background: 'transparent', outline: 'none', color: 'white' }}
            value={task}
            onChange={(e) => setTask(e.target.value)}
          />
          <button className="btn-primary" onClick={handleExecute} disabled={loading}>
            {loading ? 'Executing...' : 'Run Task'}
          </button>
        </section>

        {results?.final_result && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="summary-card" 
            style={{ borderLeft: '4px solid var(--success)' }}
          >
            <div style={{ fontWeight: 800, fontSize: '0.75rem', color: 'var(--success)', marginBottom: '0.5rem' }}>FINAL TASK RESOLUTION</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{results.final_result}</div>
          </motion.div>
        )}

        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Terminal size={20} color="var(--accent-primary)" />
                <h3 style={{ margin: 0 }}>Execution Logs</h3>
              </div>
              <button 
                onClick={() => setLogs([])}
                style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}
              >
                CLEAR
              </button>
            </div>
            <div className="terminal" ref={terminalRef}>
              {logs.map((log, i) => (
                <div key={i} className={`terminal-line ${log.startsWith('>') ? 'command' : log.startsWith('!') ? 'error' : ''}`}>
                  {log}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Layers size={20} color="var(--accent-secondary)" />
              <h3 style={{ margin: 0 }}>SLM Context Summaries</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <AnimatePresence>
                {results?.steps.map((step, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i} 
                    className="summary-card"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>STEP {i+1}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>-{step.tokens_saved} tokens</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>{step.command}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{step.summary}</div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {!results && <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No summaries yet...</div>}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
