const Event = require('../models/event');
const Group = require('../models/group');
const User = require('../models/user');
const mongoose = require('mongoose')

// get all events
const getEvents = async (req, res) => {
  try {
    const { cur_usr } = req.params;

    //get group events
    const groups = await Group.find({ members: cur_usr })
    const events_list = [];
    for (let i = 0; i < groups.length; i++) {
      for (let j = 0; j < groups[i]["events"].length; j++) {
        const ev = await Event.find({ _id: groups[i]["events"][j] })
        // only push if not null (event was deleted)
        if (ev[0] != null) {
          events_list.push(ev[0]);
        }
      }

    }
    //get private events
    const user = await User.find({ email: cur_usr })
    let events_ids = user[0]["events"];
    for (let i = 0; i < events_ids.length; i++) {
      const ev = await Event.find({ _id: events_ids[i] })
      // only push if not null (event was deleted)
      if (ev[0] != null) {
        events_list.push(ev[0]);
      }
    }

    res.status(200).json(events_list);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}


// create new group by selecting first free time slot for all members
/**
 * we use an algorightm similar to a free list which is used in memory management to 
 * manage free memory space. We start with a list of all days between start and end date
 * and set the start time to 9:00 and the end time to 18:00. We then remove all private events
 * from the list and then all group events from the list. The remaining time slots are then
 * stored in our free list. We then iterate over the free list and check if the duration of the
 * event fits into the time slot. If it does we create the event and add it to the database.
*/
const createGroupEvent = async (req, res) => {

  // receive input from frontend
  const { title, group, start, end, user_mail, duration } = req.body;
  const input = { title, group, start, end, duration, user_mail };
  const description = "public";

  // check if user is admin of group
  const requestgroup = await Group.find({ name: input.group, creator: input.user_mail });
  if (!requestgroup || requestgroup.length == 0) {
    return res.status(400).json({ error: 'You need admin rights to create an event' })
  }

  //initial freelist shall contain all days between start and end dates starting from 9:00 to 18:00
  var freelist = [];

  //change start and end dates to Date objects and set hours to 9:00 and 18:00 as we only want to consider those times
  var start_date = new Date(input.start)
  start_date.setHours(9, 0, 0, 0)
  var end_date = new Date(input.end)
  end_date.setHours(18, 0, 0, 0)

  //initialize free list
  for (let i = new Date(start_date); i <= end_date; i.setDate(i.getDate() + 1)) {
    const last_appointment = new Date(i);
    last_appointment.setHours(18, 0, 0, 0);
    const freelist_entry = { "start": new Date(i), "end": new Date(last_appointment) };
    freelist.push(freelist_entry);
  }

  // retrieve group members from database
  const members = requestgroup[0]["members"];

  //retrieve all private events of group all members
  const private_events = []
  for (let i = 0; i < members.length; i++) {
    const user = await User.find({ email: members[i] })
    for (let j = 0; j < user[0]["events"].length; j++) {
      const ev = await Event.find({ _id: user[0]["events"][j] })
      if (ev[0] != null) {
        const ev_start = new Date(ev[0]["start"])
        const ev_end = new Date(ev[0]["end"])

        // only add private events that are within the start and end dates of the group event 
        if (ev_start >= start_date && ev_end <= end_date) {
          private_events.push({ start: ev_start, end: ev_end });
        }
      }
    }
  }

  //remove all private events from free list
  for (let i = 0; i < private_events.length; i++) {
    updateFreeList(freelist, private_events[i])
  }

  // get all groups that all members are in
  const all_groups = []
  const all_groups_events = []
  for (let i = 0; i < members.length; i++) {

    const group = await Group.find({ members: members[i] })
    for (let j = 0; j < group.length; j++) {
      // duplicates may exist, which is not a problem. removing the same event twice from the free list is not a problem logically
      all_groups.push(group[j])
    }
  }

  //retrieve all group events of all groups
  for (let i = 0; i < all_groups.length; i++) {
    for (let j = 0; j < all_groups[i]["events"].length; j++) {
      const ev = await Event.find({ _id: all_groups[i]["events"][j] })
      // make sure ev is not undefined
      if (ev[0] != null) {
        const ev_start = new Date(ev[0]["start"])
        const ev_end = new Date(ev[0]["end"])
        //only add group events that are within the start and end dates of the group event
        if (ev_start >= start_date && ev_end <= end_date) {
          all_groups_events.push({ start: ev_start, end: ev_end });
        }
      }
    }
  }


  //remove all group events from free list
  for (let i = 0; i < all_groups_events.length; i++) {
    updateFreeList(freelist, all_groups_events[i])
  }

  // now we have a free list that contains all free time slots of all members.
  // Different appraoches are possible to select from the free list. We use the first fit approach 

  // find matching time slot
  const candidate = findAvailableTimeSlot(freelist, input.duration)

  if (candidate == null) {
    return res.status(400).json({ error: 'No available time slot found' })
  } else {
    //add event to database and update user and group events
    try {
      const event = await Event.create({
        title: input.title,
        description: description,
        start: candidate.start,
        end: candidate.end,
        creator: input.user_mail,
        group: input.group
      })

      const target_group = await Group.findOneAndUpdate({ name: input.group }, {
        $push: { events: event }
      })

      // response to frontend
      res.status(200).json({ date: candidate.start })
    }
    catch (error) {
      res.status(400).json({ error: error.message })

    }
  }
}


// create new private event
const createPrivateEvent = async (req, res) => {

  const { title, start, end, user_mail } = req.body;
  const description = "private"
  const creator = user_mail
  try {
    const event = await Event.create({ title, start, end, description, creator })
    const target_user = await User.findOneAndUpdate({ email: user_mail }, {
      $push: { events: event }
    })

    res.status(200).json(event)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// delete an event
const deleteEvent = async (req, res) => {
  const { id, cur_usr } = req.params

  const target_event = await Event.find({ title: id, creator: cur_usr })
  if (!target_event || target_event.length == 0) {
    return res.status(400).json({ error: 'You need admin rights to delete this event' })
  }
  const description = target_event[0]['description']
  if (description == "public") {
    const group = await Group.findOneAndUpdate({ events: [target_event[0]._id] },
      { $pullAll: { events: [target_event[0]._id] } })
    const events = await Event.findOneAndDelete({ title: id, creator: cur_usr })

  }
  else {
    const user = await User.findOneAndUpdate({ email: cur_usr },
      { $pullAll: { events: [target_event[0]._id] } })

    const events = await Event.findOneAndDelete({ title: id, creator: cur_usr })

  }

  res.status(200).json({ sucess: "Deleted" })
}

// private function to update free list
/**
 * This function updates the free list by removing the time slot of the event from the free list
 * there are 4 cases:
 * 1. event is within a free time slot -> split the free time slot into two, one before the event and one after the event
 * 2. event starts before a free time slot and ends within a free time slot -> shorten the free time slot so that it ends at the start of the event
 * 3. event starts within a free time slot and ends after a free time slot -> shorten the free time slot so that it starts at the end of the event
 * 4. event starts before a free time slot and ends after a free time slot -> remove the free time slot from the free list
 */
function updateFreeList(freelist, event) {
  const event_start = new Date(event["start"])
  const event_end = new Date(event["end"])

  for (let i = 0; i < freelist.length; i++) {
    const freelist_start = new Date(freelist[i]["start"])
    const freelist_end = new Date(freelist[i]["end"])

    if (event_start > freelist_start && event_end < freelist_end) {
      freelist[i] = { "start": freelist_start, "end": event_start }
      const new_entry = { "start": event_end, "end": freelist_end }
      freelist.splice(i + 1, 0, new_entry)
      break;
    }
    else if (event_start <= freelist_start && event_end < freelist_end && event_end > freelist_start) {
      freelist[i] = { "start": event_end, "end": freelist_end }
      break;
    }
    else if (event_start > freelist_start && event_end >= freelist_end && event_start < freelist_end) {
      freelist[i] = { "start": freelist_start, "end": event_start }
      break;
    }
    else if (event_start <= freelist_start && event_end >= freelist_end) {
      freelist.splice(i, 1)
      break;
    }
    else {
      continue;
    }
  }
  return freelist
}

// private function to find first available time slot in free list given duration
function findAvailableTimeSlot(freelist, duration) {
  for (let i = 0; i < freelist.length; i++) {
    const freelist_start = new Date(freelist[i]["start"])
    const freelist_end = new Date(freelist[i]["end"])

    const diff = (freelist_end.getTime() - freelist_start.getTime()) / 1000 / 60 / 60

    if (diff >= duration) {
      var end_time = new Date(freelist_start.getTime() + duration * 60 * 60 * 1000)
      var candidate = { "start": new Date(freelist_start), "end": new Date(end_time) }
      return candidate
    }
  }
  return null
}



// get a single event
const getEvent = async (req, res) => {
  try {
    const { id, creator } = req.params;

    const event = await Event.find({ title: id, creator: creator })
    res.status(200).json(event[0]["group"]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

//print free list
function printFreeList(freelist) {
  for (let i = 0; i < freelist.length; i++) {
    console.log("start: " + freelist[i]["start"])
    console.log("end: " + freelist[i]["end"])
  }
}

module.exports = {
  getEvents,
  createGroupEvent,
  createPrivateEvent,
  deleteEvent,
  getEvent
}
