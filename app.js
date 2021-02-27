const mongoose = require('mongoose');
require('./config/db');

const express = require("express");

const exphbs = require("express-handlebars");

const router = require("./routes");
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session')
const MongoStore = require('connect-mongo')(session);
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const createError = require('http-errors');


const passport = require('./config/passport');

require('dotenv').config({ path: 'variables.env' });

const app = express();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(expressValidator());

app.engine(
  ".hbs",
  exphbs({
    defaultLayout: "layout",
    helpers: require('./helpers/handlebars'),
    extname: '.hbs', 
  })
);

app.set('view engine', 'hbs');

app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieParser());

app.use(session({

  secret: process.env.SECRETO,
  key: process.env.KEY,
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({ mongooseConnection: mongoose.connection }) //almacenar la sesión en moongose

}));


app.use(flash());


app.use(passport.initialize());
app.use(passport.session());


app.use((req, res, next) => {

  res.locals.mensajes = req.flash();
  next();
});

app.use("/", router());

app.use((req, res, next) => {

  next(createError(404, 'No encontrado'));

});



app.use((error, req, res) => {

  res.locals.mensaje = error.message;
  const status = error.status || 500;

  res.locals.status = status;
  res.status(status);

  res.render('error')

})


const host = '0.0.0.0';
const port = process.env.PORT;

app.listen(port,host, () =>{

  console.log('El servidor está funcionando')

});