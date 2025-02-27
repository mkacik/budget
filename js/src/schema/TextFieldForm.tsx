import React from "react";

import { TextField } from "../types/RecordMapping";
import { OptionParamsFromColumn, FromColumnForm } from "./FromColumn";

type OptionName = "FromColumn";
type OptionParams = OptionParamsFromColumn;

function getOptionName(field: TextField): OptionName {
  if (Object.prototype.hasOwnProperty.call(field, "FromColumn")) {
    return "FromColumn";
  }
  throw new Error("Unexpected shape of TextField");
}

function getOptionParams(field: TextField): OptionParams {
  if (Object.prototype.hasOwnProperty.call(field, "FromColumn")) {
    return field.FromColumn!;
  }
  throw new Error("Unexpected shape of TextField");
}

function getDefaultOptionParams(optionName: OptionName): OptionParams {
  switch (optionName) {
    case "FromColumn":
      return { col: 1 };
  }
  throw new Error("Unexpected shape of TextField");
}

export function TextFieldForm({
  text,
  updateText,
}: {
  text: TextField;
  updateText: (TextField) => void;
}) {
  const optionName = getOptionName(text);
  const optionParams = getOptionParams(text);

  const update = (newOptionName: OptionName, newOptionParams: OptionParams) => {
    switch (newOptionName) {
      case "FromColumn": {
        updateText({ FromColumn: newOptionParams });
        break;
      }
      default:
        throw new Error("Unexpected shape of TextField");
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
      throw new Error("Unexpected shape of TextField");
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
