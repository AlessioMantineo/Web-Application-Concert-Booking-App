import { useState } from 'react';
import { Form, Button, Alert, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function LoginForm(props) {
  const { handleLogin } = props;

  const [username, setUsername] = useState('supermario');
  const [password, setPassword] = useState('pass');

  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();


  const handleSubmit = (event) => {
    event.preventDefault();
    const credentials = { username, password };

    if (!username) {
      setErrorMessage('Username cannot be empty');
    } else if (!password) {
      setErrorMessage('Password cannot be empty');
    } else {
      handleLogin(credentials)
        .then(() => navigate('/'))
        .catch((err) => {
          setErrorMessage(err.error);
        });
    }
  };

  return (
    <Row className="justify-content-md-center">
      <Col md={6}>
        <Card className="shadow-lg p-3 mb-5 bg-white rounded">
          <Card.Body>
            <h2 className="text-center mb-4">Login</h2>

            <Form onSubmit={handleSubmit}>
              {errorMessage ? (
                <Alert dismissible onClose={() => setErrorMessage('')} variant="danger">
                  {errorMessage}
                </Alert>
              ) : null}
              <Form.Group className="mb-3">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  type="text"
                  value={username}
                  placeholder="Enter your username"
                  onChange={(event) => setUsername(event.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  value={password}
                  placeholder="Enter your password"
                  onChange={(event) => setPassword(event.target.value)}
                />
              </Form.Group>
              <div className="d-grid gap-2">
                <Button variant="primary" type="submit">
                  Login
                </Button>
                <Button variant="secondary" onClick={() => navigate('/')}>
                  Cancel
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Col>
    </Row>

  )
}

export { LoginForm };