import React from "react";
import { useState, useEffect } from "react";
import { Account } from "./types/Account";
import { Accounts } from "./types/Accounts";
import { Expense } from "./types/Expense";
import { Expenses } from "./types/Expenses";

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
    <select onChange={onSelectChange} value={selected.id!}>
      {accounts.map((account, idx) => (
        <option key={idx} value={account.id!}>
          {account.name}
        </option>
      ))}
    </select>
  );
}

function ExpensesTable({ expenses }: { expenses: Array<Expense> }) {
  return (
    <div>
      {expenses.map((expense, idx) => (
        <div key={idx}>
          <span>{expense.transaction_date}</span>
          {" | "}
          <span>{expense.description}</span>
          {" | "}
          <span>{expense.amount}</span>
        </div>
      ))}
    </div>
  );
}

export function ExpensesCard({ allAccounts }: { allAccounts: Accounts }) {
  const accounts = allAccounts.accounts;

  const [account, setAccount] = useState<Account>(accounts[0]!);
  const [expenses, setExpenses] = useState<Array<Expense>>([]);

  useEffect(() => {
    fetch("/api/expenses/" + account.id!)
      .then((response) => response.json())
      .then((result) => {
        console.log(result);
        const expenses = result as Expenses;
        setExpenses(expenses.expenses);
      });
  }, [account, setAccount]);

  const updateAccount = (newAccount: Account) => {
    setAccount(newAccount);
  };

  return (
    <div>
      <AccountSelector
        accounts={accounts}
        selected={account}
        updateAccount={updateAccount}
      />
      <div><b>{account.name}</b></div>
      <ExpensesTable expenses={expenses} />
    </div>
  );
}
