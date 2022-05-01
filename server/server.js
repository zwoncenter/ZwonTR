const express = require("express");
const path = require("path");
const app = express();

const MongoClient = require("mongodb").MongoClient;

// ObjectId type casting을 위한 import
const ObjectId = require("mongodb").ObjectId;

// .env
require("dotenv").config();

// express에 내장된 body-parser 사용
app.use(express.urlencoded({ extended: true }));

// login 기능을 위한 import 및 middleware 등록
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
app.use(session({ secret: "비밀코드", resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// react와 nodejs 서버간 ajax 요청 잘 되게`
app.use(express.json());
var cors = require("cors");
app.use(cors());

//db라는 변수에 zwon 데이터베이스 연결, env파일 참조
var db;
MongoClient.connect(process.env.DB_URL, function (err, client) {
  if (err) {
    return console.log(err);
  }
  // db라는 변수에 zwon 데이터베이스를 연결.
  db = client.db("zwon");

  app.listen(process.env.PORT, function () {
    console.log(`listening on ${process.env.PORT}`);
  });
});

// 특정폴더 안의 파일들을 static파일로 client들에게 보내줄 수 있음
app.use(express.static(path.join(__dirname, "../zwontr/build")));

// 홈페이지(/) 접속시, build된 react의 html 전송
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "../zwontr/build/index.html"));
});

// 로그인 기능 구현, local 방식
app.post("/api/login", function (req, res, next) {
  passport.authenticate("local", function (err, user, info) {
    if (err) return next(err);
    if (!user) return res.send(info);

    req.logIn(user, function (err) {
      if (err) return next(err);
      return res.json({ user: true });
    });
  })(req, res, next);
});

// ID와 PW를 검사해주는 코드.
passport.use(
  new LocalStrategy(
    {
      usernameField: "id", // form의 name이 id 인 것이 username
      passwordField: "pw", // form의 name이 pw 인 것이 password
      session: true, // session을 저장할 것인지
      passReqToCallback: false, // id/pw 외에 다른 정보 검증 시
    },
    function (inputID, inputPW, done) {
      console.log(inputID, "login trial");
      db.collection("account").findOne({ ID: inputID }, function (err, result) {
        if (err) return done(err);
        // done 문법 (서버에러, 성공시 사용자 DB, 에러메세지)
        if (!result) return done(null, false, { message: "존재하지 않는 아이디 입니다." });
        // buf 참조해서 암호화 및 비교진행
        if (inputPW == result.PW) {
          console.log("로그인 성공, ", result);
          return done(null, result);
        } else {
          return done(null, false, {
            message: "비밀번호가 일치하지 않습니다.",
          });
        }
      });
    }
  )
);

// id를 이용해서 세션을 저장시키는 코드(로그인 성공 시)
passport.serializeUser(function (user, done) {
  done(null, user.ID);
});

// 이 세션 데이터를 가진 사람을 DB에서 찾는 코드.
// 하단 코드의 '아이디'는 윗 코드의 user.ID이다.
passport.deserializeUser(function (아이디, done) {
  // DB에서 user.id로 유저를 찾은 뒤에, 유저 정보를 {}안에 넣음\
  db.collection("account").findOne({ ID: 아이디 }, function (err, result) {
    done(null, result);
  });
});

// loginCheck라는 middleware 선언
function loginCheck(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.send("로그인필요");
  }
}

