var User = require('./models/user');

User.create({
    name: 'Moishe Ufnik',
    username: 'moishe',
    password: '123',
    admin: true
}, function(err, user) {
    if (err) throw err;
    console.log('User created:' + user);
});
