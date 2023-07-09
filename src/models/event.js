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
    type: String,
    required: true
  },
  end: {
    type: String,
    required: true
  },
  creator: {
    type: String
  },

});

eventSchema.index({ title: 1, creator: 1 }, { unique: true });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
