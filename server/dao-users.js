'use strict';

const db = require('./db');
const util = require('util');
const crypto = require('crypto');

const scryptAsync = util.promisify(crypto.scrypt);

/**
 * This SQL query retrieves user information from the database based on the provided username.
 * The query joins the 'User' table with the 'Role' table to fetch the user's role (either 'loyal' or 'normal').
 * It selects the user's ID, username, salt, hashed password, and the role name.
 * The role is important for defining different privileges in the application.
 * If the username exists, the query returns the corresponding user data; otherwise, it returns 'undefined'.
 */
exports.getUser = (username, password) => {
  return new Promise((resolve, reject) => {
    const sql = 'select User.user_id, User.username, User.salt, User.password, Role.name as role from User inner join Role on User.role = Role.id where username=?';
    db.get(sql, [username], async (err, row) => {
      if (err) {
        reject(err);
      } else if (row === undefined) {
        resolve(false);
      }
      else {
        const user = { user_id: row.user_id, username: row.username, role: row.role };

        try {
          const hashedPassword = await scryptAsync(password, row.salt, 64);
          if (!crypto.timingSafeEqual(Buffer.from(row.password, 'hex'), hashedPassword)) {
            resolve(false);
          } else {
            resolve(user);
          }
        } catch (err) {
          reject(err);
        }
      }
    });
  });
};