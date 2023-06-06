const fs = require('fs').promises;

let posts = [];
let categories = [];

function readJsonFile(file) {
    return fs.readFile(`./data/${file}`, 'utf8').then(data => JSON.parse(data));
}

exports.initialize = function () {
    return Promise.all([readJsonFile('posts.json'), readJsonFile('categories.json')]).then(data => {
        [posts, categories] = data;
    }).catch(err => {
        console.error(`Error reading data files: ${err}`);
        throw err;
    });
}

exports.getAllPosts = function () {
    return posts.length ? Promise.resolve(posts) : Promise.reject('No posts found');
}

exports.getPublishedPosts = function () {
    const publishedPosts = posts.filter(post => post.published);
    return publishedPosts.length ? Promise.resolve(publishedPosts) : Promise.reject('No published posts found');
}

exports.getCategories = function () {
    return categories.length ? Promise.resolve(categories) : Promise.reject('No categories found');
}
