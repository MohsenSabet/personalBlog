
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');


const loginHistorySchema = new Schema({
    dateTime: Date,
    userAgent: String
});

const userSchema = new Schema({
    userName: {
        type: String,
        unique: true
    },
    password: String,
    email: String,
    loginHistory: [loginHistorySchema]
});

let User; // to be defined on new connection (see initialize)

module.exports.initialize = function () {
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection("mongodb+srv://msabet:6ea2dfMSK@senecaweb.nrvmhlb.mongodb.net/Web_App_6?retryWrites=true&w=majority");

        db.on('error', (err)=>{
            reject(err); // reject the promise with the provided error
        });
        db.once('open', ()=>{
           User = db.model("users", userSchema);
           resolve();
        });
    });
};



module.exports.registerUser = function(userData) {
    return new Promise((resolve, reject) => {
        
        // Step 1: Check if passwords match
        if (userData.password !== userData.password2) {
            reject("Passwords do not match");
            return; // Stop the function execution here
        }

        // Step 2: Encrypt the password before saving the user
        bcrypt.hash(userData.password, 10)
        .then(hash => {
            // Use the hashed password
            userData.password = hash;
            
            // Step 3: Create a new User instance
            let newUser = new User(userData);
            
            // Step 4: Save the new user to the MongoDB database
            return newUser.save();
        })
        .then(() => {
            resolve("User saved");
        })
        .catch(err => {
            if (err.code === 11000) {
                reject("User Name already taken");
            } else if (err.message === "There was an error encrypting the password") {
                reject(err.message);
            } else {
                reject("There was an error creating the user: " + err);
            }
        });
    });
};


module.exports.checkUser = function(userData) {
    return new Promise((resolve, reject) => {
        
        // Step 1: Use find() to search for users with a matching userName
        User.find({ userName: userData.userName })
        .exec()
        .then(users => {
            
            // Step 2: Handle different scenarios

            // No user found
            if (users.length === 0) {
                reject(`Unable to find user: ${userData.userName}`);
                return; // Stop further execution
            }

            const user = users[0];

            // Using bcrypt to compare the passwords
            return bcrypt.compare(userData.password, user.password)
                .then(result => {
                    if (!result) {  // If passwords do not match
                        reject(`Incorrect Password for user: ${userData.userName}`);
                        return; // Stop further execution
                    }

                    // Password matches, so update login history
                    user.loginHistory.push({
                        dateTime: (new Date()).toString(),
                        userAgent: userData.userAgent
                    });

                    return User.updateOne(
                        { userName: user.userName },
                        { $set: { loginHistory: user.loginHistory } }
                    );
                })
                .then(() => {
                    resolve(user);  // If update was successful, resolve with the user object
                });

        }).catch(err => {
            reject(`Unable to find user: ${userData.userName}`);
        });
    });
};

