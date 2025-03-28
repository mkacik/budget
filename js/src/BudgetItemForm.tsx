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
import { JSON_HEADERS } from "./Common";

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

const DEFAULT_AMOUNT: BudgetAmount = { Weekly: { amount: 0 } };

export function BudgetItemForm({
  budgetItem,
  onSuccess,
  allCategories,
}: {
  budgetItem: BudgetItem | null;
  onSuccess: () => void;
  allCategories: Array<BudgetCategoryView>;
}) {
  const initialFields: BudgetItemFields = {
    name: budgetItem?.name ?? "",
    category_id: budgetItem?.category_id ?? allCategories[0].id,
    amount: budgetItem !== null ? budgetItem.amount : DEFAULT_AMOUNT,
  };

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fields, setFields] = useState<BudgetItemFields>(initialFields);

  const categoryIgnored = allCategories.find(
    (category) => category.id === fields.category_id,
  )!.ignored;

  const clearErrorMessage = () => {
    if (errorMessage !== null) {
      setErrorMessage(null);
    }
  };

  const setName = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLInputElement;
    const value = target.value;
    setFields({ ...fields, name: value });
  };

  const setCategoryID = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLSelectElement;
    const value = Number(target.value);
    const newCategoryIgnored = allCategories.find(
      (category) => category.id === value,
    )!.ignored;
    if (categoryIgnored && !newCategoryIgnored) {
      setFields({ ...fields, category_id: value, amount: DEFAULT_AMOUNT });
    } else {
      setFields({ ...fields, category_id: value });
    }
  };

  const setAmount = (amount: BudgetAmount) => {
    setFields({ ...fields, amount });
  };

  const onSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();

    try {
      const updatedName = fields.name.trim();
      if (updatedName === "") {
        throw Error("Budget Item Name can't be empty!");
      }
      const updatedAmount = categoryIgnored ? null : fields.amount;
      if (!categoryIgnored && updatedAmount === null) {
        throw Error("Can't leave amount empty for item in budgeted category.");
      }
      const updatedFields = {
        name: updatedName,
        category_id: fields.category_id,
        amount: updatedAmount,
      } as BudgetItemFields;

      // if nothing threw by this point, mark any validation errors as cleared
      clearErrorMessage();

      const request =
        budgetItem === null
          ? createBudgetItemRequest(updatedFields)
          : updateBudgetItemRequest(budgetItem, updatedFields);
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

  const maybeAmountSelector: React.ReactNode =
    categoryIgnored || fields.amount === null ? null : (
      <BudgetAmountForm
        budgetAmount={fields.amount!}
        updateBudgetAmount={setAmount}
      />
    );

  return (
    <>
      <ErrorCard message={errorMessage} />
      <Form onSubmit={onSubmit}>
        <label>Budget Item Name</label>
        <input type="text" value={fields.name} onChange={setName} />

        <label>Budget Item Category</label>
        <select value={fields.category_id} onChange={setCategoryID}>
          {allCategories.map((category, idx) => (
            <option key={idx} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        {maybeAmountSelector}

        <FormButtons>
          {maybeDeleteButton}
          <SubmitButton text={budgetItem === null ? "Create" : "Update"} />
        </FormButtons>
      </Form>
    </>
  );
}
