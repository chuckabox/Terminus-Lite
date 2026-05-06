# Terminus-Lite: Context Saving Theory

The fundamental problem with modern LLM agents is "Context Fatigue." When an agent executes a command like `npm install` or `grep -r`, the resulting logs can exceed 10,000 tokens. 

## The Log Bloat Problem
Standard agents ingest these logs directly into their primary context window. This leads to:
1. **Memory Loss**: The agent "forgets" the original user instructions.
2. **High Latency**: Large context windows slow down inference significantly.
3. **High Cost**: Every subsequent turn costs more as the history grows.

## The Distillation Solution
Terminus-Lite uses a "Split-Brain" architecture. A smaller, faster model (SLM) acts as a perceptual filter. It reads the raw 10,000 token log and produces a 50-token semantic summary. 

Example:
- **Raw Log**: 500 lines of "Installing dependency X... [OK]"
- **Distilled Result**: "Successfully installed all 12 project dependencies."

This allows the Primary Agent to maintain a clean, focused memory for indefinitely long tasks.
