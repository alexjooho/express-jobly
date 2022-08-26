"use strict";

/** Routes for jobs */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNew = require("../schemas/jobNew.json");
const jobFilter = require("../schemas/jobFilter.json");
const jobUpdate = require("../schemas/jobUpdate.json")

const router = new express.Router();


/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, companyHandle}
 *
 * Returns { id, title, salary, equity, companyHandle}
 *
 * Authorization required:
 */

 router.post("/", ensureAdmin,  async function (req, res, next) {
  const validator = jsonschema.validate(
    req.body,
    jobNew,
    {required: true}
  );
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const job = await Job.create(req.body);
  return res.status(201).json({ job });
});

/** GET /  =>
 *   { jobs: [ { id, title, salary, hasEquity}, ...] }
 *
 * Can filter on provided search filters:
 * - title
 * - minSalary
 * - hasEquity
 *
 * Authorization required: admin
 */

 router.get("/", async function (req, res, next) {
  // can do a json schema for queries (this way you will get a 400 error with bad queries)
  let query = req.query

  if(query.minSalary) query.minSalary = Number(query.minSalary);
  if(query.hasEquity) query.hasEquity = Boolean(query.hasEquity);

  const result = jsonschema.validate(query, jobFilter, {required: true});
  if(!result.valid) {
    const errs = result.errors.map(err => err.stack);
    throw new BadRequestError(errs);
  }

  const jobs = await Job.findAll(req.query);
  return res.json( { jobs });
});

/** GET /[id]  =>  { job }
 *
 *  job is { id, title, salary, equity, companyHandle}
 *
 * Authorization required: none
 */

 router.get("/:id", async function (req, res, next) {
  const job = await Job.get(req.params.id);
  return res.json({ job });
});

/** PATCH /[id] { fld1, fld2, ... } => { job }
 *
 * Patches company data.
 *
 * fields can be: { title, minSalary, hasEquity }
 *
 * Returns { id, title, salary, equity, companyHandle}
 *
 * Authorization required: admin
 */

 router.patch("/:id", ensureAdmin, async function (req, res, next) {
  const validator = jsonschema.validate(
    req.body,
    jobUpdate,
    {required:true}
  );
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const job = await Job.update(req.params.id, req.body);
  return res.json({ job });
});

/** DELETE /[id]  =>  { deleted: id}
 *
 * Authorization: login
 */

 router.delete("/:id", ensureAdmin, async function (req, res, next) {
  await Job.remove(req.params.id);
  return res.json({ deleted: req.params.id });
});


module.exports = router;
