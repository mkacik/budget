import React from "react";

import { DateField } from "../types/RecordMapping";
import {
  OptionParamsFromColumnWithTZ as OptionParamsFromColumn,
  FromColumnFormWithTZ as FromColumnForm,
} from "./FromColumn";

type OptionName = "FromColumn";
type OptionParams = OptionParamsFromColumn;

function getOptionName(field: DateField): OptionName {
  if (Object.prototype.hasOwnProperty.call(field, "FromColumn")) {
    return "FromColumn";
  }
  throw new Error("Unexpected shape of DateField");
}

function getOptionParams(field: DateField): OptionParams {
  if (Object.prototype.hasOwnProperty.call(field, "FromColumn")) {
    return field.FromColumn!;
  }
  throw new Error("Unexpected shape of DateField");
}

function getDefaultOptionParams(optionName: OptionName): OptionParams {
  switch (optionName) {
    case "FromColumn":
      return { col: 0, tz: "Local" };
  }
  throw new Error("Unexpected shape of DateField");
}

export function DateFieldForm({
  date,
  updateDate,
}: {
  date: DateField;
  updateDate: (DateField) => void;
}) {
  const optionName = getOptionName(date);
  const optionParams = getOptionParams(date);

  const update = (newOptionName: OptionName, newOptionParams: OptionParams) => {
    switch (newOptionName) {
      case "FromColumn": {
        updateDate({ FromColumn: newOptionParams });
        break;
      }
      default:
        throw new Error("Unexpected shape of DateField");
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
      throw new Error("Unexpected shape of DateField");
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
