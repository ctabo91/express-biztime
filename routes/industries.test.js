process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testCompany;
let testIndustry;
let testRelation;

beforeEach(async () => {
    const compResult = await db.query(
        `INSERT INTO companies (code, name, description)
        VALUES ('apple', 'Apple Computer', 'Maker of OSX.')
        RETURNING  code, name, description`
    );
    testCompany = compResult.rows[0];

    const indResult = await db.query(
        `INSERT INTO industries (code, industry)
        VALUES ('tech', 'Technology')
        RETURNING code, industry`
    );
    testIndustry = indResult.rows[0];

    const compIndResult = await db.query(
        `INSERT INTO companies_industries (comp_code, industry_code)
        VALUES ('apple', 'tech')
        RETURNING comp_code, industry_code`
    );
    testRelation = compIndResult.rows[0];
});
  
afterEach(async () => {
    await db.query(`DELETE FROM companies`);
    await db.query(`DELETE FROM industries`);
    await db.query(`DELETE FROM companies_industries`);
});
  
afterAll(async () => {
    await db.end();
});

describe('GET /industires', () => {
    test('Get a list of one industry', async () => {
        const res = await request(app).get('/industries');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            industries: {
                tech: {
                    code: 'tech',
                    industry: 'Technology',
                    companies: ['apple']
                }
            }
        });
    });
});

describe('POST /industries', () => {
    test('Create a single industry', async () => {
        const res = await request(app)
        .post('/industries')
        .send({
            code: 'mktg',
            industry: 'Marketing'
        });
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({
            industry: {
                code: 'mktg',
                industry: 'Marketing'
            }
        });
    });
});