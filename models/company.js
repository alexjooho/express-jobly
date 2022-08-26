"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
        `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
        `INSERT INTO companies(
          handle,
          name,
          description,
          num_employees,
          logo_url)
           VALUES
             ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }
  
  /** Accepts an object and returns an object with keys of whereBuilder and values,
   *  where the value of values is an array of the argument object's values, and the 
   *  value of whereBuilder is a string made to be put into a WHERE clause.
   */
  static _sqlForFilteringAll(queryObj) {
    // the _ means that this is a "private" method, and will not be called outside of this class
    // const filterOptions = new Set(["minEmployees", "maxEmployees", "nameLike"]);
  
    let setWhere = [];
    let values = [];
    let whereBuilder;
    
    const { name, minEmployees, maxEmployees } = queryObj;
    
    if(name) {
      values.push(`%${name}%`) // need this in template literal because sql only uses ' '
      setWhere.push(`name ILIKE $${values.length}`)
    }
    
    if(minEmployees) {
      values.push(minEmployees) // need this in template literal because sql only uses ' '
      setWhere.push(`num_employees>=$${values.length}`)
    }
    
    if(maxEmployees) {
      values.push(maxEmployees) // need this in template literal because sql only uses ' '
      setWhere.push(`num_employees<=$${values.length}`)
    }
    
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

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(queryObj) {
    
    if(queryObj.minEmployees && queryObj.maxEmployees) {
      if(queryObj.minEmployees > queryObj.maxEmployees) {
        throw new BadRequestError("minEmployees can not be greater than maxEmployees")
      }
    }
    
    const filterObj = this._sqlForFilteringAll(queryObj);
    
    // if(!filterObj) {
    //   const companiesRes = await db.query(
    //       `SELECT handle,
    //               name,
    //               description,
    //               num_employees AS "numEmployees",
    //               logo_url AS "logoUrl"
    //         FROM companies
    //         ORDER BY name`);
    //   return companiesRes.rows;
    // }
    
    const { whereBuilder, values} = filterObj;
    
    const companiesRes = await db.query(
      `SELECT handle,
              name,
              description,
              num_employees AS "numEmployees",
              logo_url AS "logoUrl"
        FROM companies
        ${whereBuilder}
        ORDER BY name`,
        values);
  return companiesRes.rows;
    
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/
  //FIXME: FIX THIS!

  static async get(handle) {
    const companyRes = await db.query(
        `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
        [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE companies
      SET ${setCols}
        WHERE handle = ${handleVarIdx}
        RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
        `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
