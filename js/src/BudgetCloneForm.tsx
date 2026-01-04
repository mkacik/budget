import React from "react";
import { useState } from "react";

import { BudgetCloneRequest } from "./types/Budget";
import { FetchHelper, FormHelper, JSON_HEADERS } from "./Common";
import { ErrorCard } from "./ui/Common";
import { Form, FormButtons, FormSubmitButton, LabeledInput } from "./ui/Form";

export function BudgetCloneForm({
  fromYear,
  onSuccess,
}: {
  fromYear: number;
  onSuccess: (number) => void;
}) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const fetchHelper = new FetchHelper(setErrorMessage);

    try {
      const form = e.target as HTMLFormElement;
      const formHelper = new FormHelper(form);

      const toYear = formHelper.getNumber("toYear");
      if (fromYear === toYear) {
        throw new Error("Target year must be different than source year!");
      }

      const requestBody = {
        from_year: fromYear,
        to_year: toYear,
      } as BudgetCloneRequest;

      const request = new Request("/api/budget/clone", {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify(requestBody),
      });

      fetchHelper.fetch(request, (_json) => onSuccess(toYear));
    } catch (error) {
      fetchHelper.handleError(error);
    }
  };

  return (
    <>
      <ErrorCard message={errorMessage} />
      <Form onSubmit={onSubmit}>
        <LabeledInput
          label="Year to clone the budget to"
          type="number"
          name="toYear"
          defaultValue={fromYear + 1}
        />

        <FormButtons>
          <FormSubmitButton text="Clone" />
        </FormButtons>
      </Form>
    </>
  );
}
