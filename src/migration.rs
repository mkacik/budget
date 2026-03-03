/* This scaffold is supposed to be used for migrations that cannot be done with raw sql. In such
cases I expect following flow:
 commit 1: prepares the database with new optional field
 commit 2: adds content to run() function <- this will be commit to check out to run migration
 commit 3: move everything to use new field, clean up data and remove contents of run() */
use anyhow;

use crate::database::Database;
use crate::schema::budget_item::{BudgetAllowance, BudgetItem};

pub async fn run() -> anyhow::Result<()> {
    let db = Database::init().await;
    let mut conn = db.acquire_db_conn().await?;

    let items: Vec<BudgetItem> = sqlx::query_as::<_, BudgetItem>("SELECT * FROM view_budget_items")
        .fetch_all(&mut *conn)
        .await?;

    // the following does not need to be done as part of transaction, setting allowance from amount
    // is indempotent

    for item in items.into_iter() {
        let id = item.id;
        let mut fields = item.fields;
        fields.allowance = match &fields.amount {
            Some(amount) => Some(BudgetAllowance::from_budget_amount(amount)),
            None => {
                println!("Skipping {}: {}", id, fields.name);
                continue;
            }
        };

        println!("Updating {}: {}", id, &fields.name);
        BudgetItem::update(&db, id, fields).await?;
    }

    Ok(())
}
