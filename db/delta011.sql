CREATE TABLE expenses_cents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL,
  transaction_date TEXT NOT NULL,
  transaction_time TEXT,
  description TEXT NOT NULL,
  amount INTEGER NOT NULL,
  raw_csv TEXT NOT NULL,
  budget_item_id INTEGER,
  notes TEXT
);

INSERT INTO expenses_cents (
  id,
  account_id,
  transaction_date,
  transaction_time,
  description,
  amount,
  raw_csv,
  budget_item_id,
  notes
) SELECT
  id,
  account_id,
  transaction_date,
  transaction_time,
  description,
  cast(round(amount * 100) AS INTEGER),
  raw_csv,
  budget_item_id,
  notes
FROM expenses;

ALTER TABLE expenses RENAME TO expenses_to_delete;

ALTER TABLE expenses_cents RENAME TO expenses;

DROP TABLE expenses_to_delete;
