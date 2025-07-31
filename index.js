const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");
const router = require("./routes/payments.routes");
const port = 8080;

app.set("view engine" , "ejs");
app.set("views" , path.join(__dirname , "views"));

app.use(express.static(path.join(__dirname , "public")));
app.use(express.urlencoded({extended : true}));
app.use(express.json());
app.use(cors());

app.use("/api" , router);

app.get("/form" , (req , res) => {
    res.render("form.ejs");
})

app.get("/T&C" , (req , res) => {
    res.render("T&C.ejs");
})

app.get("/about" , (req , res) => {
    res.render("about.ejs");
})

app.get("/reviews" , (req , res) => {
    res.render("reviews.ejs");
})

app.get("/product" , (req , res) => {
    res.render("product.ejs");
})

app.get("/" , (req , res) => {
    res.render("home.ejs");
})

app.listen(port , (req , res) => {
    console.log(`Server is listening to request on port : ${port}`);
})