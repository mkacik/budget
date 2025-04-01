CREATE TABLE statement_schemas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  record_mapping TEXT NOT NULL
);

CREATE TABLE accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  class TEXT NOT NULL,
  statement_schema_id INTEGER
);

CREATE TABLE expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL,
  transaction_date TEXT NOT NULL,
  transaction_time TEXT,
  description TEXT NOT NULL,
  amount DOUBLE NOT NULL,
  raw_csv TEXT NOT NULL,
  budget_item_id INTEGER
);

CREATE TABLE budget_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  ignored BOOLEAN NOT NULL
);

CREATE TABLE budget_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  amount TEXT
);

CREATE TABLE credentials (
  username TEXT PRIMARY KEY NOT NULL UNIQUE,
  pwhash TEXT NOT NULL
);

CREATE TABLE write_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uri TEXT NOT NULL,
  method TEXT NOT NULL,
  username TEXT NOT NULL,
  content TEXT,
  status TEXT,
  start_ts INTEGER,
  end_ts INTEGER
);
