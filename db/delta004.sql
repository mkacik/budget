CREATE TABLE budget_categories_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  ignored BOOLEAN NOT NULL,
  year INTEGER NOT NULL,
  UNIQUE(name, year)
);

INSERT INTO budget_categories_new (id, name, ignored, year)
SELECT id, name, ignored, year FROM budget_categories;

DROP TABLE budget_categories;

ALTER TABLE budget_categories_new RENAME TO budget_categories;
