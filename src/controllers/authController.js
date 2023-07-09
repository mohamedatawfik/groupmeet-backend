const User = require('../models/user');
const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');

const authController = {

  register: async (req, res) => {
    try {
      const { email, name, password } = req.body;

      // Check if user with the same email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered.' });
      }

      // Create a new user
      const newUser = new User({
        email,
        name,
        password
      });

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newUser.password, salt);
      newUser.password = hashedPassword;

      // Save the user to the database
      await newUser.save();

      // Generate a token containing the user's email
      // const token = jwt.sign({ email: user.email }, 'your-secret-key');
      const token = email;
      // Return the token to the frontend
      // res.status(200).json({ token });

      res.status(201).json({ message: 'User registered successfully.', token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  login: async (req, res) => {

    try {
      const { email, password } = req.body;

      // Check if user with the provided email exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: 'User not found.' });
      }

      // Compare the provided password with the stored password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid password.' });
      }

      // Generate a token containing the user's email
      // const token = jwt.sign({ email: user.email }, 'your-secret-key');
      const token =  user.email ;

      // Return the token to the frontend
      // res.status(200).json({ token });

      // Perform the login action (e.g., create a session or token)

      res.status(200).json({ message: 'User logged in successfully.', token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  logout: async (req, res) => {
    try {
      // Perform the logout action (e.g., destroy the session or token)

      res.status(200).json({ message: 'User logged out successfully.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = authController;
