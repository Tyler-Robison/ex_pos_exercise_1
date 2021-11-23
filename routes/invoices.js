const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError")

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(
            'SELECT * FROM invoices'
        );

        const respArr = []
        for (let i = 0; i < results.rows.length; i++) {
            const obj = { 'id': results.rows[i].id, 'comp_code': results.rows[i].comp_code }
            respArr.push(obj)
        }
        return res.json({ "invoices": respArr })
    } catch (err) {
        return next(err);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const results = await db.query(
            `SELECT * FROM invoices
            WHERE id=$1`,
            [id]
        );

        if (results.rows.length === 0) {
            const error = new ExpressError('id not found', 404)
            return next(error);
        }


        return res.json({ invoice: results.rows[0] })
    } catch (err) {
        return next(err);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const { comp_code, amt, paid, paid_date } = req.body;
        const results = await db.query(`INSERT INTO invoices (comp_code, amt, paid, paid_date) 
      VALUES ($1, $2, $3, $4) RETURNING id, comp_code, amt, paid, add_date paid_date`,
            [comp_code, amt, paid, paid_date])
            // debugger;
        return res.status(201).json({ invoice: results.rows[0] })
    } catch (err) {
        return next(err)
    }
})

router.put('/:id', async (req, res, next) => {
    try {
        const { amt } = req.body;
        const { id } = req.params
        const result = await db.query(
            `UPDATE invoices SET amt=$1
        WHERE id = $2`,
            [amt, id]
        );

        if (result.rowCount === 0) {
            const error = new ExpressError('id not found', 404)
            return next(error);
        }

        const updatedInvoice = await db.query(
            `SELECT * FROM invoices
          WHERE id = $1`, [id]
        )

        return res.json({ invoice: updatedInvoice.rows[0] })
    } catch (err) {
        return next(err);
    }
})

router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params
        const result = await db.query(
            `DELETE FROM invoices
        WHERE id = $1`,
            [id]
        );

        if (result.rowCount === 0) {
            const error = new ExpressError('id not found', 404)
            return next(error);
        }

        return res.json({ message: "Deleted" })
    } catch (err) {
        return next(err)
    }
})

router.get('/companies/:code', async (req, res, next) => {
    try {
        const { code } = req.params
            // Get company info
        const results = await db.query(
            `SELECT * FROM companies
            WHERE code=$1`,
            [code]
        );

        if (results.rowCount === 0) {
            const error = new ExpressError('code not found', 404)
            return next(error);
        }
    
        const compObj = {company: results.rows[0]}

        // Get invoices for the same company
        const invoiceResults = await db.query(
            `SELECT * FROM invoices
            WHERE comp_code=$1`,
            [code]
        )

        compObj['invoices'] = invoiceResults.rows

        return res.json(compObj)
    } catch (err) {
        return next(err)
    }
})

module.exports = router;