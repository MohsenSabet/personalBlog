/*********************************************************************************
*  Web Programming Tools and Frameworks project
* Server.js
* Entry point for the Blog Web Application.
* 
* This module initializes and starts the Express server, setting up routes,
* middleware, and database connections necessary for the application.
* 
*  Author: Mohsen Sabet
*********************************************************************************/ 
const authData = require('./auth-service.js');
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
const clientSessions = require("client-sessions");
const HTTP_PORT = process.env.PORT || 8080;


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
    },
    formatDate: function(dateObj) {
      let year = dateObj.getFullYear();
      let month = (dateObj.getMonth() + 1).toString();
      let day = dateObj.getDate().toString();
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2,'0')}`;
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

app.use(clientSessions({
  cookieName: "session",  // this is the object name that will be added to 'req'
  secret: "some_random_string",  // this should be a long random string
  duration: 15 * 60 * 1000, // duration of the session in milliseconds (15 minutes)
  activeDuration: 5 * 60 * 1000 // the session will be extended by this many ms each request (5 minutes)
}));

app.use(function(req, res, next) {
  res.locals.session = req.session;
  next();
});

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}


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


app.get('/posts', ensureLogin, function(req, res) {
  // Check if the category query parameter is present
  if (req.query.category) {
      blogService.getPostsByCategory(req.query.category)
          .then((data) => {
              if (data.length > 0) {
                  res.render("posts", {posts: data});
              } else {
                  res.render("posts", {message: "no results"});
              }
          })
          .catch((err) => {
              console.error(err);
              res.render("posts", {message: "no results"});
          });
  }
  // Check if the minDate query parameter is present
  else if (req.query.minDate) {
      blogService.getPostsByMinDate(req.query.minDate)
          .then((data) => {
              if (data.length > 0) {
                  res.render("posts", {posts: data});
              } else {
                  res.render("posts", {message: "no results"});
              }
          })
          .catch((err) => {
              console.error(err);
              res.render("posts", {message: "no results"});
          });
  }
  // If no query parameters are present, get all posts
  else {
      blogService.getAllPosts()
          .then((data) => {
              if (data.length > 0) {
                  res.render("posts", {posts: data});
              } else {
                  res.render("posts", {message: "no results"});
              }
          })
          .catch((err) => {
              console.error(err);
              res.render("posts", {message: "no results"});
          });
  }
});



app.get("/categories", ensureLogin, (req, res) => {
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


app.get('/posts/add', ensureLogin, (req, res) => {
  blogService.getCategories().then(data => {
      res.render('addPost', { categories: data });
  }).catch(error => {
      console.log(`Error fetching categories: ${error}`);
      res.render('addPost', { categories: [] });
  });
});


// Add the "Post" route
app.post('/posts/add', ensureLogin, upload.single('featureImage'), (req, res) => {
  console.log('Request body:', req.body);
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
      body: req.body.body,
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

app.get("/categories/add", ensureLogin, function(req, res) {
  res.render("addCategory");
});

app.post("/categories/add", ensureLogin, function(req, res) {
  blogService.addCategory(req.body)
      .then(() => {
          res.redirect("/categories");
      })
      .catch((err) => {
          res.render("addCategory", { message: err, data: req.body });
      });
});

app.get("/categories/delete/:id", ensureLogin, function(req, res) {
  blogService.deleteCategoryById(req.params.id)
      .then(() => {
          res.redirect("/categories");
      })
      .catch(() => {
          res.status(500);
          res.send("Unable to Remove Category / Category not found");
      });
});

app.get("/posts/delete/:id", ensureLogin, function(req, res) {
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



app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  req.body.userAgent = req.get('User-Agent');

  authData.checkUser(req.body)
  .then(user => {
      req.session.user = {
          userName: user.userName, // Assuming 'user' has a 'userName' property
          email: user.email,       // Assuming 'user' has an 'email' property
          loginHistory: user.loginHistory // Assuming 'user' has a 'loginHistory' property
      }
      res.redirect('/posts');
  })
  .catch(err => {
      res.render('login', {
          errorMessage: err,
          userName: req.body.userName
      });
  });
});


app.get('/register', (req, res) => {
  res.render('register');
});


app.post('/register', (req, res) => {
  authData.registerUser(req.body)
  .then(() => {
      res.render('register', {successMessage: "User created"});
  })
  .catch(err => {
      res.render('register', {
          errorMessage: err,
          userName: req.body.userName
      });
  });
});

app.get('/logout', (req, res) => {
  // Assuming you use `express-session` and the session is stored in `req.session`
  req.session.reset(); // This might vary depending on your setup
  res.redirect('/');
});

app.get('/userHistory', ensureLogin, (req, res) => {
  res.render('userHistory');
});


app.use(function (req, res, next) {
  res.status(404).render('404');
});


blogService.initialize()
.then(authData.initialize)
.then(function(){
    app.listen(HTTP_PORT, function(){
        console.log("app listening on: " + HTTP_PORT)
    });
}).catch(function(err){
    console.log("unable to start server: " + err);
});
