const Movie = require("../../models").Movies;
const Character = require("../../models").Characters;
const Genre = require("../../models").Genres;
const Characters_Movies = require("../../models").Characters_Movies;
const Genres_Movies = require("../../models").Genres_Movies;
const { sequelize } = require("../../models");
const {
  Uploads_URLs,
  checkErrors,
  checkArrayOfIDs,
} = require("../const/helpers");
const fs = require("fs");

const get_movies = async (req, res, next) => {
  let where = {},
    include = [],
    ord = "ASC";
  if (req.query.title)
    where["title"] = sequelize.where(
      sequelize.fn("LOWER", sequelize.col("title")),
      "LIKE",
      "%" + req.query.title?.toLowerCase() + "%"
    );
  if (req.query.genre)
    include.push({
      model: Genre,
      where: {
        id: req.query.genre,
      },
    });
  if (req.query.order === "DESC") ord = "DESC";
  Movie.findAll({
    attributes: ["id", "image", "title", "creation"],
    where,
    include,
    order: [["creation", ord]],
  })
    .then((data) =>
      res.status(200).send({
        data: data,
        code: 200,
      })
    )
    .catch((err) => next(err));
};

const get_movie_by_ID = async (req, res, next) => {
  try {
    const movie = await Movie.findByPk(req.params.id, {
      include: [
        {
          model: Character,
          attributes: ["id", "image", "name"],
        },
        {
          model: Genre,
          attributes: ["id", "image", "name"],
        },
      ],
    });
    if (!movie)
      throw {
        error: "ID does not belong to existing movie",
        code: 404,
      };
    return res.status(200).send({
      data: movie.dataValues,
      code: 200,
    });
  } catch (err) {
    next(err);
  }
};

const new_movie = async (req, res, next) => {
  try {
    checkErrors(req);
    let characters, genres, err, image;

    if (req.file && req.file.fieldname === "image") image = req.file.filename;
    if (req.body.characters) {
      characters = await checkArrayOfIDs(
        JSON.parse(req.body.characters),
        "Character"
      );
    }
    if (req.body.genres)
      genres = await checkArrayOfIDs(JSON.parse(req.body.genres), "Genre");
    const movie = await Movie.create({
      image: image,
      title: req.body.title,
      creation: req.body.creation,
      score: req.body.score,
    });
    movie.addCharacter(characters);
    movie.addGenre(genres);
    return res.status(201).send({
      message: "Movie created",
      data: movie.dataValues,
      code: 201,
    });
  } catch (err) {
    next(err);
  }
};

const update_movie = async (req, res, next) => {
  try {
    checkErrors(req);
    let characters,
      genres,
      err,
      newValues = {
        title: req.body.name,
        creation: req.body.creation,
        score: req.body.score,
      };
    let exists = await movie_exists(req.params.id);
    if (req.file && req.file.fieldname === "image") {
      newValues.image = req.file.filename;
      if (exists.image)
        fs.unlinkSync(Uploads_URLs.Movies + exists.dataValues.image);
    }
    if (req.body.characters) {
      characters = await checkArrayOfIDs(
        JSON.parse(req.body.characters),
        "Character"
      );
      exists.addCharacter(characters);
    }
    if (req.body.genres) {
      genres = await checkArrayOfIDs(JSON.parse(req.body.genres), "Genre");
      exists.addGenre(genres);
    }
    const movie = await Movie.update(newValues, {
      where: { id: req.params.id },
    });
    const message = movie[0] ? "Movie modified" : "Movie not modified";
    return res.status(200).send({
      message: message,
      code: 200,
    });
  } catch (err) {
    next(err);
  }
};

const delete_movie = async (req, res, next) => {
  try {
    let exists = await movie_exists(req.params.id);
    if (
      exists.image &&
      fs.existsSync(Uploads_URLs.Movies + exists.dataValues.image)
    )
      fs.unlinkSync(Uploads_URLs.Movies + exists.dataValues.image);
    await Characters_Movies.destroy({
      where: { MovieId: exists.id },
    });
    await Genres_Movies.destroy({
      where: { MovieId: exists.id },
    });
    await Movie.destroy({
      where: {
        id: exists.id,
      },
    });
    return res.status(200).send({
      message: "Movie deleted",
      data: req.params.id,
      code: 200,
    });
  } catch (err) {
    next(err);
  }
};

const movie_exists = async (id) =>
  Movie.findByPk(id)
    .then((m) => {
      if (!m)
        throw {
          error: "ID does not belong to existing movie",
          code: 404,
        };
      return m;
    })
    .catch((e) => {
      throw e;
    });

module.exports = {
  get_movies,
  get_movie_by_ID,
  new_movie,
  update_movie,
  delete_movie,
};
