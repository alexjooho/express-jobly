const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.

/**
 * Accepts an Object (dataToUpdate) which can partially update rows in db,
 *  and an Object jsToSQL which maps javascript keys to psql columns.
 *
 * Data to update = {name, description, numEmployees, logoUrl}
 *
 * jsToSql = { keyforupdate: value});
 *
 * Example return:
 *
 *  {
 *  setCols: '"first_name"=$1', '"age"=$2'
 *  values:[`dataToUpdate_values`]
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

module.exports = { sqlForPartialUpdate };
