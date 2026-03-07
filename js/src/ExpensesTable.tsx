import React from "react";
import { useState, useEffect, useRef } from "react";

import { ExpenseView } from "./ExpenseView";

import { AccountsView } from "./AccountsView";
import { useAppSettingsContext } from "./AppSettings";
import { BudgetView } from "./BudgetView";
import { SortBy, SortField, SortOrder } from "./ExpensesSort";

import { CategorizationPane } from "./CategorizationPane";

import * as UI from "./ui/Common";

function ExpenseRowCells({
  expense,
  budget,
  accounts,
}: {
  expense: ExpenseView;
  budget: BudgetView;
  accounts: AccountsView | null;
}) {
  const budgetItemID = expense.budget_item_id;
  const budgetItemName =
    budgetItemID !== null ? budget.getItem(budgetItemID).displayName : "";

  const dateTime =
    expense.transaction_time === null
      ? expense.transaction_date
      : expense.transaction_date + " " + expense.transaction_time;

  const fullDescription = expense.notes
    ? `[${expense.notes}] ${expense.description}`
    : expense.description;

  return (
    <>
      <td className="nowrap" title={dateTime}>
        {expense.transaction_date}
      </td>

      <td>{budgetItemName}</td>

      <UI.CurrencyCell value={expense.amount} softNegatives={false} />

      {accounts && <td>{accounts.getAccount(expense.account_id).name}</td>}

      <td>
        {expense.notes && <UI.Glyph glyph="notes" size={18} />}
        {expense.notes && " "}
        {fullDescription}
      </td>
    </>
  );
}

export type ExpensesTableSettings = {
  // if set to true, advance to next row on category change
  autoadvance: boolean;
  showAccount: boolean;
};

export function ExpensesTable({
  budget,
  accounts,
  expenses,
  onExpenseCategoryChange,
  onExpenseNotesChange,
  onExpenseDelete,
  updateSortBy,
  settings,
}: {
  budget: BudgetView;
  accounts: AccountsView;
  expenses: Array<ExpenseView>;
  onExpenseCategoryChange: () => void;
  onExpenseNotesChange: () => void;
  onExpenseDelete: () => void;
  updateSortBy: (SortBy) => void;
  settings: ExpensesTableSettings;
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
  const activeExpense = activeRow !== null ? expenses[activeRow] : null;

  const setAndScrollToActiveRow = (rowIdx: number | null) => {
    if (rowIdx === null) {
      setActiveRow(null);
      return;
    }

    const map = getExpensesRefMap();
    const row = map.get(rowIdx);

    if (row === null || row === undefined) {
      console.log(`Unexpected empty DOM reference to row ${rowIdx}`);
      return;
    }

    row.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });

    setActiveRow(rowIdx);
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

  const sortByField = (field: SortField) => {
    return (order: SortOrder) => {
      const newSortBy = { field: field, order: order } as SortBy;
      updateSortBy(newSortBy);
    };
  };

  const showAccount = settings.showAccount;

  const useStickyHeaders = useAppSettingsContext().stickyHeaders;

  return (
    <>
      <UI.Table striped topAligned>
        <colgroup>
          <UI.Col widthPct={7} />
          <UI.Col widthPct={showAccount ? 15 : 20} />
          <UI.Col widthPct={7} />
          {showAccount && <UI.Col widthPct={10} />}
          <UI.Col />
        </colgroup>

        <thead className={UI.cx(useStickyHeaders && "sticky-header")}>
          <tr>
            <HeaderCell
              title="Date"
              sortByField={sortByField(SortField.DateTime)}
            />
            <HeaderCell title="Category" sortByField={null} />
            <HeaderCell
              title="Amount"
              sortByField={sortByField(SortField.Amount)}
              alignRight
            />
            {showAccount && (
              <HeaderCell
                title="Account"
                sortByField={sortByField(SortField.Account)}
              />
            )}
            <HeaderCell
              title="Details"
              sortByField={sortByField(SortField.Description)}
            />
          </tr>
        </thead>

        <tbody>
          {expenses.map((expense, idx) => (
            <tr
              key={expense.id}
              className={UI.cx(
                "table-button",
                idx === activeRow && "active-row",
              )}
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
              <ExpenseRowCells
                expense={expense}
                budget={budget}
                accounts={showAccount ? accounts : null}
              />
            </tr>
          ))}
        </tbody>
      </UI.Table>

      {activeExpense && (
        <CategorizationPane
          expense={activeExpense}
          close={() => setAndScrollToActiveRow(null)}
          onExpenseCategoryChange={() => {
            if (settings.autoadvance) {
              nextRow();
            }
            onExpenseCategoryChange();
          }}
          onExpenseNotesChange={onExpenseNotesChange}
          onExpenseDelete={onExpenseDelete}
          budget={budget}
        />
      )}
    </>
  );
}
function HeaderCell({
  title,
  sortByField,
  alignRight,
}: {
  title: string;
  sortByField: ((SortOrder) => void) | null;
  alignRight?: boolean;
}) {
  const sortButtons = sortByField && (
    <>
      <UI.InlineGlyphButton
        glyph="arrow-down"
        onClick={() => sortByField(SortOrder.Desc)}
      />
      <UI.InlineGlyphButton
        glyph="arrow-up"
        onClick={() => sortByField(SortOrder.Asc)}
      />
    </>
  );

  return (
    <th>
      <UI.Flex className={UI.cx(alignRight && "r-align")}>
        {title}
        {sortButtons}
      </UI.Flex>
    </th>
  );
}
