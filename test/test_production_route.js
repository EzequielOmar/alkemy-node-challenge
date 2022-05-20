let chai = require("chai");
let chaiHttp = require("chai-http");
const expect = require("chai").expect;
const assert = require("chai").assert;
const fs = require("fs");
const faker = require("faker");
const moment = require("moment");
chai.use(chaiHttp);
const url = process.env.HOST;
const testImage = "./test/test-image.jpeg";

//*mockup of production model
const Production = require("../models").Productions;

xdescribe("GET on /movies and /movies/:id :", () => {
  beforeEach(() => Production.destroy({ truncate: true }));

  it("Should return an empty list.", (done) => {
    chai
      .request(url)
      .get("/movies")
      .end(function (err, res) {
        expect(res).to.have.status(200);
        expect(res.body.data).to.be.an("array").that.is.empty;
        done();
      });
  });

  it("Should return an existing production.", (done) => {
    const prodTest = {
      title: faker.name.findName(),
      creation: faker.date.past(),
    };
    //* Create previous production with repeated name.
    Production.create(prodTest).then((char) => {
      chai
        .request(url)
        .get("/movies/" + char.dataValues.id)
        .end(function (err, res) {
          expect(res).to.have.status(200);
          assert.equal(prodTest.title, res.body.data.title);
          done();
        });
    });
  });

  it("Should fail on return a non existing production.", (done) => {
    chai
      .request(url)
      .get(
        "/movies/" + parseInt(Math.floor(Math.random() * -(1 - 200 + 1) + 1))
      )
      .end(function (err, res) {
        expect(res).to.have.status(500);
        assert.equal(
          res.body.error,
          "ID does not belong to existing production."
        );
        done();
      });
  });
});

xdescribe("POST on /movies : ", () => {
  beforeEach(() => Production.destroy({ truncate: true }));

  it("Should insert a production with all the correct values.", (done) => {
    let date = faker.date.past();
    const prodTest = {
      title: faker.name.findName(),
      //* Return an date formated in rfc2822
      creation: date.toUTCString(),
      score: parseFloat(Math.floor(Math.random() * -(1 - 5 + 1) + 1)).toFixed(
        2
      ),
    };
    chai
      .request(url)
      .post("/movies")
      .field("Content-Type", "multipart/form-data")
      .field(prodTest)
      .attach("image", fs.readFileSync(testImage), "test-image.jpeg")
      .end(function (err, res) {
        expect(res).to.have.status(201);
        assert.equal(res.body.message, "Production created.");
        expect(res.body.data.image).to.be.not.null;
        assert.equal(res.body.data.title, prodTest.title);
        //* Database store and return date in yyy-mm-dd format
        expect(res.body.data.creation).to.be.not.null;
        assert.equal(res.body.data.score, prodTest.score);
        done();
      });
  });

  it("Should fail by NOT UNIQUE production title.", (done) => {
    const prodTest = {
      title: faker.name.findName(),
      creation: faker.date.past().toUTCString(),
    };
    //* Create previous production with repeated name.
    Production.create(prodTest).finally(() => {
      chai
        .request(url)
        .post("/movies")
        .field("Content-Type", "multipart/form-data")
        .field(prodTest)
        .end(function (err, res) {
          expect(res).to.have.status(500);
          expect(res.body.error.parent.code).to.be.equal("ER_DUP_ENTRY");
          done();
        });
    });
  });

  it("Should fail by MISSING VALUES.", (done) => {
    chai
      .request(url)
      .post("/movies")
      .field("Content-Type", "multipart/form-data")
      .end(function (err, res) {
        expect(res).to.have.status(500);
        expect(res.body.error.parent.code).to.be.equal(
          "ER_NO_DEFAULT_FOR_FIELD"
        );
        done();
      });
  });
});

xdescribe("PATCH on /movies/:id: ", () => {
  beforeEach(() => Production.destroy({ truncate: true }));

  it("Should modify production values with correct passed ones.", (done) => {
    const prodTest = {
      title: faker.name.findName(),
      creation: faker.date.past(),
    };
    //* instert the test production
    Production.create(prodTest).then((char) => {
      chai
        .request(url)
        .patch("/movies/" + char.dataValues.id)
        .send({
          creation: faker.date.past(),
        })
        .end(function (err, res) {
          expect(res).to.have.status(200);
          expect(res.body.message).to.be.equal("Production modified.");
          done();
        });
    });
  });

  it("Should not modify production if pass incorrect values.", (done) => {
    const prodTest = {
      title: faker.name.findName(),
      creation: faker.date.past(),
    };
    //* instert the test production
    Production.create(prodTest).then((char) => {
      chai
        .request(url)
        .patch("/movies/" + char.dataValues.id)
        .send({ fake: "fakeValue", fake2: "fakeValue2" })
        .end(function (err, res) {
          expect(res).to.have.status(200);
          expect(res.body.message).to.be.equal("Production not modified.");
          done();
        });
    });
  });

  it("Should fail if ID does not belong to existing production.", (done) => {
    chai
      .request(url)
      .patch(
        "/movies/" + parseInt(Math.floor(Math.random() * -(1 - 200 + 1) + 1))
      )
      .field("Content-Type", "multipart/form-data")
      .end(function (err, res) {
        expect(res).to.have.status(500);
        expect(res.body.error).to.be.equal(
          "ID does not belong to existing production."
        );
        done();
      });
  });
});

xdescribe("DELETE on /movies/:id: ", () => {
  beforeEach(() => Production.destroy({ truncate: true }));

  it("Should delete an existing production.", (done) => {
    const prodTest = {
      title: faker.name.findName(),
      creation: faker.date.past(),
    };
    //* instert the test production
    Production.create(prodTest).then((char) => {
      chai
        .request(url)
        .delete("/movies/" + char.dataValues.id)
        .end(function (err, res) {
          expect(res).to.have.status(200);
          assert.equal(res.body.message, "Production deleted.");
          done();
        });
    });
  });

  it("Should fail if ID does not belong to existing production.", (done) => {
    chai
      .request(url)
      .delete(
        "/movies/" + parseInt(Math.floor(Math.random() * -(1 - 200 + 1) + 1))
      )
      .field("Content-Type", "multipart/form-data")
      .end(function (err, res) {
        expect(res).to.have.status(500);
        expect(res.body.error).to.be.equal(
          "ID does not belong to existing production."
        );
        done();
      });
  });
});