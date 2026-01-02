import React from "react";
import { useEffect } from "react";

import { BudgetView, BudgetItemView } from "./BudgetView";

const CHARS = "1234567890qwertyuiopasdfghjklzxcvbnm".split("");

type KeyMap = Map<string, BudgetItemView | null>;

function getKeyMap(budget: BudgetView): KeyMap {
  const keyMap: KeyMap = new Map();

  const items = [budget.items, budget.ignoredItems].flat();
  for (const [idx, item] of items.entries()) {
    if (item.isBudgetOnly) {
      continue;
    }
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
      {budget.items.map(
        (item) =>
          !item.isBudgetOnly && <BudgetItemOption key={item.id} item={item} />,
      )}
      {spacer}
      {budget.ignoredItems.map((item) => (
        <BudgetItemOption key={item.id} item={item} />
      ))}
    </>
  );
}

export function BudgetItemSelect({
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
