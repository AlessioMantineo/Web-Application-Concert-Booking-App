
import { Row, Col, Button, Alert } from 'react-bootstrap';
import { Outlet, Link } from 'react-router-dom';

import { Navigation } from './Navigation';
import { ConcertTable, TicketTable } from './Concert';
import { useContext, useEffect } from 'react';
import { LoginForm } from './Auth';

import AuthContext from '../AuthContext.js';
import API from '../API.js';

function NotFoundLayout() {
  return (
    <>
      <h2>This route is not valid!</h2>
      <Link to="/">
        <Button variant="primary">Go back to the main page!</Button>
      </Link>
    </>
  );
}

function LoginLayout(props) {
  const { handleLogin } = props;
  return (
    <Row>
      <Col>
        <LoginForm handleLogin={handleLogin} />
      </Col>
    </Row>
  );
}



function TableLayout(props) {

  const { ConcertList } = props;
  const { setConcertList } = props;
  const {TicketList}= props;
  const {setTicketList}= props;
  const {setDirty}=props;
  const { handleErrors } = props;


  const { loggedIn, user } = useContext(AuthContext);

  useEffect(() => {
    API.getConcerts()
      .then(concerts => {
        setConcertList(concerts);
      })
      .catch(e => { handleErrors(e); });
  }, []);

  useEffect(() => {

    if (loggedIn && user) {
      API.listTicketsReservation(user.user_id)
        .then(tickets => {
          setTicketList(tickets);
          setDirty(false);

        })
        .catch(e => { handleErrors(e); setDirty(false);});
    }
  }, [loggedIn, props.dirty]);


  return (
    <>
      <div className="d-flex flex-row justify-content-between">
        <h1 className="my-2">Next Concerts List:</h1>
      </div>
      <div className="d-flex flex-row justify-content-between">
      <ConcertTable 
          ConcertList={ConcertList}
         
          />
          {loggedIn && TicketList.length > 0 && (
          <div className="d-flex flex-row ms-0"> 
            
            <TicketTable
              TicketList={TicketList}
             
              delete={props.deleteTicket}
            />
          </div>
      )}
      </div>

    </>
  );
}

function GenericLayout(props) {
  const { handleLogout } = props;
  const { message } = props;
  const { setMessage } = props;

  return (
    <>
      <Row>
        <Col>
          <Navigation handleLogout={handleLogout} />
        </Col>
      </Row>

      <Row><Col>
        {message ? <Alert className='my-1' onClose={() => setMessage('')} variant='warning' dismissible>
          {message}</Alert> : null}
      </Col></Row>

      <Row>

        <Col>
          <Outlet />

        </Col>
      </Row>
    </>
  );
}

export { GenericLayout, NotFoundLayout, TableLayout,  LoginLayout };