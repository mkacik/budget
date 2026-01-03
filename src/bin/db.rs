use clap::{Parser, Subcommand};

use budget::account::{Account, AccountFields, AccountType};
use budget::budget::{
    Budget, BudgetAmount, BudgetCategory, BudgetCategoryFields, BudgetItem, BudgetItemFields,
};
use budget::database::Database;
use budget::datetime::TZ;
use budget::record_mapping::RecordMapping;
use budget::record_mapping::{AmountField, DateField, TextField, TimeField};
use budget::statement_schema::{StatementSchema, StatementSchemaFields};

#[derive(Parser, Debug)]
struct Args {
    #[clap(subcommand)]
    command: Command,
}

#[derive(Debug, Subcommand)]
enum Command {
    Seed,
}

#[tokio::main]
async fn main() {
    let db = Database::init().await;

    let args = Args::parse();
    let _ = match args.command {
        Command::Seed => match seed_db_for_testing(db).await {
            Ok(_) => {}
            Err(e) => {
                println!("{:?}", e);
            }
        },
    };
}

async fn seed_db_for_testing(db: Database) -> anyhow::Result<()> {
    add_statement_schemas(&db).await?;
    add_accounts(&db).await?;
    add_budget(&db).await?;

    print_statement_schemas(&db).await?;
    print_accounts(&db).await?;
    print_budget(&db).await?;

    Ok(())
}

async fn add_statement_schemas(db: &Database) -> anyhow::Result<()> {
    StatementSchema::create(
        db,
        StatementSchemaFields {
            name: String::from("bank"),
            notes: String::from(""),
            record_mapping: get_bank_record_mapping(),
        },
    )
    .await?;

    StatementSchema::create(
        db,
        StatementSchemaFields {
            name: String::from("shop"),
            notes: String::from("Note about how to export data"),
            record_mapping: get_shop_record_mapping(),
        },
    )
    .await?;

    Ok(())
}

fn get_bank_record_mapping() -> RecordMapping {
    RecordMapping {
        transaction_date: DateField::FromColumn {
            col: 0,
            tz: TZ::Local,
        },
        transaction_time: TimeField::Empty,
        description: TextField::FromColumn { col: 1 },
        amount: AmountField::FromColumn {
            col: 2,
            invert: false,
            skip_pattern: None,
        },
    }
}

fn get_shop_record_mapping() -> RecordMapping {
    RecordMapping {
        transaction_date: DateField::FromColumn {
            col: 2,
            tz: TZ::UTC,
        },
        transaction_time: TimeField::FromColumn {
            col: 2,
            tz: TZ::UTC,
        },
        description: TextField::FromColumn { col: 23 },
        amount: AmountField::FromColumn {
            col: 10,
            invert: false,
            skip_pattern: Some(String::from("Not Available")),
        },
    }
}

async fn add_accounts(db: &Database) -> anyhow::Result<()> {
    let bank_account_id = Account::create(
        db,
        AccountFields {
            name: String::from("big bank"),
            account_type: AccountType::Bank,
            statement_schema_id: None,
        },
    )
    .await?;

    let mut bank_account = Account::fetch_by_id(&db, bank_account_id).await?;
    bank_account.fields.statement_schema_id = Some(StatementSchema::fetch_by_id(&db, 1).await?.id);
    bank_account.update(db).await?;

    Account::create(
        db,
        AccountFields {
            name: String::from("some shop"),
            account_type: AccountType::Shop,
            statement_schema_id: Some(StatementSchema::fetch_by_id(&db, 2).await?.id),
        },
    )
    .await?;

    // Leave one account without statement_schema
    Account::create(
        db,
        AccountFields {
            name: String::from("credit card"),
            account_type: AccountType::CreditCard,
            statement_schema_id: None,
        },
    )
    .await?;

    Ok(())
}

async fn print_statement_schemas(db: &Database) -> anyhow::Result<()> {
    let schemas = StatementSchema::fetch_all(&db).await?;
    println!("*** Statement Schemas");
    for schema in schemas.schemas {
        println!("{:?}", schema);
    }

    Ok(())
}

async fn print_accounts(db: &Database) -> anyhow::Result<()> {
    let accounts = match Account::fetch_all(&db).await {
        Ok(result) => result.accounts,
        Err(e) => panic!("{}", e),
    };

    println!("*** Accounts");
    for account in accounts {
        println!("{:?}", account);
    }

    Ok(())
}

async fn add_budget(db: &Database) -> anyhow::Result<()> {
    let car_id = BudgetCategory::create(
        &db,
        BudgetCategoryFields {
            name: String::from("Car"),
            ignored: false,
            year: 2025,
        },
    )
    .await?;

    let shopping_id = BudgetCategory::create(
        &db,
        BudgetCategoryFields {
            name: String::from("Shopping"),
            ignored: false,
            year: 2025,
        },
    )
    .await?;

    let ignored_id = BudgetCategory::create(
        &db,
        BudgetCategoryFields {
            name: String::from("Ignored"),
            ignored: true,
            year: 2025,
        },
    )
    .await?;

    BudgetItem::create(
        &db,
        BudgetItemFields {
            category_id: car_id,
            name: String::from("Fuel"),
            amount: Some(BudgetAmount::Weekly { amount: 50. }),
            budget_only: false,
        },
    )
    .await?;

    BudgetItem::create(
        &db,
        BudgetItemFields {
            category_id: car_id,
            name: String::from("Loan"),
            amount: Some(BudgetAmount::Monthly { amount: 300. }),
            budget_only: false,
        },
    )
    .await?;

    BudgetItem::create(
        &db,
        BudgetItemFields {
            category_id: car_id,
            name: String::from("Insurance"),
            amount: Some(BudgetAmount::Yearly { amount: 1000. }),
            budget_only: false,
        },
    )
    .await?;

    BudgetItem::create(
        &db,
        BudgetItemFields {
            category_id: car_id,
            name: String::from("Downpayment"),
            amount: Some(BudgetAmount::EveryXYears {
                x: 5,
                amount: 5000.,
            }),
            budget_only: false,
        },
    )
    .await?;

    BudgetItem::create(
        &db,
        BudgetItemFields {
            category_id: shopping_id,
            name: String::from("Groceries"),
            amount: Some(BudgetAmount::Weekly { amount: 100. }),
            budget_only: false,
        },
    )
    .await?;

    BudgetItem::create(
        &db,
        BudgetItemFields {
            category_id: shopping_id,
            name: String::from("Clothing"),
            amount: Some(BudgetAmount::Monthly { amount: 200. }),
            budget_only: false,
        },
    )
    .await?;

    BudgetItem::create(
        &db,
        BudgetItemFields {
            category_id: ignored_id,
            name: String::from("X-Account Transfers"),
            amount: None,
            budget_only: false,
        },
    )
    .await?;

    BudgetItem::create(
        &db,
        BudgetItemFields {
            category_id: ignored_id,
            name: String::from("Amazon"),
            amount: None,
            budget_only: false,
        },
    )
    .await?;

    Ok(())
}

async fn print_budget(db: &Database) -> anyhow::Result<()> {
    let budget = Budget::fetch(&db, 2025).await?;

    println!("{:?}", budget);

    Ok(())
}
