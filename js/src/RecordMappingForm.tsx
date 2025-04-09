import React from "react";

import {
  AmountField,
  DateField,
  TextField,
  TimeField,
  RecordMapping,
} from "./types/RecordMapping";

import { AmountFieldForm } from "./schema/AmountFieldForm";
import { DateFieldForm } from "./schema/DateFieldForm";
import { TimeFieldForm } from "./schema/TimeFieldForm";
import { TextFieldForm } from "./schema/TextFieldForm";
import { FormSection, FormFieldWide } from "./ui/Form";

export function getDefaultRecordMapping(): RecordMapping {
  const recordMapping: RecordMapping = {
    transaction_date: {
      variant: "FromColumn",
      params: { col: 0, tz: "Local" },
    },
    transaction_time: { variant: "Empty" },
    description: { variant: "FromColumn", params: { col: 1 } },
    amount: {
      variant: "FromColumn",
      params: { col: 2, invert: false, skip_pattern: null },
    },
  } as RecordMapping;

  return recordMapping;
}

/* This form is done differently than all other create/edit flows, because available selectors
for values representing specific fields will change depending of which enum value was selected.
So it's much easier to handle with onChange hooks, vs trying to somehow capture all options in
single form. */
export function RecordMappingForm({
  recordMapping,
  updateRecordMapping,
}: {
  recordMapping: RecordMapping;
  updateRecordMapping: (newRecordMapping: RecordMapping) => void;
}) {
  const updateAmount = (value: AmountField) => {
    updateRecordMapping({ ...recordMapping, amount: value });
  };

  const updateTransactionDate = (value: DateField) => {
    updateRecordMapping({ ...recordMapping, transaction_date: value });
  };

  const updateTransactionTime = (value: TimeField) => {
    updateRecordMapping({ ...recordMapping, transaction_time: value });
  };

  const updateDescription = (value: TextField) => {
    updateRecordMapping({ ...recordMapping, description: value });
  };

  return (
    <>
      <FormFieldWide>
        <small>
          Choose mapping function for each of the required Expense fields below.
          Columns are 0-indexed. Amount is expexted to be a positive number, use
          "Flip sign" option if statement stores it as negative value.
        </small>
      </FormFieldWide>

      <FormSection title="Transaction Date">
        <DateFieldForm
          date={recordMapping.transaction_date}
          updateDate={updateTransactionDate}
        />
      </FormSection>
      <FormSection title="Transaction Time">
        <TimeFieldForm
          time={recordMapping.transaction_time}
          updateTime={updateTransactionTime}
        />
      </FormSection>
      <FormSection title="Description">
        <TextFieldForm
          text={recordMapping.description}
          updateText={updateDescription}
        />
      </FormSection>
      <FormSection title="Amount">
        <AmountFieldForm
          amount={recordMapping.amount}
          updateAmount={updateAmount}
        />
      </FormSection>
    </>
  );
}