// collection 중 StudentDB의 모든 Document find 및 전송
app.get("/api/studentList", loginCheck, function (req, res) {
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

app.get("/api/managerList", loginCheck, (req, res) => {
  db.collection("Manager")
    .find()
    .toArray((err, result) => {
      if (err) {
        return console.log("api/managerList - find Error : ", err);
      }
      res.send(result[0]["매니저"]);
    });
});

// StudentDB에 새로운 stuDB 추가 요청
app.post("/api/StudentDB/add", loginCheck, function (req, res) {
  const newDB = req.body;
  db.collection("StudentDB").findOne({ 이름: newDB.이름 }, function (err, result) {
    if (err) {
      console.log("/api/studentAdd findOne Error : ", err);
      return res.send("/api/studentAdd findOne Error : ", err);
    }
    if (result !== null) {
      return res.send("중복되는 이름의 학생DB가 존재합니다");
    }
    db.collection("StudentDB").insertOne(newDB, (err2, result2) => {
      if (err2) {
        return console.log("신규 학생DB 저장 실패");
      }
      db.collection("StudentDB_Log").insertOne(newDB, (err3, result) => {
        if (err3) {
          return console.log("신규학생 로그데이터 저장 실패");
        }
        console.log("신규학생 로그데이터 저장 완료");
      });
      console.log("신규 학생DB 저장 완료");
      return res.send(true);
    });
  });
});

// StudentDB에서 해당 ID의 document 조회
app.get("/api/StudentDB/find/:ID", loginCheck, function (req, res) {
  // const paramID = "강진영_050525";
  const paramID = decodeURIComponent(req.params.ID);
  console.log(`${paramID}의 studentDB 조회 시도`);
  db.collection("StudentDB").findOne({ ID: paramID }, function (err, result) {
    if (err) {
      return console.log("/api/studentDB/:ID - findOne Error : ", err);
    }
    console.log("결과 :", result["ID"]);
    if (result === null) {
      return res.send("동일한 ID의 학생DB가 존재하지 않습니다. 개발 / 데이터 팀에 문의해주세요");
    }
    return res.json(result);
  });
});

// StudentDB에 수정 요청
app.put("/api/StudentDB/edit", loginCheck, function (req, res) {
  const newstuDB = req.body;
  const findID = newstuDB["ID"];
  delete newstuDB._id;
  console.log("기존 학생DB 수정 시도", findID);
  db.collection(`StudentDB`).findOne({ ID: findID }, function (err, result) {
    console.log(result);
    if (err) {
      return console.log(`/api/StudentEdit - findOne Error : `, err);
    }
    if (result === null) {
      return res.send("동일한 ID의 학생DB가 존재하지 않습니다. 개발 / 데이터 팀에 문의해주세요");
    }
    db.collection("StudentDB").updateOne({ ID: findID }, { $set: newstuDB }, function (err2, result2) {
      if (err2) {
        return console.log("/api/StudentEdit - updateOne Error : ", err2);
      }
      db.collection("StudentDB_Log").insertOne(newstuDB, (err3, result3) => {
        if (err3) {
          return console.log("기존학생 로그데이터 저장 실패");
        }
        console.log("기존학생 로그데이터 저장 완료");
      });
      console.log("기존 학생DB 수정 완료");
      return res.send(true);
    });
  });
});

// StudentDB에 삭제 요청
app.delete("/api/StudentDB/delete/:ID", loginCheck, function (req, res) {
  const stuName = req.params.name;
  console.log(stuName + "학생의 DB 삭제 시도");
  db.collection("StudentDB").deleteOne({ 이름: stuName }, (err, result) => {
    if (err) {
      console.log("/api/StudentDelete - deleteOne error : ", err);
      return res.send("/api/StudentDelete - deleteOne error : ", err);
    }
    if (result !== null) {
      console.log(`${stuName}의 DB 삭제 완료`);
      return res.send(true);
    } else {
      return res.send("deleteOne의 결과가 null입니다. 개발/데이터 팀에 문의해주세요.");
    }
  });
});

app.get("/api/TR/:ID", loginCheck, function (req, res) {
  const paramID = decodeURIComponent(req.params.ID);
  console.log(`${paramID}의 TR 리스트 조회 시도`);
  db.collection("TR")
    .find({ ID: paramID })
    .toArray(function (err, result) {
      if (err) {
        return console.log("/api/TR/:ID - find Error : ", err);
      }
      console.log(`${paramID}의 TR 리스트 조회 결과수 : `, result.length);
      return res.json(result);
    });
});

app.post("/api/TR/write", loginCheck, function (req, res) {
  const newTR = req.body;
  console.log("일간하루 저장 시도 : ", newTR.이름, newTR.날짜);
  db.collection("TR").findOne({ 이름: newTR.이름, 날짜: newTR.날짜 }, function (err, result) {
    if (err) {
      console.log(`/api/TR/write - findOne Error : `, err);
      return res.send(`/api/TR/write - findOne Error : `, err);
    }
    if (result !== null) {
      return res.send("findOne result is not null. 중복되는 날짜의 일간하루가 존재합니다.");
    }
    db.collection("TR").insertOne(newTR, function (err2, result2) {
      if (err2) {
        console.log("/api/TR/write - insertOne Error : ", err2);
        return res.send("/api/TR/write - insertOne Error : ", err2);
      }
      console.log("터미널에 표시 : 일간하루 저장 완료");
      return res.send(true);
    });
  });
});

app.put("/api/TR/edit", loginCheck, function (req, res) {
  const newTR = req.body;
  const findID = ObjectId(newTR._id);
  delete newTR._id;
  console.log("일간하루 수정 시도 : ", newTR.이름, newTR.날짜);
  db.collection("TR").findOne({ 이름: newTR.이름, 날짜: newTR.날짜 }, function (err, result) {
    if (err) {
      return res.send(`/api/TR/edit - findOne Error : `, err);
    }
    if (result !== null && !result._id.equals(findID)) {
      return res.send("중복되는 날짜의 일간하루가 존재합니다.");
    }
    db.collection(`TR`).findOne({ _id: findID }, function (err2, result2) {
      if (err2) {
        return console.log(`/api/TR/edit - findOne Error : `, err2);
      }
      if (result2 === null) {
        return res.send("일치하는 _id의 일간하루를 찾지 못했습니다. 개발 / 데이터팀에 문의해주세요");
      }
      db.collection("TR").updateOne({ _id: findID }, { $set: newTR }, function (err3, result3) {
        if (err3) {
          return res.send("/api/TR/write - updateOne Error : ", err3);
        }
        console.log("터미널에 표시 : 일간하루 수정 완료");
        return res.send(true);
      });
    });
  });
});

app.delete("/api/TR/delete/:id", loginCheck, function (req, res) {
  const trID = ObjectId(req.params.id);
  console.log("일간하루 삭제 시도 :", trID);
  db.collection("TR").deleteOne({ _id: trID }, (err, result) => {
    if (err) {
      return res.send("/api/TR/delete/:id - deleteOne error : ", err);
    }
    if (result.deletedCount === 1) {
      console.log("일간하루 삭제 완료 : ", result);
      return res.send(true);
    }
    return res.send(false);
  });
});

app.get("*", function (req, res) {
  req.sendFile(path.join(__dirname, "../zwontr/build/index.html"));
});

// app.get("/api/StuInfo/:name", loginCheck, function (req, res) {
//   const paramName = decodeURIComponent(req.params.name);
//   console.log(`${paramName}의 학생 정보 조회 시도`);
//   db.collection("StudentInfo").findOne({ 이름: paramName }, function (err, result) {
//     if (err) {
//       return console.log("/api/StuInfo/:name - find Error : ", err);
//     }
//     return res.json(result);
//   });
// });

// app.post("/api/StuInfo/add", loginCheck, function (req, res) {
//   const newInfo = req.body;
//   db.collection("StudentInfo").findOne({ 이름: newInfo.이름 }, function (err, result) {
//     if (err) {
//       console.log(`/api/StuInfo/Add - findOne Error : `, err);
//       return res.send(`/api/StuInfo/Add - findOne Error : `, err);
//     }
//     if (result !== null) {
//       return res.send("findOne result is not null. 중복되는 이름의 학생이 존재합니다.");
//     }
//     db.collection("StudentInfo").insertOne(newInfo, function (err2, result2) {
//       if (err2) {
//         console.log("/api/StuInfo/Add - insertOne Error : ", err2);
//         return res.send("/api/StuInfo/Add - insertOne Error : ", err2);
//       }
//       console.log("터미널에 표시 : 신규 학생 정보 저장 완료");
//       return res.send(true);
//     });
//   });
// });

// app.put("/api/StuInfo/edit", loginCheck, function (req, res) {
//   const newInfo = req.body;
//   const findID = ObjectId(newInfo._id);
//   delete newInfo._id;
//   console.log("학생 정보 수정 시도 : ", newInfo.이름);
//   db.collection("TR").updateOne({ _id: findID }, { $set: newInfo }, function (err, result) {
//     if (err) {
//       return res.send("/api/StuInfo/edit - updateOne Error : ", err);
//     }
//     console.log("터미널에 표시 : 학생 정보 수정 완료");
//     return res.send(true);
//   });
// });
