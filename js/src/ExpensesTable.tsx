import React from "react";
import { useState, useEffect } from "react";

import { Expense } from "./types/Expense";

import { BudgetView, BudgetItemView } from "./BudgetView";

function BudgetItemOptions({ budget }: { budget: BudgetView }) {
  const items = budget.categories.map((category) => category.items).flat();
  const ignoredItems = budget.ignoredCategories
    .map((category) => category.items)
    .flat();

  const spacer =
    items.length > 0 && ignoredItems.length > 0 ? (
      <option value="" disabled>
        — ignored items below —
      </option>
    ) : null;

  const getOption = (item: BudgetItemView) => {
    return (
      <option key={item.id} value={item.id}>
        {item.displayName}
      </option>
    );
  };

  return (
    <>
      {items.map((item) => getOption(item))}
      {spacer}
      {ignoredItems.map((item) => getOption(item))}
    </>
  );
}

function BudgetItemSelector({
  selectedBudgetItemID,
  updateBudgetItemID,
  budget,
}: {
  selectedBudgetItemID: number | null;
  updateBudgetItemID: (newBudgetItemID: number | null) => void;
  budget: BudgetView;
}) {
  const UNSET = 0;

  const onSelectChange = (e: React.SyntheticEvent): void => {
    const elem = e.target as HTMLSelectElement;
    const id = Number(elem.value);
    const newBudgetItemID = id === UNSET ? null : id;
    updateBudgetItemID(newBudgetItemID);
  };

  const selectedID = selectedBudgetItemID ?? UNSET;
  return (
    <select value={selectedID} onChange={onSelectChange}>
      <option value={UNSET}>-</option>
      <BudgetItemOptions budget={budget} />
    </select>
  );
}

function ExpenseRow({
  expense,
  active,
  onClick,
  onSuccess,
  budget,
}: {
  expense: Expense;
  active: boolean;
  onClick: () => void;
  onSuccess: () => void;
  budget: BudgetView;
}) {
  const budgetItemID = expense.budget_item_id;
  const budgetItemName =
    budgetItemID !== null ? budget.getItem(budgetItemID).displayName : "";

  const updateBudgetItemID = (newBudgetItemID: number | null) => {
    console.log(newBudgetItemID);
    fetch(`/api/expenses/${expense.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ budget_item_id: newBudgetItemID }),
    }).then((response) => {
      if (response.ok) {
        onSuccess();
      } else {
        console.log(response);
      }
    });
  };

  const budgetItemCell = active ? (
    <td className="category">
      <BudgetItemSelector
        selectedBudgetItemID={budgetItemID}
        updateBudgetItemID={updateBudgetItemID}
        budget={budget}
      />
    </td>
  ) : (
    <td>{budgetItemName}</td>
  );

  const dateTime =
    expense.transaction_time === null
      ? expense.transaction_date
      : expense.transaction_date + " " + expense.transaction_time;

  return (
    <tr onClick={onClick}>
      <td className="date" title={dateTime}>
        {expense.transaction_date}
      </td>
      {budgetItemCell}
      <td className="number align-right">{expense.amount.toFixed(2)}</td>
      <td>{expense.description}</td>
    </tr>
  );
}

function Col({ widthPct }: { widthPct?: number }) {
  if (widthPct === undefined) {
    return <col />;
  }
  const width = `${widthPct}%`;
  return <col style={{ width: width }} />;
}

export function ExpensesTable({
  expenses,
  onSuccess,
  budget,
}: {
  expenses: Array<Expense>;
  onSuccess: () => void;
  budget: BudgetView;
}) {
  const [activeRow, setActiveRow] = useState<number | null>(null);

  const prevRow = () => {
    if (activeRow !== null) {
      setActiveRow(Math.max(activeRow - 1, 0));
    }
  };

  const nextRow = () => {
    if (activeRow !== null) {
      setActiveRow(Math.min(activeRow + 1, expenses.length - 1));
    }
  };

  useEffect(() => {
    const handleKeypress = (e) => {
      switch (e.key) {
        case "ArrowUp": {
          prevRow();
          return;
        }
        case "ArrowDown": {
          nextRow();
          return;
        }
      }
    };
    document.addEventListener("keydown", handleKeypress);

    return () => document.removeEventListener("keydown", handleKeypress);
  }, [expenses, activeRow, setActiveRow]);

  return (
    <table className="expenses-table">
      <colgroup>
        <Col widthPct={7} />
        <Col widthPct={20} />
        <Col widthPct={7} />
        <Col />
      </colgroup>

      <thead>
        <tr>
          <th>Date</th>
          <th>Category</th>
          <th className="align-right">Amount</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        {expenses.map((expense, idx) => (
          <ExpenseRow
            key={expense.id}
            expense={expense}
            active={idx === activeRow}
            budget={budget}
            onClick={() => setActiveRow(idx)}
            onSuccess={() => {
              nextRow();
              onSuccess();
            }}
          />
        ))}
      </tbody>
    </table>
  );
}
