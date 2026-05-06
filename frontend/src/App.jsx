import React, { useState, useEffect, useRef } from 'react';
import { Zap } from 'lucide-react';
import './App.css';

function App() {
  const [task, setTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [logs, setLogs] = useState([]);
  const terminalRef = useRef(null);

  const pollTask = async (taskId) => {
    let lastStepCount = 0;
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8001/task/${taskId}`);
        const data = await response.json();
        setResults(data);
        
        if (data.steps.length > lastStepCount) {
          const newStep = data.steps[data.steps.length - 1];
          addLog(`[EXEC] ${newStep.command}`, 'system');
          addLog(`[SLM] Distilled ${newStep.raw_log_size}B -> ${newStep.summary_size}B`);
          lastStepCount = data.steps.length;
        }

        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(interval);
          setLoading(false);
          addLog(`[STATUS] TASK ${data.status.toUpperCase()}`, data.status === 'failed' ? 'error' : 'system');
          if (data.error) addLog(`[ERROR] ${data.error}`, 'error');
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 1000);
  };

  const addLog = (msg, type = '') => {
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev, { time, msg, type }]);
  };

  const handleExecute = async () => {
    if (!task) return;
    setLoading(true);
    setResults(null);
    setLogs([]);
    addLog(`INITIATING: ${task}`, 'system');
    addLog(`AUTH_HANDSHAKE: ORCHESTRATOR_8001...`);
    
    try {
      const response = await fetch('http://127.0.0.1:8001/task/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task }),
      });
      const { task_id } = await response.json();
      
      addLog(`QUEUE_ACCEPT: TASK_ID_${task_id.substring(0,8)}`);
      addLog(`SPAWNING_PRIMARY: LLAMA3_8B...`, 'system');
      
      pollTask(task_id);
    } catch (error) {
      addLog(`CONNECTION_FAILED: ${error.message}`, 'error');
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
        <div className="logo">
          <Zap size={18} fill="currentColor" />
          TERMINUS-LITE // DISTRIBUTED_ROUTER
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.7rem', fontWeight: 600 }}>
          <span style={{ color: 'var(--phosphor-green)' }}>[ SLM_LINK: ACTIVE ]</span>
          <span style={{ color: 'var(--data-blue)' }}>[ PRIMARY_LINK: ONLINE ]</span>
        </div>
      </header>

      <section className="hud-metrics">
        <div className="metric-item">
          <div className="metric-label">Token Delta</div>
          <div className="metric-value" style={{ color: 'var(--phosphor-green)' }}>
            -{results ? results.total_tokens_saved.toLocaleString() : '0'}
          </div>
        </div>
        <div className="metric-item">
          <div className="metric-label">Avg Latency</div>
          <div className="metric-value">242ms</div>
        </div>
        <div className="metric-item">
          <div className="metric-label">Queue Time</div>
          <div className="metric-value">12ms</div>
        </div>
        <div className="metric-item">
          <div className="metric-label">System Load</div>
          <div className="metric-value" style={{ color: 'var(--data-blue)' }}>0.14</div>
        </div>
      </section>

      <div className="main-layout">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="command-input-row">
            <input 
              type="text" 
              placeholder="ENTER_COMMAND_DESCRIPTION..." 
              className="terminal-input"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
            />
            <button className="run-btn" onClick={handleExecute} disabled={loading}>
              {loading ? 'BUSY' : 'EXEC'}
            </button>
          </div>

          <div className="terminal-deck">
            <div className="terminal-header">
              <span>TERMINAL_OUTPUT</span>
              <span>BUFFER_SIZE: {logs.length} LINES</span>
            </div>
            <div className="terminal-content" ref={terminalRef}>
              {logs.map((log, i) => (
                <div key={i} className="log-entry">
                  <span className="log-time">[{log.time}]</span>
                  <span className={`log-msg ${log.type}`}>{log.msg}</span>
                </div>
              ))}
              {logs.length === 0 && <div style={{ color: 'var(--text-dim)' }}>STDOUT_READY_FOR_INGESTION...</div>}
            </div>
          </div>
        </div>

        <div className="summary-sidebar">
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Context_Analysis_Modules
          </div>
          
          {results?.final_result && (
            <div className="summary-block" style={{ border: '1px solid var(--phosphor-green)', background: 'rgba(0,255,65,0.05)' }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--phosphor-green)', fontWeight: 800, marginBottom: '0.5rem' }}>
                RESOLUTION_FINAL
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-bright)' }}>{results.final_result}</div>
            </div>
          )}

          {results?.steps.map((step, i) => (
            <div key={i} className="summary-block" style={{ borderLeft: '2px solid var(--data-blue)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--data-blue)' }}>MODULE_0{i+1}</span>
                <span style={{ fontSize: '0.6rem', color: 'var(--phosphor-green)' }}>-{step.tokens_saved}B</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.25rem', color: 'var(--text-bright)' }}>{step.command}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-mid)' }}>{step.summary}</div>
            </div>
          ))}
          
          {!results && (
            <div style={{ padding: '2rem', textAlign: 'center', border: '1px dashed var(--border-dim)', color: 'var(--text-dim)', fontSize: '0.7rem' }}>
              WAITING_FOR_DATA_STREAM...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
