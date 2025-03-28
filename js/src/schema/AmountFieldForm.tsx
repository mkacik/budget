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

type OptionName = typeof FROM_COLUMN | typeof FROM_CREDIT_DEBIT_COLUMNS;
type OptionParams = FromColumnWithInvert | FromCreditDebitColumns;

function getOptionName(field: AmountField): OptionName {
  if (Object.prototype.hasOwnProperty.call(field, FROM_COLUMN)) {
    return FROM_COLUMN;
  }
  if (Object.prototype.hasOwnProperty.call(field, FROM_CREDIT_DEBIT_COLUMNS)) {
    return FROM_CREDIT_DEBIT_COLUMNS;
  }
  throw new Error("Unexpected shape of AmountField");
}

function getOptionParams(field: AmountField): OptionParams {
  if (Object.prototype.hasOwnProperty.call(field, FROM_COLUMN)) {
    return field[FROM_COLUMN]!;
  }
  if (Object.prototype.hasOwnProperty.call(field, FROM_CREDIT_DEBIT_COLUMNS)) {
    return field[FROM_CREDIT_DEBIT_COLUMNS]!;
  }
  throw new Error("Unexpected shape of AmountField");
}

function getDefaultOptionParams(optionName: OptionName): OptionParams {
  switch (optionName) {
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
  const optionName = getOptionName(amount);
  const optionParams = getOptionParams(amount);

  const update = (newOptionName: OptionName, newOptionParams: OptionParams) => {
    switch (newOptionName) {
      case FROM_COLUMN: {
        updateAmount({ FromColumn: newOptionParams });
        break;
      }
      case FROM_CREDIT_DEBIT_COLUMNS: {
        updateAmount({ FromCreditDebitColumns: newOptionParams });
        break;
      }
      default:
        throw new Error("Unexpected shape of AmountField");
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
        <FromColumnWithInvertForm
          params={optionParams as FromColumnWithInvert}
          updateParams={(newParams: OptionParams) =>
            update(FROM_COLUMN, newParams)
          }
        />
      );
      break;
    }
    case FROM_CREDIT_DEBIT_COLUMNS: {
      optionParamsSelector = (
        <FromCreditDebitColumnsForm
          params={optionParams as FromCreditDebitColumns}
          updateParams={(newParams: OptionParams) =>
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
      <select value={optionName} onChange={onOptionNameChange}>
        <option value={FROM_COLUMN}>{FROM_COLUMN}</option>
        <option value={FROM_CREDIT_DEBIT_COLUMNS}>
          {FROM_CREDIT_DEBIT_COLUMNS}
        </option>
      </select>
      {optionParamsSelector}
    </>
  );
}
