import React from "react";

import { BudgetAllowance } from "./types/Budget";

import { FormSection, LabeledInput, LabeledSelect } from "./ui/Form";

const VARIANTS = ["Weekly", "Monthly", "Yearly"];

function FrequencyOptions() {
  return VARIANTS.map((variant) => (
    <option key={variant} value={variant}>
      {variant}
    </option>
  ));
}

export function BudgetAllowanceForm({
  allowance,
  updateAllowance,
}: {
  allowance: BudgetAllowance;
  updateAllowance: (BudgetAllowance) => void;
}) {
  const setVariant = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLSelectElement;
    const newVariant = target.value;
    updateAllowance({ ...allowance, variant: newVariant });
  };

  const setAmount = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLInputElement;
    const newAmount = Number(target.value);
    const newAmountCents = Math.round(newAmount * 100);
    updateAllowance({ ...allowance, amount: newAmountCents });
  };

  return (
    <FormSection title="Budget Allowance">
      <LabeledSelect
        label="Frequency"
        value={allowance.variant}
        onChange={setVariant}
      >
        <FrequencyOptions />
      </LabeledSelect>

      <LabeledInput
        label="Amount"
        type="number"
        step="0.01"
        value={allowance.amount / 100}
        onChange={setAmount}
      />
    </FormSection>
  );
}
