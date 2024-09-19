import dayjs from 'dayjs';

const SERVER_URL = 'http://localhost:3001/api';

const DISCOUNT_SERVER_URL = 'http://localhost:3002/api/';


/**
 * A utility function for parsing the HTTP response.
 * This function processes the server's HTTP response and handles errors if the response is not in the expected format.
 */

function getJson(httpResponsePromise) {
    // server API always return JSON, in case of error the format is the following { error: <message> } 
    return new Promise((resolve, reject) => {
        httpResponsePromise
            .then((response) => {
                if (response.ok) {

                    // the server always returns a JSON, even empty {}. Never null or non json, otherwise the method will fail
                    response.json()
                        .then(json => resolve(json))
                        .catch(err => reject({ error: "Cannot parse server response" }))

                } else {
                    // analyzing the cause of error
                    response.json()
                        .then(obj =>
                            reject(obj)
                        ) // error msg in the response body
                        .catch(err => reject({ error: "Cannot parse server response" })) // something else
                }
            })
            .catch(err =>
                reject({ error: "Cannot communicate" })
            )
    });
}


/**
 * Fetches a list of concerts from the server.
 * Converts the response to an array of concert objects, using `dayjs` to parse dates.
 */
const getConcerts = async () => {
    return getJson(
        fetch(`${SERVER_URL}/concerts`)
    ).then(json => {
        return json.map((concert) => {
            const concerts = {
                concert_id: concert.concert_id,
                title: concert.title,
                date: dayjs(concert.date),
                theatre_id: concert.theatre_id
            }
            return concerts;
        })
    })
}

/**
 * Fetches details of a specific concert by its ID.
 * Converts the response to a concert object with the date parsed using `dayjs`.
 */
const getConcertById = async (concertId) => {
    return getJson(
        fetch(`${SERVER_URL}/concerts/${concertId}`)
    ).then(json => {
        return {
            concert_id: json.concert_id,
            title: json.title,
            date: dayjs(json.date),
            theatre_id: json.theatre_id
        };
    });
}

/**
 * Fetches the seats associated with a specific concert.
 * Returns the seats in a structured format.
 */
const getConcertSeats= async (concertId) => {
    const response = await fetch(`${SERVER_URL}/concert/${concertId}/seats`);
    if (!response.ok) {
      throw new Error('Failed to fetch seats');
    }
    return await response.json();
  }

/**
 * Reserves seats for a specific concert.
 * Sends a POST request with seat information to reserve them.
 */
const reserveSeats = async (concertId, seats) => {
  return getJson(
    fetch(`${SERVER_URL}/concert/${concertId}/reserve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ seats }),
    })
  );
};



/**
 * Fetches all tickets associated with a specific user, along with the count of reserved seats for each ticket.
 */
const listTicketsReservation = async (user_id) => {
    return getJson(fetch(`${SERVER_URL}/ticketseat/${user_id}/reservation`, { credentials: 'include' })
    ).then(json => { 
        return json.map((ticket) => {
            const clientTicket  = {
                ticket_id: ticket.ticket_id,  // Ticket ID
                concert_name: ticket.concert_name,  // Concert name associated with the ticket
                seat_count: ticket.seat_count  // Number of seats reserved for the ticke
            }
            return clientTicket ;
        })
    });
}


/**
 * Deletes a ticket and its associated seats from the database.
 * Sends a DELETE request to remove the ticket and seats.
 */
function deleteTicketAndSeats(ticketId) {
    return getJson(
      fetch(`${SERVER_URL}/ticket/${ticketId}/delete`, {
        method: 'DELETE',
        credentials: 'include'
      })
    )
  }

/**
 * Checks if the user has an existing reservation for a specific concert.
 * Returns true if a reservation exists, false otherwise.
 */
  const checkReservation = async (concertId) => {
    return getJson(
        fetch(`${SERVER_URL}/concert/${concertId}/check-reservation`, { credentials: 'include' })
    );
};

/**
 * Fetches a discount based on the user's role and the sum of seat rows.
 * Sends a POST request to a separate discount service.
 */
const getDiscount = async (authToken, rowSum) => {
    return getJson(
      fetch(DISCOUNT_SERVER_URL + 'calculate-discount', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rowSum}),
      })
    );
  };

  /**
 * Randomly reserves a specified number of seats for a concert.
 * Sends a POST request with the number of seats to reserve.
 */
  const randomReserveSeats = async (concertId, numSeats) => {
    return getJson(
      fetch(`${SERVER_URL}/concert/${concertId}/random-reserve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ numSeats }),
      })
    );
  };

  /**
 * Logs in the user by sending their credentials to the server.
 * Returns the authenticated user information.
 */

const logIn = async (credentials) => {
    return getJson(fetch(`${SERVER_URL}/sessions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',  // this parameter specifies that authentication cookie must be forwared
        body: JSON.stringify(credentials),
    })
    )
};

/**
 * Logs out the user by ending their session.
 * Sends a DELETE request to remove the session.
 */
const logOut = async () => {
    return getJson(fetch(`${SERVER_URL}/sessions/current`, {
        method: 'DELETE',
        credentials: 'include'
    })
    )
}

/**
 * Fetches a new JWT authentication token for the authenticated user.
 */
const getAuthToken = async () => {
    return getJson(fetch(`${SERVER_URL}/auth-token`, {
        credentials: 'include'
    })
    )
}


/**
 * Exports all the API functions as a single object.
 */
const API = { 
    getConcerts, 
    deleteTicketAndSeats, 
    logIn, 
    logOut,  
    getAuthToken, 
    listTicketsReservation, 
    getConcertById, 
    getConcertSeats, 
    reserveSeats, 
    checkReservation,
    getDiscount,
    randomReserveSeats
};
export default API;