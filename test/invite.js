describe("invite API", function() {
  const chai = require('chai');
  const chaiHttp = require('chai-http');
  const should = chai.should();
  const expect = chai.expect;
  chai.use(chaiHttp);

  var server;
  before(function () {
    server = require('../invite');
  });
  after(function () {
    server.close();
  });
  
  describe("Get roles endpoint ", function() {
    var url = '/inviteapi/roles'
    it('it should GET 200 status', (done) => {
      chai.request(server)
          .get(url)
          .end((err, res) => {
              res.should.have.status(200);
            done();
          });
    });
    it('it should GET editor and viewer', (done) => {
      chai.request(server)
          .get(url)
          .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a('object');
              expect(res.body).to.have.all.keys('viewer', 'editor');
            done();
          });
    });
  });

  describe("Get invite endpoint - empty", function() {
    var url = '/inviteapi/invites'
    it('it should GET 200 status', (done) => {
      chai.request(server)
          .get(url)
          .end((err, res) => {
              res.should.have.status(200);
            done();
          });
    });
    it('it should GET editor and viewer keys', (done) => {
      chai.request(server)
          .get(url)
          .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a('object');
              expect(res.body).to.have.all.keys('viewer', 'editor');
            done();
          });
    });
    it('it should GET empty set ', (done) => {
      chai.request(server)
          .get(url)
          .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a('object');
              expect(res.body['editor']).to.be.an('array').that.is.empty;
              expect(res.body['viewer']).to.be.an('array').that.is.empty;
            done();
          });
    });
  });

  describe("Post invite endpoint", function() {
    var url = '/inviteapi/invites'
    it('it should fail POST empty payload ', (done) => {
      var payLoad = { 'role' : {} }
      chai.request(server)
          .post(url)
          .send(payLoad)
          .end((err, res) => {
              res.should.have.status(400);
              expect(res.error.text).to.equal('Missing required data');
            done();
          });
    });
    it('it should fail POST wrong role ', (done) => {
      var payLoad = { role: "xxx", emails: " correct@email.test" }
      chai.request(server)
          .post(url)
          .send(payLoad)
          .end((err, res) => {
              res.should.have.status(400);
              expect(res.error.text).to.equal('Missing required data');
            done();
          });
    });
    it('it should fail POST wrong email ', (done) => {
      var payLoad = { role: "viewer", emails: " wrong@email." }
      chai.request(server)
          .post(url)
          .send(payLoad)
          .end((err, res) => {
              res.should.have.status(400);
              expect(res.error.text).to.equal('At least one email was not validated');
            done();
          });
    });
    it('it should fail POST double separator in emails ', (done) => {
      var payLoad = { role: "viewer", emails: " correct@email.test , , correct@email.test  " }
      chai.request(server)
          .post(url)
          .send(payLoad)
          .end((err, res) => {
              res.should.have.status(400);
              expect(res.error.text).to.equal('At least one email was not validated');
            done();
          });
    });
    it('it should fail POST separator at the end of emails ', (done) => {
      var payLoad = { role: "viewer", emails: " correct1@email.test , correct2@email.test , " }
      chai.request(server)
          .post(url)
          .send(payLoad)
          .end((err, res) => {
              res.should.have.status(400);
              expect(res.error.text).to.equal('At least one email was not validated');
            done();
          });
    });
    it('it should pass POST two same viewer emails sent ', (done) => {
      var payLoad = { role: "viewer", emails: " correct@email.test , correct@email.test  " }
      chai.request(server)
          .post(url)
          .send(payLoad)
          .end((err, res) => {
              res.should.have.status(200);
              expect(res.text).to.equal('Success');
              chai.request(server)
                  .get(url)
                  .end((err,res) => {
                      res.should.have.status(200);
                      expect(res.body).to.deep.equal({"viewer":["correct@email.test"],"editor":[]});
                      done();
                  });
          });
    });
    it('it should pass POST two diff editor emails sent ', (done) => {
      var payLoad = { role: "editor", emails: " correct1@email.test , correct2@email.test  " }
      chai.request(server)
          .post(url)
          .send(payLoad)
          .end((err, res) => {
              res.should.have.status(200);
              expect(res.text).to.equal('Success');
              chai.request(server)
                  .get(url)
                  .end((err,res) => {
                      res.should.have.status(200);
                      expect(res.body['editor']).to.include('correct1@email.test');
                      expect(res.body['editor']).to.include('correct2@email.test');
                      done();
                  });
          });
    });

  });
 
});