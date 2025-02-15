CREATE TABLE statement_import_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  record_mapping TEXT NOT NULL
);

CREATE TABLE accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  class TEXT NOT NULL,
  statement_import_config_id INTEGER
);

CREATE TABLE expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL,
  transaction_date TEXT NOT NULL,
  transaction_time TEXT,
  description TEXT NOT NULL,
  amount DOUBLE NOT NULL,
  details TEXT
);

