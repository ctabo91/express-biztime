const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");


router.get('/', async (req, res, next) => {
    try{
        const result = await db.query(
            `SELECT i.code, i.industry, c.code AS company
            FROM industries AS i
            LEFT JOIN companies_industries AS ci
            ON i.code = ci.industry_code
            LEFT JOIN companies AS c
            ON ci.comp_code = c.code`
        );
        const industries = {};
        result.rows.forEach(row => {
            const {code, industry, company} = row;
            if(!industries[code]){
                industries[code] = {
                    code: code,
                    industry: industry,
                    companies: []
                };
                if(company){
                    industries[code].companies.push(company);
                }
            }else{
                if(company){
                    industries[code].companies.push(company);
                }
            }
        });

        return res.json({industries: industries});
    }catch(e){
        return next(e);
    }
});

router.post('/', async (req, res, next) => {
    try{
        const {code, industry} = req.body;

        const result = await db.query(
            `INSERT INTO industries (code, industry)
            VALUES ($1, $2)
            RETURNING code, industry`,
            [code, industry]
        );

        return res.status(201).json({industry: result.rows[0]});
    }catch(e){
        return next(e);
    }
})


module.exports = router;