import React from "react";
import { useState } from "react";

import { AccountView } from "./AccountsView";
import { StatementSchema } from "./types/StatementSchema";
import { ExpenseFields } from "./types/Expense";

import {
  Form,
  FormButtons,
  FormSubmitButton,
  FormFieldWide,
  LabeledInput,
  LabeledDatePicker,
} from "./ui/Form";
import { FetchHelper, JSON_HEADERS } from "./Common";

import * as UI from "./ui/Common";

function formatDate(date: Date) {
  return date.toJSON().substr(0, 10);
}

function SchemaNotes({ schema }: { schema: StatementSchema }) {
  if (schema.notes === null || schema.notes === "") {
    return (
      <small>
        Using <b>{schema.name}</b> schema.
      </small>
    );
  }

  return (
    <small>
      Notes for <b>{schema.name}</b> schema:<div>{schema.notes}</div>
    </small>
  );
}

function ImportExpensesForm({
  account,
  onSuccess,
}: {
  account: AccountView;
  onSuccess: () => void;
}) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const onSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const fetchHelper = new FetchHelper(setErrorMessage, setLoading);

    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const maybeFile = formData.get("file") as File;
      if (maybeFile?.name === "") {
        throw Error("File must be selected.");
      }

      const request = new Request(`api/accounts/${account.id}/expenses`, {
        method: "POST",
        body: formData,
      });
      await fetchHelper.fetch(request, (_json) => {
        form.reset();
        onSuccess();
      });
    } catch (error) {
      fetchHelper.handleError(error);
    }
  };

  const schema = account.statementSchema;
  if (schema === null) {
    const error =
      "Account does not have import schema attached, add one in Accounts tab.";
    return <UI.ErrorCard message={error} />;
  }

  return (
    <UI.Section>
      <UI.ErrorCard message={errorMessage} />
      <SchemaNotes schema={schema} />
      <Form onSubmit={onSubmit}>
        <LabeledInput
          label="Statement to upload (.csv,.txt)"
          name="file"
          type="file"
          accept=".csv,.CSV,.txt,.TXT"
        />
        <FormButtons>
          <FormSubmitButton text="Upload" />
        </FormButtons>
      </Form>
      <UI.LoadingBanner isLoading={loading} />
    </UI.Section>
  );
}

function DeleteExpensesForm({
  account,
  onSuccess,
}: {
  account: AccountView;
  onSuccess: () => void;
}) {
  const [date, setDate] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const onSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const fetchHelper = new FetchHelper(setErrorMessage, setLoading);

    try {
      if (date === null) {
        throw Error("Date must be selected.");
      }

      if (!confirm("Deleting expenses cannot be undone, are you sure?")) {
        return;
      }

      const request = new Request(
        `api/accounts/${account.id}/expenses/delete`,
        {
          method: "POST",
          headers: JSON_HEADERS,
          body: JSON.stringify({ newer_than_date: formatDate(date) }),
        },
      );
      fetchHelper.fetch(request, (_json) => onSuccess());
    } catch (error) {
      fetchHelper.handleError(error);
    }
  };

  return (
    <UI.Section>
      <UI.ErrorCard message={errorMessage} />
      <Form onSubmit={onSubmit}>
        <FormFieldWide>
          Expenses in chosen account <b>newer</b> than selected date will be
          bulk-deleted. This is irreversible.
        </FormFieldWide>
        <LabeledDatePicker
          label="Date [YYYY-MM-DD]"
          dateFormat="yyyy-MM-dd"
          selected={date}
          onChange={setDate}
        />
        <FormButtons>
          <FormSubmitButton text="Delete" />
        </FormButtons>
      </Form>
      <UI.LoadingBanner isLoading={loading} />
    </UI.Section>
  );
}

