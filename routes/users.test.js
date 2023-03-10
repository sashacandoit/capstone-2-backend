"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app");
const User = require("../models/user");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u3Token,
  adminToken
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** GET /users */

describe("GET /users", function () {
  test("works for admins", async function () {
    const resp = await request(app)
      .get("/users")
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      users: [
        {
          username: "u1",
          first_name: "U1First",
          last_name: "U1Last",
          email: "user1@user.com",
          is_admin: false,
        },
        {
          username: "u2",
          first_name: "U2First",
          last_name: "U2Last",
          email: "user2@user.com",
          is_admin: true,
        },
        {
          username: "u3",
          first_name: "U3First",
          last_name: "U3Last",
          email: "user3@user.com",
          is_admin: false,
        }
      ],
    });
  });

  test("unauth for non-admin users", async function () {
    const resp = await request(app)
      .get("/users")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .get("/users");
    expect(resp.statusCode).toEqual(401);
  });
})


/************************************** POST /users */

describe("POST /users", function () {
  test("works for admins: create non-admin", async function () {
    const resp = await request(app)
      .post("/users")
      .send({
        username: "u-new",
        first_name: "First-new",
        last_name: "Last-new",
        password: "password-new",
        email: "new@email.com",
        is_admin: false,
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        username: "u-new",
        first_name: "First-new",
        last_name: "Last-new",
        email: "new@email.com",
        is_admin: false,
      }, token: expect.any(String),
    });
  });

  test("works for admins: create admin", async function () {
    const resp = await request(app)
      .post("/users")
      .send({
        username: "newuser",
        first_name: "First-new",
        last_name: "Last-new",
        password: "password-new",
        email: "new@email.com",
        is_admin: true,
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        username: "newuser",
        first_name: "First-new",
        last_name: "Last-new",
        email: "new@email.com",
        is_admin: true,
      }, token: expect.any(String),
    });
  });

  test("unauth for non-admin users", async function () {
    const resp = await request(app)
      .post("/users")
      .send({
        username: "newuser",
        first_name: "First-new",
        last_name: "Last-new",
        password: "password-new",
        email: "new@email.com",
        is_admin: true,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .post("/users")
      .send({
        username: "newuser",
        first_name: "First-new",
        last_name: "Last-new",
        password: "password-new",
        email: "new@email.com",
        is_admin: true,
      });
    expect(resp.statusCode).toEqual(401);
  });

  //Add after adding json schema validation

  // test("bad request if missing data", async function () {
  //   const resp = await request(app)
  //     .post("/users")
  //     .send({
  //       username: "newuser",
  //     })
  //     .set("authorization", `Bearer ${adminToken}`);
  //   expect(resp.statusCode).toEqual(400);
  // });

  // test("bad request if invalid data", async function () {
  //   const resp = await request(app)
  //     .post("/users")
  //     .send({
  //       username: "newuser",
  //       first_name: "First-new",
  //       last_name: "Last-new",
  //       password: "password-new",
  //       email: "not-an-email",
  //       is_admin: true,
  //     })
  //     .set("authorization", `Bearer ${adminToken}`);
  //   expect(resp.statusCode).toEqual(400);
  // });
})


/************************************** GET /users/:username */

describe("GET /users/:username", function () {
  test("works for admin", async function () {
    const resp = await request(app)
      .get(`/users/u1`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        first_name: "U1First",
        last_name: "U1Last",
        email: "user1@user.com",
        is_admin: false,
        lists:
          [{
            id: expect.any(Number),
            searched_address: "new york ny",
            arrival_date: "2023-05-01",
            departure_date: "2023-05-03"
          },
          {
            id: expect.any(Number),
            searched_address: "paris france",
            arrival_date: "2023-05-01",
            departure_date: "2023-05-03"
          }]
      },
    });
  });

  test("works for same user", async function () {
    const resp = await request(app)
      .get(`/users/u1`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        first_name: "U1First",
        last_name: "U1Last",
        email: "user1@user.com",
        is_admin: false,
        lists:
          [{
            id: expect.any(Number),
            searched_address: "new york ny",
            arrival_date: "2023-05-01",
            departure_date: "2023-05-03"
          },
          {
            id: expect.any(Number),
            searched_address: "paris france",
            arrival_date: "2023-05-01",
            departure_date: "2023-05-03"
          }],
      },
    });
  });

  test("unauth for other users", async function () {
    const resp = await request(app)
      .get(`/users/u1`)
      .set("authorization", `Bearer ${u3Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .get(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if user not found", async function () {
    const resp = await request(app)
      .get(`/users/nope`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
})


/************************************** PATCH /users/:username */

describe("PATCH /users/:username", () => {
  test("works for admins", async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        first_name: "New",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        first_name: "New",
        last_name: "U1Last",
        email: "user1@user.com",
        is_admin: false
      },
    });
  });

  test("works for same user", async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        first_name: "New",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        first_name: "New",
        last_name: "U1Last",
        email: "user1@user.com",
        is_admin: false
      },
    });
  });

  test("unauth if not same user", async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        first_name: "New",
      })
      .set("authorization", `Bearer ${u3Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        first_name: "New",
      });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if no such user", async function () {
    const resp = await request(app)
      .patch(`/users/nope`)
      .send({
        first_name: "Nope",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("works: can set new password", async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        password: "new-password",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        first_name: "U1First",
        last_name: "U1Last",
        email: "user1@user.com",
        is_admin: false,
      },
    });
    const isSuccessful = await User.authenticate("u1", "new-password");
    expect(isSuccessful).toBeTruthy();
  });

  //Add after including json schema validation

  // test("bad request if invalid data", async function () {
  //   const resp = await request(app)
  //     .patch(`/users/u1`)
  //     .send({
  //       first_name: 42,
  //     })
  //     .set("authorization", `Bearer ${adminToken}`);
  //   expect(resp.statusCode).toEqual(400);
  // });
})


/************************************** DELETE /users/:username */

describe("DELETE /users/:username", function () {
  test("works for admin", async function () {
    const resp = await request(app)
      .delete(`/users/u1`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: "u1" });
  });

  test("works for same user", async function () {
    const resp = await request(app)
      .delete(`/users/u1`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: "u1" });
  });

  test("unauth if not same user", async function () {
    const resp = await request(app)
      .delete(`/users/u1`)
      .set("authorization", `Bearer ${u3Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .delete(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if user missing", async function () {
    const resp = await request(app)
      .delete(`/users/nope`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
})