use ts_rs::TS;

use budget::budget::Budget;

fn main() {
    // exports type with all dependencies, see https://docs.rs/ts-rs/latest/src/ts_rs/lib.rs.html
    Budget::export_all().expect("");
}
