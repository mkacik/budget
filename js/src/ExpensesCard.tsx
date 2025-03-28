import React from "react";
import { useState, useEffect } from "react";

import { Account, Accounts } from "./types/Account";
import { Expense, Expenses } from "./types/Expense";

import { BudgetItemDB } from "./BudgetView";
import {
  Form,
  FormButtons,
  ItemCard,
  InlineGlyphButton,
  ErrorCard,
  ModalCard,
} from "./ui/Common";

export function AccountSelector({
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

function StatementImportForm({
  account,
  onSuccess,
}: {
  account: Account;
  onSuccess: () => void;
}) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const clearErrorMessage = () => {
    if (errorMessage !== null) {
      setErrorMessage(null);
    }
  };

  const onSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    setLoading(true);
    fetch(`api/accounts/${account.id}/expenses`, {
      method: "POST",
      body: new FormData(form),
    }).then((response) => {
      setLoading(false);
      form.reset();
      if (response.ok) {
        clearErrorMessage();
        onSuccess();
      } else {
        response
          .json()
          .then((json) => {
            const message = json.error ?? "Something went wrong!";
            setErrorMessage(message);
          })
          .catch((error) => {
            console.log(response, error);
            setErrorMessage("Something went wrong.");
          });
      }
    });
  };

  if (loading) {
    return "LOADING";
  }

  return (
    <>
      <ErrorCard message={errorMessage} />
      <Form onSubmit={onSubmit}>
        <label htmlFor="file">Choose statement to upload (.csv,.txt)</label>
        <input type="file" id="file" name="file" accept=".csv,.CSV,.txt,.TXT" />
        <FormButtons>
          <input className="button" type="submit" value="Upload" />
        </FormButtons>
      </Form>
    </>
  );
}

function ExpenseRow({
  expense,
  active,
  budgetItems,
  onClick,
  onSuccess,
}: {
  expense: Expense;
  active: boolean;
  budgetItems: BudgetItemDB;
  onClick: () => void;
  onSuccess: () => void;
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
        onSuccess();
      } else {
        console.log(response);
      }
    });
  };

  const budgetItemCell = active ? (
    <td className="category">
      <BudgetItemSelector
        budgetItems={budgetItems}
        selectedBudgetItemID={budgetItemID}
        updateBudgetItemID={updateBudgetItemID}
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

function ExpensesTable({
  expenses,
  budgetItems,
  onSuccess,
}: {
  expenses: Array<Expense>;
  budgetItems: BudgetItemDB;
  onSuccess: () => void;
}) {
  const [activeRow, setActiveRow] = useState<number>(0);

  if (expenses.length == 0) {
    return <div>Import expenses to start categorizing</div>;
  }

  return (
    <table className="expenses-table">
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
            key={idx}
            expense={expense}
            active={idx === activeRow}
            budgetItems={budgetItems}
            onClick={() => setActiveRow(idx)}
            onSuccess={() => {
              setActiveRow(activeRow + 1);
              onSuccess();
            }}
          />
        ))}
      </tbody>
    </table>
  );
}

export function StatementImportButton({
  account,
  onImportSuccess,
}: {
  account: Account;
  onImportSuccess: () => void;
}) {
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const onSuccess = () => {
    onImportSuccess();
    setModalVisible(false);
  };

  return (
    <>
      <small>
        <InlineGlyphButton
          glyph="add"
          text="import expenses"
          onClick={() => setModalVisible(true)}
        />
      </small>
      <ModalCard
        title="Import Expenses"
        visible={modalVisible}
        hideModal={() => setModalVisible(false)}
      >
        <StatementImportForm account={account} onSuccess={onSuccess} />
      </ModalCard>
    </>
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

  const [account, setAccount] = useState<Account>(accounts[0] || null);
  const [expenses, setExpenses] = useState<Array<Expense>>([]);
  const [updates, setUpdates] = useState<number>(0);

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
  }, [account, setAccount, updates]);

  if (account === null) {
    return <>{"Add accounts to enable imports"}</>;
  }

  return (
    <>
      <ItemCard>
        Account
        <AccountSelector
          accounts={accounts}
          selected={account}
          updateAccount={updateAccount}
        />
        <StatementImportButton
          account={account}
          onImportSuccess={fetchExpenses}
        />
      </ItemCard>

      <ExpensesTable
        expenses={expenses}
        budgetItems={budgetItems}
        onSuccess={fetchExpenses}
      />
    </>
  );
}
