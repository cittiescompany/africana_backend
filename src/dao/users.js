const { isValidObjectId } = require('mongoose');
const User = require('../models/users.js');

// (async()=>{
//     {
//         try {
            
//             await User.deleteMany({email:"adiodamilare44@gmail.com"})
//             console.log("User deleted successfully")
//         } catch (error) {
//             console.error("Error deleting user:", error.message);
            
//         }
//     }
// })();


const UserDAO={
    
    async create(body){
        return User.create(body);
    },
    async getOne(args,options){
        if(args._id&& !isValidObjectId(args._id))return null;
        const builder=User.findOne(args)
        if(options) builder.select(`${options}`);
        return builder;
    },
    async getAll(){
        const builder=User.find()
        return builder;
    }
}

module.exports = UserDAO;