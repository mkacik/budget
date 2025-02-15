use serde::{Deserialize, Serialize};
use sqlx::sqlite::SqliteRow;
use sqlx::{FromRow, Row};

use crate::database::{get_column_decode_error, Database, ID};

#[derive(Debug, Serialize, Deserialize)]
pub enum AccountClass {
    Bank,
    CreditCard,
    Shop,
}

#[derive(Debug)]
pub struct Account {
    pub id: ID,
    pub name: String,
    pub class: AccountClass,
    pub statement_import_config_id: ID,
}

impl FromRow<'_, SqliteRow> for Account {
    fn from_row(row: &SqliteRow) -> sqlx::Result<Self> {
        let id: ID = row.try_get("id")?;
        let name: String = row.try_get("name")?;
        let class_json_string = row.try_get("class")?;
        let class: AccountClass = match serde_json::from_str(class_json_string) {
            Ok(value) => value,
            Err(_) => {
                let details = format!(
                    "Could not deserialize value into AccountClass: {:?}",
                    class_json_string
                );
                let error = get_column_decode_error(String::from("class"), details);
                return Err(error);
            }
        };
        let statement_import_config_id: ID = row.try_get("statement_import_config_id")?;

        Ok(Account {
            id: id,
            name: name,
            class: class,
            statement_import_config_id: statement_import_config_id,
        })
    }
}

impl Account {
    pub async fn fetch_all(db: &Database) -> anyhow::Result<Vec<Account>> {
        let mut conn = db.acquire_db_conn().await?;
        let results = sqlx::query_as::<_, Account>(
            "SELECT id, name, class, statement_import_config_id FROM accounts",
        )
        .fetch_all(&mut *conn)
        .await?;

        Ok(results)
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
      "UPDATE accounts SET name = ?1, class = ?2, statement_import_config_id = ?3 WHERE id = ?4",
      self.name,
      class,
      self.statement_import_config_id,
      self.id
    )
        .execute(&mut *conn)
        .await?;

        Ok(())
    }
}
