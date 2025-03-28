import React from "react";
import { useState } from "react";

import { BudgetItem, BudgetItemFields, BudgetAmount } from "./types/Budget";
import { BudgetCategoryView } from "./BudgetView";
import { BudgetAmountForm } from "./BudgetAmountForm";

import {
  GlyphButton,
  SubmitButton,
  Form,
  FormButtons,
  ErrorCard,
} from "./ui/Common";
import { FormHelper, JSON_HEADERS } from "./Common";

function createBudgetItemRequest(fields: BudgetItemFields) {
  return fetch("/api/budget_items", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(fields),
  });
}

function updateBudgetItemRequest(
  budgetItem: BudgetItem,
  fields: BudgetItemFields,
) {
  const updated = { ...budgetItem, ...fields };
  return fetch(`/api/budget_items/${budgetItem.id}`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(updated),
  });
}

function deleteBudgetItemRequest(budgetItem: BudgetItem) {
  return fetch(`/api/budget_items/${budgetItem.id}`, {
    method: "DELETE",
    headers: JSON_HEADERS,
  });
}

export function BudgetItemForm({
  budgetItem,
  onSuccess,
  allCategories,
}: {
  budgetItem: BudgetItem | null;
  onSuccess: () => void;
  allCategories: Array<BudgetCategoryView>;
}) {
  const initialAmount = budgetItem?.amount || { Weekly: { amount: 0 } };

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [amount, setAmount] = useState<BudgetAmount>(initialAmount);

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
      const budgetItemFields: BudgetItemFields = {
        name: formHelper.getString("name"),
        category_id: formHelper.getNumber("category"),
        amount: amount,
      } as BudgetItemFields;
      // if nothing threw by this point, mark any validation errors as cleared
      clearErrorMessage();

      const request =
        budgetItem === null
          ? createBudgetItemRequest(budgetItemFields)
          : updateBudgetItemRequest(budgetItem, budgetItemFields);
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
  if (budgetItem !== null) {
    const deleteBudgetItem = () => {
      deleteBudgetItemRequest(budgetItem).then((response) => {
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

    maybeDeleteButton = <GlyphButton glyph="edit" onClick={deleteBudgetItem} />;
  }

  return (
    <>
      <ErrorCard message={errorMessage} />
      <Form onSubmit={onSubmit}>
        <label htmlFor="name">Budget Item Name</label>
        <input type="text" name="name" defaultValue={budgetItem?.name} />

        <label htmlFor="category">Budget Item Category</label>
        <select
          name="category"
          defaultValue={budgetItem?.category_id ?? allCategories[0].id}
        >
          {allCategories.map((category, idx) => (
            <option key={idx} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <BudgetAmountForm
          budgetAmount={amount}
          updateBudgetAmount={(newAmount: BudgetAmount) => setAmount(newAmount)}
        />

        <FormButtons>
          {maybeDeleteButton}
          <SubmitButton text={budgetItem === null ? "Create" : "Update"} />
        </FormButtons>
      </Form>
    </>
  );
}
