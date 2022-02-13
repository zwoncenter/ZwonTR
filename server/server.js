const express = require("express");
const path = require("path");
const app = express();

//MongoDB 연결, 설치필요 (npm install mongodb)
const MongoClient = require("mongodb").MongoClient;

// .env
require("dotenv").config();

// express에 내장된 body-parser 사용
app.use(express.urlencoded({ extended: true }));

// react와 nodejs 서버간 ajax 요청 잘 되게
app.use(express.json());
var cors = require("cors");
app.use(cors());

//db라는 변수에 Zwon 데이터베이스 연결
var db;
MongoClient.connect(process.env.DB_URL, function (err, client) {
  if (err) {
    return console.log(err);
  }

  // db라는 변수에 Zwon 데이터베이스를 연결.
  db = client.db("Zwon");

  app.listen(process.env.PORT, function () {
    console.log(`listening on ${process.env.PORT}`);
  });
});

// 특정폴더 안의 파일들을 static파일로 고객들에게 보내줄 수 있음
app.use(express.static(path.join(__dirname, "../zwontr/build")));

// 홈페이지(/) 접속시, build된 react의 html 전송
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "../zwontr/build/index.html"));
});

// collection 중 StudentDB의 모든 Document find 및 전송
// res.json과 res.send의 차이점 :
// 1. send가 상위호환이나 전송파일이 json일 경우 불필요한 호출이 한번 더 일어남
// 2. 개발자가 소스코드를 읽을 때도 res.json이 더 명확한 의도가 드러남.

app.get("/api/studentList", function (req, res) {
  db.collection("StudentDB")
    .find()
    .toArray(function (err, result) {
      if (err) {
        return console.log("api/studentList - find Error : ", err);
      }
      console.log("api/studentList - find result length   :", result.length);
      res.json(result);
    });
});

// collection 중 StudentDB의 이름이 param 중 name인 Document 요청
app.get("/api/stuDB/:name", function (req, res) {
  const paramName = decodeURIComponent(req.params.name);
  console.log("요청된 이름 : ", paramName);
  db.collection("StudentDB").findOne({ 이름: paramName }, function (err, result) {
    if (err) {
      return console.log("/api - findOne Error : ", err);
    }
    console.log("/api findOne 요청 결과 : ", result);
    res.redirect("/");
  });
});

// {req.param.name}TR라는 Collection에서 날짜가 {req.param.date}인 Document를 찾고
// 존재하면 보내주고, 없다면 새로운 문서를 post한다.

app.get("/api/:name/:date", function (req, res) {
  const paramName = decodeURIComponent(req.params.name);
  const paramDate = req.params.date;
  console.log("요청된 이름: ", paramName, "요청된 날짜: ", paramDate);
  db.collection(`${paramName}TR`).findOne({ 날짜: paramDate }, function (err, result) {
    if (err) {
      return console.log(`/api/TR/${paramName}/${paramDate} - findOne Error : `, err);
    } else if (result.length === 0) {
    }
    console.log("/api findOne 요청 결과 : ", result);
    res.redirect("/");
  });
});

app.get("*", function (req, res) {
  res.sendFile(path.join(__dirname, "../zwontr/build/index.html"));
});
