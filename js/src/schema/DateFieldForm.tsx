import React from "react";

import { DateField } from "../types/RecordMapping";
import { FromColumnWithTZ, FromColumnWithTZForm } from "./FromColumn";

const FROM_COLUMN: string = "FromColumn";

type OptionName = typeof FROM_COLUMN;
type OptionParams = FromColumnWithTZ;

function getOptionName(field: DateField): OptionName {
  if (Object.prototype.hasOwnProperty.call(field, FROM_COLUMN)) {
    return FROM_COLUMN;
  }
  throw new Error("Unexpected shape of DateField");
}

function getOptionParams(field: DateField): OptionParams {
  if (Object.prototype.hasOwnProperty.call(field, FROM_COLUMN)) {
    return field[FROM_COLUMN]!;
  }
  throw new Error("Unexpected shape of DateField");
}

function getDefaultOptionParams(optionName: OptionName): OptionParams {
  switch (optionName) {
    case FROM_COLUMN:
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
      case FROM_COLUMN: {
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
    case FROM_COLUMN: {
      optionParamsSelector = (
        <FromColumnWithTZForm
          params={optionParams as FromColumnWithTZ}
          updateParams={(newParams: OptionParams) =>
            update(FROM_COLUMN, newParams)
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
        <option value={FROM_COLUMN}>{FROM_COLUMN}</option>
      </select>
      {optionParamsSelector}
    </>
  );
}
