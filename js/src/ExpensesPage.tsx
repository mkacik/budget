import React from "react";
import { useState, useEffect } from "react";

import { Account } from "./types/Account";
import { StatementSchema } from "./types/StatementSchema";
import { Expense, Expenses } from "./types/Expense";

import { BudgetView } from "./BudgetView";
import { ExpensesTable } from "./ExpensesTable";
import {
  ImportExpensesButton,
  DeleteExpensesButton,
} from "./AccountExpensesButtons";
import { Section, SectionHeader } from "./ui/Common";

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

function getSchemaById(
  id: number | null,
  schemas: Array<StatementSchema>,
): StatementSchema | null {
  if (id === null) {
    return null;
  }

  const schema = schemas.find((schema) => schema.id == id);
  if (schema === undefined || schema === null) {
    return null;
  }

  return schema;
}

export function ExpensesPage({
  accounts,
  schemas,
  budget,
}: {
  accounts: Array<Account>;
  schemas: Array<StatementSchema>;
  budget: BudgetView;
}) {
  const [account, setAccount] = useState<Account>(accounts[0] || null);
  const [expenses, setExpenses] = useState<Array<Expense>>([]);

  const updateAccount = (newAccount: Account) => {
    setAccount(newAccount);
  };

  const fetchExpenses = () => {
    if (account !== null) {
      fetch(`/api/accounts/${account.id}/expenses`)
        .then((response) => response.json())
        .then((result) => {
          console.log(result);
          const expenses = result as Expenses;
          setExpenses(expenses.expenses);
        });
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [account, setAccount]);

  if (account === null) {
    return <>{"Add accounts to enable imports and start categorizing"}</>;
  }

  return (
    <>
      <Section>
        <SectionHeader>Expenses</SectionHeader>
        <div className="flexrow">
          Account
          <AccountSelector
            accounts={accounts}
            selected={account}
            updateAccount={updateAccount}
          />
          <ImportExpensesButton
            account={account}
            schema={getSchemaById(account.statement_schema_id, schemas)}
            onImportSuccess={fetchExpenses}
          />
          <DeleteExpensesButton
            account={account}
            onImportSuccess={fetchExpenses}
          />
        </div>
      </Section>

      <Section>
        {expenses.length > 0 ? (
          <ExpensesTable
            key={account.id}
            expenses={expenses}
            onSuccess={fetchExpenses}
            budget={budget}
          />
        ) : (
          <div>Import expenses to start categorizing</div>
        )}
      </Section>
    </>
  );
}
