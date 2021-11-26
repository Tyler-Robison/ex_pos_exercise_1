-- psql < test.sql

DROP DATABASE IF EXISTS biztime_test;

CREATE DATABASE biztime_test;

\c biztime_test

DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS industries CASCADE;
DROP TABLE IF EXISTS industries_companies CASCADE;

CREATE TABLE companies (
    code text PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text
);

CREATE TABLE invoices (
    id serial PRIMARY KEY,
    comp_code text NOT NULL REFERENCES companies ON DELETE CASCADE,
    amt float NOT NULL,
    paid boolean DEFAULT false NOT NULL,
    add_date date DEFAULT CURRENT_DATE NOT NULL,
    paid_date date,
    CONSTRAINT invoices_amt_check CHECK ((amt > (0)::double precision))
);

CREATE TABLE industries (
  code text PRIMARY KEY,
  industry text NOT NULL
);

CREATE TABLE industries_companies (
  company_code text NOT NULL REFERENCES companies ON DELETE CASCADE,
  industry_code text NOT NULL REFERENCES industries ON DELETE CASCADE,
  PRIMARY KEY(company_code, industry_code)
);








-- INSERT INTO companies (code, name, description)
-- VALUES ('ibm', 'ibm', 'Big Blue');


-- INSERT INTO invoices (comp_code, amt, paid, paid_date)
-- VALUES ('ibm', 100, false, null);


    