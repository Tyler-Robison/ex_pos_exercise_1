process.env.NODE_ENV = 'test'

const request = require('supertest');
const app = require('../app')
const db = require('../db')

let testCompany;
let testInvoice;
let testInvoice2;

beforeEach(async () => {

    // Insert a company and associated invoice
    const companyRes = await db.query(`INSERT INTO companies (code, name, description)
    VALUES ('ibm', 'ibm', 'Big Blue')
    RETURNING code, name, description`)

    const invoiceRes = await db.query(`INSERT INTO invoices (comp_code, amt, paid, paid_date)
    VALUES ('ibm', 100, false, null), ('ibm', 300, false, null)
    RETURNING id, comp_code, amt, paid, add_date, paid_date`)

    testCompany = companyRes.rows[0]
    testInvoice = invoiceRes.rows[0]
    testInvoice2 = invoiceRes.rows[1]
    testInvoice.add_date = '2021-11-24T05:00:00.000Z'
    testInvoice2.add_date = '2021-11-24T05:00:00.000Z'
})

// Have to delete from all tables that we added to
afterEach(async () => {
    await db.query('DELETE FROM invoices')
    await db.query('DELETE FROM companies')
    await db.query('DELETE FROM industries')
    await db.query('DELETE FROM industries_companies')
})

afterAll(async () => {
    await db.end()
})


describe('GET /invoices', () => {
    test('Get all invoices', async () => {
        const res = await request(app).get('/invoices')

        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({ invoices: [{ id: testInvoice.id, comp_code: testInvoice.comp_code }, { id: testInvoice2.id, comp_code: testInvoice2.comp_code }] })
    })
})

describe('GET /invoices/:id', () => {
    test('Get specific invoice', async () => {

        const res = await request(app).get(`/invoices/${testInvoice.id}`)

        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({ invoice: { id: testInvoice.id, comp_code: testInvoice.comp_code, amt: testInvoice.amt, paid: testInvoice.paid, add_date: expect.any(Date), paid_date: testInvoice.paid_date } })
    })

    test("Responds with 404 for invalid code", async () => {
        const res = await request(app).get(`/invoices/0`)
        expect(res.statusCode).toBe(404);
    })
})

describe('POST /invoices', () => {
    test('POST new invoice', async () => {

        const newInvoice = {
            "comp_code": "ibm",
            "amt": 500,
            "paid": false,
            "paid_date": "2021-11-24T05:00:00.000Z"
        }

        const res = await request(app).post(`/invoices`).send(newInvoice)

        expect(res.statusCode).toBe(201)
        expect(res.body).toEqual({ invoice: { id: expect.any(Number), comp_code: newInvoice.comp_code, amt: newInvoice.amt, paid: newInvoice.paid, add_date: '2021-11-24T05:00:00.000Z', paid_date: newInvoice.paid_date } })
    })
})

describe('PUT /invoices/:id', () => {
    test('PUT edit invoice', async () => {

        const newInvoice = { amt: 200, paid: true }

        const res = await request(app).put(`/invoices/${testInvoice.id}`)
            .send(newInvoice)

        expect(res.statusCode).toBe(200)
        // amt is now 200
        // expect(res.body).toEqual({ invoice: { id: testInvoice.id, comp_code: testInvoice.comp_code, amt: 200, paid: true, add_date: '2021-11-24T05:00:00.000Z', paid_date: expect.any(Date) } })
    })

    test('PUT edit invoice', async () => {

        const newInvoice = { amt: 200, paid: false }

        const res = await request(app).put(`/invoices/${testInvoice.id}`)
            .send(newInvoice)

        expect(res.statusCode).toBe(200)
        // amt is now 200
        expect(res.body).toEqual({ invoice: { id: testInvoice.id, comp_code: testInvoice.comp_code, amt: 200, paid: false, add_date: '2021-11-24T05:00:00.000Z', paid_date: null } })
    })

    // test('PUT edit invoice', async () => {

    //     const newInvoice = { amt: 200, paid: true }

    //     const res = await request(app).put(`/invoices/${testInvoice.id}`)
    //         .send(newInvoice)

    //     expect(res.statusCode).toBe(200)
    //     // amt is now 200
    //     // expect(res.body).toEqual({ invoice: { id: testInvoice.id, comp_code: testInvoice.comp_code, amt: 200, paid: true, add_date: '2021-11-24T05:00:00.000Z', paid_date: expect.any(Date) } })
    // })

    test("Responds with 404 for invalid code", async () => {
        const res = await request(app).put(`/invoices/0`)
        expect(res.statusCode).toBe(404);
    })
})

describe('DELETE /invoices/:id', () => {
    test('DELETE an invoice', async () => {

        const res = await request(app).delete(`/invoices/${testInvoice.id}`)

        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({ message: "Deleted" })

    })

    test("Responds with 404 for invalid code", async () => {
        const res = await request(app).delete(`/invoices/0`)
        expect(res.statusCode).toBe(404);
    })
})

describe('GET /invoices/companies/:code', () => {
    test('Get all invoices for a given company', async () => {
        const res = await request(app).get(`/invoices/companies/${testCompany.code}`)

        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({
            company: testCompany,
            invoices: [{ id: testInvoice.id, comp_code: testInvoice.comp_code, amt: testInvoice.amt, paid: testInvoice.paid, add_date: '2021-11-24T05:00:00.000Z', paid_date: testInvoice.paid_date },
            { id: testInvoice2.id, comp_code: testInvoice2.comp_code, amt: testInvoice2.amt, paid: testInvoice2.paid, add_date: '2021-11-24T05:00:00.000Z', paid_date: testInvoice2.paid_date }]
        })
    })

    test("Responds with 404 for invalid code", async () => {
        const res = await request(app).get(`/invoices/companies/badCode`)
        expect(res.statusCode).toBe(404);
    })
})




