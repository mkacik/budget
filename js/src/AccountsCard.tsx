import React from "react";
import { useState } from "react";

import { Account, AccountFields, AccountClass } from "./types/Account";
import { StatementSchema } from "./types/StatementSchema";

import {
  ErrorCard,
  GlyphButton,
  InlineGlyphButton,
  ItemCard,
  ModalCard,
  Pill,
  SectionHeader,
} from "./ui/Common";
import { Form, FormButtons } from "./ui/Form";
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
  onSuccess,
  schemas,
}: {
  account: Account | null;
  onSuccess: () => void;
  schemas: Array<StatementSchema>;
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
  const schemaOptions = schemas.map((schema, idx) => (
    <option key={idx} value={schema.id}>
      {schema.name}
    </option>
  ));

  let maybeDeleteButton: React.ReactNode = null;
  if (account !== null) {
    const deleteAccount = () => {
      deleteAccountRequest(account).then((response) => {
        if (response.ok) {
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

    maybeDeleteButton = <GlyphButton glyph="delete" onClick={deleteAccount} />;
  }

  return (
    <>
      <ErrorCard message={errorMessage} />
      <Form onSubmit={onSubmit}>
        <label htmlFor="name">Account Name</label>
        <input type="text" name="name" defaultValue={accountName} />

        <label htmlFor="class">Account Type</label>
        <select name="class" defaultValue={accountClass}>
          {accountClassOptions}
        </select>

        <label htmlFor="importConfig">Import Schema</label>
        <select
          name="importConfig"
          defaultValue={importConfig ?? FormHelper.EMPTY}
        >
          <option value={FormHelper.EMPTY}>-</option>
          {schemaOptions}
        </select>

        <FormButtons>
          {maybeDeleteButton}
          <input
            className="button"
            type="submit"
            value={account === null ? "Create" : "Update"}
          />
        </FormButtons>
      </Form>
    </>
  );
}

export function AccountsCard({
  accounts,
  refreshAccounts,
  schemas,
}: {
  accounts: Array<Account>;
  refreshAccounts: () => void;
  schemas: Array<StatementSchema>;
}) {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);

  const showEditModal = (account: Account | null) => {
    setActiveAccount(account);
    setModalVisible(true);
  };
  const hideEditModal = () => setModalVisible(false);
  const onEditSuccess = () => {
    refreshAccounts();
    hideEditModal();
  };

  const rows = accounts.map((account) => {
    return (
      <ItemCard key={account.id}>
        <span>{account.name}</span>
        <Pill>{account.class}</Pill>
        <InlineGlyphButton
          glyph="edit"
          onClick={() => showEditModal(account)}
        />
      </ItemCard>
    );
  });

  return (
    <>
      <SectionHeader>Accounts</SectionHeader>

      {rows}

      <GlyphButton
        glyph="add"
        text="add account"
        onClick={() => showEditModal(null)}
      />

      <ModalCard
        title={activeAccount === null ? "New Account" : "Edit Account"}
        visible={modalVisible}
        hideModal={hideEditModal}
      >
        <AccountForm
          key={activeAccount?.name}
          account={activeAccount}
          onSuccess={onEditSuccess}
          schemas={schemas}
        />
      </ModalCard>
    </>
  );
}
