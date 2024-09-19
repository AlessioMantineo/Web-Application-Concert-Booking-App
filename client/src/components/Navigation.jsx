import 'bootstrap-icons/font/bootstrap-icons.css';
import { useContext } from 'react';
import { Navbar, Nav, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

import AuthContext from '../AuthContext.js';

/**
 * Component to render the navigation item when the user is not authenticated.
 * This component displays a "Login" button.
 */

const NavItemNotAuthenticated = () => {
    const navigate = useNavigate();
    return (
        <Nav.Item>
            <Button variant="info" className="fs-4 mx-2" onClick={() => navigate('/login')}>
                Login
                <i className="bi bi-person-circle mx-2" />
            </Button>
        </Nav.Item>
    )
}

/**
 * Component to render the navigation items when the user is authenticated.
 * Displays a welcome message with the username and a "Logout" button.
 */
const NavItemAuthenticated = (props) => {
    const { username } = props;
    const { handleLogout } = props;
    return (
        <>
            <Navbar.Brand className="mx-5 welcome-text">Welcome {username}</Navbar.Brand>
            <Button className="mx-2 " variant="danger" onClick={handleLogout}>Logout <i className="bi bi-box-arrow-right mx-2"></i></Button>
        </>
    )
}

/**
 * Main Navigation component that renders the Navbar.
 * It shows different items based on the authentication state (logged in or not).
 */
const Navigation = (props) => {
    const { handleLogout } = props;
    const { loggedIn, user } = useContext(AuthContext);

    return (
        <Navbar bg="dark" expand="md" variant="dark" className="navbar-padding d-flex flex-row justify-content-between">
        <Navbar.Brand className="mx-2">
            <i className="bi bi-music-note-beamed mx-5" />
            Concerts
            <i className="bi bi-music-note-beamed mx-5" />
        </Navbar.Brand>
            <Nav >
            {loggedIn ? <NavItemAuthenticated username={user.username} handleLogout={handleLogout} /> : <NavItemNotAuthenticated />}
            </Nav>
        </Navbar>
    );
}




export { Navigation };