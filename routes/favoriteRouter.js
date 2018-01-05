const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

const Favorites = require('../models/favorite');
const authenticate = require('../authenticate');
const cors = require('./cors');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

// --------------------------------------------------------
// --              ALL FAVORITES ROUTE: GET              --
// --  ONLY REGISTERED USERS CAN PERFORM THIS OPERATION  --
// --------------------------------------------------------
favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req,res,next) => {
    Favorites.findOne({
        "user": req.user._id
    })
    .then((favorites) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorites);
    }, (err) => next(err));
})
// ------------------------------------------------------
// --      ALL FAVORITES ROUTE: POST, PUT, DELETE      --
// --  ONLY ADMIN USERS CAN PERFORM THEESE OPERATIONS  --
// ------------------------------------------------------
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({
        "user": req.user._id
    })
    .then((favorite) => { //Document found.
        if(!!favorite){  //favorite is not null
          req.body.map( dish => { //map every dish object in the array
            console.log(">>>>>>> dish._id: " + dish._id);
            if(!(favorite.dishes.reduce((acc, dishId) => dishId.toString() ==  dish._id ? true || acc: acc, false))){ 
                favorite.dishes.push(dish._id);
            }
          });
          favorite.save()
          .then((favorite) => {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.json(favorite);
          }, (err) => next(err));
        } else{ 
            Favorites.create({user: req.user._id, dishes: req.body})
            .then((favorite) => {
                console.log('Favorite created ', favorite);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            })
        }
    }) 
    .catch((err) => { //Favorite can't be created, error message.
        err = new Error('Favorite for dishes ' + req.body + ' creation error.');
        err.status = 404;
        next(err);
    });
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.remove({
        "user": req.user._id
    })
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err));          
 });

// -----------------------------------------------
// --       SPECIFIC dishId ROUTE : GET       --
// --  ALL USERS CAN PERFORM THEESE OPERATIONS  --
// -----------------------------------------------
favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req,res,next) => {
    Favorites.findById(req.user._id)
    .then((favorite) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorite);
    }, (err) => next(err));
})
// ---------------------------------------------------------
// --     SPECIFIC dishId ROUTE : POST, PUT, DELETE       --
// -- ONLY REGISTERED USERS CAN PERFORM THEESE OPERATIONS --
// ---------------------------------------------------------
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({
        "user": req.user._id
    })
    .then((favorite) => { //Document found.
        if(!!favorite){
          if( favorite.dishes.reduce((acc, dishId) => dishId.toString() == req.params.dishId.toString() ? true || acc: acc, false)){ 
            err = new Error('Dish: ' + req.params.dishId + ' is already favorite for user: ' + req.user._id + ' !');
            err.status = 403;
            next(err);
          } else{ //Dishes array does not contain dishId already.
                favorite.dishes.push(req.params.dishId);
                favorite.save()
                    .then((favorite) => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorite);
                    }, (err) => next(err));
            }
        } else{
            Favorites.create({'user': req.user._id, dishes: [req.params.dishId]})
            .then((favorite) => {
                console.log('Favorite created ', favorite);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            })
        }

    }) 
    .catch((err) => { //Favorite can't be created, error message.
        err = new Error('Favorite for dish ' + req.params.dishId + ' creation error.');
        err.status = 404;
        next(err);
    });
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites/' + req.params.dishId );
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({
        "user": req.user._id
    })
    .then((favorite) => {
        if(favorite.dishes.indexOf(req.params.dishId) >= 0){
            favorite.dishes = favorite.dishes.filter(dishId => dishId.toString() != req.params.dishId );
            favorite.save()
                .then((resp) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(resp);
                }, (err) => next(err));        
        }else {
            err = new Error('Favorite dish ' + req.params.dishId + ' not found.');
            err.status = 404;
            next(err);
        }
    })    
    .catch((err) => { //Error on deleting dish
        err = new Error('Favorite dish ' + req.params.dishId + ' deletion error.');
        err.status = 404;
        next(err);
    });        
});

module.exports = favoriteRouter;