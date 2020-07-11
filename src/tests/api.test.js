// 'use strict';
// process.env.NODE_ENV = 'test';

// let chai = require('chai');
// let chaiHttp = require('chai-http');
// let app = require('../app');
// let config = require('../config');

// process.env.PORT = config.server.port || 80;

// let should = chai.should();
// chai.use(chaiHttp);


// describe('GET /', function () {
//   it('it should failed with not found', function (done) {
//     chai.request(app)
//       .get('/')
//       .end((err, res) => {
//         res.should.have.status(404);
//         done();
//       });
//   });
//   it('it should success and return answer n°1', function (done) {
//     chai.request(app)
//       .get('/v1/fizzbuzz')
//       .query({ int1: 2, int2: 3, limit: 14, str1: 'salut', str2: 'yes' })
//       .end((err, res) => {
//         res.should.have.status(200);
//         res.should.have.property('body');
//         res.body.should.have.property('answer');
//         res.body.answer.should.equals('1,salut,yes,salut,5,salutyes,7,salut,yes,salut,11,salutyes,13,salut');
//         done();
//       });
//   });
