/* Rust enums are really nice concept, but can't be saved verbatim to db, so I'm serializing them
to JSON string. Implementing sqlx::Decode on just the enum types allows to skip boilerplate of
implementing sqlx::FromRow for every database-stored struct that could hold the enum.

TODO: This is still lot of code repetition, and looks like I could autogenerate this via macro, or
somehow add generically for everything that implements Deserialize trait.
*/

use crate::account::AccountClass;
use crate::budget::BudgetAmount;
use crate::record_mapping::RecordMapping;

impl<'r, DB: sqlx::Database> sqlx::Decode<'r, DB> for AccountClass
where
    &'r str: sqlx::Decode<'r, DB>,
{
    fn decode(
        value: <DB as sqlx::Database>::ValueRef<'r>,
    ) -> Result<AccountClass, Box<dyn std::error::Error + 'static + Send + Sync>> {
        let json_string = <&str as sqlx::Decode<DB>>::decode(value)?;

        let value: AccountClass = match serde_json::from_str(json_string) {
            Ok(value) => value,
            Err(e) => {
                let err: Box<dyn std::error::Error + 'static + Send + Sync> =
                    format!("{:?}", e).into();
                return Err(err);
            }
        };

        Ok(value)
    }
}

impl sqlx::Type<sqlx::Sqlite> for AccountClass {
    fn type_info() -> <sqlx::Sqlite as sqlx::Database>::TypeInfo {
        <&str as sqlx::Type<sqlx::Sqlite>>::type_info()
    }
}

impl<'r, DB: sqlx::Database> sqlx::Decode<'r, DB> for BudgetAmount
where
    &'r str: sqlx::Decode<'r, DB>,
{
    fn decode(
        value: <DB as sqlx::Database>::ValueRef<'r>,
    ) -> Result<BudgetAmount, Box<dyn std::error::Error + 'static + Send + Sync>> {
        let json_string = <&str as sqlx::Decode<DB>>::decode(value)?;

        let value: BudgetAmount = match serde_json::from_str(json_string) {
            Ok(value) => value,
            Err(e) => {
                let err: Box<dyn std::error::Error + 'static + Send + Sync> =
                    format!("{:?}", e).into();
                return Err(err);
            }
        };

        Ok(value)
    }
}

impl sqlx::Type<sqlx::Sqlite> for BudgetAmount {
    fn type_info() -> <sqlx::Sqlite as sqlx::Database>::TypeInfo {
        <&str as sqlx::Type<sqlx::Sqlite>>::type_info()
    }
}

impl<'r, DB: sqlx::Database> sqlx::Decode<'r, DB> for RecordMapping
where
    &'r str: sqlx::Decode<'r, DB>,
{
    fn decode(
        value: <DB as sqlx::Database>::ValueRef<'r>,
    ) -> Result<RecordMapping, Box<dyn std::error::Error + 'static + Send + Sync>> {
        let json_string = <&str as sqlx::Decode<DB>>::decode(value)?;

        let value: RecordMapping = match serde_json::from_str(json_string) {
            Ok(value) => value,
            Err(e) => {
                let err: Box<dyn std::error::Error + 'static + Send + Sync> =
                    format!("{:?}", e).into();
                return Err(err);
            }
        };

        Ok(value)
    }
}

impl sqlx::Type<sqlx::Sqlite> for RecordMapping {
    fn type_info() -> <sqlx::Sqlite as sqlx::Database>::TypeInfo {
        <&str as sqlx::Type<sqlx::Sqlite>>::type_info()
    }
}
