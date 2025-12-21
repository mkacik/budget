import { expect, test } from "@jest/globals";

import { Expense } from "../types/Expense";
import {
  getSortComparator,
  SortBy,
  SortField,
  SortOrder,
} from "../ExpensesSort";

/* export type Expense = {
  id: number,
  account_id: number,
  transaction_date: string,
  transaction_time: string | null,
  description: string,
  amount: number,
  budget_item_id: number | null,
}; */

function sortBy(field: SortField, order: SortOrder): SortBy {
  return {
    field: field,
    order: order,
  } as SortBy;
}

test("sort by amount", () => {
  const newExpense = (id: number, amount: number) => {
    return {
      id: id,
      account_id: 1,
      transaction_date: "2025-12-16",
      transaction_time: null,
      description: "Some expense",
      amount: amount,
      budget_item_id: null,
    } as Expense;
  };

  const expenses = [
    newExpense(1, 16.99),
    newExpense(2, 7.99),
    newExpense(3, 12.99),
  ];

  const comparatorAsc = getSortComparator(
    sortBy(SortField.Amount, SortOrder.Asc),
  );
  expenses.sort(comparatorAsc);
  expect(expenses.map((e) => e.id)).toEqual([2, 3, 1]);

  const comparatorDesc = getSortComparator(
    sortBy(SortField.Amount, SortOrder.Desc),
  );
  expenses.sort(comparatorDesc);
  expect(expenses.map((e) => e.id)).toEqual([1, 3, 2]);
});

test("sort by description", () => {
  const newExpense = (id: number, description: string) => {
    return {
      id: id,
      account_id: 1,
      transaction_date: "2025-12-16",
      transaction_time: null,
      description: description,
      amount: 6.99,
      budget_item_id: null,
    } as Expense;
  };

  const expenses = [
    newExpense(1, "C"),
    newExpense(2, "c"),
    newExpense(3, "B"),
    newExpense(4, "A"),
  ];

  const comparatorAsc = getSortComparator(
    sortBy(SortField.Description, SortOrder.Asc),
  );
  expenses.sort(comparatorAsc);
  expect(expenses.map((e) => e.id)).toEqual([4, 3, 1, 2]);

  const comparatorDesc = getSortComparator(
    sortBy(SortField.Description, SortOrder.Desc),
  );
  expenses.sort(comparatorDesc);
  expect(expenses.map((e) => e.id)).toEqual([1, 2, 3, 4]);
});

test("sort by date/time", () => {
  const newExpense = (id: number, date: string, time: string | null) => {
    return {
      id: id,
      account_id: 1,
      transaction_date: date,
      transaction_time: time,
      description: "Some expense",
      amount: 19.99,
      budget_item_id: null,
    } as Expense;
  };

  const expenses = [
    newExpense(1, "2025-12-16", "23:45:55"),
    newExpense(2, "2025-12-16", "05:10:15"),
    newExpense(3, "2025-12-16", null),
    newExpense(4, "2025-12-15", null),
  ];

  const comparatorAsc = getSortComparator(
    sortBy(SortField.DateTime, SortOrder.Asc),
  );
  expenses.sort(comparatorAsc);
  expect(expenses.map((e) => e.id)).toEqual([4, 3, 2, 1]);

  const comparatorDesc = getSortComparator(
    sortBy(SortField.DateTime, SortOrder.Desc),
  );
  expenses.sort(comparatorDesc);
  expect(expenses.map((e) => e.id)).toEqual([1, 2, 3, 4]);
});
