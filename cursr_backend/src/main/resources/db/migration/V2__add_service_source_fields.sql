ALTER TABLE services ADD COLUMN index_source TEXT NOT NULL DEFAULT 'git';
ALTER TABLE services ADD COLUMN local_path TEXT;
ALTER TABLE services ADD COLUMN repo_subpath TEXT;
