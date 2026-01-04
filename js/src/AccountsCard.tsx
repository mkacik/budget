import React from "react";
import { useState } from "react";

import { Account, AccountFields, AccountType } from "./types/Account";
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
import { FetchHelper, FormHelper, JSON_HEADERS } from "./Common";
import { Section } from "./ui/Common";

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
    method: "POST",
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
  const options = schemas.map((schema, idx) => (
    <option key={idx} value={schema.id}>
      {schema.name}
    </option>
  ));
  return (
    <>
      <option value={FormHelper.EMPTY}>-</option>
      {options}
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
      const accountFields: AccountFields = {
        name: formHelper.getString("name"),
        account_type: formHelper.getString("accountType") as AccountType,
        statement_schema_id: formHelper.getNumberOrNull("importConfig"),
      } as AccountFields;

      const request =
        account === null
          ? createAccountRequest(accountFields)
          : updateAccountRequest(account, accountFields);
      fetchHelper.fetch(request, (json) => onSuccess());
    } catch (error) {
      fetchHelper.handleError(error);
    }
  };

  const maybeDeleteButton = account && (
    <GlyphButton
      glyph="delete"
      onClick={() =>
        fetchHelper.fetch(deleteAccountRequest(account), (json) => onSuccess())
      }
    />
  );

  const accountName = account?.name;
  const accountType = account?.account_type ?? ACCOUNT_TYPE_OPTIONS[0];
  const importConfig = account?.statement_schema_id ?? FormHelper.EMPTY;

  return (
    <>
      <ErrorCard message={errorMessage} />
      <Form onSubmit={onSubmit}>
        <label htmlFor="name">Account Name</label>
        <input type="text" name="name" defaultValue={accountName} />

        <label htmlFor="accountType">Account Type</label>
        <select name="accountType" defaultValue={accountType}>
          <AccountTypeOptions />
        </select>

        <label htmlFor="importConfig">Import Schema</label>
        <select name="importConfig" defaultValue={importConfig}>
          <StatementSchemaOptions schemas={schemas} />
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
        <Pill>{account.account_type}</Pill>
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
      <Section>
        <GlyphButton
          glyph="add"
          text="add account"
          onClick={() => showEditModal(null)}
        />
      </Section>
      {rows}
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
