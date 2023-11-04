process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testCompany;
let testIndustry;
let testRelation;

beforeEach(async () => {
    let promises = [];

    promises.push(db.query(
        `INSERT INTO companies (code, name, description)
        VALUES ('apple', 'Apple Computer', 'Maker of OSX.')
        RETURNING  code, name, description`
    ));
    promises.push(db.query(
        `INSERT INTO industries (code, industry)
        VALUES ('tech', 'Technology')
        RETURNING code, industry`
    ));
    promises.push(db.query(
        `INSERT INTO companies_industries (comp_code, industry_code)
        VALUES ('apple', 'tech')
        RETURNING comp_code, industry_code`
    ));

    const results = await Promise.all(promises);
    [compResult, indResult, compIndResult] = results;

    testCompany = compResult.rows[0];
    testIndustry = indResult.rows[0];
    testRelation = compIndResult.rows[0];
});
  
afterEach(async () => {
    await Promise.all([
        db.query(`DELETE FROM companies`),
        db.query(`DELETE FROM industries`),
        db.query(`DELETE FROM companies_industries`)
    ]);
});
  
afterAll(async () => {
    await db.end();
});

describe('GET /companies', () => {
    test('Get a list with one company', async () => {
        const res = await request(app).get('/companies');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({companies: [
            {
                code: 'apple',
                name: 'Apple Computer'
            }
        ]});
    });
});

describe('GET /companies/:code', () => {
    test('Gets a single company', async () => {
        const res = await request(app).get(`/companies/${testCompany.code}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            company: {
                code: 'apple',
                name: 'Apple Computer',
                description: 'Maker of OSX.',
                industries: ['Technology'],
                invoices: []
            }});
    });
    test('Responds with 404 for invalid code', async () => {
        const res = await request(app).get('/companies/0');
        expect(res.statusCode).toBe(404);
    });
});

describe('POST /companies', () => {
    test('Creates a single company', async () => {
        const res = await request(app)
        .post('/companies')
        .send({
            code: 'ibm',
            name: 'IBM',
            description: 'Big Blue'
        });
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({
            company: {
                code: 'ibm',
                name: 'IBM',
                description: 'Big Blue'
            }
        });
    });
});

describe('PUT /companies/:code', () => {
    test('Updates a single company', async () => {
        const res = await request(app)
        .put(`/companies/${testCompany.code}`)
        .send({
            name: 'Apple Phone',
            description: 'Creater of the iPhone.'
        });
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            company: {
                code: testCompany.code,
                name: 'Apple Phone',
                description: 'Creater of the iPhone.'
            }
        });
    });
    test('Responds with 404 for invalid code', async () => {
        const res = await request(app)
        .put(`/companies/0`)
        .send({
            name: 'Apple Phone',
            description: 'Creater of the iPhone.'
        });
        expect(res.statusCode).toBe(404);
    });
});

describe('DELETE /companies/:code', () => {
    test('Deletes a single company', async () => {
        const res = await request(app).delete(`/companies/${testCompany.code}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({status: 'deleted'});
    });
});

