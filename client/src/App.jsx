import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import AuthContext from './AuthContext.js';
import './App.css';

import { React, useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';


import { GenericLayout, NotFoundLayout, TableLayout, LoginLayout } from './components/Layout';
import BookLayout from './components/BookLayout';
import API from './API.js';

// Main App component with React Router
function App() {
  return (
    <BrowserRouter>
      <AppWithRouter />
    </BrowserRouter>
  );
}

// Component managing the application state and routing
function AppWithRouter(props) {
// State variables
const [loggedIn, setLoggedIn] = useState(false); // Tracks if the user is logged in
const [user, setUser] = useState(null); // Stores the user object after login
const [ConcertList, setConcertList] = useState([]); // List of concerts to display
const [TicketList, setTicketList]= useState([]); // List of tickets to display

const [dirty, setDirty] = useState(false); // Indicates if the data needs to be refreshed

const [message, setMessage] = useState(''); // Stores the error or success messages
const [authToken, setAuthToken] = useState(undefined); // Stores the authentication token

// Function to handle and display errors
  const handleErrors = (err) => {
    let msg = '';
    if (err.error)
      msg = err.error;
    else if (err.errors) {
      if (err.errors[0].msg)
        msg = err.errors[0].msg + " : " + err.errors[0].path;
    } else if (Array.isArray(err))
      msg = err[0].msg + " : " + err[0].path;
    else if (typeof err === "string") msg = String(err);
    else msg = "Unknown Error";
    // WARNING: a more complex application requires a queue of messages. In this example only the last error is shown.
    setMessage(msg);
    console.log(err);
  }

    // Function to renew the authentication token
  const renewToken = () => {
    API.getAuthToken().then((response) => { setAuthToken(response.token); })
      .catch(err => { console.log("renewToken err: ", err) });
  }

  /**
   * This function handles the login process.
   * It requires a username and a password inside a "credentials" object.
   */

  const handleLogin = async (credentials) => {
    try {
      const user = await API.logIn(credentials);
      setUser(user);
      setLoggedIn(true);



      renewToken();
    } catch (err) {
      // error is handled and visualized in the login form, do not manage error, throw it
      throw err;
    }
  };

  /**
   * This function handles the logout process.
   */
  const handleLogout = async () => {
 
    try {
      await API.logOut();
      setLoggedIn(false);
      setUser(null);
      setMessage('');
      setAuthToken(undefined);

    } catch (err) {
      handleErrors(err)
    }
  };

    /**
   * Function to delete a ticket and its associated seats
   * param {number} id - The ID of the ticket to delete
   */
  function deleteTicket(id) {
    API.deleteTicketAndSeats(id)
    .then(() => setDirty(true)) // Set dirty to true to refresh the data
    .catch(err => handleErrors(err));
}
useEffect(() => {
  if (loggedIn) {
    const interval = setInterval(() => {
      if (authToken) {
        renewToken();
      }
    }, 60000); // Refresh token every 60 seconds

    return () => clearInterval(interval);
  }
}, [authToken, loggedIn]); // Dependencies: authToken and loggedIn


// Return the main application layout and routes
  return (
    <AuthContext.Provider value={{ loggedIn: loggedIn, user: user }}>
      <Container fluid>
        <Routes>
          <Route path="/" element={<GenericLayout message={message} setMessage={setMessage} handleLogout={handleLogout} />} >
            <Route index element={<TableLayout 
              ConcertList={ConcertList} 
              setConcertList={setConcertList} 
              TicketList={TicketList}
              setTicketList={setTicketList}
              setDirty={setDirty} 
              dirty={dirty}
              deleteTicket={deleteTicket}
              handleErrors={handleErrors} />} 
            />
            <Route path="concert/:concertId" element={ <BookLayout 
                                                      ConcertList={ConcertList} 
                                                      setConcertList={setConcertList} 
                                                      handleErrors={handleErrors}
                                                      setDirty={setDirty} 
                                                      dirty={dirty}
                                                      setMessage={setMessage}
                                                      authToken={authToken} 
                                                      renewToken={renewToken} 
                                                      />} />
            <Route path="*" element={<NotFoundLayout />} />
          </Route>
          <Route path="/login" element={!loggedIn ? <LoginLayout handleLogin={handleLogin} /> : <Navigate replace to='/' />} />
        </Routes>
      </Container>
    </AuthContext.Provider>
  );
}

export default App;