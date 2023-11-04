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