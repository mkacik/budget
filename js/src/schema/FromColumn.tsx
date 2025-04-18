import React from "react";

import { TZ } from "../types/RecordMapping";

const EMPTY = "";

export type FromColumn = { col: number };

export function FromColumnForm({
  params,
  updateParams,
}: {
  params: FromColumn;
  updateParams: (newParams: FromColumn) => void;
}) {
  const updateCol = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLInputElement;
    const col = Number(target.value);
    updateParams({ col: col });
  };

  return (
    <>
      <label>Column</label>
      <input type="number" value={params.col} onChange={updateCol} />
    </>
  );
}

export type FromColumnWithTZ = { col: number; tz: TZ };

export function FromColumnWithTZForm({
  params,
  updateParams,
}: {
  params: FromColumnWithTZ;
  updateParams: (newParams: FromColumnWithTZ) => void;
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
    <>
      <label>Column</label>
      <input type="number" value={params.col} onChange={updateCol} />

      <label>Timezone</label>
      <select value={params.tz} onChange={updateTz}>
        <option value="Local">Local</option>
        <option value="UTC">UTC</option>
      </select>
    </>
  );
}

export type FromColumnWithInvert = {
  col: number;
  invert: boolean;
  skip_pattern: string | null;
};

export function FromColumnWithInvertForm({
  params,
  updateParams,
}: {
  params: FromColumnWithInvert;
  updateParams: (newParams: FromColumnWithInvert) => void;
}) {
  const updateCol = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLInputElement;
    const col = Number(target.value);
    const newOptionParams = { ...params, col: col };
    updateParams(newOptionParams);
  };

  const updateInvert = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLInputElement;
    const invert = target.checked;
    const newOptionParams = { ...params, invert: invert };
    updateParams(newOptionParams);
  };

  const updateSkipPattern = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLInputElement;
    const skipPattern =
      target.value === null || target.value === EMPTY ? null : target.value;
    const newOptionParams = { ...params, skip_pattern: skipPattern };
    updateParams(newOptionParams);
  };

  return (
    <>
      <label>Column</label>
      <input type="number" value={params.col} onChange={updateCol} />

      <label>Flip sign</label>
      <input type="checkbox" checked={params.invert} onChange={updateInvert} />

      <label>Skip if field contains</label>
      <input
        type="input"
        value={params.skip_pattern ?? EMPTY}
        onChange={updateSkipPattern}
      />
    </>
  );
}

export type FromCreditDebitColumns = {
  first: number;
  invert_first: boolean;
  second: number;
  invert_second: boolean;
};

export function FromCreditDebitColumnsForm({
  params,
  updateParams,
}: {
  params: FromCreditDebitColumns;
  updateParams: (newParams: FromCreditDebitColumns) => void;
}) {
  const updateFirst = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLInputElement;
    const col = Number(target.value);
    const newOptionParams = { ...params, first: col };
    updateParams(newOptionParams);
  };

  const updateInvertFirst = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLInputElement;
    const invert = target.checked;
    const newOptionParams = { ...params, invert_first: invert };
    updateParams(newOptionParams);
  };

  const updateSecond = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLInputElement;
    const col = Number(target.value);
    const newOptionParams = { ...params, second: col };
    updateParams(newOptionParams);
  };

  const updateInvertSecond = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLInputElement;
    const invert = target.checked;
    const newOptionParams = { ...params, invert_second: invert };
    updateParams(newOptionParams);
  };

  return (
    <>
      <label>Column</label>
      <input type="number" value={params.first} onChange={updateFirst} />

      <label>Flip sign</label>
      <input
        type="checkbox"
        checked={params.invert_first}
        onChange={updateInvertFirst}
      />

      <label>Column</label>
      <input type="number" value={params.second} onChange={updateSecond} />

      <label>Flip sign</label>
      <input
        type="checkbox"
        checked={params.invert_second}
        onChange={updateInvertSecond}
      />
    </>
  );
}
