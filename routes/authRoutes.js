import express from 'express';
import { login, signup } from '../controllers/authController.js';

const AuthRoutes = ()=>{
    const router = express.Router();

    router.post('/signup', signup);
    router.post('/login', login);
    
    return router;
}


export default AuthRoutes;