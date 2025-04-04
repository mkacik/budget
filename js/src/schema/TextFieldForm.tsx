import React from "react";

import { TextField } from "../types/RecordMapping";
import { FromColumn, FromColumnForm } from "./FromColumn";

const FROM_COLUMN = "FromColumn";

type Variant = typeof FROM_COLUMN;
type Params = FromColumn;

function getDefaultParams(variant: Variant): Params {
  switch (variant) {
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
  const variant = text.variant;
  const params = text.params;

  const update = (newVariant: Variant, newParams: Params) => {
    switch (newVariant) {
      case FROM_COLUMN:
        {
          updateText({ variant: FROM_COLUMN, params: newParams });
          return;
        }
        throw new Error("Unexpected shape of TextField");
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
        <FromColumnForm
          params={params as FromColumn}
          updateParams={(newParams: Params) => update(FROM_COLUMN, newParams)}
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
      <select value={variant} onChange={onVariantChange}>
        <option value={FROM_COLUMN}>{FROM_COLUMN}</option>
      </select>
      {paramsSelector}
    </>
  );
}
