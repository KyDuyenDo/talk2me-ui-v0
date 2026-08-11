-- Structured vocabulary (term/phonetic/meaning/example sentence + real video timestamp)
-- for the Theory tab — replaces the freeform Markdown vocabulary table, which rendered
-- inconsistently between lessons since nothing forced the LLM to always use a table.
ALTER TABLE lessons ADD COLUMN vocabulary_json jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Structured grammar structures (pattern/explanation/example sentence + real video
-- timestamp) — independent from vocabulary_json, its own content type with its own fields,
-- not derived from or linked to vocabulary entries.
ALTER TABLE lessons ADD COLUMN grammar_structures_json jsonb NOT NULL DEFAULT '[]'::jsonb;
