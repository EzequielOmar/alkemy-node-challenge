var express = require("express");
var router = express.Router();
const characterController = require("../controllers/character-controller");
const { Uploads_URLs } = require("../const/helpers");
const multer = require("multer");
const { body } = require("express-validator");
const auth = require("../middlewares/auth");

const upload = multer({
  storage: multer.diskStorage({
    destination: Uploads_URLs.Characters,
  }),
  fileFilter: (req, file, cb) => {
    if (
      !["jpg", "jpeg", "webp", "gif", "png", "svg"].includes(
        file.mimetype.split("/")[1]
      )
    )
      return cb({ error: "File format is not allowed", code: 400 });
    if (file.size >= 2097152)
      return cb({ error: "File is too heavy. Max allowed is 2mb", code: 400 });
    return cb(null, true);
  },
});

//CHARACTER ROUTES

router.get("/", characterController.get_characters);

router.get("/:id", characterController.get_character_by_ID);

router.post(
  "/",
  auth,
  upload.single("image"),
  body("name", "Field name is invalid").isLength({ min: 2, max: 125 }),
  body("age", "Field age is invalid").isInt({ min: 0 }),
  body("weight", "Field weight is invalid").isFloat({ min: 0 }),
  body("story", "Field story is invalid").isLength({ max: 225 }),
  body("movies", "Field movies must be an array of int").if(
    body("movies")
      .exists()
      .custom((value) => {
        if (Array.isArray(JSON.parse(value))) return true;
      })
  ),
  characterController.new_character
);

router.patch(
  "/:id",
  auth,
  upload.single("image"),
  body("name", "Field name is invalid")
    .if(body("name").exists())
    .isLength({ min: 2, max: 125 }),
  body("age", "Field age is invalid")
    .if(body("age").exists())
    .isInt({ min: 0 }),
  body("weight", "Field weight is invalid")
    .if(body("weight").exists())
    .isFloat({ min: 0 }),
  body("story", "Field story is invalid")
    .if(body("story").exists())
    .isLength({ max: 225 }),
  body("movies", "Field movies must be an array of int").if(
    body("movies")
      .exists()
      .custom((value) => {
        if (Array.isArray(JSON.parse(value))) return true;
      })
  ),
  characterController.update_character
);

router.delete("/:id", auth, characterController.delete_character);

module.exports = router;
