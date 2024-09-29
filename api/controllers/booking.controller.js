import Booking from "../models/booking.model.js";
import puppeteer from 'puppeteer';
import User from "../models/user.model.js";
import Event from "../models/event.model.js";
import { Model } from "sequelize";
import PDFDocument from 'pdfkit';
import fs from 'fs';

const BookingController = {
  // Create a new booking
  createBooking: async (req, res) => {
    try {
      const { username, mobile, table_number, is_booked, event_id } = req.body;
      const event = await Event.findByPk(event_id);
      const user = await User.findOne({ where: { username, mobile } });
      const booking = await Booking.findOne({ where: { event_id, table_number } });
      if (!event) {
        return res.status(400).json({ error: "Event not found" });
      }

      if (booking) {
        //update from new data
        booking.username = username;
        booking.mobile = mobile;
        booking.is_booked = is_booked;
        await booking.save();
        return res.status(200).json({
          mesage: "Booking updated successfully",
          booking: booking,
        });
      }
      if (user) {
        const newBooking = await Booking.create({
          userId: user.id,
          table_number,
          is_booked,
          event_id,
        });
        if (newBooking) {
          return res.status(201).json({
            mesage: "Booking created successfully",
            booking: newBooking,
          });
        }
      } else {
        const newUser = await User.create({ username, mobile });
        if (newUser) {
          const newBooking = await Booking.create({
            userId: newUser.id,
            table_number,
            is_booked,
            event_id,
          });
          return res.status(201).json({
            mesage: "Booking created successfully",
            booking: newBooking,
          });
        }
      }
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to create booking", details: error.message });
    }
  },

  // Get all bookings
  getAllBookings: async (req, res) => {
    try {
      const bookings = await Booking.findAll({
        include: [
          {
            model: User,
            attributes: ["username", "mobile"],
          },
          {
            model: Event,
            attributes: ["title", "date", "gridTables", "deletedTablesMap","lastTableNumber"],
          },
        ],
      });
      res.status(200).json(bookings);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to fetch bookings", details: error.message });
    }
  },

  // Get a booking by ID
  getBookingById: async (req, res) => {
    try {
      const { id } = req.params;
      const booking = await Booking.findByPk(id, {
        include: [
          {
            model: User,
            attributes: ["username", "mobile"],
          },
          {
            model: Event,
            attributes: ["title", "date", "gridTables", "deletedTablesMap"],
          },
        ],
      });
      if (booking) {
        res.status(200).json(booking);
      } else {
        res.status(404).json({ error: "Booking not found" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to fetch booking", details: error.message });
    }
  },

  // Update a booking by ID
  updateBooking: async (req, res) => {
    try {
      const { id } = req.params;
      const { username, mobile, table_number, event_id, is_booked } = req.body;
      const [updated] = await Booking.update(
        { username, mobile, table_number, event_id, is_booked },
        { where: { id} }
      );

      if (updated) {
        const updatedBooking = await Booking.findByPk(id);
        res.status(200).json(updatedBooking);
      } else {
        res.status(404).json({ error: "Booking not found" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to update booking", details: error.message });
    }
  },

  // Delete a booking by ID
  deleteBooking: async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await Booking.destroy({
        where: { id },
      });

      if (deleted) {
        res.status(204).json();
      } else {
        res.status(404).json({ error: "Booking not found" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to delete booking", details: error.message });
    }
  },


  getBookedSeats: async (req, res) => {
    try {
      const { event_id } = req.params;
      const event = await Event.findByPk(event_id);
      const bookings = await Booking.findAll({
        where: { event_id: event_id , is_booked: true },
        include: [
          {
            model: User,
            attributes: ["username", "mobile"],
          }
        ],
      });

      if (!bookings) {
        return res.status(404).json({ error: "Bookings not found" });
      }
      res.status(200).json({
        booked_seats: bookings,
        created_grids : event.createdGrids,
        booked_seat_numbers : Object.values(bookings).flatMap(x => x.table_number),
        seat_numbers : Object.values(JSON.parse(event.gridTables)).flatMap(x => x.tables),
        deleted_tables : Object.values(JSON.parse(event.deletedTablesMap)).flat(),
        last_table_number : event.lastTableNumber,
        last_grid_number : Object.keys(JSON.parse(event.createdGrids)).length
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to fetch booked seats",
        details: error.message,
      });
    }
  },

  downloadBookingPDF: async (req, res) => {
    try {
      const { event_id } = req.params;

      // Fetch bookings and event details
      const bookings = await Booking.findAll({
          where: { event_id: event_id, is_booked: true },
          include: [
              {
                  model: User,
                  attributes: ["username", "mobile"],
              },
          ],
      });

      const event = await Event.findByPk(event_id);

      if (!bookings || !event) {
          return res.status(404).json({ error: 'No bookings or event found' });
      }

      let eventMapBase64 = event.image ? event.image : null;

      // If the base64 string includes the "data:image/png;base64," prefix, remove it
      if (eventMapBase64 && eventMapBase64.startsWith("data:image")) {
          eventMapBase64 = eventMapBase64.split(',')[1]; // Strip out the data:image/png;base64, part
      }

      // Create a new PDF document
      const doc = new PDFDocument({ size: 'A4', margin: 10, align: 'center', layout: 'landscape' });

      // Set the response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=event_${event_id}.pdf`);

      // Pipe the PDF document to the response
      doc.pipe(res);

      // Add event details
      doc.fontSize(25).text(`Event Name: ${event.title}`, { align: "center" });
      doc.fontSize(16).text(`Event Date: ${event.date}`, { align: "center" });

      // Insert a line break
      doc.moveDown(3);

      // Add the image to the PDF if it exists
      if (eventMapBase64) {
          try {
              const imageBuffer = Buffer.from(eventMapBase64, 'base64');
              
              // Draw a border for the image
              doc.image(imageBuffer, {                
                  fit: [doc.page.width-50, doc.page.height-100],
                  align: 'center',
                  valign: 'center'
              });

             
          } catch (error) {
              console.error('Error adding image to PDF:', error.message);
          }
      }

      // Add a new page for the booking details
      doc.addPage();

      // Add table for booking details
      doc.fontSize(16).text('Reserved Tables Details', { align: 'center' });

      bookings.forEach((booking, index) => {
        doc.moveDown();
        doc
          .fontSize(12)
          .text(`${index + 1}. Table Number: ${booking.table_number}`, {
            align: "left",
            margin: 20,
          });
        doc
          .fontSize(12)
          .text(`   Reserver's Name: ${booking.User.username}`, {
            align: "left",
            margin: 20,
          });
        doc
          .fontSize(12)
          .text(`   Phone Number: ${booking.User.mobile}`, {
            align: "left",
            margin: 20,
          });
      });

      // End the PDF and send it to the client
      doc.end();
  } catch (error) {
      console.error('Error generating PDF:', error.message);
      res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
  }
}
  
};
  
export default BookingController;
