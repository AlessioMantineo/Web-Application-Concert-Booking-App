import React, { useEffect, useState, useContext } from 'react';
import { useParams,  useNavigate  } from 'react-router-dom';
import { Row, Col, Button, Alert, Container, Form  } from 'react-bootstrap';
import { RiLoader4Line } from 'react-icons/ri';
import AuthContext from '../AuthContext.js';
import API from '../API.js';

// Component responsible for seat selection and reservation actions
function SeatSelection(props){
  const { showForm } = props;
  const { handleConfirmSelection } = props;
  const { handleCancel  } = props;
  const { setShowForm } = props;
  const { numSeats } = props;
  const {setNumSeats} =props;
  const { handleBookRandomSeats } = props;
  const {setPendingSeatsCount} = props;
  
  const { loggedIn} = useContext(AuthContext);
  return(
    <>
        {/* If user is logged in and form is not displayed, show the cancel and confirm buttons */}
        {loggedIn && !showForm && (
        <div className="mt-3 mb-5 d-flex justify-content-between">
          <Button variant="warning" className="ms-2 btn-lg" onClick={handleCancel}>
            Cancel Selection/Reservation
            <i className="bi bi-x-circle mx-2"></i>
          </Button>
          <Button variant="success" className="ms-2 btn-lg" onClick={handleConfirmSelection}>
            Confirm Selection/Reservation
            <i className="bi bi-check-circle mx-2"></i>
          </Button>
        </div>
      )}
      {/* If user is logged in and form is not displayed, show the cancel and confirm buttons */}
      {loggedIn && (
      <div className="d-flex justify-content-center align-items-center mb-5">
        {!showForm ? (
          <>
            <Button className="mx-auto" variant="primary btn-lg" onClick={() => { handleCancel(); setShowForm(true); setPendingSeatsCount(0);}}>
              Random Book
            </Button>
          </>
        ) : (
          <>
            <Form className="mb-5" onSubmit={handleBookRandomSeats}>
              <Form.Group className="mb-3">
                <Form.Label>Number of Seats to Book</Form.Label>
                <Form.Control
                  type="number"
                  value={numSeats || ""}
                  onChange={(e) => {
                    // Check if the input is empty, if so set the state to an empty string
                    if (e.target.value === "") {
                      setNumSeats("");
                    } else {
                      // Otherwise, parse it as a number
                      setNumSeats(parseInt(e.target.value, 10));
                    }
                  }}
                  min="1" //it is also on server side this is just an additional check on client side, all the control are on server
                />
              </Form.Group>
            </Form>
            <Button className="mx-5" variant="secondary btn-lg" onClick={() => setShowForm(false)}>
              BACK TO 2D SELECTION <i className="bi bi-hand-index"></i>
            </Button>
          </>
        )}
      </div>
      )}
    </>
  );
}

// Component responsible for rendering the seat visualization grid and handling seat clicks
function SeatVisualization(props){

  const { row } = props;
  const { rowIndex } = props;
  const { handleSeatClick, disableSeats } = props;


  const { loggedIn} = useContext(AuthContext);
 
  return(
    <Row key={rowIndex} className="mb-3">
    {row.map((seat, seatIndex) => (
    <Col key={seatIndex} className="text-center">
      <div className="seat-info">
      <div className="position-text">{`${seat.row}${seat.position}`}</div>
        {/* Render buttons based on seat status and whether the user is logged in */}
        {loggedIn ? ( 
          <Button 
          variant={
            seat.status === 'occupied_by_others'
              ? 'primary' // Blue color for occupied by others
              : seat.status === 'pending'
              ? 'warning'
              : seat.status === 'occupied'
              ? 'danger' // Temporarily change 'occupied' seats to appear as 'available'
              : 'success'
          }
            disabled={disableSeats || seat.status === 'occupied'|| seat.status === 'occupied_by_others'} // Disable the button if the seat is occupied
            onClick={() => handleSeatClick(rowIndex, seatIndex)} // Handle the click
            >
            <i 
              className={'bi bi-app'} 
              title={`Row ${seat.row}, Seat ${seat.position}`}
            ></i>
          </Button>
        ):
        (
          <Button 
          variant={
            seat.status === 'occupied' 
              ? 'danger'  
              : 'success'
          }
          disabled // Disable the button 
          >
          <i 
            className={'bi bi-app'} 
            title={`Row ${seat.row}, Seat ${seat.position}`}
          ></i>
        </Button>
        )}
      </div>
    </Col>
    ))}
    </Row>
  );
}

