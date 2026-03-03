/* This scaffold is supposed to be used for migrations that cannot be done with raw sql. In such
cases I expect following flow:
 commit 1: prepares the database with new optional field
 commit 2: adds content to run() function <- this will be commit to check out to run migration
 commit 3: move everything to use new field, clean up data and remove contents of run() */
use anyhow;

pub async fn run() -> anyhow::Result<()> {
    println!("No migration pending at this commit");

    Ok(())
}
