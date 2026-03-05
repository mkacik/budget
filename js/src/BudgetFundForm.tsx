import React from "react";
import { useState } from "react";

import { BudgetFund, BudgetFundFields } from "./generated/types";

import { Form, FormButtons, FormSubmitButton, LabeledInput } from "./ui/Form";
import { FetchHelper, FormHelper, JSON_HEADERS } from "./Common";

import * as UI from "./ui/Common";

function createBudgetFundRequest(fields: BudgetFundFields): Request {
  return new Request("/api/funds", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(fields),
  });
}

function updateBudgetFundRequest(
  id: number,
  fields: BudgetFundFields,
): Request {
  return new Request(`/api/funds/${id}`, {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify(fields),
  });
}

function deleteBudgetFundRequest(id: number): Request {
  return new Request(`/api/funds/${id}`, {
    method: "DELETE",
    headers: JSON_HEADERS,
  });
}

export function BudgetFundForm({
  fund,
  onSuccess,
}: {
  fund: BudgetFund | null;
  onSuccess: () => void;
}) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchHelper = new FetchHelper(setErrorMessage);

  const onSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      const form = e.target as HTMLFormElement;
      const formHelper = new FormHelper(form);

      const fundFields: BudgetFundFields = {
        name: formHelper.getString("name"),
      } as BudgetFundFields;

      const request =
        fund === null
          ? createBudgetFundRequest(fundFields)
          : updateBudgetFundRequest(fund.id, fundFields);
      fetchHelper.fetch(request, (_json) => onSuccess());
    } catch (error) {
      fetchHelper.handleError(error);
    }
  };

  const maybeDeleteButton = fund && (
    <UI.GlyphButton
      glyph="delete"
      onClick={() =>
        fetchHelper.fetch(deleteBudgetFundRequest(fund.id), (_json) =>
          onSuccess(),
        )
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
