const express = require("express");
const pool = require("../database/mysql");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const _ = require("lodash");

const router = express.Router();

// Signup new account
router.post("/signup", (req, res) => {
  const { username, password, fullname } = req.body;

  // Check name in database
  pool.query(
    `SELECT username FROM Users WHERE username = '${username}'`,
    function (err, rows) {
      if (err) throw err;
      if (_.isEmpty(rows)) {
        // Hash password
        bcrypt.genSalt(10, (err, salt) => {
          if (err) throw err;
          bcrypt.hash(password, salt, (err, hash) => {
            if (err) throw err;
            const hashPassword = hash;

            // Insert to database
            pool.query(
              `INSERT INTO Users (username, password, fullname) VALUES ('${username}', '${hashPassword}', '${fullname}')`,
              function (err, rows) {
                if (err) throw err;

                console.log("An account is created");
                //const token = jwt.sign({ username }, "MY_SECRET_KEY");
                res.status(200).send("Create successfully");
              }
            );
          });
        });
      } else {
        // There is a similar username exists
        console.log("There is already this username");
        res.status(422).send("username exists");
      }
    }
  );
});

// Login
router.post("/signin", (req, res) => {
  console.log(req.body);
  const { username, password } = req.body;
  // If don't input username and password
  if (!username || !password) {
    return res
      .status(422)
      .send({ error: "Must provide username and password" });
  }
  pool.query(
    `SELECT username FROM Users WHERE username = '${username}'`,
    function (err, rows) {
      // If username does not exists
      if (err) throw err;
      if (_.isEmpty(rows)) {
        return res.status(404).send({ error: "Username not found" });
      }

      // Check password
      pool.query(
        `SELECT password, fullname, UID FROM Users WHERE username = '${username}'`,
        function (err, rows) {
          if (err) throw err;
          bcrypt.compare(password, rows[0].password, (err, isMatch) => {
            if (err) throw err;
            if (isMatch) {
              const token = jwt.sign({ username }, "MY_SECRET_KEY");
              return res.send({ token, fullname: rows[0].fullname, UID: rows[0].UID });
            }
            res.status(422).send({ error: "Invalid username or password" });
          });
        }
      );
    }
  );
});

// Update password
router.post("/password", (req, res) => {
  const { UID, newPass } = req.body;
  // Hash new password
  bcrypt.genSalt(10, (err, salt) => {
    if (err) throw err;
    bcrypt.hash(newPass, salt, (err, hash) => {
      if (err) throw err;
      const hashPassword = hash;

      // Update to db
      pool.query(
        `UPDATE Users SET password = '${hashPassword}' WHERE UID = ${UID}`,
        function (err) {
          if (err) throw err;
          console.log("Update password successfully");
          res.status(200).send("Update password successfully");
        }
      );
    });
  });
});

module.exports = router;
