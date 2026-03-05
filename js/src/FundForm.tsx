import React from "react";
import { useState } from "react";

import { Fund, FundFields } from "./generated/types";

import { Form, FormButtons, FormSubmitButton, LabeledInput } from "./ui/Form";
import { FetchHelper, FormHelper, JSON_HEADERS } from "./Common";

import * as UI from "./ui/Common";

function createFundRequest(fields: FundFields): Request {
  return new Request("/api/funds", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(fields),
  });
}

function updateFundRequest(id: number, fields: FundFields): Request {
  return new Request(`/api/funds/${id}`, {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify(fields),
  });
}

function deleteFundRequest(id: number): Request {
  return new Request(`/api/funds/${id}`, {
    method: "DELETE",
    headers: JSON_HEADERS,
  });
}

export function FundForm({
  fund,
  onSuccess,
}: {
  fund: Fund | null;
  onSuccess: () => void;
}) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchHelper = new FetchHelper(setErrorMessage);

  const onSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      const form = e.target as HTMLFormElement;
      const formHelper = new FormHelper(form);

      const fundFields: FundFields = {
        name: formHelper.getString("name"),
      } as FundFields;

      const request =
        fund === null
          ? createFundRequest(fundFields)
          : updateFundRequest(fund.id, fundFields);
      fetchHelper.fetch(request, (_json) => onSuccess());
    } catch (error) {
      fetchHelper.handleError(error);
    }
  };

  const maybeDeleteButton = fund && (
    <UI.GlyphButton
      glyph="delete"
      onClick={() =>
        fetchHelper.fetch(deleteFundRequest(fund.id), (_json) => onSuccess())
      }
    />
  );

  return (
    <>
      <UI.ErrorCard message={errorMessage} />
      <Form onSubmit={onSubmit}>
        <LabeledInput
          label="Fund Name"
          type="text"
          name="name"
          defaultValue={fund?.name}
        />

        <FormButtons>
          {maybeDeleteButton}
          <FormSubmitButton text={fund === null ? "Create" : "Update"} />
        </FormButtons>
      </Form>
    </>
  );
}
