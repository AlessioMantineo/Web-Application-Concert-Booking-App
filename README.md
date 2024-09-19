# Web-Application-Concert-Booking-App
# Exam #3: "Concert Seats"
## Student: s324267 MANTINEO ALESSIO 

## React Client Application Routes
- Route `/`: Home page shows the list of all upcoming concerts. Selecting one of them redirects the user to the route ('/concert/:concertId'). Logged-in users can also see their list of tickets (reservations). The owner can delete their tickets using the *Trash Button*.
  
- Route `/concert/:concertId`: Concert Information, the concert title, date , total seats, avalaible seats and occupied seats; seats information is provided both numerically and through a 2D visualization. Logged-in users can manually select the seats they want to book. They can also see the number of selected seats and use the *Cancel Selection/Reservation* Button to unselect all previously selected seats. By clicking the *Confirm Selection/Reservation Button*, users can attempt to book the selected seats. Logged-in users also have the option to switch to a random booking mode by clicking the *Random Book Button*. After switching, a form will appear allowing them to specify the number of desired seats. The *Back to 2D selection Button* will re-activate the manual seat selection mode.
Clicking the *Back To List of Concert Button* redirects the user to the main route ('/').

- Route `/login`: Login form, allows users to login. After a successful login, the user is redirected to the main route ('/').
  
- Route `*`: Page for nonexisting URLs (_Not Found_ page) that redirects to the home page.
## API Server

- GET `/api/concerts`: Get all the concerts as a JSON list
  - **response body**: JSON list of concerts:
  ```json
  [
    {
      "concert_id":6,
      "title":"Warning and error noise",
      "date":"2024-12-15",
      "theatre_id":3
    },
    {
      "concert_id":5,
      "title":"Noise of classroom chairs",
      "date":"2024-12-03",
      "theatre_id":3
    },
    {
      "concert_id":4,
      "title":"No Music Just silence",
      "date":"2024-11-18",
      "theatre_id":2
    },
    {
      "concert_id":3,
      "title":"30 Cum Laude sensation",
      "date":"2024-11-05",
      "theatre_id":2
    },
    {
      "concert_id":2,
      "title":"SuperMario Bros Songs",
      "date":"2024-10-28",
      "theatre_id":1
    },
    {
      "concert_id":1,
      "title":"JS Concert the sound of coding",
      "date":"2024-10-15",
      "theatre_id":1
    }
  ]
  ```
  - Codes: `200 OK`, `500 Internal Server Error`.

- GET `/api/concerts/:id`: Get all the information of a concert specified by *id*.
  - **response body**: JSON object of the concert specified by *id*:
   ```json
  {
    "concert_id": 2,
    "title": "SuperMario Bros Songs",
    "date": "2024-10-28",
    "theatre_id": 1
  }
  ```
  - Codes: `200 OK`, `500 Error fetching concert details.`, `422 Unprocessable Content`.
  
- GET `/api/concert/:id/seats`: Retrieves seats for a specific concert, including the total seats, available seats, and occupied seats.
  - **response body**: JSON object containing an array of seat objects and counts of total, available, and occupied seats.
  ```json
    {
    "seats": [
      [
        {
          "seat_id": 33,
          "row": 1,
          "position": "A",
          "status": "available"
        },
        {
          "seat_id": 34,
          "row": 1,
          "position": "B",
          "status": "available"
        },
       ...ALL THE OTHER
      ],
      [
        {
          "seat_id": 41,
          "row": 2,
          "position": "A",
          "status": "available"
        },
        {
          "seat_id": 42,
          "row": 2,
          "position": "B",
          "status": "available"
        },
      ...ALL THE OTHER
    ],
    "totalSeats": 32,
    "availableSeats": 30,
    "occupiedSeats": 2
  }
    ```
  - Codes: `200 OK`, `404 Error retrieving seats`, `500 Internal Server Error`, `422 Unprocessable Content`.

- GET `/api/ticketseat/:id/reservation`: List of all the ticket associated to a specific user.
  - **response body** JSON array of tickets of the specified user.
  ```json
    [
      {
        "ticket_id": 21,
        "concert_name": "30 Cum Laude sensation",
        "seat_count": 4
      },
      {
        "ticket_id": 28,
        "concert_name": "SuperMario Bros Songs",
        "seat_count": 2
      },
      {
        "ticket_id": 120,
        "concert_name": "JS Concert the sound of coding",
        "seat_count": 2
      }
    ]
    ```
  
  - Codes: `200 OK`, `500 Internal Server Error`,  `403 Unauthorized: You can only view your own reservations`, `422 Unprocessable Content`.

