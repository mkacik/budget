import React from "react";
import { useState } from "react";

import { Account, AccountFields, AccountClass } from "./types/Account";

import { Card, ErrorCard, ModalCard } from "./ui/Common";
import { FormHelper, JSON_HEADERS } from "./Common";

const ACCOUNT_CLASS_OPTIONS: Array<AccountClass> = [
  "Bank",
  "CreditCard",
  "Shop",
];

function createAccountRequest(fields: AccountFields) {
  return fetch("/api/accounts", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(fields),
  });
}

function updateAccountRequest(account: Account, fields: AccountFields) {
  const updated = { ...account, ...fields };
  return fetch(`/api/accounts/${account.id}`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(updated),
  });
}

function deleteAccountRequest(account: Account) {
  return fetch(`/api/accounts/${account.id}`, {
    method: "DELETE",
    headers: JSON_HEADERS,
  });
}

function AccountForm({
  account,
  hideEditForm,
  refreshAccounts,
}: {
  account: Account | null;
  hideEditForm: () => void;
  refreshAccounts: () => void;
}) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clearErrorMessage = () => {
    if (errorMessage !== null) {
      setErrorMessage(null);
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
        statement_schema_id: formHelper.getNumberOrNull("importConfig"),
      } as AccountFields;
      // if nothing threw by this point, mark any validation errors as cleared
      clearErrorMessage();

      const request =
        account === null
          ? createAccountRequest(accountFields)
          : updateAccountRequest(account, accountFields);
      request.then((response) => {
        if (response.ok) {
          refreshAccounts();
          hideEditForm();
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
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        console.log(error);
      }
    }
  };

  const accountName = account?.name;
  const accountClass = account?.class ?? ACCOUNT_CLASS_OPTIONS[0];
  const importConfig = account?.statement_schema_id ?? FormHelper.EMPTY;
  const accountClassOptions = ACCOUNT_CLASS_OPTIONS.map((value, idx) => (
    <option key={idx} value={value}>
      {value}
    </option>
  ));

  let maybeDeleteButton: React.ReactNode = null;
  if (account !== null) {
    const deleteAccount = () => {
      deleteAccountRequest(account).then((response) => {
        if (response.ok) {
          refreshAccounts();
          hideEditForm();
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

    maybeDeleteButton = (
      <div>
        <button onClick={deleteAccount}>[delete]</button>
      </div>
    );
  }

  return (
    <div>
      <ErrorCard message={errorMessage} />
      <form onSubmit={onSubmit}>
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
      {maybeDeleteButton}
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

  const rows = accounts.map((account) => {
    return (
      <Card key={account.id}>
        <span>{account.name}</span>
        <span>{account.class}</span>
        <span>{account.statement_schema_id ?? "-"}</span>
        <span onClick={() => showEditModal(account)}>[edit]</span>
      </Card>
    );
  });

  return (
    <>
      {rows}
      <div>
        <span onClick={() => showEditModal(null)}>[add new]</span>
      </div>

      <ModalCard visible={modalVisible}>
        <AccountForm
          key={activeAccount?.name}
          account={activeAccount}
          hideEditForm={hideEditModal}
          refreshAccounts={refreshAccounts}
        />
      </ModalCard>
    </>
  );
}
