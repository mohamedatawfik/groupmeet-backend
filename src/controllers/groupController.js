const Group = require('../models/group')
const User = require('../models/user')
const mongoose = require('mongoose')

// get all groups
const getGroups = async (req, res) => {
  const {cur_usr} = req.params;
  const groups = await Group.find({members: cur_usr})

  res.status(200).json(groups)
}

// get a single group
const getGroup = async (req, res) => {
  const { id } = req.params

  const group = await Group.find({name:id})
  
  if (!group || group.length == 0) {
    return res.status(404).json({error: 'No such group'})
  }

  res.status(200).json(group)
}

// create new group
const createGroup = async (req, res) => {
    const {name, members} = req.body
    const creator = members[0];
    
    try {
      // create a group with the current user as the creator and the only member in the group
      const group = await Group.create({name, members,creator})
      const user = await User.findOneAndUpdate({email: creator}, {
        $push:{groups: group}
      })
      res.status(200).json(group)
    } catch (error) {
      res.status(400).json({error: error.message})
    }
  }

// delete a group
const deleteGroup = async (req, res) => {
    const { id, cur_usr } = req.params

    const target_group = await Group.find({name: id, creator: cur_usr})

    // only a creator of a group can delete it
    if(target_group[0]['creator'] != cur_usr) {
      return res.status(404).json({error: 'You need admin rights to delete this group'})
    }
    
    // delete the group from the groups list of it's members
    let members = target_group[0]['members'];
    for(let i=0;i<members.length;i++)
    {
      const user = await User.findOneAndUpdate({ email:members[i] }, 
        { $pullAll: { groups: [target_group[0]._id] } } )
    }
    const group = await Group.findOneAndDelete({name: id, creator: cur_usr})
  
    if(!group || group.length == 0) {
      return res.status(400).json({error: 'No such group'})
    }
  
    res.status(200).json(group)
  }

  // delete a group member
const deleteGroupMember = async (req, res) => {

  const check_group = await Group.find({name:req.body.name})

  if(req.body.cur_user == req.body.members || req.body.cur_user == check_group[0].creator){
  const group = await Group.updateOne({ name: req.body.name }, 
    { $pullAll: { members: [req.body.members] } } )
  
  const target_group = await Group.find({name:req.body.name})
  console.log(target_group)
  const user = await User.findOneAndUpdate({ email: req.body.members }, 
    { $pullAll: { groups: [target_group[0]._id] } } )


  if(!group || group.length == 0) {
    return res.status(400).json({error: 'ERROR'})
  }

  res.status(200).json(group)
}
else
{
  return res.status(400).json({error: 'Please make sure you have admin right'})
}
}
  
  // Adding a new member to a group
  const updateGroup = async (req, res) => {
    const { id } = req.params
    const user = await User.find({email:req.body.members})
    
    if (!user || user.length == 0) {
      return res.status(404).json({error: 'No such user found'})
    }

    const group = await Group.findOneAndUpdate({name: id, creator: req.body.cur_user}, {
      $push:{members: req.body.members}
    })
    
    const target_group = await Group.find({name: id, creator: req.body.cur_user})
    const target_user = await User.findOneAndUpdate({email: req.body.members}, {
      $push:{groups: target_group}
    })

    if (!group || group.length == 0) {
      return res.status(400).json({error: 'Please make sure you have admin right'})
    }
  
    res.status(200).json(group)
  }

module.exports = {
  getGroups,
  getGroup,
  createGroup,
  deleteGroup,
  updateGroup,
  deleteGroupMember
}
