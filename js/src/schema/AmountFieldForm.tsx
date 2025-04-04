import React from "react";

import { AmountField } from "../types/RecordMapping";
import {
  FromColumnWithInvert,
  FromColumnWithInvertForm,
  FromCreditDebitColumns,
  FromCreditDebitColumnsForm,
} from "./FromColumn";

const FROM_COLUMN: string = "FromColumn";
const FROM_CREDIT_DEBIT_COLUMNS: string = "FromCreditDebitColumns";

type Variant = typeof FROM_COLUMN | typeof FROM_CREDIT_DEBIT_COLUMNS;
type Params = FromColumnWithInvert | FromCreditDebitColumns;

function getDefaultParams(variant: Variant): Params {
  switch (variant) {
    case FROM_COLUMN:
      return { col: 2, invert: false, skip_pattern: null };
    case FROM_CREDIT_DEBIT_COLUMNS:
      return { first: 2, invert_first: false, second: 3, invert_second: true };
  }
  throw new Error("Unexpected shape of AmountField");
}

export function AmountFieldForm({
  amount,
  updateAmount,
}: {
  amount: AmountField;
  updateAmount: (AmountField) => void;
}) {
  const variant = amount.variant;
  const params = "params" in amount ? amount.params : null;

  const update = (newVariant: Variant, newParams: Params) => {
    switch (newVariant) {
      case FROM_COLUMN: {
        updateAmount({ variant: FROM_COLUMN, params: newParams });
        return;
      }
      case FROM_CREDIT_DEBIT_COLUMNS:
        {
          updateAmount({
            variant: FROM_CREDIT_DEBIT_COLUMNS,
            params: newParams,
          });
          return;
        }
        throw new Error("Unexpected shape of AmountField");
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
        <FromColumnWithInvertForm
          params={params as FromColumnWithInvert}
          updateParams={(newParams: Params) => update(FROM_COLUMN, newParams)}
        />
      );
      break;
    }
    case FROM_CREDIT_DEBIT_COLUMNS: {
      paramsSelector = (
        <FromCreditDebitColumnsForm
          params={params as FromCreditDebitColumns}
          updateParams={(newParams: Params) =>
            update(FROM_CREDIT_DEBIT_COLUMNS, newParams)
          }
        />
      );
      break;
    }
    default:
      throw new Error("Unexpected shape of AmountField");
  }

  return (
    <>
      <label>Mapping function</label>
      <select value={variant} onChange={onVariantChange}>
        <option value={FROM_COLUMN}>{FROM_COLUMN}</option>
        <option value={FROM_CREDIT_DEBIT_COLUMNS}>
          {FROM_CREDIT_DEBIT_COLUMNS}
        </option>
      </select>
      {paramsSelector}
    </>
  );
}
