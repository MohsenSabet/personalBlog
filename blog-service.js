const Sequelize = require('sequelize');

var sequelize = new Sequelize('bkohwkru', 'bkohwkru', 'ymSZvGKiNtsex-o-syRhDr0jpioPSLea', {
    host: 'tyke.db.elephantsql.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});

var Category = sequelize.define('Category', {
    category: Sequelize.STRING
});


var Post = sequelize.define('Post', {
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    postDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN
});

Post.belongsTo(Category, {foreignKey: 'category'});

exports.initialize = function () {
  return new Promise((resolve, reject) => {
    sequelize.sync().then(() => {
      console.log("🐘✅ POSTGRESQL DATABASE SYNCHRONIZED SUCCESSFULLY! 💫")
      resolve();
    }).catch((err) => {
      reject("❌ FAILED TO SYNCHRONIZE POSTGRESQL DATABASE. 💔");
    });
  });
};

exports.getAllPosts = function () {
  return new Promise((resolve, reject) => {
    Post.findAll()
      .then((data) => {
        resolve(data);
      })
      .catch(() => {
        reject("no results returned");
      });
  });
};


exports.getPostsByCategory = function (category) {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: {
        category: category
      }
    })
    .then((data) => {
      if (data.length > 0) {
        console.log("getPostsByCategory ", data);
        resolve(data);
      } else {
        reject("no results returned");
      }
    })
    .catch(() => {
      reject("no results returned");
    });
  });
};


const { gte } = Sequelize.Op;

exports.getPostsByMinDate = function (minDateStr) {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: {
        postDate: {
          [gte]: new Date(minDateStr)
        }
      }
    })
    .then((data) => {
      if (data.length > 0) {
        resolve(data);
      } else {
        reject("no results returned");
      }
    })
    .catch(() => {
      reject("no results returned");
    });
  });
};


exports.getPostById = function (id) {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: {
        id: id
      }
    })
    .then((data) => {
      if (data.length > 0) {
        resolve(data[0]);
      } else {
        reject("no results returned");
      }
    })
    .catch(() => {
      reject("no results returned");
    });
  });
};

exports.addPost = function (postData) {
  return new Promise((resolve, reject) => {
    // Ensure that the published property is set properly
    	postData.published = (postData.published) ? true : false;
    
    // Replace any blank values with null
    for (let prop in postData) {
      if (postData[prop] === "") {
        postData[prop] = null;
      }
    }
    
    // Assign a value for postDate
    postData.postDate = new Date();
    
    // Create a new post
    Post.create(postData)
      .then(() => {

        resolve();
      })
      .catch(() => {
        reject("unable to create post");
      });
  });
};

exports.getPublishedPosts = function () {
  return new Promise((resolve, reject) => {
    // Find all posts where published is true
    Post.findAll({ where: { published: true } })
      .then((data) => {
        console.log("getPublishedPosts data: ", data);
        resolve(data);
      })
      .catch(() => {
        reject("no results returned");
      });
  });
};

exports.getPublishedPostsByCategory = function (category) {
  return new Promise((resolve, reject) => {
    // Find all posts where published is true and category matches the provided category
    Post.findAll({ where: { published: true, category: category } })
      .then((data) => {
        console.log(" getPublishedPostsByCategory data: ", data);
        resolve(data);
      })
      .catch(() => {
        reject("no results returned");
      });
  });
};


exports.getCategories = function () {
  return new Promise((resolve, reject) => {
    // Find all categories
    Category.findAll()
      .then((data) => {
        console.log("getCategories data: ", data);
        resolve(data);
      })
      .catch(() => {
        reject("no results returned");
      });
  });
};


exports.addCategory = function(categoryData) {
  return new Promise((resolve, reject) => {
      // Set blank values in categoryData to null
      for (let field in categoryData) {
          if (categoryData[field] == "") {
              categoryData[field] = null;
          }
      }

      // Use Sequelize's create() method to create a new category in the database
      Category.create(categoryData)
          .then(() => resolve())
          .catch(() => reject("Unable to create category."));
  });
}

exports.deleteCategoryById = function(id) {
  return new Promise((resolve, reject) => {
      // Use Sequelize's destroy() method to delete the category with the specified id
      Category.destroy({
          where: {
              id: id
          }
      })
      .then(() => resolve())
      .catch(() => reject("Unable to delete category."));
  });
}

exports.deletePostById = function(id) {
  return new Promise((resolve, reject) => {
      Post.destroy({
          where: {
              id: id
          }
      })
      .then((deletedRecordCount) => {
          if(deletedRecordCount !== 0) {
              resolve('Post deleted successfully');
          } else {
              reject('Error: Post not found');
          }
      })
      .catch((error) => {
          reject(`Unable to delete Post: ${error}`);
      });
  });
}






