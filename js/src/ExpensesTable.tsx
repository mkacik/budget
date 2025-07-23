import React from "react";
import { useState, useEffect, useRef } from "react";

import { Expense } from "./types/Expense";

import { BudgetView, BudgetItemView } from "./BudgetView";

import { Col } from "./ui/Common";

const CHARS = "1234567890qwertyuiopasdfghjklzxcvbnm".split("");

type KeyMap = Map<string, BudgetItemView | null>;

function getKeyMap(budget: BudgetView): KeyMap {
  const keyMap: KeyMap = new Map();

  const items = [budget.items, budget.ignoredItems].flat();
  for (const [idx, item] of items.entries()) {
    if (idx < CHARS.length) {
      keyMap.set(CHARS[idx], item);
    } else {
      break;
    }
  }
  keyMap.set("Backspace", null);

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
        <table className="legend-table">
          <thead>
            <tr>
              <td>Key</td>
              <td>Category</td>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
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
  onSuccess,
  budget,
}: {
  expense: Expense;
  active: boolean;
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
    <>
      <td className="nowrap" title={dateTime}>
        {expense.transaction_date}
      </td>
      {budgetItemCell}
      <td className="number r-align">{expense.amount.toFixed(2)}</td>
      <td>{expense.description}</td>
    </>
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
  // following stores a map of references to rendered expense, for the purpose of scrolling
  // the expense into view when it becomes active. Pattern comes from this guide:
  // https://react.dev/learn/manipulating-the-dom-with-refs#example-scrolling-to-an-element
  const expensesRefMap = useRef<Map<number, HTMLTableRowElement> | null>(null);

  const getExpensesRefMap = () => {
    if (!expensesRefMap.current) {
      expensesRefMap.current = new Map();
    }
    return expensesRefMap.current;
  };

  const [activeRow, setActiveRow] = useState<number | null>(null);

  const setAndScrollToActiveRow = (newActiveRow: number | null) => {
    if (newActiveRow !== null) {
      const map = getExpensesRefMap();
      const row = map.get(newActiveRow);

      if (row === null || row === undefined) {
        console.log(`Unexpected empty DOM reference to row ${newActiveRow}`);
      } else {
        row.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
    setActiveRow(newActiveRow);
  };

  const prevRow = () => {
    if (activeRow !== null) {
      setAndScrollToActiveRow(Math.max(activeRow - 1, 0));
    }
  };

  const nextRow = () => {
    if (activeRow !== null) {
      setAndScrollToActiveRow(Math.min(activeRow + 1, expenses.length - 1));
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
          setAndScrollToActiveRow(0);
          return;
        }
        case "PageDown": {
          setAndScrollToActiveRow(expenses.length - 1);
          return;
        }
        case "Escape": {
          setAndScrollToActiveRow(null);
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
          <tr
            key={expense.id}
            className={idx === activeRow ? "active-row" : undefined}
            onClick={() =>
              idx === activeRow
                ? setAndScrollToActiveRow(null)
                : setAndScrollToActiveRow(idx)
            }
            ref={(node: HTMLTableRowElement) => {
              const map = getExpensesRefMap();
              map.set(idx, node);

              return () => {
                map.delete(idx);
              };
            }}
          >
            <ExpenseRow
              expense={expense}
              active={idx === activeRow}
              budget={budget}
              onSuccess={() => {
                nextRow();
                onSuccess();
              }}
            />
          </tr>
        ))}
      </tbody>
    </table>
  );
}
