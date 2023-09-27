const express = require('express');
const router = express.Router();

const {
  getAllUsers,
  updateUser,
  deleteUser,
  createUser,
} = require('../controllers/userController');

router
  .route('/')
  .get(getAllUsers)
  .post(createUser)
  .patch(updateUser)
  .delete(deleteUser);

module.exports = router;
