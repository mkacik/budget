import React from "react";
import { useState, useEffect } from "react";

import {
  Expense,
  Expenses,
  ExpensesQueryRequest,
  ExpensesQueryRequestCategorySelector,
} from "./types/Expense";

import {
  ImportExpensesButton,
  DeleteExpensesButton,
} from "./AccountExpensesButtons";
import { AccountView } from "./AccountsView";
import { BudgetView, BudgetItemView, BudgetCategoryView } from "./BudgetView";
import {
  getSortComparator,
  SortBy,
  SortField,
  SortOrder,
} from "./ExpensesSort";
import { ExpensesTableSettings, ExpensesTable } from "./ExpensesTable";

import { ErrorCard, Section } from "./ui/Common";

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
  throw new Error("malformed expenses query!");
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
      throw new Error("malformed expenses query!");
  }
}

function getExpensesTableSettings(query: ExpensesQuery): ExpensesTableSettings {
  switch (query.variant) {
    case "account":
      return { autoadvance: true, showAccount: false } as ExpensesTableSettings;
    case "period":
      return { autoadvance: false, showAccount: true } as ExpensesTableSettings;
    default:
      throw new Error("malformed expenses query!");
  }
}

export function ExpensesList({
  budget,
  query,
  onExpenseCategoryChange,
}: {
  budget: BudgetView;
  query: ExpensesQuery;
  onExpenseCategoryChange?: () => void;
}) {
  const [expenses, setExpenses] = useState<Array<Expense>>([]);
  const [sortBy, setSortBy] = useState<SortBy>({
    field: SortField.DateTime,
    order: SortOrder.Desc,
  } as SortBy);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = () => {
    setError(null);
    fetch(`/api/expenses/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(getExpensesQueryRequest(query)),
    })
      .then((response) => response.json())
      .then((result) => {
        const expensesContainer = result as Expenses;
        const sortComparator = getSortComparator(sortBy);
        const sortedExpenses =
          expensesContainer.expenses.toSorted(sortComparator);
        setExpenses(sortedExpenses);
        setError(null);
      })
      .catch((error) => {
        console.log(error);
        setError(`${error.name}: ${error.message}`);
      });
  };

  useEffect(() => {
    setExpenses([]);
    fetchExpenses();
  }, [query, budget]);

  const handleExpenseCategoryChange = () => {
    fetchExpenses();
    if (onExpenseCategoryChange) {
      onExpenseCategoryChange();
    }
  };

  const updateSortBy = (newSortBy: SortBy) => {
    const sortComparator = getSortComparator(newSortBy);
    const sortedExpenses = expenses.toSorted(sortComparator);
    setSortBy(newSortBy);
    setExpenses(sortedExpenses);
  };

  return (
    <>
      <ErrorCard message={error} />
      <ImportDeleteExpenseButtons query={query} onSuccess={fetchExpenses} />
      <ExpensesTable
        budget={budget}
        expenses={expenses}
        onExpenseCategoryChange={handleExpenseCategoryChange}
        updateSortBy={updateSortBy}
        settings={getExpensesTableSettings(query)}
      />
    </>
  );
}

function ImportDeleteExpenseButtons({
  query,
  onSuccess,
}: {
  query: ExpensesQuery;
  onSuccess: () => void;
}) {
  if (query.variant !== "account") {
    return null;
  }
  const account = query.account;

  return (
    <Section>
      <div className="flexrow">
        <ImportExpensesButton
          account={account.account}
          schema={account.statementSchema}
          onSuccess={onSuccess}
        />
        <DeleteExpensesButton account={account.account} onSuccess={onSuccess} />
      </div>
    </Section>
  );
}
