import React from "react";

import { TimeField, TZ } from "../types/RecordMapping";

type OptionName = "Empty" | "FromColumn";
type OptionParamsEmpty = null;
type OptionParamsFromColumn = { col: number; tz: TZ };
type OptionParams = OptionParamsEmpty | OptionParamsFromColumn;

function getOptionName(field: TimeField): OptionName {
  if (field === "Empty") {
    return "Empty";
  } else if (Object.prototype.hasOwnProperty.call(field, "FromColumn")) {
    return "FromColumn";
  }
  throw new Error("Unexpected shape of TimeField");
}

function getOptionParams(field: TimeField): OptionParams {
  if (field === "Empty") {
    return null;
  } else if (Object.prototype.hasOwnProperty.call(field, "FromColumn")) {
    return field.FromColumn!;
  }
  throw new Error("Unexpected shape of TimeField");
}

function getDefaultOptionParams(optionName: OptionName): OptionParams {
  switch (optionName) {
    case "Empty":
      return null;
    case "FromColumn":
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
      case "FromColumn": {
        updateTime({ FromColumn: newOptionParams });
        break;
      }
      case "Empty": {
        updateTime("Empty");
        break;
      }
    }
    throw new Error("Unexpected shape of TimeField");
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
      const params = optionParams as OptionParamsFromColumn;
      const updateCol = (e: React.SyntheticEvent) => {
        const target = e.target as HTMLInputElement;
        const col = Number(target.value);
        const newOptionParams = { ...params, col: col };
        update(optionName, newOptionParams);
      };

      const updateTz = (e: React.SyntheticEvent) => {
        const target = e.target as HTMLSelectElement;
        const tz = target.value as TZ;
        const newOptionParams = { ...params, tz: tz };
        update(optionName, newOptionParams);
      };

      optionParamsSelector = (
        <div>
          <input type="number" value={params.col} onChange={updateCol} />
          <select value={params.tz} onChange={updateTz}>
            <option value="Local">Local</option>
            <option value="UTC">UTC</option>
          </select>
        </div>
      );
      break;
    }
    case "Empty":
      {
        // Empty option has no additional params
        break;
      }
      throw new Error("Unexpected shape of TimeField");
  }

  return (
    <>
      <select value={optionName} onChange={onOptionNameChange}>
        <option value="Empty">Empty</option>
        <option value="FromColumn">FromColumn</option>
      </select>
      {optionParamsSelector}
    </>
  );
}
