import React from "react";
import { useState, useEffect } from "react";

import { Expense, Expenses } from "./types/Expense";

import {
  getSortComparator,
  SortBy,
  SortField,
  SortOrder,
} from "./ExpensesSort";
import { ExpensesTableSettings, ExpensesTable } from "./ExpensesTable";

import {
  ImportExpensesButton,
  DeleteExpensesButton,
} from "./AccountExpensesButtons";
import { Section } from "./ui/Common";

import { BudgetItemView } from "./BudgetView";
import { AccountView } from "./AccountsView";

export type ExpensesQuery =
  | { variant: "account"; account: AccountView }
  | { variant: "item-month"; budgetItem: BudgetItemView; month: string };

function getFetchExpenses(query: ExpensesQuery): Promise<Response> {
  switch (query.variant) {
    case "account":
      return fetch(`/api/accounts/${query.account.id}/expenses`);
    case "item-month":
      return fetch(
        `/api/expenses/monthly/${query.budgetItem.id}/${query.month}`,
      );
    default:
      throw new Error("malformed expenses query!");
  }
}

function getExpensesTableSettings(query: ExpensesQuery): ExpensesTableSettings {
  switch (query.variant) {
    case "account":
      return { autoadvance: true } as ExpensesTableSettings;
    case "item-month":
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

  const fetchExpenses = () => {
    getFetchExpenses(query)
      .then((response) => response.json())
      .then((result) => {
        const expensesContainer = result as Expenses;
        const sortComparator = getSortComparator(sortBy);
        const sortedExpenses =
          expensesContainer.expenses.toSorted(sortComparator);
        setExpenses(sortedExpenses);
      })
      .catch((error) => console.log(error));
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
