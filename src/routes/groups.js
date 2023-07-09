var express = require('express');
var router = express.Router();
const Group = require("../models/group");
const {
  deleteGroup,
  getGroup,
  getGroups,
  updateGroup,
  createGroup,
  deleteGroupMember
} = require('../controllers/groupController')

// GET all groups
router.get('/:cur_usr', getGroups)

// GET a single group
router.get('/:id', getGroup)

// POST a new workout
router.post('/', createGroup)

// DELETE a group
router.delete('/:id/:cur_usr',deleteGroup)

// DELETE a group member
router.patch('/delete_member',deleteGroupMember)

// UPDATE a group
router.patch('/:id', updateGroup)


module.exports = router;