CREATE TABLE statement_import_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  record_mapping TEXT NOT NULL
);
