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
const { send } = require("process");
app.use(cors());

//db라는 변수에 zwon 데이터베이스 연결, env파일 참조
var db, db_session;
MongoClient.connect(process.env.DB_URL, function (err, client) {
  if (err) {
    return console.log(err);
  }
  // db라는 변수에 zwon 데이터베이스를 연결.
  db = client.db("zwon");
  db_session= client.startSession({
    defaultTransactionOptions: {
      readConcern: {
          level: 'snapshot'
      },
      writeConcern: {
          w: 'majority'
      },
      readPreference: 'primary'
    }
  });

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
app.post("/api/StudentDB", loginCheck, function (req, res) {
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  const newDB = req.body;
  db.collection("StudentDB").findOne({ ID: newDB.ID }, function (err, result) {
    if (err) {
      console.log("/api/StudentDB findOne Error : ", err);
      return res.send("/api/StudentDB findOne Error : ", err);
    }
    if (result !== null) {
      return res.send("중복되는 ID(이름, 생년월일)의 학생DB가 존재합니다");
    }
    db.collection("StudentDB").insertOne(newDB, (err2, result2) => {
      if (err2) {
        return res.send("신규 학생DB 저장 실패", err2);
      }
      db.collection("StudentDB_Log").insertOne(newDB, (err3, result) => {
        if (err3) {
          return res.send("신규학생 로그데이터 저장 실패", err3);
        }
      });
      return res.send(true);
    });
  });
});

// StudentDB에서 해당 ID의 document 조회
app.get("/api/StudentDB/:ID", loginCheck, function (req, res) {
  const paramID = decodeURIComponent(req.params.ID);
  db.collection("StudentDB").findOne({ ID: paramID }, function (err, result) {
    if (err) {
      return res.send("/api/studentDB/:ID - findOne Error : ", err);
    }
    if (result === null) {
      return res.send("동일한 ID의 학생DB가 존재하지 않습니다. 개발 / 데이터 팀에 문의해주세요");
    }
    return res.json(result);
  });
});

// StudentDB에 수정 요청
app.put("/api/StudentDB", loginCheck, function (req, res) {
  console.log(req["user"], req["user"]["ID"] === "guest");
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  const newstuDB = req.body;
  const findID = newstuDB["ID"];
  delete newstuDB._id;
  db.collection(`StudentDB`).findOne({ ID: findID }, function (err, result) {
    if (err) {
      return res.send(`/api/StudentEdit - findOne Error : `, err);
    }
    if (result === null) {
      return res.send("동일한 ID의 학생DB가 존재하지 않습니다. 개발 / 데이터 팀에 문의해주세요");
    }
    db.collection("StudentDB").updateOne({ ID: findID }, { $set: newstuDB }, function (err2, result2) {
      if (err2) {
        return res.send("/api/StudentEdit - updateOne Error : ", err2);
      }
      db.collection("StudentDB_Log").insertOne(newstuDB, (err3, result3) => {
        if (err3) {
          return res.send("기존학생 로그데이터 저장 실패");
        }
      });
      return res.send(true);
    });
  });
});

// StudentDB에 삭제 요청
app.delete("/api/StudentDB/:ID", loginCheck, function (req, res) {
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  const paramID = req.params.ID;
  db.collection("StudentDB").deleteOne({ ID: paramID }, (err, result) => {
    if (err) {
      return res.send("/api/StudentDB/:ID - deleteOne error : ", err);
    }
    if (result !== null) {
      return res.send(true);
    } else {
      return res.send("deleteOne의 결과가 null입니다. 개발/데이터 팀에 문의해주세요.");
    }
  });
});

// collection 중 TR의 해당 날짜의 Document find 및 전송
app.get("/api/TRlist/:date", loginCheck, function (req, res) {
  const paramDate = req.params.date;
  db.collection("TR")
    .find({ 날짜: paramDate })
    .toArray(function (err, result) {
      if (err) {
        return res.send("api/TRlist/:date - find Error : ", err);
      }
      return res.json(result);
    });
});

app.get("/api/TR/:ID", loginCheck, function (req, res) {
  const paramID = decodeURIComponent(req.params.ID);
  db.collection("TR")
    .find({ ID: paramID })
    .toArray(function (err, result) {
      if (err) {
        return res.send("/api/TR/:ID - find Error : ", err);
      }
      return res.json(result);
    });
});

app.get("/api/TR/:ID/:date", loginCheck, function (req, res) {
  const paramID = decodeURIComponent(req.params.ID);
  const paramDate = decodeURIComponent(req.params.date);
  db.collection("TR").findOne({ ID: paramID, 날짜: paramDate }, function (err, result) {
    if (err) {
      return res.send("/api/TR/:ID/:date - findOne Error : ", err);
    }
    return res.json(result);
  });
});

app.post("/api/TR", loginCheck, function (req, res) {
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  const newTR = req.body;
  db.collection("TR").findOne({ ID: newTR.ID, 날짜: newTR.날짜 }, function (err, result) {
    if (err) {
      return res.send(`/api/TR - findOne Error : `, err);
    }
    if (result !== null) {
      return res.send("findOne result is not null. 중복되는 날짜의 일간하루가 존재합니다.");
    }
    db.collection("TR").insertOne(newTR, function (err2, result2) {
      if (err2) {
        return res.send("/api/TR - insertOne Error : ", err2);
      }
      return res.send(true);
    });
  });
});

app.put("/api/TR", loginCheck, function (req, res) {
  console.log('req["user"]', req["user"]);
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  const newTR = req.body;
  let findID;
  try{
    findID = new bjectId(newTR._id);
  }
  catch(err){
    return res.send(`invalid access`);
  }
  
  delete newTR._id;
  db.collection("TR").findOne({ 이름: newTR.이름, 날짜: newTR.날짜 }, function (err, result) {
    if (err) {
      return res.send(`/api/TR - findOne Error : `, err);
    }
    if (result !== null && !result._id.equals(findID)) {
      return res.send("중복되는 날짜의 일간하루가 존재합니다.");
    }
    db.collection(`TR`).findOne({ _id: findID }, function (err2, result2) {
      if (err2) {
        return console.log(`/api/TR - findOne Error : `, err2);
      }
      if (result2 === null) {
        return res.send("일치하는 _id의 일간하루를 찾지 못했습니다. 개발 / 데이터팀에 문의해주세요");
      }
      db.collection("TR").updateOne({ _id: findID }, { $set: newTR }, function (err3, result3) {
        if (err3) {
          return res.send("/api/TR - updateOne Error : ", err3);
        }
        return res.send(true);
      });
    });
  });
});

app.delete("/api/TR/:id", loginCheck, function (req, res) {
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  let trID
  try{
    trID=new ObjectId(req.params.id);
  }
  catch(err){
    return res.send(`invalid access`);
  }

  db.collection("TR").deleteOne({ _id: trID }, (err, result) => {
    if (err) {
      return res.send("/api/TR/:id - deleteOne error : ", err);
    }
    if (result.deletedCount === 1) {
      return res.send(true);
    }
    return res.send(false);
  });
});

app.post("/api/Closemeeting/:date", loginCheck, function (req, res) {
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  const paramDate = decodeURIComponent(req.params.date);
  const newClosemeeting = req.body;
  db.collection("Closemeeting").findOne({ 날짜: paramDate }, function (err, result) {
    if (err) {
      return res.send(`/api/Closemeeting/:date - findOne Error : `, err);
    }
    if (result !== null) {
      return res.send("findOne result is not null. 중복되는 날짜의 마감회의가 존재합니다.");
    }
    db.collection("Closemeeting").insertOne(newClosemeeting, function (err2, result2) {
      if (err2) {
        return res.send("/api/Closemeeting/:date - insertOne Error : ", err2);
      }
      return res.send(true);
    });
  });
});

app.get("/api/Closemeeting/:date", loginCheck, function (req, res) {
  const paramDate = decodeURIComponent(req.params.date);
  db.collection("Closemeeting").findOne({ 날짜: paramDate }, function (err, result) {
    if (err) {
      return console.log("/api/Closemeeting/:date - findOne Error : ", err);
    }
    return res.json(result);
  });
});

app.put("/api/Closemeeting/:date", loginCheck, function (req, res) {
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  const paramDate = decodeURIComponent(req.params.date);
  const newClosemeeting = req.body;
  let findID;
  try{
    findID = new ObjectId(newClosemeeting._id);
  }
  catch(err){
    return res.send(`invalid access`);
  }
   
  delete newClosemeeting._id;
  db.collection("Closemeeting").findOne({ 날짜: paramDate }, function (err, result) {
    if (err) {
      return res.send(`/api/Closemeeting/:date - findOne Error : `, err);
    }
    if (result !== null && !result._id.equals(findID)) {
      return res.send("중복되는 날짜의 마감회의가 존재합니다.");
    }
    db.collection(`Closemeeting`).findOne({ _id: findID }, function (err2, result2) {
      if (err2) {
        return res.send(`/api/Closemeeting/:date - findOne Error : `, err2);
      }
      if (result2 === null) {
        return res.send("일치하는 _id의 마감회의를 찾지 못했습니다. 개발 / 데이터팀에 문의해주세요");
      }
      db.collection("Closemeeting").updateOne({ _id: findID }, { $set: newClosemeeting }, function (err3, result3) {
        if (err3) {
          return res.send(err3);
        }
        return res.send(true);
      });
    });
  });
});

app.delete("/api/Closemeeting/:id", loginCheck, function (req, res) {
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  let ClosemeetingID;
  try{
    ClosemeetingID = new ObjectId(req.params.id);
  }
  catch(err){
    return res.send(`invalid access`);
  }

  console.log("마감회의 삭제 시도 :", ClosemeetingID);
  db.collection("Closemeeting").deleteOne({ _id: ClosemeetingID }, (err, result) => {
    if (err) {
      return res.send("/api/Closemeeting/delete/:id - deleteOne error : ", err);
    }
    if (result.deletedCount === 1) {
      console.log("마감회의 삭제 완료 : ", result);
      return res.send(true);
    }
    return res.send(false);
  });
});

// Middle Meeting

app.post("/api/Middlemeeting/:date", loginCheck, function (req, res) {
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  const paramDate = decodeURIComponent(req.params.date);
  const newMiddlemeeting = req.body;
  console.log("중간회의 저장 시도 : ", paramDate);
  db.collection("Middlemeeting").findOne({ 날짜: paramDate }, function (err, result) {
    if (err) {
      console.log(`/api/Middlemeeting/write/:date - findOne Error : `, err);
      return res.send(`/api/Middlemeeting/write/:date - findOne Error : `, err);
    }
    if (result !== null) {
      return res.send("findOne result is not null. 중복되는 날짜의 중간 회의가 존재합니다.");
    }
    db.collection("Middlemeeting").insertOne(newMiddlemeeting, function (err2, result2) {
      if (err2) {
        console.log("/api/Middlemeeting/write/:date - insertOne Error : ", err2);
        return res.send("/api/Middlemeeting/write/:date - insertOne Error : ", err2);
      }
      console.log("터미널에 표시 : 중간회의 저장 완료");
      return res.send(true);
    });
  });
});

app.get("/api/Middlemeeting/:date", loginCheck, function (req, res) {
  const paramDate = decodeURIComponent(req.params.date);
  console.log(`${paramDate} 날짜 중간회의 조회 시도`);
  db.collection("Middlemeeting").findOne({ 날짜: paramDate }, function (err, result) {
    if (err) {
      return console.log("/api/Middlemeeting/find/:date - findOne Error : ", err);
    }
    return res.json(result);
  });
});

app.put("/api/Middlemeeting/:date", loginCheck, function (req, res) {
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  const paramDate = decodeURIComponent(req.params.date);
  const newMiddlemeeting = req.body;
  let findID;
  try{
    findID = new ObjectId(newMiddlemeeting._id);
  }
  catch(err){
    return res.send(`invalid access`);
  }

  delete newMiddlemeeting._id;
  console.log("중간회의 수정 시도 : ", paramDate);
  db.collection("Middlemeeting").findOne({ 날짜: paramDate }, function (err, result) {
    if (err) {
      return res.send(`/api/Middlemeeting/edit/:date - findOne Error : `, err);
    }
    if (result !== null && !result._id.equals(findID)) {
      return res.send("중복되는 날짜의 중간회의가 존재합니다.");
    }
    db.collection(`Middlemeeting`).findOne({ _id: findID }, function (err2, result2) {
      if (err2) {
        return console.log(`/api/Middlemeeting/edit/:date - findOne Error : `, err2);
      }
      if (result2 === null) {
        return res.send("일치하는 _id의 중간회의를 찾지 못했습니다. 개발 / 데이터팀에 문의해주세요");
      }
      db.collection("Middlemeeting").updateOne({ _id: findID }, { $set: newMiddlemeeting }, function (err3, result3) {
        if (err3) {
          return res.send("/api/Middlemeeting/edit/:date - updateOne Error : ", err3);
        }
        console.log("터미널에 표시 : 중간회의 수정 완료");
        return res.send(true);
      });
    });
  });
});

app.delete("/api/Middlemeeting/:id", loginCheck, function (req, res) {
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  let MiddlemeetingID;
  try{
    MiddlemeetingID = new ObjectId(req.params.id);
  }
  catch(err){
    return res.send(`invalid access`);
  }
  
  console.log("중간회의 삭제 시도 :", MiddlemeetingID);
  db.collection("Middlemeeting").deleteOne({ _id: MiddlemeetingID }, (err, result) => {
    if (err) {
      return res.send("/api/Middlemeeting/delete/:id - deleteOne error : ", err);
    }
    if (result.deletedCount === 1) {
      console.log("중간회의 삭제 완료 : ", result);
      return res.send(true);
    }
    return res.send(false);
  });
});

app.get("/api/Todolist", loginCheck, function (req, res) {
  db.collection("Todolist")
    .find()
    .toArray((err, result) => {
      if (err) {
        return console.log("api/Todolist - find Error : ", err);
      }
      res.send(result[0]["Todolist"]);
    });
});

app.put("/api/Todolist", loginCheck, function (req, res) {
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  const newTodolist = { Todolist: req.body };
  let findID;
  try{
    findID = new ObjectId("629317f4aca8d25d84a7d0e0");
  }
  catch(err){
    return res.send(`invalid access`);
  }
  
  db.collection("Todolist").updateOne({ _id: findID }, { $set: newTodolist }, function (err3, result3) {
    if (err3) {
      return res.send("/api/Todolist/edit- updateOne Error : ", err3);
    }
    console.log("터미널에 표시 : Todolist 수정 완료");
    return res.send(true);
  });
});

app.get("/api/Textbook", loginCheck, function (req, res) {
  // db.collection("Textbook")
  //   .find()
  //   .toArray((err, result) => {
  //     if (err) {
  //       return console.log("api/Textbook - find Error : ", err);
  //     }
  //     res.send(result[0]);
  //   });

  db.collection("TextBook")
  .find()
  .toArray((err, result) => {
    if (err) {
      return console.log("api/Textbook - find Error : ", err);
    }
    const resp={'날짜':'','textbookList':result};
    res.send(resp);
  });
});

app.put("/api/Textbook", loginCheck, function (req, res) {
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  //const newTextbook = req.body;
  //const findID = ObjectId("62b815e210c04d831adf2f5b");
  const edittedTextbook= req.body;
  let findID;
  try{
    findID = new ObjectId(edittedTextbook["_id"]);
  }
  catch(err){
    return res.send(`invalid access`);
  }
  
  delete edittedTextbook["_id"];
  
  // db.collection("TextBook").findOne({ _id:findID }, (err, result) => {
  //   if (err) {
  //     return res.send(`/api/Lecture - findOne Error : ${err}`);
  //   }
  //   if (result == null) {
  //     return res.send(`등록되어 있지 않은 교재입니다.`);
  //   }
    
  // });
  db.collection("TextBook").updateOne({ _id: findID }, { $set: edittedTextbook },function (err, result) {
    if (err) {
      return res.send("/api/Textbook/edit - updateOne Error : ", err3);
    }
    console.log("터미널에 표시 : 교재 수정 완료");
    if(result.matchedCount==0){
      return res.send("해당 교재가 등록되어 있지 않습니다.");
    }
    else{
      return res.send(true);
    }
  });
  
});

app.post("/api/Textbook", loginCheck, (req, res) => {
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  const newTextbook = req.body;
  db.collection("TextBook").findOne({ 교재: newTextbook["교재"] }, (err, result) => {
    if (err) {
      return res.send(`/api/TextBook - findOne Error : ${err}`);
    }
    if (result !== null) {
      return res.send(`findOne result is not null. 중복되는 이름의 교재가 존재합니다.`);
    }
    db.collection("TextBook").insertOne(newTextbook, (err2, result2) => {
      if (err2) {
        return res.send(`/api/TextBook - insertOne Error : ${err2}`);
      }
      return res.send(true);
    });
  });
});

app.delete("/api/Textbook/:_id", loginCheck, (req,res)=>{
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  let findID;
  try{
    findID = new ObjectId(req.params._id);
  }
  catch(err){
    return res.send(`invalid access`);
  }
  
  db.collection("TextBook").deleteOne({ _id:findID }, (err, result) => {
    if (err) {
      return res.send(`/api/Textbook - findOne Error : ${err}`);
    }
    console.log("breakpoint");
    if (result.deletedCount == 0) {
      return res.send(`해당 교재가 등록되어 있지 않습니다.`);
    }
    return res.send(true);
  });
});

// Lecture 관련 코드
app.get("/api/Lecture", loginCheck, (req, res) => {
  db.collection("Lecture")
    .find()
    .toArray((err, result) => {
      if (err) {
        return res.send(`/api/Lecture - find Error ${err}`);
      }
      return res.json(result);
    });
});

app.post("/api/Lecture", loginCheck, (req, res) => {
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  //이 코드 부분에서 강의 추가 시 강의에서 사용하는 교재를 TextbookOfLecture에 추가하도록 수정 필요
  //>>transaction사용: (insertone>Lecture, insertMany>TextbookOfLecture)
  const newLecture = req.body;
  db.collection("Lecture").findOne({ lectureID: newLecture["ID"] }, (err, result) => {
    if (err) {
      return res.send(`/api/Lecture - findOne Error : ${err}`);
    }
    if (result !== null) {
      return res.send(`findOne result is not null. 중복되는 강의가 존재합니다.`);
    }
    db.collection("Lecture").insertOne(newLecture, (err2, result2) => {
      if (err2) {
        return res.send(`/api/Lecture - insertOne Error : ${err2}`);
      }
      return res.send(true);
    });
  });
});

app.get("/api/Lecture/:lectureid", loginCheck, (req, res) => {
  const paramID = decodeURIComponent(req.params.lectureid);
  db.collection("Lecture").findOne({ lectureID: paramID }, (err, result) => {
    if (err) {
      return res.send(`/api/Lecture/${paramID} - findOne Error : ${err}`);
    }
    return res.json(result);
  });
});

app.put("/api/Lecture", loginCheck, (req, res) => {
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  const newLecture = req.body;
  let findID;
  try{
    findID = new ObjectId(newLecture["_id"]);
  }
  catch(err){
    return res.send(`invalid access`);
  }
  
  delete newLecture["_id"];
  db.collection("Lecture").updateOne({ _id: findID }, { $set: newLecture }, (err, result) => {
    if (err) {
      return res.send(`/api/Lecture - updateOne Error : ${err}`);
    }
    return res.send(true);
  });
});

app.delete("/api/Lecture/:lectureid", loginCheck, (req, res) => {
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  const paramID = decodeURIComponent(req.params.lectureid);
  db.collection("Lecture").deleteOne({ lectureID: paramID }, (err, result) => {
    if (err) {
      return res.send(`/api/Lecture/${paramID} - deleteOne Error : ${err}`);
    }
    return res.send(true);
  });
});

//강의에서 사용중인 교재 관련 코드
app.get("/api/TextbookOfLecture/:lectureid", loginCheck, (req, res) => {
  const paramID = decodeURIComponent(req.params.lectureid);
  //aggregate(join) query
  db.collection("Lecture").aggregate([
    {$match: {lectureID:paramID}},
    {$lookup:{
      from:"TextbookOfLecture",
      localField:"_id",
      foreignField:"lectureID",
      as:"TextbookOfLecture_aggregate"
    }},
    {$unwind:"$TextbookOfLecture_aggregate"},
    {$lookup:{
      from:"TextBook",
      localField:"TextbookOfLecture_aggregate.textbookID",
      foreignField:"_id",
      as:"TextBook_aggregate"
    }},
    {$unwind:"$TextBook_aggregate"},
    {$addFields:{
      textbookID:"$TextBook_aggregate._id",
      textbookName:"$TextBook_aggregate.교재"
    }},
    {$project:{
      _id:0,
      textbookID:1,
      textbookName:1
    }}
  ]).toArray((err,result)=>{
    if (err) {
      return res.send(`/api/TextbookOfLecture - find Error ${err}`);
    }
    return res.json(result);
  });
});

app.post("/api/TextbookOfLecture", loginCheck, (req, res) => {
  let lectureID, newTextbookList;
  try{
    lectureID = new ObjectId(req.body.lectureID);
    newTextbookList = req.body.textbookList.map((e)=>new ObjectId(e));
  }
  catch(err){
    return res.send(`invalid access`);
  }

  db.collection("TextbookOfLecture").find({
    lectureID:lectureID,
    textbookID:{
      "$in":newTextbookList
    }
  }).toArray((err,result)=>{
    if (err) {
      return res.send(`/api/TextbookOfLecture - Error ${err}`);
    }
    if(result.length>0){
      return res.send(`이미 등록된 교재가 포함되어있습니다.`);
    }

    try {
      db.collection("TextbookOfLecture").insertMany(newTextbookList.map((textbookID)=>{
        return {
          lectureID:lectureID,
          textbookID:textbookID,
        };
      }));
      return res.send(true);
    }
    catch (e){
      return res.send(`/api/TextbookOfLecture - Error ${e}`);
    }
  });
});

app.delete("/api/TextbookOfLecture/:lectureID/:textbookID",loginCheck,async (req,res)=>{
  const legacyLectureID=decodeURIComponent(req.params.lectureID);
  let lectureID, textbookID;
  try{
    textbookID = new ObjectId(decodeURIComponent(req.params.textbookID));
  }
  catch(err){
    return res.send(`invalid access`);
  }
  try{
    console.log("lid:"+legacyLectureID);
    console.log("tid:"+textbookID);
    
    const lectureDocument=await db.collection("Lecture").findOne({lectureID:legacyLectureID});
    if(!lectureDocument) return res.send(`invalid access`);
    lectureID=lectureDocument["_id"];
    console.log("lec doc:",lectureDocument);
    // return res.send("서버 점검중");
    const relatedAssignment=await db.collection("Assignment").findOne({lectureID:lectureID, textbookID:textbookID});
    if(relatedAssignment) return res.send("현재 과제에 사용중인 교재입니다.");
    const result= await db.collection("TextbookOfLecture").deleteOne({lectureID:lectureID,textbookID:textbookID});
    if(result.deletedCount==1)
      return res.send(true);
    else
      return res.send(`/api/TextbookOfLecture/ - Error`);
  }
  catch (err){
    return res.send(`/api/TextbookOfLecture/ - Error ${err}`);
  }
});

// 강의로 수강생 검색매칭 relation
app.get("/api/StudentOfLecture", loginCheck, (req, res) => {
  db.collection("StudentOfLecture")
    .find()
    .toArray((err, result) => {
      if (err) {
        return res.send(`/api/StudentOfLecture - find Error ${err}`);
      }
      return res.json(result);
    });
});

// 강의에 따른 과제 검색매칭 relation
app.get("/api/Assignment/:lectureid", loginCheck, (req, res) => {
  const paramID = decodeURIComponent(req.params.lectureid);
  db.collection("Lecture").aggregate([
    {$match: {lectureID:paramID}},
    {$lookup:{
      from:"Assignment",
      localField:"_id",
      foreignField:"lectureID",
      as:"Assignment_aggregate"
    }},
    {$unwind:"$Assignment_aggregate"},
    {$addFields:{
      assignmentID:"$Assignment_aggregate._id",
      textbookID:"$Assignment_aggregate.textbookID",
      pageRangeArray:"$Assignment_aggregate.pageRangeArray",
      description:"$Assignment_aggregate.description",
      duedate:"$Assignment_aggregate.duedate",
      startdate:"$Assignment_aggregate.startdate"
    }},
    {$project:{
      _id:0,
      assignmentID:1,
      textbookID:1,
      pageRangeArray:1,
      description:1,
      duedate:1,
      startdate:1
    }}
  ]).toArray((err,result)=>{
    if (err) {
      return res.send(`/api/StudentOfLecture - find Error ${err}`);
    }
    return res.json(result);
  });
  // db.collection("Assignment")
  // .find({lectureID: paramID})
  // .toArray((err, result) => {
  //   if (err) {
  //     return res.send(`/api/Assignment - find Error ${err}`);
  //   }
  //   return res.json(result);
  // });
});
//개별 강의 페이지에서 lecture ID를 받아 aggregate(join)를 통해 강의 수강중인 학생 반환
app.get("/api/StudentOfLecture/:lectureID", loginCheck, (req, res) => {
  const paramID = decodeURIComponent(req.params.lectureID);
  
  //aggregate(join) query
  db.collection("Lecture").aggregate([
    {$match: {lectureID:paramID}},
    {$lookup:{
      from:"StudentOfLecture",
      localField:"_id",
      foreignField:"lectureID",
      as:"StudentOfLecture_aggregate"
    }},
    {$unwind:"$StudentOfLecture_aggregate"},
    {$lookup:{
      from:"StudentDB",
      localField:"StudentOfLecture_aggregate.studentID",
      foreignField:"_id",
      as:"studentDB_aggregate"
    }},
    {$unwind:"$studentDB_aggregate"},
    {$addFields:{
      _sid:"$studentDB_aggregate._id",
      studentID:"$studentDB_aggregate.ID",
      studentName:"$studentDB_aggregate.이름"
    }},
    {$project:{
      _id:0,
      _sid:1,
      studentID:1,
      studentName:1
    }}
  ]).toArray((err,result)=>{
    if (err) {
      return res.send(`/api/StudentOfLecture - find Error ${err}`);
    }
    return res.json(result);
  });
});

app.post("/api/StudentOfLecture", loginCheck, (req, res) => {
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  let lectureID,studentID,newStudentOfLecture;
  try{
    lectureID=new ObjectId(req.body["lectureID"]);
    studentID=new ObjectId(req.body["studentID"]);
    newStudentOfLecture = {lectureID:ObjectId(req.body["lectureID"]),studentID:ObjectId(req.body["studentID"])};
  }
  catch(err){
    return res.send(`invalid access`);
  }
  //for debugging
  // const newStudentOfLecture={...req.body};
  // newStudentOfLecture["studentID"]=ObjectId(newStudentOfLecture["studentID"]);
  // newStudentOfLecture["lectureID"]=ObjectId(newStudentOfLecture["lectureID"]);
  //field 비어있는지 검사
  if(!("lectureID" in req.body) || !("studentID" in req.body)){
    return res.send(`StudentOfLecture: 잘못된 요청입니다.`);
  }
  //실제 등록된 학생의 id인지 검사
  db.collection("StudentDB").findOne({_id:studentID},(err,result)=>{
    if (err || result===null) {
      return res.send(`/api/StudentOfLecture - findOne Error : ${err}`);
    }
    //실제 등록된 강의의 id인지 검사
    db.collection("Lecture").findOne({_id:lectureID},(err2,result2)=>{
      if (err2 || result2===null) {
        return res.send(`/api/StudentOfLecture - findOne Error2 : ${err2}`);
      }
      //이미 강의에 등록되어있는 학생인지 검사
      db.collection("StudentOfLecture").findOne(newStudentOfLecture, (err3, result3) => {
        if (err3) {
          return res.send(`/api/StudentOfLecture - findOne Error3 : ${err3}`);
        }
        if(result3!==null){
          return res.send(`이미 강의에 등록되어있는 학생입니다`);
        }
        db.collection("StudentOfLecture").insertOne(newStudentOfLecture, (err4, result4) => {
          if (err4) {
            return res.send(`/api/StudentOfLecture - insertOne Error : ${err4}`);
          }
          return res.send(true);
        });
      });
    });
  });
});

app.delete("/api/StudentOfLecture/:lectureID/:studentID",loginCheck,async (req,res)=>{
  const lectureID=decodeURIComponent(req.params.lectureID);
  const studentID=decodeURIComponent(req.params.studentID);
  try{
    db_session.startTransaction();
    const target_lecture= await db.collection('Lecture').findOne({lectureID:lectureID});
    const target_student= await db.collection('StudentDB').findOne({ID:studentID});
    db.collection('StudentOfLecture').deleteOne({lectureID:target_lecture["_id"],studentID:target_student["_id"]});
    db_session.commitTransaction();
    return res.send(true);
  }
  catch (err){
    await db_session.abortTransaction();
    return res.send(`/api/StudentOfLecture/ - delete ${err}`);
  }
});


// studentName
app.get("/api/TRnow", loginCheck, (req, res) => {
  db.collection("StudentDB")
    .find()
    .toArray(function (err, result) {
      if (err) {
        return console.log("api/studentList - find Error : ", err);
      }
      const stuNameList = result.map((stuDB) => stuDB["ID"]);
      db.collection("TR")
        .find({ ID: { $in: stuNameList } })
        .toArray((err2, result2) => {
          if (err2) {
            return res.send(`/api/TRnow - find Error : ${err2}`);
          }
          return res.json(result2);
        });
    });
});

// Weeklymeeting 관련 코드
app.post("/api/Weeklymeeting/:date", loginCheck, (req, res) => {
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  const newWeeklymeeting = req.body;
  const paramDate = decodeURIComponent(req.params.date);
  db.collection("Weeklymeeting").findOne({ 회의일: paramDate }, (err, result) => {
    if (err) {
      return res.send(`/api/Weeklymeeting - findOne Error : ${err}`);
    }
    if (result !== null) {
      return res.send(`findOne result is not null. 중복되는 주간회의가 존재합니다.`);
    }
    db.collection("Weeklymeeting").insertOne(newWeeklymeeting, (err2, result2) => {
      if (err2) {
        return res.send(`/api/Weeklymeeting - insertOne Error : ${err2}`);
      }
      return res.send(true);
    });
  });
});

app.get("/api/Weeklymeeting/:date", loginCheck, (req, res) => {
  const paramDate = decodeURIComponent(req.params.date);
  db.collection("Weeklymeeting").findOne({ 회의일: paramDate }, (err, result) => {
    if (err) {
      return res.send(`/api/Weeklymeeting/${paramDate} - findOne Error : ${err}`);
    }
    return res.json(result);
  });
});

app.put("/api/Weeklymeeting/:date", loginCheck, (req, res) => {
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  const newWeeklymeeting = req.body;
  const paramDate = decodeURIComponent(req.params.date);
  delete newWeeklymeeting["_id"];
  db.collection("Weeklymeeting").updateOne({ 회의일: paramDate }, { $set: newWeeklymeeting }, (err, result) => {
    if (err) {
      return res.send(`/api/Weeklymeeting - updateOne Error : ${err}`);
    }
    return res.send(true);
  });
});

app.delete("/api/Weeklymeeting/:date", loginCheck, (req, res) => {
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  const paramDate = decodeURIComponent(req.params.date);
  db.collection("Weeklymeeting").deleteOne({ 회의일: paramDate }, (err, result) => {
    if (err) {
      return res.send(`/api/Weeklymeeting/${paramDate} - deleteOne Error : ${err}`);
    }
    return res.send(true);
  });
});

// Weeklystudyfeedback 관련 코드
app.post("/api/Weeklystudyfeedback/:ID/:feedbackDate", loginCheck, (req, res) => {
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  const newWeeklystudyfeedback = req.body;
  const paramDate = decodeURIComponent(req.params.feedbackDate);
  const ID = decodeURIComponent(req.params.ID);
  db.collection("WeeklyStudyfeedback").findOne({ 학생ID: ID, 피드백일: paramDate }, (err, result) => {
    if (err) {
      return res.send(`/api/Weeklystudyfeedback - findOne Error : ${err}`);
    }
    if (result !== null) {
      return res.send(`findOne result is not null. 중복되는 피드백 페이지가 존재합니다.`);
    }
    db.collection("WeeklyStudyfeedback").insertOne(newWeeklystudyfeedback, (err2, result2) => {
      if (err2) {
        return res.send(`/api/Weeklystudyfeedback - insertOne Error : ${err2}`);
      }
      return res.send(true);
    });
  });
});

app.get("/api/Weeklystudyfeedback/:ID/:feedbackDate", loginCheck, (req, res) => {
  const paramDate = decodeURIComponent(req.params.feedbackDate);
  const ID = decodeURIComponent(req.params.ID);
  db.collection("WeeklyStudyfeedback").findOne({ 학생ID: ID, 피드백일: paramDate }, (err, result) => {
    console.log(result);
    if (err) {
      return res.send(`/api/Weeklystudyfeedback/${ID}/${paramDate} - findOne Error : ${err}`);
    }
    return res.json(result);
  });
});

app.put("/api/Weeklystudyfeedback/:ID/:feedbackDate", loginCheck, (req, res) => {
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  const newWeeklystudyfeedback = req.body;
  const paramDate = decodeURIComponent(req.params.feedbackDate);
  const ID = decodeURIComponent(req.params.ID);
  delete newWeeklystudyfeedback["_id"];
  db.collection("WeeklyStudyfeedback").updateOne({ 학생ID: ID, 피드백일: paramDate }, { $set: newWeeklystudyfeedback }, (err, result) => {
    if (err) {
      return res.send(`/api/Weeklystudyfeedback - updateOne Error : ${err}`);
    }
    return res.send(true);
  });
});

app.delete("/api/Weeklystudyfeedback/:ID/:feedbackDate", loginCheck, (req, res) => {
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  const paramDate = decodeURIComponent(req.params.feedbackDate);
  const ID = decodeURIComponent(req.params.ID);
  db.collection("WeeklyStudyfeedback").deleteOne({ 학생ID: ID, 피드백일: paramDate }, (err, result) => {
    if (err) {
      return res.send(`/api/Weeklystudyfeedback/${ID}/${paramDate} - deleteOne Error : ${err}`);
    }
    return res.send(true);
  });
});


// stickynote 관련 코드

app.get("/api/stickynote", loginCheck, (req, res) => {
  db.collection("stickynote").find()
  .toArray(function (err, result) {
    if (err) {
      return res.send(`/api/stickynote - find Error : ${err}`);
    }
    console.log("api/stickynote - find result length   :", result.length);
    return res.json(result);
  })
  });

  app.post("/api/stickynote", loginCheck, function (req, res) {
    if (req["user"]["ID"] === "guest") {
      return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
    }
    const newStickynote = req.body;
    console.log(req.body);
    db.collection("stickynote").findOne({ note: newStickynote['note'] }, function (err, result) {
      // if (err) {
      //   return res.send(`/api/stickynote - findOne Error : `, err);
      // }
      // if (result !== null) {
      //   return res.send("findOne result is not null. 중복되는 메모가 존재합니다.");
      // }
      db.collection("stickynote").insertOne(newStickynote, function (err2, result2) {
        if (err2) {
          return res.send("/api/stickynote - insertOne Error : ", err2);
        }
        return res.send(true);
      });
    });
  });

app.put("/api/stickynote/:id", loginCheck, (req, res) => {
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  const newstickynote = req.body;
  let findID;
  try{
    findID=new ObjectId(newstickynote["_id"]);
  }
  catch(err){
    return res.send(`invalid access`);
  }
  delete newstickynote["_id"];
  db.collection("stickynote").updateOne({ _id: findID }, { $set: newstickynote }, (err, result) => {
    if (err) {
      return res.send(`/api/stickynote - updateOne Error : ${err}`);
    }
    return res.send(true);
  });
});

app.delete("/api/stickynote/:id", loginCheck, (req, res) => {
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  let findID
  try{
    findID=new ObjectId(req.params.id);
  }
  catch(err){
    return res.send(`invalid access`);
  }
  console.log(findID);
  db.collection("stickynote").deleteOne({ _id: findID }, (err, result) => {
    if (err) {
      return res.send(`/api/stickynote - deleteOne Error : ${err}`);
    }
    return res.send(true);
  });
});


app.use("*", express.static(path.join(__dirname, "../zwontr/build")));
app.get("*", function (req, res) {
  res.sendFile(path.join(__dirname, "../zwontr/build/index.html"));
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
