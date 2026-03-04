CREATE TABLE statement_schemas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  record_mapping TEXT NOT NULL
, notes TEXT);
CREATE TABLE sqlite_sequence(name,seq);
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
CREATE TABLE IF NOT EXISTS "budget_categories" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  ignored BOOLEAN NOT NULL,
  year INTEGER NOT NULL,
  UNIQUE(name, year)
);
CREATE TABLE budget_funds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS "accounts" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  account_type TEXT NOT NULL,
  statement_schema_id INTEGER,
  FOREIGN KEY(statement_schema_id) REFERENCES statement_schemas(id)
);
CREATE TABLE IF NOT EXISTS "budget_items" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category_id INTEGER NOT NULL,
  fund_id INTEGER,
  allowance TEXT,
  budget_only BOOLEAN NOT NULL DEFAULT 0,
  FOREIGN KEY(category_id) REFERENCES budget_categories(id),
  FOREIGN KEY(fund_id) REFERENCES budget_funds(id)
);
CREATE VIEW view_budget_items AS
SELECT
  budget_items.*,
  budget_categories.year,
  budget_categories.ignored,
  budget_categories.name || " :: " || budget_items.name AS display_name
FROM budget_items
JOIN budget_categories ON (budget_items.category_id = budget_categories.id)
/* view_budget_items(id,name,category_id,fund_id,allowance,budget_only,year,ignored,display_name) */;
CREATE TABLE IF NOT EXISTS "expenses" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL,
  transaction_date TEXT NOT NULL,
  transaction_time TEXT,
  description TEXT NOT NULL,
  amount INTEGER NOT NULL,
  raw_csv TEXT NOT NULL,
  budget_item_id INTEGER,
  notes TEXT,
  FOREIGN KEY(account_id) REFERENCES accounts(id),
  FOREIGN KEY(budget_item_id) REFERENCES budget_items(id)
);
