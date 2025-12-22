import { SpendingDataPoint } from "./types/SpendingData";
import { BudgetView } from "./BudgetView";

type ID = number;
type Month = string;

export class MonthlySpendingData {
  categories: Map<Month, Map<ID, number>>;
  items: Map<Month, Map<ID, number>>;
  uncategorized: Map<Month, number>;

  budget: BudgetView;

  constructor(
    spendingDataPoints: Array<SpendingDataPoint>,
    budget: BudgetView,
  ) {
    this.budget = budget;

    this.categories = new Map();
    this.items = new Map();
    this.uncategorized = new Map();

    console.log(spendingDataPoints);
    for (const dataPoint of spendingDataPoints) {
      this.addDataPoint(dataPoint);
    }
  }

  addDataPoint(dataPoint: SpendingDataPoint) {
    const budgetItemID = dataPoint.budget_item_id;
    if (budgetItemID === null) {
      this.addUncategorizedSpend(dataPoint.month, dataPoint.amount);
      return;
    }

    const item = this.budget.getItem(budgetItemID)!;
    const category = item.category;
    if (category.ignored) {
      return;
    }

    this.addItemSpend(budgetItemID, dataPoint.month, dataPoint.amount);
    this.addCategorySpend(category.id, dataPoint.month, dataPoint.amount);
  }

  addItemSpend(itemID: ID, month: Month, amount: number): void {
    if (!this.items.has(month)) {
      this.items.set(month, new Map());
    }

    const monthData = this.items.get(month)!;
    if (monthData.has(itemID)) {
      throw new Error(
        `Duplicate SpendingDataPoint for ${month} and item ${itemID}`,
      );
    }

    monthData.set(itemID, amount);
  }

  addCategorySpend(categoryID: ID, month: Month, amount: number): void {
    if (!this.categories.has(month)) {
      this.categories.set(month, new Map());
    }

    const monthData = this.categories.get(month)!;
    if (!monthData.has(categoryID)) {
      monthData.set(categoryID, 0);
    }

    const total = monthData.get(categoryID)! + amount;
    monthData.set(categoryID, total);
  }

  addUncategorizedSpend(month: Month, amount: number): void {
    if (this.uncategorized.has(month)) {
      throw new Error(`Duplicate SpendingDataPoint for ${month} uncategorized`);
    }

    this.uncategorized.set(month, amount);
  }

  getItemSpend(itemID: ID, month: Month): number {
    const monthData = this.items.get(month);
    if (monthData === undefined) {
      return 0;
    }
    const amount = monthData.get(itemID);
    if (amount === undefined) {
      return 0;
    }
    return amount;
  }

  getCategorySpend(categoryID: ID, month: Month): number {
    const monthData = this.categories.get(month);
    if (monthData === undefined) {
      return 0;
    }
    const amount = monthData.get(categoryID);
    if (amount === undefined) {
      return 0;
    }
    return amount;
  }

  getUncategorizedSpend(month: Month): number {
    const amount = this.uncategorized.get(month);
    if (amount === undefined) {
      return 0;
    }
    return amount;
  }
}
