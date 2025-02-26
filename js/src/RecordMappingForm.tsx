import React from "react";
import { useState } from "react";

import {
  AmountField,
  DateField,
  TextField,
  TimeField,
  TZ,
  RecordMapping,
} from "./types/RecordMapping";

function DateFieldForm({
  date,
  updateDate,
}: {
  date: DateField | null;
  updateDate: (DateField) => void;
}) {
  return <div>{JSON.stringify(date)}</div>;
}

function TimeFieldForm({
  time,
  updateTime,
}: {
  time: TimeField | null;
  updateTime: (TimeField) => void;
}) {
  return <div>{JSON.stringify(time)}</div>;
}

function TextFieldForm({
  text,
  updateText,
}: {
  text: TextField | null;
  updateText: (TextField) => void;
}) {
  return <div>{JSON.stringify(text)}</div>;
}

function AmountFieldForm({
  amount,
  updateAmount,
}: {
  amount: AmountField | null;
  updateAmount: (AmountField) => void;
}) {
  return <div>{JSON.stringify(amount)}</div>;
}

/* This form is done differently than all other create/edit flows, because available selectors
for values representing specific fields will change depending of which enum value was selected.
So it's much easier to handle with onChange hooks, vs trying to somehow capture all options in
single form. */
export function RecordMappingForm({
  recordMapping,
  updateRecordMapping,
}: {
  recordMapping: RecordMapping | null;
  updateRecordMapping: (newRecordMapping: RecordMapping) => void;
}) {
  const [transactionDate, setTransactionDate] = useState<DateField | null>(
    recordMapping?.transaction_date ?? null,
  );

  const [transactionTime, setTransactionTime] = useState<TimeField | null>(
    recordMapping?.transaction_time ?? null,
  );

  const [description, setDescription] = useState<TextField | null>(
    recordMapping?.description ?? null,
  );

  const [amount, setAmount] = useState<AmountField | null>(
    recordMapping?.amount ?? null,
  );

  return (
    <div>
      <DateFieldForm
        date={transactionDate}
        updateDate={(val) => setTransactionDate(val)}
      />
      <TimeFieldForm
        time={transactionTime}
        updateTime={(val) => setTransactionTime(val)}
      />
      <TextFieldForm
        text={description}
        updateText={(val) => setDescription(val)}
      />
      <AmountFieldForm amount={amount} updateAmount={(val) => setAmount(val)} />
    </div>
  );
}
