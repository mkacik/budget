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

export function getDefaultRecordMapping(): RecordMapping {
  const recordMapping: RecordMapping = {
    transaction_date: { FromColumn: { col: 0, tz: "Local" } },
    transaction_time: "Empty",
    description: { FromColumn: { col: 1 } },
    amount: { FromColumn: { col: 2, invert: false } },
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
      <div>
        Transaction Date
        <DateFieldForm
          date={recordMapping.transaction_date}
          updateDate={updateTransactionDate}
        />
      </div>
      <div>
        Transaction Time
        <TimeFieldForm
          time={recordMapping.transaction_time}
          updateTime={updateTransactionTime}
        />
      </div>
      <div>
        Description
        <TextFieldForm
          text={recordMapping.description}
          updateText={updateDescription}
        />
      </div>
      <div>
        Amount
        <AmountFieldForm
          amount={recordMapping.amount}
          updateAmount={updateAmount}
        />
      </div>
    </>
  );
}
