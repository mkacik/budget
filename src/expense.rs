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

#[derive(Debug)]
pub struct Expense {
    pub transaction_date: String,
    pub transaction_time: Option<String>,
    pub description: String,
    pub amount: f64,
    pub details: Option<String>,
}
