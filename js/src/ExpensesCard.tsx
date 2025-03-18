import React from "react";
import { useState, useEffect } from "react";

import { Account, Accounts } from "./types/Account";
import { Expense, Expenses } from "./types/Expense";

import { BudgetItemDB } from "./BudgetView";
import { ErrorCard, ModalCard } from "./ui/Common";

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
      <form name="statement" onSubmit={onSubmit}>
        <input type="file" name="file" accept=".csv,.CSV,.txt,.TXT" />
        <input type="submit" value="Submit" />
      </form>
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

  const budgetItemElem = active ? (
    <BudgetItemSelector
      budgetItems={budgetItems}
      selectedBudgetItemID={budgetItemID}
      updateBudgetItemID={updateBudgetItemID}
    />
  ) : (
    budgetItemName
  );

  const dateTime =
    expense.transaction_time === null
      ? expense.transaction_date
      : expense.transaction_date + " " + expense.transaction_time;

  return (
    <tr className="row" onClick={onClick}>
      <td className="cell-date">{dateTime}</td>
      <td>{budgetItemElem}</td>
      <td>{expense.amount}</td>
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

  return (
    <table>
      <tr>
        <th>Date</th>
        <th>Category</th>
        <th>Amount</th>
        <th>Details</th>
      </tr>
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
    </table>
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
  const [modalVisible, setModalVisible] = useState<boolean>(false);
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

  const refreshExpenses = () => {
    setUpdates(updates + 1);
  };

  const updateAccount = (newAccount: Account) => {
    setAccount(newAccount);
  };

  const onImportSuccess = () => {
    refreshExpenses();
    setModalVisible(false);
  };

  return (
    <div>
      <AccountSelector
        accounts={accounts}
        selected={account}
        updateAccount={updateAccount}
      />
      <div>
        <h3>{account.name}</h3>
      </div>
      <div>
        <span onClick={() => setModalVisible(true)}>[import statement]</span>
      </div>
      <ModalCard
        visible={modalVisible}
        hideModal={() => setModalVisible(false)}
      >
        <StatementImportForm account={account} onSuccess={onImportSuccess} />
      </ModalCard>
      <hr />
      <ExpensesTable
        expenses={expenses}
        budgetItems={budgetItems}
        onSuccess={refreshExpenses}
      />
    </div>
  );
}
