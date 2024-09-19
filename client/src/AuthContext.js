import { createContext } from 'react';

const AuthContext = createContext({loggedIn: false, user: null});

export default AuthContext;