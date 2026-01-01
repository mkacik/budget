import React from "react";
import { useState } from "react";

import { BudgetCloneRequest } from "./types/Budget";
import { FormHelper, JSON_HEADERS } from "./Common";
import { ErrorCard } from "./ui/Common";
import { Form, FormButtons, FormSubmitButton } from "./ui/Form";

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
    const form = e.target as HTMLFormElement;
    const formHelper = new FormHelper(form);

    try {
      const toYear = formHelper.getNumber("toYear");
      if (fromYear === toYear) {
        throw new Error("Target year must be different than source year!");
      }

      const request = {
        from_year: fromYear,
        to_year: toYear,
      } as BudgetCloneRequest;

      fetch("/api/budget/clone", {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify(request),
      }).then((response) => {
        if (response.ok) {
          onSuccess(toYear);
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
      <ErrorCard message={errorMessage} />
      <Form onSubmit={onSubmit}>
        <label htmlFor="number">Year to clone the budget to</label>
        <input type="number" name="toYear" defaultValue={fromYear + 1} />

        <FormButtons>
          <FormSubmitButton text="Clone" />
        </FormButtons>
      </Form>
    </>
  );
}
