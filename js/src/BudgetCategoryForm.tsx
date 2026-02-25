import React from "react";
import { useState } from "react";

import { BudgetCategory, BudgetCategoryFields } from "./types/Budget";
import { BudgetView } from "./BudgetView";

import { GlyphButton, ErrorCard } from "./ui/Common";
import { Form, FormButtons, FormSubmitButton, LabeledInput } from "./ui/Form";
import { FetchHelper, FormHelper, JSON_HEADERS } from "./Common";

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
  budgetCategory,
  onSuccess,
  budget,
}: {
  budgetCategory: BudgetCategory | null;
  onSuccess: () => void;
  budget: BudgetView;
}) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchHelper = new FetchHelper(setErrorMessage);

  const onSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      const form = e.target as HTMLFormElement;
      const formHelper = new FormHelper(form);

      const budgetCategoryFields: BudgetCategoryFields = {
        name: formHelper.getString("name"),
        ignored: formHelper.getBool("ignored"),
      } as BudgetCategoryFields;

      const request =
        budgetCategory === null
          ? createBudgetCategoryRequest(budget.year, budgetCategoryFields)
          : updateBudgetCategoryRequest(
              budgetCategory.id,
              budgetCategoryFields,
            );
      fetchHelper.fetch(request, (_json) => onSuccess());
    } catch (error) {
      fetchHelper.handleError(error);
    }
  };

  const maybeDeleteButton = budgetCategory && (
    <GlyphButton
      glyph="delete"
      onClick={() =>
        fetchHelper.fetch(
          deleteBudgetCategoryRequest(budgetCategory.id),
          (_json) => onSuccess(),
        )
      }
    />
  );

  return (
    <>
      <ErrorCard message={errorMessage} />
      <Form onSubmit={onSubmit}>
        <LabeledInput
          label="BudgetCategory Name"
          type="text"
          name="name"
          defaultValue={budgetCategory?.name}
        />

        <LabeledInput
          label="Ignore in spending analysis"
          type="checkbox"
          name="ignored"
          defaultChecked={budgetCategory?.ignored ?? false}
        />

        <FormButtons>
          {maybeDeleteButton}
          <FormSubmitButton
            text={budgetCategory === null ? "Create" : "Update"}
          />
        </FormButtons>
      </Form>
    </>
  );
}
