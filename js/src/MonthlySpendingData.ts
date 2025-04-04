import { SpendingDataPoint } from "./types/SpendingData";
import { BudgetView } from "./BudgetView";

type ID = number;
type Month = string;

type MonthlySpendingPerItem = {
  id: ID;
  item: string;
  category: string;
  month: string;
  spend: number;
};

type MonthlySpendingPerCategory = {
  id: ID;
  category: string;
  month: string;
  spend: number;
  items: Array<MonthlySpendingPerItem>;
};

export type MonthlySpendingData = Map<
  Month,
  Map<ID, MonthlySpendingPerCategory>
>;

export function parseData(
  monthlySpending: Array<SpendingDataPoint>,
  budget: BudgetView,
): MonthlySpendingData {
  const dataPoints: MonthlySpendingData = new Map();
  for (const row of monthlySpending) {
    const item = budget.getItem(row.budget_item_id);
    const category = item.category;

    if (category.ignored) {
      continue;
    }

    const month = row.month;
    if (!dataPoints.has(month)) {
      dataPoints.set(month, new Map());
    }
    const monthDataPoints = dataPoints.get(month)!;
    if (!monthDataPoints.has(category.id)) {
      const categorySpend = {
        id: category.id,
        category: category.name,
        month: month,
        spend: 0,
        items: [],
      } as MonthlySpendingPerCategory;
      monthDataPoints.set(category.id, categorySpend);
    }

    const monthSpendPerItem: MonthlySpendingPerItem = {
      id: item.id,
      item: item.name,
      category: category.name,
      month: month,
      spend: row.amount,
    } as MonthlySpendingPerItem;

    const monthSpendPerCategory = monthDataPoints.get(category.id)!;
    monthSpendPerCategory.spend += row.amount;
    monthSpendPerCategory.items.push(monthSpendPerItem);
  }

  return dataPoints;
}
