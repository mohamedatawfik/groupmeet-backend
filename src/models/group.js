const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  members: [
    {
      type: String,
    }
  ],
  creator:
    {
      type: String,
    }
    ,
  events: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    }
  ],
});
// A combination of name & creator is unique
groupSchema.index({ name: 1, creator: 1 }, { unique: true });

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;
