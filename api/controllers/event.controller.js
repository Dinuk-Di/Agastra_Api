import Booking from "../models/booking.model.js";
import Event from "../models/event.model.js";
import EventImages from "../models/event-images.model.js";

const eventController = {
  createEvent: async (req, res) => {
    try {
      const { title, date } = req.body;
      //check already have the event title
      const event = await Event.findOne({ where: { title, date } });

      if (event) {
        return res.status(400).json({ error: "Event already exists" });
      }

      const newEvent = await Event.create({
        title,
        date,
      });
      res.status(201).json({
        message: `Event ${title} created successfully`,
        event: newEvent,
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to create event", details: error.message });
    }
  },

  // Get all bookings
  getAllEvents: async (req, res) => {
    try {
      const events = await Event.findAll(
        {
          include: [
            {
              model: EventImages,
              attributes: ["image"],
            },
          ],
        }
      );
      res.status(200).json(events);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to fetch events", details: error.message });
    }
  },

  // Get a booking by ID
  getEventById: async (req, res) => {
    try {
      const { id } = req.params;
      const event = await Event.findByPk(id);
      const images = await EventImages.findAll({
        where: { eventId: id },
      })
      const bookings = await Booking.findAll({
        where: { event_id: id, is_booked: true },
      });
      if (event) {
        res.status(200).json({
          event: event,
          images : images.map(img => {
            try {
              return JSON.parse(img.image);
            } catch (parseError) {
              console.error(`Error parsing image JSON for image ID ${img.id}:`, parseError);
              return null;
            }
          }).filter(img => img !== null),
          booked_seats: Object.values(bookings).flatMap((x) => x.table_number),
          deleted_tables: Object.values(
            JSON.parse(event.deletedTablesMap)
          ).flat(),
          grid_count: Object.keys(JSON.parse(event.createdGrids)).length + 1,
        });
      } else {
        res.status(404).json({ error: "Event not found" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to fetch event", details: error.message });
    }
  },
  updateEvent: async (req, res) => {
    try {
      const { id } = req.params;
      const { gridTables, map, image, createdGrids } = req.body;
  
      // Find the event by ID
      const event = await Event.findByPk(id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
  
      let lastTableNumber = 0;
      let existingGrids = event.createdGrids ? JSON.parse(event.createdGrids) : [];
  
      // Function to merge new grids into existing ones
      createdGrids.forEach((newGrid) => {
        const gridNumber = newGrid.grids;
  
        // Check if the gridNumber already exists in existingGrids
        const existingGridIndex = existingGrids.findIndex(
          (grid) => grid.grids === gridNumber
        );
  
        if (existingGridIndex !== -1) {
          // If the grid exists, you can update or merge data if needed
          existingGrids[existingGridIndex] = { ...existingGrids[existingGridIndex], ...newGrid };
        } else {
          // If the grid does not exist, add it to the array
          existingGrids.push(newGrid);
        }
      });

      for (const grid of existingGrids) {
        lastTableNumber += grid.tables;
      }
  
      // 2. Construct deletedTablesMap by finding the missing table numbers in the range
      const newDeletedTablesMap = {};
      let previousMaxTableNumber = 0; // To track the last table number processed from previous grids
  
      // Iterate over createdGrids to process each grid
      createdGrids.forEach((createdGrid) => {
        const gridNumber = createdGrid.grids;
        const grid = gridTables[gridNumber];
  
        // If the grid is not present in gridTables, mark all its tables as deleted
        if (!grid) {
          const expectedTableCount = createdGrid.tables; // Get the expected number of tables from createdGrids
          const startingTableNumber = previousMaxTableNumber + 1;
          const endingTableNumber =
            startingTableNumber + expectedTableCount - 1;
  
          // Generate all table numbers in the expected range
          const allTableNumbersInRange = Array.from(
            { length: expectedTableCount },
            (_, i) => i + startingTableNumber
          );
  
          // Mark all tables as deleted for this grid
          newDeletedTablesMap[gridNumber] = allTableNumbersInRange;
  
          // Update the previousMaxTableNumber for the next grid
          previousMaxTableNumber = endingTableNumber;
        } else {
          // Grid exists in gridTables, proceed with the existing logic
          const expectedTableCount = grid.rows * grid.columns;
  
          // Determine the starting and ending table numbers for the current grid
          const startingTableNumber = previousMaxTableNumber + 1;
          const endingTableNumber =
            startingTableNumber + expectedTableCount - 1;
  
          // Generate all table numbers in the expected range
          const allTableNumbersInRange = Array.from(
            { length: expectedTableCount },
            (_, i) => i + startingTableNumber
          );
  
          // Find the missing table numbers (tables that should exist but are missing)
          const missingTableNumbers = allTableNumbersInRange.filter(
            (tableNumber) => !grid.tables.includes(tableNumber)
          );
  
          // Store the missing tables in the deletedTablesMap
          newDeletedTablesMap[gridNumber] = missingTableNumbers;
  
          // Update previousMaxTableNumber for the next grid
          previousMaxTableNumber = endingTableNumber;
        }
      });
  
      // 3. Update the event in the database
      const [updated] = await Event.update(
        {
          map:map.elements,
          image,
          createdGrids:existingGrids, 
          gridTables,
          deletedTablesMap: newDeletedTablesMap,
          lastTableNumber,
        },
        {
          where: { id },
        }
      );
      console.log("updated", updated);
      if (map && map.files && typeof map.files === 'object') {
        try {
          // Iterate over the keys (file IDs) in the map.files object
          const fileEntries = Object.entries(map.files);
          
          // Insert each file's data into the EventImages table
          const imagePromises = fileEntries.map(async ([fileId, fileData]) => {
            // Check if the fileId already exists in the EventImages table
            const existingImage = await EventImages.findOne({
              where: { image_id: fileId, eventId: id },
            });
            
            if (existingImage) {
              // If the image_id already exists, skip this file
              console.log(`Image with id ${fileId} already exists, skipping.`);
              return null; // Skip to next iteration
            }
      
            // Insert the new image into the EventImages table
            return EventImages.create({
              eventId: id,
              image_id: fileId,  // Use the fileId as the image_id (this is the key)
              image: fileData,   // Store the corresponding JSON data for that fileId
            });
          });
      
          // Await all image insertions to complete
          await Promise.all(imagePromises);
          console.log("Images inserted successfully");
        } catch (err) {
          console.error("Failed to insert images", err);
          return res.status(500).json({ error: "Failed to insert images", details: err.message });
        }
      } else {
        // If map.files is not a valid object, handle the case
        console.log("No valid images found in map.files");
      }
      
      
  
      // 4. Return the updated event or an error if not found
      if (updated) {
        const updatedEvent = await Event.findByPk(id);
        res.status(200).json(updatedEvent);
      } else {
        res.status(404).json({ error: "Event not found" });
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ error: "Failed to update event", details: error.message });
    }
  },
  
  // Delete a booking by ID
  deleteEvent: async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await Event.destroy({
        where: { id },
      });

      if (deleted) {
        return res.status(200).json({
          message: "Event deleted successfully",
        });
      } else {
        return res.status(404).json({ error: "Event not found" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to delete Event", details: error.message });
    }
  },
};

export default eventController;
