use csv::{Reader, StringRecord};
use serde::{Deserialize, Serialize};

use crate::datetime::{to_local_date, to_local_time, TZ};
use crate::expense::Expense;

pub fn parse_statement(mapping: &RecordMapping, path: String) -> anyhow::Result<()> {
    let mut reader = Reader::from_path(path)?;
    for result in reader.records() {
        let record = result?;
        let expense = mapping.record_to_expense(record);
        println!("{:?}", expense);
    }

    Ok(())
}

type ColID = usize;

#[derive(Debug, Serialize, Deserialize)]
pub enum TransactionDate {
    FromColumn { col: ColID, tz: TZ },
}

#[derive(Debug, Serialize, Deserialize)]
pub enum TransactionTime {
    FromColumn { col: ColID, tz: TZ },
    Empty,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum Amount {
    FromColumn { col: ColID },
}

#[derive(Debug, Serialize, Deserialize)]
pub enum OptionalText {
    FromColumn { col: ColID },
    Empty,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum RequiredText {
    FromColumn { col: ColID },
}

impl TransactionDate {
    fn from_record(&self, record: &StringRecord) -> anyhow::Result<String> {
        match self {
            TransactionDate::FromColumn { col, tz } => {
                let field = &record[*col];
                let date = to_local_date(field, tz)?;

                Ok(date)
            }
        }
    }
}

impl TransactionTime {
    fn from_record(&self, record: &StringRecord) -> anyhow::Result<Option<String>> {
        match self {
            TransactionTime::FromColumn { col, tz } => {
                let field = &record[*col];
                let time = to_local_time(field, tz)?;

                Ok(Some(time))
            }
            TransactionTime::Empty => Ok(None),
        }
    }
}

impl Amount {
    fn from_record(&self, record: &StringRecord) -> anyhow::Result<f64> {
        match self {
            Amount::FromColumn { col } => {
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

impl OptionalText {
    fn from_record(&self, record: &StringRecord) -> anyhow::Result<Option<String>> {
        match self {
            OptionalText::FromColumn { col } => {
                let field = &record[*col];

                Ok(Some(field.to_string()))
            }
            OptionalText::Empty => Ok(None),
        }
    }
}

impl RequiredText {
    fn from_record(&self, record: &StringRecord) -> anyhow::Result<String> {
        match self {
            RequiredText::FromColumn { col } => {
                let field = &record[*col];

                Ok(field.to_string())
            }
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RecordMapping {
    pub transaction_date: TransactionDate,
    pub transaction_time: TransactionTime,
    pub description: RequiredText,
    pub amount: Amount,
    pub details: OptionalText,
}

impl RecordMapping {
    fn record_to_expense(&self, record: StringRecord) -> anyhow::Result<Expense> {
        let transaction_date = self.transaction_date.from_record(&record)?;
        let transaction_time = self.transaction_time.from_record(&record)?;
        let description = self.description.from_record(&record)?;
        let amount: f64 = self.amount.from_record(&record)?;
        let details = self.details.from_record(&record)?;

        let expense = Expense {
            transaction_date: transaction_date,
            transaction_time: transaction_time,
            description: description,
            amount: amount,
            details: details,
        };

        Ok(expense)
    }
}
