const fs = require('fs').promises;

let posts = [];
let categories = [];

function readJsonFile(file) {
  return fs.readFile(`./data/${file}`, 'utf8').then((data) => JSON.parse(data));
}


exports.initialize = function () {
  return Promise.all([readJsonFile('posts.json'), readJsonFile('categories.json')])
    .then((data) => {
      [posts, categories] = data;
    })
    .catch((err) => {
      console.error(`Error reading data files: ${err}`);
      throw err;
    });
};

exports.getAllPosts = function () {
  return new Promise((resolve, reject) => {
  posts.length ? resolve(posts) : reject('No posts found');
  })
};

exports.getPublishedPosts = function () {
  return new Promise((resolve, reject) => {
  const publishedPosts = posts.filter((post) => post.published);
  publishedPosts.length ? resolve(publishedPosts) : reject('No published posts found');
  })
};

exports.getCategories = function () {
  return new Promise((resolve, reject) => {
  categories.length ? resolve(categories) : reject('No categories found');
  })
};

exports.addPost = function (postData) {
  return new Promise((resolve, reject) => {
    if (postData.published === undefined) {
      postData.published = false;
    } else {
      postData.published = true;
    }

    postData.id = posts.length + 1;

    posts.push(postData);
    resolve(postData);
  });
};

exports.getPostsByCategory = function (category) {
  return new Promise((resolve, reject) => {
  const filteredPosts = posts.filter((post) => post.category == category);
  filteredPosts.length ? resolve(filteredPosts) : reject('No results returned');
})
};

exports.getPublishedPostsByCategory = function (category) {
  return new Promise((resolve, reject) => {
  const publishedPosts = posts.filter((post) => post.published && post.category == category);
  publishedPosts.length ? resolve(publishedPosts) : reject('No published posts found in this category');
  })
};

exports.getPostsByMinDate = function (minDateStr) {
  
  const minDate = new Date(minDateStr);
  const filteredPosts = posts.filter((post) => new Date(post.postDate) >= minDate);
  return filteredPosts.length ? Promise.resolve(filteredPosts) : Promise.reject('No results returned');
};

exports.getPostById = function (id) {
  return new Promise((resolve, reject) => {
    const post = posts.find((post) => post.id == id);
    post ? resolve(post) : reject("no result returned")
  })
};


function addPost(postData) {
  return new Promise((resolve, reject) => {
    const date = new Date();
    postData.postDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`; 
    posts.push(postData);
  })
};
