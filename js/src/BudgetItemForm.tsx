import React from "react";
import { useState } from "react";

import { BudgetItem, BudgetItemFields, BudgetAmount } from "./types/Budget";
import { BudgetFund } from "./types/Fund";

import { BudgetView, BudgetCategoryView } from "./BudgetView";
import { BudgetAmountForm } from "./BudgetAmountForm";

import { GlyphButton, ErrorCard } from "./ui/Common";
import {
  Form,
  FormButtons,
  FormSubmitButton,
  LabeledInput,
  LabeledSelect,
} from "./ui/Form";
import { FetchHelper, JSON_HEADERS } from "./Common";

const DEFAULT_AMOUNT: BudgetAmount = { Weekly: { amount: 0 } };

function createBudgetItemRequest(fields: BudgetItemFields): Request {
  return new Request("/api/budget_items", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(fields),
  });
}

function updateBudgetItemRequest(
  id: number,
  fields: BudgetItemFields,
): Request {
  return new Request(`/api/budget_items/${id}`, {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify(fields),
  });
}

function deleteBudgetItemRequest(id: number): Request {
  return new Request(`/api/budget_items/${id}`, {
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

function FundOptions({ funds }: { funds: Array<BudgetFund> }) {
  return (
    <>
      <option value={0}>-</option>
      {funds.map((fund) => (
        <option key={fund.id} value={fund.id}>
          {fund.name}
        </option>
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
    <LabeledSelect label="Usage" value={usage} onChange={updateUsage}>
      <option value={"budget-and-categorization"}>
        Budget & categorization
      </option>
      <option value={"budget-only"}>Budget only</option>
      <option value={"categorization-only"}>Categorization only</option>
    </LabeledSelect>
  );
}

export function BudgetItemForm({
  budgetItem,
  onSuccess,
  budget,
  funds,
}: {
  budgetItem: BudgetItem | null;
  onSuccess: () => void;
  budget: BudgetView;
  funds: Array<BudgetFund>;
}) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fields, setFields] = useState<BudgetItemFields>(
    budgetItem ?? {
      name: "",
      category_id: budget.categories[0].id,
      fund_id: null,
      amount: DEFAULT_AMOUNT,
      budget_only: false,
    },
  );

  const categoryIgnored = isCategoryIgnored(fields.category_id, budget);
  const usage = getBudgetItemUsage(fields);

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

  const setFundID = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLInputElement;
    const newFundID = Number(target.value);
    setFields({ ...fields, fund_id: newFundID === 0 ? null : newFundID });
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
      return;
    }

    // "budget-and-categorization"
    setFields({ ...fields, amount: amount, budget_only: false });
  };

  const fetchHelper = new FetchHelper(setErrorMessage);

  const onSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();

    try {
      const updatedName = fields.name.trim();
      if (updatedName === "") {
        throw Error("Budget Item Name can't be empty!");
      }

      if (categoryIgnored && fields.fund_id) {
        throw Error(
          "Budget Items attached to a fund can't be moved to ignored category",
        );
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
        fund_id: fields.fund_id,
      } as BudgetItemFields;

      const request =
        budgetItem === null
          ? createBudgetItemRequest(updatedFields)
          : updateBudgetItemRequest(budgetItem.id, updatedFields);

      fetchHelper.fetch(request, (_json) => onSuccess());
    } catch (error) {
      fetchHelper.handleError(error);
    }
  };

  const maybeDeleteButton = budgetItem && (
    <GlyphButton
      glyph="delete"
      onClick={() =>
        fetchHelper.fetch(deleteBudgetItemRequest(budgetItem.id), (_json) =>
          onSuccess(),
        )
      }
    />
  );

  const showUsageSelector = !categoryIgnored;
  const showFundSelector = !categoryIgnored;
  const showAmountSelector = !(categoryIgnored || fields.amount === null);

  return (
    <>
      <ErrorCard message={errorMessage} />
      <Form onSubmit={onSubmit}>
        <LabeledInput
          label="Budget Item Name"
          type="text"
          value={fields.name}
          onChange={setName}
        />

        <LabeledSelect
          label="Category"
          value={fields.category_id}
          onChange={setCategoryID}
        >
          <CategoryOptions budget={budget} />
        </LabeledSelect>

        {showFundSelector && (
          <LabeledSelect
            label="Fund"
            value={fields.fund_id || 0}
            onChange={setFundID}
          >
            <FundOptions funds={funds} />
          </LabeledSelect>
        )}

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
