import { expect, test } from "@jest/globals";

import {
  Budget,
  BudgetCategory,
  BudgetItem,
  SpendingDataPoint,
} from "../generated/types";

import { BudgetView } from "../BudgetView";
import { FundsView } from "../FundsView";
import { MonthlySpendingData } from "../MonthlySpendingData";

function getBudgetView(): BudgetView {
  const categories = [
    { id: 1, name: "Category 1", ignored: false } as BudgetCategory,
    { id: 2, name: "Category 2", ignored: true } as BudgetCategory,
  ];
  const items = [
    {
      id: 1,
      category_id: 1,
      name: "Item 1",
      allowance: null,
      fund_id: null,
      ignored: false,
    } as BudgetItem,
    {
      id: 2,
      category_id: 2,
      name: "Item 2",
      allowance: null,
      fund_id: null,
      ignored: true,
    } as BudgetItem,
    {
      id: 3,
      category_id: 1,
      name: "Item 3",
      allowance: null,
      fund_id: null,
      ignored: false,
    } as BudgetItem,
  ];
  const budget = { categories: categories, items: items } as Budget;

  return new BudgetView(budget);
}

function getFundsView(): FundsView {
  const funds = [];
  const items = [];

  return new FundsView(funds, items);
}

test("parse spending data", () => {
  const budget = getBudgetView();
  const funds = getFundsView();
  const dataPoints = [
    { month: "2025-11", budget_item_id: 1, amount: 10.0 } as SpendingDataPoint,
    {
      month: "2025-11",
      budget_item_id: null,
      amount: 3.0,
    } as SpendingDataPoint,

    { month: "2025-12", budget_item_id: 1, amount: 5.0 } as SpendingDataPoint,
    { month: "2025-12", budget_item_id: 2, amount: 1.0 } as SpendingDataPoint,
    { month: "2025-12", budget_item_id: 3, amount: 7.0 } as SpendingDataPoint,
  ];

  const spendingData = new MonthlySpendingData(dataPoints, budget, funds);

  // non-ignored entries
  expect(spendingData.getItemSpend(1, "2025-11")).toBe(10.0);
  expect(spendingData.getItemSpend(1, "2025-12")).toBe(5.0);
  expect(spendingData.getItemSpend(3, "2025-12")).toBe(7.0);

  // uncategorized
  expect(spendingData.getUncategorizedSpend("2025-11")).toBe(3.0);
  expect(spendingData.getUncategorizedSpend("2025-12")).toBe(0.0);

  // items in ignored category are not counted
  expect(spendingData.getItemSpend(2, "2025-12")).toBe(0.0);
  expect(spendingData.getCategorySpend(2, "2025-12")).toBe(0.0);

  // categories are summed up
  expect(spendingData.getCategorySpend(1, "2025-11")).toBe(10.0);
  expect(spendingData.getCategorySpend(1, "2025-12")).toBe(12.0);
});
