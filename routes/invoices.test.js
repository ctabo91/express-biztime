process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testInvoice;
let testCompany;

beforeEach(async () => {
    const compResult = await db.query(
        `INSERT INTO companies (code, name, description)
        VALUES ('apple', 'Apple Computer', 'Maker of OSX.')
        RETURNING  code, name, description`
    );
    testCompany = compResult.rows[0];

    const invResult = await db.query(
        `INSERT INTO invoices (comp_code, amt, paid, paid_date)
        VALUES ('apple', 100, false, null)
        RETURNING  id, comp_code, amt, paid, add_date, paid_date`
    );
    testInvoice = invResult.rows[0];
});
  
afterEach(async () => {
    await db.query(`DELETE FROM invoices`);
    await db.query(`DELETE FROM companies`);
});
  
afterAll(async () => {
    await db.end();
});

describe('GET /invoices', () => {
    test('Get a list with one invoice', async () => {
        const res = await request(app).get('/invoices');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({invoices: [
            {
                id: testInvoice.id,
                comp_code: 'apple'
            }
        ]});
    });
});

describe('GET /invoices/:id', () => {
    test('Gets a single invoice', async () => {
        const res = await request(app).get(`/invoices/${testInvoice.id}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            invoice: {
                id: testInvoice.id,
                company: {
                    code: 'apple',
                    name: 'Apple Computer',
                    description: 'Maker of OSX.'
                },
                amt: 100,
                paid: false,
                add_date: '2023-11-03T04:00:00.000Z',
                paid_date: null
            }});
    });
    test('Responds with 404 for invalid code', async () => {
        const res = await request(app).get('/invoices/0');
        expect(res.statusCode).toBe(404);
    });
});

describe('POST /invoices', () => {
    test('Creates a single invoice', async () => {
        const res = await request(app)
        .post('/invoices')
        .send({
            comp_code: 'apple',
            amt: 200
        });
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({
            invoice: {
                id: expect.any(Number),
                comp_code: 'apple',
                amt: 200,
                paid: false,
                add_date: '2023-11-03T04:00:00.000Z',
                paid_date: null
            }
        });
    });
});

describe('PUT /invoices/:id', () => {
    test('Updates a single invoice', async () => {
        const res = await request(app)
        .put(`/invoices/${testInvoice.id}`)
        .send({
            amt: 300,
            paid: false
        });
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            invoice: {
                id: testInvoice.id,
                comp_code: 'apple',
                amt: 300,
                paid: false,
                add_date: '2023-11-03T04:00:00.000Z',
                paid_date: null
            }
        });
    });
    test('Responds with 404 for invalid code', async () => {
        const res = await request(app)
        .put(`/invoices/0`)
        .send({
            amt: 300,
            paid: false
        });
        expect(res.statusCode).toBe(404);
    });
});

describe('DELETE /invoices/:id', () => {
    test('Deletes a single invoice', async () => {
        const res = await request(app).delete(`/invoices/${testInvoice.id}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({status: 'deleted'});
    });
});