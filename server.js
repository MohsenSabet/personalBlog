/*********************************************************************************
*  WEB322 – Assignment 02
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: Mohsen Sabet Student ID: 113205165 Date: 2023-06-05
*  Cyclic Web App URL: https://busy-tick-pea-coat.cyclic.app
*
*  GitHub Repository URL: https://github.com/MohsenSabet/web322-app.git
*
********************************************************************************/ 

const express = require('express');
const path = require('path');
const blogService = require('./blog-service');

const app = express();
const port = process.env.PORT || 8080;

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.redirect('/about');
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname + '/views/about.html'));
});

app.get('/blog', (req, res) => {
    blogService.getPublishedPosts().then(data => res.json(data)).catch(err => res.json({ message: err }));
});

app.get('/posts', (req, res) => {
    blogService.getAllPosts().then(data => res.json(data)).catch(err => res.json({ message: err }));
});

app.get('/categories', (req, res) => {
    blogService.getCategories().then(data => res.json(data)).catch(err => res.json({ message: err }));
});

app.use((req, res) => {
    res.status(404).send('Page Not Found');
});

blogService.initialize().then(() => {
    app.listen(port, () => console.log(`Express http server listening on port ${port}`));
}).catch(err => console.error(`Error initializing blog service: ${err}`));
