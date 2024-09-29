// adminRoutes.js
import express from 'express';
import eventController from '../controllers/event.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.post('/createevent', eventController.createEvent);
router.get('/findallevents', eventController.getAllEvents);
router.get('/geteventbyid/:id', eventController.getEventById);
router.put('/updateevent/:id', eventController.updateEvent);
router.delete('/deleteevent/:id', eventController.deleteEvent);
//router.put('/update/:id',verifyToken, updateProfile);

export default router;
