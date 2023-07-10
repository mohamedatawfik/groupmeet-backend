var express = require('express');
var router = express.Router();
const Event = require("../models/event");
const {
  getEvents,
  createGroupEvent,
  createPrivateEvent,
  deleteEvent,
  getEvent
} = require('../controllers/eventController')

// GET all events
router.get('/:cur_usr', getEvents)

// GET a single event
router.get('/:id/:creator', getEvent)

// POST a new event
router.post('/groupevent', createGroupEvent)

// POST a new private event
router.post('/private', createPrivateEvent)

// DELETE an event
router.delete('/:id/:cur_usr', deleteEvent)



module.exports = router;
