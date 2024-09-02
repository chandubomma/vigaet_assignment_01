import AuthRoutes from "./authRoutes.js";
import MeetingRoutes from "./meetingsRoutes.js";
import express from 'express';

const initRoutes = ()=>{
    const router = express.Router();

    router.use('/auth',AuthRoutes());
    router.use('/meetings',MeetingRoutes());

    return router;
}

export default initRoutes;