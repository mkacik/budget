import React from "react";
import { useState } from "react";
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

import { Account } from "./types/Account";
import { StatementSchema } from "./types/StatementSchema";

import {
  ErrorCard,
  InlineGlyphButton,
  ModalCard,
  Section,
  LoadingBanner,
} from "./ui/Common";
import { Form, FormButtons, FormSubmitButton } from "./ui/Form";
import { JSON_HEADERS } from "./Common";

function ImportExpensesForm({
  account,
  schema,
  onSuccess,
}: {
  account: Account;
  schema: StatementSchema;
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

  const notes =
    schema.notes === null || schema.notes === "" ? (
      <>
        Using <b>{schema.name}</b> schema.
      </>
    ) : (
      <>
        Notes for <b>{schema.name}</b> schema:<div>{schema.notes}</div>
      </>
    );

  return (
    <Section>
      <ErrorCard message={errorMessage} />
      <small>{notes}</small>
      <Form onSubmit={onSubmit}>
        <label htmlFor="file">Choose statement to upload (.csv,.txt)</label>
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
  account: Account;
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

  const onSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (date === null) {
      setErrorMessage("Date must be selected.");
      return;
    }
    const request = {
      newer_than_date: date.toJSON().substr(0, 10),
    };
    setLoading(true);
    fetch(`api/accounts/${account.id}/expenses/delete`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(request),
    }).then((response) => {
      setLoading(false);
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
  schema,
  onSuccess,
}: {
  account: Account;
  schema: StatementSchema | null;
  onSuccess: () => void;
}) {
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const onImportSuccess = () => {
    onSuccess();
    setModalVisible(false);
  };

  const cardContent =
    schema !== null ? (
      <ImportExpensesForm
        account={account}
        schema={schema}
        onSuccess={onImportSuccess}
      />
    ) : (
      <ErrorCard
        message={`Account does not have import schema attached, add one in Accounts tab.`}
      />
    );

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
        title={`Import expenses - ${account.name}`}
        visible={modalVisible}
        hideModal={() => setModalVisible(false)}
      >
        {cardContent}
      </ModalCard>
    </>
  );
}

export function DeleteExpensesButton({
  account,
  onSuccess,
}: {
  account: Account;
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
