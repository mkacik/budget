use clap::Parser;

mod datetime;
mod expense;
mod import;

use crate::import::{default_mapping_for_testing, parse_statement, shop_mapping_for_testing};

#[derive(Parser, Debug)]
struct Args {
    file: String,

    #[arg(short)]
    shop: bool,
}

fn main() {
    let args = Args::parse();

    let mapping = match args.shop {
        false => default_mapping_for_testing(),
        true => shop_mapping_for_testing(),
    };
    let _ = parse_statement(&mapping, args.file);
}
