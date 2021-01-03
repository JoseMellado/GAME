const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserStudySchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true},
    study: { type: Schema.Types.ObjectId, ref: 'Study', required: true},
    progress: { type: [{
        challenge: {type: Schema.Types.ObjectId, ref: 'Challenge'},
        pre_test: {type: Boolean, default: false},
        post_test: {type: Boolean, default: false},
        started: {type: Boolean, default: false},
        finished: {type: Boolean, default: false},
        _id: false,
        id: false
      }], default: []},
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Sets the createdAt parameter equal to the current time
UserStudySchema.pre('save', next => {
    now = new Date();
    if(!this.createdAt) {
      this.createdAt = now;
    }
    if(!this.updatedAt) {
      this.updatedAt = now;
    }
    next();
});

module.exports = mongoose.model('UserStudy', UserStudySchema);