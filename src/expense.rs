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
    pub category_id: ID,
}

pub struct LatestExpenses {
    pub date: String,
    pub transactions: Vec<Expense>,
}

impl Expense {
    pub async fn fetch_latest_expenses(
        db: &Database,
        account_id: ID,
    ) -> anyhow::Result<Option<LatestExpenses>> {
        let mut conn = db.acquire_db_conn().await?;

        let result = sqlx::query_scalar!(
            "SELECT transaction_date FROM expenses WHERE account_id = ?1
            ORDER BY transaction_date DESC LIMIT 1",
            account_id,
        )
        .fetch_optional(&mut *conn)
        .await?;

        let date: String = match result {
            Some(value) => value,
            None => return Ok(None),
        };

        let transactions = sqlx::query_as::<_, Expense>(
            "SELECT * FROM expenses WHERE account_id = ?1 AND transaction_date = ?2",
        )
        .bind(account_id)
        .bind(&date)
        .fetch_all(&mut *conn)
        .await?;

        let latest_transactions = LatestExpenses {
            date: date,
            transactions: transactions,
        };

        Ok(Some(latest_transactions))
    }

    pub async fn save(&mut self, db: &Database) -> anyhow::Result<()> {
        match self.id {
            None => self.insert(db).await,
            _ => Err(anyhow::anyhow!(
                "Only newly added expenses can be saved through this path"
            )),
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

    pub async fn set_category(&mut self, db: &Database, category_id: ID) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;

        self.assert_id_set()?;
        sqlx::query!(
            "UPDATE expenses SET category_id = ?1 WHERE id = ?2",
            category_id,
            self.id
        )
        .execute(&mut *conn)
        .await?;
        self.category_id = category_id;

        Ok(())
    }

    fn assert_id_set(&self) -> anyhow::Result<()> {
        match self.id {
            Some(_) => Ok(()),
            None => Err(anyhow::anyhow!(
                "Attempting to mutate object not yet saved to DB!"
            )),
        }
    }
}
