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
  return posts.length ? Promise.resolve(posts) : Promise.reject('No posts found');
};

exports.getPublishedPosts = function () {
  const publishedPosts = posts.filter((post) => post.published);
  return publishedPosts.length ? Promise.resolve(publishedPosts) : Promise.reject('No published posts found');
};

exports.getCategories = function () {
  return categories.length ? Promise.resolve(categories) : Promise.reject('No categories found');
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
  const filteredPosts = posts.filter((post) => post.category === category);
  return filteredPosts.length ? Promise.resolve(filteredPosts) : Promise.reject('No results returned');
};

exports.getPostsByMinDate = function (minDateStr) {
  const minDate = new Date(minDateStr);
  const filteredPosts = posts.filter((post) => new Date(post.postDate) >= minDate);
  return filteredPosts.length ? Promise.resolve(filteredPosts) : Promise.reject('No results returned');
};

exports.getPostById = function (id) {
  const post = posts.find((post) => post.id === id);
  return post ? Promise.resolve(post) : Promise.reject('No result returned');
};
