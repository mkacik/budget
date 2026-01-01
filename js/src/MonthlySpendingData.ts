import { SpendingDataPoint } from "./types/SpendingData";
import { BudgetView } from "./BudgetView";

type ID = number;
type Month = string;

function sumUp<T>(map: Map<T, number>): number {
  return Array.from(map.values()).reduce((acc, val) => acc + val, 0);
}

export class MonthlySpendingData {
  categories: Map<Month, Map<ID, number>>;
  items: Map<Month, Map<ID, number>>;
  uncategorized: Map<Month, number>;

  categoryTotals: Map<ID, number>;
  itemTotals: Map<ID, number>;
  monthTotals: Map<Month, number>;

  budget: BudgetView;

  constructor(
    spendingDataPoints: Array<SpendingDataPoint>,
    budget: BudgetView,
  ) {
    this.budget = budget;

    this.categories = new Map();
    this.items = new Map();
    this.uncategorized = new Map();

    this.categoryTotals = new Map();
    this.itemTotals = new Map();
    this.monthTotals = new Map();

    console.log(spendingDataPoints);
    for (const dataPoint of spendingDataPoints) {
      this.addDataPoint(dataPoint);
    }

    this.validate();
  }

  private validate(): void {
    const categoryTotal = sumUp(this.categoryTotals);
    const itemTotal = sumUp(this.itemTotals);
    const uncategorizedTotal = sumUp(this.uncategorized);
    const monthTotal = sumUp(this.monthTotals);

    if (
      categoryTotal !== itemTotal ||
      categoryTotal + uncategorizedTotal !== monthTotal
    ) {
      const msg = `categoryTotal: ${categoryTotal},
         itemTotal: ${itemTotal},
         uncategorizedTotal: ${uncategorizedTotal},
         monthTotal: ${monthTotal}`;
      throw new Error("Spending does not sum up: " + msg);
    }
  }

  private addDataPoint(dataPoint: SpendingDataPoint) {
    const budgetItemID = dataPoint.budget_item_id;
    // trim all but 2 decimal places, otherwise math on floating point numbers gets fucky
    const roundedAmount = Math.round(100 * dataPoint.amount) / 100;

    if (budgetItemID === null) {
      this.addUncategorizedSpend(dataPoint.month, roundedAmount);

      this.addMonthTotal(dataPoint.month, roundedAmount);

      return;
    }

    const item = this.budget.getItem(budgetItemID)!;
    const category = item.category;
    if (category.ignored) {
      return;
    }

    // add itemized
    this.addItemSpend(budgetItemID, dataPoint.month, roundedAmount);
    this.addCategorySpend(category.id, dataPoint.month, roundedAmount);

    // add totals
    this.addItemTotal(budgetItemID, roundedAmount);
    this.addCategoryTotal(category.id, roundedAmount);
    this.addMonthTotal(dataPoint.month, roundedAmount);
  }

  // *** add itemized

  private addItemSpend(itemID: ID, month: Month, amount: number): void {
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

  private addCategorySpend(categoryID: ID, month: Month, amount: number): void {
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

  private addUncategorizedSpend(month: Month, amount: number): void {
    if (this.uncategorized.has(month)) {
      throw new Error(`Duplicate SpendingDataPoint for ${month} uncategorized`);
    }

    this.uncategorized.set(month, amount);
  }

  // *** add totals

  private addItemTotal(itemID: ID, amount: number): void {
    if (!this.itemTotals.has(itemID)) {
      this.itemTotals.set(itemID, amount);
      return;
    }

    const newTotal = this.itemTotals.get(itemID)! + amount;
    this.itemTotals.set(itemID, newTotal);
  }

  private addCategoryTotal(categoryID: ID, amount: number): void {
    if (!this.categoryTotals.has(categoryID)) {
      this.categoryTotals.set(categoryID, amount);
      return;
    }

    const newTotal = this.categoryTotals.get(categoryID)! + amount;
    this.categoryTotals.set(categoryID, newTotal);
  }

  private addMonthTotal(month: Month, amount: number): void {
    if (!this.monthTotals.has(month)) {
      this.monthTotals.set(month, amount);
      return;
    }

    const newTotal = this.monthTotals.get(month)! + amount;
    this.monthTotals.set(month, newTotal);
  }

  // *** get itemized

  getItemSpend(itemID: ID, month: Month): number {
    const monthData = this.items.get(month);
    if (monthData === undefined) {
      return 0;
    }
    return monthData.get(itemID) || 0;
  }

  getCategorySpend(categoryID: ID, month: Month): number {
    const monthData = this.categories.get(month);
    if (monthData === undefined) {
      return 0;
    }
    return monthData.get(categoryID) || 0;
  }

  getUncategorizedSpend(month: Month): number {
    return this.uncategorized.get(month) || 0;
  }

  // *** get totals

  getUncategorizedTotal(): number {
    return sumUp(this.uncategorized);
  }

  getItemTotal(itemID: ID): number {
    return this.itemTotals.get(itemID) || 0;
  }

  getCategoryTotal(categoryID: ID): number {
    return this.categoryTotals.get(categoryID) || 0;
  }

  getMonthTotal(month: Month): number {
    return this.monthTotals.get(month) || 0;
  }

  getTotalSpend(): number {
    return sumUp(this.monthTotals);
  }
}
