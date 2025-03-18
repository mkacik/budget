import React from "react";
import { useState } from "react";

import { BudgetCategory, BudgetCategoryFields } from "./types/Budget";

import { ErrorCard } from "./ui/Common";
import { FormHelper, JSON_HEADERS } from "./Common";

function createBudgetCategoryRequest(fields: BudgetCategoryFields) {
  return fetch("/api/budget_categories", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(fields),
  });
}

function updateBudgetCategoryRequest(
  budgetCategory: BudgetCategory,
  fields: BudgetCategoryFields,
) {
  const updated = { ...budgetCategory, ...fields };
  return fetch(`/api/budget_categories/${budgetCategory.id}`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(updated),
  });
}

function deleteBudgetCategoryRequest(budgetCategory: BudgetCategory) {
  return fetch(`/api/budget_categories/${budgetCategory.id}`, {
    method: "DELETE",
    headers: JSON_HEADERS,
  });
}

export function BudgetCategoryForm({
  budgetCategory,
  onSuccess,
}: {
  budgetCategory: BudgetCategory | null;
  onSuccess: () => void;
}) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clearErrorMessage = () => {
    if (errorMessage !== null) {
      setErrorMessage(null);
    }
  };

  const onSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formHelper = new FormHelper(form);

    try {
      const budgetCategoryFields: BudgetCategoryFields = {
        name: formHelper.getString("name"),
        ignored: formHelper.getBool("ignored"),
      } as BudgetCategoryFields;
      // if nothing threw by this point, mark any validation errors as cleared
      clearErrorMessage();

      const request =
        budgetCategory === null
          ? createBudgetCategoryRequest(budgetCategoryFields)
          : updateBudgetCategoryRequest(budgetCategory, budgetCategoryFields);
      request.then((response) => {
        if (response.ok) {
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
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        console.log(error);
      }
    }
  };

  let maybeDeleteButton: React.ReactNode = null;
  if (budgetCategory !== null) {
    const deleteBudgetCategory = () => {
      deleteBudgetCategoryRequest(budgetCategory).then((response) => {
        if (response.ok) {
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

    maybeDeleteButton = (
      <div>
        <span onClick={deleteBudgetCategory}>[delete]</span>
      </div>
    );
  }

  return (
    <div>
      <ErrorCard message={errorMessage} />
      <form onSubmit={onSubmit}>
        <div>
          <label htmlFor="name">BudgetCategory Name</label>
          <input type="text" name="name" defaultValue={budgetCategory?.name} />
        </div>

        <div>
          <label htmlFor="ignored">Ignore in spending analysis</label>
          <input
            type="checkbox"
            name="ignored"
            defaultChecked={budgetCategory?.ignored ?? false}
          />
        </div>

        <div>
          <input
            type="submit"
            value={budgetCategory === null ? "Create" : "Update"}
          />
        </div>
      </form>
      {maybeDeleteButton}
    </div>
  );
}
