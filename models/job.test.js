"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    jobIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("create", function () {
    const newjob = {
        id: expect.any(Number),
        title: "new",
        salary: 50,
        equity: "0.3",
        companyHandle: "c1"
    };

    test("works", async function () {
        let job = await Job.create(newjob);
        expect(job).toEqual(newjob);

        //TODO: ask if we actually need this second part. isn't it repetitive?

        const result = await db.query(
            `SELECT title, salary, equity, company_handle AS "companyHandle"
             FROM jobs
             WHERE title = 'new'`);
        expect(result.rows).toEqual([
            {
                title: "new",
                salary: 50,
                equity: "0.3",
                companyHandle: "c1"
            },
        ]);
    });

    test("bad request with dupe", async function () {
        try {
            await Job.create(newjob);
            await Job.create(newjob);
            throw new Error("fail test, you shouldn't get here");
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }

    });
});

/************************************** filtering all */

describe("_sqlForFilteringAll", function () {
    test("works", function () {

        const searchObj = { "title": 'j', "minSalary": 32, "hasEquity": true };

        const results = Job._sqlForFilteringAll(searchObj);

        const expected = {
            whereBuilder:
                'WHERE title ILIKE $1 AND salary>=$2 AND equity>$3',

            values: ['%j%', 32, 0],
        }

        expect(results).toEqual(expected);
    })

    test("works with empty data object", function () {

        const results = Job._sqlForFilteringAll({});

        const expected = {
            whereBuilder: "",
            values: [],
        }

        expect(results).toEqual(expected);
    });
});

/************************************** findAll */

describe("findAll", function () {
    test("works: no filter", async function () {
        const queryObj = {};
        let companies = await Job.findAll(queryObj);
        expect(companies).toEqual([
            {
                title: 'j1',
                salary: 30,
                equity: "0.3",
                companyHandle: 'c1'
            },
            {
                title: 'j2',
                salary: 50,
                equity: "0",
                companyHandle: 'c2'
            },
        ]);
    });

    test("works: with filter", async function () {

        const queryObj = { "minSalary": 25, "hasEquity": true };
        let jobs = await Job.findAll(queryObj);

        expect(jobs).toEqual([
            {
                title: 'j1',
                salary: 30,
                equity: "0.3",
                companyHandle: 'c1'
            }
        ]);
    });
});

/************************************** get */

describe("get", function () {

    test("works", async function () {
        let id = jobIds[0];
        let job = await Job.get(id);
        expect(job).toEqual({
            title: 'j1',
            id,
            salary: 30,
            equity: "0.3",
            companyHandle: 'c1'
        });
    });

    test("not found if no such job", async function () {
        try {
            await Job.get(0);
            throw new Error("fail test, you shouldn't get here");
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});