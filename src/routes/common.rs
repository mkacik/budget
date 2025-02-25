use rocket::http::{ContentType, Status};
use rocket::request::Request;
use rocket::response::{self, Responder, Response};
use serde::Serialize;
use serde_json::{json, to_string};
use ts_rs::TS;

pub enum ApiResponse {
    Success,
    SuccessWithData { data: String },
    BadRequest { message: String },
    ServerError,
}

impl<'r> Responder<'r, 'static> for ApiResponse {
    fn respond_to(self, req: &'r Request<'_>) -> response::Result<'static> {
        match self {
            ApiResponse::Success => Response::build_from("{}".respond_to(req)?)
                .status(Status::Ok)
                .header(ContentType::JSON)
                .ok(),

            ApiResponse::SuccessWithData { data } => Response::build_from(data.respond_to(req)?)
                .status(Status::Ok)
                .header(ContentType::JSON)
                .ok(),

            ApiResponse::ServerError => {
                let error = error_from_str("Encountered server error while processing request.");

                Response::build_from(error.respond_to(req)?)
                    .status(Status::InternalServerError)
                    .header(ContentType::new("application", "problem+json"))
                    .ok()
            }

            ApiResponse::BadRequest { message } => {
                let error = error_from_str(&message);

                Response::build_from(error.respond_to(req)?)
                    .status(Status::BadRequest)
                    .header(ContentType::new("application", "problem+json"))
                    .ok()
            }
        }
    }
}

fn error_from_str(error_message: &str) -> String {
    let error = json!({
      "error": error_message,
    });

    error.to_string()
}

pub fn serialize_result<T: Serialize + TS>(result: anyhow::Result<T>) -> anyhow::Result<String> {
    let serializable = result?;
    let serialized = to_string(&serializable)?;

    Ok(serialized)
}
