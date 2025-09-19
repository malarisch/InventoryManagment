-- https://gist.github.com/GitTom/27863f4b8811406d08fc76b3b1537848
begin;
CREATE SCHEMA IF NOT EXISTS import;
CREATE TABLE import.users (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID UNIQUE,
  username TEXT NOT NULL UNIQUE,
    CHECK (char_length(username) >= 3),
  cc CHAR(2) NOT NULL,
  email TEXT UNIQUE,
  password TEXT
);
commit;