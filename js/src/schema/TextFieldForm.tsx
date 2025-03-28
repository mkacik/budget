import React from "react";

import { TextField } from "../types/RecordMapping";
import { FromColumn, FromColumnForm } from "./FromColumn";

const FROM_COLUMN = "FromColumn";

type OptionName = typeof FROM_COLUMN;
type OptionParams = FromColumn;

function getOptionName(field: TextField): OptionName {
  if (Object.prototype.hasOwnProperty.call(field, FROM_COLUMN)) {
    return FROM_COLUMN;
  }
  throw new Error("Unexpected shape of TextField");
}

function getOptionParams(field: TextField): OptionParams {
  if (Object.prototype.hasOwnProperty.call(field, FROM_COLUMN)) {
    return field.FromColumn!;
  }
  throw new Error("Unexpected shape of TextField");
}

function getDefaultOptionParams(optionName: OptionName): OptionParams {
  switch (optionName) {
    case FROM_COLUMN:
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
      case FROM_COLUMN: {
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
    case FROM_COLUMN: {
      optionParamsSelector = (
        <FromColumnForm
          params={optionParams as FromColumn}
          updateParams={(newParams: OptionParams) =>
            update(FROM_COLUMN, newParams)
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
      <label>Mapping function</label>
      <select value={optionName} onChange={onOptionNameChange}>
        <option value={FROM_COLUMN}>{FROM_COLUMN}</option>
      </select>
      {optionParamsSelector}
    </>
  );
}
