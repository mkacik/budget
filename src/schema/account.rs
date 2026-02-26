use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use ts_rs::TS;

use crate::database::{Database, ID};

#[derive(Debug, Serialize, Deserialize, TS, PartialEq)]
#[ts(export_to = "Account.ts")]
pub enum AccountType {
    Bank,
    CreditCard,
    Shop,
    Cash,
}

#[derive(Debug, FromRow, Serialize, Deserialize, TS)]
#[ts(export_to = "Account.ts")]
pub struct AccountFields {
    pub name: String,
    pub account_type: AccountType,
    pub statement_schema_id: Option<ID>,
}

#[derive(Debug, FromRow, Serialize, Deserialize, TS)]
#[ts(export_to = "Account.ts")]
pub struct Account {
    pub id: ID,
    #[serde(flatten)]
    #[sqlx(flatten)]
    #[ts(flatten)]
    pub fields: AccountFields,
}

#[derive(Debug, Serialize, TS)]
#[ts(export_to = "Account.ts")]
pub struct Accounts {
    pub accounts: Vec<Account>,
}

impl Account {
    pub async fn create(db: &Database, fields: AccountFields) -> anyhow::Result<ID> {
        let mut conn = db.acquire_db_conn().await?;
        let id: ID = sqlx::query_scalar!(
            "INSERT INTO accounts (name, account_type, statement_schema_id)
            VALUES (?1, ?2, ?3) RETURNING id",
            fields.name,
            fields.account_type,
            fields.statement_schema_id,
        )
        .fetch_one(&mut *conn)
        .await?
        .try_into()
        .unwrap();

        Ok(id)
    }

    pub async fn delete_by_id(db: &Database, id: ID) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;
        sqlx::query!("DELETE FROM accounts WHERE id = ?1", id,)
            .execute(&mut *conn)
            .await?;

        Ok(())
    }

    pub async fn fetch_all(db: &Database) -> anyhow::Result<Accounts> {
        let mut conn = db.acquire_db_conn().await?;
        let results = sqlx::query_as::<_, Account>(
            "SELECT id, name, account_type, statement_schema_id FROM accounts ORDER BY name",
        )
        .fetch_all(&mut *conn)
        .await?;

        Ok(Accounts { accounts: results })
    }

    pub async fn fetch_by_id(db: &Database, id: ID) -> anyhow::Result<Account> {
        let mut conn = db.acquire_db_conn().await?;
        let result = sqlx::query_as::<_, Account>(
            "SELECT id, name, account_type, statement_schema_id FROM accounts WHERE id = ?1",
        )
        .bind(id)
        .fetch_one(&mut *conn)
        .await?;

        Ok(result)
    }

    pub async fn fetch_by_schema_id(db: &Database, id: ID) -> anyhow::Result<Accounts> {
        let mut conn = db.acquire_db_conn().await?;
        let results = sqlx::query_as::<_, Account>(
            "SELECT id, name, account_type, statement_schema_id FROM accounts
            WHERE statement_schema_id = ?1",
        )
        .bind(id)
        .fetch_all(&mut *conn)
        .await?;

        Ok(Accounts { accounts: results })
    }

    pub async fn update(&self, db: &Database) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;

        sqlx::query!(
            "UPDATE accounts SET
                name = ?2,
                account_type = ?3,
                statement_schema_id = ?4
            WHERE id = ?1",
            self.id,
            self.fields.name,
            self.fields.account_type,
            self.fields.statement_schema_id
        )
        .execute(&mut *conn)
        .await?;

        Ok(())
    }
}
