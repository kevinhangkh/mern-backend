const asyncHandler = require('express-async-handler');

const Note = require('../models/Note');
const User = require('../models/User');

/**
 *  @desc Get all notes
 *  @route GET /notes
 *  @access Private
 */
const getAllNotes = asyncHandler(async (req, res) => {
  const notes = await Note.find().lean();
  if (!notes?.length)
    return res.status(400).json({ message: 'No notes found' });

  // Add username to each note before sending the response
  // See Promise.all with map() here: https://youtu.be/4lqJBBEpjRE
  const notesWithUser = await Promise.all(
    notes.map(async (note) => {
      const user = await User.findById(note.user).lean().exec();
      return { ...note, username: user.username };
    })
  );

  res.json(notesWithUser);
});

/**
 *  @desc Create a new note
 *  @route POST /notes
 *  @access Private
 */
const createNote = asyncHandler(async (req, res) => {
  const { user, title, text } = req?.body;
  if (!user || !title?.trim() || !text?.trim()) {
    return res
      .status(400)
      .json({ message: 'User, title and text are required' });
  }

  // Check if user exists
  const foundUser = await User.findById(user).lean().exec();
  if (!foundUser)
    return res.status(400).json({ message: `User with id ${user} not found` });

  // Check if duplicate
  const duplicate = await Note.findOne({ title }).lean().exec();
  if (duplicate)
    return res
      .status(400)
      .json({ message: `Note with title ${title} already exists` });

  // Store note to DB
  const noteObject = {
    user,
    title,
    text,
  };

  const note = await Note.create(noteObject);
  if (note) {
    res.status(201).json({
      message: `New note '${note.title}' created for user ${note.user}`,
    });
  } else {
    res
      .status(500)
      .json({ message: 'An issue occurred creating note in database' });
  }
});

/**
 *  @desc Update a note
 *  @route PATCH /notes
 *  @access Private
 */
const updateNote = asyncHandler(async (req, res) => {
  const { id, user, title, text, completed } = req?.body;
  if (
    !id ||
    !user ||
    !title?.trim() ||
    !text?.trim() ||
    typeof completed !== 'boolean'
  ) {
    return res
      .status(400)
      .json({ message: 'Id, user, title, text and completed are required' });
  }

  const note = await Note.findById(id).exec();
  if (!note) return res.status(400).json({ message: `Note with id ${id} not found` });

  // Check if duplicate
  const duplicate = await Note.findOne({ title }).lean().exec();
  if (duplicate && duplicate?._id.toString() !== id)
    return res
      .status(409)
      .json({ message: `Note with title '${title}' already exists` });

  // Check if user exists
  const foundUser = await User.findById(user).lean().exec();
  if (!foundUser)
    return res.status(400).json({ message: `User with id ${user} not found` });

  // Update note
  note.user = user;
  note.title = title;
  note.text = text;
  note.completed = completed;

  const updatedNote = await note.save();
  res.json({ message: `Note '${updatedNote.title}' updated successfully` });
});

/**
 *  @desc Delete a note
 *  @route DELETE /notes
 *  @access Private
 */
const deleteNote = asyncHandler(async (req, res) => {
  const { id } = req?.body;
  if (!id) return res.status(400).json({ message: 'Id is required' });

  const note = await Note.findById(id).exec();
  if (!note)
    return res.status(400).json({ message: `Note with id ${id} not found` });

  const result = await note.deleteOne();
  res.json({ message: `Note '${result.title}' with id ${id} deleted` });
});

module.exports = { getAllNotes, createNote, updateNote, deleteNote };
