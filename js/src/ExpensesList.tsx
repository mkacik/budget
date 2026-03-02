import React from "react";
import { useState, useEffect } from "react";

import {
  ExpensesQueryRequest,
  ExpensesQueryRequestCategorySelector,
  ExpensesQueryResponse,
} from "./types/Expense";

import {
  AccountView,
  AccountsView,
  useAccountsViewContext,
} from "./AccountsView";
import { BudgetView, BudgetItemView, BudgetCategoryView } from "./BudgetView";
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

export type ExpensesQueryCategorySelector =
  | BudgetItemView
  | BudgetCategoryView
  | "all-not-ignored"
  | "uncategorized";
export type ExpensesQuery =
  | { variant: "account"; account: AccountView; year: number }
  | {
      variant: "period";
      period: string;
      categorySelector: ExpensesQueryCategorySelector;
    };

function getExpensesQueryRequestCategorySelector(
  selector: ExpensesQueryCategorySelector,
): ExpensesQueryRequestCategorySelector {
  if (selector === "uncategorized") {
    return { variant: "Uncategorized" } as ExpensesQueryRequestCategorySelector;
  }
  if (selector === "all-not-ignored") {
    return { variant: "All" } as ExpensesQueryRequestCategorySelector;
  }
  if (selector instanceof BudgetItemView) {
    return {
      variant: "BudgetItem",
      params: { id: selector.id },
    } as ExpensesQueryRequestCategorySelector;
  }
  if (selector instanceof BudgetCategoryView) {
    return {
      variant: "BudgetCategory",
      params: { id: selector.id },
    } as ExpensesQueryRequestCategorySelector;
  }
  throw Error("malformed expenses query!");
}

function getExpensesQueryRequest(query: ExpensesQuery): ExpensesQueryRequest {
  switch (query.variant) {
    case "account":
      return {
        variant: "ByAccount",
        params: {
          id: query.account.id,
          year: query.year,
        },
      } as ExpensesQueryRequest;
    case "period": {
      return {
        variant: "ByPeriod",
        params: {
          period: query.period,
          category: getExpensesQueryRequestCategorySelector(
            query.categorySelector,
          ),
        },
      } as ExpensesQueryRequest;
    }
    default:
      throw Error("malformed expenses query!");
  }
}

function getExpensesTableSettings(query: ExpensesQuery): ExpensesTableSettings {
  switch (query.variant) {
    case "account":
      return { autoadvance: true, showAccount: false } as ExpensesTableSettings;
    case "period":
      return { autoadvance: false, showAccount: true } as ExpensesTableSettings;
    default:
      throw Error("malformed expenses query!");
  }
}

function parseExpensesQueryResponse(
  response: ExpensesQueryResponse,
  accounts: AccountsView,
  sortBy: SortBy,
): Array<ExpenseView> {
  const expenses = response.expenses.map((expense) => {
    const account = accounts.getAccount(expense.account_id);
    return {
      ...expense,
      account: account,
    } as ExpenseView;
  });
  const sortComparator = getSortComparator(sortBy);
  expenses.sort(sortComparator);
  return expenses;
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
        body: JSON.stringify(getExpensesQueryRequest(query)),
      });

      fetchHelper.fetch(request, (json) => {
        const sortedExpenses = parseExpensesQueryResponse(
          json as ExpensesQueryResponse,
          accounts,
          sortBy,
        );
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
        settings={getExpensesTableSettings(query)}
      />
      <ExpensesPivotTable expenses={expenses} />
    </>
  );
}
