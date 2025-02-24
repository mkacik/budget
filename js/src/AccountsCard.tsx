import React from "react";
import { useState, useEffect } from "react";

import { Account, AccountFields, AccountClass } from "./types/Account";

import { AccountSelector } from "./AccountSelector";
import { FormHelper } from "./FormHelper";
import { ErrorCard, ModalCard } from "./CommonUI";
import { JSON_HEADERS } from "./Common";

const ACCOUNT_CLASS_OPTIONS: Array<AccountClass> = [
  "Bank",
  "CreditCard",
  "Shop",
];

function createAccount(fields: AccountFields) {
  return fetch("/api/accounts", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(fields),
  });
}

function updateAccount(account: Account, fields: AccountFields) {
  const updated = { ...account, ...fields };
  return fetch(`/api/accounts/${account.id}`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(updated),
  });
}

function AccountForm({
  account,
  refreshAccounts,
}: {
  account: Account | null;
  refreshAccounts: () => void;
}) {
  let [errorMessage, setErrorCard] = useState<string | null>(null);

  const clearErrorCard = () => {
    if (errorMessage !== null) {
      setErrorCard(null);
    }
  };

  const onSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formHelper = new FormHelper(form);

    try {
      const accountFields: AccountFields = {
        name: formHelper.getString("name"),
        class: formHelper.getString("class") as AccountClass,
        statement_import_config_id: formHelper.getNumberOrNull("importConfig"),
      } as AccountFields;
      // if nothing threw by this point, mark any validation errors as cleared
      clearErrorCard();

      const request =
        account === null
          ? createAccount(accountFields)
          : updateAccount(account, accountFields);
      request.then((result) => {
        if (result.ok) {
          refreshAccounts();
        } else {
          console.log(result);
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        setErrorCard(error.message);
      } else {
        console.log(error);
      }
    }
  };

  const accountName = account?.name;
  const accountClass = account?.class ?? ACCOUNT_CLASS_OPTIONS[0];
  const importConfig = account?.statement_import_config_id ?? FormHelper.EMPTY;
  const maybeErrorCard =
    errorMessage !== null ? <ErrorCard message={errorMessage} /> : null;
  const accountClassOptions = ACCOUNT_CLASS_OPTIONS.map((value, idx) => (
    <option key={idx} value={value}>
      {value}
    </option>
  ));

  return (
    <div>
      {maybeErrorCard}
      <form onSubmit={onSubmit} key={accountName}>
        <div>
          <label htmlFor="name">Account Name</label>
          <input type="text" name="name" defaultValue={accountName} />
        </div>

        <div>
          <label htmlFor="class">Account Type</label>
          <select name="class" defaultValue={accountClass}>
            {accountClassOptions}
          </select>
        </div>

        <div>
          <label htmlFor="importConfig">Import Schema</label>
          <input type="text" name="importConfig" defaultValue={importConfig} />
        </div>

        <div>
          <input type="submit" value={account === null ? "Create" : "Update"} />
        </div>
      </form>
    </div>
  );
}

export function AccountsCard({
  accounts,
  refreshAccounts,
}: {
  accounts: Array<Account>;
  refreshAccounts: () => void;
}) {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);

  const hideEditModal = () => setModalVisible(false);
  const showEditModal = (account: Account | null) => {
    setActiveAccount(account);
    setModalVisible(true);
  };

  const rows = accounts.map((account, idx) => {
    return (
      <div key={account.id}>
        <span>{account.name}</span>
        <span>{account.class}</span>
        <span>{account.statement_import_config_id ?? "-"}</span>
        <span onClick={() => showEditModal(account)}>[edit]</span>
      </div>
    );
  });

  return (
    <div>
      {rows}
      <div>
        <span onClick={() => showEditModal(null)}>[add new]</span>
      </div>

      <ModalCard visible={modalVisible}>
        <AccountForm
          account={activeAccount}
          refreshAccounts={refreshAccounts}
        />
      </ModalCard>
    </div>
  );
}
