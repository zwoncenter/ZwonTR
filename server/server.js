const express = require("express");
const path = require("path");
const app = express();

const ObjectId = require("mongodb").ObjectId;
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

// collection 중 StudentDB에 새로운 stuDB 추가 요청
app.post("/api/studentAdd", function (req, res) {
  const newDB = req.body;
  db.collection("StudentDB").findOne({ 이름: newDB }, function (err, result) {
    if (err) {
      return console.log("/api/studentAdd findOne Error : ", err);
    } else if (result === null) {
      db.collection("StudentDB").insertOne(newDB, (err2, result2) => {
        db.collection("StudentDB_Log").insertOne(newDB, (err3, result) => {
          if (err3) {
            return console.log("로그데이터 저장 실패");
          }
          console.log("로그데이터 저장 완료");
        });
        console.log("신규 학생DB 저장 완료");
        return res.send(true);
      });
    }
  });
});

// StudentDB에 수정 요청
app.put("/api/StudentEdit", function (req, res) {
  const newstuDB = req.body;
  console.log("기존 학생DB 수정 시도 : ", newstuDB);
  db.collection(`StudentDB`).findOne({ _id: ObjectId(newstuDB._id) }, function (err, result) {
    if (err) {
      return console.log(`/api/StudentEdit - findOne Error : `, err);
    } else if (result !== null) {
      const findID = ObjectId(newstuDB._id);
      delete newstuDB._id;
      db.collection("StudentDB").updateOne({ _id: findID }, { $set: newstuDB }, function (err2, result2) {
        if (err2) {
          return console.log("/api/StudentEdit - updateOne Error : ", err2);
        }
        db.collection("StudentDB_Log").insertOne(newstuDB, (err3, result3) => {
          if (err3) {
            return console.log("로그데이터 저장 실패");
          }
          console.log("로그데이터 저장 완료");
        });
        console.log("기존 학생DB 수정 완료");
        return res.send(true);
      });
    } else {
      return res.send(false);
    }
  });
});

// StudentDB에 삭제 요청
app.delete("/api/StudentDelete/:name", function (req, res) {
  const stuName = req.params.name;
  console.log(stuName + "의 DB 삭제 시도");
  db.collection("StudentDB").deleteOne({ 이름: stuName }, (err, result) => {
    if (err) {
      return console.log("/api/StudentDelete - deleteOne error : ", err);
    } else if (result !== null) {
      console.log(`${stuName}의 DB 삭제 완료`);
      return res.send(true);
    } else {
      return res.send(false);
    }
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

app.get("/api/TR/:name", function (req, res) {
  const paramName = decodeURIComponent(req.params.name);
  console.log(`${paramName}의 TR 리스트 조회 시도`);
  db.collection("TR")
    .find({ 이름: paramName })
    .toArray(function (err, result) {
      if (err) {
        return console.log("/api/TR/:name - find Error : ", err);
      }
      console.log(`${paramName}의 TR 리스트 조회 결과수 : `, result.length);
      res.json(result);
    });
});

app.post("/api/TR/write", function (req, res) {
  const newTR = req.body;
  console.log("일간하루 저장 시도 : ", newTR.이름, newTR.날짜);
  db.collection(`TR`).findOne({ 이름: newTR.이름, 날짜: newTR.날짜 }, function (err, result) {
    if (err) {
      return console.log(`/api/TR/write - findOne Error : `, err);
    } else if (result === null) {
      db.collection("TR").insertOne(newTR, function (err2, result2) {
        if (err2) {
          return console.log("/api/TR/write - insertOne Error : ", err2);
        }
        console.log("터미널에 표시 : 일간하루 저장 완료");
        return res.send(true);
      });
    } else {
      return res.send(false);
    }
  });
});

app.put("/api/TR/edit", function (req, res) {
  const newTR = req.body;
  console.log("일간하루 수정 시도 : ", newTR.이름, newTR.날짜);
  db.collection(`TR`).findOne({ 이름: newTR.이름, 날짜: newTR.날짜 }, function (err, result) {
    if (err) {
      return console.log(`/api/TR/edit - findOne Error : `, err);
    } else if (result !== null) {
      db.collection("TR").updateOne({ 이름: newTR.이름, 날짜: newTR.날짜 }, { $set: newTR }, function (err2, result2) {
        if (err2) {
          return console.log("/api/TR/write - updateOne Error : ", err2);
        }
        console.log("터미널에 표시 : 일간하루 수정 완료");
        return res.send(true);
      });
    } else {
      return res.send(false);
    }
  });
});

app.delete("/api/TR/delete/:id", function (req, res) {
  const trID = ObjectId(req.params.id);
  console.log("일간하루 삭제 시도 :", trID);
  db.collection("TR").deleteOne({ _id: trID }, (err, result) => {
    if (err) {
      return console.log("/api/TR/delete/:id - deleteOne error : ", err);
    } else if (result.deletedCount === 1) {
      console.log("일간하루 삭제 완료 : ", result);
      return res.send(true);
    }
    return res.send(false);
  });
});

// app.get("*", function (req, res) {
//   res.sendFile(path.join(__dirname, "../zwontr/build/index.html"));
// });
