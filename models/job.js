"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs */

class Job {
    /** Create a job (from data), update db, return new job data.
    *
    * data should be { title, salary, equity, companyHandle}
    *
    * Returns { id, title, salary, equity, companyHandle}
    *
    * Throws BadRequestError if job already in database.
     */

    static async create({ title, salary, equity, companyHandle }) {
      const duplicateCheck = await db.query(
          `SELECT id
              FROM jobs
              WHERE title=$1 AND company_handle=$2`,
          [title, companyHandle]);

      console.log(duplicateCheck.rows[0])

      if (duplicateCheck.rows[0]) {
        throw new BadRequestError(`Duplicate job posting for: ${title}`);
      }

      const result = await db.query(
          `INSERT INTO jobs(
            title,
            salary,
            equity,
            company_handle)
              VALUES
                ($1, $2, $3, $4)
              RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
          [
            title,
            salary,
            equity,
            companyHandle,
          ],
      );
      const job = result.rows[0];

      return job;
    }

  /** Accepts an object and returns an object with keys of whereBuilder and values,
   *  where the value of values is an array of the argument object's values, and the
   *  value of whereBuilder is a string made to be put into a WHERE clause.
   */
   static _sqlForFilteringAll(queryObj) {
    // the _ means that this is a "private" method, and will not be called outside of this class

    let setWhere = [];
    let values = [];
    let whereBuilder;

    const { title, minSalary, hasEquity } = queryObj;

    if(title) {
      values.push(`%${title}%`)
      setWhere.push(`title ILIKE $${values.length}`)
    }

    if(minSalary) {
      values.push(minSalary)
      setWhere.push(`salary>=$${values.length}`)
    }

    if(hasEquity) {
      values.push(0)
      setWhere.push(`equity>$${values.length}`)
    }
    // TODO: ask what the best way of handling this filter is

    if(values.length > 0) {
      whereBuilder = "WHERE " + setWhere.join(" AND ");
    }
    else {
      whereBuilder = "";
    }

    return {
      whereBuilder,
      values
    };

  }

  /** Find all jobs.
   *
   * Returns [{ title, salary, equity, company_handle}, ...]
   * */
  static async findAll(queryObj) {

    const { whereBuilder, values } = this._sqlForFilteringAll(queryObj);

    console.log(whereBuilder)

    const jobsRes = await db.query(
      `SELECT title,
              salary,
              equity,
              company_handle as "companyHandle"
        FROM jobs
        ${whereBuilder}
        ORDER BY company_handle`,
        values);
  return jobsRes.rows;
  }

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found.
   **/

   static async get(id) {
    const jobRes = await db.query(
        `SELECT id,
                title,
                salary,
                equity,
                company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
        [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity}
   *
   * Throws NotFoundError if not found.
   */

   static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE jobs
      SET ${setCols}
        WHERE id = ${idVarIdx}
        RETURNING id, title, salary, equity`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

   static async remove(id) {
    const result = await db.query(
        `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}

module.exports = Job;