const express = require("express");
const slugify = require('slugify');
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");


router.get('/', async (req, res, next) =>{
    try{
        const result = await db.query(
            `SELECT code, name
            FROM companies
            ORDER BY name`
        );
        return res.json({companies: result.rows});
    }catch(e){
        return next(e);
    }
});


router.get('/:code', async (req, res, next) =>{
    try{
        const {code} = req.params;
        const compResult = await db.query(
            `SELECT code, name, description
            FROM companies
            WHERE code=$1`,
            [code]
        );

        const invResult = await db.query(
            `SELECT id
            FROM invoices
            WHERE comp_code=$1`,
            [code]
        );

        if (compResult.rows.length === 0) {
            throw new ExpressError(`There is no company with code: '${code}`, 404);
        }

        const company = compResult.rows[0];
        const invoices = invResult.rows;

        company.invoices = invoices.map(inv => inv.id);

        return res.json({company: company});
    }catch(e){
        return next(e);
    }
});


router.post('/', async (req, res, next) =>{
    try{
        const {name, description} = req.body;
        const code = slugify(name, {lower: true});

        const result = await db.query(
            `INSERT INTO companies (code, name, description)
            VALUES ($1, $2, $3)
            RETURNING code, name, description`,
            [code, name, description]
        );

        return res.status(201).json({company: result.rows[0]});
    }catch(e){
        return next(e);
    }
});


router.put('/:code', async (req, res, next) =>{
    try{
        const {code} = req.params;
        const {name, description} = req.body;
        const result = await db.query(
            `UPDATE companies
            SET name=$1, description=$2
            WHERE code=$3
            RETURNING code, name, description`,
            [name, description, code]
        );
        
        if (result.rows.length === 0) {
            throw new ExpressError(`Can't update company with code: '${code}`, 404);
        }
        return res.json({company: result.rows[0]});
    }catch(e){
        return next(e);
    }
});


router.delete('/:code', async (req, res, next) =>{
    try{
        const result = await db.query(
            `DELETE FROM companies
            WHERE code=$1
            RETURNING code`, [req.params.code]
        );

        if (result.rows.length === 0) {
            throw new ExpressError(`There is no company with code: '${code}`, 404);
        }
        return res.json({status: 'deleted'});
    }catch(e){
        return next(e);
    }
});


module.exports = router;

