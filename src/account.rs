use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::database::{Database, ID};

#[derive(Debug, Serialize, Deserialize, TS)]
pub enum AccountClass {
    Bank,
    CreditCard,
    Shop,
}

#[derive(Debug, sqlx::FromRow, Serialize, TS)]
pub struct Account {
    pub id: ID,
    pub name: String,
    pub class: AccountClass,
    pub statement_import_config_id: ID,
}

#[derive(Debug, Serialize, TS)]
pub struct Accounts {
    pub accounts: Vec<Account>,
}

impl Account {
    pub async fn fetch_all(db: &Database) -> anyhow::Result<Accounts> {
        let mut conn = db.acquire_db_conn().await?;
        let results = sqlx::query_as::<_, Account>(
            "SELECT id, name, class, statement_import_config_id FROM accounts ORDER BY name",
        )
        .fetch_all(&mut *conn)
        .await?;

        Ok(Accounts { accounts: results })
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

    pub async fn save(&mut self, db: &Database) -> anyhow::Result<()> {
        match self.id {
            None => self.insert(db).await,
            _ => self.update(db).await,
        }
    }

    async fn insert(&mut self, db: &Database) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;

        let class = serde_json::to_string(&self.class)?;
        let result = sqlx::query_scalar!(
      "INSERT INTO accounts (name, class, statement_import_config_id) VALUES (?1, ?2, ?3) RETURNING id",
      self.name,
      class,
      self.statement_import_config_id
    )
    .fetch_one(&mut *conn)
    .await?;
        let id: i32 = result.try_into().unwrap();
        self.id = Some(id);

        Ok(())
    }

    async fn update(&self, db: &Database) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;

        let class = serde_json::to_string(&self.class)?;
        sqlx::query!(
      "UPDATE accounts SET name = ?2, class = ?3, statement_import_config_id = ?4 WHERE id = ?1",
      self.id,
      self.name,
      class,
      self.statement_import_config_id
    )
        .execute(&mut *conn)
        .await?;

        Ok(())
    }
}
