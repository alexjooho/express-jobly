"use strict";
const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.

/**
 * Accepts an Object (dataToUpdate) which can partially update rows in db,
 *  and an Object jsToSQL which maps javascript keys to psql columns.
 *
 * e.g. Accepts:
 * dataToUpdate = {name: "Phil", isCool: "yes!"}
 *
 * jsToSql = { isCool: "is_cool" }
 *
 * Example return:
 *
 *  {
 *  setCols: '"name"=$1, "is_cool"=$2'
 *  values:["Phil", "yes!"]
 * }
 *
*/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

/** Accepts a query object with keys of the filter and values of how it is filtering
 * e.g. 
 * {
 * minEmployees: 50
 * }
 * 
 * returns an object e.g.: 
 *  {
 *  filters: '"numEmployees>$1"
 *  values: [50]
 * }
 */
function sqlForFilteringAll(queryObj) {
  const filterOptions = new Set(["minEmployees", "maxEmployees", "nameLike"]);
  
  const keys = Object.keys(queryObj)
  if (keys.length === 0) {
    return ""
  }
  
  for(let key of keys) {
    if(!key in filterOptions) {
      throw new BadRequestError(`${key} not a valid filter option!`)
    }
  }
  
  if("minEmployees" in queryObj && "maxEmployees" in queryObj) {
    if(queryObj["minEmployees"] > queryObj["maxEmployees"]) {
      throw new BadRequestError("minEmployees can not be greater than maxEmployees");
    }
  }
  
  const filters = keys.map((filter, idx) => {
    if(filter === "minEmployees") {
      return `"num_employees">=$${idx + 1}`
    }
    else if(filter === "maxEmployees") {
      return `"num_employees"<=$${idx + 1}`
    }
    else if(filter === "nameLike") {
      let value = queryObj["nameLike"];
      let updatedValue = `%${value}%`;
      queryObj["nameLike"] = updatedValue;
      
      return `"name" ILIKE $${idx + 1}`
    }
  })
  
  return {
    setFilters: filters.join(" AND "),
    values: Object.values(queryObj),
  };
  
}

module.exports = { sqlForPartialUpdate, sqlForFilteringAll };
