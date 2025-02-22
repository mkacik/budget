import React from "react";
import { useState, useEffect } from "react";

import { Account } from "./types/Account";
import { Accounts } from "./types/Accounts";
import { Expense } from "./types/Expense";
import { Expenses } from "./types/Expenses";

import { BudgetItemDB } from "./BudgetView";

function AccountSelector({
  accounts,
  selected,
  updateAccount,
}: {
  accounts: Array<Account>;
  selected: Account;
  updateAccount: (Account) => void;
}) {
  const accountsByID = new Map(
    accounts.map((account) => [account.id, account]),
  );

  const onSelectChange = (e: React.SyntheticEvent) => {
    const elem = e.target as HTMLSelectElement;
    const id = Number(elem.value);
    const newAccount = accountsByID.get(id)!;
    updateAccount(newAccount);
  };

  return (
    <select onChange={onSelectChange} value={selected.id}>
      {accounts.map((account, idx) => (
        <option key={idx} value={account.id}>
          {account.name}
        </option>
      ))}
    </select>
  );
}

function BudgetItemSelector({
  budgetItems,
  selectedBudgetItemID,
  updateBudgetItemID,
}: {
  budgetItems: BudgetItemDB;
  selectedBudgetItemID: number | null;
  updateBudgetItemID: (newBudgetItemID: number | null) => void;
}) {
  const UNSET = 0;

  const onSelectChange = (e: React.SyntheticEvent): void => {
    const elem = e.target as HTMLSelectElement;
    const id = Number(elem.value);
    const newBudgetItemID = id === UNSET ? null : id;
    updateBudgetItemID(newBudgetItemID);
  };

  const options = budgetItems.items.map((item, idx) => (
    <option key={idx} value={item.id}>
      {item.displayName}
    </option>
  ));

  const selectedID = selectedBudgetItemID ?? UNSET;
  return (
    <select value={selectedID} onChange={onSelectChange}>
      <option value={UNSET}>-</option>
      {options}
    </select>
  );
}

function ExpenseRow({
  expense,
  active,
  budgetItems,
  bumpUpdates,
  onClick,
}: {
  expense: Expense;
  active: boolean;
  budgetItems: BudgetItemDB;
  bumpUpdates: () => void;
  onClick: () => void;
}) {
  const budgetItemID = expense.budget_item_id;
  const budgetItemName =
    budgetItemID !== null ? budgetItems.get(budgetItemID).displayName : "";

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
        bumpUpdates();
      } else {
        console.log(response);
      }
    });
  };

  const budgetItemElem = active ? (
    <BudgetItemSelector
      budgetItems={budgetItems}
      selectedBudgetItemID={budgetItemID}
      updateBudgetItemID={updateBudgetItemID}
    />
  ) : (
    <input type="text" disabled value={budgetItemName} />
  );

  return (
    <div onClick={onClick}>
      <span>{expense.transaction_date}</span>
      {" | "}
      {budgetItemElem}
      {" | "}
      <span>{expense.amount}</span>
      {" | "}
      <span>{expense.description}</span>
    </div>
  );
}

function ExpensesTable({
  expenses,
  budgetItems,
  bumpUpdates,
}: {
  expenses: Array<Expense>;
  budgetItems: BudgetItemDB;
  bumpUpdates: () => void;
}) {
  const [activeRow, setActiveRow] = useState<number>(0);

  return (
    <div>
      {expenses.map((expense, idx) => (
        <ExpenseRow
          key={idx}
          expense={expense}
          active={idx === activeRow}
          budgetItems={budgetItems}
          onClick={() => setActiveRow(idx)}
          bumpUpdates={() => {
            setActiveRow(activeRow + 1);
            bumpUpdates();
          }}
        />
      ))}
    </div>
  );
}

export function ExpensesCard({
  allAccounts,
  budgetItems,
}: {
  allAccounts: Accounts;
  budgetItems: BudgetItemDB;
}) {
  const accounts = allAccounts.accounts;

  const [account, setAccount] = useState<Account>(accounts[0]!);
  const [expenses, setExpenses] = useState<Array<Expense>>([]);
  const [updates, setUpdates] = useState<number>(0);

  const fetchExpenses = () => {
    fetch(`/api/accounts/${account.id}/expenses`)
      .then((response) => response.json())
      .then((result) => {
        console.log(result);
        const expenses = result as Expenses;
        setExpenses(expenses.expenses);
      });
  };

  useEffect(() => {
    fetchExpenses();
  }, [account, setAccount, updates]);

  const updateAccount = (newAccount: Account) => {
    setAccount(newAccount);
  };

  const bumpUpdates = () => {
    setUpdates(updates + 1);
  };

  return (
    <div>
      <AccountSelector
        accounts={accounts}
        selected={account}
        updateAccount={updateAccount}
      />
      <div>
        <b>{account.name}</b>
      </div>
      <ExpensesTable
        expenses={expenses}
        budgetItems={budgetItems}
        bumpUpdates={bumpUpdates}
      />
    </div>
  );
}
