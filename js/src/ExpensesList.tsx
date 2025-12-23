import React from "react";
import { useState, useEffect } from "react";

import {
  Expense,
  Expenses,
  QueryExpensesRequest,
  QueryExpensesCategorySelector,
} from "./types/Expense";

import {
  ImportExpensesButton,
  DeleteExpensesButton,
} from "./AccountExpensesButtons";
import { AccountView } from "./AccountsView";
import { BudgetItemView, BudgetCategoryView } from "./BudgetView";
import {
  getSortComparator,
  SortBy,
  SortField,
  SortOrder,
} from "./ExpensesSort";
import { ExpensesTableSettings, ExpensesTable } from "./ExpensesTable";

import { ErrorCard, Section } from "./ui/Common";

export type ExpensesQuery =
  | { variant: "account"; account: AccountView }
  | {
      variant: "month";
      month: string;
      categorySelector: BudgetItemView | BudgetCategoryView | "all" | null;
    };

function getServerQueryCategorySelector(
  selector: BudgetItemView | BudgetCategoryView | "all" | null,
): QueryExpensesCategorySelector {
  if (selector === null) {
    return { variant: "Uncategorized" } as QueryExpensesCategorySelector;
  }
  if (selector === "all") {
    return { variant: "All" } as QueryExpensesCategorySelector;
  }
  if (selector instanceof BudgetItemView) {
    return {
      variant: "BudgetItem",
      params: { id: selector.id },
    } as QueryExpensesCategorySelector;
  }
  if (selector instanceof BudgetCategoryView) {
    return {
      variant: "BudgetCategory",
      params: { id: selector.id },
    } as QueryExpensesCategorySelector;
  }
  throw new Error("malformed expenses query!");
}

function getServerQueryParams(query: ExpensesQuery): QueryExpensesRequest {
  switch (query.variant) {
    case "account":
      return {
        variant: "ByAccount",
        params: {
          id: query.account.id,
        },
      } as QueryExpensesRequest;
    case "month": {
      return {
        variant: "ByMonth",
        params: {
          month: query.month,
          category: getServerQueryCategorySelector(query.categorySelector),
        },
      } as QueryExpensesRequest;
    }
    default:
      throw new Error("malformed expenses query!");
  }
}

function getExpensesTableSettings(query: ExpensesQuery): ExpensesTableSettings {
  switch (query.variant) {
    case "account":
      return { autoadvance: true } as ExpensesTableSettings;
    case "month":
      return { autoadvance: false } as ExpensesTableSettings;
    default:
      throw new Error("malformed expenses query!");
  }
}

export function ExpensesList({
  query,
  onExpenseCategoryChange,
}: {
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
      body: JSON.stringify(getServerQueryParams(query)),
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
    fetchExpenses();
  }, [query]);

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
