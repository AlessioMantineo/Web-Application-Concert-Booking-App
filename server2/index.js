'use strict';

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const dayjs = require('dayjs');
const jsonwebtoken = require('jsonwebtoken');

const { check, validationResult } = require("express-validator");

const { expressjwt: jwt } = require('express-jwt');


const jwtSecret = 'qTX6walIEr47p7iXtTgLxDTXJRZYDC9egFjGLIn0rRiahB4T24T4d5f59CtyQmH8';

// Initialize the Express application
const app = new express();
const port = 3002;

const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));// Enable CORS for the specified origin

app.use(morgan('dev'));  // Use morgan for HTTP request logging
app.use(express.json()); // Parse incoming JSON requests

// Check token validity
app.use(jwt({
  secret: jwtSecret,
  algorithms: ["HS256"],
})
);

// To return a better object in case of errors
app.use( function (err, req, res, next) {
  // Handles errors related to JWT authentication
  if (err.name === 'UnauthorizedError') {
    // Example of err content:  {"code":"invalid_token","status":401,"name":"UnauthorizedError","inner":{"name":"TokenExpiredError","message":"jwt expired","expiredAt":"2024-05-23T19:23:58.000Z"}}
    // Sends a specific error message when the JWT token is invalid or expired
    res.status(401).json({ errors: [{  'param': 'Server', 'msg': 'Authorization error', 'path': err.code }] });
  } else {
    next();
  }
} );

/*** APIs ***/

/**
 * Function to calculate a discount based on the sum of seat rows and user role.
 * Loyal users receive a higher base value for the discount calculation.
 * The final discount is a random value added to the base value, clipped between 5 and 50.
 */
const calculateDiscount = (rowSum, userRole) => {
  const isLoyal = userRole === 'loyal';  // Determine if the user is loyal
  let baseValue = isLoyal ? rowSum : rowSum / 3;  // Calculate base discount value
  let randomValue = Math.floor(Math.random() * 16) + 5; // Generate a random value between 5 and 20
  //Math.random(): between 0 (inside) e 1 (outside).
  //Math.random() * 16: 0 and 15.9999....
  //Math.floor(...): round, so we obtain between 0 and 15.
  //+ 5: Sum 5, final interval between 5 and 20
  let discount = Math.round(baseValue + randomValue);  // Calculate the discount and round it

  // Clip the discount value to be between 5 and 50
  if (discount < 5) discount = 5;
  if (discount > 50) discount = 50;
  console.log(`Final Discount: ${discount}`);
  
  return discount;
};

/**
 * API to calculate the discount based on the request body.
 * The request body must include `rowSum`.
 * The API validates the input and returns the calculated discount.
 */
app.post('/api/calculate-discount',
  [
    check('rowSum').isInt({ min: 1 }),  // Validate that rowSum is a positive integer
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });// Return validation errors
    }

    const {rowSum} = req.body;
    const userRole = req.auth.role;
    //console.log(userRole);
    //console.log(rowSum);
    const discount = calculateDiscount(rowSum, userRole);// Calculate the discount

    res.json({ discount }); // Send the discount in the response
  });


// Activate the server 
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
