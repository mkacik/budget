import React from "react";
import { useState } from "react";

import {
  StatementSchemaFields,
  TestSchemaRequest,
  TestSchemaResponse,
} from "./generated/types";

import { Form, FormButtons, FormFieldWide, FormSubmitButton } from "./ui/Form";
import { FetchHelper, JSON_HEADERS } from "./Common";

import * as UI from "./ui/Common";

function ResultCard({ response }: { response: TestSchemaResponse }) {
  switch (response.result) {
    case "Success": {
      return (
        <UI.StatusCard status="success" message="Row will be parsed into:">
          <pre>{JSON.stringify(response.expense, null, 4)}</pre>
        </UI.StatusCard>
      );
    }
    case "Skip": {
      return <UI.StatusCard status="info" message="Row will be skipped" />;
    }
    case "Error":
    default: {
      return <UI.ErrorCard message={response.error} />;
    }
  }
}

export function SchemaTestForm({ fields }: { fields: StatementSchemaFields }) {
  const [row, setRow] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [response, setResponse] = useState<TestSchemaResponse | null>(null);

  const updateRow = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLTextAreaElement;
    setRow(target.value);
  };

  const onSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const fetchHelper = new FetchHelper(setErrorMessage);
    try {
      const requestBody: TestSchemaRequest = {
        schema: fields,
        row: row,
      } as TestSchemaRequest;

      const request = new Request("/api/schemas/test", {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify(requestBody),
      });

      fetchHelper.fetch(request, (json) => {
        const typedResponse = json as TestSchemaResponse;
        setResponse(typedResponse);
      });
    } catch (error) {
      fetchHelper.handleError(error);
    }
  };

  return (
    <UI.Section title="Test Schema">
      <UI.ErrorCard message={errorMessage} />

      {response && <ResultCard response={response} />}

      <Form onSubmit={onSubmit}>
        <FormFieldWide>
          <small>
            Paste row from your statement to test it against new schema. Works
            on unsaved changes.
          </small>
        </FormFieldWide>
        <FormFieldWide>
          <textarea value={row} onChange={updateRow}></textarea>
        </FormFieldWide>
        <FormButtons>
          <FormSubmitButton text="Test Schema" />
        </FormButtons>
      </Form>
    </UI.Section>
  );
}
