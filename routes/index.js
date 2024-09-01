import AuthRoutes from "./authRoutes.js";
import express from 'express';

const initRoutes = ()=>{
    const router = express.Router();

    router.use('/auth',AuthRoutes());

    return router;
}

export default initRoutes;