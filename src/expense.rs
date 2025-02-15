/*
Expense table schema
- date and, if provided, time
- description
- amount
- details (vendor address, item description, etc., all the garbage)
- optional payment method/account, for x-account moves, like paying off CC from bank account

Additionally, the table where Amazon purchases are logged should have following:
- vendor order/transaction id (used for grouping)
*/
use crate::database::{Database, ID};

#[derive(Debug, sqlx::FromRow)]
pub struct Expense {
    pub id: ID,
    pub account_id: ID,
    pub transaction_date: String,
    pub transaction_time: Option<String>,
    pub description: String,
    pub amount: f64,
    pub details: Option<String>,
}

impl Expense {
    pub async fn save(&mut self, db: &Database) -> anyhow::Result<()> {
        match self.id {
            None => self.insert(db).await,
            _ => self.update(db).await,
        }
    }

    async fn insert(&mut self, db: &Database) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;

        let result = sqlx::query_scalar!(
            "INSERT INTO expenses (
        account_id,
        transaction_date,
        transaction_time,
        description,
        amount,
        details
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6) RETURNING id",
            self.account_id,
            self.transaction_date,
            self.transaction_time,
            self.description,
            self.amount,
            self.details
        )
        .fetch_one(&mut *conn)
        .await?;

        let id: i32 = result.try_into().unwrap();
        self.id = Some(id);

        Ok(())
    }

    async fn update(&self, db: &Database) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;

        sqlx::query!(
            "UPDATE expenses SET
        account_id = ?2,
        transaction_date = ?3,
        transaction_time = ?4,
        description = ?5,
        amount = ?6,
        details = ?7
      WHERE id = ?1",
            self.id,
            self.account_id,
            self.transaction_date,
            self.transaction_time,
            self.description,
            self.amount,
            self.details
        )
        .execute(&mut *conn)
        .await?;

        Ok(())
    }
}
