use rocket::fairing::{Fairing, Info, Kind};
use rocket::http::uri::Origin;
use rocket::request::Outcome;
use rocket::{Data, Request, Response, State};

use crate::routes::guards::User;

pub enum RouteMatcher {
    Exact(&'static str),
    Prefix(&'static str),
}

impl RouteMatcher {
    fn matches(&self, path: &str) -> bool {
        match self {
            RouteMatcher::Exact(value) => &path == value,
            RouteMatcher::Prefix(value) => path.starts_with(value),
        }
    }
}

pub struct GateKeeper {
    pub allow_logged_out_access: Vec<RouteMatcher>,
}

impl GateKeeper {
    fn is_path_whitelisted(&self, path: &str) -> bool {
        for whitelisted_path in &self.allow_logged_out_access {
            if whitelisted_path.matches(path) {
                return true;
            }
        }

        false
    }
}
// allow root, static and login routes without any checks or logging

// then, require user, if not found, redirect to 404
// if reguest is post request, log to db, and store ID in request-local state

// before returning response, if request had ID, log request status to db

#[rocket::async_trait]
impl Fairing for GateKeeper {
    fn info(&self) -> Info {
        Info {
            name: "Authorize and log writes",
            kind: Kind::Request,
        }
    }

    async fn on_request(&self, request: &mut Request<'_>, _: &mut Data<'_>) {
        // 1. Allow whitelisted routes to be routed to without additional checks or logging
        let path = request.uri().path().as_str();
        if self.is_path_whitelisted(path) {
            return;
        }

        // 2. Everything else should have user cookie set. If it doesn't reroute to 404
        let _user = match request.guard::<&User>().await {
            Outcome::Success(value) => value,
            _ => {
                request.set_uri(Origin::parse("/404").unwrap());
                return;
            }
        };

        // 3. For all write (delete/post/put) requests, create db entry in action log, and
        // attach id to request, so status can be logged to db in `on_response`.

        // TODO: implement write logging
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_route_matcher() {
        let route_a = RouteMatcher::Exact("/foo/bar");
        let route_b = RouteMatcher::Prefix("/foo");

        assert!(route_a.matches("/foo/bar"));
        assert!(!route_a.matches("/foo"));

        assert!(route_b.matches("/foo/bar"));
        assert!(route_b.matches("/foo"));
    }
}
