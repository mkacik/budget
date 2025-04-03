import React from "react";
import { useState, useEffect } from "react";

import { Account } from "./types/Account";
import { Expense, Expenses } from "./types/Expense";

import { BudgetView } from "./BudgetView";
import { ExpensesTable } from "./ExpensesTable";
import {
  ErrorCard,
  InlineGlyphButton,
  ItemCard,
  ModalCard,
  Section,
  SectionHeader,
} from "./ui/Common";
import { Form, FormButtons } from "./ui/Form";

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
    const formData = new FormData(form);
    const maybeFile = formData.get("file") as File;
    if (maybeFile?.name === "") {
      setErrorMessage("File must be selected.");
      return;
    }
    setLoading(true);
    fetch(`api/accounts/${account.id}/expenses`, {
      method: "POST",
      body: formData,
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

export function ExpensesPage({
  accounts,
  budget,
}: {
  accounts: Array<Account>;
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
