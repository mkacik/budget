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
  budget_item_id INTEGER
);

CREATE TABLE budget_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE budget_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  amount TEXT NOT NULL
);
