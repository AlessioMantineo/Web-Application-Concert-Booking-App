const express = require('express');
const morgan = require('morgan');
const { check, validationResult, oneOf } = require('express-validator'); // validation middleware
const cors = require('cors');
const jsonwebtoken = require('jsonwebtoken');

// Secret key and expiration time for JWT tokens
const jwtSecret = 'qTX6walIEr47p7iXtTgLxDTXJRZYDC9egFjGLIn0rRiahB4T24T4d5f59CtyQmH8';
const expireTime = '60s';

const userDao = require('./dao-users');
const concertDao = require('./dao-concerts');
const db = require('./db');

const app = express();
app.use(morgan('dev')); // Logger middleware
app.use(express.json()); // Middleware to parse JSON request bodie

// CORS configuration to allow requests from the frontend
const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));


/*** Passport Setup ***/

// Passport setup for handling user authentication
const passport = require('passport');
const LocalStrategy = require('passport-local');   // Authentication strategy using username and password

// Verifies the username and password against the database
passport.use(new LocalStrategy(async function verify(username, password, callback) {
  const user = await userDao.getUser(username, password)
  if (!user)
    return callback(null, false, 'Incorrect username or password');

  return callback(null, user);
}));
// Serializes the user data into the session
passport.serializeUser(function (user, callback) {
  callback(null, user);
});
// Deserializes the user data from the session
passport.deserializeUser(function (user, callback) {

  return callback(null, user);
});

/** Creating the session */
// Setup for session management
const session = require('express-session');

app.use(session({
  secret: "IngHLKDjh67HdjueufhHYYHYYYjgfhghjgosjhqwertyuilodlsjjrJHDHDHDHDJ",// Secret key for session encryption
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: app.get('env') === 'production' ? true : false },
}));


app.use(passport.authenticate('session'));


/** Defining authentication verification middleware **/

// Middleware to check if the user is authenticated
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: 'Not authorized' });// Responds with a 401 status if not authenticated
}



/*** Utility Functions ***/

// Utility function to format validation errors as strings
const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
  return `${location}[${param}]: ${msg}`;
};


/*** Concerts APIs ***/

// 1. Retrieve the list of all the available concerts.
// GET /api/concerts
// Endpoint to get a list of all concerts from the database
app.get('/api/concerts', 
  (req, res) => {
    concertDao.listConcerts()
      .then(concerts => res.json(concerts))
      .catch((err) => res.status(500).json(err)); // Responds with a 500 status if an error occurs
  }
);

// 2. Retrieve the details of a specific concert by its ID.
// GET /api/concerts/:id
app.get('/api/concerts/:id', 
  [
    check('id').isInt({ min: 1 })// Validates that the concert ID is a positive integer
  ],
  (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json(errors.errors);
    }
  concertDao.getConcertById(req.params.id)
      .then(concert => res.json(concert))
      .catch(err => res.status(500).json({ error: 'Error fetching concert details.' }));
});

// 3. Retrieve seats for a specific concert.
// GET /api/concert/:id/seats
// Endpoint to retrieve seats associated with a specific concert
app.get('/api/concert/:id/seats',
  [
    check('id').isInt({ min: 1 })// Validates that the concert ID is a positive integer
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json(errors.errors);
    }
  const concertId = req.params.id;

  try {
    const seats = await concertDao.getSeatsByConcertId(concertId);
    if (seats) {
      res.json(seats);// Respond with seat data
    } else {
      res.status(404).json({ error: 'Error retrieving seats' });// 404 if no seats found
    }
  } catch (err) {
    res.status(500).json({ error: err });// 500 if an error occurs
  }
});



// 4. Retrieve all the tickets that the user has purchased, along with the count of seats reserved for each ticket.
// GET /api/ticketseat/:id/reservation
app.get('/api/ticketseat/:id/reservation', isLoggedIn,
  [
    check('id').isInt({ min: 1 }) // Validates that the ID is a positive integer
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json(errors.errors);
    }
    const requestedId = parseInt(req.params.id);
    const userId = req.user.user_id; // The ID of the authenticated user

    // Check if the requested ID matches the user's ID
    if (requestedId !== userId) {
      return res.status(403).json({ error: 'Unauthorized: You can only view your own reservations.' });
    }

    try {
      const tickets = await concertDao.getTicketSeatReservation(requestedId);
      res.json(tickets); // Respond with the ticket data
    } catch (err) {
      res.status(500).json({ error: err.message }); // 500 if an error occurs
    }
  }
);

