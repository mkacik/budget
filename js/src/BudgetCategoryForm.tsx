import React from "react";
import { useState } from "react";

import { BudgetCategory, BudgetCategoryFields } from "./types/Budget";
import { BudgetView } from "./BudgetView";

import { Form, FormButtons, FormSubmitButton, LabeledInput } from "./ui/Form";
import { FetchHelper, FormHelper, JSON_HEADERS } from "./Common";

import * as UI from "./ui/Common";

function createBudgetCategoryRequest(
  year: number,
  fields: BudgetCategoryFields,
): Request {
  return new Request(`/api/budget_categories/${year}`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(fields),
  });
}

function updateBudgetCategoryRequest(
  id: number,
  fields: BudgetCategoryFields,
): Request {
  return new Request(`/api/budget_categories/${id}`, {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify(fields),
  });
}

function deleteBudgetCategoryRequest(id: number): Request {
  return new Request(`/api/budget_categories/${id}`, {
    method: "DELETE",
    headers: JSON_HEADERS,
  });
}

export function BudgetCategoryForm({
  category,
  onSuccess,
  budget,
}: {
  category: BudgetCategory | null;
  onSuccess: () => void;
  budget: BudgetView;
}) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchHelper = new FetchHelper(setErrorMessage);
  const hasFunds = category
    ? budget.getCategory(category.id).items.some((item) => item.fundID)
    : false;

  const onSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      const form = e.target as HTMLFormElement;
      const formHelper = new FormHelper(form);

      const fields: BudgetCategoryFields = {
        name: formHelper.getString("name"),
        ignored: formHelper.getBool("ignored"),
      } as BudgetCategoryFields;

      if (fields.ignored && hasFunds) {
        throw Error("Cannot make category ignored if it contains fund items");
      }

      const request =
        category === null
          ? createBudgetCategoryRequest(budget.year, fields)
          : updateBudgetCategoryRequest(category.id, fields);
      fetchHelper.fetch(request, (_json) => onSuccess());
    } catch (error) {
      fetchHelper.handleError(error);
    }
  };

  const maybeDeleteButton = category && (
    <UI.GlyphButton
      glyph="delete"
      onClick={() =>
        fetchHelper.fetch(deleteBudgetCategoryRequest(category.id), (_json) =>
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
          label="BudgetCategory Name"
          type="text"
          name="name"
          defaultValue={category?.name}
        />

        <LabeledInput
          label="Ignore in spending analysis"
          type="checkbox"
          name="ignored"
          defaultChecked={category?.ignored ?? false}
          disabled={hasFunds}
          title={
            hasFunds
              ? "Cannot make category ignored if it contains fund items"
              : undefined
          }
        />

        <FormButtons>
          {maybeDeleteButton}
          <FormSubmitButton text={category === null ? "Create" : "Update"} />
        </FormButtons>
      </Form>
    </>
  );
}
