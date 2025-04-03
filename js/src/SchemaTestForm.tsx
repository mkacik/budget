import React from "react";
import { useState } from "react";

import { StatementSchemaFields } from "./types/StatementSchema";
import { TestSchemaRequest, TestSchemaResponse } from "./types/SchemaTest";
import { ErrorCard, SectionHeader, StatusCard } from "./ui/Common";
import { Form, FormButtons, FormFieldWide, FormSubmitButton } from "./ui/Form";
import { JSON_HEADERS } from "./Common";

function testSchemaRequest(request: TestSchemaRequest) {
  return fetch("/api/schemas/test", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(request),
  });
}

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

  const clearErrorMessage = () => {
    if (errorMessage !== null) {
      setErrorMessage(null);
    }
  };

  const updateRow = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLTextAreaElement;
    setRow(target.value);
  };

  const onSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();

    try {
      const request: TestSchemaRequest = {
        schema: fields,
        row: row,
      } as TestSchemaRequest;

      clearErrorMessage();

      testSchemaRequest(request).then((response) => {
        if (!response.ok) {
          setErrorMessage("Something went wrong when contacting the server.");
          return;
        }
        response.json().then((json) => {
          const typedResponse = json as TestSchemaResponse;
          setResponse(typedResponse);
        });
      });
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        console.log(error);
      }
    }
  };

  return (
    <>
      <SectionHeader>Test Schema</SectionHeader>

      <ErrorCard message={errorMessage} />

      <TestSchemaResponseCard response={response} />

      <Form onSubmit={onSubmit}>
        <FormFieldWide>
          <label>
            Paste row from your statement to test it against new schema
          </label>
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
