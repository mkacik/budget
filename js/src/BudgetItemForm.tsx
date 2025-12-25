import React from "react";
import { useState } from "react";

import { BudgetItem, BudgetItemFields, BudgetAmount } from "./types/Budget";
import { BudgetView, BudgetCategoryView } from "./BudgetView";
import { BudgetAmountForm } from "./BudgetAmountForm";

import { GlyphButton, ErrorCard } from "./ui/Common";
import { Form, FormButtons, FormSubmitButton } from "./ui/Form";
import { JSON_HEADERS } from "./Common";

const DEFAULT_AMOUNT: BudgetAmount = { Weekly: { amount: 0 } };

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

function isCategoryIgnored(categoryID: number, budget: BudgetView) {
  const value = budget.ignoredCategories.find(
    (category) => category.id === categoryID,
  );
  return value !== undefined && value !== null;
}

function CategoryOption({ category }: { category: BudgetCategoryView }) {
  return <option value={category.id}>{category.name}</option>;
}

function CategoryOptions({ budget }: { budget: BudgetView }) {
  const spacer =
    budget.categories.length > 0 && budget.ignoredCategories.length > 0 ? (
      <option value="" disabled>
        — ignored categories below —
      </option>
    ) : null;

  return (
    <>
      {budget.categories.map((category) => (
        <CategoryOption key={category.id} category={category} />
      ))}
      {spacer}
      {budget.ignoredCategories.map((category) => (
        <CategoryOption key={category.id} category={category} />
      ))}
    </>
  );
}

type BudgetItemUsage =
  | "budget-and-categorization"
  | "budget-only"
  | "categorization-only";

function getBudgetItemUsage(fields: BudgetItemFields): BudgetItemUsage {
  if (fields.amount === null) {
    return "categorization-only";
  }
  if (fields.budget_only) {
    return "budget-only";
  }
  return "budget-and-categorization";
}

function BudgetItemUsageForm({
  usage,
  updateUsage,
}: {
  usage: BudgetItemUsage;
  updateUsage: (BudgetItemUsage) => void;
}) {
  return (
    <>
      <label>Usage</label>
      <select value={usage} onChange={updateUsage}>
        <option value={"budget-and-categorization"}>
          Budget & categorization
        </option>
        <option value={"budget-only"}>Budget only</option>
        <option value={"categorization-only"}>Categorization only</option>
      </select>
    </>
  );
}

export function BudgetItemForm({
  budgetItem,
  onSuccess,
  budget,
}: {
  budgetItem: BudgetItem | null;
  onSuccess: () => void;
  budget: BudgetView;
}) {
  const initialFields = {
    name: budgetItem?.name ?? "",
    category_id: budgetItem?.category_id ?? budget.categories[0].id,
    amount: budgetItem !== null ? budgetItem.amount : DEFAULT_AMOUNT,
    budget_only: budgetItem !== null ? budgetItem.budget_only : false,
  };

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fields, setFields] = useState<BudgetItemFields>(initialFields);

  const categoryIgnored = isCategoryIgnored(fields.category_id, budget);
  const usage = getBudgetItemUsage(fields);

  const clearErrorMessage = () => {
    if (errorMessage !== null) {
      setErrorMessage(null);
    }
  };

  const setName = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLInputElement;
    const newName = target.value;
    setFields({ ...fields, name: newName });
  };

  const setCategoryID = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLSelectElement;
    const newCategoryID = Number(target.value);
    const newCategoryIgnored = isCategoryIgnored(newCategoryID, budget);
    if (categoryIgnored && !newCategoryIgnored) {
      const amount = fields.amount || budgetItem?.amount || DEFAULT_AMOUNT;
      setFields({
        ...fields,
        category_id: newCategoryID,
        amount: amount,
      });
    } else {
      setFields({ ...fields, category_id: newCategoryID });
    }
  };

  const setAmount = (amount: BudgetAmount) => {
    setFields({ ...fields, amount: amount });
  };

  const setUsage = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLSelectElement;
    const newUsage = target.value as BudgetItemUsage;
    if (usage === newUsage) {
      return;
    }
    if (newUsage === "categorization-only") {
      setFields({ ...fields, amount: null, budget_only: false });
      return;
    }
    const amount = fields.amount || budgetItem?.amount || DEFAULT_AMOUNT;
    if (newUsage === "budget-only") {
      setFields({ ...fields, amount: amount, budget_only: true });
    } else if (newUsage === "budget-and-categorization") {
      setFields({ ...fields, amount: amount, budget_only: false });
    }
  };

  const onSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();

    try {
      const updatedName = fields.name.trim();
      if (updatedName === "") {
        throw Error("Budget Item Name can't be empty!");
      }
      const updatedAmount = categoryIgnored ? null : fields.amount;
      if (fields.budget_only && (categoryIgnored || updatedAmount === null)) {
        throw Error("Budget only usage requires amount to be provided");
      }
      const updatedFields = {
        name: updatedName,
        category_id: fields.category_id,
        amount: updatedAmount,
        budget_only: fields.budget_only,
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

    maybeDeleteButton = (
      <GlyphButton glyph="delete" onClick={deleteBudgetItem} />
    );
  }

  const showUsageSelector = !categoryIgnored;
  const showAmountSelector = !(categoryIgnored || fields.amount === null);

  return (
    <>
      <ErrorCard message={errorMessage} />
      <Form onSubmit={onSubmit}>
        <label>Budget Item Name</label>
        <input type="text" value={fields.name} onChange={setName} />

        <label>Budget Item Category</label>
        <select value={fields.category_id} onChange={setCategoryID}>
          <CategoryOptions budget={budget} />
        </select>

        {showUsageSelector && (
          <BudgetItemUsageForm usage={usage} updateUsage={setUsage} />
        )}

        {showAmountSelector && (
          <BudgetAmountForm
            budgetAmount={fields.amount!}
            updateBudgetAmount={setAmount}
          />
        )}

        <FormButtons>
          {maybeDeleteButton}
          <FormSubmitButton text={budgetItem === null ? "Create" : "Update"} />
        </FormButtons>
      </Form>
    </>
  );
}
