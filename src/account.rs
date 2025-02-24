use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use ts_rs::TS;

use crate::database::Database;

type ID = i32;

#[derive(Debug, Serialize, Deserialize, TS)]
#[ts(export_to = "Account.ts")]
pub enum AccountClass {
    Bank,
    CreditCard,
    Shop,
}

#[derive(Debug, FromRow, Serialize, Deserialize, TS)]
#[ts(export_to = "Account.ts")]
pub struct AccountFields {
    pub name: String,
    pub class: AccountClass,
    pub statement_import_config_id: Option<ID>,
}

#[derive(Debug, FromRow, Serialize, Deserialize, TS)]
#[ts(export_to = "Account.ts")]
pub struct Account {
    #[ts(type = "number")]
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
    pub async fn create(db: &Database, fields: AccountFields) -> anyhow::Result<Account> {
        let mut conn = db.acquire_db_conn().await?;
        let id: i32 = sqlx::query_scalar!(
            "INSERT INTO accounts (name, class, statement_import_config_id)
            VALUES (?1, ?2, ?3) RETURNING id",
            fields.name,
            fields.class,
            fields.statement_import_config_id,
        )
        .fetch_one(&mut *conn)
        .await?
        .try_into()
        .unwrap();

        Account::fetch_by_id(db, id).await
    }

    pub async fn delete_by_id(db: &Database, id: i32) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;
        sqlx::query!("DELETE FROM accounts WHERE id = ?1", id,)
            .execute(&mut *conn)
            .await?;

        Ok(())
    }

    pub async fn fetch_all(db: &Database) -> anyhow::Result<Accounts> {
        let mut conn = db.acquire_db_conn().await?;
        let results = sqlx::query_as::<_, Account>(
            "SELECT id, name, class, statement_import_config_id FROM accounts ORDER BY name",
        )
        .fetch_all(&mut *conn)
        .await?;

        Ok(Accounts { accounts: results })
    }

    pub async fn fetch_by_id(db: &Database, id: i32) -> anyhow::Result<Account> {
        let mut conn = db.acquire_db_conn().await?;
        let result = sqlx::query_as::<_, Account>(
            "SELECT id, name, class, statement_import_config_id FROM accounts WHERE id = ?1",
        )
        .bind(id)
        .fetch_one(&mut *conn)
        .await?;

        Ok(result)
    }

    pub async fn fetch_by_name(db: &Database, name: &str) -> anyhow::Result<Account> {
        let mut conn = db.acquire_db_conn().await?;
        let result = sqlx::query_as::<_, Account>(
            "SELECT id, name, class, statement_import_config_id FROM accounts WHERE name = ?1",
        )
        .bind(name)
        .fetch_one(&mut *conn)
        .await?;

        Ok(result)
    }

    pub async fn update(&self, db: &Database) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;

        sqlx::query!(
            "UPDATE accounts SET
                name = ?2,
                class = ?3,
                statement_import_config_id = ?4
            WHERE id = ?1",
            self.id,
            self.fields.name,
            self.fields.class,
            self.fields.statement_import_config_id
        )
        .execute(&mut *conn)
        .await?;

        Ok(())
    }
}
