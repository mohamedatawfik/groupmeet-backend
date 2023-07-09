const Event = require('../models/event');
const Group = require('../models/group');
const User = require('../models/user');
const mongoose = require('mongoose')

// get all events
const getEvents = async (req, res) => {
  try {
    const {cur_usr} = req.params;

    //get group events
    const groups = await Group.find({members: cur_usr})
    const events_list = [];
    for(let i=0;i<groups.length;i++)
    {
      for(let j=0;j<groups[i]["events"].length;j++)
    {
      const ev = await Event.find({_id: groups[i]["events"][j]})
      events_list.push(ev[0]);
    }

    }
    //get private events
    const user = await User.find({email: cur_usr})
    let events_ids = user[0]["events"];
    for(let i=0;i<events_ids.length;i++)
    {
      const ev = await Event.find({_id: events_ids[i]})
      events_list.push(ev[0]);      
    }

    res.status(200).json(events_list);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}


// create new event
const createEvent = async (req, res) => {

  const {title, group, start, end, user_mail} = req.body;
  const description = "public"
  const creator = user_mail

  try {
    const event = await Event.create({title, start, end, description,creator})
    const target_group = await Group.findOneAndUpdate({name: group}, {
      $push:{events: event}
    })

    res.status(200).json(event)
  } catch (error) {
    res.status(400).json({error: error.message})
  }
}


// create new private event
const createPrivateEvent = async (req, res) => {

  const {title, start, end, user_mail} = req.body;
  const description = "private"
  const creator = user_mail
  try {
    const event = await Event.create({title, start, end, description,creator})
    const target_user = await User.findOneAndUpdate({email: user_mail}, {
      $push:{events: event}
    })

    res.status(200).json(event)
  } catch (error) {
    res.status(400).json({error: error.message})
  }
}

// delete an event
const deleteEvent = async (req, res) => {
    const { id, cur_usr } = req.params

    const target_event = await Event.find({title: id, creator: cur_usr})
    if(!target_event || target_event.length == 0) {
      return res.status(400).json({error: 'You need admin rights to delete this event'})
    }
    const description = target_event[0]['description']
    if(description == "public")
    {
      const group = await Group.findOneAndUpdate({ events:[target_event[0]._id] }, 
            { $pullAll: { events: [target_event[0]._id] } } )
     const events = await Event.findOneAndDelete({title: id, creator: cur_usr})

    }
    else
    {
      const user = await User.findOneAndUpdate({ email: cur_usr }, 
        { $pullAll: { events: [target_event[0]._id] } } )

      const events = await Event.findOneAndDelete({title: id, creator: cur_usr})

    }
  
    res.status(200).json({sucess:"Deleted"})
  }

module.exports = {
 getEvents,
 createEvent,
 createPrivateEvent,
 deleteEvent
}