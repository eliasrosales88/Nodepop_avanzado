var mongoose = require('mongoose');

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

const connectDb = () => {

  return mongoose.connect(process.env.MONGODB_URL);


};
module.exports = connectDb;