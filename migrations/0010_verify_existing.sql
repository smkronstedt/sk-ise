-- People who already had accounts stay confirmed. New signups after this stay unverified until they click the link.
update "user"
set "emailVerified" = true
where "emailVerified" = false
  and "createdAt" < timestamptz '2026-11-10 18:00:00+00';
