/*********************************************************************************
*  WEB322 – Assignment 05
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part 
*  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: Mohsen Sabet Student ID: 113205165 Date: 2023-07-26
*  Cyclic Web App URL: https://busy-tick-pea-coat.cyclic.app
*  GitHub Repository URL: https://github.com/MohsenSabet/web322-app.git
*
********************************************************************************/ 

const express = require('express');
const app = express();
const blogService = require('./blog-service');
const path = require('path');

const exphbs  = require('express-handlebars');

const stripJs = require('strip-js');
const hbs = require('hbs');

const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');


app.engine('.hbs', exphbs.engine({
  extname: '.hbs',
  helpers: {
    navLink: function(url, options) {
      return '<li' +
        ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
        '><a href="' + url + '">' + options.fn(this) + '</a></li>';
    },
    equal: function(lvalue, rvalue, options) {
      if (arguments.length < 3)
        throw new Error("Handlebars Helper equal needs 2 parameters");
      if (lvalue != rvalue) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    }
  }
}));

app.set('view engine', '.hbs');
hbs.registerHelper('safeHTML', function(context) {
  return new hbs.SafeString(stripJs(context));
});

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
const upload = multer(); 

// Middleware to set activeRoute and viewingCategory
app.use(function(req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});

app.get('/', (req, res) => {
  res.redirect('/blog');
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.get('/blog', async (req, res) => {

  // Declare an object to store properties for the view
  let viewData = {};

  try{

      // declare empty array to hold "post" objects
      let posts = [];

      // if there's a "category" query, filter the returned posts by category
      if(req.query.category){
          // Obtain the published "posts" by category
          posts = await blogService.getPublishedPostsByCategory(req.query.category);
      }else{
          // Obtain the published "posts"
          posts = await blogService.getPublishedPosts();
      }

      // sort the published posts by postDate
      posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

      // get the latest post from the front of the list (element 0)
      let post = posts[0]; 

      // store the "posts" and "post" data in the viewData object (to be passed to the view)
      viewData.posts = posts;
      viewData.post = post;

  }catch(err){
      viewData.message = "no results";
  }

  try{
      // Obtain the full list of "categories"
      let categories = await blogService.getCategories();

      // store the "categories" data in the viewData object (to be passed to the view)
      viewData.categories = categories;
  }catch(err){
      viewData.categoriesMessage = "no results"
  }

  // render the "blog" view with all of the data (viewData)
  res.render("blog", {data: viewData})

});

app.get('/blog/:id', async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try {
    let posts = [];

    if(req.query.category){
      posts = await blogService.getPublishedPostsByCategory(req.query.category);
    } else {
      posts = await blogService.getPublishedPosts();
    }

    // sort the published posts by postDate
    posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

    viewData.posts = posts;

    // Log the 'posts' array to the console
    console.log(posts);

  } catch(err) {
    viewData.message = "no results";
  }

  try {
    viewData.post = await blogService.getPostById(req.params.id);

    // Log the 'post' object to the console
    console.log(viewData.post);

  } catch(err) {
    viewData.message = "no results"; 
  }

  try {
    let categories = await blogService.getCategories();
    viewData.categories = categories;

    // Log the 'categories' array to the console
    console.log(categories);

  } catch(err) {
    viewData.categoriesMessage = "no results"
  }

  // render the "blog" view with all of the data (viewData)
  res.render("blog", {data: viewData})
});


app.get('/posts', function(req, res) {
  blogService.getAllPosts()
      .then((data) => {
          if (data.length > 0) {
              res.render("posts", {posts: data});
          } else {
              res.render("posts", {message: "no results"});
          }
      })
      .catch((err) => {
          res.render("posts", {message: err});
      });
});




app.get("/categories", (req, res) => {
  blogService.getCategories().then((data) => {
      if (data.length > 0) {
          res.render("categories", { categories: data });
      } else {
          res.render("categories", { message: "no results" });
      }
  }).catch((err) => {
      res.render("categories", { message: `error: ${err}` });
  });
});

app.use(express.urlencoded({ extended: true }));


app.get('/posts/add', (req, res) => {
  blogService.getCategories().then(data => {
      res.render('addPost', { categories: data });
  }).catch(error => {
      console.log(`Error fetching categories: ${error}`);
      res.render('addPost', { categories: [] });
  });
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
      published: req.body.published === 'on',
      category: req.body.category,
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

app.get("/categories/add", function(req, res) {
  res.render("addCategory");
});

app.post("/categories/add", function(req, res) {
  blogService.addCategory(req.body)
      .then(() => {
          res.redirect("/categories");
      })
      .catch((err) => {
          res.render("addCategory", { message: err, data: req.body });
      });
});

app.get("/categories/delete/:id", function(req, res) {
  blogService.deleteCategoryById(req.params.id)
      .then(() => {
          res.redirect("/categories");
      })
      .catch(() => {
          res.status(500);
          res.send("Unable to Remove Category / Category not found");
      });
});

app.get("/posts/delete/:id", function(req, res) {
  const postId = req.params.id;

  blogService.deletePostById(postId)
      .then(() => {
          res.redirect("/posts");
      })
      .catch(err => {
          console.log(err);
          res.status(500).send("Unable to Remove Post / Post not found");
      });
});


app.use(function (req, res, next) {
  res.status(404).render('404');
});

blogService.initialize().then(() => {
  app.listen(port, () => console.log(`Express http server listening on port ${port}`));
}).catch(err => console.error(`Error initializing blog service: ${err}`));
