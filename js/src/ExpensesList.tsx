import React from "react";
import { useState, useEffect } from "react";

import { Expense, Expenses, ExpensesQuery } from "./types/Expense";

import { AccountsView, useAccountsViewContext } from "./AccountsView";
import { BudgetView } from "./BudgetView";
import {
  getSortComparator,
  SortBy,
  SortField,
  SortOrder,
} from "./ExpensesSort";
import { ExpenseView } from "./ExpenseView";
import { ExpensesTableSettings, ExpensesTable } from "./ExpensesTable";
import { ExpensesPivotTable } from "./ExpensesPivotTable";
import { FetchHelper, JSON_HEADERS } from "./Common";

import * as UI from "./ui/Common";

function getSettings(query: ExpensesQuery): ExpensesTableSettings {
  if (query.selector.variant === "Account") {
    return { autoadvance: true, showAccount: false } as ExpensesTableSettings;
  }
  return { autoadvance: false, showAccount: true } as ExpensesTableSettings;
}

function parseExpenses(
  expenses: Array<Expense>,
  accounts: AccountsView,
): Array<ExpenseView> {
  return expenses.map((expense) => {
    const account = accounts.getAccount(expense.account_id);
    return {
      ...expense,
      account: account,
    } as ExpenseView;
  });
}

const DEFAULT_SORT_BY = {
  field: SortField.DateTime,
  order: SortOrder.Desc,
} as SortBy;

export function ExpensesList({
  budget,
  query,
  onExpenseCategoryChange,
}: {
  budget: BudgetView;
  query: ExpensesQuery;
  onExpenseCategoryChange?: () => void;
}) {
  const [expenses, setExpenses] = useState<Array<ExpenseView>>([]);
  const [sortBy, setSortBy] = useState<SortBy>(DEFAULT_SORT_BY);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const accounts = useAccountsViewContext();

  const fetchExpenses = async () => {
    const fetchHelper = new FetchHelper(setErrorMessage);
    try {
      const request = new Request("/api/expenses/query", {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify(query),
      });

      fetchHelper.fetch(request, (json) => {
        const result = json as Expenses;
        const expenses = parseExpenses(result.expenses, accounts);
        const sortComparator = getSortComparator(sortBy);
        const sortedExpenses = expenses.toSorted(sortComparator);
        setExpenses(sortedExpenses);
      });
    } catch (error) {
      fetchHelper.handleError(error);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [query]);

  const updateSortBy = (newSortBy: SortBy) => {
    const sortComparator = getSortComparator(newSortBy);
    const sortedExpenses = expenses.toSorted(sortComparator);
    setSortBy(newSortBy);
    setExpenses(sortedExpenses);
  };

  const handleExpenseCategoryChange = () => {
    fetchExpenses();
    if (onExpenseCategoryChange) {
      onExpenseCategoryChange();
    }
  };

  return (
    <>
      <UI.ErrorCard message={errorMessage} />
      <ExpensesTable
        budget={budget}
        accounts={accounts}
        expenses={expenses}
        onExpenseCategoryChange={handleExpenseCategoryChange}
        onExpenseNotesChange={fetchExpenses}
        onExpenseDelete={handleExpenseCategoryChange}
        updateSortBy={updateSortBy}
        settings={getSettings(query)}
      />
      <ExpensesPivotTable expenses={expenses} />
    </>
  );
}
