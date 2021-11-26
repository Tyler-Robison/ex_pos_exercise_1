process.env.NODE_ENV = 'test'

const request = require('supertest');
const app = require('../app')
const db = require('../db')

let testCompany;
let testCompany2;
let testInvoice;
let testInvoice2;
let testIndustry;
let testIndustry2;
let testIndComp;
let testIndComp2;

beforeEach(async () => {

    // Insert a company and associated invoice
    const companyRes = await db.query(`INSERT INTO companies (code, name, description)
    VALUES ('ibm', 'ibm', 'Big Blue'), ('ford', 'Ford Motor Company', 'vroom')
    RETURNING code, name, description`);

    const invoiceRes = await db.query(`INSERT INTO invoices (comp_code, amt, paid, paid_date)
    VALUES ('ibm', 100, false, null), ('ibm', 300, false, null)
    RETURNING id, comp_code, amt, paid, add_date, paid_date`);

    const industryRes = await db.query(`INSERT INTO industries (code, industry)
    VALUES ('tech', 'technology'), ('tran', 'transportation')
    RETURNING code, industry`);

    const indCompRes = await db.query(`INSERT INTO industries_companies (company_code, industry_code)
    VALUES ('ibm', 'tech'), ('ford', 'tech'), ('ford', 'tran')
    RETURNING company_code, industry_code`);

    testCompany = companyRes.rows[0]
    testCompany2 = companyRes.rows[1]
    testInvoice = invoiceRes.rows[0]
    testInvoice2 = invoiceRes.rows[1]
    testIndustry = industryRes.rows[0]
    testIndustry2 = industryRes.rows[1]
    testIndComp = indCompRes[0]
    testIndComp2 = indCompRes[1]
    testInvoice.add_date = '2021-11-24T05:00:00.000Z'
    testInvoice2.add_date = '2021-11-24T05:00:00.000Z'
})

// Have to delete from all tables that we added to
afterEach(async () => {
    // Have to deleted tables referencing companies before deleting companies
    await db.query('DELETE FROM invoices')
    await db.query('DELETE FROM industries_companies')
    await db.query('DELETE FROM industries')
    await db.query('DELETE FROM companies')
})

afterAll(async () => {
    await db.end()
})

describe('GET /industries', () => {
    test('Get all industries', async () => {
        const res = await request(app).get('/industries')

        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({ industries: [
            {code: testIndustry.code, industry: testIndustry.industry, associatedCompanies: ['ibm', 'Ford Motor Company']},
            {code: testIndustry2.code, industry: testIndustry2.industry, associatedCompanies: ['Ford Motor Company']}
        ]})
    })
})

describe('POST /industries', () => {
    test('POST a new industry and correctly slugify code', async () => {
        const newIndustry = { industry: 'Finance' }
        const res = await request(app).post('/industries')
            .send(newIndustry)

        expect(res.statusCode).toBe(201)
        expect(res.body).toEqual({ industry: {code: 'finance', industry: 'Finance'} })
    })
})

describe('POST /industries/:company_code/:industryCode', () => {
    test('POST a new industry_company', async () => {
        
        const res = await request(app).post('/industries/ibm/tran')

        expect(res.statusCode).toBe(201)
        expect(res.body).toEqual({ industry_company: {company_code: 'ibm', industry_code: 'tran'} })
    })
})

