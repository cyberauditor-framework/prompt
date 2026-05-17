-- Prompt Coach database schema (SQLite)
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS prompt_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pattern_name TEXT NOT NULL,
    category TEXT,
    template TEXT NOT NULL,
    best_for_llm TEXT,
    keywords TEXT
);

CREATE TABLE IF NOT EXISTS system_agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_type TEXT NOT NULL,
    routing_strategy TEXT,
    prompt_id INTEGER,
    FOREIGN KEY (prompt_id) REFERENCES prompt_patterns(id)
);

CREATE TABLE IF NOT EXISTS prompt_logs (
    id INTEGER PRIMARY KEY,
    input_text TEXT,
    output_text TEXT,
    feedback_score INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS saved_prompts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '[]',   -- JSON array of tag strings
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
