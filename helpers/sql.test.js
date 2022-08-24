"use strict";
const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql")

// describe("createToken", function () {
    // test("works: not admin", function () {
    //   const token = createToken({ username: "test", is_admin: false });
    //   const payload = jwt.verify(token, SECRET_KEY);
    //   expect(payload).toEqual({
    //     iat: expect.any(Number),
    //     username: "test",
    //     isAdmin: false,
    //   });
    // });
  
    // test("works: admin", function () {
    //   const token = createToken({ username: "test", isAdmin: true });
    //   const payload = jwt.verify(token, SECRET_KEY);
    //   expect(payload).toEqual({
    //     iat: expect.any(Number),
    //     username: "test",
    //     isAdmin: true,
    //   });
    // });
    
const dataToUpdate = { name: "Phil", description: "coder", isCool: "yes!" }
const jsToSql = {isCool: "is_cool"}


describe("test sqlForPartialUpdate function", function() {
    test("works", function() {
        const results = sqlForPartialUpdate(dataToUpdate, jsToSql);
        
        const expected = {
            setCols: '"name"=$1, "description"=$2, "is_cool"=$3',
            values: ["Phil", "coder", "yes!"]
        }
        
        expect(results).toEqual(expected);
    })
    
    test("fails: no input data", function() {
        function fail() {
            sqlForPartialUpdate({}, jsToSql);
        }
        
        expect(fail).toThrow(new BadRequestError("No data")); // or could do .toThrowError
        // could also just input BadRequestError if you don't care about message
    })
})