- POST `/api/concert/:id/reserve`: Reserves seats for a concert.
  - **request headers**: JWT token.
  - **request body**: JSON object containing an array of seats to be reserved (array of seat IDs).
  ```json
  {
  "seats": [
    {
      "seat_id": 20,
      "row": 3,
      "position": "D",
      "status": "pending"
    },
    {
      "seat_id": 28,
      "row": 4,
      "position": "D",
      "status": "pending"
    }
  ]
  }

  ```
  - **response body**: JSON object containing a message confirming successful reservation and the ticketId (or errors).
   ```json
  {
  "message": "Seats successfully reserved",
  "ticketId": 121
  }

  ```
  - Codes: `200 OK`, `409 Some seats are already occupied`, `500 Internal Server Error`, `422 Unprocessable Content` ,`403 You already have a reservation for this concert`.

- GET `/api/concert/:id/check-reservation`: Checks if a user has an existing reservation for a concert.

  - **response body**: JSON object with a reservation boolean.
  ```json
  {
    "reservation": false
  }
  ```
  - Codes: `200 OK`, `500 Internal Server Error`, `422 Unprocessable Content`.

- POST `/api/concert/:id/random-reserve`: Randomly reserves seats for a concert.
  - **request headers**: JWT token.
  - **request body**: JSON object containing the number of seats to be reserved.
  ```json
    {
      "numSeats": 10
    }
   ```
  - **response body**: JSON object containing a success message, the ticketId, and an array of the randomly selected seats.
  ```json
    {
    "message": "Seats successfully reserved",
    "ticketId": 122,
    "selectedSeats": [
      {
        "seat_id": 2,
        "row": 1,
        "position": "B",
        "status": "available"
      },
      {
        "seat_id": 6,
        "row": 1,
        "position": "F",
        "status": "available"
      },
      {
        "seat_id": 24,
        "row": 3,
        "position": "H",
        "status": "available"
      },
      {
        "seat_id": 9,
        "row": 2,
        "position": "A",
        "status": "available"
      },
      {
        "seat_id": 21,
        "row": 3,
        "position": "E",
        "status": "available"
      },
      {
        "seat_id": 27,
        "row": 4,
        "position": "C",
        "status": "available"
      },
      {
        "seat_id": 28,
        "row": 4,
        "position": "D",
        "status": "available"
      },
      {
        "seat_id": 12,
        "row": 2,
        "position": "D",
        "status": "available"
      },
      {
        "seat_id": 20,
        "row": 3,
        "position": "D",
        "status": "available"
      },
      {
        "seat_id": 25,
        "row": 4,
        "position": "A",
        "status": "available"
      }
    ]
    }
  ```
  - Codes: `200 OK`, `400 Not enough available seats`, `500 Internal Server Error`, `422 Unprocessable Content`,`403 You already have a reservation for this concert`.
  
- DELETE `/api/ticket/:id/delete`: Deletes a ticket and its associated seats. (The request is only authorized if the authenticated user owns the ticket).
  - **request headers**: JWT token.
  - **response body**: JSON object with a success message and the number of changes made.
  ```json
    {
      "message": "Ticket and associated seats successfully deleted.",
      "changes": 1
    }
    ```
  - Codes: `200 Ticket and associated seats successfully deleted`, `403 Unauthorized: You do not own this ticket or it does not exist!`, `500 Transaction failed`, `422 Unprocessable Content`.

- POST `/api/sessions`: Authenticate and login the user.
   - **request body**: JSON object with *username* and *password*:
    ```json
        {
        "username": "supermario",
        "password": "pass"
      }
    ```
    - **response body**: JSON object with the user's info.
    ```json
      {
        "user_id": 1,
        "username": "supermario",
        "role": "loyal"
      }
     ```
   - Codes: `200 OK`, `401 Unauthorized` (incorrect email or password)
   
- DELETE `/api/session`: Logout the user.
    - Codes: `200 OK`, `401 Unauthorized`

