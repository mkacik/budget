use rocket::http::Status;
use rocket::request::{FromRequest, Outcome, Request};
use rocket::State;
use serde::Serialize;
use ts_rs::TS;

use crate::credentials::Credentials;
use crate::database::Database;

// returned by /me and /login, don't just add shit here without thinking about those
#[derive(Serialize, TS, Debug)]
#[ts(export_to = "User.ts")]
pub struct User {
    pub username: String,
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for &'r User {
    type Error = std::convert::Infallible;

    async fn from_request(request: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        let user = request
            .local_cache_async(async {
                let username = match request.cookies().get_private("user") {
                    Some(cookie) => String::from(cookie.value()),
                    None => return Err(()),
                };

                let db = match request.guard::<&State<Database>>().await {
                    Outcome::Success(value) => value,
                    _ => return Err(()),
                };

                match Credentials::fetch_by_username(db, &username).await {
                    Ok(Some(_)) => Ok(User { username: username }),
                    _ => Err(()),
                }
            })
            .await;

        match user {
            Ok(value) => Outcome::Success(value),
            _ => Outcome::Forward(Status::Unauthorized),
        }
    }
}
