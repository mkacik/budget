use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use ts_rs::TS;

use crate::database::{Database, ID};

// helper PRIVATE type to not have to fuck with changing all places that use f64.
type DollarAmount = f64;
type CentAmount = i32;

#[derive(Debug, Deserialize, Serialize, TS)]
#[serde(tag = "variant", content = "amount")]
#[ts(export_to = "Budget.ts", tag = "variant", content = "amount")]
pub enum BudgetAllowance {
    Weekly(CentAmount),
    Monthly(CentAmount),
    Yearly(CentAmount),
}

// TODO: deleteme
fn to_cents(amount: DollarAmount) -> CentAmount {
    let cents = (amount * 100.).round();

    cents as CentAmount
}

// TODO: deleteme
impl BudgetAllowance {
    pub fn from_budget_amount(budget_amount: &BudgetAmount) -> BudgetAllowance {
        match budget_amount {
            BudgetAmount::Weekly { amount } => BudgetAllowance::Weekly(to_cents(*amount)),
            BudgetAmount::Monthly { amount } => BudgetAllowance::Monthly(to_cents(*amount)),
            BudgetAmount::Yearly { amount } => BudgetAllowance::Yearly(to_cents(*amount)),
            BudgetAmount::EveryXYears { x, amount } => {
                BudgetAllowance::Yearly(to_cents(amount / f64::from(*x)))
            }
        }
    }
}

#[derive(Debug, FromRow, Deserialize, Serialize, TS)]
#[ts(export_to = "Budget.ts")]
pub struct BudgetItemFields {
    pub category_id: ID,
    pub fund_id: Option<ID>,
    pub name: String,
    pub amount: Option<BudgetAmount>,
    pub budget_only: bool,
    pub allowance: Option<BudgetAllowance>,
}

#[derive(Debug, FromRow, Deserialize, Serialize, TS)]
#[ts(export_to = "Budget.ts")]
pub struct BudgetItem {
    pub id: ID,
    pub ignored: bool,        // computed, inherited from Category
    pub display_name: String, // computed, {category_name} :: {name}

    #[serde(flatten)]
    #[sqlx(flatten)]
    #[ts(flatten)]
    pub fields: BudgetItemFields,
}

#[derive(Debug, FromRow, Deserialize, Serialize, TS)]
#[ts(export_to = "Budget.ts")]
pub struct BudgetItemWithSpend {
    pub year: i32, // computed, inherited from Category
    pub spend: DollarAmount,

    #[serde(flatten)]
    #[sqlx(flatten)]
    #[ts(flatten)]
    pub item: BudgetItem,
}

#[derive(Debug, Deserialize, Serialize, TS)]
#[ts(export_to = "Budget.ts")]
pub enum BudgetAmount {
    Weekly { amount: DollarAmount },
    Monthly { amount: DollarAmount },
    Yearly { amount: DollarAmount },
    EveryXYears { x: i32, amount: DollarAmount },
}

impl BudgetItem {
    pub async fn create(db: &Database, mut fields: BudgetItemFields) -> anyhow::Result<ID> {
        let mut conn = db.acquire_db_conn().await?;

        if fields.allowance.is_none() {
            if let Some(amount) = &fields.amount {
                fields.allowance = Some(BudgetAllowance::from_budget_amount(amount));
            }
        }

        let id: ID = sqlx::query_scalar!(
            "INSERT INTO budget_items (
              category_id,
              fund_id,
              name,
              amount,
              allowance,
              budget_only
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6) RETURNING id",
            fields.category_id,
            fields.fund_id,
            fields.name,
            fields.amount,
            fields.allowance,
            fields.budget_only,
        )
        .fetch_one(&mut *conn)
        .await?
        .try_into()
        .unwrap();

        Ok(id)
    }

    pub async fn update(db: &Database, id: ID, fields: BudgetItemFields) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;

        sqlx::query!(
            "UPDATE budget_items SET
                category_id = ?1,
                fund_id = ?2,
                name = ?3,
                amount = ?4,
                allowance = ?5,
                budget_only = ?6
            WHERE id = ?7",
            fields.category_id,
            fields.fund_id,
            fields.name,
            fields.amount,
            fields.allowance,
            fields.budget_only,
            id,
        )
        .execute(&mut *conn)
        .await?;

        Ok(())
    }

    pub async fn delete(db: &Database, id: ID) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;
        sqlx::query!("DELETE FROM budget_items WHERE id = ?1", id,)
            .execute(&mut *conn)
            .await?;

        Ok(())
    }

    pub async fn fetch_by_id(db: &Database, id: ID) -> anyhow::Result<BudgetItem> {
        let mut conn = db.acquire_db_conn().await?;
        let result =
            sqlx::query_as::<_, BudgetItem>("SELECT * FROM view_budget_items WHERE id = ?1")
                .bind(id)
                .fetch_one(&mut *conn)
                .await?;

        Ok(result)
    }

    pub async fn fetch_by_year(db: &Database, year: i32) -> anyhow::Result<Vec<BudgetItem>> {
        let mut conn = db.acquire_db_conn().await?;
        let results = sqlx::query_as::<_, BudgetItem>(
            "SELECT * FROM view_budget_items
            WHERE year = ?1
            ORDER BY category_id, name",
        )
        .bind(year)
        .fetch_all(&mut *conn)
        .await?;

        Ok(results)
    }

    pub async fn fetch_all_fund_items(db: &Database) -> anyhow::Result<Vec<BudgetItemWithSpend>> {
        let mut conn = db.acquire_db_conn().await?;
        let result = sqlx::query_as::<_, BudgetItemWithSpend>(
            "SELECT
              items.*,
              SUM(expenses.amount) AS spend
            FROM view_budget_items items
            LEFT JOIN expenses
              ON (items.id = expenses.budget_item_id)
            WHERE fund_id IS NOT NULL
            GROUP BY items.id",
        )
        .fetch_all(&mut *conn)
        .await?;

        Ok(result)
    }

    pub async fn has_expenses(db: &Database, budget_item_id: ID) -> anyhow::Result<bool> {
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_to_cents() {
        assert_eq!(to_cents(23.4567), 2346);
        assert_eq!(to_cents(-23.4567), -2346);
    }
}
