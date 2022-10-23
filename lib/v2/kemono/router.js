module.exports = function (router) {
    router.get('/postsfollow', require('./postsfollow'));
    router.get('/:source?/:id?', require('./index'));
};
