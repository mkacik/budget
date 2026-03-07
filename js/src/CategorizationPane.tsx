import React from "react";
import { useEffect } from "react";

import { ExpenseView } from "./ExpenseView";
import { BudgetView, BudgetItemView } from "./BudgetView";
import { JSON_HEADERS, FetchHelper } from "./Common";

import * as UI from "./ui/Common";

const CHARS = "1234567890qwertyuiopasdfghjklzxcvbnm".split("");

type ItemKey = {
  item: BudgetItemView | null;
  key: string | null;
};

class KeyMapping {
  mapping: Map<string, BudgetItemView | null>;
  items: Array<ItemKey>;

  constructor(budget: BudgetView) {
    const mapping: Map<string, BudgetItemView | null> = new Map();
    const items: Array<ItemKey> = [];

    let assignedKeys = 0;
    const allItems = [budget.items, budget.ignoredItems].flat();
    for (const item of allItems) {
      if (item.isBudgetOnly) {
        continue;
      }

      let key: string | null = null;
      if (assignedKeys < CHARS.length) {
        key = CHARS[assignedKeys]!;
        mapping.set(key, item);
        assignedKeys += 1;
      }
      items.push({ item: item, key: key });
    }

    mapping.set("Backspace", null);
    items.push({ item: null, key: "Backspace" });

    this.mapping = mapping;
    this.items = items;
  }
}

function CategorizationTable({
  items,
  updateBudgetItemID,
}: {
  items: Array<ItemKey>;
  updateBudgetItemID: (id: number | null) => void;
}) {
  const rows: Array<React.ReactNode> = [];
  for (const itemKey of items) {
    const key = itemKey.key;
    const item = itemKey.item;

    const row = (
      <tr
        key={item?.id ?? key}
        onClick={() => updateBudgetItemID(item && item.id)}
      >
        <td>
          <b>{key}</b>
        </td>
        <td>{item?.displayName ?? <i>delete categorization</i>}</td>
      </tr>
    );
    rows.push(row);
  }

  return (
    <UI.Table largeFont striped condensed>
      <thead>
        <tr>
          <td>Key</td>
          <td>Category</td>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </UI.Table>
  );
}

function CategorizationTables({
  updateBudgetItemID,
  keyMapping,
}: {
  updateBudgetItemID: (id: number | null) => void;
  keyMapping: KeyMapping;
}) {
  useEffect(() => {
    const handleInput = (e) => {
      if (keyMapping.mapping.has(e.key)) {
        const itemID = keyMapping.mapping.get(e.key)?.id ?? null;
        updateBudgetItemID(itemID);
      }
    };
    document.addEventListener("keydown", handleInput);

    return () => document.removeEventListener("keydown", handleInput);
  });

  const items = keyMapping.items;
  if (items.length <= 20) {
    return (
      <CategorizationTable
        items={items}
        updateBudgetItemID={updateBudgetItemID}
      />
    );
  }

  const halfIdx = (items.length + 1) / 2;
  return (
    <UI.Flex className="v-top">
      <CategorizationTable
        items={items.slice(0, halfIdx)}
        updateBudgetItemID={updateBudgetItemID}
      />
      <CategorizationTable
        items={items.slice(halfIdx)}
        updateBudgetItemID={updateBudgetItemID}
      />
    </UI.Flex>
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

function Expense({ expense }: { expense: ExpenseView }) {
  return (
    <UI.Table largeFont>
      <colgroup>
        <UI.Col widthPct={1} />
        <col />
      </colgroup>
      <tbody>
        <tr>
          <th scope="row">Date</th>
          <td>{expense.transaction_date}</td>
        </tr>
        <tr>
          <th scope="row">Amount</th>
          <UI.CurrencyCell
            value={expense.amount}
            style={{ textAlign: "left" }}
          />
        </tr>
        <tr>
          <th scope="row">Description</th>
          <td>{expense.description}</td>
        </tr>
        {expense.notes && (
          <tr>
            <th scope="row">Notes</th>
            <td>{expense.notes}</td>
          </tr>
        )}
      </tbody>
    </UI.Table>
  );
}

function Container({
  close,
  children,
}: {
  close: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="side-pane-container">
      <div className="side-pane">
        <UI.Flex>
          <UI.InlineGlyphButton glyph="sidebar-collapse" onClick={close} />
          <span style={{ fontSize: "larger", fontWeight: "bolder" }}>
            Categorize
          </span>
        </UI.Flex>

        {children}
      </div>
    </div>
  );
}

const UNSET_ID: number = 0;

export function CategorizationPane({
  expense,
  close,
  onExpenseCategoryChange,
  onExpenseNotesChange,
  onExpenseDelete,
  budget,
}: {
  expense: ExpenseView;
  close: () => void;
  onExpenseCategoryChange: () => void;
  onExpenseNotesChange: () => void;
  onExpenseDelete: () => void;
  budget: BudgetView;
}) {
  const setErrorMessage = (msg: string | null) => msg && alert(msg);
  const fetchHelper = new FetchHelper(setErrorMessage);

  const updateBudgetItemID = (newBudgetItemID: number | null) => {
    const request = new Request(`/api/expenses/${expense.id}/category`, {
      method: "PUT",
      headers: JSON_HEADERS,
      body: JSON.stringify({ budget_item_id: newBudgetItemID }),
    });
    fetchHelper.fetch(request, (_json) => onExpenseCategoryChange());
  };

  const updateNotes = () => {
    const promptMessage = `Add note for: ${expense.description}`;
    const promptValue = prompt(promptMessage, expense.notes || undefined);
    if (promptValue === null) {
      return;
    }

    const newNotes = promptValue === "" ? null : promptValue;
    if (newNotes === expense.notes) {
      return;
    }

    const request = new Request(`/api/expenses/${expense.id}/notes`, {
      method: "PUT",
      headers: JSON_HEADERS,
      body: JSON.stringify({ notes: newNotes }),
    });
    fetchHelper.fetch(request, (_json) => onExpenseNotesChange());
  };

  const deleteExpense = () => {
    if (!confirm(`Do you really want to delete: ${expense.description}?`)) {
      return;
    }

    const request = new Request(`/api/expenses/${expense.id}`, {
      method: "DELETE",
    });
    fetchHelper.fetch(request, (_json) => onExpenseDelete());
  };

  const keyMapping = new KeyMapping(budget);

  const onSelectChange = (e: React.SyntheticEvent): void => {
    const elem = e.target as HTMLSelectElement;
    const id = Number(elem.value);
    const newBudgetItemID = id === UNSET_ID ? null : id;
    updateBudgetItemID(newBudgetItemID);
  };

  const showDeleteButton = expense.account.account_type === "Cash";

  return (
    <Container close={close}>
      <div style={{ flexGrow: 1 }}>
        <Expense expense={expense} />
      </div>

      <UI.Flex>
        <select
          value={expense.budget_item_id ?? UNSET_ID}
          onChange={onSelectChange}
          style={{ width: "100%" }}
        >
          <option value={UNSET_ID}>-</option>
          <BudgetItemSelectOptions budget={budget} />
        </select>

        <UI.InlineGlyphButton glyph="notes" onClick={updateNotes} />

        {showDeleteButton && (
          <UI.InlineGlyphButton glyph="delete" onClick={deleteExpense} />
        )}
      </UI.Flex>

      <CategorizationTables
        updateBudgetItemID={updateBudgetItemID}
        keyMapping={keyMapping}
      />
    </Container>
  );
}
