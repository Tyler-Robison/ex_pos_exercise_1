process.env.NODE_ENV = 'test'

const request = require('supertest');
const app = require('../app')
const db = require('../db')

beforeEach(async () => {
    const result = await db.query(`INSERT INTO companies (code, name, description)
    VALUES ('ibm', 'ibm', 'Big Blue')
    RETURNING code, name, description`)

    testCompany = result.rows[0]
})

afterEach(async () => {
    await db.query('DELETE FROM invoices')
    await db.query('DELETE FROM companies')
    await db.query('DELETE FROM industries')
    await db.query('DELETE FROM industries_companies')
})

afterAll(async () => {
    await db.end()
})

describe('GET /companies', () => {
    test('Get all companies', async () => {
        const res = await request(app).get('/companies')

        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({ companies: [{ 'code': testCompany.code, 'name': testCompany.name }] })
    })
})

describe('GET /companies/:code', () => {
    test('Get specific company', async () => {
        const res = await request(app).get('/companies/ibm')

        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({ company: testCompany, industries: [] })
    })

    test("Responds with 404 for invalid code", async () => {
        const res = await request(app).get(`/companies/fakeCompany`);
        expect(res.statusCode).toBe(404);
    })
})

describe('POST /companies/', () => {
    test('POST a new company', async () => {
        const newCompany = { name: 'google', description: 'Search Engine' }
        const res = await request(app).post('/companies/')
            .send(newCompany)

        expect(res.statusCode).toBe(201)
        expect(res.body).toEqual({ company: {code: 'google', name: 'google', description: 'Search Engine'} })
    })

    test('Correctly slugifies company cpde', async () => {
        const newCompany = { name: 'Google Inc', description: 'Search Engine' }
        const res = await request(app).post('/companies/')
            .send(newCompany)

        expect(res.statusCode).toBe(201)
        expect(res.body).toEqual({ company: { name: 'Google Inc', code: 'google_inc', description: 'Search Engine' } })
    })
})

describe('PUT /companies/:code', () => {
    test('PUT edit a company', async () => {
        const newCompany = { name: 'google', description: 'Search Engine' }
        const res = await request(app).put('/companies/ibm')
            .send(newCompany)

        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({ company: { name: newCompany.name, description: newCompany.description, code: testCompany.code } })
    })

    test("Responds with 404 for invalid code", async () => {
        const res = await request(app).put(`/companies/fakeCompany`).send({ name: 'BillyBob', type: 'admin' });
        expect(res.statusCode).toBe(404);
    })
})

describe('DELETE /companies/:code', () => {
    test('DELETE a company', async () => {

        const res = await request(app).delete('/companies/ibm')

        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({ message: "Deleted" })
    })

    test("Responds with 404 for invalid code", async () => {
        const res = await request(app).delete(`/companies/fakeCompany`);
        expect(res.statusCode).toBe(404);
    })
})

