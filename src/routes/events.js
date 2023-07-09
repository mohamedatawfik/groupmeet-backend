var express = require('express');
var router = express.Router();
const Event = require("../models/event");
const {
  getEvents,
  createEvent,
  createPrivateEvent,
  deleteEvent
} = require('../controllers/eventController')

// GET all events
router.get('/:cur_usr', getEvents)

// POST a new event
router.post('/', createEvent)

// POST a new private event
router.post('/private', createPrivateEvent)

// DELETE an event
router.delete('/:id/:cur_usr',deleteEvent)



module.exports = router;