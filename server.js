const express = require('express');
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const path = require('path');
const blogService = require('./blog-service');

const app = express();
const port = process.env.PORT || 8080;

app.use(express.static('public'));

// Cloudinary configuration
cloudinary.config({
  cloud_name: 'dfqzv9lmt',
  api_key: '477162326162133',
  api_secret: 'IsD5aRXlrVjgmTK4oRt--UznW6c',
  secure: true
});

// Create the upload variable without disk storage
const upload = multer(); // no { storage: storage } since we are not using disk storage

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
  const category = req.query.category;
  const minDate = req.query.minDate;

  if (category) {
    blogService.getPostsByCategory(category)
      .then((data) => res.json(data))
      .catch((err) => res.json({ message: err }));
  } else if (minDate) {
    blogService.getPostsByMinDate(minDate)
      .then((data) => res.json(data))
      .catch((err) => res.json({ message: err }));
  } else {
    blogService.getAllPosts()
      .then((data) => res.json(data))
      .catch((err) => res.json({ message: err }));
  }
});

app.get('/categories', (req, res) => {
  blogService.getCategories().then(data => res.json(data)).catch(err => res.json({ message: err }));
});

app.get('/posts/add', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'addPost.html'));
});

// Add the "Post" route
app.post('/posts/add', upload.single('featureImage'), (req, res) => {
  if (req.file) {
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream(
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    async function upload(req) {
      let result = await streamUpload(req);
      console.log(result);
      return result;
    }

    upload(req).then((uploaded) => {
      processPost(uploaded.url);
    });
  } else {
    processPost('');
  }

  function processPost(imageUrl) {
    const postData = {
      title: req.body.title,
      content: req.body.content,
      featureImage: imageUrl,
      published: req.body.published === 'true',
    };

    blogService.addPost(postData)
      .then((savedPost) => {
        res.redirect('/posts');
      })
      .catch((error) => {
        console.error('Error saving blog post:', error);
        res.status(500).send('An error occurred while saving the blog post.');
      });
  }
});

app.get('/post/:id', (req, res) => {
  const postId = req.params.id;

  blogService.getPostById(postId)
    .then((data) => res.json(data))
    .catch((err) => res.json({ message: err }));
});

app.use((req, res) => {
  res.status(404).send('Page Not Found');
});

blogService.initialize().then(() => {
  app.listen(port, () => console.log(`Express http server listening on port ${port}`));
}).catch(err => console.error(`Error initializing blog service: ${err}`));
