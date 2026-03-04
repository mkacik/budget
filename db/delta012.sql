.bail on
PRAGMA foreign_key = 1;

-- accounts

CREATE TABLE accounts_wfk (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  account_type TEXT NOT NULL,
  statement_schema_id INTEGER,
  FOREIGN KEY(statement_schema_id) REFERENCES statement_schemas(id)
);
INSERT INTO accounts_wfk SELECT * FROM accounts;

ALTER TABLE accounts RENAME TO accounts_old;
ALTER TABLE accounts_wfk RENAME TO accounts;

-- budget_items

CREATE TABLE budget_items_wfk (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category_id INTEGER NOT NULL,
  fund_id INTEGER,
  allowance TEXT,
  budget_only BOOLEAN NOT NULL DEFAULT 0,
  FOREIGN KEY(category_id) REFERENCES budget_categories(id),
  FOREIGN KEY(fund_id) REFERENCES budget_funds(id)
);
INSERT INTO budget_items_wfk
  (id, name, category_id, fund_id, allowance, budget_only)
SELECT id, name, category_id, fund_id, allowance, budget_only FROM budget_items;

DROP VIEW view_budget_items;
ALTER TABLE budget_items RENAME TO budget_items_old;
ALTER TABLE budget_items_wfk RENAME TO budget_items;
CREATE VIEW view_budget_items AS
SELECT
  budget_items.*,
  budget_categories.year,
  budget_categories.ignored,
  budget_categories.name || " :: " || budget_items.name AS display_name
FROM budget_items
JOIN budget_categories ON (budget_items.category_id = budget_categories.id);

-- expenses

CREATE TABLE expenses_wfk (
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
INSERT INTO expenses_wfk SELECT * FROM expenses;
ALTER TABLE expenses RENAME TO expenses_old;
ALTER TABLE expenses_wfk RENAME TO expenses;

-- drop old tables

DROP TABLE accounts_old;
DROP TABLE budget_items_old;
DROP TABLE expenses_old;
