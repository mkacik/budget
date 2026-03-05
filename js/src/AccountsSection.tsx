import React from "react";
import { useState } from "react";

import {
  Account,
  AccountFields,
  AccountType,
  StatementSchema,
} from "./generated/types";

import { AccountView, AccountsView } from "./AccountsView";
import { useAppSettingsContext } from "./AppSettings";

import {
  Form,
  FormButtons,
  FormSubmitButton,
  LabeledInput,
  LabeledSelect,
} from "./ui/Form";
import { FetchHelper, FormHelper, JSON_HEADERS } from "./Common";

import * as UI from "./ui/Common";

const ACCOUNT_TYPE_OPTIONS: Array<AccountType> = [
  "Bank",
  "Cash",
  "CreditCard",
  "Shop",
];

function createAccountRequest(fields: AccountFields): Request {
  return new Request("/api/accounts", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(fields),
  });
}

function updateAccountRequest(
  account: Account,
  fields: AccountFields,
): Request {
  const updated = { ...account, ...fields };
  return new Request(`/api/accounts/${account.id}`, {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify(updated),
  });
}

function deleteAccountRequest(account: Account): Request {
  return new Request(`/api/accounts/${account.id}`, {
    method: "DELETE",
    headers: JSON_HEADERS,
  });
}

function AccountTypeOptions() {
  const options = ACCOUNT_TYPE_OPTIONS.map((value, idx) => (
    <option key={idx} value={value}>
      {value}
    </option>
  ));
  return <>{options}</>;
}

function StatementSchemaOptions({
  schemas,
}: {
  schemas: Array<StatementSchema>;
}) {
  return (
    <>
      <option value={FormHelper.EMPTY}>-</option>
      {schemas.map((schema, idx) => (
        <option key={idx} value={schema.id}>
          {schema.name}
        </option>
      ))}
    </>
  );
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

  const fetchHelper = new FetchHelper(setErrorMessage);

  const onSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formHelper = new FormHelper(form);
    try {
      const fields: AccountFields = {
        name: formHelper.getString("name"),
        account_type: formHelper.getString("accountType") as AccountType,
        statement_schema_id: formHelper.getNumberOrNull("importConfig"),
      } as AccountFields;

      const request =
        account === null
          ? createAccountRequest(fields)
          : updateAccountRequest(account, fields);
      fetchHelper.fetch(request, (_json) => onSuccess());
    } catch (error) {
      fetchHelper.handleError(error);
    }
  };

  const accountName = account?.name;
  const accountType = account?.account_type ?? ACCOUNT_TYPE_OPTIONS[0];
  const importConfig = account?.statement_schema_id ?? FormHelper.EMPTY;

  return (
    <>
      <UI.ErrorCard message={errorMessage} />
      <Form onSubmit={onSubmit}>
        <LabeledInput
          label="AccountName"
          type="text"
          name="name"
          defaultValue={accountName}
        />

        <LabeledSelect
          label="Account Type"
          name="accountType"
          defaultValue={accountType}
        >
          <AccountTypeOptions />
        </LabeledSelect>

        <LabeledSelect
          label="ImportSchema"
          name="importConfig"
          defaultValue={importConfig}
        >
          <StatementSchemaOptions schemas={schemas} />
        </LabeledSelect>

        <FormButtons>
          {account && (
            <UI.GlyphButton
              glyph="delete"
              onClick={() =>
                fetchHelper.fetch(deleteAccountRequest(account), (_json) =>
                  onSuccess(),
                )
              }
            />
          )}
          <FormSubmitButton text={account === null ? "Create" : "Update"} />
        </FormButtons>
      </Form>
    </>
  );
}

function AccountsTable({
  accounts,
  editAccount,
}: {
  accounts: Array<AccountView>;
  editAccount: (account: Account | null) => void;
}) {
  const useStickyHeaders = useAppSettingsContext().stickyHeaders;

  const rows = accounts.map((account) => {
    const schema = account.statementSchema?.name;
    return (
      <tr key={account.id}>
        <td className="v-center">
          {account.name}
          <UI.InlineGlyphButton
            glyph="edit"
            onClick={() => editAccount(account)}
          />
        </td>
        <td>{account.account_type}</td>
        {schema ? <td>{schema}</td> : <td className="soft">—</td>}
      </tr>
    );
  });

  return (
    <table className="large">
      <thead className={useStickyHeaders ? "sticky-header" : undefined}>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Schema</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
}

export function AccountsSection({
  accounts,
  refreshAccounts,
}: {
  accounts: AccountsView;
  refreshAccounts: () => void;
}) {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);

  const editAccount = (account: Account | null) => {
    setActiveAccount(account);
    setModalVisible(true);
  };
  const hideModal = () => setModalVisible(false);
  const onEditSuccess = () => {
    refreshAccounts();
    hideModal();
  };

  return (
    <UI.Section title="Accounts">
      <UI.GlyphButton
        glyph="add"
        text="add account"
        onClick={() => editAccount(null)}
      />
      <AccountsTable accounts={accounts.accounts} editAccount={editAccount} />

      <UI.ModalCard
        title={activeAccount === null ? "New Account" : "Edit Account"}
        visible={modalVisible}
        hideModal={hideModal}
      >
        <AccountForm
          key={activeAccount?.name}
          account={activeAccount}
          onSuccess={onEditSuccess}
          schemas={accounts.schemas}
        />
      </UI.ModalCard>
    </UI.Section>
  );
}
