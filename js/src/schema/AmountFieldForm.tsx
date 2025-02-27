import React from "react";

import { AmountField } from "../types/RecordMapping";
import { OptionParamsFromColumn, FromColumnForm } from "./FromColumn";

type OptionName = "FromColumn";
type OptionParams = OptionParamsFromColumn;

function getOptionName(field: AmountField): OptionName {
  if (Object.prototype.hasOwnProperty.call(field, "FromColumn")) {
    return "FromColumn";
  }
  throw new Error("Unexpected shape of AmountField");
}

function getOptionParams(field: AmountField): OptionParams {
  if (Object.prototype.hasOwnProperty.call(field, "FromColumn")) {
    return field.FromColumn!;
  }
  throw new Error("Unexpected shape of AmountField");
}

function getDefaultOptionParams(optionName: OptionName): OptionParams {
  switch (optionName) {
    case "FromColumn":
      return { col: 2 };
  }
  throw new Error("Unexpected shape of AmountField");
}

export function AmountFieldForm({
  amount,
  updateAmount,
}: {
  amount: AmountField;
  updateAmount: (AmountField) => void;
}) {
  const optionName = getOptionName(amount);
  const optionParams = getOptionParams(amount);

  const update = (newOptionName: OptionName, newOptionParams: OptionParams) => {
    switch (newOptionName) {
      case "FromColumn": {
        updateAmount({ FromColumn: newOptionParams });
        break;
      }
      default:
        throw new Error("Unexpected shape of AmountField");
    }
  };

  const onOptionNameChange = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLSelectElement;
    const newOptionName = target.value as OptionName;
    const newOptionParams = getDefaultOptionParams(newOptionName);
    update(newOptionName, newOptionParams);
  };

  let optionParamsSelector: React.ReactNode = null;
  switch (optionName) {
    case "FromColumn": {
      optionParamsSelector = (
        <FromColumnForm
          params={optionParams as OptionParamsFromColumn}
          updateParams={(newParams: OptionParamsFromColumn) =>
            update("FromColumn", newParams)
          }
        />
      );
      break;
    }
    default:
      throw new Error("Unexpected shape of AmountField");
  }

  return (
    <>
      <select value={optionName} onChange={onOptionNameChange}>
        <option value="FromColumn">FromColumn</option>
      </select>
      {optionParamsSelector}
    </>
  );
}
