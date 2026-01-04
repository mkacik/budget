import React from "react";
import { useState } from "react";

import { StatementSchemaFields } from "./types/StatementSchema";
import { TestSchemaRequest, TestSchemaResponse } from "./types/SchemaTest";
import { ErrorCard, SectionHeader, StatusCard } from "./ui/Common";
import { Form, FormButtons, FormFieldWide, FormSubmitButton } from "./ui/Form";
import { FetchHelper, JSON_HEADERS } from "./Common";

function TestSchemaResponseCard({
  response,
}: {
  response: TestSchemaResponse | null;
}) {
  if (response === null) {
    return null;
  }

  switch (response.result) {
    case "Success": {
      return (
        <StatusCard status="success" message="Row will be parsed into:">
          <pre>{JSON.stringify(response.expense, null, 4)}</pre>
        </StatusCard>
      );
    }
    case "Skip": {
      return <StatusCard status="info" message="Row will be skipped" />;
    }
    case "Error":
    default: {
      return <ErrorCard message={response.error} />;
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
    <>
      <SectionHeader>Test Schema</SectionHeader>

      <ErrorCard message={errorMessage} />

      <TestSchemaResponseCard response={response} />

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
    </>
  );
}
