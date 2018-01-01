const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

const Leaders = require('../models/leaders');
var authenticate = require('../authenticate');

const leaderRouter = express.Router();

leaderRouter.use(bodyParser.json());

// -----------------------------------------------
// --         ALL LEADERS ROUTE: GET            --
// --  ALL USERS CAN PERFORM THEESE OPERATIONS  --
// -----------------------------------------------
leaderRouter.route('/')
.get((req,res,next) => {
    Leaders.find({})
    .then((leaders) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(leaders);
    }, (err) => next(err));
})
// ------------------------------------------------------
// --      ALL LEADERS ROUTE: POST, PUT, DELETE        --
// --  ONLY ADMIN USERS CAN PERFORM THEESE OPERATIONS  --
// ------------------------------------------------------
.post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Leaders.create(req.body)
    .then((leader) => {
        console.log('Leader Created ', leader);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(leader);
    }, (err) => next(err));        
})
.put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /leaders');
})
.delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Leaders.remove({})
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err));          
 });

// -----------------------------------------------
// --       SPECIFIC LeaderId ROUTE : GET       --
// --  ALL USERS CAN PERFORM THEESE OPERATIONS  --
// -----------------------------------------------
leaderRouter.route('/:leaderId')
.get((req,res,next) => {
    Leaders.findById(req.params.leaderId)
    .then((leader) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(leader);
    }, (err) => next(err));
})
// ----------------------------------------------------
// --   SPECIFIC LeaderId ROUTE : POST, PUT, DELETE  --
// -- ONLY ADMIN USERS CAN PERFORM THEESE OPERATIONS --
// ----------------------------------------------------
.post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('POST operation not supported on /leaders/'+ req.params.leaderId);
})
.put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Leaders.findByIdAndUpdate(req.params.leaderId, {
        $set: req.body
    }, { new: true })
    .then((leader) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(leader);
    }, (err) => next(err));        
})
.delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Leaders.findByIdAndRemove(req.params.leaderId)
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err));        
});

module.exports = leaderRouter;