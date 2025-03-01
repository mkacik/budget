import React from "react";

import { BudgetAmount } from "./types/Budget";

const WEEKLY: string = "Weekly";
const MONTHLY: string = "Monthly";
const YEARLY: string = "Yearly";
const EVERY_X_YEARS: string = "EveryXYears";

type AmountParams = {
  amount: number;
};

type EveryXYearsAmountParams = {
  amount: number;
  x: number;
};

type OptionName =
  | typeof WEEKLY
  | typeof MONTHLY
  | typeof YEARLY
  | typeof EVERY_X_YEARS;
type OptionParams = AmountParams | EveryXYearsAmountParams;

function getNewOptionParams(
  optionName: OptionName,
  optionParams: OptionParams,
): OptionParams {
  switch (optionName) {
    case WEEKLY:
    case MONTHLY:
    case YEARLY:
      return { amount: optionParams.amount };
    case EVERY_X_YEARS:
      return { amount: optionParams.amount, x: 5 };
    default:
      throw new Error("Unexpected shape of BudgetAmount");
  }
}

export function BudgetAmountForm({
  budgetAmount,
  updateBudgetAmount,
}: {
  budgetAmount: BudgetAmount;
  updateBudgetAmount: (BudgetAmount) => void;
}) {
  const optionName = Object.keys(budgetAmount)[0]!;
  const optionParams = budgetAmount[optionName]!;

  const update = (newOptionName: OptionName, newOptionParams: OptionParams) => {
    const newBudgetAmount = {};
    newBudgetAmount[newOptionName] = newOptionParams;
    updateBudgetAmount(newBudgetAmount as BudgetAmount);
  };

  const onOptionNameChange = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLSelectElement;
    const newOptionName = target.value as OptionName;
    const newOptionParams = getNewOptionParams(newOptionName, optionParams);
    update(newOptionName, newOptionParams);
  };

  const onAmountChange = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLInputElement;
    const value = Number(target.value);
    update(optionName, { ...optionParams, amount: value });
  };

  let maybeXSelector: React.ReactNode = null;
  if (optionName === EVERY_X_YEARS) {
    const params = optionParams as EveryXYearsAmountParams;

    const onXChange = (e: React.SyntheticEvent) => {
      const target = e.target as HTMLInputElement;
      const value = Number(target.value);
      update(optionName, { ...params, x: value });
    };

    maybeXSelector = (
      <input type="number" value={params.x} onChange={onXChange} />
    );
  }

  return (
    <>
      <label>Budget Amount</label>
      <select value={optionName} onChange={onOptionNameChange}>
        <option value={WEEKLY}>{WEEKLY}</option>
        <option value={MONTHLY}>{MONTHLY}</option>
        <option value={YEARLY}>{YEARLY}</option>
        <option value={EVERY_X_YEARS}>Every X Years</option>
      </select>
      <input
        type="number"
        value={optionParams.amount}
        onChange={onAmountChange}
      />
      {maybeXSelector}
    </>
  );
}
