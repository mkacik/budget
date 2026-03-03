import { SpendingDataPoint } from "./types/SpendingData";
import { BudgetItemView, BudgetView } from "./BudgetView";
import { FundsView } from "./FundsView";

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

  categoryTotalsInclFunds: Map<ID, number>;
  itemTotalsInclFunds: Map<ID, number>;

  budget: BudgetView;
  funds: FundsView;

  constructor(
    spendingDataPoints: Array<SpendingDataPoint>,
    budget: BudgetView,
    funds: FundsView,
  ) {
    this.budget = budget;
    this.funds = funds;

    this.categories = new Map();
    this.items = new Map();
    this.uncategorized = new Map();

    this.categoryTotals = new Map();
    this.itemTotals = new Map();
    this.monthTotals = new Map();

    this.categoryTotalsInclFunds = new Map();
    this.itemTotalsInclFunds = new Map();

    for (const dataPoint of spendingDataPoints) {
      this.addDataPoint(dataPoint);
    }
    this.fillInFundsData();

    this.validate();
  }

  private validate(): void {
    const categoryTotal = sumUp(this.categoryTotals);
    const itemTotal = sumUp(this.itemTotals);
    const monthTotal = sumUp(this.monthTotals);
    const uncategorizedTotal = sumUp(this.uncategorized);

    if (categoryTotal !== itemTotal) {
      const msg = `categoryTotal: ${categoryTotal} != itemTotal: ${itemTotal}`;
      throw Error("Spending does not add up: " + msg);
    }

    if (categoryTotal + uncategorizedTotal !== monthTotal) {
      const msg =
        `categoryTotal: ${categoryTotal} + uncategorizedTotal: ${uncategorizedTotal}` +
        ` != monthTotal: ${monthTotal}`;
      throw Error("Spending does not add up: " + msg);
    }
  }

  private addDataPoint(dataPoint: SpendingDataPoint) {
    const itemID = dataPoint.budget_item_id;
    const amount = dataPoint.amount;

    if (itemID === null) {
      // add monthly values
      this.addUncategorizedSpend(dataPoint.month, amount);

      // add totals
      this.addMonthTotal(dataPoint.month, amount);

      return;
    }

    const item = this.budget.getItem(itemID)!;
    if (item.ignored) {
      return;
    }

    // add monthly values
    this.addItemSpend(itemID, dataPoint.month, amount);
    this.addCategorySpend(item.categoryID, dataPoint.month, amount);

    // add totals
    this.addItemTotal(itemID, amount);
    this.addCategoryTotal(item.categoryID, amount);
    this.addMonthTotal(dataPoint.month, amount);
  }

  // *** add monthly values

  private addItemSpend(itemID: ID, month: Month, amount: number): void {
    if (!this.items.has(month)) {
      this.items.set(month, new Map());
    }

    const monthData = this.items.get(month)!;
    if (monthData.has(itemID)) {
      throw Error(
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
      throw Error(`Duplicate SpendingDataPoint for ${month} uncategorized`);
    }

    this.uncategorized.set(month, amount);
  }

  // *** add totals

  private addItemTotal(itemID: ID, amount: number): void {
    const total = (this.itemTotals.get(itemID) ?? 0) + amount;
    this.itemTotals.set(itemID, total);
  }

  private addCategoryTotal(categoryID: ID, amount: number): void {
    const total = (this.categoryTotals.get(categoryID) ?? 0) + amount;
    this.categoryTotals.set(categoryID, total);
  }

  private addMonthTotal(month: Month, amount: number): void {
    const total = (this.monthTotals.get(month) ?? 0) + amount;
    this.monthTotals.set(month, total);
  }

  // ** filling in data required for TOTAL + funds column

  private computeItemTotalInclFunds(item: BudgetItemView): number {
    const itemID = item.id;
    const itemTotal = this.getItemTotal(itemID);

    const fundID = item.fundID;
    if (fundID === null) {
      return itemTotal;
    }

    const fund = this.funds.getFund(fundID);
    if (itemTotal > item.amountPerYear && fund.spend > fund.allowance) {
      return itemTotal;
    }

    return item.amountPerYear;
  }

  private fillInFundsData(): void {
    for (const category of this.budget.categories) {
      let categoryTotal = 0;

      for (const item of category.items) {
        const itemTotal = this.computeItemTotalInclFunds(item);
        categoryTotal += itemTotal;
        this.itemTotalsInclFunds.set(item.id, itemTotal);
      }

      this.categoryTotalsInclFunds.set(category.id, categoryTotal);
    }
  }

  // *** get monthly values

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

  getItemTotalInclFunds(itemID: ID): number {
    return this.itemTotalsInclFunds.get(itemID) || 0;
  }

  getCategoryTotalInclFunds(categoryID: ID): number {
    return this.categoryTotalsInclFunds.get(categoryID) || 0;
  }

  getTotalSpend(): number {
    return sumUp(this.monthTotals);
  }

  getTotalSpendInclFunds(): number {
    return sumUp(this.categoryTotalsInclFunds) + this.getUncategorizedTotal();
  }
}
