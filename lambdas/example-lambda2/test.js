const { handler } = require('./dist/index');

handler({ key: 'value' }).then(console.log).catch(console.error);