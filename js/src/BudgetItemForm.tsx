import React from "react";
import { useState } from "react";

import {
  BudgetItem,
  BudgetItemFields,
  BudgetAmount,
  BudgetCategory,
} from "./types/Budget";
import { BudgetFund } from "./types/Fund";

import { BudgetView, BudgetCategoryView } from "./BudgetView";
import { BudgetAmountForm } from "./BudgetAmountForm";

import {
  Form,
  FormButtons,
  FormSubmitButton,
  LabeledInput,
  LabeledSelect,
} from "./ui/Form";
import { FetchHelper, JSON_HEADERS } from "./Common";

import * as UI from "./ui/Common";

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

function CategoryOptions({
  categories,
  ignoredCategories,
  hasFund,
}: {
  categories: Array<BudgetCategoryView>;
  ignoredCategories: Array<BudgetCategoryView>;
  hasFund: boolean;
}) {
  const getSpacer = () => {
    if (ignoredCategories.length === 0) {
      return null;
    }

    const baseText = "ignored categories below";
    const extraText =
      hasFund && " (cannot be selected for item attached to fund)";

    return (
      <option value="" disabled>
        — {baseText}
        {extraText} —
      </option>
    );
  };

  return (
    <>
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
      {getSpacer()}
      {ignoredCategories.map((category) => (
        <option
          key={category.id}
          value={category.id}
          disabled={hasFund}
          title={
            hasFund ? "Cannot be selected for item attached to fund" : undefined
          }
        >
          {category.name}
        </option>
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
      <option value={"budget-only"}>Budget creation only</option>
      <option value={"categorization-only"}>Categorization only</option>
    </LabeledSelect>
  );
}

export function BudgetItemForm({
  item,
  categoryID,
  onSuccess,
  budget,
  funds,
}: {
  item: BudgetItem | null;
  categoryID: number | null;
  onSuccess: () => void;
  budget: BudgetView;
  funds: Array<BudgetFund>;
}) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fields, setFields] = useState<BudgetItemFields>(
    item ?? {
      name: "",
      category_id: categoryID ?? budget.categories[0].id,
      fund_id: null,
      amount: DEFAULT_AMOUNT,
      budget_only: false,
    },
  );

  const categoryIgnored = budget.getCategory(fields.category_id).ignored;
  const usage = getBudgetItemUsage(fields);

  const setName = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLInputElement;
    const newName = target.value;
    setFields({ ...fields, name: newName });
  };

  const setCategoryID = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLSelectElement;
    const newCategoryID = Number(target.value);
    const newCategoryIgnored = budget.getCategory(newCategoryID).ignored;
    if (categoryIgnored && !newCategoryIgnored) {
      const amount = fields.amount || item?.amount || DEFAULT_AMOUNT;
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
    const amount = fields.amount || item?.amount || DEFAULT_AMOUNT;
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
        item === null
          ? createBudgetItemRequest(updatedFields)
          : updateBudgetItemRequest(item.id, updatedFields);

      fetchHelper.fetch(request, (_json) => onSuccess());
    } catch (error) {
      fetchHelper.handleError(error);
    }
  };

  const maybeDeleteButton = item && (
    <UI.GlyphButton
      glyph="delete"
      onClick={() =>
        fetchHelper.fetch(deleteBudgetItemRequest(item.id), (_json) =>
          onSuccess(),
        )
      }
    />
  );

  const showUsageSelector = !categoryIgnored;
  const showFundSelector = !categoryIgnored;
  const showAmountSelector = !(categoryIgnored || fields.amount === null);
  const hasFund = fields.fund_id !== null;

  return (
    <>
      <UI.ErrorCard message={errorMessage} />
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
          <CategoryOptions
            categories={budget.categories}
            ignoredCategories={budget.ignoredCategories}
            hasFund={hasFund}
          />
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
          <FormSubmitButton text={item === null ? "Create" : "Update"} />
        </FormButtons>
      </Form>
    </>
  );
}
