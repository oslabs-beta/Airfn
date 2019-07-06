var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.send('req.body')
})

app.post('/', (req, res) => {
  res.json(req.body)
})

app.listen(3000, () => {
  console.log(`Example app listening on port 3000!`);
});