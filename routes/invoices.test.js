process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testInvoice;

beforeEach(async () => {
    const result = await db.query(
        `INSERT INTO invoices (comp_code, amt, paid, paid_date)
        VALUES ('apple', 100, false, null)
        RETURNING  id, comp_code, amt, paid, add_date, paid_date`
    );
    testInvoice = result.rows[0];
});
  
afterEach(async () => {
    await db.query(`DELETE FROM invoices`);
});
  
afterAll(async () => {
    await db.end();
});