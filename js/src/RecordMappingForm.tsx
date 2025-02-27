import React from "react";
import { useState } from "react";

import {
  AmountField,
  DateField,
  TextField,
  TimeField,
  RecordMapping,
} from "./types/RecordMapping";

import { TimeFieldForm } from "./schema/TimeFieldForm";

function DateFieldForm({
  date,
  updateDate,
}: {
  date: DateField;
  updateDate: (DateField) => void;
}) {
  return <div>{JSON.stringify(date)}</div>;
}

function TextFieldForm({
  text,
  updateText,
}: {
  text: TextField;
  updateText: (TextField) => void;
}) {
  return <div>{JSON.stringify(text)}</div>;
}

function AmountFieldForm({
  amount,
  updateAmount,
}: {
  amount: AmountField;
  updateAmount: (AmountField) => void;
}) {
  return <div>{JSON.stringify(amount)}</div>;
}

export function getDefaultRecordMapping(): RecordMapping {
  const recordMapping: RecordMapping = {
    transaction_date: { FromColumn: { col: 0, tz: "Local" } },
    transaction_time: "Empty",
    description: { FromColumn: { col: 1 } },
    amount: { FromColumn: { col: 2 } },
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
  const [transactionDate, setTransactionDate] = useState<DateField>(
    recordMapping.transaction_date,
  );
  const [description, setDescription] = useState<TextField>(
    recordMapping.description,
  );
  const [amount, setAmount] = useState<AmountField>(recordMapping.amount);

  const updateTransactionTime = (value: TimeField) => {
    updateRecordMapping({ ...recordMapping, transaction_time: value });
  };

  return (
    <>
      <span>Transaction Date</span>
      <DateFieldForm
        date={transactionDate}
        updateDate={(val) => setTransactionDate(val)}
      />
      <span>Transaction Time</span>
      <TimeFieldForm
        time={recordMapping.transaction_time}
        updateTime={updateTransactionTime}
      />
      <span>Description</span>
      <TextFieldForm
        text={description}
        updateText={(val) => setDescription(val)}
      />
      <span>Amount</span>
      <AmountFieldForm amount={amount} updateAmount={(val) => setAmount(val)} />
    </>
  );
}
