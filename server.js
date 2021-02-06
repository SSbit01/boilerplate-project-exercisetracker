require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
//
const bodyParser = require("body-parser");

const mongoose = require("mongoose");
mongoose.connect(
  process.env.MONGO_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
);

const userSchema = new mongoose.Schema({
  username: {type:String, required:true}
});
const User = mongoose.model("fcc-exercisetracker-users", userSchema);

const exerciseSchema = new mongoose.Schema({
  userId: {type:String, required:true},
  date: String,
  duration: {type:Number, required:true},
  description: {type:String, required:true}
});
const Exercise = mongoose.model("fcc-exercisetracker-exercises", exerciseSchema);
//

//
app.use(bodyParser.urlencoded({extended:false}));
//
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//
app.post("/api/exercise/new-user", (req,res) => {
  User.findOne({username:req.body.username}, (err,data) => {
    if (data === null) {
      let nUser = new User({
        username: req.body.username
      });
      nUser.save((err,d) => {
        res.json(d);
      });
    } else {
      res.json({error:"Username already taken"});
    }
  });
});

app.get("/api/exercise/users", (req,res) => {
  User.find({}, (err,data) => {
    res.json(data);
  });
});

function err_not_found(id) {
  return {error: `UserId '${id}' not found`}
}

app.post("/api/exercise/add", (req,res) => {
  let rb = req.body;
  User.findById(rb.userId, (err,data) => {
    if (err) {
      res.json(err_not_found(rb.userId));
    } else {
      let nExercise = new Exercise({
        userId: rb.userId,
        date: ((rb.date==""||rb.date===undefined)?new Date():new Date(rb.date)).toDateString(),
        duration: rb.duration,
        description: rb.description
      });
      nExercise.save((err,d) => {
        res.json({_id:d.userId, username:data.username, date:d.date, duration:d.duration, description:d.description});
      });
    }
  });
});

app.get("/api/exercise/log", (req,res) => {
  let rq = req.query;
  User.findById(rq.userId, (err,data) => {
    if (err) {
      res.json(err_not_found(rq.userId));
    } else {
      Exercise.find({userId:rq.userId}, (err,d) => {
        let user = {_id:data.id, username:data.username};
        let log = d.map(d => (({description,duration,date})=>({description,duration,date}))(d));
        if (rq.from !== undefined) {
          let froM = new Date(rq.from).getTime();
          log = log.filter(d => new Date(d.date).getTime()>=froM);
        }  
        if (rq.to !== undefined) {
          let to = new Date(rq.to).getTime();
          log = log.filter(d => new Date(d.date).getTime()<to);
        } 
        log = (rq.limit!==undefined)?log.slice(0,rq.limit):log;
        user.count = log.length;
        user.log = log;
        res.json(user);
      });
    }
  });
});
//

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})