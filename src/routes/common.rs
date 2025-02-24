use rocket::http::{ContentType, Status};
use serde::Serialize;
use serde_json::to_string;
use ts_rs::TS;

pub type ApiResponse = (Status, (ContentType, String));

#[derive(Serialize)]
struct ErrorMessage {
    error: String,
}

impl ErrorMessage {
    fn to_json_string(&self) -> String {
        to_string(self).expect("Serializing ErrorMessage should never fail.")
    }
}

fn to_json_string<T: Serialize + TS>(serializable: &T) -> Option<(ContentType, String)> {
    match to_string(&serializable) {
        Ok(json) => Some((ContentType::JSON, json)),
        Err(_) => None,
    }
}

pub fn result_to_json_string<T: Serialize + TS>(
    result: Result<T, anyhow::Error>,
) -> Option<(ContentType, String)> {
    match result {
        Ok(value) => to_json_string(&value),
        Err(_) => None,
    }
}

pub fn ok_empty() -> Option<(ContentType, String)> {
    Some((ContentType::JSON, String::from("{}")))
}

pub fn failure(status: Status, message: &str) -> ApiResponse {
    let error = ErrorMessage {
        error: String::from(message),
    };

    (
        status,
        (
            ContentType::new("application", "problem+json"),
            error.to_json_string(),
        ),
    )
}

pub fn failure_server_error() -> ApiResponse {
    failure(
        Status::InternalServerError,
        "Encountered server error while processing request.",
    )
}

pub fn success_with_data(content: String) -> ApiResponse {
    (Status::Ok, (ContentType::JSON, content))
}

pub fn success_empty() -> ApiResponse {
    (Status::Ok, (ContentType::JSON, String::from("{}")))
}

pub fn query_result_to_api_response<T: Serialize + TS>(
    query_result: Result<T, anyhow::Error>,
) -> ApiResponse {
    let serializable = match query_result {
        Ok(value) => value,
        Err(_) => {
            return failure(
                Status::BadRequest,
                "Encoutered error while processing data, check your request.",
            )
        }
    };

    let json_string = match to_string(&serializable) {
        Ok(value) => value,
        Err(_) => {
            return failure(
                Status::InternalServerError,
                "Error while serializing query result.",
            )
        }
    };

    success_with_data(json_string)
}
