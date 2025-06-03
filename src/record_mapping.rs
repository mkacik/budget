use csv::StringRecord;
use regex::Regex;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::database::ID;
use crate::datetime::{to_local_date, to_local_time, TZ};
use crate::expense::ExpenseFields;

const SEPARATOR: &str = "\u{241F}";

type ColID = usize;

#[derive(Debug)]
pub enum ImportResult {
    Skip,
    Error { message: String },
}

#[derive(Debug, Serialize, Deserialize, TS)]
#[serde(tag = "variant", content = "params")]
#[ts(export_to = "RecordMapping.ts", tag = "variant", content = "params")]
pub enum DateField {
    FromColumn { col: ColID, tz: TZ },
}

#[derive(Debug, Serialize, Deserialize, TS)]
#[serde(tag = "variant", content = "params")]
#[ts(export_to = "RecordMapping.ts", tag = "variant", content = "params")]
pub enum TimeField {
    FromColumn { col: ColID, tz: TZ },
    Empty,
}

#[derive(Debug, Serialize, Deserialize, TS)]
#[serde(tag = "variant", content = "params")]
#[ts(export_to = "RecordMapping.ts", tag = "variant", content = "params")]
pub enum AmountField {
    FromColumn {
        col: ColID,
        invert: bool,
        skip_pattern: Option<String>,
    },
    FromCreditDebitColumns {
        first: ColID,
        invert_first: bool,
        second: ColID,
        invert_second: bool,
    },
}

#[derive(Debug, Serialize, Deserialize, TS)]
#[serde(tag = "variant", content = "params")]
#[ts(export_to = "RecordMapping.ts", tag = "variant", content = "params")]
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

fn get_col(record: &StringRecord, col: ColID) -> Result<&str, ImportResult> {
    let value = match record.get(col) {
        Some(value) => value,
        None => {
            let message = format!(
                "Requested 0-indexed column {} but row only had {} fields",
                col,
                record.len(),
            );
            return Err(ImportResult::Error { message: message });
        }
    };

    Ok(value)
}

impl DateField {
    fn from_record(&self, record: &StringRecord) -> Result<String, ImportResult> {
        match self {
            DateField::FromColumn { col, tz } => {
                let field = get_col(&record, *col)?;

                let value = match to_local_date(field, tz) {
                    Ok(value) => value,
                    Err(_) => {
                        let message = format!("Could not parse '{}' into a date", field);
                        return Err(ImportResult::Error { message: message });
                    }
                };

                Ok(value)
            }
        }
    }
}

impl TimeField {
    fn from_record(&self, record: &StringRecord) -> Result<Option<String>, ImportResult> {
        match self {
            TimeField::FromColumn { col, tz } => {
                let field = get_col(&record, *col)?;

                let value = match to_local_time(field, tz) {
                    Ok(value) => value,
                    Err(_) => {
                        let message = format!("Could not parse '{}' into a time", field);
                        return Err(ImportResult::Error { message: message });
                    }
                };

                Ok(Some(value))
            }
            TimeField::Empty => Ok(None),
        }
    }
}

impl AmountField {
    fn from_record(&self, record: &StringRecord) -> Result<f64, ImportResult> {
        match self {
            AmountField::FromColumn {
                col,
                invert,
                skip_pattern,
            } => {
                let field = get_col(&record, *col)?;

                if let Some(pattern) = skip_pattern {
                    if field.contains(pattern) {
                        return Err(ImportResult::Skip);
                    }
                }

                AmountField::parse_from_str(field, *invert)
            }
            AmountField::FromCreditDebitColumns {
                first,
                invert_first,
                second,
                invert_second,
            } => {
                let first_col = get_col(&record, *first)?;
                let second_col = get_col(&record, *second)?;

                let (field, invert) = if first_col != "" {
                    (first_col, invert_first)
                } else {
                    (second_col, invert_second)
                };

                AmountField::parse_from_str(field, *invert)
            }
        }
    }

    fn parse_from_str(field: &str, invert: bool) -> Result<f64, ImportResult> {
        let value = match strip_thousands_separator(field).parse::<f64>() {
            Ok(value) => {
                if invert {
                    -value
                } else {
                    value
                }
            }
            Err(_) => {
                let message = format!("Could not parse '{}' into f64", field);
                return Err(ImportResult::Error { message: message });
            }
        };

        Ok(value)
    }
}

