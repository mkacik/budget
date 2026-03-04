use rocket::http::{ContentType, Status};
use rocket::request::Request;
use rocket::response::{self, Responder, Response};
use serde::Serialize;
use serde_json::{json, to_string};
use ts_rs::TS;

// private to prevent explicit creation of ApiResponse. This allows to mute server errors
// later on to not expose internal details to the users.
enum ApiResponseKind {
    Success,
    Data { data: String },
    BadRequest { message: String },
    ServerError { message: String },
}

pub struct ApiResponse {
    kind: ApiResponseKind,
}

impl ApiResponse {
    pub fn ok() -> ApiResponse {
        ApiResponse {
            kind: ApiResponseKind::Success,
        }
    }

    pub fn data<T: Serialize + TS>(object: T) -> ApiResponse {
        let serialized = match to_string(&object) {
            Ok(value) => value,
            Err(error) => return ApiResponse::error(anyhow::anyhow!(error)),
        };

        ApiResponse {
            kind: ApiResponseKind::Data { data: serialized },
        }
    }

    pub fn error(error: anyhow::Error) -> ApiResponse {
        ApiResponse {
            kind: ApiResponseKind::ServerError {
                message: error.to_string(),
            },
        }
    }

    pub fn bad(message: &str) -> ApiResponse {
        ApiResponse {
            kind: ApiResponseKind::BadRequest {
                message: message.to_string(),
            },
        }
    }
}

impl<'r> Responder<'r, 'static> for ApiResponse {
    fn respond_to(self, req: &'r Request<'_>) -> response::Result<'static> {
        match self.kind {
            ApiResponseKind::Success => Response::build_from("{}".respond_to(req)?)
                .status(Status::Ok)
                .header(ContentType::JSON)
                .ok(),

            ApiResponseKind::Data { data } => Response::build_from(data.respond_to(req)?)
                .status(Status::Ok)
                .header(ContentType::JSON)
                .ok(),

            ApiResponseKind::ServerError { message } => {
                let error = wrap_error(&message);

                Response::build_from(error.respond_to(req)?)
                    .status(Status::InternalServerError)
                    .header(ContentType::new("application", "problem+json"))
                    .ok()
            }

            ApiResponseKind::BadRequest { message } => {
                let error = wrap_error(&message);

                Response::build_from(error.respond_to(req)?)
                    .status(Status::BadRequest)
                    .header(ContentType::new("application", "problem+json"))
                    .ok()
            }
        }
    }
}

fn wrap_error(error_message: &str) -> String {
    let error = json!({
      "error": error_message,
    });

    error.to_string()
}
