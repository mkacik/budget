use chrono::naive::NaiveTime;
use chrono::offset::Utc;
use chrono::{DateTime, Datelike, Timelike};
use chrono_tz::America::Chicago;
use dateparser::parse_with;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Serialize, Deserialize, TS)]
pub enum TZ {
    Local,
    UTC,
}

/* Returns date in hardcoded "Local" timezone of [America/Chicago]. Takes all date formats
supported by `dateparser` crate (does not support dd/mm/yyyy format).*/
fn get_datetime(datetime: &str, tz: &TZ) -> anyhow::Result<DateTime<chrono_tz::Tz>> {
    let default_time = NaiveTime::from_hms_opt(12, 0, 0).unwrap();
    let maybe_datetime_utc = match tz {
        TZ::Local => parse_with(datetime, &Chicago, default_time),
        TZ::UTC => parse_with(datetime, &Utc, default_time),
    };
    let datetime_utc = match maybe_datetime_utc {
        Ok(datetime) => datetime,
        Err(e) => return Err(anyhow::anyhow!("{:?}", e)),
    };
    let datetime_local = datetime_utc.with_timezone(&Chicago);

    Ok(datetime_local)
}

pub fn to_local_date(datetime: &str, tz: &TZ) -> anyhow::Result<String> {
    let datetime_local = get_datetime(datetime, tz)?;

    Ok(format!(
        "{}-{:0>2}-{:0>2}",
        datetime_local.year(),
        datetime_local.month(),
        datetime_local.day()
    ))
}

pub fn to_local_time(datetime: &str, tz: &TZ) -> anyhow::Result<String> {
    let datetime_local = get_datetime(datetime, tz)?;

    Ok(format!(
        "{:0>2}:{:0>2}:{:0>2}",
        datetime_local.hour(),
        datetime_local.minute(),
        datetime_local.second()
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_to_local_date_for_chicago_as_local_time() {
        let cases = vec![
            (("2/4/2025", TZ::Local), "2025-02-04"),
            (("2/4/2025", TZ::UTC), "2025-02-04"),
            (("2025-02-04", TZ::Local), "2025-02-04"),
            (("2025-02-04", TZ::UTC), "2025-02-04"),
        ];

        for (input_params, expected_result) in cases.into_iter() {
            let (datetime, tz) = input_params;
            let result = to_local_date(datetime, &tz).unwrap();
            assert_eq!(result, expected_result);
        }
    }

    #[test]
    fn test_to_local_date_iso8601_zulu_always_parsed_as_utc() {
        let cases = vec![
            (("2025-02-04T01:00:00Z", TZ::Local), "2025-02-03"),
            (("2025-02-04T01:00:00Z", TZ::UTC), "2025-02-03"),
        ];

        for (input_params, expected_result) in cases.into_iter() {
            let (datetime, tz) = input_params;
            let result = to_local_date(datetime, &tz).unwrap();
            assert_eq!(result, expected_result);
        }
    }

    #[test]
    fn test_to_local_time_for_chicago_as_local_time() {
        let cases = vec![
            (("01:30:00", TZ::Local), "01:30:00"),
            (("01:30:00", TZ::UTC), "19:30:00"),
            (("10:00 pm", TZ::Local), "22:00:00"),
            (("10:00 pm", TZ::UTC), "16:00:00"),
        ];

        for (input_params, expected_result) in cases.into_iter() {
            let (datetime, tz) = input_params;
            let result = to_local_time(datetime, &tz).unwrap();
            assert_eq!(result, expected_result);
        }
    }

    #[test]
    fn fuck_dst_seriously() {
        let valid = vec!["19:30:00", "20:30:00"];
        let result = to_local_time("01:30:00", &TZ::UTC).unwrap();
        assert!(valid.contains(&result.as_str()));
    }

    #[test]
    fn test_to_local_time_iso8601_zulu_always_parsed_as_utc() {
        let local = to_local_time("2025-02-04T01:00:00Z", &TZ::Local).unwrap();
        let utc = to_local_time("2025-02-04T01:00:00Z", &TZ::UTC).unwrap();

        assert_eq!(local, "19:00:00");
        assert_eq!(utc, local);
    }
}
