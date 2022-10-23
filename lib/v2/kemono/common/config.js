const config = require('@/config').value;

module.exports = {
    headers: {
        cookie: config.kemono.cookie,
    },
};
