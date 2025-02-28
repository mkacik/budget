import React from "react";

import { TimeField } from "../types/RecordMapping";
import { FromColumnWithTZ, FromColumnWithTZForm } from "./FromColumn";

const EMPTY: string = "Empty";
const FROM_COLUMN: string = "FromColumn";

type OptionName = typeof EMPTY | typeof FROM_COLUMN;
type Empty = null;
type OptionParams = Empty | FromColumnWithTZ;

function getOptionName(field: TimeField): OptionName {
  if (field === EMPTY) {
    return EMPTY;
  } else if (Object.prototype.hasOwnProperty.call(field, FROM_COLUMN)) {
    return FROM_COLUMN;
  }
  throw new Error("Unexpected shape of TimeField");
}

function getOptionParams(field: TimeField): OptionParams {
  if (field === EMPTY) {
    return null;
  } else if (Object.prototype.hasOwnProperty.call(field, FROM_COLUMN)) {
    return field[FROM_COLUMN]!;
  }
  throw new Error("Unexpected shape of TimeField");
}

function getDefaultOptionParams(optionName: OptionName): OptionParams {
  switch (optionName) {
    case EMPTY:
      return null;
    case FROM_COLUMN:
      return { col: 0, tz: "Local" };
  }
  throw new Error("Unexpected shape of TimeField");
}

export function TimeFieldForm({
  time,
  updateTime,
}: {
  time: TimeField;
  updateTime: (TimeField) => void;
}) {
  const optionName = getOptionName(time);
  const optionParams = getOptionParams(time);

  const update = (newOptionName: OptionName, newOptionParams: OptionParams) => {
    switch (newOptionName) {
      case FROM_COLUMN: {
        updateTime({ FromColumn: newOptionParams });
        break;
      }
      case EMPTY: {
        updateTime(EMPTY);
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
    case EMPTY:
      break;
    default:
      throw new Error("Unexpected shape of TimeField");
  }

  return (
    <>
      <select value={optionName} onChange={onOptionNameChange}>
        <option value={EMPTY}>{EMPTY}</option>
        <option value={FROM_COLUMN}>{FROM_COLUMN}</option>
      </select>
      {optionParamsSelector}
    </>
  );
}
