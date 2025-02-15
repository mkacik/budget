use sqlx::pool::PoolConnection;
use sqlx::sqlite::SqlitePool;
use sqlx::Sqlite;
use std::env;

const DATABASE_URL_ENV_VAR: &str = "DATABASE_URL";

// All primary keys will be this type
pub type ID = Option<i32>;

pub async fn get_db_pool() -> SqlitePool {
    let database_url = env::var(DATABASE_URL_ENV_VAR).unwrap();
    match SqlitePool::connect(&database_url).await {
        Ok(pool) => pool,
        Err(_) => panic!("Could not create db connection pool, aborting!"),
    }
}

pub fn get_column_decode_error(column: String, details: String) -> sqlx::Error {
    let source: Box<dyn std::error::Error + 'static + Send + Sync> = details.into();
    let error = sqlx::Error::ColumnDecode {
        index: column,
        source: source,
    };

    error
}

pub type DatabaseConnection = PoolConnection<Sqlite>;

pub struct Database {
    pool: SqlitePool,
}

impl Database {
    pub async fn init() -> Database {
        Database {
            pool: get_db_pool().await,
        }
    }

    pub async fn acquire_db_conn(&self) -> Result<DatabaseConnection, anyhow::Error> {
        let conn = self.pool.acquire().await?;

        Ok(conn)
    }
}
