// adminController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/admin.model.js";
import { errorHandler } from "../utils/error.js";

export const register = async (req, res) => {
  const { username, email, password } = req.body;

  // Check for missing fields
  if (!username || !password || !email) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const existingUser = await Admin.findOne({ where: { username } });
    if (existingUser) {
      return res.status(401).json({ message: 'User already exists' });
    }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    const data = {
      username,
      email,
      password: hashedPassword
    };

    // Create the admin
    const admin = await Admin.create(data);
    
    // Check if admin was successfully created
    if (admin) {
      // Generate a JWT token
      const token = jwt.sign({ id: admin.id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      // Set the token in a cookie
      res.cookie("token", token, { httpOnly: true });

      // Send a single response with admin details and the token
      return res.status(201).json({
        message: "Admin created and logged in successfully",
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
        },
        token,
      });
    } else {
      return res.status(500).json({ message: "Server error" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error });
  }
};


export const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  const admin = await Admin.findOne({ where: { username } });
  if (!admin) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const isPasswordValid = await bcrypt.compare(password, admin.password);

  if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

  const token = jwt.sign({ id: admin.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.cookie("token", token, { httpOnly: true });
    res.status(200).json({
      message: "Admin logged in successfully",
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
      },
      token,
    });
};

export const signout = (req, res, next) => {
  try {
    res.clearCookie("token").status(200).json("User has been signed out");
  } catch (error) {
    next(error);
  }
};


// export const updateProfile = async (req, res, next) => {
//   const id = req.params.id; // Assuming admin ID is set in req.params.id by the route

//   if (req.admin.id != req.params.id) {
//       return next(errorHandler(403, 'You are not allowed to update this user'));
//   }

//   const { username, password, first_name, last_name, email, phone_number, profile_picture } = req.body;

//   try {
//       let updates = [];
//       let queryParams = [];

//       if (username) {
//           updates.push('username = ?');
//           queryParams.push(username);
//       }

//       if (password) {
//           const hashedPassword = await bcrypt.hash(password, 10);
//           updates.push('password = ?');
//           queryParams.push(hashedPassword);
//       }

//       if (first_name) {
//           updates.push('first_name = ?');
//           queryParams.push(first_name);
//       }

//       if (last_name) {
//           updates.push('last_name = ?');
//           queryParams.push(last_name);
//       }

//       if (email) {
//           updates.push('email = ?');
//           queryParams.push(email);
//       }

//       if (phone_number) {
//           updates.push('phone_number = ?');
//           queryParams.push(phone_number);
//       }

//       if (profile_picture) {
//           updates.push('profile_picture = ?');
//           queryParams.push(profile_picture);
//       }

//       queryParams.push(id);
//       const updateQuery = `UPDATE admin SET ${updates.join(', ')} WHERE id = ?`;

//       db.query(updateQuery, queryParams, (err, result) => {
//           if (err) {
//               return res.status(500).json({ message: 'Error updating profile', error: err });
//           }

//           const selectQuery = 'SELECT id, username, first_name, last_name, email, phone_number, profile_picture FROM admin WHERE id = ?';
//           db.query(selectQuery, [id], (err, results) => {
//               if (err) {
//                   return res.status(500).json({ message: 'Error fetching updated profile', error: err });
//               }

//               const updatedAdmin = results[0];
//               res.status(200).json({
//                   message: 'Profile updated successfully',
//                   admin: updatedAdmin,
//               });
//           });
//       });
//   } catch (error) {
//       res.status(500).json({ message: 'Server error', error });
//   }
// };

