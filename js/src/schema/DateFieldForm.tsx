import React from "react";

import { DateField } from "../types/RecordMapping";
import { FromColumnWithTZ, FromColumnWithTZForm } from "./FromColumn";

const FROM_COLUMN: string = "FromColumn";

type Variant = typeof FROM_COLUMN;
type Params = FromColumnWithTZ;

function getDefaultParams(variant: Variant): Params {
  switch (variant) {
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
  const variant = date.variant;
  const params = date.params;

  const update = (newVariant: Variant, newParams: Params) => {
    switch (newVariant) {
      case FROM_COLUMN:
        {
          updateDate({ variant: FROM_COLUMN, params: newParams });
          return;
        }
        throw new Error("Unexpected shape of DateField");
    }
  };

  const onVariantChange = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLSelectElement;
    const newVariant = target.value as Variant;
    const newParams = getDefaultParams(newVariant);
    update(newVariant, newParams);
  };

  let paramsSelector: React.ReactNode = null;
  switch (variant) {
    case FROM_COLUMN: {
      paramsSelector = (
        <FromColumnWithTZForm
          params={params as FromColumnWithTZ}
          updateParams={(newParams: Params) => update(FROM_COLUMN, newParams)}
        />
      );
      break;
    }
    default:
      throw new Error("Unexpected shape of DateField");
  }

  return (
    <>
      <label>Mapping function</label>
      <select value={variant} onChange={onVariantChange}>
        <option value={FROM_COLUMN}>{FROM_COLUMN}</option>
      </select>
      {paramsSelector}
    </>
  );
}
