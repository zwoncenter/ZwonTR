const express = require("express");
const path = require("path");
const app = express();

const MongoClient = require("mongodb").MongoClient;

// ObjectId type casting을 위한 import
const ObjectId = require("mongodb").ObjectId;

// 시간 모듈 moment 설치
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

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
const { finished } = require("stream");
app.use(cors());

//db라는 변수에 zwon 데이터베이스 연결, env파일 참조
//var db, db_session;
var db, db_client;

// TODO : 배포 전에 반드시 실제 서비스(DB_URL)로 바꿀 것!!
MongoClient.connect(process.env.DB_URL, function (err, client) {
  if (err) {
    return console.log(err);
  }
  // db라는 변수에 zwon 데이터베이스를 연결.
  db = client.db("zwon");
  db_client=client;

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

// get current server date in yyyy-mm-dd format
function getCurrentKoreaDateYYYYMMDD(){
  const curr=new Date();
  const utc =
      curr.getTime() +
      (curr.getTimezoneOffset() * 60 * 1000);

  const KR_TIME_DIFF = 9 * 60 * 60 * 1000;
  const kr_curr =
      new Date(utc + (KR_TIME_DIFF));
  const year_string= String(kr_curr.getFullYear());
  let month_string= String(kr_curr.getMonth()+1);
  if(month_string.length==1) month_string="0"+month_string;
  let date_string= String(kr_curr.getDate());
  if(date_string.length==1) date_string="0"+date_string;

  // return [kr_curr.getFullYear(),kr_curr.getMonth()+1,kr_curr.getDate()].join("-");
  return [year_string,month_string,date_string].join("-");
}

//
function getValidDateString(dateString){
  //date validity check
  let date= /[\d][\d][\d][\d]-[\d][\d]-[\d][\d]/g.exec(decodeURIComponent(dateString));
  if(!date) return null;
  date=date[0];
  if(isNaN(new Date(date))) return null;
  return date;
}

// collection 중 StudentDB의 모든 Document find 및 전송
app.get("/api/studentList", loginCheck, async function (req, res) {
  // db.collection("StudentDB")
  //     .find()
  //     .toArray(function (err, result) {
  //       if (err) {
  //         return console.log("api/studentList - find Error : ", err);
  //       }
  //       console.log("api/studentList - find result length   :", result.length);
  //       res.json(result);
  //     });
  let ret=null;
  try{
    const student_list= await db.collection("StudentDB").find({"$or":[{"deleted":{"$exists":false}},{"deleted":false}]}).toArray();
    ret=student_list;
  }
  catch(error){
    ret=`error while getting student list`;
  }
  finally{
    return res.json(ret);
  }
});

// StudentDB의 모든 Document 중 graduated: false인 document만 찾는 코드
app.get("/api/ActiveStudentList", loginCheck, async (req,res)=>{
  const ret_val={"success":false, "ret":null};
  try{
    const acitve_student_list= await db.collection("StudentDB").find({"graduated":false,"$or":[{"deleted":{"$exists":false}},{"deleted":false}]}).toArray();
    ret_val["success"]=true;
    ret_val["ret"]=acitve_student_list;
  }
  catch(error){
    ret_val["ret"]=`error ${error}`;
  }
  finally{
    return res.json(ret_val);
  }
});

app.get("/api/managerList", loginCheck, async (req, res) => {
  // db.collection("Manager")
  //     .find()
  //     .toArray((err, result) => {
  //       if (err) {
  //         return console.log("api/managerList - find Error : ", err);
  //       }
  //       res.send(result[0]["매니저"]);
  //     });
  const ret={"success":false,"ret":null};
  try{
    const ret_data= await db.collection("Manager").find().toArray();
    ret["success"]=true; ret["ret"]=ret_data[0]["매니저"];
  }
  catch(e){
    ret["ret"]="매니저 목록 데이터를 불러오는 중 오류가 발생했습니다";
  }
  finally{
    return res.json(ret);
  }
});

// StudentDB에 새로운 stuDB 추가 요청
app.post("/api/StudentDB", loginCheck, async function (req, res) {
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  const newDB = req.body;
  
  // db.collection("StudentDB").findOne({ ID: newDB.ID }, function (err, result) {
  //   if (err) {
  //     console.log("/api/StudentDB findOne Error : ", err);
  //     return res.send("/api/StudentDB findOne Error : ", err);
  //   }
  //   if (result !== null) {
  //     return res.send("중복되는 ID(이름, 생년월일)의 학생DB가 존재합니다");
  //   }
  //   db.collection("StudentDB").insertOne(newDB, (err2, result2) => {
  //     if (err2) {
  //       return res.send("신규 학생DB 저장 실패", err2);
  //     }
  //     db.collection("StudentDB_Log").insertOne(newDB, (err3, result) => {
  //       if (err3) {
  //         return res.send("신규학생 로그데이터 저장 실패", err3);
  //       }
  //     });
  //     return res.send(true);
  //   });
  // });
  const ret={"success":false,"ret":null};
  const session=db_client.startSession({
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
  try{
    session.startTransaction();
    await db.collection("StudentDB").insertOne(newDB);
    await db.collection("StudentDB_Log").insertOne(newDB);
    ret["success"]=true;
    session.commitTransaction();
  }
  catch(e){
    await session.abortTransaction();
    ret["ret"]="학생 데이터 등록 중 오류가 발생했습니다";
  }
  finally{
    session.endSession();
    return res.json(ret);
  }
});

// StudentDB에서 해당 ID의 document 조회
app.get("/api/StudentDB/:ID", loginCheck, async function (req, res) {
  const student_legacy_id = decodeURIComponent(req.params.ID);
  // db.collection("StudentDB").findOne({ ID: paramID }, function (err, result) {
  //   if (err) {
  //     return res.send("/api/studentDB/:ID - findOne Error : ", err);
  //   }
  //   if (result === null) {
  //     return res.send("동일한 ID의 학생DB가 존재하지 않습니다. 개발 / 데이터 팀에 문의해주세요");
  //   }
  //   return res.json(result);
  // });
  const ret={"success":false,"ret":null};
  try{
    const student_doc= await db.collection("StudentDB").findOne({ID:student_legacy_id});
    if(!student_doc) throw new Error("no such student");
    ret["success"]=true; ret["ret"]=student_doc;
  }
  catch(e){
    ret["ret"]=`학생 정보를 조회하는 중 오류가 발생했습니다: ${e}`;
  }
  finally{
    return res.json(ret);
  }
});

// StudentDB에 수정 요청

/** ---------------- 교재 수정사항 점검 함수 ---------------- **/
// 피드백 : 교재명이 key 값과 같이 동작하므로(unique Key로 설정했었음) 교재명으로 추가/삭제를 걸러내보자

function filterTextBook(exist,newOne){

  /**
   * exist : 기존 학생DB를 조회해서 얻은 수정사항 적용 전 진행중인 교재정보
   * newOne : 이번에 학생 DB를 수정하며 새롭게 얻은 교재정보
   * **/

  let existArray = exist.map((e)=>{
    return e["교재"];
  });


  let newArray = newOne.map((e)=>{
    return e["교재"];
  })


  let existTextbookSet = new Set(existArray);
  let newTextbookSet = new Set(newArray);

  /** 삭제해야할 책 제목 = 기존교재이름과 새교재이름의 차집합 **/
  let deleteSet = new Set(
      [...existTextbookSet].filter(x => !newTextbookSet.has(x))
  );

  /** 삭제해야할 책 제목을 통해 기존 교재목록 정보 추출 **/
  let deleteArray = []

  exist.forEach((ele,idx)=>{
    if(deleteSet.has(ele["교재"])){
      deleteArray.push(ele);
      deleteSet.delete(ele["교재"]);
    }
  })




  /** 추가할 교재이름 = 새교재이름과 기존교재이름의 차집합 **/
  let insertSet = new Set(
      [...newTextbookSet].filter(x => !existTextbookSet.has(x))
  )
  /** 추가해야할 책 제목을 통해 기존 교재목록인 newOne에서 인덱스를 찾아 정보 추출 **/
  let insertArray = []
  newOne.forEach((ele,idx)=>{
    if(insertSet.has(ele["교재"])){
      insertArray.push(ele);
      insertSet.delete(ele["교재"]);

    }
  });


  return {
    deleteTextbook: deleteArray,
    insertTextbook: insertArray
  };


}

function checkDuplication(data){


  let temp = data.map((e)=>{
    return e["교재"];
  })
  let newSet = new Set(temp);

  let result = []

  // forEach x includes = O(n^2)
  // forEach x has = O(n)
  data.forEach((ele,index)=>{
    if(newSet.has(ele["교재"])){
      result.push(ele);
      newSet.delete(ele["교재"]);

    }
  })

  return result;


}

/** ------------------------------------------- **/


// StudentDB에 수정 요청
app.put("/api/StudentDB", loginCheck, async (req, res) => {
  console.log(req["user"], req["user"]["ID"] === "guest");
  /** 서버로직 처리 중 err 발생시 전체 구문 rollback을 위한 트랜잭션 처리 선언
   session.startSession() = 트랜잭션 처리 시작
   session.commitTransaction() = 트랜잭션 반영
   session.endSession() = 트랜잭션을 위한 세션 종료
   session.abortTransaction() = 트랜잭션 처리 중 오류 발생 시 rollback
   * **/
  const session=db_client.startSession({
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
  /** ------------------------------------------------------------- **/
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }

  const ret_val={"success":false,"ret" :null};
  // let success;

  let dayIndex = ['월','화','수','목','금','일'];

  const newstuDB = req.body;

  const findID = newstuDB["ID"];

  /** 기존 WeeklyStudyfeedback 콜렉션의 교재와 새롭게 수정된 교재 비교 **/

  let existingTextbook;

  try {

    session.startTransaction();
    // findOne에는 toArray() 쓰면 안됨
    let studentDB_result = await db.collection(`StudentDB`).findOne({ID: findID});
    if(!studentDB_result) throw new Error("등록되지 않은 학생입니다");

    /** 업데이트되기 전 학생교재 **/
    existingTextbook = studentDB_result["진행중교재"];

    /** 새롭게 수정 요청된 학생 교재 리스트 **/
    const newTextbook = newstuDB["진행중교재"];
    if(!("진행중교재" in newstuDB) || !(Array.isArray(newstuDB["진행중교재"]))) throw new Error("유효하지 않은 요청입니다");

    /** 오늘이 속한 주의 마지막 일요일 날짜를 가져오기
     * => 이번주에 주간학습스케줄링이 기록되어 있느냐.
     * **/
    let todayFeedback = moment().day(7).format('YYYY-MM-DD');

    if(moment().day() === 0 ){
      todayFeedback = moment().format('YYYY-MM-DD');
    }

    /** 추가하고 삭제해야할 책 정보 **/
    const updateTextbookInfo = filterTextBook(existingTextbook, newTextbook);
    // console.log(updateTextbookInfo)
    // checkDuplication(newTextbook);


    /** WeeklyStudentfeedback 콜렉션에 저장된 모든 날짜들 **/
        // 피드백 : limit(1)을 통해 모든 리스트를 가져오는 것이 아니라 1개만 가져옴으로써 연산량 줄임
    // let feedbackWeekArr = await db.collection("WeeklyStudyfeedback")
    //         .find({"학생ID": newstuDB["ID"],"피드백일":{$gte: todayFeedback}})
    //         .project({"피드백일": 1,_id: 0})
    //         .toArray();


    /** Validation : 신규 학생이 WeeklyStudyfeedback 콜렉션에 정보가 없을 때 건너뛰기 **/
    // if (feedbackWeekArr.length !== 0) {

      /** 가장 최근에 WeeklyStudentfeedback 콜렉션에 저장된 날짜 **/
      // let feedbackDate = feedbackWeekArr.at(-1)["피드백일"];
          // 날짜 범위 수정에 따른 for문으로 새롭게 추가 로직 필요
      // let feedbackDate = feedbackWeekArr[1]["피드백일"]; // 결과 array가 2보다 작을경우 문제가 됨
      // console.log(feedbackDate)
    const feedbackDate="foobar";

      /** ----------- 교재수정에 따른 WeeklyStudyfeedback 수정 ---------------- **/
      // /****/ 주석은 푸쉬할때 사라지나?

    /** ------ 교재 추가 업데이트 진행 ------ **/
    if(updateTextbookInfo.insertTextbook.length !== 0){

      await db.collection("WeeklyStudyfeedback").updateMany({"학생ID": newstuDB["ID"],"피드백일" : {$gte: todayFeedback}},
          {$push: {"thisweekGoal.교재캡쳐" : {$each : updateTextbookInfo.insertTextbook}}});

      let dict = {};
      for(let i in updateTextbookInfo.insertTextbook){

        let deadline_string = `thisweekGoal.마감일.${updateTextbookInfo.insertTextbook[i]["교재"]}`
        dict[deadline_string] = feedbackDate;

        for(let j in dayIndex){
          let string_tmp=`thisweekGoal.${dayIndex[j]}.${updateTextbookInfo.insertTextbook[i]["교재"]}`;
          dict[string_tmp] ="";
        }

      }

      await db.collection("WeeklyStudyfeedback").updateMany({"학생ID":newstuDB["ID"],"피드백일": {$gte: todayFeedback}},
          {$set:dict});
    }

    /** ------ 교재 삭제 업데이트 진행 ------ **/
    if(updateTextbookInfo.deleteTextbook.length !== 0){

      await db.collection("WeeklyStudyfeedback").updateMany({"학생ID": newstuDB["ID"],"피드백일" : {$gte: todayFeedback}},
          {$pullAll: {"thisweekGoal.교재캡쳐": updateTextbookInfo.deleteTextbook}
          });

      let dict = {};
      for(let i in updateTextbookInfo.deleteTextbook){

        let deadline_string = `thisweekGoal.마감일.${updateTextbookInfo.deleteTextbook[i]["교재"]}`
        dict[deadline_string] ="";

        for(let j in dayIndex){
          let string_tmp=`thisweekGoal.${dayIndex[j]}.${updateTextbookInfo.deleteTextbook[i]["교재"]}`;
          dict[string_tmp] ="";
        }

      }

      await db.collection("WeeklyStudyfeedback").updateMany({"학생ID":newstuDB["ID"],"피드백일": {$gte: todayFeedback}},
          {$unset:dict});
    }

          // }
    /** -------------------------------------------- **/

    delete newstuDB._id; //MongoDB에서 Object_id 중복을 막기 위해 id 삭제

    newstuDB["진행중교재"] = checkDuplication(newTextbook); // 중복 제거한 진행 중인 교재 리스트로 교체

    await db.collection("StudentDB").updateOne({ ID: findID }, { $set: newstuDB });

    await db.collection("StudentDB_Log").insertOne(newstuDB);

    session.commitTransaction();
    session.endSession();

    ret_val["success"]=true;

  }
  catch (err){
    session.abortTransaction();
    // ret_val=`error ${err}`;
    // success=false;
    // console.error(err);
    // return res.json();
    ret_val["ret"]="학생 정보 수정 중 오류가 발생했습니다";
  }
  finally{
    return res.json(ret_val);
  }

});


// StudentDB에 삭제 요청
app.delete("/api/StudentDB/:ID", loginCheck, async function (req, res) {
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  const paramID = req.params.ID;
  // db.collection("StudentDB").deleteOne({ ID: paramID }, (err, result) => {
  //   if (err) {
  //     return res.send("/api/StudentDB/:ID - deleteOne error : ", err);
  //   }
  //   if (result !== null) {
  //     return res.send(true);
  //   } else {
  //     return res.send("deleteOne의 결과가 null입니다. 개발/데이터 팀에 문의해주세요.");
  //   }
  // });
  let ret=null;
  try{
    const update_result= await db.collection("StudentDB").updateOne({ID: paramID},{$set:{deleted:true}});
    if(update_result.acknowledged!==true) return res.send('error while updating student info 0');
    ret=true;
  }
  catch(error){
    ret=`error whlie updating student info 1`
  }
  finally{
    return res.send(ret);
  }
});

//학생의 상태를 졸업으로 처리(activation flag: false)하는 코드
app.post("/api/DoGraduate/", loginCheck, async (req,res)=>{
  const ret_val={"success":false,"ret":null};
  try{
    if (req["user"]["ID"] === "guest") {
      ret_val["ret"]="게스트 계정은 저장, 수정, 삭제가 불가능합니다.";
      return;
    }
    const student_legacy_id = req.body["studentLegacyID"];
    await db.collection("StudentDB").updateOne({"ID":student_legacy_id},{"$set":{"graduated":true,"graduated_date":getCurrentKoreaDateYYYYMMDD()}});
    ret_val["success"]=true;
    ret_val["ret"]="successfully graduated";
  }
  catch(error){
    ret_val["ret"]= `error ${error}`
  }
  finally{
    return res.json(ret_val);
  }

});

// collection 중 TR의 해당 날짜의 Document find 및 전송
app.get("/api/TRlist/:date", loginCheck, async function (req, res) {
  const paramDate = req.params.date;
  // db.collection("TR")
  //     .find({ 날짜: paramDate })
  //     .toArray(function (err, result) {
  //       if (err) {
  //         return res.send("api/TRlist/:date - find Error : ", err);
  //       }
  //       return res.json(result);
  //     });

  const ret={"success":false,"ret":null};
  try{
    const ret_data= await db.collection("TR").find({날짜: paramDate}).toArray();
    ret["success"]=true; ret["ret"]=ret_data;
  }
  catch(e){
    ret["ret"]="TR 목록 데이터를 가져오는 중 오류가 발생했습니다";
  }
  finally{
    return res.json(ret);
  }
});

app.get("/api/TR/:ID", loginCheck, async function (req, res) {
  const student_legacy_id = decodeURIComponent(req.params.ID);
  // db.collection("TR")
  //     .find({ ID: paramID })
  //     .toArray(function (err, result) {
  //       if (err) {
  //         return res.send("/api/TR/:ID - find Error : ", err);
  //       }
  //       return res.json(result);
  //     });
  const ret={"success":false,"ret":null};
  try{
    const ret_data= await db.collection("TR").find({ID:student_legacy_id}).toArray();
    ret["success"]=true; ret["ret"]=ret_data;
  }
  catch(e){
    ret["ret"]="학생의 TR 목록 데이터를 가져오는 중 오류가 발생했습니다";
  }
  finally{
    return res.json(ret);
  }
});

app.get("/api/TR/:ID/:date", loginCheck, async function (req, res) {
  const student_legacy_id = decodeURIComponent(req.params.ID);
  const date_string = decodeURIComponent(req.params.date);
  // db.collection("TR").findOne({ ID: paramID, 날짜: paramDate }, function (err, result) {
  //   if (err) {
  //     return res.send("/api/TR/:ID/:date - findOne Error : ", err);
  //   }
  //   return res.json(result);
  // });
  const ret={"success":false,"ret":null};
  try{
    const tr_doc= await db.collection("TR").findOne({ID:student_legacy_id, 날짜:date_string});
    if(!tr_doc) throw new Error("조건에 맞는 TR이 존재하지 않습니다");
    ret["success"]=true; ret["ret"]=tr_doc;
  }
  catch(e){
    ret["ret"]=`해당 날짜의 학생 TR 데이터를 가져오는 중 오류가 발생했습니다: ${e}`;
  }
  finally{
    return res.json(ret);
  }
});

//특정 날짜 범위 내에 있는 TR들을 가져오는 URI
app.post("/api/TRByDateRange/", loginCheck, async function(req,res){
  const ret_val={"success":false, "ret":null};
  try{
    const student_legacy_id= req.body["studentLegacyID"];
    const from_date= req.body["fromDate"];
    const to_date= req.body["toDate"];
    const tr_list= await db.collection("TR").find({ID:student_legacy_id,날짜: {"$gt":from_date, "$lte":to_date}}).toArray();
    ret_val["success"]=true; ret_val["ret"]=tr_list;
  }
  catch(error){
    ret_val["ret"]=`Error ${error}`;
  }
  finally{
    return res.json(ret_val);
  }
});


app.post("/api/TR", loginCheck, async function (req, res) {
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  const newTR = req.body;
  // db.collection("TR").findOne({ ID: newTR.ID, 날짜: newTR.날짜 }, function (err, result) {
  //   if (err) {
  //     return res.send(`/api/TR - findOne Error : `, err);
  //   }
  //   if (result !== null) {
  //     return res.send("findOne result is not null. 중복되는 날짜의 일간하루가 존재합니다.");
  //   }
  //   db.collection("TR").insertOne(newTR, function (err2, result2) {
  //     if (err2) {
  //       return res.send("/api/TR - insertOne Error : ", err2);
  //     }
  //     return res.send(true);
  //   });
  // });

  const ret={"success":false,"ret":null};
  const student_legacy_id=newTR.ID;
  const date_string=newTR.날짜;
  try{
    const tr_doc= await db.collection("TR").findOne({ID:student_legacy_id, 날짜:date_string});
    if(tr_doc) throw new Error("해당 날짜에 작성된 TR이 이미 존재합니다");
    await db.collection("TR").insertOne(newTR);
    ret["success"]=true;
  }
  catch(e){
    ret["ret"]=`해당 날짜의 학생 TR 데이터를 저장하는 중 오류가 발생했습니다: ${e}`;
  }
  finally{
    return res.json(ret);
  }
});

app.put("/api/TR", loginCheck, async function (req, res) {
  console.log('req["user"]', req["user"]);
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  const newTR = req.body;
  let findID;
  try {
    findID = new ObjectId(newTR._id);
  } catch (err) {
    return res.send(`invalid access`);
  }

  delete newTR._id;
  // db.collection("TR").findOne({ 이름: newTR.이름, 날짜: newTR.날짜 }, function (err, result) {
  //   if (err) {
  //     return res.send(`/api/TR - findOne Error : `, err);
  //   }
  //   if (result !== null && !result._id.equals(findID)) {
  //     return res.send("중복되는 날짜의 일간하루가 존재합니다.");
  //   }
  //   db.collection(`TR`).findOne({ _id: findID }, function (err2, result2) {
  //     if (err2) {
  //       return console.log(`/api/TR - findOne Error : `, err2);
  //     }
  //     if (result2 === null) {
  //       return res.send("일치하는 _id의 일간하루를 찾지 못했습니다. 개발 / 데이터팀에 문의해주세요");
  //     }
  //     db.collection("TR").updateOne({ _id: findID }, { $set: newTR }, function (err3, result3) {
  //       if (err3) {
  //         return res.send("/api/TR - updateOne Error : ", err3);
  //       }
  //       return res.send(true);
  //     });
  //   });
  // });

  const ret={"success":false,"ret":null};
  const student_legacy_id=newTR.ID;
  const date_string=newTR.날짜;
  try{
    const tr_doc= await db.collection("TR").findOne({ID:student_legacy_id, 날짜:date_string});
    if(!tr_doc) throw new Error("해당 날짜에 저장된 TR이 없습니다");
    if(tr_doc && !tr_doc._id.equals(findID)) throw new Error("해당 날짜에 작성된 다른 TR이 이미 존재합니다");
    await db.collection("TR").updateOne({_id:findID},{ $set: newTR });
    ret["success"]=true;
  }
  catch(e){
    ret["ret"]=`해당 날짜의 학생 TR 데이터를 저장하는 중 오류가 발생했습니다: ${e}`;
  }
  finally{
    return res.json(ret);
  }
});


app.delete("/api/TR/:id", loginCheck, async function (req, res) {
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  let trID;
  try {
    trID = new ObjectId(req.params.id);
  } catch (err) {
    return res.send(`invalid access`);
  }

  // db.collection("TR").deleteOne({ _id: trID }, (err, result) => {
  //   if (err) {
  //     return res.send("/api/TR/:id - deleteOne error : ", err);
  //   }
  //   if (result.deletedCount === 1) {
  //     return res.send(true);
  //   }
  //   return res.send(false);
  // });

  const ret={"success":false,"ret":null};
  try{
    const delete_result= await db.collection("TR").deleteOne({_id:trID});
    if(delete_result.deletedCount == 0) throw new Error("작성된 TR이 없습니다");
    ret["success"]=true;
  }
  catch(e){
    ret["ret"]=`해당 날짜의 학생 TR 데이터 삭제하는 중 오류가 발생했습니다: ${e}`;
  }
  finally{
    return res.json(ret);
  }
});

app.post("/api/DailyGoalCheckLog", loginCheck, async (req,res)=>{
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  let ret_val=true;
  try{
    //여기에 transaction으로 assignment인 경우에 state change도 해줘야됨
    const logData= req.body;
    const textbookID= logData["textbookID"]?new ObjectId(logData["textbookID"]):""; // should do validity check?
    const AOSID= logData["AOSID"]?new ObjectId(logData["AOSID"]):"";
    const AOSTextbookID= logData["AOSTextbookID"]?new ObjectId(logData["AOSTextbookID"]):"";
    const studentLegacyID= logData["studentLegacyID"];
    const finishedState=logData["finishedState"]?true:false;
    const excuse=logData["excuse"];
    const description= logData["description"];

    let date=/[\d][\d][\d][\d]-[\d][\d]-[\d][\d]/g.exec(logData["date"]);
    if(!date){
      ret_val=`invalid date`;
      return;
    }
    date=date[0];
    if(isNaN(new Date(date))){
      ret_val=`invalid date`;
      return;
    }
    logData["date"]=date;

    const student_doc= await db.collection("StudentDB").findOne({"ID":studentLegacyID});
    if(!student_doc){
      ret_val=`error there is no such student`
      return;
    }
    const student_id=student_doc["_id"];
    const studentName=student_doc["이름"];
    delete logData["studentLegacyID"];
    logData["studentID"]=student_id;
    logData["studentName"]=studentName;

    await db.collection("DailyGoalCheckLog").updateOne(
        {"textbookID":textbookID,"AOSID":AOSID,"studentID":student_id,"date":date},
        {"$set":{"AOSTextbookID":AOSTextbookID,'studentName':studentName, "description":description},"$push":{"finishedStateList":finishedState,"excuseList":excuse}},
        {"upsert":true}
    );

    //lecture assignment인 경우 해당 AssignmentOfStudent document의 finished 상태도 바꾸어준다
    if(AOSID){
      const finishedDate=finishedState?getCurrentKoreaDateYYYYMMDD():"";
      await db.collection("AssignmentOfStudent").updateOne({"_id":AOSID},{"$set":{"finished":finishedState,"finished_date":finishedDate}});
    }

  }
  catch(error){
    console.log(`error ${error}`)
    ret_val=`error ${error}`;
  }
  finally{
    return res.send(ret_val);
  }
})

app.post("/api/DailyGoalCheckLogByDateRange", loginCheck, async (req,res)=>{
  const ret={"success":false,"ret":null};
  try{
    //check date validity
    const from_date= getValidDateString(decodeURIComponent(req.body.fromDate));
    const to_date= getValidDateString(decodeURIComponent(req.body.toDate));
    if(from_date===null || to_date===null) throw new Error("invalid date");
    
    //check whether student registered 
    const student_legacy_id= decodeURIComponent(req.body.studentLegacyID);
    const student_doc= await db.collection("StudentDB").findOne({ID:student_legacy_id});
    if(student_doc===null) throw new Error("no such student");
    const student_id= student_doc["_id"];
    
    const find_result= await db.collection("DailyGoalCheckLog").aggregate([
      {
        $match:{
          studentID:student_id,
          date: {"$gt":from_date, "$lte":to_date}
        },
      },
      {
        $lookup: {
          from: "AssignmentOfStudent",
          localField: "AOSID",
          foreignField: "_id",
          as: "AOS_aggregate",
        },
      },
      { 
        $unwind: {
          path:"$AOS_aggregate",
          preserveNullAndEmptyArrays:true,
        }
      },
      {
        $addFields: {
          assignmentID: "$AOS_aggregate.assignmentID",
          finishedDate: "$AOS_aggregate.finished_date",
        },
      },
      {
        $lookup: {
          from: "Assignment",
          localField: "assignmentID",
          foreignField: "_id",
          as: "Assignment_aggregate",
        },
      },
      { 
        $unwind: {
          path: "$Assignment_aggregate",
          preserveNullAndEmptyArrays:true,
        }
      },
      {
        $addFields: {
          lectureID: "$Assignment_aggregate.lectureID",
          pageRangeArray: "$Assignment_aggregate.pageRangeArray",
          assignmentDescription: "$Assignment_aggregate.description",
        },
      },
      {
        $lookup: {
          from: "Lecture",
          localField: "lectureID",
          foreignField: "_id",
          as: "Lecture_aggregate",
        },
      },
      { 
        $unwind: {
          path: "$Lecture_aggregate",
          preserveNullAndEmptyArrays:true,
        }
      },
      {
        $addFields: {
          lectureName: "$Lecture_aggregate.lectureName",
          lectureManager: "$Lecture_aggregate.manager",
          lectureSubject: "$Lecture_aggregate.subject",
        },
      },
      {
        $lookup: {
          from: "TextBook",
          localField: "AOSTextbookID",
          foreignField: "_id",
          as: "AOSTextbook_aggregate",
        },
      },
      { 
        $unwind: {
          path: "$AOSTextbook_aggregate",
          preserveNullAndEmptyArrays:true,
        }
      },
      {
        $lookup: {
          from: "TextBook",
          localField: "textbookID",
          foreignField: "_id",
          as: "Textbook_aggregate",
        },
      },
      { 
        $unwind: {
          path: "$Textbook_aggregate",
          preserveNullAndEmptyArrays:true,
        }
      },
      {
        $addFields: {
          textbookName: "$Textbook_aggregate.교재",
          AOSTextbookName: "$AOSTextbook_aggregate.교재",
        },
      },
      {
        $project: {
          lectureName: "$Lecture_aggregate.lectureName",
          lectureManager: "$Lecture_aggregate.manager",
          lectureSubject: "$Lecture_aggregate.subject",
          pageRangeArray: "$Assignment_aggregate.pageRangeArray",
          assignmentDescription: "$Assignment_aggregate.description",
          date: 1,
          studentName: 1,
          excuse: {$arrayElemAt:["$excuseList",-1]},
          finishedState: {$arrayElemAt:["$finishedStateList",-1]},
          textbookName: "$Textbook_aggregate.교재",
          AOSTextbookName: "$AOSTextbook_aggregate.교재",
        },
      }
    ]).toArray();
    ret["success"]=true; ret["ret"]=find_result;
  }
  catch(error){
    ret["ret"]=`Error ${error}`;
  }
  finally{
    return res.json(ret);
  }
});

app.post("/api/Closemeeting/:date", loginCheck, function (req, res) { // deprecated: 동시성 처리 불가 이슈
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

function getUpdatePathFromNewCloseMeetingFeedback(feedbackData){
  const ret={}
  const path_base="closeFeedback."
  Object.keys(feedbackData).forEach((feedback_hash,idx)=>{
    ret[path_base+feedback_hash]=feedbackData[feedback_hash];
  });
  return ret;
}

app.post("/api/SaveClosemeetingFeedback", loginCheck, async function (req, res) {
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  const closemeeting_feedback_data = req.body;
  const ret={"success":false,"ret":null};
  try{
    const date_string=closemeeting_feedback_data["dateString"];
    //date string validity check
    if(getValidDateString(date_string)===null) throw new Error("입력된 날짜가 올바르지 않습니다");
    const new_feedback_data=closemeeting_feedback_data["updatedFeedback"];
    await db.collection("Closemeeting").updateOne(
      {날짜:date_string},
      {$set:getUpdatePathFromNewCloseMeetingFeedback(new_feedback_data)},
      {"upsert":true}
      );
    ret["success"]=true; ret["ret"]=student_doc;
  }
  catch(e){
    ret["ret"]=`마감회의 피드백 저장 중 오류가 발생했습니다: ${e}`;
  }
  finally{
    return res.json(ret);
  }
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
  try {
    findID = new ObjectId(newClosemeeting._id);
  } catch (err) {
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
  try {
    ClosemeetingID = new ObjectId(req.params.id);
  } catch (err) {
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
  try {
    findID = new ObjectId(newMiddlemeeting._id);
  } catch (err) {
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
  try {
    MiddlemeetingID = new ObjectId(req.params.id);
  } catch (err) {
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
  try {
    findID = new ObjectId("629317f4aca8d25d84a7d0e0");
  } catch (err) {
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

app.get("/api/Textbook", loginCheck, async function (req, res) {
  // db.collection("Textbook")
  //   .find()
  //   .toArray((err, result) => {
  //     if (err) {
  //       return console.log("api/Textbook - find Error : ", err);
  //     }
  //     res.send(result[0]);
  //   });
  // let resp={날짜:"",textbookList:null};
  const ret={"success":false,"ret":null};
  try{
    const all_textbook_list=await db.collection("TextBook").find().toArray();
    // resp["textbookList"]=all_textbook_list;
    ret["success"]=true; ret["ret"]=all_textbook_list;
  }catch (e) {
    // resp=`교재 데이터를 불러오는 중 오류가 발생했습니다`;
    ret["ret"]=`교재 데이터를 불러오는 중 오류가 발생했습니다`;
  }
  finally{
    // return res.send(resp);
    return res.json(ret);
  }
  // db.collection("TextBook")
  //     .find()
  //     .toArray((err, result) => {
  //       if (err) {
  //         return console.log("api/Textbook - find Error : ", err);
  //       }
  //       const resp = { 날짜: "", textbookList: result };
  //       res.send(resp);
  //     });
});

app.put("/api/Textbook", loginCheck, function (req, res) {
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  //const newTextbook = req.body;
  //const findID = ObjectId("62b815e210c04d831adf2f5b");
  let edittedTextbook = req.body;

  edittedTextbook["updatedAt"] = moment().format('YYYY-MM-DD HH:mm:SS')

  let findID;
  try {
    findID = new ObjectId(edittedTextbook["_id"]);
  } catch (err) {
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
  db.collection("TextBook").updateOne({ _id: findID }, { $set: edittedTextbook }, function (err, result) {
    if (err) {
      return res.send("/api/Textbook/edit - updateOne Error : ", err3);
    }
    console.log("터미널에 표시 : 교재 수정 완료");
    if (result.matchedCount == 0) {
      return res.send("해당 교재가 등록되어 있지 않습니다.");
    } else {
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

app.delete("/api/Textbook/:_id", loginCheck, async (req, res) => {
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  let findID;
  try {
    findID = new ObjectId(req.params._id);
  } catch (err) {
    return res.send(`invalid access`);
  }

  let ret_val;

  try{
    const related_lecture_docs= await db.collection("TextbookOfLecture").find({textbookID:findID}).toArray();
    if(related_lecture_docs.length>0){
      return res.send(`해당 교재가 강의에 사용중이므로 삭제할 수 없습니다.`);
    }
    const del_result= await db.collection("TextBook").deleteOne({_id:findID});
    if(del_result.deletedCount == 0){
      ret_val="해당 교재가 등록되어 있지 않습니다";
    }
    else{
      ret_val=true;
    }
  }
  catch(error){
    ret_val=`Error: ${error}`;
  }
  finally{
    return res.send(ret_val);
  }

  // db.collection("TextBook").deleteOne({ _id: findID }, (err, result) => {
  //   if (err) {
  //     return res.send(`/api/Textbook - findOne Error : ${err}`);
  //   }
  //   console.log("breakpoint");
  //   if (result.deletedCount == 0) {
  //     return res.send(`해당 교재가 등록되어 있지 않습니다.`);
  //   }
  //   return res.send(true);
  // });
});

//student legacy id로 해당 학생의 모든 진행중 교재의 id를 찾아주는 코드
app.get(`/api/TextbookInProgressOfStudent/:studentLegacyID`, loginCheck, async(req,res)=>{
  const ret={"success":false,"ret":null};
  try{
    const studentLegacyID = decodeURIComponent(req.params.studentLegacyID);
    const student_doc= await db.collection("StudentDB").findOne({"ID":studentLegacyID});
    if(!student_doc) throw new Error("there is no such student");
    const student_id= student_doc["_id"];

    if(!student_doc["진행중교재"] || student_doc["진행중교재"].length==0){
      ret["success"]=true; ret["ret"]=[]; return;
    }
    const textbookList= student_doc["진행중교재"].map((e)=>e["교재"]); // this structure of mongodb document is problematic

    const data= await db.collection("TextBook").find({"교재":{"$in":textbookList}}).project({"_id":1,"교재":1}).toArray();
    ret["success"]=true; ret["ret"]=data;
  }
  catch(error){
    ret["success"]=false; ret["ret"]=`error ${error}`;
  }
  finally{
    return res.json(ret);
  }
});

//post 방식으로 한번에 여러 교재 이름 받아서 교재의 id들을 찾아주는 코드
app.post("/api/getTextbookIDsByTextbookName", loginCheck, async (req,res)=>{
  const nameData= req.body;
  let ret_val;
  let success;
  try{
    const nameList=nameData["textbookNames"]?nameData["textbookNames"]:[];
    ret_val= await db.collection("TextBook").find({"교재":{"$in":nameList}}).project({"_id":1,"교재":1}).toArray();
    success=true;
  }
  catch(error){
    ret_val=`error ${error}`;
    success=false;
  }
  finally{
    return res.json({"success":success,"ret":ret_val});
  }
});

//학생의 legacy id와 날짜를 받아서 해당 날짜의 daily goal check log들을 찾아주는 코드
app.get("/api/SavedDailyGoalCheckLogData/:studentLegacyID/:date", loginCheck, async (req,res)=>{
  const ret={"success":false,"ret":null};
  try{
    //date validity check
    const date=getValidDateString(decodeURIComponent(req.params.date));
    if(date===null) throw new Error("invalid date");

    //student validity check
    const studentLegacyID = decodeURIComponent(req.params.studentLegacyID);
    const student_doc= await db.collection("StudentDB").findOne({"ID":studentLegacyID});
    if(!student_doc) throw new Error("there is no such student");
    const student_id= student_doc["_id"];

    const logData= await db.collection("DailyGoalCheckLog")
        .find({"studentID":student_id, "date":date})
        .project({"_id":0,"AOSID":1,"textbookID":1,"excuseList":{"$slice":-1},"finishedStateList":{"$slice":-1},"date":1})
        .toArray();
    ret["success"]=true; ret["ret"]=logData;
  }
  catch(error){
    ret["success"]=false; ret["ret"]=`error ${error}`;
  }
  finally{
    return res.json(ret);
  }
});

// Lecture 관련 코드
app.get("/api/Lecture", loginCheck, async (req, res) => {
  // db.collection("Lecture")
  //     .find()
  //     .toArray((err, result) => {
  //       if (err) {
  //         return res.send(`/api/Lecture - find Error ${err}`);
  //       }
  //       return res.json(result);
  //     });
  let ret=null;
  try{
    ret= await db.collection("Lecture").find({"$or":[{"finished":{"$exists":false}},{"finished":false}]}).toArray();
  }
  catch(error){
    ret= `error while getting not finished lecture list`
  }
  finally{
    return res.json(ret);
  }
});

app.post("/api/Lecture", loginCheck, async (req, res) => {
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  //이 코드 부분에서 강의 추가 시 강의에서 사용하는 교재를 TextbookOfLecture에 추가하도록 수정 필요
  //>>transaction사용: (insertone>Lecture, insertMany>TextbookOfLecture)
  const newLecture = req.body;
  const session=db_client.startSession({
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
  let ret_val=null;
  try{
    session.startTransaction();
    const exist_lecture_document= await db.collection('Lecture').findOne({lectureID: newLecture["ID"]},{session});
    if(exist_lecture_document) throw new Error("중복되는 강의가 존재합니다.");
    const textbookID_list = newLecture["textbookIDArray"].map((textbookID)=>new ObjectId(textbookID));
    delete newLecture["textbookIDArray"];
    const new_lecture_id=new ObjectId();
    newLecture["_id"]=new_lecture_id;
    await db.collection('Lecture').insertOne(newLecture,{session});
    const textbookOfLecture_list = textbookID_list.map((textbookID)=>{return {lectureID:new_lecture_id,textbookID:textbookID}});
    await db.collection("TextbookOfLecture").insertMany(textbookOfLecture_list,{session});
    await session.commitTransaction();
    ret_val=true;
    // return res.send(true);
  }
  catch (err){
    await session.abortTransaction();
    // return res.send(`/api/StudentOfLecture/ - delete ${err}`);
    ret_val=`Error ${err}`;
  }
  finally{
    await session.endSession();
    return res.send(ret_val);
  }
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
  try {
    findID = new ObjectId(newLecture["_id"]);
  } catch (err) {
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

app.post("/api/finishLecture",loginCheck, async (req,res)=>{
  const ret={"success":false,"ret":null};
  let legacy_lecture_id=req.body.lectureID;
  try{
    const update_result= await db.collection("Lecture").updateOne({lectureID:legacy_lecture_id},{$set:{finished:true, finished_date:getCurrentKoreaDateYYYYMMDD()}});
    if(update_result.acknowledged!==true){
      ret["ret"]=`강의 완료 처리 중 에러가 발생했습니다 0`;
      return;
    }
    ret["success"]=true;
  }
  catch(error){
    ret["ret"]=`강의 완료 처리 중 에러가 발생했습니다 1`;
  }
  finally{
    return res.json(ret);
  }
});

//강의에서 사용중인 교재 관련 코드
app.get("/api/TextbookOfLecture/:lectureid", loginCheck, async (req, res) => {
  const paramID = decodeURIComponent(req.params.lectureid);
  const ret={"success":false,"ret":null};
  try{
    const ret_data= await db.collection("Lecture")
    .aggregate([
      { $match: { lectureID: paramID } },
      {
        $lookup: {
          from: "TextbookOfLecture",
          localField: "_id",
          foreignField: "lectureID",
          as: "TextbookOfLecture_aggregate",
        },
      },
      { $unwind: "$TextbookOfLecture_aggregate" },
      {
        $lookup: {
          from: "TextBook",
          localField: "TextbookOfLecture_aggregate.textbookID",
          foreignField: "_id",
          as: "TextBook_aggregate",
        },
      },
      { $unwind: "$TextBook_aggregate" },
      {
        $addFields: {
          textbookID: "$TextBook_aggregate._id",
          textbookName: "$TextBook_aggregate.교재",
        },
      },
      {
        $project: {
          _id: 0,
          textbookID: 1,
          textbookName: 1,
        },
      },
    ]).toArray();
    ret["success"]=true; ret["ret"]= ret_data;
  }
  catch(e){
    ret["ret"]="강의에서 사용중인 교재를 불러오는 중에 오류가 발생했습니다";
  }
  finally{
    return res.json(ret);
  }
  //aggregate(join) query
  db.collection("Lecture")
      .aggregate([
        { $match: { lectureID: paramID } },
        {
          $lookup: {
            from: "TextbookOfLecture",
            localField: "_id",
            foreignField: "lectureID",
            as: "TextbookOfLecture_aggregate",
          },
        },
        { $unwind: "$TextbookOfLecture_aggregate" },
        {
          $lookup: {
            from: "TextBook",
            localField: "TextbookOfLecture_aggregate.textbookID",
            foreignField: "_id",
            as: "TextBook_aggregate",
          },
        },
        { $unwind: "$TextBook_aggregate" },
        {
          $addFields: {
            textbookID: "$TextBook_aggregate._id",
            textbookName: "$TextBook_aggregate.교재",
          },
        },
        {
          $project: {
            _id: 0,
            textbookID: 1,
            textbookName: 1,
          },
        },
      ])
      .toArray((err, result) => {
        if (err) {
          return res.send(`/api/TextbookOfLecture - find Error ${err}`);
        }
        return res.json(result);
      });
});

app.post("/api/TextbookOfLecture", loginCheck, (req, res) => {
  let lectureID, newTextbookList;
  try {
    lectureID = new ObjectId(req.body.lectureID);
    newTextbookList = req.body.textbookList.map((e) => new ObjectId(e));
  } catch (err) {
    return res.send(`invalid access`);
  }

  db.collection("TextbookOfLecture")
      .find({
        lectureID: lectureID,
        textbookID: {
          $in: newTextbookList,
        },
      })
      .toArray((err, result) => {
        if (err) {
          return res.send(`/api/TextbookOfLecture - Error ${err}`);
        }
        if (result.length > 0) {
          return res.send(`이미 등록된 교재가 포함되어있습니다.`);
        }

        try {
          db.collection("TextbookOfLecture").insertMany(
              newTextbookList.map((textbookID) => {
                return {
                  lectureID: lectureID,
                  textbookID: textbookID,
                };
              })
          );
          return res.send(true);
        } catch (e) {
          return res.send(`/api/TextbookOfLecture - Error ${e}`);
        }
      });
});

app.delete("/api/TextbookOfLecture/:lectureID/:textbookID", loginCheck, async (req, res) => {
  const legacyLectureID = decodeURIComponent(req.params.lectureID);
  let lectureID, textbookID;
  try {
    textbookID = new ObjectId(decodeURIComponent(req.params.textbookID));
  } catch (err) {
    return res.send(`invalid access`);
  }
  try{
    // console.log("lid:"+legacyLectureID);
    // console.log("tid:"+textbookID);

    const lectureDocument=await db.collection("Lecture").findOne({lectureID:legacyLectureID});
    if(!lectureDocument) return res.send(`invalid access`);
    lectureID=lectureDocument["_id"];
    // console.log("lec doc:",lectureDocument);
    // return res.send("서버 점검중");
    const relatedAssignment = await db.collection("Assignment").findOne({ lectureID: lectureID, textbookID: textbookID });
    if (relatedAssignment) return res.send("현재 과제에 사용중인 교재입니다.");
    const result = await db.collection("TextbookOfLecture").deleteOne({ lectureID: lectureID, textbookID: textbookID });
    if (result.deletedCount == 1) return res.send(true);
    else return res.send(`/api/TextbookOfLecture/ - Error`);
  } catch (err) {
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
  db.collection("Lecture")
      .aggregate([
        { $match: { lectureID: paramID } },
        {
          $lookup: {
            from: "Assignment",
            localField: "_id",
            foreignField: "lectureID",
            as: "Assignment_aggregate",
          },
        },
        { $unwind: "$Assignment_aggregate" },
        {
          $addFields: {
            assignmentID: "$Assignment_aggregate._id",
            textbookID: "$Assignment_aggregate.textbookID",
            pageRangeArray: "$Assignment_aggregate.pageRangeArray",
            description: "$Assignment_aggregate.description",
            duedate: "$Assignment_aggregate.duedate",
            startdate: "$Assignment_aggregate.startdate",
          },
        },
        {
          $project: {
            _id: 0,
            assignmentID: 1,
            textbookID: 1,
            pageRangeArray: 1,
            description: 1,
            duedate: 1,
            startdate: 1,
            hiddenOnLecturePage: {$ifNull: ["$Assignment_aggregate.hiddenOnLecturePage",false]} // flag: lecture 페이지에서 과제 보여줄지 여부
          },
        },
      ])
      .toArray((err, result) => {
        if (err) {
          return res.send(`/api/StudentOfLecture - find Error ${err}`);
        }
        return res.json(result);
      });
});

app.put("/api/Assignment", loginCheck, (req, res) => {
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  const newAssignment = req.body;
  let findID;
  try{
    findID = new ObjectId(newAssignment["assignmentID"]);
    if(typeof(newAssignment["textbookID"])==="string") { // "textbookID" 필드 값은 string이어야 한다
      if(newAssignment["textbookID"].length>0) // newAssignment "textbookID" 필드가 non-empty string인 경우에만 objectid로 바꾸기 시도
        newAssignment["textbookID"]= new ObjectId(newAssignment["textbookID"]);
    }
    else {
      throw new Error("invalid textbook Id");
    }
  }
  catch(error){
    return res.send(`invalid access:  ${error}`);
  }
  delete newAssignment["assignmentID"];
  db.collection("Assignment").updateOne({ _id: findID }, { $set: newAssignment }, (err, result) => {
    if (err) {
      return res.send(`/api/Assignment - updateOne Error : ${err}`);
    }
    return res.send(true);
  });
});

app.post("/api/Assignment", loginCheck, async (req, res) => {
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  //>>transaction사용: (insertone>Assignment, insertMany>AssignmentOfStudent)
  const newAssign = req.body;
  const session=db_client.startSession({
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
  let ret_val=null;
  try{
    session.startTransaction();
    const studentGotAssign_list = newAssign["studentList"];
    delete newAssign["studentList"];
    const lect_id = new ObjectId(newAssign["lectureID"]);
    let textbook_id="";
    if(typeof(newAssign["textbookID"])==="string") { // "textbookID" 필드 값은 string이어야 한다
      if(newAssign["textbookID"].length>0) // newAssignment "textbookID" 필드가 non-empty string인 경우에만 objectid로 바꾸기 시도
        textbook_id= new ObjectId(newAssign["textbookID"]);
    }
    else {
      throw new Error("invalid textbook Id");
    }
    const lecture_doc= await db.collection("Lecture").findOne({_id:lect_id}); // to check if there is such lecture document in mongodb
    const textbook_doc= await db.collection("TextBook").findOne({_id:textbook_id}); // to check if there is such textbook document in mongodb
    if(!lecture_doc){
      throw new Error("등록된 강의가 없습니다");
    }
    newAssign["lectureID"] = lect_id;
    newAssign["textbookID"] = textbook_doc?textbook_id:"";
    const new_assignment_id=new ObjectId();
    newAssign["_id"] = new_assignment_id;
    await db.collection('Assignment').insertOne(newAssign,{session});
    const AssignmentOfStudent_list = studentGotAssign_list.map((element)=>{return {
      assignmentID:new_assignment_id,
      studentID: new ObjectId(element),
      finished: false,
      finished_date: ""}});
    await db.collection("AssignmentOfStudent").insertMany(AssignmentOfStudent_list,{session});
    await session.commitTransaction();
    ret_val=true;
  }
  catch (err){
    await session.abortTransaction();
    ret_val=`Error: ${err}`;
  }
  finally{
    await session.endSession();
    return res.send(ret_val);
  }
});


app.delete("/api/Assignment/:AssignID",loginCheck,async (req,res)=>{
  const assignment=decodeURIComponent(req.params.AssignID);
  console.log("assignment id:"+JSON.stringify(assignment));
  let assignID;
  try{
    assignID=new ObjectId(assignment);
  }
  catch(error){
    return res.send(`Error ${error}`);
  }
  // const AssignIDObj = new Object(AssignID);
  const session=db_client.startSession({
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
  let ret_val=null;
  try{
    session.startTransaction();
    // await db.collection('Assignment').deleteOne({_id: assignID},{session});
    // await db.collection('AssignmentOfStudent').deleteMany({assignmentID:assignID},{session});
    await db.collection('Assignment').updateOne({_id:assignID},{ $set: {"hiddenOnLecturePage":true} },{session});
    // throw new Error(`error on purpose!`);
    await session.commitTransaction();
    ret_val=true;
    // return res.send(true);
  }
  catch (err){
    await session.abortTransaction();
    // return res.send(`/api/StudentOfLecture/ - delete ${err}`);
    ret_val=`Error ${err}`;
  }
  finally{
    await session.endSession();
    return res.send(ret_val);
  }
});




// 강의에 등록된 과제 검색
app.get("/api/LectureAssignment/:lectureid",loginCheck, async (req,res)=>{
  const paramID = decodeURIComponent(req.params.lectureid);
  let ret_val;
  try{
    ret_val=
        await db.collection("Lecture").aggregate([
          { $match: { lectureID: paramID } },
          {
            $lookup: {
              from: "Assignment",
              localField: "_id",
              foreignField: "lectureID",
              as: "Assignment_aggregate",
            },
          },
          { $unwind: "$Assignment_aggregate" },
          {
            $addFields: {
              assignmentID: "$Assignment_aggregate._id",
              textbookID: "$Assignment_aggregate.textbookID",
              pageRangeArray: "$Assignment_aggregate.pageRangeArray",
              description: "$Assignment_aggregate.description",
              duedate: "$Assignment_aggregate.duedate",
              startdate: "$Assignment_aggregate.startdate",
            },
          },
          {
            $lookup: {
              from: "AssignmentOfStudent",
              localField: "assignmentID",
              foreignField: "assignmentID",
              as: "Assignment_Of_Student_aggregate",
            },
          },
          { $unwind: "$Assignment_Of_Student_aggregate" },
          {
            $addFields: {
              AssignmentOfStudentID: "$Assignment_Of_Student_aggregate._id",
              studentID: "$Assignment_Of_Student_aggregate.studentID",
              finished: "$Assignment_Of_Student_aggregate.finished",
              finished_date: "$Assignment_Of_Student_aggregate.finished_date",
            },
          },
          {
            $lookup: {
              from: "StudentDB",
              localField: "studentID",
              foreignField: "_id",
              as: "Student_Info_aggregate",
            },
          },
          { $unwind: "$Student_Info_aggregate" },
          {
            $addFields: {
              studentLegacyID: "$Student_Info_aggregate.ID",
              studentName: "$Student_Info_aggregate.이름",
            },
          },
          {
            $lookup: {
              from: "TextBook",
              localField: "textbookID",
              foreignField: "_id",
              as: "TextBook_Info_aggregate",
            },
          },
          // { $unwind: "$TextBook_Info_aggregate" },
          {
            $addFields: {
              textbookName: "$TextBook_Info_aggregate.교재",
            },
          },
          {
            $project: {
              assignmentID: 1,
              textbookID: 1,
              textbookName: 1,
              // TextBook_Info_aggregate: 1,
              pageRangeArray: 1,
              description: 1,
              duedate: 1,
              startdate: 1,
              AssignmentOfStudentID: 1,
              finished: 1,
              finished_date: 1,
              studentLegacyID: 1,
              studentName: 1,
              hiddenOnLecturePage: {$ifNull: ["$Assignment_aggregate.hiddenOnLecturePage",false]} // flag: lecture 페이지에서 과제 보여줄지 여부
            },
          },
        ]).toArray();
  }
  catch(error){
    ret_val=`Error ${error}`;
  }
  finally{
    return res.send(ret_val);
  }
});

//특정 학생의 과제에 대한 완료 여부 업데이트
app.post(`/api/AssignmentOfStudent/`, loginCheck, async (req,res)=>{
  let assignmentOfStudentID;
  try {
    assignmentOfStudentID = new ObjectId(req.body["assignmentOfStudentID"]);
  } catch (err) {
    return res.send(`invalid access`);
  }
  const finished=req.body["finished"],finished_date=req.body["finished_date"];
  let ret_val;
  try{
    await db.collection("AssignmentOfStudent").findOneAndUpdate({_id:assignmentOfStudentID},{$set:{"finished":finished,"finished_date":finished_date}});
    ret_val=true;
  }
  catch(error){
    ret_val=`Error ${error}`;
  }
  finally{
    return res.send(ret_val);
  }
});

//개별 강의 페이지에서 lecture ID를 받아 aggregate(join)를 통해 강의 수강중인 학생 반환
app.get("/api/StudentOfLecture/:lectureID", loginCheck, (req, res) => {
  const paramID = decodeURIComponent(req.params.lectureID);

  //aggregate(join) query
  db.collection("Lecture")
      .aggregate([
        { $match: { lectureID: paramID } },
        {
          $lookup: {
            from: "StudentOfLecture",
            localField: "_id",
            foreignField: "lectureID",
            as: "StudentOfLecture_aggregate",
          },
        },
        { $unwind: "$StudentOfLecture_aggregate" },
        {
          $lookup: {
            from: "StudentDB",
            localField: "StudentOfLecture_aggregate.studentID",
            foreignField: "_id",
            as: "studentDB_aggregate",
          },
        },
        { $unwind: "$studentDB_aggregate" },
        {
          $match:{
            "$or":[
              {"studentDB_aggregate.deleted":{"$exists":false}},
              {"studentDB_aggregate.deleted":false}
            ]
          }
        },
        {
          $addFields: {
            _sid: "$studentDB_aggregate._id",
            studentID: "$studentDB_aggregate.ID",
            studentName: "$studentDB_aggregate.이름",
          },
        },
        {
          $project: {
            _id: 0,
            _sid: 1,
            studentID: 1,
            studentName: 1,
          },
        },
      ])
      .toArray((err, result) => {
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
  let lectureID, studentID, newStudentOfLecture;
  try {
    lectureID = new ObjectId(req.body["lectureID"]);
    studentID = new ObjectId(req.body["studentID"]);
    newStudentOfLecture = { lectureID: ObjectId(req.body["lectureID"]), studentID: ObjectId(req.body["studentID"]) };
  } catch (err) {
    return res.send(`invalid access`);
  }
  //for debugging
  // const newStudentOfLecture={...req.body};
  // newStudentOfLecture["studentID"]=ObjectId(newStudentOfLecture["studentID"]);
  // newStudentOfLecture["lectureID"]=ObjectId(newStudentOfLecture["lectureID"]);
  //field 비어있는지 검사
  if (!("lectureID" in req.body) || !("studentID" in req.body)) {
    return res.send(`StudentOfLecture: 잘못된 요청입니다.`);
  }
  //실제 등록된 학생의 id인지 검사
  db.collection("StudentDB").findOne({ _id: studentID }, (err, result) => {
    if (err || result === null) {
      return res.send(`/api/StudentOfLecture - findOne Error : ${err}`);
    }
    //실제 등록된 강의의 id인지 검사
    db.collection("Lecture").findOne({ _id: lectureID }, (err2, result2) => {
      if (err2 || result2 === null) {
        return res.send(`/api/StudentOfLecture - findOne Error2 : ${err2}`);
      }
      //이미 강의에 등록되어있는 학생인지 검사
      db.collection("StudentOfLecture").findOne(newStudentOfLecture, (err3, result3) => {
        if (err3) {
          return res.send(`/api/StudentOfLecture - findOne Error3 : ${err3}`);
        }
        if (result3 !== null) {
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
  const session=db_client.startSession({
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
  let ret_val=null;
  try{
    session.startTransaction();
    const target_lecture= await db.collection('Lecture').findOne({lectureID:lectureID},{session});
    const target_student= await db.collection('StudentDB').findOne({ID:studentID},{session});
    const target_assignment_ids= await db.collection('Assignment').find({lectureID:target_lecture["_id"]}).toArray();
    await db.collection('StudentOfLecture').deleteOne({lectureID:target_lecture["_id"],studentID:target_student["_id"]},{session});
    await db.collection('AssignmentOfStudent').deleteMany({assignmentID:{$in:target_assignment_ids.map((e)=>e["_id"])},studentID:target_student["_id"]},{session})
    await session.commitTransaction();
    ret_val=true;
    // return res.send(true);
  }
  catch (err){
    await session.abortTransaction();
    // return res.send(`/api/StudentOfLecture/ - delete ${err}`);
    ret_val=`Error ${err}`;
  }
  finally{
    await session.endSession();
    return res.send(ret_val);
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

// weeklyStudyFeedback 페이지에 표시되는 이번주 강의 과제를 찾아주는 코드

app.post("/api/ThisWeekAssignment/", loginCheck, async (req,res)=>{
  const request_arguments=req.body;
  if(!("studentID" in request_arguments) || !("lastSundayDate" in request_arguments) || !("thisSundayDate" in request_arguments)){
    return res.json([]);
  }
  const student_legacy_id=request_arguments["studentID"];
  const last_sunday_date=request_arguments["lastSundayDate"];
  const this_sunday_date=request_arguments["thisSundayDate"];
  let ret_val;
  try{
    const target_student_doc= await db.collection("StudentDB").findOne({"ID":student_legacy_id});
    const target_student_id= target_student_doc["_id"];
    ret_val= await db.collection("Assignment")
        .aggregate([
          { $match: { duedate:{"$gt":last_sunday_date, "$lte":this_sunday_date} } },
          {
            $lookup: {
              from: "AssignmentOfStudent",
              localField: "_id",
              foreignField: "assignmentID",
              as: "AssignmentOfStudent_agg",
            },
          },
          { $unwind: "$AssignmentOfStudent_agg" },
          { $match: { "AssignmentOfStudent_agg.studentID":target_student_id } },
          {
            $lookup: {
              from: "Lecture",
              localField: "lectureID",
              foreignField: "_id",
              as: "Lecture_agg",
            },
          },
          { $unwind: "$Lecture_agg" },
          {
            $lookup: {
              from: "TextBook",
              localField: "textbookID",
              foreignField: "_id",
              as: "TextBook_agg",
            },
          },
          {
            $addFields: {
              lectureName:"$Lecture_agg.lectureName",
              textbookName:"$TextBook_agg.교재",
              finished: "$AssignmentOfStudent_agg.finished",
              finished_date: "$AssignmentOfStudent_agg.finished_date",
            },
          },
          {
            $project: {
              lectureName:1,
              textbookName:1,
              pageRangeArray:1,
              description:1,
              duedate:1,
              startdate:1,
              finished: 1,
              finished_date: 1,
              hiddenOnWSFPage: {$ifNull: ["$hiddenOnLecturePage",false]} // flag: 주간학습스케줄링 페이지에서 과제 보여줄지 여부
            },
          },
        ]).toArray();
  }
  catch(error){
    ret_val=[];
  }
  finally{
    return res.json(ret_val);
  }
});

// TR 페이지에 표시되는, 해당 학생의 오늘(해당 날짜) 마감인 강의 과제를 찾아주는 코드

app.post("/api/StudentTodayAssignment/", loginCheck, async (req,res)=>{
  const request_arguments=req.body;
  if(!("studentID" in request_arguments) || !("today_date" in request_arguments)){
    return res.json([]);
  }
  const student_legacy_id=request_arguments["studentID"];
  const today_date=request_arguments["today_date"];
  console.log(today_date);
  let ret_val;
  try{
    const target_student_doc= await db.collection("StudentDB").findOne({"ID":student_legacy_id});
    const target_student_id= target_student_doc["_id"];
    ret_val= await db.collection("Assignment")
        .aggregate([
          { $match: { duedate: today_date } },
          {
            $lookup: {
              from: "AssignmentOfStudent",
              localField: "_id",
              foreignField: "assignmentID",
              as: "AssignmentOfStudent_agg",
            },
          },
          { $unwind: "$AssignmentOfStudent_agg" },
          { $match: { "AssignmentOfStudent_agg.studentID":target_student_id } },
          {
            $lookup: {
              from: "Lecture",
              localField: "lectureID",
              foreignField: "_id",
              as: "Lecture_agg",
            },
          },
          { $unwind: "$Lecture_agg" },
          {
            $lookup: {
              from: "TextBook",
              localField: "textbookID",
              foreignField: "_id",
              as: "TextBook_agg",
            },
          },
          {
            $addFields: {
              manager: "$Lecture_agg.manager",
              lectureName:"$Lecture_agg.lectureName",
              lectureSubject:"$Lecture_agg.subject",
              textbookName:"$TextBook_agg.교재",
              finished: "$AssignmentOfStudent_agg.finished",
              finished_date: "$AssignmentOfStudent_agg.finished_date",
              AOSID: "$AssignmentOfStudent_agg._id",
              AOSTextbookID: "$TextBook_agg._id"
            },
          },
          {
            $project: {
              _id:0,
              lectureName:1,
              lectureSubject:1,
              textbookName:1,
              pageRangeArray:1,
              description:1,
              duedate:1,
              startdate:1,
              finished: 1,
              finished_date: 1,
              manager: 1,
              AOSID: 1,
              AOSTextbookID: 1,
              hiddenOnTRPage: {$ifNull: ["$hiddenOnLecturePage",false]} // flag: TR 페이지에서 과제 보여줄지 여부
            },
          },
        ]).toArray();
  }
  catch(error){
    ret_val=[];
  }
  finally{
    return res.json(ret_val);
  }
});





// stickynote 관련 코드

app.get("/api/stickynote", loginCheck, (req, res) => {
  db.collection("stickynote")
      .find()
      .toArray(function (err, result) {
        if (err) {
          return res.send(`/api/stickynote - find Error : ${err}`);
        }
        console.log("api/stickynote - find result length   :", result.length);
        return res.json(result);
      });
});

app.post("/api/stickynote", loginCheck, function (req, res) {
  if (req["user"]["ID"] === "guest") {
    return res.send("게스트 계정은 저장, 수정, 삭제가 불가능합니다.");
  }
  const newStickynote = req.body;
  console.log(req.body);
  db.collection("stickynote").findOne({ note: newStickynote["note"] }, function (err, result) {
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
  try {
    findID = new ObjectId(newstickynote["_id"]);
  } catch (err) {
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
  let findID;
  try {
    findID = new ObjectId(req.params.id);
  } catch (err) {
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
