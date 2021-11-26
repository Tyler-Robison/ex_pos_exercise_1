const express = require("express");
const router = express.Router();
const slugify = require('slugify')
const db = require("../db");
const ExpressError = require("../expressError")

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(
            'SELECT * FROM companies'
        );

        const respArr = []
        for (let i = 0; i < results.rows.length; i++) {
            const obj = { 'code': results.rows[i].code, 'name': results.rows[i].name }
            respArr.push(obj)
        }
        return res.json({ "companies": respArr })
    } catch (err) {
        return next(err);
    }
});

router.get('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const results = await db.query(
            `SELECT * FROM companies
            WHERE code=$1`,
            [code]
        );
        if (results.rows.length === 0) {
            const error = new ExpressError(`code ${code} not found`, 404)
            return next(error);
        }

        const industryRes = await db.query(
        `SELECT industry FROM industries_companies AS ic
        JOIN companies AS c ON c.code = ic.company_code
        JOIN industries AS i ON i.code = ic.industry_code
        WHERE c.code = $1`, [code]
        )
        
        const indusArr = industryRes.rows.map(ele => ele.industry)
        return res.json({company: results.rows[0], industries: indusArr})
    } catch (err) {
        return next(err);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const { name, description } = req.body;
        // debugger;
        const code = slugify(req.body.name, {lower: true, replacement: '_'})
 
        const results = await db.query(`INSERT INTO companies (code, name, description) 
      VALUES ($1, $2, $3) RETURNING code, name, description`,
            [code, name, description])
            
        return res.status(201).json({ company: results.rows[0] })
    } catch (err) {
        return next(err)
    }
})

router.put('/:code', async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const { code } = req.params
        const result = await db.query(
            `UPDATE companies SET name=$1, description=$2
        WHERE code = $3`,
            [name, description, code]
        );

        if (result.rowCount === 0) {
            const error = new ExpressError('code not found', 404)
            return next(error);
        }

        const updatedCompany = await db.query(
            `SELECT * FROM companies
          WHERE code = $1`, [code]
        )

        return res.json({ company: updatedCompany.rows[0] })
    } catch (err) {
        return next(err);
    }
})

router.delete('/:code', async (req, res, next) => {
    try {
        const { code } = req.params
        const result = await db.query(
            `DELETE FROM companies
        WHERE code = $1`,
            [code]
        );

        if (result.rowCount === 0) {
            const error = new ExpressError('code not found', 404)
            return next(error);
        }

        return res.json({ message: "Deleted" })
    } catch (err) {
        return next(err)
    }
})



module.exports = router;

