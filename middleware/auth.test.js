"use strict";

const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../expressError");
const {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  ensureAdminOrSame,
} = require("./auth");


const { SECRET_KEY } = require("../config");
const testJwt = jwt.sign({ username: "test", isAdmin: false }, SECRET_KEY);
const badJwt = jwt.sign({ username: "test", isAdmin: false }, "wrong");

describe("authenticateJWT", function () {
  test("works: via header", function () {
    expect.assertions(2);
    const req = { headers: { authorization: `Bearer ${testJwt}` } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({
      user: {
        iat: expect.any(Number),
        username: "test",
        isAdmin: false,
      },
    });
  });

  test("works: no header", function () {
    expect.assertions(2);
    const req = {};
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });

  test("works: invalid token", function () {
    expect.assertions(2);
    const req = { headers: { authorization: `Bearer ${badJwt}` } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });
});


describe("ensureLoggedIn", function () {
  test("works", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: { user: { username: "test" } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureLoggedIn(req, res, next);
  });

  test("unauth if no login", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: {} };
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    ensureLoggedIn(req, res, next);
  });
});

describe("ensureAdmin", function () {
  test("works: when performed by admin", function () {
    // TODO: in code review make sure that our understanding of this is accurate
    expect.assertions(1);
    const req = {};
    const res = { locals: { user: { isAdmin: true } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureAdmin(req, res, next);
  });

  test("fails: when performed by non-admin", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: { user: { isAdmin: false } } };

    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    ensureAdmin(req, res, next);
  });
});

  describe("ensureAdminOrSame", function () {
    test("works: when performed by admin", function () {
      // TODO: in code review make sure that our understanding of this is accurate
      expect.assertions(1);
      const req = {params:{username: "non-admin"}};
      const res = { locals: { user: { username:"testAdm", isAdmin: true } } };
      const next = function (err) {
        expect(err).toBeFalsy();
      };
      ensureAdminOrSame(req, res, next);
    });

    test("works: when performed by non-admin", function () {
      expect.assertions(1);
      const req = {params: {username: "Same-User"}};
      const res = { locals: { user: {username: "Same-User", isAdmin: false } } };

      const next = function (err) {
        expect(err).toBeFalsy();
      };
      ensureAdminOrSame(req, res, next);
    });

    test("fails: when performed by different non-admin user", function () {
      expect.assertions(1);
      const req = {params: {username: "user-2"}};
      const res = { locals: { user: { username: "user-1",isAdmin: false } } };

      const next = function (err) {
        expect(err instanceof UnauthorizedError).toBeTruthy();
      };
      ensureAdminOrSame(req, res, next);
    });

    test("fails: when no active user", function () {
      expect.assertions(1);
      const req = {params:{username: ""}};
      const res = { locals:{}};

      const next = function (err) {
        expect(err instanceof UnauthorizedError).toBeTruthy();
      };
      ensureAdminOrSame(req, res, next);
    });
})
