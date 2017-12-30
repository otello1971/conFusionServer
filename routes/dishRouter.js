const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

const Dishes = require('../models/dishes');
var authenticate = require('../authenticate');

const dishRouter = express.Router();

dishRouter.use(bodyParser.json());

// -------------------------------------------
// --           ALL DISHES ROUTE            --
// -------------------------------------------
dishRouter.route('/')
.get((req,res,next) => {
    Dishes.find({})
    .then((dishes) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(dishes);
    }, (err) => next(err));
})
.post(authenticate.verifyUser, (req, res, next) => {
    Dishes.create(req.body)
    .then((dish) => {
        console.log('Dish Created ', dish);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(dish);
    }, (err) => next(err));
})
.put(authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /dishes');
})
.delete(authenticate.verifyUser, (req, res, next) => {
    Dishes.remove({})
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err));    
});

// -------------------------------------------
// --        SPECIFIC DishId ROUTE          --
// -------------------------------------------
dishRouter.route('/:dishId')
.get((req,res,next) => {
    Dishes.findById(req.params.dishId)
    .then((dish) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(dish);
    }, (err) => next(err));
})
.post(authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('POST operation not supported on /dishes/'+ req.params.dishId);
})
.put(authenticate.verifyUser, (req, res, next) => {
    Dishes.findByIdAndUpdate(req.params.dishId, {
        $set: req.body
    }, { new: true })
    .then((dish) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(dish);
    }, (err) => next(err));
})
.delete(authenticate.verifyUser, (req, res, next) => {
    Dishes.findByIdAndRemove(req.params.dishId)
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err));
});

// ------------------------------------------------------
// --      ALL COMMENTS FOR SPECIFIC DishId ROUTE      --
// ------------------------------------------------------
dishRouter.route('/:dishId/comments')
.get((req,res,next) => {
    Dishes.findById(req.params.dishId)
    .then((dish) => {
        if (!!dish){
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(dish.comments);
        }else{
            err = new Error('Dish ' + req.params.dishId + ' not found');
            err.status = 404;
            throw err;
        }
    }, (err) => next(err));
})
.post(authenticate.verifyUser, (req, res, next) => {
    Dishes.findById(req.params.dishId)
    .then((dish) => {
        if (!!dish){
            dish.comments.push(req.body);
            dish.save()
            .then((dish) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(dish);                
            }, (err) => next(err));
        }else{
            err = new Error('Dish ' + req.params.dishId + ' not found');
            err.status = 404;
            throw err;
        }
    }, (err) => next(err));
})
.put(authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /dishes/'
        + req.params.dishId + '/comments');
})
.delete(authenticate.verifyUser, (req, res, next) => {
    Dishes.findById(req.params.dishId)
    .then((dish) => {
        if (!!dish){
            for (let comment of dish.comments) {
                dish.comments.id(comment._id).remove();
            }
            dish.save()
            .then((dish) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(dish);                
            }, (err) => next(err));
        }else{
            err = new Error('Dish ' + req.params.dishId + ' not found');
            err.status = 404;
            throw err;
        }
    }, (err) => next(err));
});

// ------------------------------------------------------
// --  SPECIFIC CommentId FOR SPECIFIC DishId ROUTE    --
// ------------------------------------------------------
dishRouter.route('/:dishId/comments/:commentId')
        .get((req,res,next) => {
                Dishes.findOne({  //Queries dishId and commentId altogether.
                    "_id" : req.params.dishId,
                    "comments._id" : req.params.commentId 
                })
            .then((dish) => { //Document found.
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(dish.comments.id(req.params.commentId));
               }, (err) => { //Document not found, error message.
                    err = new Error('Comment ' + req.params.commentId + ' not found');
                    err.status = 404;
                    next(err);})
        })
        .post(authenticate.verifyUser, (req, res, next) => {
            res.statusCode = 403;
            res.end('POST operation not supported on /dishes/'+ req.params.dishId
                + '/comments/' + req.params.commentId);
        })
        .put(authenticate.verifyUser, (req, res, next) => {
            Dishes.findOne({  //Queries dishId and commentId altogether.
                "_id" : req.params.dishId,
                "comments._id" : req.params.commentId 
            })
            .then((dish) => { //Document found.
                    let comment = dish.comments.id(req.params.commentId)
                    comment.rating = req.body.rating ? req.body.rating : comment.rating;
                    comment.comment = req.body.comment ? req.body.comment : comment.comment;                
                    dish.save()
                        .then((dish) => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(dish);                
                            }, (err) => next(err));
                }, (err) => { //Document not found, error message.
                    err = new Error('Comment ' + req.params.commentId + ' not found');
                    err.status = 404;
                    next(err);})
        })
        .delete(authenticate.verifyUser, (req, res, next) => {
            Dishes.findOne({  //Queries dishId and commentId altogether.
                "_id" : req.params.dishId,
                "comments._id" : req.params.commentId 
            })
            .then((dish) => { //Document found.
                    dish.comments.id(req.params.commentId).remove();
                    dish.save()
                        .then((dish) => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(dish);                
                        }, (err) => next(err));
            }, (err) => { //Document not found, error message.
                err = new Error('Comment ' + req.params.commentId + ' not found');
                err.status = 404;
                next(err);})
        });
        

module.exports = dishRouter;