// 5. Reserve seats for a concert
// POST /api/concert/:id/reserve
// Endpoint to reserve seats for a specific concert
app.post('/api/concert/:id/reserve', isLoggedIn, [
  check('id').isInt({ min: 1 }),// Validates that the concert ID is a positive integer
  check('seats').isArray({ min: 1 }),// Validates that seats is an array with at least one element
  check('seats.*.seat_id').isInt({ min: 1 })// Validates that each seat ID is a positive integer
  /**
 *  (*) is used to iterate over each element in the array. 
 * The validation ensures that each 'seat_id' ( is valid, it must 
 * be a positive integer). If any object is missing a 'seat_id' 
 * or if 'seat_id' is invalid ( negative or not an integer), 
 * an error will be triggered.
 */
  ], 
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json(errors.errors);
    }
  const concertId = req.params.id;
  const userId = req.user.user_id;
  const seats = req.body.seats.map(seat => seat.seat_id); // Extract seat IDs

  try {

      const hasReservation = await concertDao.checkExistingReservation(userId, concertId);
      if (hasReservation) {
        return res.status(403).json({ error: 'You already have a reservation for this concert.' });
      }
      // Check the status of all requested seats
      const seatStatuses = await concertDao.checkSeatsAvailability(seats);

      // Filter out seats that are already occupied
      const occupiedSeats = seatStatuses.filter(seat => seat.status !== 'available').map(seat => seat.seat_id);

      if (occupiedSeats.length > 0) {
          // If some seats are occupied, return an error with the occupied seats
          return res.status(409).json({ error: 'Some seats are already occupied', occupiedSeats });
      }

      // If all seats are available, update the seat status to "occupied"
      await concertDao.updateSeatStatus(seats, 'occupied');

      // Insert a new ticket
      const ticketId = await concertDao.insertTicket(concertId, userId);

      // Insert the selected seats into the TicketSeat table
      await concertDao.insertTicketSeats(ticketId, seats);


      
      res.status(200).json({ message: 'Seats successfully reserved', ticketId });
  } catch (error) {
     
      res.status(500).json({ error: error.message });// 500 if an error occurs
  }
});

// 6. Check if a user has an existing reservation for a concert
// GET /api/concert/:id/check-reservation
// Endpoint to check if a user has already reserved seats for a specific concert

app.get('/api/concert/:id/check-reservation', isLoggedIn, 
  [
    check('id').isInt({ min: 1 }),// Validates that the concert ID is a positive integer
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json(errors.errors);
    }
  const concertId = req.params.id;
  const userId = req.user.user_id;

  try {
      const hasReservation = await concertDao.checkExistingReservation(userId, concertId);
      if (hasReservation) {
          res.status(200).json({ reservation: true });// Respond with true if reservation exists
      } else {
          res.status(200).json({ reservation: false });// Respond with false if no reservation exists
      }
  } catch (error) {
      res.status(500).json({ error: error.message });// 500 if an error occurs
  }
});

