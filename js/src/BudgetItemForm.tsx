import React from "react";
import { useState } from "react";

import {
  BudgetItem,
  BudgetItemFields,
  Allowance,
  BudgetFund,
} from "./generated/types";

import { BudgetView, BudgetCategoryView } from "./BudgetView";
import { AllowanceForm } from "./AllowanceForm";

import {
  Form,
  FormButtons,
  FormSubmitButton,
  LabeledInput,
  LabeledSelect,
} from "./ui/Form";
import { FetchHelper, JSON_HEADERS } from "./Common";

import * as UI from "./ui/Common";

const DEFAULT_ALLOWANCE: Allowance = { variant: "Weekly", amount: 10000 };

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
  if (fields.allowance === null) {
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
      allowance: DEFAULT_ALLOWANCE,
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
      /* ignored categories do not have allowance set, but new category is not ignored, so it
      needs non-null allowance to start.
        1. try allowance from locally saved fields - used may have already filled something
          in there but did not click save yet, so they will expect to pop back to what they
          edited
        2. try allowance from item
        3. if item was empty or it's allowance was empty, fall back to DEFAULT_ALLOWANCE */
      const allowance =
        fields.allowance || item?.allowance || DEFAULT_ALLOWANCE;
      setFields({
        ...fields,
        category_id: newCategoryID,
        allowance: allowance,
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

  const setAllowance = (allowance: Allowance) => {
    setFields({ ...fields, allowance: allowance });
  };

  const setUsage = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLSelectElement;
    const newUsage = target.value as BudgetItemUsage;
    if (usage === newUsage) {
      return;
    }

    if (newUsage === "categorization-only") {
      setFields({ ...fields, allowance: null, budget_only: false });
      return;
    }

    // see comment from setCategoryID about the order of choosing allowance below
    const allowance = fields.allowance || item?.allowance || DEFAULT_ALLOWANCE;
    if (newUsage === "budget-only") {
      setFields({ ...fields, allowance: allowance, budget_only: true });
      return;
    }

    // "budget-and-categorization"
    setFields({ ...fields, allowance: allowance, budget_only: false });
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

      const updatedAllowance = categoryIgnored ? null : fields.allowance;
      if (
        fields.budget_only &&
        (categoryIgnored || updatedAllowance === null)
      ) {
        throw Error("Budget only usage requires allowance to be provided");
      }

      const updatedFields = {
        name: updatedName,
        category_id: fields.category_id,
        fund_id: fields.fund_id,
        allowance: updatedAllowance,
        budget_only: fields.budget_only,
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

  const showUsageSelector = !categoryIgnored; // usage is moot for ignored category
  const showFundSelector = !categoryIgnored; // funds can't be mixed with ignored category
  const showAllowanceSelector = !(categoryIgnored || fields.allowance === null);
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

        {showAllowanceSelector && (
          <AllowanceForm
            allowance={fields.allowance!}
            updateAllowance={setAllowance}
          />
        )}

        <FormButtons>
          {item && (
            <UI.GlyphButton
              glyph="delete"
              onClick={() =>
                fetchHelper.fetch(deleteBudgetItemRequest(item.id), (_json) =>
                  onSuccess(),
                )
              }
            />
          )}
          <FormSubmitButton text={item === null ? "Create" : "Update"} />
        </FormButtons>
      </Form>
    </>
  );
}
