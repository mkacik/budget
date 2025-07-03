import React from "react";
import { useState, useEffect } from "react";

import { Expense } from "./types/Expense";

import { BudgetView, BudgetItemView } from "./BudgetView";

import { Col } from "./ui/Common";

const CHARS = "1234567890qwertyuiopasdfghjklzxcvbnm".split("");

type KeyMap = Map<string, BudgetItemView | null>;

function getKeyMap(budget: BudgetView): KeyMap {
  const keyMap: KeyMap = new Map([["Backspace", null]]);

  const items = [budget.items, budget.ignoredItems].flat();
  for (const [idx, item] of items.entries()) {
    if (idx < CHARS.length) {
      keyMap.set(CHARS[idx], item);
    } else {
      break;
    }
  }

  return keyMap;
}

function KeyMapLegend({
  setCategory,
  keyMap,
}: {
  setCategory: (id: number | null) => void;
  keyMap: KeyMap;
}) {
  const rows: Array<React.ReactNode> = [];
  for (const [key, item] of keyMap.entries()) {
    const row = (
      <tr key={key} onClick={() => setCategory(item?.id || null)}>
        <td>
          <b>{key}</b>
        </td>
        <td>{item?.displayName ?? <i>delete categorization</i>}</td>
      </tr>
    );
    rows.push(row);
  }

  return (
    <div className="legend-container">
      <div className="card legend">
        <table className="legend-table">{rows}</table>
      </div>
    </div>
  );
}

function BudgetItemOption({ item }: { item: BudgetItemView }) {
  return <option value={item.id}>{item.displayName}</option>;
}

function BudgetItemSelectOptions({ budget }: { budget: BudgetView }) {
  const spacer =
    budget.ignoredItems.length > 0 ? (
      <option value="" disabled>
        — ignored items below —
      </option>
    ) : null;

  return (
    <>
      {budget.items.map((item) => (
        <BudgetItemOption key={item.id} item={item} />
      ))}
      {spacer}
      {budget.ignoredItems.map((item) => (
        <BudgetItemOption key={item.id} item={item} />
      ))}
    </>
  );
}

function BudgetItemSelect({
  selectedBudgetItemID,
  updateBudgetItemID,
  budget,
}: {
  selectedBudgetItemID: number | null;
  updateBudgetItemID: (newBudgetItemID: number | null) => void;
  budget: BudgetView;
}) {
  const UNSET_ID = 0;
  const keyMap = getKeyMap(budget);

  useEffect(() => {
    const handleInput = (e) => {
      if (keyMap.has(e.key)) {
        const itemID = keyMap.get(e.key)?.id ?? null;
        updateBudgetItemID(itemID);
      }
    };
    document.addEventListener("keydown", handleInput);

    return () => document.removeEventListener("keydown", handleInput);
  });

  const onSelectChange = (e: React.SyntheticEvent): void => {
    const elem = e.target as HTMLSelectElement;
    const id = Number(elem.value);
    const newBudgetItemID = id === UNSET_ID ? null : id;
    updateBudgetItemID(newBudgetItemID);
  };

  return (
    <>
      <KeyMapLegend setCategory={updateBudgetItemID} keyMap={keyMap} />
      <select
        value={selectedBudgetItemID ?? UNSET_ID}
        onChange={onSelectChange}
      >
        <option value={UNSET_ID}>-</option>
        <BudgetItemSelectOptions budget={budget} />
      </select>
    </>
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
      <BudgetItemSelect
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
    <tr className={active ? "active-row" : undefined} onClick={onClick}>
      <td className="nowrap" title={dateTime}>
        {expense.transaction_date}
      </td>
      {budgetItemCell}
      <td className="number r-align">{expense.amount.toFixed(2)}</td>
      <td>{expense.description}</td>
    </tr>
  );
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
    const handleNavigationKeys = (e) => {
      switch (e.key) {
        case "ArrowLeft":
        case "ArrowUp": {
          prevRow();
          return;
        }
        case "ArrowRight":
        case "ArrowDown": {
          nextRow();
          return;
        }
        case "PageUp": {
          setActiveRow(0);
          return;
        }
        case "PageDown": {
          setActiveRow(expenses.length - 1);
          return;
        }
        case "Escape": {
          setActiveRow(null);
          return;
        }
      }
    };
    document.addEventListener("keydown", handleNavigationKeys);

    return () => document.removeEventListener("keydown", handleNavigationKeys);
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
          <th className="r-align">Amount</th>
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
            onClick={() =>
              idx === activeRow ? setActiveRow(null) : setActiveRow(idx)
            }
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
