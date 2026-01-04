import React from "react";
import { useState, useEffect, useRef } from "react";

import { ExpenseView } from "./ExpenseView";

import { AccountsView, useAccountsViewContext } from "./AccountsView";
import { BudgetView } from "./BudgetView";
import { SortBy, SortField, SortOrder } from "./ExpensesSort";

import { BudgetItemSelect } from "./BudgetItemSelect";
import { JSON_HEADERS, FetchHelper } from "./Common";
import {
  Col,
  ErrorCard,
  SmallInlineGlyph,
  InlineGlyphButton,
} from "./ui/Common";

function ExpenseNotesGlyph({
  description,
  notes,
  setNotes,
  isActiveRow,
}: {
  description: string;
  notes: string | null;
  setNotes: (notes: string | null) => void;
  isActiveRow: boolean;
}) {
  if (isActiveRow === false) {
    if (notes === null) {
      return null;
    }

    return <SmallInlineGlyph glyph="notes" />;
  }

  const onClickEditButton = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    const promptMessage = `Add note for: ${description}`;
    const newNotes = prompt(promptMessage, notes || undefined);

    // pressing cancel returns null
    if (newNotes === null) {
      return;
    }

    const sanitized = newNotes === "" ? null : newNotes;
    if (sanitized !== notes) {
      setNotes(sanitized);
    }
  };

  return <SmallInlineGlyph glyph="edit_note" onClick={onClickEditButton} />;
}

function ExpenseRow({
  expense,
  active,
  onExpenseCategoryChange,
  onExpenseNotesChange,
  onExpenseDelete,
  budget,
  accounts,
}: {
  expense: ExpenseView;
  active: boolean;
  onExpenseCategoryChange: () => void;
  onExpenseNotesChange: () => void;
  onExpenseDelete: () => void;
  budget: BudgetView;
  accounts: AccountsView | null;
}) {
  const budgetItemID = expense.budget_item_id;
  const budgetItemName =
    budgetItemID !== null ? budget.getItem(budgetItemID).displayName : "";

  const setErrorMessage = (msg: string | null) => msg && alert(msg);
  const fetchHelper = new FetchHelper(setErrorMessage);

  const updateBudgetItemID = (newBudgetItemID: number | null) => {
    const request = new Request(`/api/expenses/${expense.id}/category`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ budget_item_id: newBudgetItemID }),
    });
    fetchHelper.fetch(request, (json) => onExpenseCategoryChange());
  };

  const updateNotes = (newNotes: string | null) => {
    const request = new Request(`/api/expenses/${expense.id}/notes`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ notes: newNotes }),
    });
    fetchHelper.fetch(request, (json) => onExpenseNotesChange());
  };

  const deleteExpense = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    if (!confirm(`Do you really want to delete: ${expense.description}?`)) {
      return;
    }

    const request = new Request(`/api/expenses/${expense.id}`, {
      method: "DELETE",
    });
    fetchHelper.fetch(request, (json) => onExpenseDelete());
  };

  const dateTime =
    expense.transaction_time === null
      ? expense.transaction_date
      : expense.transaction_date + " " + expense.transaction_time;

  const fullDescription = expense.notes
    ? `[${expense.notes}] ${expense.description}`
    : expense.description;

  const showDeleteButton = active && expense.account.account_type === "Cash";

  return (
    <>
      <td className="nowrap" title={dateTime}>
        {expense.transaction_date}
      </td>

      {active ? (
        <td className="category">
          <BudgetItemSelect
            selectedBudgetItemID={budgetItemID}
            updateBudgetItemID={updateBudgetItemID}
            budget={budget}
          />
        </td>
      ) : (
        <td>{budgetItemName}</td>
      )}

      <td className="number r-align">{expense.amount.toFixed(2)}</td>

      {accounts && <td>{accounts.getAccount(expense.account_id).name}</td>}

      <td className="flexrow">
        <ExpenseNotesGlyph
          description={expense.description}
          notes={expense.notes}
          setNotes={updateNotes}
          isActiveRow={active}
        />
        {showDeleteButton && (
          <SmallInlineGlyph glyph="delete" onClick={deleteExpense} />
        )}
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
  expenses,
  onExpenseCategoryChange,
  onExpenseNotesChange,
  onExpenseDelete,
  updateSortBy,
  settings,
}: {
  budget: BudgetView;
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

  const sortByField = (field: SortField) => {
    return (order: SortOrder) => {
      const newSortBy = { field: field, order: order } as SortBy;
      updateSortBy(newSortBy);
    };
  };

  const showAccount = settings.showAccount;
  const accountsView = useAccountsViewContext();

  return (
    <table className="expenses-table">
      <colgroup>
        <Col widthPct={7} />
        <Col widthPct={showAccount ? 15 : 20} />
        <Col widthPct={7} />
        {showAccount && <Col widthPct={10} />}
        <Col />
      </colgroup>

      <thead className={"sticky-header"}>
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
              onExpenseCategoryChange={() => {
                if (settings.autoadvance) {
                  nextRow();
                }
                onExpenseCategoryChange();
              }}
              onExpenseNotesChange={onExpenseNotesChange}
              onExpenseDelete={onExpenseDelete}
              accounts={showAccount ? accountsView : null}
            />
          </tr>
        ))}
      </tbody>
    </table>
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
  const className = alignRight ? "r-align flexrow" : "flexrow";
  const sortButtonss =
    sortByField === null ? null : (
      <>
        <InlineGlyphButton
          glyph="arrow_downward"
          onClick={() => sortByField(SortOrder.Desc)}
        />
        <InlineGlyphButton
          glyph="arrow_upward"
          onClick={() => sortByField(SortOrder.Asc)}
        />
      </>
    );

  return (
    <th>
      <div className={className}>
        {title}
        {sortButtonss}
      </div>
    </th>
  );
}
