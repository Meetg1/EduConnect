const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new mongoose.Schema({
 	fullname: {
		type: String,
		required: true
	},
	email: {
		type: String,
		required: true
	},
	university: {
		type: String,
		required: true
	}
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);
