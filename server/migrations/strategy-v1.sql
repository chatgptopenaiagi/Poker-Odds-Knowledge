CREATE TABLE IF NOT EXISTS pok_strategy_job (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL, request_id TEXT NOT NULL, input_hash TEXT NOT NULL,
 analysis_revision INTEGER NOT NULL, state TEXT NOT NULL CHECK(state IN ('queued','running','completed','partial','cancelled','failed')),
 request_json TEXT NOT NULL, result_json TEXT, progress_json TEXT NOT NULL DEFAULT '{"iteration":0,"gap":null}',
 error TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
 UNIQUE(user_id,request_id)
);
CREATE INDEX IF NOT EXISTS pok_strategy_user_time ON pok_strategy_job(user_id,created_at);
CREATE TABLE IF NOT EXISTS pok_strategy_schema(version INTEGER PRIMARY KEY, applied_at INTEGER NOT NULL);
INSERT OR IGNORE INTO pok_strategy_schema VALUES(1,unixepoch()*1000);
CREATE TABLE IF NOT EXISTS pok_strategy_usage(id TEXT PRIMARY KEY,user_id TEXT,created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS pok_strategy_usage_time ON pok_strategy_usage(created_at);
INSERT OR IGNORE INTO pok_strategy_usage SELECT id,user_id,created_at FROM pok_strategy_job;
INSERT OR IGNORE INTO pok_strategy_schema VALUES(2,unixepoch()*1000);
