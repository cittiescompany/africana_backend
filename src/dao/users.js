import { isValidObjectId } from 'mongoose';
import User from '../models/users.js';

const UserDAO={
    async create(body){
        return User.create(body);
    },
    async getOne(args,options={}){
        if(args._id&& !isValidObjectId(args._id))return null;
        const builder=User.findOne(args)
        if(options?.returnPassword) builder.select("+password");
        return builder;
    }
}

export default UserDAO;