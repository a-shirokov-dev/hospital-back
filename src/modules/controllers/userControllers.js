const User = require('../../db/models/user');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const key = require('../keys/keys');

module.exports.getAllUsers = (req, res, next) => {
  User.find().then(result => {
		res.send({data: result});
	});
};

module.exports.userRegistration = async (req, res, next) => {
  const { _id, username, password } = req.body;
  const usernameIsUsed = await User.findOne({ username });
  if (usernameIsUsed) {
    return res.status(300).json({message: "Username is already taken, please try another."});
  }
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
        message: 'Invalid registration data'
      });
    } else {
      const salt = bcrypt.genSaltSync(10);
      const user = new User({
        username,
        password: bcrypt.hashSync(password, salt)
      });

      await user.save();
      const token = generateToken(username, _id);

      res.status(201).json({
        message: "New user is created.",
        user: user,
        token: token
      });
    }
  } catch (err) {
    console.log(err);
  }
};

module.exports.userAuthentification = async (req, res, next) => {
  const { _id, username, password } = req.body;
  const usernameIsUsed = await User.findOne({ username });
  if (!usernameIsUsed) {
    return res.status(400).json({message: "Username is not entered or invalid."});
  } else {
    const passwordsMatched = bcrypt.compareSync(password, usernameIsUsed.password);
    if (!passwordsMatched) {
      res.status(401).json({message: "Invalid password!"});
    } else {
      const token = jwt.sign({
        username: usernameIsUsed.username,
        userId: usernameIsUsed._id
      }, key.jwt, {expiresIn: "1h"});
      res.status(200).json({
        token: `Bearer ${token}`
      });
    }
  }
};

const generateToken = (user, id) => {
  return jwt.sign(
    { user, id },
    key.jwt,
    { expiresIn: "1h" }
  );
}