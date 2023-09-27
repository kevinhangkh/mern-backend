const asyncHandler = require('express-async-handler');
const bcryptjs = require('bcryptjs');

const User = require('../models/User');
const Note = require('../models/Note');

/**
 *  @desc Get all users
 *  @route GET /users
 *  @access Private
 */
//! asyncHandler allows to not use try catch blocks
const getAllUsers = asyncHandler(async (req, res) => {
  // select('-password') excludes the password field, we don't need that
  // lean(): allows faster queries, https://mongoosejs.com/docs/tutorials/lean.html
  // lean(): also we are not going to call save() on users
  const users = await User.find().select('-password').lean();
  if (!users?.length)
    return res.status(400).json({ message: 'No users found' });
  res.json(users);
});

/**
 *  @desc Create a user
 *  @route POST /users
 *  @access Private
 */
//! asyncHandler allows to not use try catch blocks
const createUser = asyncHandler(async (req, res) => {
  const { username, password, roles } = req?.body;
  if (
    !username ||
    !password ||
    !Array.isArray(roles) ||
    !roles.length ||
    roles.some((role) => role?.trim() === '')
  ) {
    return res
      .status(400)
      .json({ message: 'Username, password and roles fields are required!' });
  }

  const duplicate = await User.findOne({ username }).lean().exec();
  if (duplicate) return res.status(409).json({ message: 'Duplicate username' });

  // Hash password
  const hashedPwd = await bcryptjs.hash(password, 10); // 10 salt rounds

  // Store new user to DB
  const userObject = { username, password: hashedPwd, roles };
  const user = await User.create(userObject);

  if (user) {
    res.status(201).json({ message: `New user ${username} created` });
  } else {
    res.status(400).json({ message: 'Invalid user data received' });
  }
});

/**
 *  @desc Update a user
 *  @route PATCH /users
 *  @access Private
 */
//! asyncHandler allows to not use try catch blocks
const updateUser = asyncHandler(async (req, res) => {
  const { id, username, password, roles, active } = req?.body;

  if (
    !id ||
    !username ||
    !Array.isArray(roles) ||
    !roles.length ||
    roles.some((role) => role?.trim() === '') ||
    typeof active !== 'boolean'
  ) {
    return res.status(400).json({
      message: 'Id, username, roles and active fields are required!',
    });
  }

  const user = await User.findById(id).exec();
  if (!user) return res.status(400).json({ message: 'User not found' });

  const duplicate = await User.findOne({ username }).lean().exec();
  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({ message: 'Duplicate username' });
  }

  // Update the fields
  user.username = username;
  user.roles = roles;
  user.active = active;

  if (password) {
    // Hash password
    user.password = await bcryptjs.hash(password, 10);
  }

  // Save user
  const updatedUser = await user.save();
  res.json({ message: `${updatedUser.username} updated successfully` });
});

/**
 *  @desc Delete a user
 *  @route DELETE /users
 *  @access Private
 */
//! asyncHandler allows to not use try catch blocks
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req?.body;
  if (!id) return res.status(400).json({ message: 'Id is required' });

  // Check if any note is assigned to the user
  const note = await Note.findOne({ user: id }).lean().exec();
  if (note)
    return res.status(400).json({ message: 'User has assigned notes' });

  const user = await User.findById(id).exec(); // not chaining lean() because we need deleteOne() function
  if (!user)
    return res.status(400).json({ message: `User with id ${id} not found` });

  const result = await user.deleteOne();
  res.json({
    message: `Username ${result.username} with id ${result.id} deleted`,
  });
});

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
};
