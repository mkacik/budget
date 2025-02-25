use clap::{Parser, Subcommand};

use budget::account::{Account, AccountClass, AccountFields};
use budget::budget::{
    Budget, BudgetAmount, BudgetCategory, BudgetCategoryFields, BudgetItem, BudgetItemFields,
};
use budget::database::Database;
use budget::datetime::TZ;
use budget::record_mapping::{Amount, RecordMapping, Text, TransactionDate, TransactionTime};
use budget::statement_import_config::{StatementImportConfig, StatementImportConfigFields};

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
    add_statement_import_configs(&db).await?;
    add_accounts(&db).await?;
    add_budget(&db).await?;

    print_statement_import_configs(&db).await?;
    print_accounts(&db).await?;
    print_budget(&db).await?;

    Ok(())
}

async fn add_statement_import_configs(db: &Database) -> anyhow::Result<()> {
    StatementImportConfig::create(
        db,
        StatementImportConfigFields {
            name: String::from("bank"),
            record_mapping: get_bank_record_mapping(),
        },
    )
    .await?;

    StatementImportConfig::create(
        db,
        StatementImportConfigFields {
            name: String::from("shop"),
            record_mapping: get_shop_record_mapping(),
        },
    )
    .await?;

    Ok(())
}

fn get_bank_record_mapping() -> RecordMapping {
    RecordMapping {
        transaction_date: TransactionDate::FromColumn {
            col: 0,
            tz: TZ::Local,
        },
        transaction_time: TransactionTime::Empty,
        description: Text::FromColumn { col: 1 },
        amount: Amount::FromColumn { col: 2 },
    }
}

fn get_shop_record_mapping() -> RecordMapping {
    RecordMapping {
        transaction_date: TransactionDate::FromColumn {
            col: 2,
            tz: TZ::UTC,
        },
        transaction_time: TransactionTime::FromColumn {
            col: 2,
            tz: TZ::UTC,
        },
        description: Text::FromColumn { col: 23 },
        amount: Amount::FromColumn { col: 10 },
    }
}

async fn add_accounts(db: &Database) -> anyhow::Result<()> {
    let bank_account_id = Account::create(
        db,
        AccountFields {
            name: String::from("big bank"),
            class: AccountClass::Bank,
            statement_import_config_id: None,
        },
    )
    .await?;

    let mut bank_account = Account::fetch_by_id(&db, bank_account_id).await?;
    bank_account.fields.statement_import_config_id =
        Some(StatementImportConfig::fetch_by_id(&db, 1).await?.id);
    bank_account.update(db).await?;

    Account::create(
        db,
        AccountFields {
            name: String::from("some shop"),
            class: AccountClass::Shop,
            statement_import_config_id: Some(StatementImportConfig::fetch_by_id(&db, 2).await?.id),
        },
    )
    .await?;

    // Leave one account without statement_import_config
    Account::create(
        db,
        AccountFields {
            name: String::from("credit card"),
            class: AccountClass::CreditCard,
            statement_import_config_id: None,
        },
    )
    .await?;

    Ok(())
}

async fn print_statement_import_configs(db: &Database) -> anyhow::Result<()> {
    let configs = StatementImportConfig::fetch_all(&db).await?;
    println!("*** Statement Import Configs");
    for config in configs {
        println!("{:?}", config);
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
        },
    )
    .await?;

    let shopping_id = BudgetCategory::create(
        &db,
        BudgetCategoryFields {
            name: String::from("Shopping"),
        },
    )
    .await?;

    BudgetItem::create(
        &db,
        BudgetItemFields {
            category_id: car_id,
            name: String::from("Fuel"),
            amount: BudgetAmount::Weekly { amount: 50. },
        },
    )
    .await?;

    BudgetItem::create(
        &db,
        BudgetItemFields {
            category_id: car_id,
            name: String::from("Loan"),
            amount: BudgetAmount::Monthly { amount: 300. },
        },
    )
    .await?;

    BudgetItem::create(
        &db,
        BudgetItemFields {
            category_id: car_id,
            name: String::from("Insurance"),
            amount: BudgetAmount::Yearly { amount: 1000. },
        },
    )
    .await?;

    BudgetItem::create(
        &db,
        BudgetItemFields {
            category_id: car_id,
            name: String::from("Downpayment"),
            amount: BudgetAmount::EveryXYears {
                x: 5,
                amount: 5000.,
            },
        },
    )
    .await?;

    BudgetItem::create(
        &db,
        BudgetItemFields {
            category_id: shopping_id,
            name: String::from("Groceries"),
            amount: BudgetAmount::Weekly { amount: 100. },
        },
    )
    .await?;

    BudgetItem::create(
        &db,
        BudgetItemFields {
            category_id: shopping_id,
            name: String::from("Clothing"),
            amount: BudgetAmount::Monthly { amount: 200. },
        },
    )
    .await?;

    Ok(())
}

async fn print_budget(db: &Database) -> anyhow::Result<()> {
    let categories = BudgetCategory::fetch_all(&db).await?;
    let items = BudgetItem::fetch_all(&db).await?;

    let budget = Budget {
        categories: categories,
        items: items,
    };

    println!("{:?}", budget);

    Ok(())
}
