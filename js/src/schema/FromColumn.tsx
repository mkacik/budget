import React from "react";

import { TZ } from "../types/RecordMapping";

export type OptionParamsFromColumn = { col: number };

export function FromColumnForm({
  params,
  updateParams,
}: {
  params: OptionParamsFromColumn;
  updateParams: (newParams: OptionParamsFromColumn) => void;
}) {
  const updateCol = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLInputElement;
    const col = Number(target.value);
    updateParams({ col: col });
  };

  return (
    <div>
      <input type="number" value={params.col} onChange={updateCol} />
    </div>
  );
}

export type OptionParamsFromColumnWithTZ = { col: number; tz: TZ };

export function FromColumnFormWithTZ({
  params,
  updateParams,
}: {
  params: OptionParamsFromColumnWithTZ;
  updateParams: (newParams: OptionParamsFromColumnWithTZ) => void;
}) {
  const updateCol = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLInputElement;
    const col = Number(target.value);
    const newOptionParams = { ...params, col: col };
    updateParams(newOptionParams);
  };

  const updateTz = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLSelectElement;
    const tz = target.value as TZ;
    const newOptionParams = { ...params, tz: tz };
    updateParams(newOptionParams);
  };

  return (
    <div>
      <input type="number" value={params.col} onChange={updateCol} />
      <select value={params.tz} onChange={updateTz}>
        <option value="Local">Local</option>
        <option value="UTC">UTC</option>
      </select>
    </div>
  );
}
