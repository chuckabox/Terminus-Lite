import React, { useState, useEffect, useRef } from 'react';
import { Zap } from 'lucide-react';
import './App.css';

function App() {
  const [task, setTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState({ system_load: 0, queue_length: 0 });
  const [isDemo, setIsDemo] = useState(false);
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

  const fetchMetrics = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8001/metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (e) {
      console.error("Metric fetch failed", e);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const addLog = (msg, type = '') => {
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev, { time, msg, type }]);
  };

  const checkBackend = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8001/health');
      if (!response.ok) throw new Error();
      setIsDemo(false);
    } catch (e) {
      setIsDemo(true);
    }
  };

  useEffect(() => {
    checkBackend();
  }, []);

  const runDemo = async () => {
    setIsDemo(true);
    setResults(null);
    setLogs([]);
    addLog(`SYSTEM_ALERT: DEMO_MODE_ACTIVE`, 'error');
    addLog(`NOTICE: Local backend (Redis/Ollama) unreachable. Switching to simulation...`, 'system');
    addLog(`INITIATING_SIMULATION: ${task}`, 'system');
    
    await new Promise(r => setTimeout(r, 1000));
    addLog(`SPAWNING_PRIMARY: LLAMA3_8B (MOCKED)...`, 'system');
    
    const demoSteps = [
      { command: "ls -R mock_target/", summary: "Project structure identified: 3 directories (src, tests, config) and 4 files found.", tokens: 840 },
      { command: "cat CONTEXT_SAVER.md", summary: "Theory check complete. Document explains the 'Split-Brain' distillation logic.", tokens: 1542 },
      { command: "grep -r 'TODO' mock_target/", summary: "Found 3 actionable items: OAuth2 flow (auth.py), JWT rotation (auth.py), and hardcoded password (settings.yaml).", tokens: 1205 },
      { command: "python benchmark.py --target mock_target/", summary: "Analysis complete. Distillation saved 88.4% of context overhead for this codebase.", tokens: 2102 }
    ];

    let currentSteps = [];
    for (let i = 0; i < demoSteps.length; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const step = demoSteps[i];
      addLog(`[EXEC] ${step.command}`, 'system');
      addLog(`[SLM] Distilled ${Math.floor(step.tokens * 1.5)}B -> ${Math.floor(step.tokens * 0.1)}B`);
      currentSteps.push({
        command: step.command,
        summary: step.summary,
        tokens_saved: step.tokens,
        raw_log_size: Math.floor(step.tokens * 1.5),
        summary_size: Math.floor(step.tokens * 0.1)
      });
      setResults({
        steps: [...currentSteps],
        total_tokens_saved: currentSteps.reduce((acc, s) => acc + s.tokens_saved, 0),
        current_node: i === demoSteps.length - 1 ? 'primary' : 'worker'
      });
    }

    await new Promise(r => setTimeout(r, 1500));
    setResults(prev => ({ ...prev, status: 'completed', final_result: "Task completed successfully using simulated sub-agents." }));
    addLog(`[STATUS] TASK COMPLETED`, 'system');
    setLoading(false);
  };

  const handleExecute = async () => {
    if (!task) return;
    setLoading(true);
    
    try {
      const response = await fetch('http://127.0.0.1:8001/task/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task }),
      });
      if (!response.ok) throw new Error("Backend unreachable");
      const { task_id } = await response.json();
      setResults(null);
      setLogs([]);
      addLog(`INITIATING: ${task}`, 'system');
      pollTask(task_id);
    } catch (error) {
      runDemo();
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
          <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 4px var(--phosphor-green))' }}>
            <path d="M20 20h60v10H55v50H45V30H20z" fill="var(--phosphor-green)"/>
            <rect x="45" y="75" width="10" height="5" fill="var(--phosphor-green)">
              <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite" />
            </rect>
          </svg>
          TERMINUS-LITE // DISTRIBUTED_ROUTER
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.7rem', fontWeight: 600 }}>
          {isDemo && (
            <div style={{ background: 'var(--safety-orange)', color: 'var(--bg-black)', padding: '2px 8px', borderRadius: '2px', fontSize: '0.6rem', fontWeight: 800 }}>
              STATIC_DEMO_MODE
            </div>
          )}
          <span style={{ color: 'var(--phosphor-green)' }}>[ SLM_LINK: {isDemo ? 'SIMULATED' : 'ACTIVE'} ]</span>
          <span style={{ color: 'var(--data-blue)' }}>[ PRIMARY_LINK: {isDemo ? 'OFFLINE' : 'ONLINE'} ]</span>
        </div>
      </header>

      <section className="hud-metrics">
        <div className="metric-item">
          <div className="metric-label">Status Overview</div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
            <div className="status-indicator">
              <div className={`dot ${results?.current_node === 'primary' ? 'active pulse' : ''}`}></div>
              PRIMARY
            </div>
            <div className="status-indicator">
              <div className={`dot ${results?.current_node === 'worker' ? 'active pulse' : ''}`}></div>
              WORKER
            </div>
            <div className="status-indicator">
              <div className={`dot ${results?.current_node === 'slm' ? 'active pulse' : ''}`}></div>
              SLM
            </div>
          </div>
        </div>
        <div className="metric-item">
          <div className="metric-label">Step Index</div>
          <div className="metric-value">
            {results ? results.steps.length : '0'}<span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>/03</span>
          </div>
        </div>
        <div className="metric-item">
          <div className="metric-label">Token Delta</div>
          <div className="metric-value" style={{ color: 'var(--phosphor-green)' }}>
            -{results ? results.total_tokens_saved.toLocaleString() : '0'}B
          </div>
        </div>
        <div className="metric-item">
          <div className="metric-label">System Load</div>
          <div className="metric-value" style={{ color: 'var(--data-blue)' }}>
            {metrics.system_load.toFixed(2)}
          </div>
        </div>
      </section>

      <div className="main-layout">
        <div className="summary-sidebar">
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Activity Stream
          </div>

          {isDemo && (
            <div className="mock-explorer">
              <div className="explorer-header">
                <span className="explorer-title">TARGET: /mock_target</span>
                <a href="https://github.com/chuckabox/Terminus-Lite/tree/main/mock_target" target="_blank" rel="noreferrer" className="github-link">GITHUB</a>
              </div>
              <div className="file-tree">
                <div>├── config/</div>
                <div>│   └── settings.yaml <span className="tree-meta">(TODO)</span></div>
                <div>├── src/</div>
                <div>│   └── auth.py <span className="tree-meta">(TODO)</span></div>
                <div>├── tests/</div>
                <div>└── CONTEXT_SAVER.md</div>
              </div>
            </div>
          )}
          
          {results?.final_result && (
            <div className="summary-block" style={{ border: '1px solid var(--phosphor-green)', background: 'rgba(0,255,65,0.05)' }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--phosphor-green)', fontWeight: 800, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                Resolution
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-bright)', fontWeight: 600 }}>{results.final_result}</div>
            </div>
          )}

          {results?.steps.map((step, i) => (
            <div key={i} className="summary-block">
              <div style={{ fontWeight: 600, fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--data-blue)' }}>{step.command}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-mid)', lineHeight: 1.5 }}>{step.summary}</div>
            </div>
          ))}
          
          {!results && (
            <div style={{ padding: '2rem', textAlign: 'center', border: '1px dashed var(--border-dim)', color: 'var(--text-dim)', fontSize: '0.7rem' }}>
              WAITING_FOR_DATA_STREAM...
            </div>
          )}
        </div>

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

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', alignSelf: 'center', marginRight: '0.5rem' }}>SUGGESTED_TASKS:</span>
            {[
              "Read and summarize CONTEXT_SAVER.md",
              "List every file in 'mock_target' recursively",
              "Search for 'TODO' markers in 'mock_target'",
              "Benchmark efficiency on 'mock_target'"
            ].map((suggestion, i) => (
              <button 
                key={i} 
                className="suggestion-chip"
                onClick={() => setTask(suggestion)}
                disabled={loading}
              >
                {suggestion}
              </button>
            ))}
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
      </div>
      {isDemo && (
        <div className="demo-banner">
          <div className="demo-banner-content">
            <span className="demo-label">DEMO_MODE_ACTIVE</span>
            <span className="demo-text">Static simulation running. Backend required for real-time routing.</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
