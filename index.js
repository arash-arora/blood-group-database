require("dotenv").config();
const routes = require("./routes/routes");
const { storage, upload, id } = require("./multer");

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const mongoString = process.env.DATABASE_URL;
var bodyParser = require("body-parser");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const PORT = process.env.PORT;

// mongoose.set("useNewUrlParser", true);
// mongoose.set("useFindAndModify", false);
// mongoose.set("useCreateIndex", true);
// mongoose.set("useUnifiedTopology", true);
mongoose.connect(mongoString);
const database = mongoose.connection;

database.on("error", (error) => {
  console.log(error);
});
database.once("connected", () => {
  console.log("DB connected");
});

const app = express();

// Authentication
const passport = require("passport");
const LocalStrategy = require("passport-local");
const passportLocalMongoose = require("passport-local-mongoose");
const User = require("./models/userModel.js");
const { connect } = require("http2");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "/public")));
app.use("/uploads", express.static(path.join(__dirname + "/uploads")));
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "/views"));
app.use("/api", routes);

app.use(
  require("express-session")({
    secret: "Rusty is a dog",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/home", (req, res) => {
  res.render("home", {
    title: "Home Page",
  });
});

// Showing register form
app.get("/register", function (req, res) {
  res.render("register");
});

// Handling user signup
app.post("/register", function (req, res) {
  var username = req.body.username;
  var password = req.body.password;
  User.register(
    new User({ username: username }),
    password,
    function (err, user) {
      if (err) {
        console.log(err);
        return res.render("register");
      }

      passport.authenticate("local")(req, res, function () {
        res.render("blood-group");
      });
    }
  );
});

app.get("/login", function (req, res) {
  res.render("login");
});

//Handling user login
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/blood-group",
    failureRedirect: "/login",
  }),
  function (req, res) {}
);

//Handling user logout
app.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/home");
  });
});

function isLoggedIn(req, res, next) {
  // let buff = new Buffer(req.headers.authorization.split(" ")[1], "base64");
  // let text = buff.toString("ascii");
  // const h = text.split(":");
  // if (h[0] === "arash" && h[1] === "arash") {
  //   return next();
  // }
  if (req.isAuthenticated()) return next();
  // if(req.headers.authorization)
  res.redirect("/login");
}

let doc = new PDFDocument();

var ext;
app.get("/newuser", (req, res) => {
  res.render("user", {
    error: "",
  });
});
app.post("/newuser", upload.single("image"), async (req, res, next) => {
  const file = req.file;
  // image check
  if (!file) {
    const error = new Error("Please Upload a file");
    error.httpStatusCode = 404;
    return next(error);
  }

  //Username check
  try {
    database
      .collection("users")
      .find({ username: req.body.username })
      .toArray((err, result) => {
        if (err) throw err;
        else {
          if (result.length >= 1) {
            res.render("user", {
              error: "Username should be unique",
            });
            // throw "Username should be unique";
          } else {
            if (file.mimetype == "image/jpeg") {
              ext = "jpg";
            }
            if (file.mimetype == "image/png") {
              ext = "png";
            }

            //sending to db
            const body = req.body;

            body.file = id;
            body.ext = ext;
            database.collection("users").insertOne(body);

            res.redirect("/home");
          }
        }
      });
  } catch (err) {
    req.body.error = err;
    console.log(err);
  }
});

app.get("/get-pdf", (req, res) => {
  res.render("pdf");
});

let resultGlobal;
app.post("/get-pdf", async (req, res) => {
  const id = req.body.id;
  await database
    .collection("users")
    .findOne({ username: id }, (err, result) => {
      if (err) throw err;
      else {
        resultGlobal = result;
        console.log(resultGlobal);
        res.render("pdf", {
          body: result,
        });
      }
    });
});
app.post("/download-pdf", async (req, res) => {
  const stream = res.writeHead(200, {
    "Content-Type": "application/pdf",
    "Content-Disposition": "attachment;filename=output.pdf",
  });

  const buildPDF = (dataCallback, endCallback) => {
    const doc = new PDFDocument();
    doc.on("data", dataCallback);
    doc.on("end", endCallback);
    doc
      .fontSize(16)
      .text("Blood Group Card", {
        align: "center",
      })
      .moveDown()
      .moveDown()
      .moveUp()
      .text(
        "Date:" +
          new Date().getDate() +
          "/" +
          new Date().getMonth() +
          "/" +
          new Date().getFullYear(),
        {
          align: "right",
        }
      );
    doc
      .image(
        "uploads/" + resultGlobal.file + "." + resultGlobal.ext,
        430,
        doc.y,
        {
          fit: [120, 120],
          align: "right",
          valign: "center",
        }
      )
      .moveDown()
      .moveDown();
    doc
      .fontSize(12)
      .text("Name: " + resultGlobal.name, {
        align: "left",
      })
      .moveDown()
      .text("Phone Number: " + resultGlobal.ph)
      .moveDown()
      .text("Age: " + resultGlobal.age)
      .moveDown()
      .text("Blood Group: " + resultGlobal.bp)
      .moveDown()
      .moveTo(0, doc.y)
      .lineTo(1000, doc.y)
      .stroke()
      .moveDown();
    doc.end();
  };
  buildPDF(
    (chunk) => stream.write(chunk),
    () => stream.end()
  );
  // });
});

app.get("/blood-group", isLoggedIn, async (req, res) => {
  await database
    .collection("users")
    .find({})
    .toArray((err, det) => {
      if (err) console.log(err);
      else {
        console.log(det);
        res.render("index", {
          det: det,
          i: 1,
        });
      }
    });
});

app.listen(PORT || 3000, () => {
  console.log("Server running in 3000");
});