export function ImportExpensesButton({
  account,
  onSuccess,
}: {
  account: AccountView;
  onSuccess: () => void;
}) {
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const onImportSuccess = () => {
    onSuccess();
    setModalVisible(false);
  };

  return (
    <>
      <UI.GlyphButton
        glyph="upload"
        text="import expenses"
        onClick={() => setModalVisible(true)}
      />
      <UI.ModalCard
        title={`Import expenses - ${account.name}`}
        visible={modalVisible}
        hideModal={() => setModalVisible(false)}
      >
        <ImportExpensesForm account={account} onSuccess={onImportSuccess} />
      </UI.ModalCard>
    </>
  );
}

export function DeleteExpensesButton({
  account,
  onSuccess,
}: {
  account: AccountView;
  onSuccess: () => void;
}) {
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const onDeleteSuccess = () => {
    onSuccess();
    setModalVisible(false);
  };

  return (
    <>
      <UI.GlyphButton
        glyph="delete"
        text="delete expenses"
        onClick={() => setModalVisible(true)}
      />
      <UI.ModalCard
        title={`Delete expenses - ${account.name}`}
        visible={modalVisible}
        hideModal={() => setModalVisible(false)}
      >
        <DeleteExpensesForm account={account} onSuccess={onDeleteSuccess} />
      </UI.ModalCard>
    </>
  );
}

export function AddExpenseButton({
  account,
  onSuccess,
}: {
  account: AccountView;
  onSuccess: () => void;
}) {
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const onAddSuccess = () => {
    setModalVisible(false);
    onSuccess();
  };

  return (
    <>
      <UI.GlyphButton
        glyph="add"
        text="add expense"
        onClick={() => setModalVisible(true)}
      />
      <UI.ModalCard
        title={`Add expense for cash account - ${account.name}`}
        visible={modalVisible}
        hideModal={() => setModalVisible(false)}
      >
        <AddExpenseForm account={account} onSuccess={onAddSuccess} />
      </UI.ModalCard>
    </>
  );
}

type PartialExpenseFields = {
  description: string;
  amount: number;
  transactionDate: Date | null;
};

function AddExpenseForm({
  account,
  onSuccess,
}: {
  account: AccountView;
  onSuccess: () => void;
}) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [fields, setFields] = useState<PartialExpenseFields>({
    transactionDate: new Date(),
    amount: 0,
    description: "",
  } as PartialExpenseFields);

  const onSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const fetchHelper = new FetchHelper(setErrorMessage);
    try {
      if (fields.transactionDate === null) {
        throw Error("Transaction date for new expense cannot be empty!");
      }
      if (fields.amount === 0) {
        throw Error("Amount for new expense must be non-zero!");
      }
      const description = fields.description;
      if (description === null || description.trim() === "") {
        throw Error("Description for new expense cannot be empty!");
      }
      if (description !== description.trim()) {
        throw Error(
          "Description field contains illegal leading/trailing whitespace!",
        );
      }

      const requestBody = {
        account_id: account.id,
        transaction_date: formatDate(fields.transactionDate),
        transaction_time: null,
        amount: fields.amount,
        description: description,
      } as ExpenseFields;
      const request = new Request(`api/expenses/create`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify(requestBody),
      });
      fetchHelper.fetch(request, (_json) => onSuccess());
    } catch (error) {
      fetchHelper.handleError(error);
    }
  };

  const setDescription = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    setFields({ ...fields, description: value });
  };

  const setAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.currentTarget.value);
    const valueCents = Math.round(value * 100);
    setFields({ ...fields, amount: valueCents });
  };

  return (
    <UI.Section>
      <UI.ErrorCard message={errorMessage} />
      <Form onSubmit={onSubmit}>
        <LabeledInput
          label="Description"
          type="textarea"
          value={fields.description}
          onChange={setDescription}
        />
        <LabeledInput
          label="Amount"
          type="number"
          step="0.01"
          value={fields.amount / 100}
          onChange={setAmount}
        />
        <LabeledDatePicker
          label="Transaction date [YYYY-MM-dd]"
          dateFormat="yyyy-MM-dd"
          selected={fields.transactionDate}
          onChange={(date) => setFields({ ...fields, transactionDate: date })}
        />
        <FormButtons>
          <FormSubmitButton text="Add" />
        </FormButtons>
      </Form>
    </UI.Section>
  );
}
