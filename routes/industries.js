const express = require("express");
const router = express.Router();
const slugify = require('slugify')
const db = require("../db");
const ExpressError = require("../expressError")

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(
            'SELECT * FROM industries'
        );

        const respArr = results.rows.map(ele => ({ 'code': ele.code, 'industry': ele.industry }))

        for (let i = 0; i < respArr.length; i++) {
            const code = respArr[i].code
            respArr[i].associatedCompanies = []
            const associatedCompaniesResults = await db.query(
                `SELECT c.name FROM industries_companies AS ic
                JOIN companies AS c ON c.code = ic.company_code
                JOIN industries AS i ON i.code = ic.industry_code
                WHERE ic.industry_code = $1`, [code]
            )

            for (let j = 0; j < associatedCompaniesResults.rows.length; j++) {
                respArr[i].associatedCompanies.push(associatedCompaniesResults.rows[j].name)
            }
        }
        return res.json({ "industries": respArr })
    } catch (err) {
        return next(err);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const { industry } = req.body
        const code = slugify(req.body.industry, { lower: true, replacement: '_' })

        const results = await db.query(`INSERT INTO industries (code, industry) 
        VALUES ($1, $2) RETURNING code, industry`,
            [code, industry])

        return res.status(201).json({ industry: results.rows[0] })

    } catch (err) {
        next(err)
    }
})

router.post('/:companyCode/:industryCode', async (req, res, next) => {
    try {
        const { companyCode, industryCode } = req.params;

        const results = await db.query(`
    INSERT INTO industries_companies
    (company_code, industry_code)
    VALUES ($1, $2) RETURNING company_code, industry_code`,
            [companyCode, industryCode])

        return res.status(201).json({ industry_company: results.rows[0] })
    } catch (err) {
        next(err)
    }
})





module.exports = router;

