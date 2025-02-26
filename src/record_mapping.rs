use csv::StringRecord;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::database::ID;
use crate::datetime::{to_local_date, to_local_time, TZ};
use crate::expense::ExpenseFields;

type ColID = usize;

#[derive(Debug, Serialize, Deserialize, TS)]
#[ts(export_to = "RecordMapping.ts")]
pub enum DateField {
    FromColumn { col: ColID, tz: TZ },
}

#[derive(Debug, Serialize, Deserialize, TS)]
#[ts(export_to = "RecordMapping.ts")]
pub enum TimeField {
    FromColumn { col: ColID, tz: TZ },
    Empty,
}

#[derive(Debug, Serialize, Deserialize, TS)]
#[ts(export_to = "RecordMapping.ts")]
pub enum AmountField {
    FromColumn { col: ColID },
}

#[derive(Debug, Serialize, Deserialize, TS)]
#[ts(export_to = "RecordMapping.ts")]
pub enum TextField {
    FromColumn { col: ColID },
}

#[derive(Debug, Serialize, Deserialize, TS)]
#[ts(export_to = "RecordMapping.ts")]
pub struct RecordMapping {
    pub transaction_date: DateField,
    pub transaction_time: TimeField,
    pub description: TextField,
    pub amount: AmountField,
}

impl DateField {
    fn from_record(&self, record: &StringRecord) -> anyhow::Result<String> {
        match self {
            DateField::FromColumn { col, tz } => {
                let field = &record[*col];
                let date = to_local_date(field, tz)?;

                Ok(date)
            }
        }
    }
}

impl TimeField {
    fn from_record(&self, record: &StringRecord) -> anyhow::Result<Option<String>> {
        match self {
            TimeField::FromColumn { col, tz } => {
                let field = &record[*col];
                let time = to_local_time(field, tz)?;

                Ok(Some(time))
            }
            TimeField::Empty => Ok(None),
        }
    }
}

impl AmountField {
    fn from_record(&self, record: &StringRecord) -> anyhow::Result<f64> {
        match self {
            AmountField::FromColumn { col } => {
                let field = &record[*col];
                let value = match field.parse::<f64>() {
                    Ok(value) => value,
                    Err(_) => {
                        return Err(anyhow::anyhow!(
                            "Could not parse {:?} into f64, check your import config.",
                            field
                        ))
                    }
                };

                Ok(value)
            }
        }
    }
}

impl TextField {
    fn from_record(&self, record: &StringRecord) -> anyhow::Result<String> {
        match self {
            TextField::FromColumn { col } => {
                let field = &record[*col];

                Ok(field.to_string())
            }
        }
    }
}

impl RecordMapping {
    pub fn record_to_expense(
        &self,
        record: StringRecord,
        account_id: ID,
    ) -> anyhow::Result<ExpenseFields> {
        let transaction_date = self.transaction_date.from_record(&record)?;
        let transaction_time = self.transaction_time.from_record(&record)?;
        let description = self.description.from_record(&record)?;
        let amount = self.amount.from_record(&record)?;

        let expense = ExpenseFields {
            account_id: account_id,
            transaction_date: transaction_date,
            transaction_time: transaction_time,
            description: description,
            amount: amount,
        };

        Ok(expense)
    }
}
