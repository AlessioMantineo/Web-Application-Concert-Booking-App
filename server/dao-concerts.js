'use strict';

const db = require('./db');
const dayjs = require("dayjs");

// Converts a database record into a concert object.
// This utility function transforms a record from the database into a more structured JavaScript object.
const convertConcertFromDbRecord = (dbRecord) => {
    const concert = {};
    concert.concert_id = dbRecord.concert_id;
    concert.title = dbRecord.title;
    concert.date = dbRecord.date;
    concert.theatre_id = dbRecord.theatre_id;
    return concert;
}


// Retrieves the list of all concerts.
// This function queries the database for all concerts, converts the records into concert objects, sorts them by date, and returns them.
exports.listConcerts = () => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM Concert';
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            }
            const concerts = rows.map((row) => {
                const concert = convertConcertFromDbRecord(row);
                return concert;
            });
            // sorting by the most recent concert
            concerts.sort((a, b) => (dayjs(a.date).isAfter(dayjs(b.date))) ? -1 : 1);
            resolve(concerts);
        });
    });
};

// Retrieves a specific concert by its ID.
// This function takes a concert ID as an input, queries the database for that concert, and returns the concert object.
exports.getConcertById = (id) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM Concert WHERE concert_id = ?';
        db.get(sql, [id], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(convertConcertFromDbRecord(row));
            }
        });
    });
};




// Retrieves all reservations for a specific user.
// This function queries the database to get all the reservations associated with a user, including the concert name and the number of seats reserved.

exports.getTicketSeatReservation = (id, loggedIn) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT t.ticket_id, c.title AS concert_name, COUNT(ts.ticket_seat_id) AS seat_count FROM Ticket t LEFT JOIN TicketSeat ts ON t.ticket_id = ts.ticket_id LEFT JOIN Concert c ON t.concert_id = c.concert_id WHERE t.user_id = ? GROUP BY t.ticket_id, c.title;';
        db.all(sql, [id], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            if (rows === undefined) {
                reject('Ticket not found');
                return;
            }
            const tickets = rows.map(row => ({
                ticket_id: row.ticket_id,
                concert_name: row.concert_name,
                seat_count: row.seat_count
              }));
            resolve(tickets);
        });
    });
};



// Updates the status of seats associated with a specific ticket.
// This function changes the status of all seats linked to a given ticket to the provided new status.
exports.updateSeatsStatus = function(ticketId, newStatus) {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE Seat SET status = ? WHERE seat_id IN (SELECT seat_id FROM TicketSeat WHERE ticket_id = ?);';
        db.run(sql, [newStatus, ticketId], function(err) {
            if (err) {
                reject(err);// Rejects the promise if an error occurs during the update
            } else {
                resolve(this.changes);// Resolves with the number of rows affected by the update
            }
        });
    });
}; 

// Deletes all seat assignments for a specific ticket.
// This function removes all records from the TicketSeat table associated with the provided ticket ID.
exports.deleteTicketSeats = function(ticketId) {
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM TicketSeat WHERE ticket_id = ?;';
        db.run(sql, [ticketId], function(err) {
            if (err) {
                reject(err); // Rejects the promise if an error occurs during deletion
            } else {
                resolve(this.changes); // Resolves with the number of rows affected by the deletion
            }
        });
    });
};

// Deletes a ticket from the database.
// This function removes the ticket record from the Ticket table based on the provided ticket ID.
exports.deleteTicket = function(ticketId, userId) {
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM Ticket WHERE ticket_id = ? AND user_id = ?;';
        db.run(sql, [ticketId, userId], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
};
  
// Retrieves the owner of a ticket.
// This function returns the user ID of the owner of the specified ticket.
exports.getTicketOwner=(ticketId)=> {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT user_id FROM Ticket WHERE ticket_id = ?;';
      db.get(sql, [ticketId], (err, row) => {
        if (err) {
          reject(err); // Rejects the promise if an error occurs during the query
        } else if (row) {
          resolve(row.user_id);  // Resolves with the user ID if the ticket is found
        } else {
          resolve(null); // Resolves with null if the ticket is not found
        }
      });
    });
  }