// Main layout component for booking concert seats
function BookLayout(props) {
  const { concertId } = useParams(); // get ID concert from URL
  const [concert, setConcert] = useState(null); // State to store concert details.
  
  const [seats, setSeats] = useState([]);// State to store the array of seats for the concert.
  const [discount, setDiscount] = useState(null);// State to store the discount for the user.

   // State to store counts of total seats, available seats, and occupied seats.
  const [seatCounts, setSeatCounts] = useState({ totalSeats: 0, availableSeats: 0, occupiedSeats: 0 });
  const [numSeats, setNumSeats] = useState(0); // State to store the number of seats the user wants to book.
  const { handleErrors } = props;// Function passed from parent to handle errors.
  const {setMessage} = props;// Function to update the message state.
  const {authToken} =props;// Auth token used for authenticated API calls.
  const {renewToken}=props;// Function to renew the authentication token.
  const {dirty}=props; // State to indicate if the seat data needs to be re-fetched from the server.
  const {setDirty}=props; // State to indicate if the seat data needs to be re-fetched from the server.

  const [hasReservation, setHasReservation] = useState(false);// State to check if the user already has a reservation for this concert.
  const [showForm, setShowForm] = useState(false);  // State to toggle between showing the seat selection form and the random booking button.
  const [pendingSeatsCount, setPendingSeatsCount] = useState(0); // State to count the number of seats currently selected (pending).

  const navigate = useNavigate();// Hook to navigate between routes in the app

  const { loggedIn, user } = useContext(AuthContext);// Access the loggedIn state from AuthContext to check if the user is authenticated.


  // Fetch concert details by ID when the component mounts or when the concert ID changes
  useEffect(() => {
    API.getConcertById(concertId)
      .then(concert => setConcert(concert))// Set the concert details into the state.
      .catch(err => handleErrors(err));// Handle any errors during the API call.
  }, [concertId]);// Dependency array includes concertId  to re-run the effect if it change.

// Check if the user has an existing reservation for this concert whenever the user logs in or the concert ID changes.
useEffect(() => {
  if (loggedIn) {
      API.checkReservation(concertId)
          .then(response => setHasReservation(response.reservation))// Set the hasReservation state based on API response.
          .catch(err => {handleErrors(err)});
  }
}, [concertId, loggedIn, hasReservation]);// Dependency array ensures the effect runs when concertId, loggedIn, hasReservation, or handleErrors change.



// Fetch the seat data and update seat counts whenever the component mounts or when the 'dirty' state changes.

useEffect(() => {
  
    API.getConcertSeats(concertId)
      .then((data) => {
      setSeats(data.seats); // Update the seats state with the fetched data.
      setSeatCounts({// Update the seatCounts state with the fetched data.
        totalSeats: data.totalSeats,
        availableSeats: data.availableSeats,
        occupiedSeats: data.occupiedSeats,
      });
      setPendingSeatsCount(0); // Reset the pending seats count to zero after fetching the data.
      setDirty(false);// Reset the dirty state as the data has been fetched.
      
    })
    .catch((err) => setErrorMsg(`Error : ${err.message}`));
 

}, [concertId, dirty]); // Dependency array includes concertId and dirty to re-run the effect when they change.


  // Handle seat click for selection/deselection
  const handleSeatClick = (rowIndex, seatIndex) => {
    setSeats(prevSeats => {
      // Step 1: Create a deep copy of the seats array to ensure React detects state changes.
      /**A deep copy  creating a new copy of  array where 
       * all nested  arrays are also copied. 
       * any changes to the new copy will 
       * not affect the original object, and vice versa. 
       * */
      const newSeats = prevSeats.map(row => row.map(seat => ({ ...seat })));
      // Step 2: Get the current status of the clicked seat.
      const currentStatus = newSeats[rowIndex][seatIndex].status;

      // Step 3: Update the status based on its current value:
      // - If it's 'available', change it to 'pending' (yellow/warning).
      if (currentStatus === 'available' ) {
        newSeats[rowIndex][seatIndex].status = 'pending';
      // - If it's 'pending', change it back to 'available' (green/success).
      } else if (currentStatus === 'pending') {
        newSeats[rowIndex][seatIndex].status = 'available';
      }
      
     
      // Step 4: Return the updated seats array, triggering a re-render.
      return newSeats;
    });
     // Step 5: Recalculate the pending seats count based on the updated seats array.
     setSeats((updatedSeats) => {
      // Flatten the updated seats array and count how many seats are marked as 'pending'
      const newPendingSeatsCount = updatedSeats.flat().filter((seat) => seat.status === 'pending').length;
      setPendingSeatsCount(newPendingSeatsCount); // Update the state to reflect the number of seats currently pending selection.
  
      return updatedSeats; // Return the updated seats to maintain the correct state
    });
  };

  // Handle the Cancel button click to reset all pending seats to available
  const handleCancel = () => {
    setSeats(prevSeats => {
      // Deep copy: Create a new array with new objects for each seat
      const newSeats = prevSeats.map(row => row.map(seat => ({ ...seat })));

      // Reset all pending seats to available
      newSeats.forEach(row => {
        row.forEach(seat => {
          if (seat.status === 'pending') {
            seat.status = 'available';
          }
        });
      });
      setPendingSeatsCount(0);
      // Return the updated seats array
      return newSeats;
    });
  };

  // Function to handle the booking of random seats
const handleBookRandomSeats = async (event) => {
  event.preventDefault();

  try {
    // Check if the user already has a reservation for this concert
    const reservationResponse = await API.checkReservation(concertId);
    if (reservationResponse.reservation) {
      // If a reservation already exists, set an error message and prevent booking
      setMessage('You already have a reservation for this concert.');
      return;
    }
    const response = await API.randomReserveSeats(concertId, numSeats);
    if (response.message) {
      setHasReservation(true);
      setDirty(true)
      setMessage(`Successfully reserved ${numSeats} seats.`);
      
     
      // Calculate the sum of the rows of the selected seats
      const rowSum = response.selectedSeats.reduce((sum, seat) => sum + seat.row, 0);

      // retrieve the discount based on rowSum and userRole
      //const userRole = user.role;
      await loadDiscount(authToken, rowSum);
    }
  } catch (err) {
    if (err && err.error) {
    // If the caught error is an object with an 'error' field, it means the server 
    // returned a JSON response with an 'error' key (e.g., { error: 'Not enough available seats.' }).
    // We check if `err.error` exists and display its value in the message.
      setMessage(`Reservation failed: ${err.error}`);
      setDirty(true);
    } else {
      setMessage('Reservation failed: Unknown error');
      setDirty(true);
    }
  }
};

  // Function to load discount based on auth token, row sum, and user role
const loadDiscount = async (authToken, rowSum) => {
  try {
    const discountResponse = await API.getDiscount(authToken, rowSum);
    setDiscount(discountResponse.discount);
  } catch (e) {
    if (e.errors && e.errors.length !== 0 && e.errors[0].path === 'invalid_token') {
      setDiscount(null);
      renewToken(); 
    } else {
      handleErrors(e);
    }
  }
};

// Handle confirmation of seat selection
const handleConfirmSelection = async () => {
  //The .flat() method is used to create a new array by flattening the seats array one level deep.
  const pendingSeats = seats.flat().filter(seat => seat.status === 'pending');
  if (pendingSeats.length > 0) {
    try {
      // Check if the user already has a reservation for this concert
      const response = await API.checkReservation(concertId);
      if (response.reservation) {
        // If a reservation already exists, set an error message
        setMessage('You already have a reservation for this concert.');
        handleCancel();
      } else {
        try{
          // If no reservation exists, proceed with reserving the seats
          await API.reserveSeats(concertId, pendingSeats);
          setHasReservation(true);
          
          setDirty(true)

          const rowSum = pendingSeats.reduce((sum, seat) => sum + seat.row, 0);
          //const userRole = user.role;
          loadDiscount(authToken, rowSum);



        }catch (err) {
            if (err.occupiedSeats) {
               await highlightOccupiedSeats(err.occupiedSeats);
           
               setTimeout(() => {
                setDirty(true);
              }, 5000);
              setMessage('Some seats are already occupied.');
            
              } else {
              setMessage(`Reservation failed: ${err.message}`);
              
            }
  
        }
        
      }
    } catch (err) {
      setMessage(`Reservation failed: ${err.message}`);
    }
  } else {
    
    setMessage('No seats selected.');
    handleCancel();
  }
};

// Function to highlight seats that are occupied by others
const highlightOccupiedSeats = async (occupiedSeatIds) => {
  setSeats(prevSeats => {
      const newSeats = prevSeats.map(row => row.map(seat => {
          if (occupiedSeatIds.includes(seat.seat_id)) {
              seat.status = 'occupied_by_others';
          }
          return seat;
      }));
      return newSeats;
  });

  // Remove the highlight after 5 seconds
  setTimeout(() => {
      setSeats(prevSeats => {
          const newSeats = prevSeats.map(row => row.map(seat => {
              if (seat.status === 'occupied_by_others') {
                  seat.status = 'occupied';
              }
              return seat;
          }));
          return newSeats;
      });
  }, 5000);
};
return (
  <div>
    <div className="d-flex justify-content-between align-items-center">
      <h2>
        Concert Booking for: 
        <span className="concert-title">
          {concert ? concert.title : <RiLoader4Line className="loading-icon" />}
        </span>
      </h2>
      <Button variant="primary btn-lg" onClick={() => {navigate('/');setMessage('');}}>
        Back to List of Concerts
        <i className="bi bi-house-door-fill mx-2"></i>
      </Button>
    </div>
    <div className="mt-2 text-center">
      <h5>Concert Date: {concert ? concert.date.format("YYYY-MM-DD") : ''}</h5>
    </div>

    {loggedIn && hasReservation && (
      <Alert variant='info' className="fs-3 d-flex justify-content-center align-items-center">
        You have already made a reservation for this concert.
      </Alert>
    )}
    {loggedIn && discount && (
      <p className="discount-text fs-3 d-flex justify-content-center align-items-center">
        You have a Discount: {discount}
        <i className="bi bi-percent"></i>
      </p>
    )}

    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4 fs-3">
        <p>Total Seats: <span className="text-light bg-dark">{seatCounts.totalSeats}</span></p>
        <p>Available Seats: <span className="text-info bg-dark">{seatCounts.availableSeats}</span></p>
        <p>Occupied Seats: <span className="text-danger bg-dark">{seatCounts.occupiedSeats}</span></p>
      </div>
      {loggedIn &&(
        <div className="text-center mb-4 fs-3">
          <p>Selected Seats: <span className="text-warning bg-dark">{pendingSeatsCount}</span></p>
        </div>
      ) }
      
      <div className="stage-semicircle">
        <span className="stage-text">Stage</span>
      </div>
      <div className="seat-container mt-4 mb-5">
        {seats.map((row, rowIndex) => (
          <SeatVisualization 
            key={rowIndex}
            row={row}
            rowIndex={rowIndex}
            handleSeatClick={handleSeatClick}
            disableSeats={showForm} // Disable seats if the form is shown
          />
        ))}
      </div>
        <SeatSelection
          showForm={showForm}
          handleConfirmSelection={handleConfirmSelection}
          handleCancel={handleCancel}
          setShowForm={setShowForm}
          numSeats={numSeats}
          setNumSeats={setNumSeats}
          handleBookRandomSeats={handleBookRandomSeats}
          setPendingSeatsCount={setPendingSeatsCount}
       
        
        />
      
    </Container>
  </div>
);
}


export default BookLayout;