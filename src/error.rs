use std::fmt;

#[derive(Debug)]
pub struct ImportError {
    pub message: String,
}

impl fmt::Display for ImportError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl ImportError {
    pub fn new(msg: String) -> ImportError {
        ImportError { message: msg }
    }
}