/**
 * Retrieves the seating arrangement for a specific concert.
 * 
 * This function queries the database to get a list of all seats associated with a given concert.
 * The seats are organized by row and position, and each seat's status is included (e.g., 'available', 'occupied').
 * The result is a structured 2D array where each sub-array represents a row of seats.
 * Additionally, the total number of seats, available seats, and occupied seats are calculated.
 * 
 * @param {number} concert_id - The ID of the concert for which to retrieve the seating data.
 * @returns {Promise<Object>} - A promise that resolves to an object containing:
 *  - seats: A 2D array of seat objects, where each object contains the seat_id, row, position, and status.
 *  - totalSeats: The total number of seats for the concert.
 *  - availableSeats: The number of available seats.
 *  - occupiedSeats: The number of occupied seats.
 */
  exports.getSeatsByConcertId = (concert_id) => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT s.seat_id, s.row, s.position, s.status
                   FROM Seat s
                   JOIN Concert c ON s.concert_id = c.concert_id
                   WHERE s.concert_id = ?
                   ORDER BY s.row, s.position`;
  
      db.all(sql, [concert_id], (err, rows) => {
        if (err) {
          reject(err); // Rejects the promise if an error occurs during the query
          return;
        }
        // Calculate seat counts
        const totalSeats = rows.length;
        const availableSeats = rows.filter(seat => seat.status === 'available').length;
        const occupiedSeats = totalSeats - availableSeats;
        // Organize the seats into rows
      const seats = [];// Initialize an empty array to store rows of seats
      rows.forEach((seat) => {// Iterate over each seat returned from the database
        const rowIndex = seat.row - 1; // Determine the row index by subtracting 1 from the seat's row number (to make the array zero-indexed)
        if (!seats[rowIndex]) {// If this row doesn't already exist in the 'seats' array, create an empty array for the row
          seats[rowIndex] = [];
        }
        seats[rowIndex].push({// Add the current seat's details (seat_id, row, position, status) to the corresponding row in the 'seats' array
          seat_id: seat.seat_id, 
          row: seat.row,
          position: seat.position,
          status: seat.status
        });
      });

    
            // Return the seat data along with the counts
            resolve({ seats, totalSeats, availableSeats, occupiedSeats });
    });
  });
};




// Function to check if all seats are available
// This function checks the availability of a list of seats and returns their current status.
exports.checkSeatsAvailability = async (seatIds) => {
    const placeholders = seatIds.map(() => '?').join(',');
    //const checkSql = `SELECT seat_id  FROM Seat WHERE seat_id IN (${placeholders}) AND status = 'available'`;
    const checkSql = `SELECT seat_id, status FROM Seat WHERE seat_id IN (${placeholders})`;
  
    return new Promise((resolve, reject) => {
      db.all(checkSql, seatIds, (err, rows) => {
        if (err) {
            return reject(new Error('Error checking seat availability: ' + err.message));
        } else {
            /*
            const occupiedSeats = rows.filter(row => row.status !== 'available').map(row => row.seat_id);
            if (occupiedSeats.length > 0) {
                reject({ occupiedSeats });
            } else {
                resolve(rows);
            }
            */
            resolve(rows); // Resolves with the status of the seats
        }
    });
});
};

// Function to update seat status to 'occupied'
// This function updates the status of a list of seats to a specified status.
exports.updateSeatStatus = async (seatIds, status) => {
    const placeholders = seatIds.map(() => '?').join(','); // Generates '?, ?, ?, ?'
    /*
    seatIds.map(() => '?'): This creates an array with a ? 
    for each seat ID. If seatIds has 4 elements, this part returns ['?', '?', '?', '?'].
    */
    const updateSql = `UPDATE Seat SET status = ? WHERE seat_id IN (${placeholders})`;
  
    return new Promise((resolve, reject) => {
      db.run(updateSql, [status, ...seatIds], function (err) {
        if (err) {
          reject(new Error('Error updating seat status: ' + err.message));
        } else {
          resolve(this.changes); // Resolves with the number of rows affected by the update
        }
      });
    });
  };

// Function to insert a new ticket
// This function inserts a new ticket into the database and returns the ID of the inserted ticket.
  exports.insertTicket = async (concertId, userId) => {
    const insertTicketSql = `INSERT INTO Ticket (concert_id, user_id) VALUES (?, ?)`;
  
    return new Promise((resolve, reject) => {
      db.run(insertTicketSql, [concertId, userId], function (err) {
        if (err) {
          reject(new Error('Error inserting ticket: ' + err.message));
        } else {
          resolve(this.lastID); // Resolves with the ID of the inserted ticket
        }
      });
    });
  };

// Function to insert seats into the TicketSeat table
// This function associates a list of seats with a ticket in the TicketSeat table.
exports.insertTicketSeats = async (ticketId, seatIds) => {
    const insertTicketSeatSql = `INSERT INTO TicketSeat (ticket_id, seat_id) VALUES (?, ?)`;
  
    for (let seatId of seatIds) {
      await new Promise((resolve, reject) => {
        db.run(insertTicketSeatSql, [ticketId, seatId], (err) => {
          if (err) {
            reject(new Error('Error inserting ticket seats: ' + err.message));
          } else {
            resolve(); // Resolves when the seat is successfully associated with the ticket
          }
        });
      });
    }
  };

  // Function to check if a user has an existing reservation for a concert
// This function checks if a user has already made a reservation for a specific concert.
exports.checkExistingReservation = (userId, concertId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT COUNT(*) as count 
            FROM Ticket 
            WHERE user_id = ? AND concert_id = ?
        `;
        db.get(sql, [userId, concertId], (err, row) => {
            if (err) {
                reject(err); // Rejects the promise if an error occurs during the query
            } else {
                resolve(row.count > 0); // Resolves with true if a reservation exists, false otherwise
            }
        });
    });
};