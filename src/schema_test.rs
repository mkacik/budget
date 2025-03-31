use csv::ReaderBuilder;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::expense::ExpenseFields;
use crate::record_mapping::ImportResult;
use crate::statement_schema::StatementSchemaFields;

#[derive(Debug, Deserialize, TS)]
#[ts(export_to = "SchemaTest.ts")]
pub struct TestSchemaRequest {
    pub schema: StatementSchemaFields,
    pub row: String,
}

#[derive(Debug, Serialize, TS)]
#[ts(export_to = "SchemaTest.ts")]
pub enum TestSchemaResult {
    Skip,
    Error,
    Success,
}

#[derive(Debug, Serialize, TS)]
#[ts(export_to = "SchemaTest.ts")]
pub struct TestSchemaResponse {
    pub result: TestSchemaResult,
    pub error: Option<String>,
    pub expense: Option<ExpenseFields>,
}

impl TestSchemaRequest {
    pub fn process(&self) -> TestSchemaResponse {
        test_schema(self)
    }
}

fn test_schema(request: &TestSchemaRequest) -> TestSchemaResponse {
    let data = request.row.clone();
    let mut reader = ReaderBuilder::new()
        .has_headers(false)
        .from_reader(data.as_bytes());
    let mut iter = reader.records();

    let row = match iter.next() {
        Some(value) => value,
        _ => {
            return TestSchemaResponse {
                result: TestSchemaResult::Error,
                error: Some(String::from(
                    "Csv created from given input has no rows, check your input data.",
                )),
                expense: None,
            }
        }
    };

    let record = match row {
        Ok(value) => value,
        _ => {
            return TestSchemaResponse {
                result: TestSchemaResult::Error,
                error: Some(String::from(
                    "Failed to create csv record from provided row, check your input data.",
                )),
                expense: None,
            }
        }
    };

    let record_mapping = &request.schema.record_mapping;
    let dummy_account_id = 0;

    match record_mapping.record_to_expense(record, dummy_account_id) {
        Ok(expense) => TestSchemaResponse {
            result: TestSchemaResult::Success,
            error: None,
            expense: Some(expense),
        },
        Err(ImportResult::Skip) => TestSchemaResponse {
            result: TestSchemaResult::Skip,
            error: None,
            expense: None,
        },
        Err(ImportResult::Error { message }) => TestSchemaResponse {
            result: TestSchemaResult::Error,
            error: Some(String::from(message)),
            expense: None,
        },
    }
}
