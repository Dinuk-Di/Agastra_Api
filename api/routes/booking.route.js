import express from 'express';
import BookingController from '../controllers/booking.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.post('/createbooking', BookingController.createBooking);
router.get('/findallbookings', BookingController.getAllBookings);
router.get('/getbookingbyid/:id', BookingController.getBookingById);
router.put('/updatebooking/:id', BookingController.updateBooking);
router.delete('/deletebooking/:id', BookingController.deleteBooking);
router.get('/getbookings/:event_id', BookingController.getBookedSeats);
router.get('/downloadpdf/:event_id', BookingController.downloadBookingPDF);

//router.put('/update/:id',verifyToken, updateProfile);

export default router;
