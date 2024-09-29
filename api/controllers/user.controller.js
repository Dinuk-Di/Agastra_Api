import User from "../models/user.model.js";

const UserController = {
  // Create a new user
  createUser: async (req, res) => {
    try {
      const { username,mobile } = req.body;
      const newUser = await User.create({ username, mobile });
      if(newUser){
        res.status(201).json({
          userId:newUser.id
        });
      }
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to create user", details: error.message });
    }
  },

  // Get all users
  getAllUsers: async (req, res) => {
    try {
      const users = await User.findAll();
      res.status(200).json(users);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to fetch users", details: error.message });
    }
  },

  // Get a user by ID
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);
      if (user) {
        res.status(200).json(user);
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to fetch user", details: error.message });
    }
  },

  // Update a user by ID
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { username, mobile } = req.body;
      const [updated] = await User.update(
        { username, mobile },
        {
          where: { id },
        }
      );

      if (updated) {
        const updatedUser = await User.findByPk(id);
        res.status(200).json(updatedUser);
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to update user", details: error.message });
    }
  },

  // Delete a user by ID
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await User.destroy({
        where: { id },
      });

      if (deleted) {
        res.status(204).json();
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to delete user", details: error.message });
    }
  },
};

export default UserController;
