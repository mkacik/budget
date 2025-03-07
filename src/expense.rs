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
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use ts_rs::TS;

use crate::database::{Database, ID};

#[derive(Debug, FromRow, Serialize, TS, PartialEq)]
#[ts(export_to = "Expense.ts")]
pub struct ExpenseFields {
    pub account_id: ID,
    pub transaction_date: String,
    pub transaction_time: Option<String>,
    pub description: String,
    pub amount: f64,
    #[ts(skip)]
    pub raw_csv: Option<String>,
}

#[derive(Debug, FromRow, Deserialize, Serialize, TS)]
#[ts(export_to = "Expense.ts")]
pub struct ExpenseCategory {
    pub budget_item_id: Option<ID>,
}

#[derive(Debug, FromRow, Serialize, TS)]
#[ts(export_to = "Expense.ts")]
pub struct Expense {
    pub id: ID,
    #[serde(flatten)]
    #[sqlx(flatten)]
    #[ts(flatten)]
    pub fields: ExpenseFields,
    #[serde(flatten)]
    #[sqlx(flatten)]
    #[ts(flatten)]
    pub category: ExpenseCategory,
}

#[derive(Debug, Serialize, TS)]
#[ts(export_to = "Expense.ts")]
pub struct Expenses {
    pub expenses: Vec<Expense>,
}

pub struct LatestExpenses {
    pub date: String,
    pub transactions: Vec<Expense>,
}

impl Expense {
    pub async fn create(db: &Database, fields: ExpenseFields) -> anyhow::Result<ID> {
        let mut conn = db.acquire_db_conn().await?;

        let id: ID = sqlx::query_scalar!(
            "INSERT INTO expenses (
              account_id,
              transaction_date,
              transaction_time,
              description,
              amount,
              raw_csv
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6) RETURNING id",
            fields.account_id,
            fields.transaction_date,
            fields.transaction_time,
            fields.description,
            fields.amount,
            fields.raw_csv,
        )
        .fetch_one(&mut *conn)
        .await?
        .try_into()
        .unwrap();

        Ok(id)
    }

    pub async fn fetch_by_id(db: &Database, id: ID) -> anyhow::Result<Expense> {
        let mut conn = db.acquire_db_conn().await?;
        let result = sqlx::query_as::<_, Expense>("SELECT * FROM expenses WHERE id = ?1")
            .bind(id)
            .fetch_one(&mut *conn)
            .await?;

        Ok(result)
    }

    pub async fn fetch_by_account_id(db: &Database, account_id: ID) -> anyhow::Result<Expenses> {
        let mut conn = db.acquire_db_conn().await?;
        let results = sqlx::query_as::<_, Expense>(
            "SELECT * FROM expenses WHERE account_id = ?1
            ORDER BY transaction_date DESC, transaction_time DESC",
        )
        .bind(account_id)
        .fetch_all(&mut *conn)
        .await?;

        Ok(Expenses { expenses: results })
    }

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

    pub async fn set_budget_item(
        &mut self,
        db: &Database,
        budget_item_id: Option<ID>,
    ) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;

        sqlx::query!(
            "UPDATE expenses SET budget_item_id = ?1 WHERE id = ?2",
            budget_item_id,
            self.id
        )
        .execute(&mut *conn)
        .await?;

        self.category.budget_item_id = budget_item_id;

        Ok(())
    }

    pub async fn any_has_budget_item_id(db: &Database, budget_item_id: ID) -> anyhow::Result<bool> {
        let mut conn = db.acquire_db_conn().await?;
        let result = sqlx::query_scalar!(
            "SELECT 1 FROM expenses WHERE budget_item_id = ?1 LIMIT 1",
            budget_item_id,
        )
        .fetch_optional(&mut *conn)
        .await?;

        match result {
            Some(_) => Ok(true),
            None => Ok(false),
        }
    }
}
