import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { sendMeetingRequest, getMeetingRequests, updateMeetingRequestStatus, getMeetings, getMeetingById,cancelMeetingRequest } from '../controllers/meetingsController.js';

const MeetingRoutes = ()=>{
    const router = express.Router();

    router.post('/request', protect, sendMeetingRequest);
    router.get('/requests', protect, getMeetingRequests);
    router.get('/meetings',protect,getMeetings)
    router.get('/meetings/:id',protect,getMeetingById)
    router.put('/update-request', protect, updateMeetingRequestStatus);
    router.delete('/cancel-request/:requestId',protect,cancelMeetingRequest)

    return router;
}


export default MeetingRoutes;