// 7. Randomly reserve seats for a concert
// POST /api/concert/:id/random-reserve
// Endpoint to randomly reserve seats for a specific concert
app.post('/api/concert/:id/random-reserve', isLoggedIn, [
  check('id').isInt({ min: 1 }), // Validates that the concert ID is a positive integer
  check('numSeats').isInt({ min: 1 }) // Validates that numSeats is a positive integer
],
async (req, res) => {
  const errors = validationResult(req).formatWith(errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json(errors.errors);
  }
  const concertId = req.params.id;
  const userId = req.user.user_id;
  const numSeats = req.body.numSeats;

  try {
    const hasReservation = await concertDao.checkExistingReservation(userId, concertId);
    //fix
      if (hasReservation) {
        return res.status(403).json({ error: 'You already have a reservation for this concert.' });
      }
    // Step 1: Retrieve all available seats
    const seatsData = await concertDao.getSeatsByConcertId(concertId);
    const availableSeats = seatsData.seats.flat().filter(seat => seat.status === 'available');

    // Step 2: Check if there are enough available seats
    if (availableSeats.length < numSeats) {
      return res.status(400).json({ error: 'Not enough available seats.' }); // 400 if not enough seats
    }

    // Step 3: Randomly select the available seats
    //.sort(() => 0.5 - Math.random()): This shuffles the available seats randomly.
    //returns a random value between -0.5 and 0.5
    //.slice(0, numSeats): This selects the first numSeats seats from the shuffled array.
    const selectedSeats = availableSeats.sort(() => 0.5 - Math.random()).slice(0, numSeats);
    const selectedSeatIds = selectedSeats.map(seat => seat.seat_id);
    //.map(seat => seat.seat_id): This extracts the seat IDs from the selected seats. 

    // Step 4: Update the status of the selected seats and create the ticket
    await concertDao.updateSeatStatus(selectedSeatIds, 'occupied');
    const ticketId = await concertDao.insertTicket(concertId, userId);
    await concertDao.insertTicketSeats(ticketId, selectedSeatIds);

    // Step 5: Respond with the reservation details
    res.status(200).json({ message: 'Seats successfully reserved', ticketId, selectedSeats });
  } catch (error) {
    res.status(500).json({ error: error.message }); // 500 if an error occurs
  }
}
);



// 8. Delete a ticket and its associated seats
// DELETE /api/ticket/:id/delete
// Endpoint to delete a ticket and its associated seats from the database
app.delete('/api/ticket/:id/delete', isLoggedIn, 
  [
    check('id').isInt({ min: 1 })// Validates that the ticket ID is a positive integer
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json(errors.errors);
    }
  const ticketId = req.params.id;
  const userId = req.user.user_id;
  try {

      // Verify if the authenticated user is the owner of the ticket
      const ticketOwnerId = await concertDao.getTicketOwner(ticketId);
      if (ticketOwnerId !== userId) {
        return res.status(403).json({ error: 'Unauthorized: You do not own this ticket or it does not exist!' });
      }

      // Begin the transaction
      await new Promise((resolve, reject) => {
          db.run('BEGIN TRANSACTION;', (err) => {
              if (err) reject(err);// Start transaction
              else resolve();
          });
      });

      // 1. Update the status of seats associated with the ticket
      await concertDao.updateSeatsStatus(ticketId, 'available');

      // 2. Delete records from the TicketSeat table
      await concertDao.deleteTicketSeats(ticketId);

      // 3. Delete the ticket from the Ticket table
      const result = await concertDao.deleteTicket(ticketId, userId);

      // Commit the transactio
      await new Promise((resolve, reject) => {
          db.run('COMMIT;', (err) => {
              if (err) reject(err); // Commit transaction
              else resolve();
          });
      });

      res.status(200).json({ message: 'Ticket and associated seats successfully deleted.', changes: result });
  } catch (error) {
      // Rollback the transaction in case of an error
      await new Promise((resolve, reject) => {
          db.run('ROLLBACK;', (err) => {
              if (err) reject(err);// Rollback transaction
              else resolve();
          });
      });
      res.status(500).json({ error: 'Transaction failed.', details: error });
  }
});

// /*** Users APIs ***/

// Login endpoint that uses Passport to authenticate users
app.post('/api/sessions', function (req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err)
      return next(err);
    if (!user) {
      return res.status(401).json({ error: info });
    }
    req.login(user, (err) => {
      if (err)
        return next(err);
      return res.json(req.user);
    });
  })(req, res, next);
});

// Logout endpoint that ends the user's session
app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => {
    res.status(200).json({});
  });
});

// Endpoint to get a new JWT token for the authenticated user
app.get('/api/auth-token', isLoggedIn, (req, res) => {
  const role = req.user.role;
  const payloadToSign = { role: role };
  const jwtToken = jsonwebtoken.sign(payloadToSign, jwtSecret, { expiresIn: expireTime });
  res.json({ token: jwtToken });
});



// Activating the server
const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}/`));