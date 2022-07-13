const express = require("express");
const router = express.Router();

const Model = require("../models/model");

module.exports = router;

router.post("/post", async (req, res) => {
  const data = new Model({
    name: req.body.name,
    username: req.body.username,
    age: req.body.age,
    ph: req.body.ph,
    blood: req.body.bp_type,
  });
  try {
    const dataToSave = await data.save();
    res.status(200).json(dataToSave);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
  // res.send("POST API");
});
router.get("/getAll", async (req, res) => {
  try {
    const data = await Model.find();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/getOne/:id", async (req, res) => {
  try {
    const data = await Model.findById(req.params.id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
  //   res.send("Get by ID API");
});

router.patch("/update/:id", async (req, res) => {
  //   res.send("Update by ID API");
  try {
    const id = req.params.id;
    const updatedData = req.body;
    const options = { new: true };

    const result = await Model.findByIdAndUpdate(id, updatedData, options);

    res.send(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/delete/:id", async (req, res) => {
  //   res.send("Delete by ID API");
  try {
    const id = req.params.id;
    const data = await Model.findByIdAndDelete(id);
    res.send(`Document with ${data.name} has been deleted..`);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
