const { isValidObjectId } = require('mongoose');
const User = require('../models/users.js');

const UserDAO={
    
    async create(body){
        return User.create(body);
    },
    async getOne(args,options={}){
        if(args._id&& !isValidObjectId(args._id))return null;
        const builder=User.findOne(args)
        if(options?.returnPassword) builder.select("+password");
        return builder;
    },
    async getAll(){
        const builder=User.find()
        return builder;
    }
}

module.exports = UserDAO;