- GET `/api/auth-token`: generation of the signed token
    - **response body**: JWT token 
      ```json
        { 
          "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoibG95YWwiLCJpYXQiOjE3MjUyOTI4NTksImV4cCI6MTcyNTI5MjkxOX0.Ih0pJwJSWLuEgB-6-tlki6tgkCERagBnKFBFf-I9pgs"
        }
      ```
    - Codes: `200 OK`

## API Server2

- POST `/api/calculate-discount`: Calculate and return the discount based on the user's role and the sum of the row numbers of selected seats.
  - **request headers**: JWT token required for authentication.
  - **request body**: JSON object containing the sum of row numbers (rowSum).

   ```json 
      {
        "rowSum": 2
      }
   ```
- **response body**:  JSON object containing the calculated discount.
    ```json 
     {
        "discount": 16
      }
    ```
- Codes: `200 OK`, `401 Unauthorized`, `400 Bad Request` (invalid request body).

  
## Database Tables

### Table Role: 
- **id**: Integer (Primary Key, Autoincrement)
- **name**: Text (Not Null)

### Table User:
- **user_id**: Integer (Primary Key, Autoincrement)
- **username**: Text (Not Null, Unique)
- **salt**: Text (Not Null)
- **password**: Text (Not Null)
- **role**: Integer (Not Null, Foreign Key references Role(id))

### Table Theatre:
- **theatre_id**: Integer (Primary Key, Autoincrement)
- **name**: Text (Not Null)
- **columns** Integer (Not Null)
- **rows** Integer (Not Null)
- **size** Integer (Not Null)

### Table Concert:
- **concert_id**: Integer (Primary Key, Autoincrement)
- **title**: Text (Not Null)
- **date**: Text (Not Null)
- **theatre_id**: Integer (Not Null, Foreign Key references Theatre(theatre_id))

### Table Seat:
- **seat_id**: Integer (Primary Key, Autoincrement)
- **row**: Integer (Not Null)
- **position**: Text (Not Null)
- **concert_id**: Integer (Not Null, Foreign Key Concert(concert_id))
- **status**: Text (Not Null)

### Table Ticket:
- **ticket_id**: Integer (Primary Key, Autoincrement)
- **concert_id**: Integer (Not Null, Foreign Key Concert(concert_id))
- **user_id**: Integer (Not Null, Foreign Key User(user_id))

### Table TicketSeat:
- **ticket_seat_id**: Integer (Primary Key, Autoincrement)
- **ticket_id**: Integer (Not Null, Foreign Key Ticket(ticket_id))
- **seat_id**: Integer (Not Null, Foreign Key Seat(seat_id))


## Main React Components

- `LoginForm` (in `Auth.js`): Login form that users can use to log in into the app
  
- `ConcertTable` in (`Concert.js`): Displays a list of all available concerts in a table format.
  
- `ConcertRow` in (`Concert.js`): Represents a single row within the ConcertTable, displaying the title and date of a concert. It includes a button that navigates to the booking page for that concert.
  
- `TicketTable` (in `Concert.js`): Displays a list of all the tickets a user has reserved.
  
- `TicketRow` in (`Concert.js`): Represents a single row within the TicketTable, displaying the details of a reserved ticket. It includes reservation ID, concert name, number of seats, and an option to delete the reservation.
  
- `BookLayout` in (`BookLayout.js`): The main layout component for booking concert seats. This component handles fetching and displaying concert details, seat availability, and user reservations. It includes functions for seat selection, seat reservation, random seat booking, and applying discounts.
  
- `SeatVisualization` in (`BookLayout.js`): Renders the seat visualization grid, displaying each seat with its status (available, occupied, pending, etc.). It handles the user's interactions for selecting or deselecting seats.
  
- `SeatSelection` in (`BookLayout.js`): Provides the user interface for confirming seat selections, canceling reservations, and booking random seats. This component appears when a user is logged.


## Screenshot

![Screenshot](./img/Login-Form.png)
![Screenshot](./img/home-page-not-auth.png)
![Screenshot](./img/home-page-auth.png)
![Screenshot](./img/concert-info-not-auth.png)
![Screenshot](./img/concert-info-auth.png)
![Screenshot](./img/concert-info-random-booking-auth.png)
![Screenshot](./img/concert-info-discount-reservation_made-auth.png)

## Users Credentials

| username | password | role |
|------------|------|--------|
| supermario | pass | loyal      
| luigi      | pass | loyal
| wario      | pass | normal
| toad       | pass | normal