fn strip_thousands_separator(string: &str) -> String {
    // string.parse::<f64>() does not understand commas as thousands separator.
    let re = Regex::new(r"-?\d+,\d+\.\d\d").unwrap();

    match re.is_match(string) {
        true => string.replace(",", ""),
        false => string.to_string(),
    }
}

impl TextField {
    fn from_record(&self, record: &StringRecord) -> Result<String, ImportResult> {
        match self {
            TextField::FromColumn { col } => {
                let field = get_col(&record, *col)?;

                Ok(field.to_string())
            }
        }
    }
}

fn record_to_string(record: &StringRecord) -> String {
    let mut strings: Vec<String> = vec![];
    for n in 0..record.len() {
        let field = &record[n];
        strings.push(field.to_string());
    }

    strings.join(SEPARATOR)
}

impl RecordMapping {
    pub fn record_to_expense(
        &self,
        record: StringRecord,
        account_id: ID,
    ) -> Result<ExpenseFields, ImportResult> {
        let transaction_date = self.transaction_date.from_record(&record)?;
        let transaction_time = self.transaction_time.from_record(&record)?;
        let description = self.description.from_record(&record)?;
        let amount = self.amount.from_record(&record)?;
        let raw_csv = Some(record_to_string(&record));

        let expense = ExpenseFields {
            account_id: account_id,
            transaction_date: transaction_date,
            transaction_time: transaction_time,
            description: description,
            amount: amount,
            raw_csv: raw_csv,
        };

        Ok(expense)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_text_field() {
        let record = StringRecord::from(vec!["ab", "cd", "ef"]);
        let result = TextField::FromColumn { col: 1 }.from_record(&record);
        assert!(result.is_ok());
        assert_eq!(&result.unwrap(), "cd");
    }

    #[test]
    fn test_text_field_empty_string() {
        let record = StringRecord::from(vec!["", "", ""]);
        let result = TextField::FromColumn { col: 1 }.from_record(&record);
        assert!(result.is_ok());
        assert_eq!(&result.unwrap(), "");
    }

    #[test]
    fn test_amount_field() {
        let record = StringRecord::from(vec!["ab", "0.69"]);
        let result = AmountField::FromColumn {
            col: 1,
            invert: false,
            skip_pattern: None,
        }
        .from_record(&record);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 0.69);
    }

    #[test]
    fn test_amount_field_thousand_separators() {
        let record = StringRecord::from(vec!["ab", "12,345.67"]);
        let result = AmountField::FromColumn {
            col: 1,
            invert: false,
            skip_pattern: None,
        }
        .from_record(&record);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 12345.67);
    }

    #[test]
    fn test_amount_field_invert() {
        let record = StringRecord::from(vec!["ab", "0.69"]);
        let result = AmountField::FromColumn {
            col: 1,
            invert: true,
            skip_pattern: None,
        }
        .from_record(&record);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), -0.69);
    }

    #[test]
    fn test_amount_field_skip_pattern() {
        let record = StringRecord::from(vec!["ab", "N/A"]);
        let result_err = AmountField::FromColumn {
            col: 1,
            invert: false,
            skip_pattern: None,
        }
        .from_record(&record);
        match result_err {
            Err(ImportResult::Error { message }) => {}
            _ => assert!(false, "Expected Err(ImportResult::Error {{ ... }})"),
        }

        let result_skip = AmountField::FromColumn {
            col: 1,
            invert: false,
            skip_pattern: Some(String::from("N/A")),
        }
        .from_record(&record);
        match result_skip {
            Err(ImportResult::Skip) => {}
            _ => assert!(false, "Expected Err(ImportResult::Skip)"),
        }
    }

    #[test]
    fn record_to_string_result_can_be_reconstructed_to_original_record() {
        let input_record =
            StringRecord::from(vec!["", "2025-02-04T23:41:32.506Z", "Lamp 64\"", "79.99"]);
        let output_string = record_to_string(&input_record);
        let output_fields: Vec<&str> = output_string.split(SEPARATOR).collect();
        let reconstructed_record = StringRecord::from(output_fields);
        assert_eq!(input_record, reconstructed_record);
    }
}
