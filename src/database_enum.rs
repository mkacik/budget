/* Rust enums are really nice concept, but can't be saved verbatim to db, so I'm serializing them
to JSON string. Implementing sqlx::Decode on just the enum types allows to skip boilerplate of
implementing sqlx::FromRow for every database-stored struct that could hold the enum.

TODO: This is still lot of code repetition, and looks like I could autogenerate this via macro, or
somehow add generically for everything that implements Deserialize trait. */

use crate::account::AccountClass;
use crate::budget::BudgetAmount;
use crate::record_mapping::RecordMapping;

use sqlx::encode::IsNull;
use sqlx::sqlite::SqliteArgumentValue;
use sqlx::Database as SqlxDatabase;
use sqlx::{Decode, Encode, Sqlite, Type};

type BoxDynError = Box<dyn std::error::Error + 'static + Send + Sync>;

impl<'r> Decode<'r, Sqlite> for AccountClass {
    fn decode(value: <Sqlite as SqlxDatabase>::ValueRef<'r>) -> Result<AccountClass, BoxDynError> {
        let json_string = <&str as Decode<Sqlite>>::decode(value)?;

        let value: AccountClass = match serde_json::from_str(json_string) {
            Ok(value) => value,
            Err(e) => {
                let err: BoxDynError = format!("{:?}", e).into();
                return Err(err);
            }
        };

        Ok(value)
    }
}

impl Type<Sqlite> for AccountClass {
    fn type_info() -> <Sqlite as SqlxDatabase>::TypeInfo {
        <&str as Type<Sqlite>>::type_info()
    }
}

impl<'q> Encode<'q, Sqlite> for AccountClass {
    fn encode_by_ref(&self, buf: &mut Vec<SqliteArgumentValue<'q>>) -> Result<IsNull, BoxDynError> {
        let string = match serde_json::to_string(&self) {
            Ok(value) => value,
            Err(e) => {
                let err: BoxDynError = format!("{:?}", e).into();
                return Err(err);
            }
        };

        Encode::<Sqlite>::encode(string, buf)
    }
}

impl<'r> Decode<'r, Sqlite> for BudgetAmount {
    fn decode(value: <Sqlite as SqlxDatabase>::ValueRef<'r>) -> Result<BudgetAmount, BoxDynError> {
        let json_string = <&str as Decode<Sqlite>>::decode(value)?;

        let value: BudgetAmount = match serde_json::from_str(json_string) {
            Ok(value) => value,
            Err(e) => {
                let err: BoxDynError = format!("{:?}", e).into();
                return Err(err);
            }
        };

        Ok(value)
    }
}

impl Type<Sqlite> for BudgetAmount {
    fn type_info() -> <Sqlite as SqlxDatabase>::TypeInfo {
        <&str as Type<Sqlite>>::type_info()
    }
}

impl<'q> Encode<'q, Sqlite> for BudgetAmount {
    fn encode_by_ref(&self, buf: &mut Vec<SqliteArgumentValue<'q>>) -> Result<IsNull, BoxDynError> {
        let string = match serde_json::to_string(&self) {
            Ok(value) => value,
            Err(e) => {
                let err: BoxDynError = format!("{:?}", e).into();
                return Err(err);
            }
        };

        Encode::<Sqlite>::encode(string, buf)
    }
}

impl<'r> Decode<'r, Sqlite> for RecordMapping {
    fn decode(value: <Sqlite as SqlxDatabase>::ValueRef<'r>) -> Result<RecordMapping, BoxDynError> {
        let json_string = <&str as Decode<Sqlite>>::decode(value)?;

        let value: RecordMapping = match serde_json::from_str(json_string) {
            Ok(value) => value,
            Err(e) => {
                let err: BoxDynError = format!("{:?}", e).into();
                return Err(err);
            }
        };

        Ok(value)
    }
}

impl Type<Sqlite> for RecordMapping {
    fn type_info() -> <Sqlite as SqlxDatabase>::TypeInfo {
        <&str as Type<Sqlite>>::type_info()
    }
}

impl<'q> Encode<'q, Sqlite> for RecordMapping {
    fn encode_by_ref(&self, buf: &mut Vec<SqliteArgumentValue<'q>>) -> Result<IsNull, BoxDynError> {
        let string = match serde_json::to_string(&self) {
            Ok(value) => value,
            Err(e) => {
                let err: BoxDynError = format!("{:?}", e).into();
                return Err(err);
            }
        };

        Encode::<Sqlite>::encode(string, buf)
    }
}
