import React from "react";
import { useState } from "react";
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

import { AccountView } from "./AccountsView";
import { StatementSchema } from "./types/StatementSchema";
import { ExpenseFields } from "./types/Expense";

import {
  ErrorCard,
  InlineGlyphButton,
  ModalCard,
  Section,
  LoadingBanner,
} from "./ui/Common";
import { Form, FormButtons, FormSubmitButton } from "./ui/Form";
import { DEFAULT_ERROR, JSON_HEADERS } from "./Common";

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

  const clearErrorMessage = () => {
    if (errorMessage !== null) {
      setErrorMessage(null);
    }
  };

  const onSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const maybeFile = formData.get("file") as File;
      if (maybeFile?.name === "") {
        throw new Error("File must be selected.");
      }

      setLoading(true);
      const response = await fetch(`api/accounts/${account.id}/expenses`, {
        method: "POST",
        body: formData,
      });
      setLoading(false);

      // to get error message need to get to json in both success and error case
      // catch block will handle unexpected not-json responses
      const json = await response.json();
      if (!response.ok) {
        setErrorMessage(json.error ?? DEFAULT_ERROR);
        return;
      }

      form.reset();
      clearErrorMessage();
      onSuccess();
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
        return;
      }

      console.error(error);
      setErrorMessage(DEFAULT_ERROR);
    }
  };

  const schema = account.statementSchema;
  if (schema === null) {
    return (
      <ErrorCard message="Account does not have import schema attached, add one in Accounts tab." />
    );
  }

  return (
    <Section>
      <ErrorCard message={errorMessage} />
      <SchemaNotes schema={schema} />
      <Form onSubmit={onSubmit}>
        <label htmlFor="file">Statement to upload (.csv,.txt)</label>
        <input type="file" id="file" name="file" accept=".csv,.CSV,.txt,.TXT" />
        <FormButtons>
          <FormSubmitButton text="Upload" />
        </FormButtons>
      </Form>
      <LoadingBanner isLoading={loading} />
    </Section>
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

  const clearErrorMessage = () => {
    if (errorMessage !== null) {
      setErrorMessage(null);
    }
  };

  const onSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      if (date === null) {
        throw new Error("Date must be selected.");
      }

      const request = {
        newer_than_date: formatDate(date),
      };

      setLoading(true);
      const response = await fetch(
        `api/accounts/${account.id}/expenses/delete`,
        {
          method: "POST",
          headers: JSON_HEADERS,
          body: JSON.stringify(request),
        },
      );
      setLoading(false);

      // to get error message need to get to json in both success and error case
      // catch block will handle unexpected not-json responses
      const json = await response.json();
      if (!response.ok) {
        setErrorMessage(json.error ?? DEFAULT_ERROR);
        return;
      }

      clearErrorMessage();
      onSuccess();
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
        return;
      }

      console.error(error);
      setErrorMessage(DEFAULT_ERROR);
    }
  };

  return (
    <Section>
      <ErrorCard message={errorMessage} />
      <Form onSubmit={onSubmit}>
        <label>Delete expenses newer than selected date [YYYY-MM-DD]</label>
        <DatePicker
          dateFormat="yyyy-MM-dd"
          selected={date}
          onChange={setDate}
          className="stretch-datepicker"
        />
        <FormButtons>
          <FormSubmitButton text="Delete" />
        </FormButtons>
      </Form>
      <LoadingBanner isLoading={loading} />
    </Section>
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
      <small>
        <InlineGlyphButton
          glyph="upload"
          text="import expenses"
          onClick={() => setModalVisible(true)}
        />
      </small>
      <ModalCard
        title={`Import expenses - ${account.name}`}
        visible={modalVisible}
        hideModal={() => setModalVisible(false)}
      >
        <ImportExpensesForm account={account} onSuccess={onImportSuccess} />
      </ModalCard>
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
      <small>
        <InlineGlyphButton
          glyph="delete"
          text="delete expenses"
          onClick={() => setModalVisible(true)}
        />
      </small>
      <ModalCard
        title={`Delete expenses - ${account.name}`}
        visible={modalVisible}
        hideModal={() => setModalVisible(false)}
      >
        <DeleteExpensesForm account={account} onSuccess={onDeleteSuccess} />
      </ModalCard>
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
      <small>
        <InlineGlyphButton
          glyph="add"
          text="add expense"
          onClick={() => setModalVisible(true)}
        />
      </small>
      <ModalCard
        title={`Add expense for cash account - ${account.name}`}
        visible={modalVisible}
        hideModal={() => setModalVisible(false)}
      >
        <AddExpenseForm account={account} onSuccess={onAddSuccess} />
      </ModalCard>
    </>
  );
}

type PartialExpenseFields = {
  description: string;
  amount: number;
  transaction_date: Date | null;
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
    transaction_date: new Date(),
    amount: 0,
    description: "",
  } as PartialExpenseFields);

  const clearErrorMessage = () => errorMessage && setErrorMessage(null);

  const onSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      if (fields.transaction_date === null) {
        throw new Error("Transaction date for new expense cannot be empty!");
      }
      if (fields.amount === 0) {
        throw new Error("Amount for new expense must be non-zero!");
      }
      if (fields.description === null) {
        throw new Error("Description for new expense cannot be empty!");
      }
      if (fields.description !== fields.description.trim()) {
        throw new Error(
          "Description field contains disallowed leading/trailing whitespace!",
        );
      }

      const request = {
        account_id: account.id,
        transaction_date: formatDate(fields.transaction_date),
        transaction_time: null,
        amount: fields.amount,
        description: fields.description,
      } as ExpenseFields;

      const response = await fetch(`api/expenses/create`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify(request),
      });

      // to get error message need to get to json in both success and error case
      // catch block will handle unexpected not-json responses
      const json = await response.json();
      if (!response.ok) {
        setErrorMessage(json.error ?? DEFAULT_ERROR);
        return;
      }

      clearErrorMessage();
      onSuccess();
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
        return;
      }

      console.error(error);
      setErrorMessage(DEFAULT_ERROR);
    }
  };

  const setDescription = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    setFields({ ...fields, description: value });
  };

  const setAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.currentTarget.value);
    setFields({ ...fields, amount: value });
  };

  return (
    <Section>
      <ErrorCard message={errorMessage} />
      <Form onSubmit={onSubmit}>
        <label>Description</label>
        <input
          type="textarea"
          value={fields.description}
          onChange={setDescription}
        />

        <label>Amount</label>
        <input
          type="number"
          step="0.01"
          value={fields.amount}
          onChange={setAmount}
        />

        <label>Transaction date [YYYY-MM-dd]</label>
        <DatePicker
          dateFormat="yyyy-MM-dd"
          selected={fields.transaction_date}
          onChange={(newDate) =>
            setFields({ ...fields, transaction_date: newDate })
          }
          className="stretch-datepicker"
        />
        <FormButtons>
          <FormSubmitButton text="Add" />
        </FormButtons>
      </Form>
    </Section>
  );
}
