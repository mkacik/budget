import React from "react";

import { TimeField } from "../types/RecordMapping";
import { FromColumnWithTZ, FromColumnWithTZForm } from "./FromColumn";
import { LabeledSelect } from "../ui/Form";

const EMPTY = "Empty";
const FROM_COLUMN = "FromColumn";

type Variant = typeof FROM_COLUMN | typeof EMPTY;
type Params = FromColumnWithTZ | null;

function getDefaultParams(variant: Variant): Params {
  switch (variant) {
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
  const variant = time.variant;
  const params = "params" in time ? time.params : null;

  const update = (newVariant: Variant, newParams: Params) => {
    switch (newVariant) {
      case FROM_COLUMN: {
        updateTime({ variant: FROM_COLUMN, params: newParams });
        return;
      }
      case EMPTY:
        {
          updateTime({ variant: EMPTY });
          return;
        }
        throw new Error("Unexpected shape of TimeField");
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
    case EMPTY:
      break;
    default:
      throw new Error("Unexpected shape of TimeField");
  }

  return (
    <>
      <LabeledSelect
        label="Mapping function"
        value={variant}
        onChange={onVariantChange}
      >
        <option value={EMPTY}>{EMPTY}</option>
        <option value={FROM_COLUMN}>{FROM_COLUMN}</option>
      </LabeledSelect>
      {paramsSelector}
    </>
  );
}
