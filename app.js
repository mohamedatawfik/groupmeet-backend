require('dotenv').config()
var createError = require('http-errors');
var express = require('express');
const mongoose = require("mongoose");
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./src/routes/index');
var homeRouter = require('./src/routes/home');
var groupsRouter = require('./src/routes/groups');
var eventsRouter = require('./src/routes/events');
var authRoutes = require('./src/routes/authRoutes');

var app = express();
const cors = require('cors');
app.use(cors());
app.disable('etag');
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// middleware
app.use(express.json())

app.use((req, res, next) => {
  console.log(req.path, req.method)
  next()
})

// routes
app.use('/', indexRouter);
app.use('/home', homeRouter);
app.use('/groups', groupsRouter);
app.use('/events', eventsRouter);
app.use('/auth', authRoutes);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


// connect to db
mongoose.connect('mongodb+srv://Abdul:b2sFAN27A9dqoe4V@cluster0.jmvw9bt.mongodb.net/?retryWrites=true&w=majority')
  .then(() => {
    console.log('connected to database')
    // listen to port
    // app.listen(3001, () => {
    //   console.log('listening for requests on port', 3001)
    // })
  })
  .catch((err) => {
    console.log(err)
  }) 

module.exports = app;
