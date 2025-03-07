import React from "react";
import { useState } from "react";

import { BudgetItem, BudgetItemFields, BudgetAmount } from "./types/Budget";
import { BudgetCategoryView } from "./BudgetView";
import { BudgetAmountForm } from "./BudgetAmountForm";

import { ErrorCard } from "./ui/Common";
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
  hideEditForm,
  refreshBudget,
  allCategories,
}: {
  budgetItem: BudgetItem | null;
  hideEditForm: () => void;
  refreshBudget: () => void;
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
          refreshBudget();
          hideEditForm();
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
          refreshBudget();
          hideEditForm();
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
        <span onClick={deleteBudgetItem}>[delete]</span>
      </div>
    );
  }

  return (
    <div>
      <ErrorCard message={errorMessage} />
      <form onSubmit={onSubmit}>
        <div>
          <label htmlFor="name">Budget Item Name</label>
          <input type="text" name="name" defaultValue={budgetItem?.name} />
        </div>

        <div>
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
        </div>

        <BudgetAmountForm
          budgetAmount={amount}
          updateBudgetAmount={(newAmount: BudgetAmount) => setAmount(newAmount)}
        />

        <div>
          <input
            type="submit"
            value={budgetItem === null ? "Create" : "Update"}
          />
        </div>
      </form>
      {maybeDeleteButton}
      <span onClick={hideEditForm}>[cancel]</span>
    </div>
  );
}
