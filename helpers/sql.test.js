"use strict";
const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate, sqlForFilteringAll} = require("./sql")

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





describe("test sqlForFilteringAll function", function() {
    test("works", function() {

        const searchObj = {"minEmployees": 12, "maxEmployees": 32, "nameLike": 'Alex'};

        const results = sqlForFilteringAll(searchObj);

        const expected = {
            setFilters:
            '"num_employees">=$1 AND "num_employees"<=$2 AND "name" ILIKE $3',

            values: Object.values(searchObj),
        }

        expect(results).toEqual(expected);
    })

    test("fails: minEmployees > maxEmployees", function() {
        function fail() {
            const searchObj = {"minEmployees": 42, "maxEmployees": 32, "nameLike": 'Alex'};
            sqlForFilteringAll(searchObj);
        }

        expect(fail).toThrow(new BadRequestError(
            "minEmployees can not be greater than maxEmployees")); // or could do .toThrowError
        // could also just input BadRequestError if you don't care about message

            // Could also do this way:
            //
            //try: (
            // yourfunctionThatMayThrowAnError();
            // } catch (err) {
            // expect(err instanceof TheSpecificError).toBeTruthy();
            // }

    })

    test("works with no data", function() {

        const results = sqlForFilteringAll({});

        expect(results).toEqual("");
    })

})
