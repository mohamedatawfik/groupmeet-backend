const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
  },
  start: {
    type: Date,
    required: true
  },
  end: {
    type: Date,
    required: true
  },
  creator: {
    type: String
  },
  group: {
    type: String
  },
  
});

eventSchema.index({ title: 1, creator: 1 }, { unique: true });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
