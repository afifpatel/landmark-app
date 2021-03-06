'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _mongodb = require('mongodb');

var _issue = require('./issue.js');

var _issue2 = _interopRequireDefault(_issue);

require('babel-polyfill');

var _sourceMapSupport = require('source-map-support');

var _sourceMapSupport2 = _interopRequireDefault(_sourceMapSupport);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//To let Node.js report line numbers by using source maps, we need to install thesource-map-support module, and also call the library in the application once
//ES2015 
//ES2015 
// const express =  require('express');
// const bodyParser= require('body-parser');
// const MongoClient = require('mongodb').MongoClient;
// const Issue = require('./issue.js');


_sourceMapSupport2.default.install();

//deployment changes
//ES2015 
//ES2015 
const path = require("path");

const app = (0, _express2.default)();
// app.use(express.static('static'));
app.use(_bodyParser2.default.json());

//deployment change
// app.use(express.static(path.join(__dirname, "client", "build")))

//deployment change
// app.get("*", (req, res) => {
//     res.sendFile(path.resolve('static/index.html'));
// });

//deployment change

const PORT = process.env.PORT || 3000;
let db;
_mongodb.MongoClient.connect(process.env.MONGODB_URI || 'mongodb://localhost').then(client => {
    db = client.db('lmr');
    app.listen(PORT, () => {
        console.log('App startedddddd on port 3000');
    });
}).catch(error => {
    console.log('ERROR:', error);
});

app.get('/api/landmarks', (req, res) => {
    const filter = {};

    if (req.query.owner) filter.owner = req.query.owner;

    if (req.query.text) {
        filter['$text'] = { "$search": req.query.text
            // console.log("Text filter", filter)
        };
    }
    console.log("Text filter", filter);
    db.collection('lmr').find(filter).toArray().then(landmarks => {
        const metadata = { total_count: landmarks.length };
        res.json({ _metadata: metadata, records: landmarks });
    }).catch(error => {
        console.log(error);
        res.status(500).json({ message: `Internal Server Error: ${error}` });
    });
});

app.get('/api/landmark/:id', (req, res) => {
    let issueId;
    console.log("PARAMSSS ", req.params);
    try {
        issueId = new _mongodb.ObjectId(req.params.id);
    } catch (error) {
        res.status(422).json({ message: `Invalid issue ID format: ${error}` });
        return;
    }

    db.collection('lmr').find({ _id: issueId }).limit(1).next().then(issue => {
        console.log("landmark retrieved from data ", issue);
        if (!issue) res.status(404).json({ message: `No such issue: ${issueId}` });else res.json(issue);
    }).catch(error => {
        console.log(error);
        res.status(500).json({ message: `Internal Server Error: ${error}` });
    });
});

app.post('/api/landmark', (req, res) => {
    const newLandmark = req.body;
    newLandmark.date = new Date();
    newLandmark.location.lat = parseFloat(newLandmark.location.lat);
    newLandmark.location.lng = parseFloat(newLandmark.location.lng);
    console.log(JSON.stringify(newLandmark));

    db.collection('lmr').insertOne(newLandmark).then(result => db.collection('lmr').findOne({ _id: result.insertedId })).then(query_result => db.collection('lmr').count().then(metadata => res.json({ _metadata: metadata, new_landmark: query_result }))).catch(err => {
        console.log(err);
        res.status(500).json({ message: `Internal Server Error: ${err}` });
    });
});

app.put('/api/landmark/:id', (req, res) => {
    let landmarkId;
    try {
        landmarkId = new _mongodb.ObjectId(req.params.id);
    } catch (error) {
        res.status(422).json({ message: `Invalid issue ID format: ${error}` });
        return;
    }

    const landmark = req.body;
    console.log("landmark put req body", landmark);

    delete landmark._id;

    //   console.log("issue =>",issue);
    if (landmark.location) {
        landmark.location.lat = parseFloat(landmark.location.lat);
        landmark.location.lng = parseFloat(landmark.location.lng);
    }
    // landmark.date = new Date(landmark.date);
    landmark.date = new Date(); //Last Updated


    console.log(JSON.stringify(landmark));

    //   const err = Issue.validateIssue(landmark);
    //   if (err) {
    //     res.status(422).json({ message: `Invalid request: ${err}` });
    //     return;
    //   }

    db.collection('lmr').updateOne({ _id: landmarkId }, { $set: landmark }).then(() => db.collection('lmr').find({ _id: landmarkId }).limit(1).next()).then(savedLandmark => {
        res.json(savedLandmark);
    }).catch(error => {
        console.log(error);
        res.status(500).json({ message: `Internal Server Error: ${error}` });
    });
});

app.delete('/api/landmark/:id', (req, res) => {
    let landmarkId;
    try {
        landmarkId = new _mongodb.ObjectId(req.params.id);
    } catch (error) {
        res.status(422).json({ message: `Invalid issue ID format: ${error}` });
        return;
    }

    db.collection('lmr').deleteOne({ _id: landmarkId }).then(deleteResult => {
        if (deleteResult.result.n === 1) res.json({ status: 'OK' });else res.json({ status: 'Warning: object not found' });
    }).catch(error => {
        console.log(error);
        res.status(500).json({ message: `Internal Server Error: ${errror}` });
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.resolve('client/public/index.html'));
});
//# sourceMappingURL=server.js.map