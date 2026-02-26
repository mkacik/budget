CREATE VIEW view_budget_items AS
SELECT
  budget_items.*,
  budget_categories.year,
  budget_categories.name || " :: " || budget_items.name AS display_name
FROM budget_items
JOIN budget_categories ON (budget_items.category_id = budget_categories.id);
