const express = require("express");
const path = require("path");
const app = express();
const crypto = require("crypto");
const authentificator = require("./authentificator.js");
const validator = require("./validator.js");
const TRDraftRequestDataValidator = require("./TRDraftDataValidator.js");
const roles = require("../role_env.js");
const MongoClient = require("mongodb").MongoClient;

// ObjectId type casting을 위한 import
const ObjectId = require("mongodb").ObjectId;

// 시간 모듈 moment 설치
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

// .env
require("dotenv").config();

//db라는 변수에 zwon 데이터베이스 연결, env파일 참조
//var db, db_session;
var db, db_client;

let db_url;
if(process.env.NODE_ENV==="production") {
  db_url=process.env.DB_URL;
}
else if(process.env.NODE_ENV==="development") {
  db_url=process.env.TEST_DB_URL;
}
else {
  db_url=process.env.DB_URL;
}

//https redirection
if(process.env.NODE_ENV=="production"){
  app.use((req,res,next)=>{
    if(req.header('x-forwarded-proto') && req.header('x-forwarded-proto') === 'http'){
      return res.redirect("https://"+req.headers.host+req.url);
    }
    else{
      next();
    }
  });
}

// express에 내장된 body-parser 사용
app.use(express.urlencoded({ extended: true }));

// login 기능을 위한 import 및 middleware 등록
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const MongoStore= require("connect-mongo");
const session_option={
  secret: process.env.SESSION_SECRET,
  // resave: true, // this is unnecessary when using mongnodb as session store; update: 2023-05-11/neccessary if want to use rolling feature of expiry setting from express-session
  resave: true,
  rolling:true,
  saveUninitialized: false,
  store:MongoStore.create({
    // mongoUrl:db_session_url,
    mongoUrl:db_url,
    dbName:process.env.SESSION_DB_NAME,
    collectionName:process.env.SESSION_COLLECTION_NAME,
    // touchAfter:process.env.SESSION_TOUCH_AFTER, // this works weird... first touchAfter period is ignored...
    stringify:false, // to query sessions with same username
  }),
  // store:MongoStore.create({clientPromise:MongoClient,dbName:process.env.SESSION_COLLECTION_NAME}),
  cookie:{maxAge:parseInt(process.env.SESSION_MAX_AGE)},
};
// if(process.env.NODE_ENV==="production"){
//   session_option.cookie["secure"]=true;
// }
app.use(session(session_option)); // cookie.secure attribute set to "true" to exploit https encoding
app.use(passport.initialize());
app.use(passport.session());

// react와 nodejs 서버간 ajax 요청 잘 되게`
app.use(express.json());
var cors = require("cors");
const { send } = require("process");
const { finished } = require("stream");
const { request } = require("http");
app.use(cors());

// TODO : 배포 전에 반드시 실제 서비스(DB_URL)로 바꿀 것!!
MongoClient.connect(db_url, function (err, client) {
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
      return res.json({ loginSuccess: true, user_mode:req.session.passport.user.user_mode});
    });
  })(req, res, next);
});

app.post("/api/logout", loginCheck, function(req,res,next){
  req.logout(function(err){
    if(err) return next(err);
    req.session.destroy();
    res.redirect("/");
  });
});

app.post("/api/changePassword", loginCheck, async function(req,res){
  const ret_val={"success":true, "ret":null};
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
    let {
      currentPassword,
      newPassword,
    }= req.body;
    if(!validator.isPasswordValid(currentPassword) || !validator.isPasswordValid(newPassword)) throw new Error(`invalid request:0`);
    const user_oid=req.session.passport.user.user_oid;
    const user_doc=await db.collection('User').findOne({_id:user_oid},{session});
    if(!user_doc) throw new Error(`invalid request:1`);
    const [password_ok,otp_used]=authentificator.checkPassword(user_doc,currentPassword,false);
    if(!password_ok){
      ret_val.success=false;
      ret_val.ret=`현재 비밀번호가 일치하지 않습니다`;
      return;
    }
    const [salt,password_hashed]=authentificator.makeHashedSync(newPassword);
    await db.collection('User').updateOne(
      {_id:user_oid},
      {
        $set:{
          salt,
          password:password_hashed,
          tmp_password:null,
        }
      },
      {session}
    );

    await session.commitTransaction();
  }
  catch(error){
    console.log(`error: ${error}`);
    await session.abortTransaction();
    ret_val.success=false;
    ret_val.ret=`네트워크 오류로 비밀번호 변경에 실패했습니다:0`;
  }
  finally{
    await session.endSession();
    return res.json(ret_val);
  }
});

app.post("/api/getTmpPassword", loginCheck, permissionCheck(Role("admin")), async function(req,res){
  const ret_val={"success":true, "ret":null};
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
    let {
      username,
    }= req.body;
    const user_doc=await db.collection('User').findOne({username,},{session});
    if(!user_doc) throw new Error(`invalid request:0`);
    const [tmp_password_raw,salt,tmp_password_hashed]=authentificator.getTmpPassword();
    const tmp_password_expiration=validator.getFarFutureDate();
    await db.collection('User').updateOne(
      {_id:user_doc._id},
      {
        $set:{
          tmp_salt:salt,
          tmp_password:tmp_password_hashed,
          tmp_password_expiration,
        }
      },
      {session},
    );
    await session.commitTransaction();
    ret_val.ret=tmp_password_raw;
  }
  catch(error){
    console.log(`error: ${error}`);
    await session.abortTransaction();
    ret_val.success=false;
    ret_val.ret=`네트워크 오류로 임시 비밀번호 발급에 실패했습니다:0`;
  }
  finally{
    await session.endSession();
    return res.json(ret_val);
  }
});

const max_session_concurrent= parseInt(process.env.MAX_SESSION_CONCURRENT);

// ID와 PW를 검사해주는 코드.
passport.use(
    new LocalStrategy(
        {
          usernameField: "id", // form의 name이 id 인 것이 username
          passwordField: "pw", // form의 name이 pw 인 것이 password
          session: true, // session을 저장할 것인지
          passReqToCallback: false, // id/pw 외에 다른 정보 검증 시
        },
        async function (inputID, inputPW, done) {
          console.log(inputID, "login trial");
          // db.collection("account").findOne({ ID: inputID }, function (err, result) {
          // db.collection("account").findOne({ username: inputID }, function (err, result) { // 이 줄만 바꾸면 username,pw 저장된 collection 바꿀 수 있음
          // db.collection("User").findOne({ username: inputID }, function (err, result) {
          //   if (err) return done(err);
          //   // done 문법 (서버에러, 성공시 사용자 DB, 에러메세지)
          //   if (!result) return done(null, false, { message: "존재하지 않는 아이디 입니다." });
          //   else if(!result.approved) return done(null,false,{message:"아직 사용이 승인되지 않은 아이디입니다.\n관리자에게 문의해주세요."})
          //   // buf 참조해서 암호화 및 비교진행
          //   const hashed_pw=authentificator.getHashedSync(inputPW,result.salt);
          //   // if (inputPW == result.PW) {
          //   // if (hashed_pw === result.password) {
          //   if(crypto.timingSafeEqual(Buffer.alloc(authentificator.BufferLen,hashed_pw),Buffer.alloc(authentificator.BufferLen,result.password))){
          //     db.collection(process.env.SESSION_COLLECTION_NAME).count({"session.passport.user.username":inputID}, function(err,count_result){
          //       if(err) return done(err);
          //       else if(count_result>max_session_concurrent){
          //         return done(null,false,{message: "접속할 수 있는 최대 연결 수를 넘어섰습니다"});
          //       }
          //       console.log("로그인 성공, ", result);
          //       console.log(`${inputID} current session num: ${count_result}`);
          //       return done(null, result);
          //     });
          //   } else {
          //     return done(null, false, {
          //       message: "비밀번호가 일치하지 않습니다.",
          //     });
          //   }
          // });
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
          let id_error=null;
          let id_user=false;
          let id_options=null;
          try{
            session.startTransaction();
            const user_doc=await db.collection("User").findOne({username: inputID},{session});
            if (!user_doc) {
              // return done(null, false, { message: "존재하지 않는 아이디 입니다." });
              id_options={ message: "존재하지 않는 아이디 입니다." };
              return;
            }
            // const hashed_pw=authentificator.getHashedSync(inputPW,user_doc.salt);
            // if(crypto.timingSafeEqual(Buffer.alloc(authentificator.BufferLen,hashed_pw),Buffer.alloc(authentificator.BufferLen,user_doc.password))){
            const [login_ok,otp_used]=authentificator.checkPassword(user_doc,inputPW);
            if(login_ok){
              if(!user_doc.approved || user_doc.suspended) {
                // return done(null,false,{message:"아직 사용이 승인되지 않은 아이디입니다.\n관리자에게 문의해주세요."});
                id_options={message:"아직 사용이 승인되지 않은 아이디입니다.\n관리자에게 문의해주세요."};
                return;
              }
              const session_count= await db.collection(process.env.SESSION_COLLECTION_NAME).countDocuments({"session.passport.user.username":inputID},{session});
              if(session_count>max_session_concurrent){
                // return done(null,false,{message: "접속할 수 있는 최대 연결 수를 넘어섰습니다"});
                id_options= {message: "접속할 수 있는 최대 연결 수를 넘어섰습니다"};
                return;
              }

              //here update tmp password expiration date as expired
              if(otp_used){
                console.log(`login breakpoint`);
                await db.collection('User').updateOne(
                  {_id:user_doc._id},
                  {
                    $set:{
                      tmp_password_expiration:validator.getSuspendedDateDefaultDate(),
                    }
                  },
                  {session}
                );
              }
              await session.commitTransaction();
              
              console.log("로그인 성공, ", user_doc);
              console.log(`${inputID} current session num: ${session_count}`);
              // return done(null, user_doc);
              id_user=user_doc;
              return;
            } else {
              // return done(null, false, { message: "비밀번호가 일치하지 않습니다."});
              id_options= { message: "비밀번호가 일치하지 않습니다."};
              return;
            }
          }
          catch(error){
            // return done(error);
            id_error=error;
            return;
          }
          finally{
            await session.endSession();
            return done(id_error,id_user,id_options);
          }
        }
    )
);

// id를 이용해서 세션을 저장시키는 코드(로그인 성공 시)
passport.serializeUser(function (user, done) {
  // done(null, user.ID);
  process.nextTick(async ()=>{
    let roles_arr=[];
    let user_mode="";
    let role_oid=null;
    let group_oid=null;
    try{
      const user_info_doc=await db.collection("User").aggregate([
        {
          $match:{
            _id:user._id
          }
        },
        {
          $lookup: {
            from: "RoleOfUser",
            localField: "_id",
            foreignField: "user_id",
            as: "RoleOfUser_aggregate",
          },
        },
        { 
          $unwind: {
            path:"$RoleOfUser_aggregate",
          }
        },
        {
          $lookup: {
            from: "Role",
            localField: "RoleOfUser_aggregate.role_id",
            foreignField: "_id",
            as: "Role_aggregate",
          },
        },
        { 
          $unwind: {
            path:"$Role_aggregate",
          }
        },
        {
          $lookup: {
            from: "GroupOfUser",
            localField: "_id",
            foreignField: "user_id",
            as: "GroupOfUser_aggregate",
          },
        },
        { 
          $unwind: {
            path:"$GroupOfUser_aggregate",
          }
        },
        {
          $lookup: {
            from: "Group",
            localField: "GroupOfUser_aggregate.group_id",
            foreignField: "_id",
            as: "Group_aggregate",
          },
        },
        { 
          $unwind: {
            path:"$Group_aggregate",
          }
        },
        {
          $project: {
            role_index: "$Role_aggregate.role_index",
            role_name: "$Role_aggregate.role_name",
            role_id: "$Role_aggregate._id",
            group_id: "$Group_aggregate._id",
          },
        }
      ]).sort({role_index:1}).toArray();
      roles_arr=user_info_doc.map((r,ridx)=>r["role_index"]);
      role_oid=(user_info_doc[0]).role_id;
      group_oid=(user_info_doc[0]).group_id;
    }
    catch(error){
      // console.log(`error while get user role info: ${error}`);
      throw new Error(`네트워크 오류로 로그인에 실패했습니다:0`);
    }
    if(roles_arr.length===0) roles_arr.push(1000);
    user_mode=roles.indexToRoleName[roles_arr[0]];
    let student_id=null;
    if(user_mode==="student"){
      try{
        const student_doc=await db.collection("StudentDB").findOne({user_id:user._id});
        if(!student_doc) throw new Error(`no such student`);
        student_id=student_doc._id;
      }
      catch(error){
        console.log(`error: ${JSON.stringify(error)}`);
        throw new Error(`네트워크 오류로 로그인에 실패했습니다:1`); // this can be thrown if data inconsistency occurs
      }
    }
    done(null,
      {
        username:user.username,
        nickname:user.nickname,
        roles:roles_arr,
        user_mode: user_mode,
        student_id:student_id,
        user_oid:user._id,
        role_oid:role_oid,
        group_oid:group_oid,
      }
    ); // passport.user에 user 정보 저장
  });
});

// 이 세션 데이터를 가진 사람을 DB에서 찾는 코드.
// 하단 코드의 '아이디'는 윗 코드의 user.ID이다.
passport.deserializeUser(function (user, done) {
  // DB에서 user.id로 유저를 찾은 뒤에, 유저 정보를 {}안에 넣음\
  // db.collection("account").findOne({ ID: 아이디 }, function (err, result) {
  //   done(null, result);
  // });
  process.nextTick(()=>{
    // db.collection("account").findOne({ username:user.username }, function (err, result) {
    //   console.log("deserialize happened!");
    //   done(null, result);
    // });
    done(null,user);
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

function isLogined(req){
  return 'session' in req && 'passport' in req.session;
}

function getUserRolesFromSession(req){
  if(!isLogined(req)) return [];
  return req.session.passport.user.roles;
}

function Role(roleName){
  return roles.roleNameToIndex[roleName];
}

function andRole(...roles){
  return roles;
}

function permissionCheck(...permissions){
  return (req,res,next)=>{
    let allowed=false;
    if(isLogined(req)){
      const role_set=new Set(getUserRolesFromSession(req));
      for(let i=0; i<permissions.length; i++){
        if(role_set.has(permissions[i])){
          allowed=true; break;
        }
      }
    }
    allowed?next():res.status(403).send("접근 권한이 없습니다").end();
  }
}

// get current server date in yyyy-mm-dd format
function getCurrentKoreaDateYYYYMMDD(){
  // const curr=new Date();
  // const utc =
  //     curr.getTime() +
  //     (curr.getTimezoneOffset() * 60 * 1000);

  // const KR_TIME_DIFF = 9 * 60 * 60 * 1000;
  // const kr_curr =
  //     new Date(utc + (KR_TIME_DIFF));
  // const year_string= String(kr_curr.getFullYear());
  // let month_string= String(kr_curr.getMonth()+1);
  // if(month_string.length==1) month_string="0"+month_string;
  // let date_string= String(kr_curr.getDate());
  // if(date_string.length==1) date_string="0"+date_string;

  // // return [kr_curr.getFullYear(),kr_curr.getMonth()+1,kr_curr.getDate()].join("-");
  // return [year_string,month_string,date_string].join("-");
  return moment().format('YYYY-MM-DD');
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

function getCurrentDate(){
  return new Date(moment().toJSON());
}

// user info data: username, nickname
app.get("/api/getMyInfo", async function (req, res) {
  const ret_val={"success":true, "ret":null};
  try{
    ret_val["ret"]={loginStatus:isLogined(req), username:"", nickname:"", user_mode:"guest"};
    if(ret_val["ret"]["loginStatus"]===true){
      ret_val["ret"].username=req.session.passport.user.username;
      ret_val["ret"].nickname=req.session.passport.user.nickname;
      ret_val["ret"].user_mode=req.session.passport.user.user_mode;
    }
  }
  catch(error){
    ret_val["success"]=false;
    ret_val["ret"]=`네트워크 오류로 내 정보를 불러오지 못했습니다`;
  }
  finally{
    return res.json(ret_val);
  }
});

//get info for my page
app.get("/api/getMyPageInfo",loginCheck, permissionCheck(Role("parent"),Role("student"),Role("manager"),Role("admin")),async function (req, res) {
  const ret_val={"success":true, "ret":null};
  try{
    const username=req.session.passport.user.username;
    const today_string=getCurrentKoreaDateYYYYMMDD();
    const result_data=(await db.collection("User").aggregate([
      {
        $match: {
          username,
        }
      },
      {
        $lookup: {
          from: "RoleOfUser",
          localField: "_id",
          foreignField: "user_id",
          as: "ROU_aggregate",
        },
      },
      { 
        $unwind: {
          path:"$ROU_aggregate",
        }
      },
      {
        $lookup: {
          from: "Role",
          localField: "ROU_aggregate.role_id",
          foreignField: "_id",
          as: "Role_aggregate",
        },
      },
      { 
        $unwind: {
          path:"$Role_aggregate",
        }
      },
      {
        $lookup: {
          from: "GroupOfUser",
          localField: "_id",
          foreignField: "user_id",
          as: "GOU_aggregate",
        },
      },
      { 
        $unwind: {
          path:"$GOU_aggregate",
        }
      },
      {
        $lookup: {
          from: "Group",
          localField: "GOU_aggregate.group_id",
          foreignField: "_id",
          as: "Group_aggregate",
        },
      },
      { 
        $unwind: {
          path:"$Group_aggregate",
        }
      },
      {
        $project:{
          username:"$username",
          nickname:"$nickname",
          role_name:"$Role_aggregate.role_name",
          group_name:"$Group_aggregate.group_name",
        }
      }
    ]).toArray())[0];
    ret_val["ret"]=result_data;
  }
  catch(error){
    console.log(`error: ${error}`);
    ret_val["success"]=false;
    ret_val["ret"]=`error while getting my alarms`;
  }
  finally{
    return res.json(ret_val);
  }
});

app.get("/api/countMyNewAlarms", loginCheck, permissionCheck(Role("manager")),async function (req, res) {
  const ret_val={"success":true, "ret":null};
  try{
    const username=req.session.passport.user.username;
    const today_string=getCurrentKoreaDateYYYYMMDD();
    const result_data=(await db.collection("User").aggregate([
      {
        $match: {
          username,
        }
      },
      {
        $lookup: {
          from: "TRDraftRequestReview",
          localField: "_id",
          foreignField: "review_from",
          as: "TDRR_aggregate",
        },
      },
      { 
        $unwind: {
          path:"$TDRR_aggregate",
        }
      },
      {
        $match: {
          "TDRR_aggregate.review_status":TRDraftRequestDataValidator.review_status_to_index["not_reviewed"]
        }
      },
      {
        $lookup: {
          from: "TRDraftRequest",
          let: {
            study_data_review_id: "$TDRR_aggregate.study_data_review_id",
            tr_draft_request_id: "$TDRR_aggregate.tr_draft_request_id"
          },
          pipeline:[
            {
              $match:{
                $expr:{
                  $and:[
                    {
                      $eq:[
                        {
                          "$getField":{
                            "field": "review_id",
                            "input": {"$last":"$study_data_list"}
                          }
                        },
                        "$$study_data_review_id"
                      ]
                    },
                    {
                      $eq:[
                        "$_id",
                        "$$tr_draft_request_id"
                      ]
                    },
                    {
                      $eq:[
                        "$date",
                        today_string
                      ]
                    }
                  ]
                }
              }
            },
            {
              $project:{
                student_id:"$student_id",
                request_date:"$date",
                request_type:"$request_type",
                request_specific_data:"$request_specific_data",
                study_data:{"$last":"$study_data_list"},
              }
            }
          ],
          as: "TrDraftRequest_aggregate",
        },
      },
      {
        $unwind:{
          path: "$TrDraftRequest_aggregate"
        }
      },
      {
        $count: "my_new_alarms_count"
      }
    ]).toArray());
    ret_val["ret"]=result_data.length>0?(result_data[0]).my_new_alarms_count : 0;
  }
  catch(error){
    console.log(`error in count alarms: ${error}`);
    ret_val["success"]=false;
    ret_val["ret"]=`error while getting my alarms`;
  }
  finally{
    return res.json(ret_val);
  }
});

// user alarm data: get alarms when user role is manager
app.post("/api/getMyAlarms", loginCheck, permissionCheck(Role("manager")),async function (req, res) {
  const ret_val={"success":true, "ret":null};
  try{
    ret_val["ret"]={
      pagination:{
        cur_page:1,
        total_page_num:1,
        alarms_data:[],
        pageInvalid:false,
      },
    };
    let {
      queryPage
    }= req.body;
    if(!Number.isInteger(queryPage) || queryPage<1) throw new Error(`query page invalid`);
    
    const username=req.session.passport.user.username;
    const today_string=getCurrentKoreaDateYYYYMMDD();
    const result_data=(await db.collection("User").aggregate([
      {
        $match: {
          username,
        }
      },
      {
        $lookup: {
          from: "TRDraftRequestReview",
          localField: "_id",
          foreignField: "review_from",
          as: "TDRR_aggregate",
        },
      },
      { 
        $unwind: {
          path:"$TDRR_aggregate",
        }
      },
      {
        $lookup: {
          from: "TRDraftRequest",
          let: {
            study_data_review_id: "$TDRR_aggregate.study_data_review_id",
            tr_draft_request_id: "$TDRR_aggregate.tr_draft_request_id"
          },
          pipeline:[
            {
              $match:{
                $expr:{
                  $and:[
                    {
                      $eq:[
                        {
                          "$getField":{
                            "field": "review_id",
                            "input": {"$last":"$study_data_list"}
                          }
                        },
                        "$$study_data_review_id"
                      ]
                    },
                    {
                      $eq:[
                        "$_id",
                        "$$tr_draft_request_id"
                      ]
                    },
                    {
                      $eq:[
                        "$date",
                        today_string
                      ]
                    }
                  ]
                }
              }
            },
            {
              $project:{
                student_id:"$student_id",
                request_date:"$date",
                request_type:"$request_type",
                request_specific_data:"$request_specific_data",
                study_data:{"$last":"$study_data_list"},
              }
            }
          ],
          as: "TrDraftRequest_aggregate",
        },
      },
      {
        $unwind:{
          path: "$TrDraftRequest_aggregate"
        }
      },
      {
        $lookup:{
          from: "StudentDB",
          localField: "TrDraftRequest_aggregate.student_id",
          foreignField: "_id",
          as: "Student_aggregate",
        }
      },
      {
        $unwind:{
          path:"$Student_aggregate"
        }
      },
      {
        $lookup:{
          from: "User",
          localField: "Student_aggregate.user_id",
          foreignField: "_id",
          as: "StudentUser_aggregate",
        }
      },
      {
        $unwind:{
          path:"$StudentUser_aggregate"
        }
      },
      //get textbook info(if proper)
      {
        $lookup:{
          from: "TextBook",
          localField: "TrDraftRequest_aggregate.request_specific_data.textbookID",
          foreignField: "_id",
          as:"TextBook_aggregate",
        }
      },
      {
        $unwind:{
          path:"$TextBook_aggregate",
          preserveNullAndEmptyArrays:true,
        }
      },
      //get Assignment info(lecture name, lecturer, textbook, ... etc) of assignment(if proper)
      {
        $lookup:{
          from: "AssignmentOfStudent",
          localField: "TrDraftRequest_aggregate.request_specific_data.AOSID",
          foreignField: "_id",
          as:"AOS_aggregate",
        }
      },
      {
        $unwind:{
          path:"$AOS_aggregate",
          preserveNullAndEmptyArrays:true,
        }
      },
      {
        $lookup:{
          from: "Assignment",
          localField: "AOS_aggregate.assignmentID",
          foreignField: "_id",
          as:"Assignment_aggregate",
        }
      },
      {
        $unwind:{
          path:"$Assignment_aggregate",
          preserveNullAndEmptyArrays:true,
        }
      },
      {
        $lookup:{
          from: "TextBook",
          localField: "Assignment_aggregate.textbookID",
          foreignField: "_id",
          as:"Assignment_TextBook_aggregate",
        }
      },
      {
        $unwind:{
          path:"$Assignment_TextBook_aggregate",
          preserveNullAndEmptyArrays:true,
        }
      },
      {
        $lookup:{
          from: "Lecture",
          localField: "Assignment_aggregate.lectureID",
          foreignField: "_id",
          as:"Lecture_aggregate",
        }
      },
      {
        $unwind:{
          path:"$Lecture_aggregate",
          preserveNullAndEmptyArrays:true,
        }
      },
      //get progarm info(program leader username and nickname) (if proper)
      {
        $lookup:{
          from: "User",
          localField: "TrDraftRequest_aggregate.request_specific_data.program_by",
          foreignField: "username",
          as:"TDR_User_aggregate",
        }
      },
      {
        $unwind:{
          path:"$TDR_User_aggregate",
          preserveNullAndEmptyArrays:true,
        }
      },
      {
        $project: {
          _id:0,         
          tdrr_id:"$TDRR_aggregate._id",
          student_username:"$StudentUser_aggregate.username",
          student_nickname:"$StudentUser_aggregate.nickname",
          student_DB_name:"$Student_aggregate.이름",
          request_specific_data:"$TrDraftRequest_aggregate.request_specific_data",
          request_type: "$TrDraftRequest_aggregate.request_type",
          request_date: "$TrDraftRequest_aggregate.request_date",
          study_data:"$TrDraftRequest_aggregate.study_data",
          review_msg:"$TDRR_aggregate.review_msg",
          review_status:"$TDRR_aggregate.review_status",
          is_reviewed: {$ne:["$TDRR_aggregate.review_status",TRDraftRequestDataValidator.review_status_to_index["not_reviewed"]]},
          review_timestamp:"$TDRR_aggregate.modify_date",
          textbook_name:"$TextBook_aggregate.교재",
          textbook_subject:"$TextBook_aggregate.과목",
          lecture_name:"$Lecture_aggregate.lectureName",
          lecturer:"$Lecture_aggregate.manager", // this should be changed later
          AOSID:"$AOS_aggregate._id",
          assignment_page_range_array:"$Assignment_aggregate.pageRangeArray",
          assignment_description:'$Assignment_aggregate.description',
          assignment_textbook_name:'$Assignment_TextBook_aggregate.교재',
          program_leader_username:'$TDR_User_aggregate.username',
          program_leader_nickname:'$TDR_User_aggregate.nickname',
        },
      },
      {
        $facet:{
          metadata:[{$count:"total_items_num"}],
          data:[{$sort:{"is_reviewed":1,"study_data.timestamp":-1}},{$skip:alarm_items_per_page*(queryPage-1)},{$limit:alarm_items_per_page}]
        }
      }
    ]).toArray())[0];
    if(result_data.metadata.length===0) return; // no matching data
    const item_count=(result_data.metadata)[0].total_items_num;
    const total_page_num= Math.ceil(item_count/alarm_items_per_page);
    ret_val["ret"]["pagination"]["cur_page"]=queryPage;
    ret_val["ret"]["pagination"]["total_page_num"]=total_page_num;
    ret_val["ret"]["pagination"]["alarms_data"]=result_data.data;
    if(result_data.metadata.total_items_num>1 && result_data.data.length===0){
      ret_val["ret"]["pagination"]["pageInvalid"]=true;
    }
  }
  catch(error){
    console.log(`error: ${error}`);
    ret_val["success"]=false;
    ret_val["ret"]=`error while getting my alarms`;
  }
  finally{
    return res.json(ret_val);
  }
});

//save review result for student users' tr draft requests
app.post("/api/saveTRDraftRequestReview",loginCheck, permissionCheck(Role("manager")), async function (req, res) {
  const ret_val={"success":true, "ret":null, "reviewer_reassigned":false};
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
    const username=req.session.passport.user.username;
    const today_string=getCurrentKoreaDateYYYYMMDD();
    const current_date=getCurrentDate();
    ret_val.ret={
      "saved":false,
      "msg":"",
    };
    let {
      reviewStatus,
      reviewMsg,
      TDRRID,
    }= req.body;
    const TDRR_oid=new ObjectId(TDRRID);
    if(!TRDraftRequestDataValidator.checkReviewStatusValid(reviewStatus)) throw new Error(`invalid review status`);
    else if(!TRDraftRequestDataValidator.checkReviewMsgValid(reviewStatus,reviewMsg)) throw new Error(`invalid review msg`);
    
    //check review user is the designated user for the request
    const user_doc=await db.collection('User').findOne({username},{session});
    if(!user_doc) throw new Error(`internal server error: wrong session error`);
    const user_oid=user_doc._id;
    const TDRR_doc=(await db.collection('TRDraftRequestReview').aggregate([
        {
          $match:{
            _id:TDRR_oid
          }
        },
        {
          $lookup: {
            from: "TRDraftRequest",
            let: {
              tr_draft_request_id:"$tr_draft_request_id",
              study_data_review_id:"$study_data_review_id",
            },
            pipeline:[
              {
                $match:{
                  $expr:{
                    $and:[
                      {
                        $eq:[
                          "$_id",
                          "$$tr_draft_request_id"
                        ]
                      },
                      {
                        $eq:[
                          {
                            "$getField":{
                              "field": "review_id",
                              "input": {"$last":"$study_data_list"}
                            }
                          },
                          "$$study_data_review_id",
                        ]
                      }
                    ]
                  },
                }
              },
            ],
            as: "TRDraftRequest_aggregate",
          },
        },
        {
          $unwind:{
            path:"$TRDraftRequest_aggregate",
            preserveNullAndEmptyArrays:true,
          }
        }
      ],
      {session},
    ).toArray())[0];
    if(!TDRR_doc) throw new Error(`no such TR draft request review doc`);
    else if(!TDRR_doc.review_from.equals(user_oid)) throw new Error(`review from wrong reviewer`);
    else if(!TDRR_doc.TRDraftRequest_aggregate){
      ret_val.success=false;
      ret_val.ret="다른 리뷰어로 재지정된 요청입니다";
      ret_val.reviewer_reassigned=true;
      return;
    }
    const TRDraftRequest_oid=TDRR_doc.tr_draft_request_id;

    //check corresponding TRDraftRequest doc exists & if today TR finished(then,request review cannot be made anymore)
    //& also check TRDRaftRequest doc's "study_data_list"'s last element is related to my review doc(situation where a reviewer for the request is changed)
    const TRDraftRequest_doc=(await db.collection('TRDraftRequest').aggregate([
      {
        $match:{
          _id:TRDraftRequest_oid,
        }
      },
      {
        $lookup:{
          from: "StudentDB",
          localField: "student_id",
          foreignField: "_id",
          as:"StudentDB_aggregate",
        }
      },
      {
        $unwind:{
          path:"$StudentDB_aggregate",
        }
      },
      {
        $lookup: {
          from: "TR",
          let: {
            student_legacy_id:"$StudentDB_aggregate.ID",
            date:"$date"
          },
          pipeline:[
            {
              $match:{
                $expr:{
                  $and:[
                    {
                      $eq:[
                        "$날짜",
                        "$$date"
                      ]
                    },
                    {
                      $eq:[
                        "$ID",
                        "$$student_legacy_id"
                      ]
                    }
                  ]
                },
              }
            },
            {
              $limit:1
            },
            {
              $project:{
                작성매니저:1
              }
            }
          ],
          as: "TR_aggregate",
        },
      },
      {
        $unwind:{
          path: "$TR_aggregate",
          preserveNullAndEmptyArrays:true,
        }
      },
      {
        $project:{
          student_id:1,
          date:1,
          modify_date:1,
          create_date:1,
          request_type:1,
          request_status:1,
          request_specific_data:1,
          study_data: {"$last":"$study_data_list"},
          written_to_TR:1,
          TR_aggregate:1,
        }
      }
    ],{session}).toArray())[0];
    if(!TRDraftRequest_doc) throw new Error(`no such TR draft request: DB inconsistency`);
    else if(TRDraftRequest_doc.request_status !== TRDraftRequestDataValidator.request_status_to_index["review_needed"]) throw new Error(`request not in review needed state`);
    else if(!TRDraftRequest_doc.study_data) throw new Error(`TR draft doc has no study data`);

    //check if the related TR is finished
    if(checkTRFinished(TRDraftRequest_doc.TR_aggregate)){
      ret_val.ret.saved=false;
      ret_val.ret.msg="오늘자 귀가검사가 끝난 후 새로 요청을 보낼 수 없습니다";
      return;
    }

    const student_oid=TRDraftRequest_doc.student_id;
    const request_date=TRDraftRequest_doc.date;
    const request_type=TRDraftRequest_doc.request_type;
    const request_study_data=TRDraftRequest_doc.study_data;
    const request_specific_data=TRDraftRequest_doc.request_specific_data;

    //check corresponding student info & TR doc exist : this DB structure should be changed...
    const student_and_TR_doc=(await db.collection('StudentDB').aggregate([
      {
        $match: {
          _id:student_oid,
        }
      },
      {
        // $lookup: {
        //   from: "TR",
        //   localField: "ID",
        //   foreignField: "ID",
        //   as: "TR_aggregate",
        // },
        $lookup: {
          from: "TR",
          let: {
            student_legacy_id:"$ID",
          },
          pipeline:[
            {
              $match:{
                $expr:{
                  $and:[
                    {
                      $eq:[
                        "$날짜",
                        today_string,
                      ]
                    },
                    {
                      $eq:[
                        "$ID",
                        "$$student_legacy_id"
                      ]
                    }
                  ]
                },
              }
            },
            {
              $limit:1
            },
            {
              $project:{
                날짜:1
              }
            }
          ],
          as: "TR_aggregate",
        },
      },
      {
        $unwind:{
          path: "$TR_aggregate"
        }
      },
    ],{session}).toArray())[0];
    if(!student_and_TR_doc){
      ret_val.ret.saved=false;
      ret_val.ret.msg="요청을 검토하기 전에 해당 날짜의 학생 TR을 만들어주세요";
      return;
    }
    const student_name=student_and_TR_doc.이름;
    
    //update TDRR doc
    const TDRR_doc_update_settings=TRDraftRequestDataValidator.getTDRROnUpdateSettings(reviewStatus,reviewMsg,current_date);
    await db.collection('TRDraftRequestReview').updateOne(
      {_id:TDRR_oid},
      {
        $set:TDRR_doc_update_settings
      },
      {session}
    );

    //update TRDraftRequest doc and corresponding data w.r.t. TR draft request review status
    const TR_draft_doc_update_settings=TRDraftRequestDataValidator.getTRDraftOnReviewUpdateSettings(reviewStatus,current_date);
    await db.collection('TRDraftRequest').updateOne(
      {_id:TRDraftRequest_oid},
      {
        $set:TR_draft_doc_update_settings,
      },
      {session}
    );
    if(reviewStatus===TRDraftRequestDataValidator.review_status_to_index["accepted"]){
      const finished_state=request_study_data.finished_state;
      const excuse=request_study_data.excuse;
      const time_amount=request_study_data.time_amount;
      let AOS_doc=null;
      //update aos finished status if request type is AssignmentStudyData(type 1)
      if(request_type===TRDraftRequestDataValidator.request_type_name_to_index["AssignmentStudyData"])  {
        const AOSID=TRDraftRequest_doc.request_specific_data.AOSID;
        AOS_doc=(await db.collection('AssignmentOfStudent').aggregate([
          {
            $match:{
              _id:AOSID,
            }
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
            $unwind:{
              path: "$Assignment_aggregate"
            }
          },
          {
            $project:{
              textbookID: "$Assignment_aggregate.textbookID",
              deleted: {$ifNull: ["$Assignment_aggregate.hiddenOnLecturePage",false]}
            }
          }
        ],{session}).toArray())[0];
        if(!AOS_doc) throw new Error(`there is no assignment related to `)
        else if(AOS_doc.deleted) {
          ret_val.ret.msg="삭제된 과제에 대한 요청입니다";
          throw new Error(`request on deleted assignment`);
        }
        await db.collection('AssignmentOfStudent').updateOne(
          {_id:AOSID},
          {
            $set:{
              finished:finished_state,
              finished_date:finished_state?today_string:"",
            }
          },
          {session}
        );
      }

      //update daily goal check log if request type is AssignmentStudyData(type 1) or LectureAndTextbookStudyData(type 2)
      // if(TRDraftRequestDataValidator.checkRequestTypeNeedDGCLUpdate(request_type,request_specific_data)){
      //   const AOSID= TRDraftRequest_doc.request_type===TRDraftRequestDataValidator.request_type_name_to_index["AssignmentStudyData"]?TRDraftRequest_doc.request_specific_data.AOSID:"";
      //   const textbookID= TRDraftRequest_doc.request_type===TRDraftRequestDataValidator.request_type_name_to_index["LectureAndTextbookStudyData"]?TRDraftRequest_doc.request_specific_data.textbookID:"";
      //   const AOSTextbookID= TRDraftRequest_doc.request_type===TRDraftRequestDataValidator.request_type_name_to_index["AssignmentStudyData"] && AOS_doc.textbookID?AOS_doc.textbookID:"";
      //   const DGCL_insert_settings=TRDraftRequestDataValidator.getDGCLOnInsertSettings(today_string,student_oid,student_name,AOSID,textbookID,AOSTextbookID);
      //   const DGCL_update_push_settings=TRDraftRequestDataValidator.getDGCLOnUpdatePushSettings(finished_state,excuse);
      //   await db.collection('DailyGoalCheckLog').updateOne(
      //     {
      //       studentID:student_oid,
      //       date:today_string,
      //       AOSID:AOSID,
      //       textbookID:textbookID,
      //       AOSTextbookID:AOSTextbookID,
      //     },
      //     {
      //       $setOnInsert:DGCL_insert_settings,
      //       $push:DGCL_update_push_settings,
      //     },
      //     {upsert:true,session}
      //   );
      // }
      
      //daily goal check logs are should be upserted when the approved draft request are written to tr documents
    }
    
    ret_val.ret.saved=true;
    await session.commitTransaction();
  }
  catch(error){
    console.log(`error: ${error}`);
    await session.abortTransaction();
  }
  finally{
    await session.endSession();
    return res.json(ret_val);
  }
});

//get student request data approved but not written to TR document
app.post("/api/getNotWrittenTRDraftRequests", loginCheck, permissionCheck(Role("manager"),Role("admin")),async function (req, res) {
  const ret_val={"success":true, "ret":null};
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
    let {
      studentLegacyID,
      date
    }= req.body;
    const username=req.session.passport.user.username;

    const student_doc=await db.collection('StudentDB').findOne({ID:studentLegacyID},{session});
    if(!student_doc) throw new Error(`no such student`);
    const student_oid=student_doc._id;

    const not_written_requests=(await db.collection('TRDraftRequest').aggregate(
      [
        {
          $match:{
            date,
            student_id:student_oid,
            // "$or":[
            //   {"request_status":TRDraftRequestDataValidator.request_status_to_index["review_needed"]},
            //   {"request_status":TRDraftRequestDataValidator.request_status_to_index["confirmed"]}
            // ],
            request_status:TRDraftRequestDataValidator.request_status_to_index["confirmed"],
            written_to_TR:TRDraftRequestDataValidator.written_to_TR_status_to_index["not_written"],
          }
        },
        {
          $lookup: {
            from: "TRDraftRequestReview",
            let: {
              review_id: {
                "$getField":{
                  "field": "review_id",
                  "input": {"$last":"$study_data_list"}
                }
              },
              tr_draft_request_id:"$_id",
            },
            pipeline:[
              {
                $match:{
                  $expr:{
                    $and:[
                      {
                        $eq:[
                          "$tr_draft_request_id",
                          "$$tr_draft_request_id"
                        ]
                      },
                      {
                        $eq:[
                          "$study_data_review_id",
                          "$$review_id"
                        ]
                      }
                    ]
                  },
                }
              },
              {
                $limit:1
              },
              {
                $lookup: {
                  from: "User",
                  localField: "review_from",
                  foreignField: "_id",
                  as: "User_aggregate",
                },
              },
              {
                $unwind:{
                  path: "$User_aggregate"
                }
              },
              {
                $project:{
                  username:"$User_aggregate.username",
                  nickname:"$User_aggregate.nickname",
                }
              }
            ],
            as: "Reviewer_aggregate",
          },
        },
        {
          $unwind:{
            path:"$Reviewer_aggregate",
          }
        },
        {
          $project:{
            _id:1,
            date:1,
            request_specific_data:1,
            request_type:1,
            student_id:1,
            deleted:1,
            modify_date:1,
            request_status:1,
            study_data: {"$last":"$study_data_list"},
            written_to_TR:1,
            reviewer_username:"$Reviewer_aggregate.username",
            reviewer_nickname:"$Reviewer_aggregate.nickname",
          }
        }
      ]
      ,{session}
    ).toArray());
    ret_val.ret=not_written_requests;
  }
  catch(error){
    console.log(`error : ${error}`);
    ret_val["success"]=false;
    ret_val["ret"]=`error while getting my alarms`;
  }
  finally{
    await session.endSession();
    return res.json(ret_val);
  }
});

//student user this week study board link
app.get("/api/getStudentThisWeekStudyBoardLink",loginCheck, permissionCheck(Role("student")), async function (req, res) {
  const ret_val={"success":true, "ret":null};
  try{
    const group_doc= (await db.collection("User").aggregate(
      [
        {
          $match: {
            username:req.session.passport.user.username,
          }
        },
        {
          $lookup: {
            from: "GroupOfUser",
            localField: "_id",
            foreignField: "user_id",
            as: "GOU_aggregate",
          },
        },
        { 
          $unwind: {
            path:"$GOU_aggregate",
          }
        },
        {
          $lookup: {
            from: "Group",
            localField: "GOU_aggregate.group_id",
            foreignField: "_id",
            as: "Group_aggregate",
          },
        },
        { 
          $unwind: {
            path:"$Group_aggregate",
          }
        },
        {
          $project: {
            _id:0,
            link:"$Group_aggregate.student_this_week_study_board_link",
          },
        },
      ]).toArray())[0];
    if(!group_doc) throw new Error(`invalid request`);
    ret_val["ret"]=group_doc.link;
  }
  catch(error){
    ret_val["success"]=false;
    ret_val["ret"]=`error while getting my this week goal board link`;
  }
  finally{
    return res.json(ret_val);
  }
});

//student user life cycle and study time goals
app.get("/api/getMyLifeCycleAndStudyTimeGoals", loginCheck, permissionCheck(Role("student")), async function (req, res) {
  const ret_val={"success":true, "ret":null};
  try{
    const student_doc= await db.collection("User").aggregate(
      [
        {
          $match: {
            username:req.session.passport.user.username,
          }
        },
        {
          $lookup: {
            from: "StudentDB",
            localField: "_id",
            foreignField: "user_id",
            as: "StudentDB_aggregate",
          },
        },
        { 
          $unwind: {
            path:"$StudentDB_aggregate",
          }
        },
        {
          $project: {
            _id:0,
            lifeCycleAndStudyGoals: "$StudentDB_aggregate.생활학습목표",
          },
        },
      ]).toArray();
    if(student_doc.length!==1) throw new Error(`invalid query`);
    ret_val["ret"]=student_doc[0].lifeCycleAndStudyGoals;
  }
  catch(error){
    ret_val["success"]=false;
    ret_val["ret"]=`error while getting my current studying books`;
  }
  finally{
    return res.json(ret_val);
  }
});

//student user info data: current studying books
app.get("/api/getMyCurrentStudyingBooks", loginCheck, permissionCheck(Role("student")), async function (req, res) {
  const ret_val={"success":true, "ret":null};
  try{
    const student_doc= await db.collection("User").aggregate(
      [
        {
          $match: {
            username:req.session.passport.user.username,
          }
        },
        {
          $lookup: {
            from: "StudentDB",
            localField: "_id",
            foreignField: "user_id",
            as: "StudentDB_aggregate",
          },
        },
        { 
          $unwind: {
            path:"$StudentDB_aggregate",
          }
        },
        {
          $project: {
            _id:0,
            currentStudyingBooks: "$StudentDB_aggregate.진행중교재",
          },
        },
      ]).toArray();
    if(student_doc.length!==1) throw new Error(`invalid query`);
    ret_val["ret"]=student_doc[0].currentStudyingBooks;
  }
  catch(error){
    ret_val["success"]=false;
    ret_val["ret"]=`error while getting my current studying books`;
  }
  finally{
    return res.json(ret_val);
  }
});

function getThisSundayDateStringYYYYMMDD(){
  if(moment().day()===0) return moment().format('YYYY-MM-DD');
  else return moment().day(7).format('YYYY-MM-DD');
}

//student this week study goals
app.get("/api/getThisWeekStudyGoals", loginCheck, permissionCheck(Role("student")), async function (req, res) {
  const ret_val={"success":true, "ret":null};
  try{
    const this_sunday_string=getThisSundayDateStringYYYYMMDD();
    // const this_sunday_string='2023-02-19';
    const this_week_goals= await db.collection("User").aggregate(
      [
        {
          $match: {
            username:req.session.passport.user.username,
          }
        },
        {
          $lookup: {
            from: "StudentDB",
            localField: "_id",
            foreignField: "user_id",
            as: "StudentDB_aggregate",
          },
        },
        { 
          $unwind: {
            path:"$StudentDB_aggregate",
          }
        },
        {
          $lookup: {
            from: "WeeklyStudyfeedback",
            localField: "StudentDB_aggregate.ID",
            foreignField: "학생ID",
            as: "WSF_aggregate",
          },
        },
        { 
          $unwind: {
            path:"$WSF_aggregate",
          }
        },
        {
          $match: {
            "WSF_aggregate.피드백일": this_sunday_string,
          }
        },
        {
          $project: {
            sundayDateString:"$WSF_aggregate.피드백일",
            thisweekGoal:"$WSF_aggregate.thisweekGoal",
          },
        },
      ]).toArray();
    if(this_week_goals.length!==1) ret_val["ret"]=[];
    else ret_val["ret"]=this_week_goals[0];
  }
  catch(error){
    console.log(`error: ${error}`);
    ret_val["success"]=false;
    ret_val["ret"]=`error while getting my this week study goals`;
  }
  finally{
    return res.json(ret_val);
  }
});

//student today assignments
app.get("/api/getMyCurrentAssignments", loginCheck, permissionCheck(Role("student")), async function (req, res) {
  const ret_val={"success":true, "ret":null};
  try{
    const today_string=getCurrentKoreaDateYYYYMMDD();
    // const today_string="2023-04-11"; // for testing
    const current_assignments= await db.collection("User").aggregate(
      [
        {
          $match: {
            username:req.session.passport.user.username,
          }
        },
        {
          $lookup: {
            from: "StudentDB",
            localField: "_id",
            foreignField: "user_id",
            as: "StudentDB_aggregate",
          },
        },
        { 
          $unwind: {
            path:"$StudentDB_aggregate",
          }
        },
        {
          $lookup: {
            from: "AssignmentOfStudent",
            localField: "StudentDB_aggregate._id",
            foreignField: "studentID",
            as: "AOS_aggregate",
          },
        },
        { 
          $unwind: {
            path:"$AOS_aggregate",
          }
        },
        {
          $lookup: {
            from: "Assignment",
            localField: "AOS_aggregate.assignmentID",
            foreignField: "_id",
            as: "Assignment_aggregate",
          },
        },
        { 
          $unwind: {
            path:"$Assignment_aggregate",
          }
        },
        {
          $match: {
            "Assignment_aggregate.duedate":today_string,
            "$or":[{"Assignment_aggregate.hiddenOnLecturePage":{"$exists":false}},{"Assignment_aggregate.hiddenOnLecturePage":false}]
          }
        },
        {
          $lookup: {
            from: "Lecture",
            localField: "Assignment_aggregate.lectureID",
            foreignField: "_id",
            as: "Lecture_aggregate",
          },
        },
        { 
          $unwind: {
            path:"$Lecture_aggregate",
          }
        },
        {
          $lookup: {
            from: "TextBook",
            localField: "Assignment_aggregate.textbookID",
            foreignField: "_id",
            as: "TextBook_aggregate",
          },
        },
        { 
          $unwind: {
            path:"$TextBook_aggregate",
            preserveNullAndEmptyArrays:true,
          }
        },
        {
          $project: {
            _id:0,
            AOSID:"$AOS_aggregate._id",
            assignmnetID: "$Assignment_aggregate._id",
            lectureSubject: "$Lecture_aggregate.subject",
            manager: "$Lecture_aggregate.manager",
            lectureName: "$Lecture_aggregate.lectureName",
            textbookName: "$TextBook_aggregate.교재",
            pageRangeArray: "$Assignment_aggregate.pageRangeArray",
            description: "$Assignment_aggregate.description"
          },
        },
      ]).toArray();
    ret_val["ret"]=current_assignments;
  }
  catch(error){
    ret_val["success"]=false;
    ret_val["ret"]=`error while getting my current assignments`;
  }
  finally{
    return res.json(ret_val);
  }
});

function checkTRFinished(TRDoc){
  if(!TRDoc) return false;
  return !!TRDoc.매니저피드백;
}

async function checkTRFinishedByStudentUsername(studentUsername,date_string,aggregateOption={}){
  const TR_doc_list=(await db.collection('User').aggregate([
    {
      $match:{
        "deleted":false,
        "approved":true,
        username:studentUsername,
      }
    },
    {
      $lookup: {
        from: "StudentDB",
        localField: "_id",
        foreignField: "user_id",
        as: "StudentDB_aggregate",
      },
    },
    {
      $unwind:{
        path: "$StudentDB_aggregate"
      }
    },
    {
      $lookup: {
        from: "TR",
        let: {
          student_legacy_id:"$StudentDB_aggregate.ID",
        },
        pipeline:[
          {
            $match:{
              $expr:{
                $and:[
                  {
                    $eq:[
                      "$날짜",
                      date_string,
                    ]
                  },
                  {
                    $eq:[
                      "$ID",
                      "$$student_legacy_id"
                    ]
                  }
                ]
              },
            }
          },
          {
            $limit:1
          },
          {
            $project:{
              작성매니저:1
            }
          }
        ],
        as: "TR_aggregate",
      },
    },
    {
      $unwind:{
        path: "$TR_aggregate"
      }
    },
  ],aggregateOption).toArray()).map((element)=>element.TR_aggregate);
  return checkTRFinished(TR_doc_list[0]);
}

async function getTRDraftRequestAndReviewer(matchFilter,aggregateOption){
  return (await db.collection('TRDraftRequest').aggregate([
    {
      $match:matchFilter,
    },
    {
      $lookup:{
        from: "TRDraftRequestReview",
        let: {
          review_id: {
            "$getField":{
              "field": "review_id",
              "input": {"$last":"$study_data_list"}
            }
          },
          tr_draft_request_id:"$_id",
        },
        pipeline:[
          {
            $match:{
              $expr:{
                $and:[
                  {
                    $eq:[
                      "$tr_draft_request_id",
                      "$$tr_draft_request_id"
                    ]
                  },
                  {
                    $eq:[
                      "$study_data_review_id",
                      "$$review_id"
                    ]
                  }
                ]
              },
            }
          },
          {
            $limit:1
          },
          {
            $lookup: {
              from: "User",
              localField: "review_from",
              foreignField: "_id",
              as: "User_aggregate",
            },
          },
          {
            $unwind:{
              path: "$User_aggregate"
            }
          },
          {
            $project:{
              review_status:"$review_status",
              review_msg:{$ifNull: ["$review_msg",""]},
              reviewer_user_id:"$User_aggregate._id",
              username:"$User_aggregate.username",
              nickname:"$User_aggregate.nickname",
            }
          }
        ],
        as: "Review_aggregate",
      }
    },
    {
      $unwind:{
        path:"$Review_aggregate",
      }
    },
    {
      $project:{
        study_data:{"$last":"$study_data_list"},
        Review_aggregate:"$Review_aggregate",
      }
    }
  ],aggregateOption).toArray())[0];
}

app.get("/api/checkMyTodayTRFinished",loginCheck, permissionCheck(Role("student")), async function (req, res) {
  const ret_val={"success":true, "ret":null};
  try{
    const username=req.session.passport.user.username;
    const today_string=getCurrentKoreaDateYYYYMMDD();
    ret_val.ret=await checkTRFinishedByStudentUsername(username,today_string);
  }
  catch(error){
    console.log(`error: ${error}`);
    ret_val["success"]=false;
    ret_val["ret"]=`error while checking today's TR finished state`;
  }
  finally{
    return res.json(ret_val);
  }
});

//save student request data
app.post("/api/saveLifeDataRequest",loginCheck, permissionCheck(Role("student")), async function (req, res) {
  const ret_val={"success":true, "ret":null};
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
    const username=req.session.passport.user.username;
    const student_id=req.session.passport.user.student_id;
    const today_string=getCurrentKoreaDateYYYYMMDD();
    const current_date=getCurrentDate();
    let {
      bodyCondition,
      sentimentCondition,
      goToBedTime,
      wakeUpTime,
      comeToCenterTime,
      reviewedBy,
      reviewerReassigned,
    }= req.body;
    reviewerReassigned=!!reviewerReassigned;
    if(!TRDraftRequestDataValidator.checkLifeDataValid(bodyCondition,sentimentCondition,goToBedTime,wakeUpTime,comeToCenterTime)) throw new Error(`invalid life data`);
    else if(!TRDraftRequestDataValidator.checkReviewerUsernameArrayValid(reviewedBy)) throw new Error(`invalid reviewer array:0`);

    //check if todays' TR alreay finished
    if((await checkTRFinishedByStudentUsername(username,today_string,{session}))){
      ret_val.success=false;
      ret_val.ret="오늘자 귀가검사가 끝난 후 새로 요청을 보낼 수 없습니다";
      return;
    }

    //check if reviewers in reviewer array exist
    const reviewer_array_len=reviewedBy.length;
    const reviewer_user_array=await getManagerUserListInSameGroupByMyUsername(username,true,reviewedBy,{session});
    if(reviewer_user_array.length !== reviewer_array_len) throw new Error(`invalid reviewer array:1`);

    //if given request is for reassigning a reviewer
    if(reviewerReassigned){
      const prev_life_doc= await getTRDraftRequestAndReviewer({
        date:today_string,
        student_id,
        request_type:TRDraftRequestDataValidator.request_type_name_to_index["lifeData"]
      },{session});
      if(!prev_life_doc) throw new Error(`no such prev request or review`); //reviewer reassigned before request made
      const review_status=prev_life_doc.Review_aggregate.review_status;
      const reviewer_user_id=prev_life_doc.Review_aggregate.reviewer_user_id;
      const reviewer_reassign_validity=TRDraftRequestDataValidator.checkTRDraftRequestReviwerReassignValid(review_status,reviewer_user_id,reviewer_user_array);
      if(!reviewer_reassign_validity.valid){
        ret_val.success=false;
        ret_val.ret=reviewer_reassign_validity.error_msg;
        ret_val.page_reload=reviewer_reassign_validity.page_reload;
        return;
      }

      //here goes the reassignment of request reviewer
      const life_doc_id=prev_life_doc._id;
      const prev_study_data_element=prev_life_doc.study_data;
      const prev_excuse=prev_study_data_element.excuse;
      const prev_time_amount=prev_study_data_element.time_amount;
      const prev_finished_state=prev_study_data_element.finished_state;
      const study_data_review_id=new ObjectId();
      const study_data_element=TRDraftRequestDataValidator.getStudyDataElement(prev_excuse,prev_time_amount,prev_finished_state,study_data_review_id,current_date);
      await db.collection("TRDraftRequest").updateOne(
        {
          _id:life_doc_id,
        },
        {
          $push:{"study_data_list":study_data_element},
        },
        {session}
      );

      //insert review template documents to TrDraftRequestReview collection
      const review_document_list=TRDraftRequestDataValidator.getNewRequestReviewListByUserDocumentList(life_doc_id,study_data_review_id,reviewer_user_array,current_date);
      await db.collection("TRDraftRequestReview").insertMany(review_document_list,{session});

      await session.commitTransaction();
      return; //!!this is necessary indeed!!
    }

    //check if this request has been received before
    const prev_life_doc=await db.collection("TRDraftRequest").findOne(
      {
        date:today_string,
        student_id,
        request_type:TRDraftRequestDataValidator.request_type_name_to_index["lifeData"]
      },
      {session}
    );
    let newlySaved=false;
    if(prev_life_doc && !TRDraftRequestDataValidator.checkRequestDataUpdatable(prev_life_doc.request_status))
      throw new Error(`life data request in inupdatable status`);
    else newlySaved=!prev_life_doc;

    //update request info & status
    // let request_doc={};
    // if(newlySaved){
    //   request_doc=TRDraftRequestDataValidator.getNewLifeDataRequestDocument(student_id,today_string);
    // }
    // request_doc.request_specific_data["신체컨디션"]=bodyCondition;
    // request_doc.request_specific_data["정서컨디션"]=sentimentCondition;
    // request_doc.request_specific_data["실제취침"]=goToBedTime;
    // request_doc.request_specific_data["실제기상"]=wakeUpTime;

    // request_doc["request_status"]=TRDraftRequestDataValidator.request_status_to_index["review_needed"]; // request status update to "review_needed": cannot be updated until a review written
    // request_doc["request_specific_data.신체컨디션"]=bodyCondition;
    // request_doc["request_specific_data.정서컨디션"]=sentimentCondition;
    // request_doc["request_specific_data.실제취침"]=goToBedTime;
    // request_doc["request_specific_data.실제기상"]=wakeUpTime;
    // request_doc["modify_date"]=current_date;

    const life_doc_id=newlySaved?new ObjectId():prev_life_doc._id;
    const life_doc_insert_settings=TRDraftRequestDataValidator.getLifeDataRequestOnInsertSettings(student_id,today_string);
    const life_doc_update_settings=TRDraftRequestDataValidator.getLifeDataRequestOnUpdateSettings(
      TRDraftRequestDataValidator.request_status_to_index["review_needed"],
      bodyCondition,
      sentimentCondition,
      goToBedTime,
      wakeUpTime,
      comeToCenterTime,
      current_date,
      newlySaved?life_doc_id:null
    );
    
    // if(newlySaved) request_doc["_id"]=life_doc_id;
    // const study_data_element={...TRDraftRequestDataValidator.request_study_data_template};
    // study_data_element["timestamp"]=current_date;
    const study_data_review_id= new ObjectId();
    // study_data_element["review_id"]=study_data_review_id;
    const study_data_element=TRDraftRequestDataValidator.getStudyDataElement(null,null,true,study_data_review_id,current_date);
    await db.collection("TRDraftRequest").updateOne(
      {
        date:today_string,
        student_id,
        request_type:TRDraftRequestDataValidator.request_type_name_to_index["lifeData"],
      },
      {
        $setOnInsert:life_doc_insert_settings,
        $set:life_doc_update_settings,
        $push:{
          "study_data_list":study_data_element,
        },
      },
      {"upsert":true,session}
    );

    //insert review template documents to TrDraftRequestReview collection
    const review_document_list=TRDraftRequestDataValidator.getNewRequestReviewListByUserDocumentList(life_doc_id,study_data_review_id,reviewer_user_array,current_date);
    await db.collection("TRDraftRequestReview").insertMany(review_document_list,{session});

    await session.commitTransaction();
  }
  catch(error){
    console.log(`life data save error: ${error}`);
    await session.abortTransaction();
    ret_val["success"]=false;
    ret_val["ret"]=`네트워크 오류로 저장에 실패했습니다:0`;
  }
  finally{
    await session.endSession();
    return res.json(ret_val);
  }
});

//save student request data
app.post("/api/saveAssignmentStudyDataRequest",loginCheck, permissionCheck(Role("student")), async function (req, res) {
  const ret_val={"success":true, "ret":null};
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
    const username=req.session.passport.user.username;
    const student_id=req.session.passport.user.student_id;
    const today_string=getCurrentKoreaDateYYYYMMDD();
    const current_date=getCurrentDate();
    let {
      excuse,
      timeAmount,
      AOSID,
      finishedState,
      reviewedBy,
      reviewerReassigned,
    }= req.body;
    finishedState=!!finishedState;
    reviewerReassigned=!!reviewerReassigned;
    if(finishedState===true) excuse="";
    const AOS_objectid=new ObjectId(AOSID);
    if(!TRDraftRequestDataValidator.checkExcuseValueValid(excuse,finishedState) || !TRDraftRequestDataValidator.checkTimeStringValid(timeAmount)) throw new Error(`invalid assignment study data`);
    else if(!TRDraftRequestDataValidator.checkReviewerUsernameArrayValid(reviewedBy)) throw new Error(`invalid reviewer array:0`);
    
    //check if todays' TR already finished
    if((await checkTRFinishedByStudentUsername(username,today_string,{session}))){
      ret_val.success=false;
      ret_val.ret="오늘자 귀가검사가 끝난 후 새로 요청을 보낼 수 없습니다";
      return;
    }

    //check if reviewers in reviewer array exist
    const reviewer_array_len=reviewedBy.length;
    const reviewer_user_array=await getManagerUserListInSameGroupByMyUsername(username,true,reviewedBy,{session});
    if(reviewer_user_array.length !== reviewer_array_len) throw new Error(`invalid reviewer array:1`);

    //if given request is for reassigning a reviewer
    if(reviewerReassigned){
      const prev_assignment_study_doc= await getTRDraftRequestAndReviewer({
        date:today_string,
        student_id,
        request_type:TRDraftRequestDataValidator.request_type_name_to_index["AssignmentStudyData"],
        "request_specific_data.AOSID":AOS_objectid
      },{session});
      if(!prev_assignment_study_doc) throw new Error(`no such prev request or review`); //reviewer reassigned before request made
      const review_status=prev_assignment_study_doc.Review_aggregate.review_status;
      const reviewer_user_id=prev_assignment_study_doc.Review_aggregate.reviewer_user_id;
      const reviewer_reassign_validity=TRDraftRequestDataValidator.checkTRDraftRequestReviwerReassignValid(review_status,reviewer_user_id,reviewer_user_array);
      if(!reviewer_reassign_validity.valid){
        ret_val.success=false;
        ret_val.ret=reviewer_reassign_validity.error_msg;
        ret_val.page_reload=reviewer_reassign_validity.page_reload;
        return;
      }

      //here goes the reassignment of request reviewer
      const assignment_study_doc_id=prev_assignment_study_doc._id;
      const prev_study_data_element=prev_assignment_study_doc.study_data;
      const prev_excuse=prev_study_data_element.excuse;
      const prev_time_amount=prev_study_data_element.time_amount;
      const prev_finished_state=prev_study_data_element.finished_state;
      const study_data_review_id=new ObjectId();
      const study_data_element=TRDraftRequestDataValidator.getStudyDataElement(prev_excuse,prev_time_amount,prev_finished_state,study_data_review_id,current_date);
      await db.collection("TRDraftRequest").updateOne(
        {
          _id:assignment_study_doc_id,
        },
        {
          $push:{"study_data_list":study_data_element},
        },
        {session}
      );

      //insert review template documents to TrDraftRequestReview collection
      const review_document_list=TRDraftRequestDataValidator.getNewRequestReviewListByUserDocumentList(assignment_study_doc_id,study_data_review_id,reviewer_user_array,current_date);
      await db.collection("TRDraftRequestReview").insertMany(review_document_list,{session});

      await session.commitTransaction();
      return; //!!this is necessary indeed!!
    }

    //check if AOS document exists
    const AOS_doc= await db.collection("AssignmentOfStudent").findOne({_id:AOS_objectid},{session});
    if(!AOS_doc) throw new Error(`no such AOS doc`);
    
    //check if this request has been received before
    const prev_assignment_study_doc=await db.collection("TRDraftRequest").findOne(
      {
        date:today_string,
        student_id,
        request_type:TRDraftRequestDataValidator.request_type_name_to_index["AssignmentStudyData"],
        "request_specific_data.AOSID":AOS_objectid
      },
      {session}
    );
    let newlySaved=false;
    if(prev_assignment_study_doc && !TRDraftRequestDataValidator.checkRequestDataUpdatable(prev_assignment_study_doc.request_status))
      throw new Error(`assignment study data request in inupdatable status`);
    else newlySaved=!prev_assignment_study_doc;

    //update request info & status
    // let request_doc={};
    // if(newlySaved){
    //   request_doc=TRDraftRequestDataValidator.getNewAssignmentStudyDataRequestDocument(student_id,today_string,AOS_objectid);
    // }
    // request_doc["request_status"]=TRDraftRequestDataValidator.request_status_to_index["review_needed"]; // request status update to "review_needed": cannot be updated until a review written

    const assignment_study_doc_id=newlySaved?new ObjectId():prev_assignment_study_doc._id;
    const assignment_study_doc_insert_settings= TRDraftRequestDataValidator.getAssignmentStudyDataRequestOnInsertSettings(student_id,today_string,AOS_objectid);
    const assignment_study_doc_update_settings= TRDraftRequestDataValidator.getAssignmentStudyDataRequestOnUpdateSettings(
      TRDraftRequestDataValidator.request_status_to_index["review_needed"],
      current_date,
      newlySaved?assignment_study_doc_id:null
    );

    // if(newlySaved) request_doc["_id"]=assignment_study_doc_id;
    // request_doc["modify_date"]=current_date;
    // const study_data_element={...TRDraftRequestDataValidator.request_study_data_template};
    // study_data_element["excuse"]=excuse;
    // study_data_element["time_amount"]=timeAmount;
    // study_data_element["timestamp"]=current_date;
    // study_data_element["finished_state"]=finishedState;

    const study_data_review_id= new ObjectId();
    // study_data_element["review_id"]=study_data_review_id;

    const study_data_element=TRDraftRequestDataValidator.getStudyDataElement(excuse,timeAmount,finishedState,study_data_review_id,current_date);
    
    await db.collection("TRDraftRequest").updateOne(
      {
        date:today_string,
        student_id,
        request_type:TRDraftRequestDataValidator.request_type_name_to_index["AssignmentStudyData"],
        "request_specific_data.AOSID":AOS_objectid
      },
      {
        $setOnInsert:assignment_study_doc_insert_settings,
        $set:assignment_study_doc_update_settings,
        $push:{
          "study_data_list":study_data_element,
        },
      },
      {"upsert":true,session}
    );

    //insert review template documents to TrDraftRequestReview collection
    const review_document_list=TRDraftRequestDataValidator.getNewRequestReviewListByUserDocumentList(assignment_study_doc_id,study_data_review_id,reviewer_user_array,current_date);
    await db.collection("TRDraftRequestReview").insertMany(review_document_list,{session});

    await session.commitTransaction();
  }
  catch(error){
    console.log(`error: ${error}`);
    await session.abortTransaction();
    ret_val["success"]=false;
    ret_val["ret"]=`error while saving assignment study data`;
  }
  finally{
    await session.endSession();
    return res.json(ret_val);
  }
});

//set textbook study element as deleted on tr draft page
app.post("/api/setLATStudyElementDeletedOnTrDraft",loginCheck, permissionCheck(Role("student")), async function (req, res) {
  const ret_val={"success":true, "ret":null};
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
    const student_id=req.session.passport.user.student_id;
    const today_string=getCurrentKoreaDateYYYYMMDD();
    const current_date=getCurrentDate();
    let {textbookID,elementID,duplicatable,requestNew}= req.body;
    duplicatable=!!duplicatable;
    requestNew=!!requestNew;

    let textbookID_oid=null;
    let elementID_oid=null;
    if(duplicatable) { //duplicatable element can be deleted for real
      elementID_oid=new ObjectId(elementID);
      // await db.collection("TRDraftRequest").deleteOne({
      //   date:today_string,
      //   student_id:student_id,
      //   request_type:TRDraftRequestDataValidator.request_type_name_to_index["LectureAndTextbookStudyData"],
      //   "request_specific_data.elementID":elementID_oid,
      // });
      // return;
    }
    else {
      textbookID_oid=new ObjectId(textbookID);
      //check if Textbook document exists
      const textbook_doc= await db.collection("TextBook").findOne({_id:textbookID_oid},{session});
      if(!textbook_doc) throw new Error(`no such textbook doc`);
    }

    // const prev_LAT_study_data=await db.collection("TRDraftRequest")
    //   .find({
    //     date:today_string,
    //     student_id:student_id,
    //     request_type:TRDraftRequestDataValidator.request_type_name_to_index["LectureAndTextbookStudyData"],
    //     "request_specific_data.textbookID":textbookID_oid,
    //     "request_specific_data.elementID":elementID_oid,
    //   }).toArray();
    const prev_LAT_study_doc=await db.collection("TRDraftRequest").findOne(
      {
        date:today_string,
        student_id:student_id,
        request_type:TRDraftRequestDataValidator.request_type_name_to_index["LectureAndTextbookStudyData"],
        "request_specific_data.textbookID":textbookID_oid,
        "request_specific_data.elementID":elementID_oid,
      },
      {session}
    );
    // if(prev_LAT_study_data.length===0) newlySaved=true;
    // if(prev_LAT_study_data.length>1) throw new Error(`same LAT study data request count exceeds 1`);
    // else if(prev_LAT_study_data.length==1 && !TRDraftRequestDataValidator.checkRequestDataUpdatable(prev_LAT_study_data[0].request_status))
    //   throw new Error(`assignment study data request in inupdatable status`);
    if(prev_LAT_study_doc){
      if(requestNew) return; //accept deletion of client side new element with duplicated objectid on database
      else if(!TRDraftRequestDataValidator.checkRequestDataUpdatable(prev_LAT_study_doc.request_status))
        throw new Error(`LAT study data request in inupdatable status`);
    }
    else{
      const this_type_doc_count=await db.collection("TRDraftRequest").countDocuments(
        {
        date:today_string,
        student_id:student_id,
        request_type:TRDraftRequestDataValidator.request_type_name_to_index["LectureAndTextbookStudyData"],
        },
        {session}
      );
      const this_type_active_doc_count= await db.collection("TRDraftRequest").countDocuments(
        {
        date:today_string,
        student_id:student_id,
        request_type:TRDraftRequestDataValidator.request_type_name_to_index["LectureAndTextbookStudyData"],
        deleted:false,
        },
        {session}
      );
      if(this_type_doc_count>=TRDraftRequestDataValidator.daily_LAT_request_max_count ||
          this_type_active_doc_count>=TRDraftRequestDataValidator.daily_active_LAT_request_max_count)
          throw new Error(`LAT study data request count exceeds 1`);
    }

    //update request info & status
    let newlySaved=!prev_LAT_study_doc;

    const LAT_study_doc_id=newlySaved?new ObjectId():prev_LAT_study_doc._id;
    const LAT_study_doc_insert_settings=TRDraftRequestDataValidator.getLATStudyDataRequestOnInsertSettings(
      student_id,
      today_string,
      textbookID_oid,
      elementID_oid,
      newlySaved?LAT_study_doc_id:null,
    );
    if(newlySaved) LAT_study_doc_insert_settings["study_data_list"]=[];
    const LAT_study_doc_update_settings=TRDraftRequestDataValidator.getLATStudyDataRequestOnUpdateSettings(
      TRDraftRequestDataValidator.request_status_to_index["created"],
      current_date,
      true,
      textbookID_oid?false:true,
    );
    // let request_doc={};
    // if(newlySaved){
    //   request_doc=TRDraftRequestDataValidator.getNewLATStudyDataRequestDocument(student_id,today_string,textbookID_oid,elementID_oid);
    //   request_doc["study_data_list"]=[];
    // }
    // request_doc["request_specific_data.deleted"]=true;
    // request_doc["deleted"]=true;
    // request_doc["modify_date"]=current_date;
    // const study_data_review_id= new ObjectId();
    // study_data_element["review_id"]=study_data_review_id;

    await db.collection("TRDraftRequest").updateOne(
      {
        date:today_string,
        student_id:student_id,
        request_type:TRDraftRequestDataValidator.request_type_name_to_index["LectureAndTextbookStudyData"],
        "request_specific_data.textbookID":textbookID_oid,
        "request_specific_data.elementID":elementID_oid,
      },
      {
        $setOnInsert:LAT_study_doc_insert_settings,
        $set:LAT_study_doc_update_settings,
      },
      {"upsert":true,session}
    );

    await session.commitTransaction();
  }
  catch(error){
    console.log(`error: ${error}`);
    await session.abortTransaction();
    ret_val["success"]=false;
    ret_val["ret"]=`error while saving life data`;
  }
  finally{
    await session.endSession();
    return res.json(ret_val);
  }
});

//save student request data
app.post("/api/saveLATStudyDataRequest",loginCheck, permissionCheck(Role("student")), async function (req, res) {
  const ret_val={"success":true, "ret":null, "page_reload":false};
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
    const username=req.session.passport.user.username;
    const student_id=req.session.passport.user.student_id;
    const today_string=getCurrentKoreaDateYYYYMMDD();
    const current_date=getCurrentDate();
    let {
      excuse,
      timeAmount,
      finishedState,
      textbookID,
      elementID,
      deleted,
      duplicatable,
      duplicatableName,
      duplicatableSubject,
      recentPage,
      requestNew,
      reviewedBy,
      reviewerReassigned,
    }= req.body;
    duplicatable=!!duplicatable;
    deleted=!!deleted;
    finishedState=!!finishedState;
    requestNew=!!requestNew;
    reviewerReassigned=!!reviewerReassigned;
    if(finishedState===true) excuse="";
    const textbook_oid=duplicatable?null:new ObjectId(textbookID);
    const element_oid=duplicatable?new ObjectId(elementID):null;
    if(!duplicatable){
      duplicatableName=null;
      duplicatableSubject=null;
    }
    if(!TRDraftRequestDataValidator.checkExcuseValueValid(excuse,finishedState) || !TRDraftRequestDataValidator.checkTimeStringValid(timeAmount)) throw new Error(`invalid assignment study data`);
    else if(deleted) throw new Error(`invalid request parameter`);
    else if(duplicatable && (!TRDraftRequestDataValidator.checkDuplicatableNameValid(duplicatableName) || !TRDraftRequestDataValidator.checkDuplicatableSubjectValid(duplicatableSubject))) throw new Error(`invalid assignment study data`);
    else if(!TRDraftRequestDataValidator.checkRecentPageValid(recentPage)) throw new Error(`recent page value invalid`);
    else if(!TRDraftRequestDataValidator.checkReviewerUsernameArrayValid(reviewedBy)) throw new Error(`invalid reviewer array:0`);
    recentPage=parseInt(recentPage);

    //check if todays' TR alreay finished
    if((await checkTRFinishedByStudentUsername(username,today_string,{session}))){
      ret_val.success=false;
      ret_val.ret="오늘자 귀가검사가 끝난 후 새로 요청을 보낼 수 없습니다";
      return;
    }

    //check if reviewers in reviewer array exist
    const reviewer_array_len=reviewedBy.length;
    const reviewer_user_array=await getManagerUserListInSameGroupByMyUsername(username,true,reviewedBy,{session});
    if(reviewer_user_array.length !== reviewer_array_len) throw new Error(`invalid reviewer array:1`);

    //if given request is for reassigning a reviewer
    if(reviewerReassigned){
      const prev_LAT_study_doc= await getTRDraftRequestAndReviewer({
        student_id,
        date:today_string,
        request_type:TRDraftRequestDataValidator.request_type_name_to_index["LectureAndTextbookStudyData"],
        "request_specific_data.textbookID":textbook_oid,
        "request_specific_data.elementID":element_oid,
      },{session});
      if(!prev_LAT_study_doc) throw new Error(`no such prev request or review`); //reviewer reassigned before request made
      const review_status=prev_LAT_study_doc.Review_aggregate.review_status;
      const reviewer_user_id=prev_LAT_study_doc.Review_aggregate.reviewer_user_id;
      const reviewer_reassign_validity=TRDraftRequestDataValidator.checkTRDraftRequestReviwerReassignValid(review_status,reviewer_user_id,reviewer_user_array);
      if(!reviewer_reassign_validity.valid){
        ret_val.success=false;
        ret_val.ret=reviewer_reassign_validity.error_msg;
        ret_val.page_reload=reviewer_reassign_validity.page_reload;
        return;
      }

      //here goes the reassignment of request reviewer
      const LAT_study_doc_id=prev_LAT_study_doc._id;
      const prev_study_data_element=prev_LAT_study_doc.study_data;
      const prev_excuse=prev_study_data_element.excuse;
      const prev_time_amount=prev_study_data_element.time_amount;
      const prev_finished_state=prev_study_data_element.finished_state;
      const study_data_review_id=new ObjectId();
      const study_data_element=TRDraftRequestDataValidator.getStudyDataElement(prev_excuse,prev_time_amount,prev_finished_state,study_data_review_id,current_date);
      await db.collection("TRDraftRequest").updateOne(
        {
          _id:LAT_study_doc_id,
        },
        {
          $push:{"study_data_list":study_data_element},
        },
        {session}
      );

      //insert review template documents to TrDraftRequestReview collection
      const review_document_list=TRDraftRequestDataValidator.getNewRequestReviewListByUserDocumentList(LAT_study_doc_id,study_data_review_id,reviewer_user_array,current_date);
      await db.collection("TRDraftRequestReview").insertMany(review_document_list,{session});

      await session.commitTransaction();
      return; //!!this is necessary indeed!!
    }

    //check if textbook document exists
    if(!!textbookID){
      const textbook_doc= await db.collection("TextBook").findOne({_id:textbook_oid},{session});
      if(!textbook_doc) throw new Error(`no such Textbook`);
    }

    const prev_LAT_study_doc= await db.collection("TRDraftRequest")
      .findOne(
        {
          student_id,
          date:today_string,
          request_type:TRDraftRequestDataValidator.request_type_name_to_index["LectureAndTextbookStudyData"],
          "request_specific_data.textbookID":textbook_oid,
          "request_specific_data.elementID":element_oid,
        },
        {session}
      );
    if(duplicatable && requestNew && prev_LAT_study_doc){ //check if element ID already in use
        ret_val.ret={"reset_object_id":true};
        return;
    }
    else if(!requestNew && !prev_LAT_study_doc)
      throw new Error(`no such previous request data`);
    else if(prev_LAT_study_doc && !TRDraftRequestDataValidator.checkRequestDataUpdatable(prev_LAT_study_doc.request_status))
      throw new Error(`LAT study data request in inupdatable status`);

    // const prev_LAT_study_data_list=await db.collection("TRDraftRequest").find(
    //   {
    //     date:today_string,
    //     student_id,
    //     request_type:TRDraftRequestDataValidator.request_type_name_to_index["LectureAndTextbookStudyData"],
    //     "$or":[{"request_specific_data.deleted":{"$exists":false}},{"request_specific_data.deleted":false}],
    //   }
    // ).toArray();

    const this_type_doc_count= await db.collection("TRDraftRequest").countDocuments(
      {
        date:today_string,
        student_id,
        request_type:TRDraftRequestDataValidator.request_type_name_to_index["LectureAndTextbookStudyData"],
      },
      {session}
    );
    const this_type_active_doc_count= await db.collection("TRDraftRequest").countDocuments(
      {
        date:today_string,
        student_id,
        request_type:TRDraftRequestDataValidator.request_type_name_to_index["LectureAndTextbookStudyData"],
        deleted:false,
      },
      {session}
    );
    // if(prev_LAT_study_data_list.length + (!prev_LAT_study_doc?1:0) > TRDraftRequestDataValidator.daily_LAT_request_max_count)
    //   throw new Error(`LAT study data request count exceeds max value`);
    if(!prev_LAT_study_doc &&
      (this_type_doc_count>=TRDraftRequestDataValidator.daily_LAT_request_max_count ||
        this_type_active_doc_count>=TRDraftRequestDataValidator.daily_active_LAT_request_max_count))
        throw new Error(`LAT study data request count exceeds max value`);
    
    const newlySaved=!prev_LAT_study_doc;

    const LAT_study_doc_id=newlySaved?new ObjectId():prev_LAT_study_doc._id;
    const LAT_study_doc_insert_settings=TRDraftRequestDataValidator.getLATStudyDataRequestOnInsertSettings(
      student_id,
      today_string,
      textbook_oid,
      element_oid,
      newlySaved?LAT_study_doc_id:null
    );
    const LAT_study_doc_update_settings=TRDraftRequestDataValidator.getLATStudyDataRequestOnUpdateSettings(
      TRDraftRequestDataValidator.request_status_to_index["review_needed"],
      current_date,
      false,
      duplicatable,
      duplicatableName,
      duplicatableSubject,
      recentPage,
    );

    // let request_doc={};
    // if(newlySaved){
    //   request_doc=TRDraftRequestDataValidator.getNewLATStudyDataRequestDocument(student_id,today_string,textbook_oid,element_oid,duplicatableName,duplicatableSubject,recentPage);
    // }
    // request_doc["request_specific_data.deleted"]=false;
    // request_doc["deleted"]=false;
    // if(!duplicatable) request_doc["request_specific_data.recent_page"]=recentPage;
    // request_doc["request_specific_data.duplicatable_name"]=duplicatableName;
    // request_doc["request_specific_data.duplicatable_subject"]=duplicatableSubject;
    // request_doc["request_specific_data.recent_page"]=recentPage;
    // const study_data_element={...TRDraftRequestDataValidator.request_study_data_template};
    // study_data_element["excuse"]=excuse;
    // study_data_element["time_amount"]=timeAmount;
    // study_data_element["timestamp"]=current_date;
    // study_data_element["finished_state"]=finishedState;
    // request_doc["modify_date"]=current_date;
    const study_data_review_id=new ObjectId();
    const study_data_element=TRDraftRequestDataValidator.getStudyDataElement(excuse,timeAmount,finishedState,study_data_review_id,current_date);
    await db.collection("TRDraftRequest").updateOne(
      {
        date:today_string,
        student_id,
        request_type:TRDraftRequestDataValidator.request_type_name_to_index["LectureAndTextbookStudyData"],
        "request_specific_data.textbookID":textbook_oid,
        "request_specific_data.elementID":element_oid,
      },
      {
        $setOnInsert:LAT_study_doc_insert_settings,
        $set:LAT_study_doc_update_settings,
        $push:{"study_data_list":study_data_element},
      },
      {"upsert":true,session},
    );

    //insert review template documents to TrDraftRequestReview collection
    const review_document_list=TRDraftRequestDataValidator.getNewRequestReviewListByUserDocumentList(LAT_study_doc_id,study_data_review_id,reviewer_user_array,current_date);
    await db.collection("TRDraftRequestReview").insertMany(review_document_list,{session});
    
    await session.commitTransaction();
  }
  catch(error){
    console.log(`error: ${error}`);
    await session.abortTransaction();
    ret_val["success"]=false;
    ret_val["ret"]=`error while saving lat study data`;
  }
  finally{
    await session.endSession();
    return res.json(ret_val);
  }
});

//set program element as deleted on tr draft page
app.post("/api/setProgramElementDeletedOnTrDraft",loginCheck, permissionCheck(Role("student")), async function (req, res) {
  const ret_val={"success":true, "ret":null};
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
    const student_id=req.session.passport.user.student_id;
    const today_string=getCurrentKoreaDateYYYYMMDD();
    const current_date=getCurrentDate();
    let {elementID,requestNew}= req.body;
    requestNew=!!requestNew;

    let element_oid=new ObjectId(elementID);
    // const prev_program_participation_data=await db.collection("TRDraftRequest")
    //   .find({
    //     date:today_string,
    //     student_id:student_id,
    //     request_type:TRDraftRequestDataValidator.request_type_name_to_index["ProgramParticipationData"],
    //     "request_specific_data.elementID":elementID_oid,
    //   }).toArray();
    const prev_program_participation_doc=await db.collection("TRDraftRequest").findOne(
      {
        date:today_string,
        student_id:student_id,
        request_type:TRDraftRequestDataValidator.request_type_name_to_index["ProgramParticipationData"],
        "request_specific_data.elementID":element_oid,
      },
      {session}
    );
    // if(prev_program_participation_data.length===0) newlySaved=true;
    // if(prev_program_participation_data.length>1) throw new Error(`same program participation data request count exceeds 1`);
    // else if(prev_program_participation_data.length==1 && !TRDraftRequestDataValidator.checkRequestDataUpdatable(prev_program_participation_data[0].request_status))
    //   throw new Error(`assignment study data request in inupdatable status`);
    if(prev_program_participation_doc){
      if(requestNew) return; //accept deletion of client side new element with duplicated objectid on database
      else if(!TRDraftRequestDataValidator.checkRequestDataUpdatable(prev_program_participation_doc.request_status))
        throw new Error(`program participation data request in inupdatable status`);
    }
    else{
      const this_type_doc_count=await db.collection("TRDraftRequest").countDocuments(
        {
          date:today_string,
          student_id:student_id,
          request_type:TRDraftRequestDataValidator.request_type_name_to_index["ProgramParticipationData"],
        },
        {session}
      );
      const this_type_active_doc_count= await db.collection("TRDraftRequest").countDocuments(
        {
          date:today_string,
          student_id:student_id,
          request_type:TRDraftRequestDataValidator.request_type_name_to_index["ProgramParticipationData"],
          deleted:false,
        },
        {session}
      );
      if(this_type_doc_count>=TRDraftRequestDataValidator.daily_LAT_request_max_count ||
          this_type_active_doc_count>=TRDraftRequestDataValidator.daily_active_LAT_request_max_count)
          throw new Error(`program participation data request count exceeds 1`);
    }
    let newlySaved=!prev_program_participation_doc;
    const program_doc_id=newlySaved?new ObjectId():prev_program_participation_doc._id;
    const program_doc_insert_settings=TRDraftRequestDataValidator.getProgramDataRequestOnInsertSettings(
      student_id,
      today_string,
      element_oid,
      newlySaved?program_doc_id:null,
    );
    // console.log(`program doc insert settings: ${JSON.stringify(program_doc_insert_settings)}`);
    if(newlySaved) program_doc_insert_settings["study_data_list"]=[];
    const program_doc_update_settings=TRDraftRequestDataValidator.getProgramDataRequestOnUpdateSettings(
      TRDraftRequestDataValidator.request_status_to_index["created"],
      current_date,
      true,
    );

    // let request_doc={};
    // if(newlySaved){
    //   request_doc=TRDraftRequestDataValidator.getNewProgramDataRequestDocument(student_id,today_string,elementID_oid);
    //   request_doc["study_data_list"]=[];
    // }
    // request_doc["request_specific_data.deleted"]=true;
    // request_doc["deleted"]=true;
    // request_doc["modify_date"]=current_date;
    await db.collection("TRDraftRequest").updateOne(
      {
        date:today_string,
        student_id:student_id,
        request_type:TRDraftRequestDataValidator.request_type_name_to_index["ProgramParticipationData"],
        "request_specific_data.elementID":element_oid,
      },
      {
        $setOnInsert:program_doc_insert_settings,
        $set:program_doc_update_settings,
      },
      {"upsert":true,session});

      await session.commitTransaction();
  }
  catch(error){
    console.log(`error: ${error}`);
    await session.abortTransaction();
    ret_val["success"]=false;
    ret_val["ret"]=`error while saving life data`;
  }
  finally{
    await session.endSession();
    return res.json(ret_val);
  }
});

//save program request data
app.post("/api/saveProgramDataRequest",loginCheck, permissionCheck(Role("student")), async function (req, res) {
  const ret_val={"success":true, "ret":null};
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
  // console.log(`req.body: ${JSON.stringify(req.body)}`);
  try{
    session.startTransaction();
    const student_id=req.session.passport.user.student_id;
    const username=req.session.passport.user.username;
    const today_string=getCurrentKoreaDateYYYYMMDD();
    const current_date=getCurrentDate();
    let {
      excuse,
      timeAmount,
      finishedState,
      deleted,
      requestNew,
      elementID,
      programName,
      programBy,
      programDescription,
      reviewedBy,
      reviewerReassigned,
    }= req.body;
    deleted=!!deleted;
    finishedState=!!finishedState;
    requestNew=!!requestNew;
    reviewerReassigned=!!reviewerReassigned;
    if(finishedState===true) excuse="";
    const element_oid= new ObjectId(elementID);
    let programBy_oid=null;
    if(!TRDraftRequestDataValidator.checkExcuseValueValid(excuse,finishedState) || !TRDraftRequestDataValidator.checkTimeStringValid(timeAmount)) throw new Error(`invalid program participation data`);
    else if(deleted) throw new Error(`invalid request parameter`);
    else if(!TRDraftRequestDataValidator.checkProgramNameValid(programName) ||
      !TRDraftRequestDataValidator.checkProgramByUsernameValid(programBy) ||
      !TRDraftRequestDataValidator.checkProgramDescriptionValid(programDescription)) throw new Error(`invalid program participation data`);
    else if(!TRDraftRequestDataValidator.checkReviewerUsernameArrayValid(reviewedBy)) throw new Error(`invalid reviewer array:0`);

    //check if todays' TR alreay finished
    if((await checkTRFinishedByStudentUsername(username,today_string,{session}))){
      ret_val.success=false;
      ret_val.ret="오늘자 귀가검사가 끝난 후 새로 요청을 보낼 수 없습니다";
      return;
    }

    //check if reviewers in reviewer array exist
    const reviewer_array_len=reviewedBy.length;
    const reviewer_user_array=await getManagerUserListInSameGroupByMyUsername(username,true,reviewedBy,{session});
    if(reviewer_user_array.length !== reviewer_array_len) throw new Error(`invalid reviewer array:1`);

    //if given request is for reassigning a reviewer
    if(reviewerReassigned){
      const prev_program_participation_doc= await getTRDraftRequestAndReviewer({
        student_id,
        date:today_string,
        request_type:TRDraftRequestDataValidator.request_type_name_to_index["ProgramParticipationData"],
        "request_specific_data.elementID":element_oid,
      },{session});
      if(!prev_program_participation_doc) throw new Error(`no such prev request or review`); //reviewer reassigned before request made
      const review_status=prev_program_participation_doc.Review_aggregate.review_status;
      const reviewer_user_id=prev_program_participation_doc.Review_aggregate.reviewer_user_id;
      const reviewer_reassign_validity=TRDraftRequestDataValidator.checkTRDraftRequestReviwerReassignValid(review_status,reviewer_user_id,reviewer_user_array);
      if(!reviewer_reassign_validity.valid){
        ret_val.success=false;
        ret_val.ret=reviewer_reassign_validity.error_msg;
        ret_val.page_reload=reviewer_reassign_validity.page_reload;
        return;
      }

      //here goes the reassignment of request reviewer
      const program_participation_doc_id=prev_program_participation_doc._id;
      const prev_study_data_element=prev_program_participation_doc.study_data;
      const prev_excuse=prev_study_data_element.excuse;
      const prev_time_amount=prev_study_data_element.time_amount;
      const prev_finished_state=prev_study_data_element.finished_state;
      const study_data_review_id=new ObjectId();
      const study_data_element=TRDraftRequestDataValidator.getStudyDataElement(prev_excuse,prev_time_amount,prev_finished_state,study_data_review_id,current_date);
      await db.collection("TRDraftRequest").updateOne(
        {
          _id:program_participation_doc_id,
        },
        {
          $push:{"study_data_list":study_data_element},
        },
        {session}
      );

      //insert review template documents to TrDraftRequestReview collection
      const review_document_list=TRDraftRequestDataValidator.getNewRequestReviewListByUserDocumentList(program_participation_doc_id,study_data_review_id,reviewer_user_array,current_date);
      await db.collection("TRDraftRequestReview").insertMany(review_document_list,{session});

      await session.commitTransaction();
      return; //!!this is necessary indeed!!
    }

    //check if program leading manager is valid
    const managerList= await getManagerUserListInSameGroupByMyUsername(username,true,[programBy],{session});
    programBy_oid=TRDraftRequestDataValidator.checkProgramByValid(programBy,managerList);
    if(!programBy_oid) throw new Error(`invalid programBy value`);

    const prev_program_participation_doc= await db.collection("TRDraftRequest")
      .findOne(
        {
          student_id,
          date:today_string,
          request_type:TRDraftRequestDataValidator.request_type_name_to_index["ProgramParticipationData"],
          "request_specific_data.elementID":element_oid,
        },
        {session}
      );
    if(requestNew && prev_program_participation_doc){ //check if elment ID already in use
        ret_val.ret={"reset_object_id":true};
        return;
    }
    else if(!requestNew && !prev_program_participation_doc)
      throw new Error(`no such previous request data`);
    else if(prev_program_participation_doc && !TRDraftRequestDataValidator.checkRequestDataUpdatable(prev_program_participation_doc.request_status))
      throw new Error(`LAT study data request in inupdatable status`);

    // const prev_program_participation_data_list=await db.collection("TRDraftRequest").find(
    //   {
    //     date:today_string,
    //     student_id,
    //     request_type:TRDraftRequestDataValidator.request_type_name_to_index["ProgramParticipationData"],
    //     "$or":[{"request_specific_data.deleted":{"$exists":false}},{"request_specific_data.deleted":false}],
    //   }
    // ).toArray();
    const this_type_doc_count= await db.collection("TRDraftRequest").countDocuments(
      {
        date:today_string,
        student_id,
        request_type:TRDraftRequestDataValidator.request_type_name_to_index["ProgramParticipationData"],
      },
      {session}
    );
    const this_type_active_doc_count= await db.collection("TRDraftRequest").countDocuments(
      {
        date:today_string,
        student_id,
        request_type:TRDraftRequestDataValidator.request_type_name_to_index["ProgramParticipationData"],
        deleted:false,
      },
      {session}
    );
    // if(prev_program_participation_data_list.length + (!prev_program_participation_doc?1:0) > TRDraftRequestDataValidator.daily_program_request_max_count)
    //   throw new Error(`LAT study data request count exceeds max value`);
    if(!prev_program_participation_doc && 
      (this_type_doc_count>=TRDraftRequestDataValidator.daily_program_request_max_count ||
        this_type_active_doc_count>=TRDraftRequestDataValidator.daily_active_program_request_max_count))
        throw new Error(`LAT study data request count exceeds max value`);
    
    const newlySaved=!prev_program_participation_doc;
    const program_doc_id=newlySaved?new ObjectId():prev_program_participation_doc._id;
    const program_doc_insert_settings=TRDraftRequestDataValidator.getProgramDataRequestOnInsertSettings(
      student_id,
      today_string,
      element_oid,
      newlySaved?program_doc_id:null,
    );
    const program_doc_update_settings=TRDraftRequestDataValidator.getProgramDataRequestOnUpdateSettings(
      TRDraftRequestDataValidator.request_status_to_index["review_needed"],
      current_date,
      false,
      programName,
      programBy,
      programDescription,
    );

    // let request_doc={};
    // if(newlySaved){
    //   request_doc=TRDraftRequestDataValidator.getNewProgramDataRequestDocument(student_id,today_string,element_oid,programName,programBy,programDescription);
    // }
    // request_doc["request_specific_data.deleted"]=false;
    // request_doc["deleted"]=false;
    // request_doc["request_specific_data.program_name"]=programName;
    // request_doc["request_specific_data.program_by"]=programBy;
    // request_doc["request_specific_data.program_description"]=programDescription;
    // const study_data_element={...TRDraftRequestDataValidator.request_study_data_template};
    // study_data_element["excuse"]=excuse;
    // study_data_element["time_amount"]=timeAmount;
    // study_data_element["timestamp"]= current_date;
    // study_data_element["finished_state"]=finishedState;
    // request_doc["modify_date"]=current_date;
    const study_data_review_id=new ObjectId();
    const study_data_element=TRDraftRequestDataValidator.getStudyDataElement("",timeAmount,true,study_data_review_id,current_date);
    await db.collection("TRDraftRequest").updateOne(
      {
        date:today_string,
        student_id,
        request_type:TRDraftRequestDataValidator.request_type_name_to_index["ProgramParticipationData"],
        "request_specific_data.elementID":element_oid,
      },
      {
        $setOnInsert:program_doc_insert_settings,
        $set:program_doc_update_settings,
        $push:{"study_data_list":study_data_element},
      },
      {"upsert":true, session},
    );

    //insert review template documents to TrDraftRequestReview collection
    const review_document_list=TRDraftRequestDataValidator.getNewRequestReviewListByUserDocumentList(program_doc_id,study_data_review_id,reviewer_user_array,current_date);
    await db.collection("TRDraftRequestReview").insertMany(review_document_list,{session});

    await session.commitTransaction();
  }
  catch(error){
    console.log(`error: ${error}`);
    await session.abortTransaction();
    ret_val["success"]=false;
    ret_val["ret"]=`error while saving life data`;
  }
  finally{
    await session.endSession();
    return res.json(ret_val);
  }
});

//get all today tr draft requests
app.get("/api/getMyTodayTRDraftRequestsAll",loginCheck, permissionCheck(Role("student")), async function (req, res) {
  const ret_val={"success":true, "ret":null};
  try{
    const student_id=req.session.passport.user.student_id;
    const today_string=getCurrentKoreaDateYYYYMMDD();

    const all_requests=await db.collection("TRDraftRequest")
      .aggregate(
        [
          {
            $match:{
              date:today_string,
              student_id:student_id,
              "$or":[
                {"deleted":false},
                {
                  "$and":[
                    {"request_type":TRDraftRequestDataValidator.request_type_name_to_index["LectureAndTextbookStudyData"]},
                    {"request_specific_data.duplicatable":false},
                    {"deleted":true} 
                  ],
                }
              ],
            }
          },
          {
            $lookup: {
              from: "TRDraftRequestReview",
              let: {
                review_id: {
                  "$getField":{
                    "field": "review_id",
                    "input": {"$last":"$study_data_list"}
                  }
                },
                tr_draft_request_id:"$_id",
              },
              pipeline:[
                {
                  $match:{
                    $expr:{
                      $and:[
                        {
                          $eq:[
                            "$tr_draft_request_id",
                            "$$tr_draft_request_id"
                          ]
                        },
                        {
                          $eq:[
                            "$study_data_review_id",
                            "$$review_id"
                          ]
                        }
                      ]
                    },
                  }
                },
                {
                  $limit:1
                },
                {
                  $lookup: {
                    from: "User",
                    localField: "review_from",
                    foreignField: "_id",
                    as: "User_aggregate",
                  },
                },
                {
                  $unwind:{
                    path: "$User_aggregate"
                  }
                },
                {
                  $project:{
                    review_status:"$review_status",
                    review_msg:{$ifNull: ["$review_msg",""]},
                    username:"$User_aggregate.username",
                    nickname:"$User_aggregate.nickname",
                  }
                }
              ],
              as: "Review_aggregate",
            },
          },
          {
            $unwind:{
              path:"$Review_aggregate",
              preserveNullAndEmptyArrays:true,
            }
          },
          {
            $project:{
              student_id:1,
              date:1,
              request_type:1,
              request_status:1,
              request_specific_data:1,
              study_data:{"$last":"$study_data_list"},
              // study_data_list:1,
              review_status:"$Review_aggregate.review_status",
              review_msg:"$Review_aggregate.review_msg",
              review_username:'$Review_aggregate.username',
              review_nickname:'$Review_aggregate.nickname',
              deleted:"$deleted",
            }
          },
        ]
      ).toArray();
    ret_val.ret=all_requests;
  }
  catch(error){
    console.log(`error: ${error}`);
    ret_val["success"]=false;
    ret_val["ret"]=`error while saving life data`;
  }
  finally{
    return res.json(ret_val);
  }
});

//get group list
app.get("/api/groupList", async (req, res) => {
  const ret={"success":false,"ret":null};
  try{
    const group_list= await db.collection("Group").find({group_name:{"$exists":true}}).project({_id:0}).toArray();
    ret["success"]=true; ret["ret"]=group_list;
  }
  catch(e){
    ret["ret"]="그룹 목록을 불러오는 중 오류가 발생했습니다";
  }
  finally{
    return res.json(ret);
  }
});

app.post("/api/checkUsernameAvailable", async function(req,res){
  const ret_val={"success":true, "ret":null};
  try{
    ret_val["ret"]={available:false};
    const target_username=req.body["username"];
    if(!validator.isUsernameValid(target_username)) return;
    const user_doc=await db.collection("User").findOne({username:target_username});
    ret_val["success"]=true;
    if(user_doc) return;
    else ret_val["ret"]["available"]=true;
  }
  catch(error){
    ret_val["success"]=false;
    ret_val["ret"]=`error while check if username available`;
  }
  finally{
    return res.json(ret_val);
  }
});

function getUserObjectWithRegisterInfo(register_info,salt,password_hashed,current_date,privacyTermAgreed,uniqueInfoTermAgreed,sensitiveInfoTermAgreed){
  return {
    username:register_info.username,
    salt:salt,
    password:password_hashed,
    tmp_salt:null,
    tmp_password:null,
    tmp_password_expiration:validator.getSuspendedDateDefaultDate(),
    email:register_info.email,
    nickname:register_info.nickname,
    create_date: current_date,
    modify_date:null,
    privacy_term_agreed:privacyTermAgreed,
    unique_info_term_agreed:uniqueInfoTermAgreed,
    sensitive_info_term_agreed:sensitiveInfoTermAgreed,
    term_agreed_date:new Date(register_info.termAgreedDate),
    approved:false,
    approved_date:null,
    approved_by:null,
    suspended:false,
    suspended_change_date:null,
    suspended_by:null,
    sns_type:null,
    sns_id:null,
    sns_connect_date:null,
    address:register_info.address,
    birth_date:new Date(register_info.birthDate),
    phone_number:register_info.phoneNumber,
    gender:register_info.gender,
    school_attending_status:register_info.schoolAttendingStatus,
    deleted:false,
  }
}

app.post("/api/registerUser", async function(req,res){
  const ret_val={"success":true, "ret":null};
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
    ret_val["ret"]={"registered":false,"excuse":""};
    let fields_valid=false;
    const register_info=req.body;
    register_info.privacyTermAgreed=!!register_info.privacyTermAgreed;
    register_info.uniqueInfoTermAgreed=!!register_info.uniqueInfoTermAgreed;
    register_info.sensitiveInfoTermAgreed=!!register_info.sensitiveInfoTermAgreed;
    if(!register_info.privacyTermAgreed) ret_val["ret"]["excuse"]="개인정보 수집 동의 약관에 동의하지 않았습니다";
    else if(!register_info.uniqueInfoTermAgreed) ret_val["ret"]["excuse"]="고유식별정보 수집 동의 약관에 동의하지 않았습니다";
    else if(!register_info.sensitiveInfoTermAgreed) ret_val["ret"]["excuse"]="민감정보 수집 동의 약관에 동의하지 않았습니다";
    else if(!roles.RoleNameValidCheckSafe(register_info.userType)) ret_val["ret"]["excuse"]="올바른 사용자 유형이 아닙니다";
    else if(!validator.isDateStringValid(register_info.termAgreedDate)) ret_val["ret"]["excuse"]="약관 동의 날짜가 유효하지 않습니다";
    else if(!validator.isUsernameValid(register_info.username)) ret_val["ret"]["excuse"]="올바른 아이디가 아닙니다";
    else if(!validator.isPasswordValid(register_info.password)) ret_val["ret"]["excuse"]="올바른 비밀번호가 아닙니다";
    else if(!validator.isNicknameValid(register_info.nickname)) ret_val["ret"]["excuse"]="올바른 이름이 아닙니다";
    else if(!validator.isBirthDateValid(register_info.birthDate)) ret_val["ret"]["excuse"]="올바른 생년월일이 아닙니다";
    else if(!validator.isGenderValid(register_info.gender)) ret_val["ret"]["excuse"]="올바른 성별이 아닙니다";
    else if(!validator.isPhoneNumberValid(register_info.phoneNumber)) ret_val["ret"]["excuse"]="올바른 휴대전화 번호가 아닙니다";
    else if(!validator.isAddressValid(register_info.address)) ret_val["ret"]["excuse"]="올바른 주소가 아닙니다";
    else if(!validator.isSchoolAttendingStatusValid(register_info.schoolAttendingStatus.school,register_info.schoolAttendingStatus.status)) ret_val["ret"]["excuse"]="올바른 재학 정보가 아닙니다";
    else if(validator.MajorInfoNeeded(register_info.userType, register_info.schoolAttendingStatus.school) && !(validator.isDepartmentValid(register_info.schoolAttendingStatus.department) && validator.isMajorValid(register_info.schoolAttendingStatus.major))) ret_val["ret"]["excuse"]="올바른 학과명이 아닙니다";
    else fields_valid=true;

    if(!fields_valid) return;

    //lastly, check if gropuofuser field valid
    const group_designated=validator.groupOfUserNeeded(register_info.userType);
    let group_doc=null;
    if(group_designated){
      group_doc= await db.collection("Group").findOne({"group_name":register_info.groupOfUser});
      if(!group_doc) throw new Error("no such group name");
    }

    const current_date=getCurrentDate();
    const [salt,password_hashed]=authentificator.makeHashedSync(register_info.password);
    const user_info=getUserObjectWithRegisterInfo(register_info,salt,password_hashed,current_date);
    const user_id= new ObjectId();
    user_info["_id"]=user_id;
    await db.collection("User").insertOne(user_info);

    const role_doc=await db.collection("Role").findOne({role_index:roles.roleNameToIndex[register_info.userType]});
    const role_id= role_doc._id;

    await db.collection("RoleOfUser").insertOne({user_id:user_id,role_id:role_id,modify_date:current_date,activated:false});

    if(group_designated) {
      const group_id=group_doc._id;
      await db.collection("GroupOfUser").insertOne({user_id:user_id,group_id:group_id,modify_date:current_date,activated:false});
    }

    ret_val["ret"]["registered"]=true;
    await session.commitTransaction();
  }
  catch(error){
    console.log(`error: ${JSON.stringify(error)}`);
    console.log(`invalid excuse: ${JSON.stringify(ret_val)}`);
    await session.abortTransaction();
    ret_val["success"]=false;
    ret_val["ret"]=`이미 사용중인 아이디입니다`;
  }
  finally{
    await session.endSession();
    return res.json(ret_val);
  }
});

// collection 중 StudentDB의 모든 Document find 및 전송
app.get("/api/studentList", loginCheck, permissionCheck(Role("manager"),Role("admin")), async function (req, res) {
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
app.get("/api/ActiveStudentList", loginCheck, permissionCheck(Role("manager"),Role("admin")), async (req,res)=>{
  const ret_val={"success":false, "ret":null};
  try{
    const group_oid=req.session.passport.user.group_oid;
    const acitve_student_list= await db.collection("StudentDB").find(
      {
        "graduated":false,
        "$or":[
          {"deleted":{"$exists":false}},
          {"deleted":false}
        ],
        "group_id":group_oid,
      }
    ).toArray();
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

app.get("/api/managerList", loginCheck, permissionCheck(Role("student"),Role("manager"),Role("admin")), async (req, res) => {
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

// get user array whose roles are "manager" by 
async function getManagerUserListInSameGroupByMyUsername(username,getUserObjectId=false,targetUsernameList=[],query_option={}){
  const user_doc= await db.collection("User").findOne({username},query_option);
  if(!user_doc) throw new Error(`invalid username argument`);
  const user_id= user_doc._id;
  const group_of_user_doc= await db.collection("GroupOfUser").findOne({user_id},query_option);
  if(!group_of_user_doc) throw new Error(`invalid function call: user with no group assigned`);
  const group_id= group_of_user_doc.group_id;

  const user_match_filter={
    approved:true,
    suspended:false, // this is necessary since "suspend" feature made
  }
  if(targetUsernameList.length>0) user_match_filter.username={"$in":targetUsernameList};

  const manager_list= await db.collection("User").aggregate([
    {
      $match:user_match_filter,
    },
    {
      $lookup: {
        from: "GroupOfUser",
        localField: "_id",
        foreignField: "user_id",
        as: "GroupOfUser_aggregate",
      },
    },
    { 
      $unwind: {
        path:"$GroupOfUser_aggregate",
      }
    },
    {
      $match:{
        "GroupOfUser_aggregate.activated":true,
        "GroupOfUser_aggregate.group_id":group_id,
      }
    },
    {
      $lookup: {
        from: "RoleOfUser",
        localField: "_id",
        foreignField: "user_id",
        as: "RoleOfUser_aggregate",
      },
    },
    { 
      $unwind: {
        path:"$RoleOfUser_aggregate",
      }
    },
    {
      $match:{
        "RoleOfUser_aggregate.activated":true,
      }
    },
    {
      $lookup: {
        from: "Role",
        localField: "RoleOfUser_aggregate.role_id",
        foreignField: "_id",
        as: "Role_aggregate",
      },
    },
    { 
      $unwind: {
        path:"$Role_aggregate",
      }
    },
    {
      $match:{
        "Role_aggregate.role_index":roles.roleNameToIndex["manager"],
      }
    },
    {
      $project: {
        _id: getUserObjectId?1:0,
        username: "$username",
        nickname: "$nickname",
        userType: "$Role_aggregate.role_name",
        signUpDate: "$create_date",
        approved: 1,
      },
    },
  ],query_option).toArray();
  return manager_list;
}

//get manager list from registered user accounts whose roles are designated as "manager"s
app.get("/api/managerListByStudentAccount", loginCheck, permissionCheck(Role("student")), async (req, res) => {
  const ret={"success":false,"ret":null};
  try{
    const username= req.session.passport.user.username;
    const manager_list=await getManagerUserListInSameGroupByMyUsername(username);
    ret["success"]=true; ret["ret"]=manager_list;
  }
  catch(e){
    ret["ret"]="매니저 목록 데이터를 불러오는 중 오류가 발생했습니다";
  }
  finally{
    return res.json(ret);
  }
});

//get manager list from my group
app.get("/api/managerListByMyGroup", loginCheck, permissionCheck(Role("manager"),Role("admin")), async (req, res) => {
  const ret={"success":false,"ret":null};
  try{
    const username=req.session.passport.user.username;
    const manager_list=await getManagerUserListInSameGroupByMyUsername(username,true);
    ret["success"]=true; ret["ret"]=manager_list;
  }
  catch(e){
    ret["ret"]="매니저 목록 데이터를 불러오는 중 오류가 발생했습니다";
  }
  finally{
    return res.json(ret);
  }
});

//get manager list from registered user accounts whose roles are designated as "manager"s
app.post("/api/managerListByStudentLegacyID", loginCheck, permissionCheck(Role("manager"),Role("admin")), async (req, res) => {
  const ret={"success":false,"ret":null};
  try{
    let {
      studentLegacyID
    }= req.body;
    const student_doc=(await db.collection("StudentDB").aggregate(
      [
        {
          $match:{
            ID:studentLegacyID,
          }
        },
        {
          $lookup: {
            from: "User",
            localField: "user_id",
            foreignField: "_id",
            as: "User_aggregate",
          },
        },
        { 
          $unwind: {
            path:"$User_aggregate",
          }
        },
      ]
    ).toArray())[0];
    if(!student_doc) throw new Error(`no such student user`);
    const student_username=student_doc.User_aggregate.username;
    const manager_list=await getManagerUserListInSameGroupByMyUsername(student_username,true);
    ret["success"]=true; ret["ret"]=manager_list;
  }
  catch(e){
    ret["ret"]="매니저 목록 데이터를 불러오는 중 오류가 발생했습니다";
  }
  finally{
    return res.json(ret);
  }
});

function getRandomInt(max=10) {
  return Math.floor(Math.random() * max);
}

function getRandomDigitString(length=2){
  let ret="";
  for(let i=0; i<length; i++) ret+=getRandomInt().toString();
  return ret;
}

// StudentDB에 새로운 stuDB 추가 요청
app.post("/api/StudentDB", loginCheck, permissionCheck(Role("manager"),Role("admin")), async function (req, res) {
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
    const user_oid=req.session.passport.user.user_oid;
    const group_oid=req.session.passport.user.group_oid;
    let student_legacy_id=newDB.ID;
    const prev_same_legacy_id_list=(await db.collection('StudentDB').find(
      {
        ID:{
          $regex:student_legacy_id,
        }
      },
      {session}
    ).toArray()).map((e,idx)=>e.ID);
    const prev_same_legacy_id_set=new Set(prev_same_legacy_id_list);
    if(prev_same_legacy_id_set.size>0) student_legacy_id+="_"+getRandomDigitString();
    while(prev_same_legacy_id_set.has(student_legacy_id)){
      student_legacy_id+=getRandomDigitString();
    }
    newDB.ID=student_legacy_id;
    newDB.group_id=group_oid;
    await db.collection("StudentDB").insertOne(newDB,{session});
    await db.collection("StudentDB_Log").insertOne(newDB,{session});
    ret["success"]=true;
    await session.commitTransaction();
  }
  catch(e){
    await session.abortTransaction();
    ret["ret"]="학생 데이터 등록 중 오류가 발생했습니다";
  }
  finally{
    await session.endSession();
    return res.json(ret);
  }
});

// StudentDB에서 해당 ID의 document 조회
app.get("/api/StudentDB/:ID", loginCheck, permissionCheck(Role("manager"),Role("admin")), async function (req, res) {
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
app.put("/api/StudentDB", loginCheck, permissionCheck(Role("manager"),Role("admin")), async (req, res) => {
  // console.log(req["user"], req["user"]["ID"] === "guest");
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

  const ret_val={"success":false,"ret" :null};
  // let success;

  let dayIndex = ['월','화','수','목','금','일'];

  const newstuDB = req.body;
  
  //this delete code is too dirty but...
  delete newstuDB["rou_id"];
  delete newstuDB["user_id"];
  delete newstuDB["group_id"];

  const findID = newstuDB["ID"];

  /** 기존 WeeklyStudyfeedback 콜렉션의 교재와 새롭게 수정된 교재 비교 **/

  let existingTextbook;

  try {

    session.startTransaction();
    // findOne에는 toArray() 쓰면 안됨
    let studentDB_result = await db.collection(`StudentDB`).findOne({ID: findID},{session});
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
          {$push: {"thisweekGoal.교재캡쳐" : {$each : updateTextbookInfo.insertTextbook}}},
          {session});

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
          {$set:dict},
          {session});
    }

    /** ------ 교재 삭제 업데이트 진행 ------ **/
    if(updateTextbookInfo.deleteTextbook.length !== 0){

      await db.collection("WeeklyStudyfeedback").updateMany({"학생ID": newstuDB["ID"],"피드백일" : {$gte: todayFeedback}},
          {$pullAll: {"thisweekGoal.교재캡쳐": updateTextbookInfo.deleteTextbook}
          },
          {session});

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
          {$unset:dict},
          {session});
    }

          // }
    /** -------------------------------------------- **/

    delete newstuDB._id; //MongoDB에서 Object_id 중복을 막기 위해 id 삭제

    newstuDB["진행중교재"] = checkDuplication(newTextbook); // 중복 제거한 진행 중인 교재 리스트로 교체

    await db.collection("StudentDB").updateOne({ ID: findID }, { $set: newstuDB },{session});

    await db.collection("StudentDB_Log").insertOne(newstuDB,{session});

    await session.commitTransaction();
    ret_val["success"]=true;
  }
  catch (err){
    await session.abortTransaction();
    // ret_val=`error ${err}`;
    // success=false;
    // console.error(err);
    // return res.json();
    ret_val["success"]=false;
    ret_val["ret"]="학생 정보 수정 중 오류가 발생했습니다";
  }
  finally{
    await session.endSession();
    return res.json(ret_val);
  }

});


// StudentDB에 삭제 요청
app.delete("/api/StudentDB/:ID", loginCheck, permissionCheck(Role("manager"),Role("admin")), async function (req, res) {
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
app.post("/api/DoGraduate/", loginCheck, permissionCheck(Role("manager"),Role("admin")), async (req,res)=>{
  const ret_val={"success":false,"ret":null};
  try{
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
app.get("/api/TRlist/:date", loginCheck, permissionCheck(Role("manager"),Role("admin")), async function (req, res) {
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
    const group_oid=req.session.passport.user.group_oid;
    // const ret_data= await db.collection("TR").find({날짜: paramDate}).toArray();
    const ret_data= await db.collection('TR').aggregate([
      {
        $match:{
          날짜:paramDate,
          // 날짜:"2023-06-27",
        }
      },
      {
        $lookup: {
          from: "StudentDB",
          let: {
            legacy_id:"$ID",
          },
          pipeline:[
            {
              $match:{
                $expr:{
                  $and:[
                    {
                      $eq:[
                        "$group_id",
                        group_oid
                      ]
                    },
                    {
                      $eq:[
                        "$ID",
                        "$$legacy_id"
                      ]
                    }
                  ]
                },
              }
            },
            {
              $project:{
                student_legacy_id:"$ID",
              }
            }
          ],
          as: "Student_aggregate",
        },
      },
      {
        $unwind: {
          path:"$Student_aggregate",
        }
      },
    ]).toArray();
    ret["success"]=true; ret["ret"]=ret_data;
  }
  catch(e){
    ret["ret"]="TR 목록 데이터를 가져오는 중 오류가 발생했습니다";
  }
  finally{
    return res.json(ret);
  }
});

app.get("/api/TR/:ID", loginCheck, permissionCheck(Role("manager"),Role("admin")), async function (req, res) {
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
    const group_oid=req.session.passport.user.group_oid;
    // const ret_data= await db.collection("TR").find({ID:student_legacy_id,group_id:group_oid}).toArray();
    const ret_data= await db.collection('TR').aggregate([
      {
        $match:{
          ID:student_legacy_id,
        }
      },
      {
        $lookup: {
          from: "StudentDB",
          let: {
            legacy_id:"$ID",
          },
          pipeline:[
            {
              $match:{
                $expr:{
                  $and:[
                    {
                      $eq:[
                        "$group_id",
                        group_oid
                      ]
                    },
                    {
                      $eq:[
                        "$ID",
                        "$$legacy_id",
                      ]
                    }
                  ]
                },
              }
            },
            {
              $project:{
                student_legacy_id:"$ID",
              }
            }
          ],
          as: "Student_aggregate",
        },
      },
      {
        $unwind: {
          path:"$Student_aggregate",
        }
      },
    ]).toArray();
    ret["success"]=true; ret["ret"]=ret_data;
  }
  catch(e){
    ret["ret"]="학생의 TR 목록 데이터를 가져오는 중 오류가 발생했습니다";
  }
  finally{
    return res.json(ret);
  }
});

app.get("/api/TR/:ID/:date", loginCheck, permissionCheck(Role("manager"),Role("admin")), async function (req, res) {
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
    const group_oid=req.session.passport.user.group_oid;
    // const tr_doc= await db.collection("TR").findOne({ID:student_legacy_id, 날짜:date_string});
    const tr_doc= (await db.collection('TR').aggregate([
      {
        $match:{
          ID:student_legacy_id,
          날짜:date_string,
        }
      },
      {
        $lookup: {
          from: "StudentDB",
          let: {
            legacy_id:"$ID",
          },
          pipeline:[
            {
              $match:{
                $expr:{
                  $and:[
                    {
                      $eq:[
                        "$group_id",
                        group_oid
                      ]
                    },
                    {
                      $eq:[
                        "$ID",
                        "$$legacy_id",
                      ]
                    }
                  ]
                },
              }
            },
            {
              $project:{
                student_legacy_id:"$ID",
              }
            }
          ],
          as: "Student_aggregate",
        },
      },
      {
        $unwind: {
          path:"$Student_aggregate",
        }
      },
    ]).toArray())[0];
    // if(!tr_doc) throw new Error("조건에 맞는 TR이 존재하지 않습니다");
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

const TR_mid_feedback_fields=["mid_feedback_user_id","mid_feedback_nickname","mid_feedback_timestamp"];
const TR_final_feedback_fields=["final_feedback_user_id","final_feedback_nickname","final_feedback_timestamp"];

//특정 날짜 범위 내에 있는 TR들을 가져오는 URI
app.post("/api/TRByDateRange/", loginCheck, permissionCheck(Role("manager"),Role("admin")), async function(req,res){
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


app.post("/api/TR", loginCheck, permissionCheck(Role("manager"),Role("admin")), async function (req, res) {
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
  const student_legacy_id=newTR.ID;
  const date_string=newTR.날짜;
  try{
    session.startTransaction();
    const user_oid=req.session.passport.user.user_oid;
    const user_nickanme=req.session.passport.user.nickname;
    const current_date=getCurrentDate();
    const tr_doc= await db.collection("TR").findOne({ID:student_legacy_id, 날짜:date_string},{session});
    if(tr_doc) throw new Error("해당 날짜에 작성된 TR이 이미 존재합니다");

    //write my user nickname to tr and record when it is
    newTR.중간매니저=user_nickanme;
    newTR.mid_feedback_user_oid=user_oid;
    newTR.mid_feedback_date=current_date;
    if(checkTRFinished(newTR)){
      newTR.작성매니저=user_nickanme;
      newTR.final_feedback_user_oid=user_oid;
      newTR.final_feedback_date=current_date;
    }

    await db.collection("TR").insertOne(newTR);

    await session.commitTransaction();
    ret["success"]=true;
  }
  catch(e){
    await session.abortTransaction();
    ret["ret"]=`해당 날짜의 학생 TR 데이터를 저장하는 중 오류가 발생했습니다: ${e}`;
  }
  finally{
    await session.endSession();
    return res.json(ret);
  }
});

app.put("/api/TR", loginCheck, permissionCheck(Role("manager"),Role("admin")), async function (req, res) {
  // console.log('req["user"]', req["user"]);
  const newTR = req.body;
  let findID;
  try {
    findID = new ObjectId(newTR._id);
  } catch (err) {
    return res.send(`invalid access`);
  }
  
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
  const ret={"success":false,"ret":null};
  try{
    session.startTransaction();

    const user_nickanme=req.session.passport.user.nickname;
    const user_oid=req.session.passport.user.user_oid;
    const current_date=getCurrentDate();

    delete newTR._id;
    const student_legacy_id=newTR.ID;
    const date_string=newTR.날짜;
    //check if student doc exists
    const student_doc=await db.collection(`StudentDB`).findOne({ID:student_legacy_id});
    if(!student_doc) throw new Error(`no such student`);
    const student_oid=student_doc._id;
    const student_name=student_doc.이름;
    const TDRIDList=newTR.TDRIDList;
    delete newTR["TDRIDList"];
    // console.log(`tdridlist: ${JSON.stringify(TDRIDList)}`);
    if(TDRIDList){
      for(let i=0; i<TDRIDList.length; i++){
        TDRIDList[i]=new ObjectId(TDRIDList[i]);
      }
    }

    //check mid feedback & final feedback changed and write relevant manager info to TR doc
    const mid_feedback_changed=!!newTR.midFeedbackChanged;
    delete newTR.midFeedbackChanged;
    const final_feedback_changed=!!newTR.finalFeedbackChanged;
    delete newTR.finalFeedbackChanged;
    if(mid_feedback_changed){
      newTR.중간매니저=user_nickanme;
      newTR.mid_feedback_user_oid=user_oid;
      newTR.mid_feedback_date=current_date;
    }
    if(final_feedback_changed){
      newTR.작성매니저=user_nickanme;
      newTR.final_feedback_user_oid=user_oid;
      newTR.final_feedback_date=current_date;
    }

    const tr_doc= await db.collection("TR").findOne({ID:student_legacy_id, 날짜:date_string},{session});
    if(!tr_doc) throw new Error("해당 날짜에 저장된 TR이 없습니다");
    if(tr_doc && !tr_doc._id.equals(findID)) throw new Error("해당 날짜에 작성된 다른 TR이 이미 존재합니다");
    await db.collection("TR").updateOne({_id:findID},{ $set: newTR },{session});

    if(TDRIDList.length>0){
      //update trdraftrequest document written_to_TR field
      await db.collection('TRDraftRequest').updateMany(
        {_id:{$in:TDRIDList}},
        {
          $set:{
            written_to_TR:TRDraftRequestDataValidator.written_to_TR_status_to_index["written"],
          }
        },
        {session}
      );

      //upsert daily goal check logs from TDRR ID list with bulkwrite function
      const TDR_doc_list=(await db.collection('TRDraftRequest').aggregate(
        [
          {
            $match:{
              _id:{$in:TDRIDList},
              $or:[
                {"request_specific_data.AOSID":{$ne:null}},
                {"request_specific_data.textbookID":{$ne:null}}
              ],
              deleted:false,
              date:date_string,
            }
          },
          {
            $lookup: {
              from: "TRDraftRequestReview",
              let: {
                review_id: {
                  "$getField":{
                    "field": "review_id",
                    "input": {"$last":"$study_data_list"}
                  }
                },
                tr_draft_request_id:"$_id",
              },
              pipeline:[
                {
                  $match:{
                    $expr:{
                      $and:[
                        {
                          $eq:[
                            "$tr_draft_request_id",
                            "$$tr_draft_request_id"
                          ]
                        },
                        {
                          $eq:[
                            "$study_data_review_id",
                            "$$review_id"
                          ]
                        }
                      ]
                    },
                  }
                },
                {
                  $limit:1
                },
                {
                  $project:{
                    reviewer_user_oid:"$review_from",
                  }
                }
              ],
              as: "Reviewer_aggregate",
            },
          },
          {
            $unwind: {
              path:"$Reviewer_aggregate",
            }
          },
          {
            $lookup: {
              from: "AssignmentOfStudent",
              localField: "request_specific_data.AOSID",
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
            $lookup: {
              from: "Assignment",
              localField: "AOS_aggregate.assignmentID",
              foreignField: "_id",
              as: "Assignment_aggregate",
            },
          },
          { 
            $unwind: {
              path:"$Assignment_aggregate",
              preserveNullAndEmptyArrays:true,
            }
          },
          {
            $project:{
              _id:1,
              date:1,
              student_id:1,
              request_specific_data:1,
              request_type:1,
              request_status:1,
              written_to_TR:1,
              AOSTextbookID: {$ifNull: ["$Assignment_aggregate.textbookID",""]},
              study_data: {"$last":"$study_data_list"},
              reviewer_user_oid:"$Reviewer_aggregate.reviewer_user_oid",
            }
          }
        ],
        {session}
      ).toArray());
      // console.log(`tdr doc list after flag setting: ${JSON.stringify(TDR_doc_list)}`);
      
      // console.log(`bulk write upsert docs: ${JSON.stringify(bulkWrite_upsert_docs)}`);
      if(TDR_doc_list.length>0){ // this check needed because there are types of requests that does not need DGCL doc udpate 
        const bulkWrite_upsert_docs=TRDraftRequestDataValidator.getDGCLBulkWriteUpsertDocsFromTDRDocs(TDR_doc_list,student_name);
        const bulkWrite_result= await db.collection('DailyGoalCheckLog').bulkWrite(
          bulkWrite_upsert_docs,
          {ordered:false,session},
        );
        if(bulkWrite_result.hasWriteErrors()){
          // console.log(`error occurred while bulk write`);
          throw new Error(`error occurred while bulk write`);
        }
      }

      // const updated_dgcl_docs=await db.collection(`DailyGoalCheckLog`).find({
      //   date:date_string,
      // },
      // {session}).toArray();
      // console.log(`update dgcl docs: ${JSON.stringify(updated_dgcl_docs)}`);
    }
    

    await session.commitTransaction();
    ret["success"]=true;
  }
  catch(e){
    await session.abortTransaction();
    console.log(`error: ${e}`);
    ret["ret"]=`해당 날짜의 학생 TR 데이터를 저장하는 중 오류가 발생했습니다: ${e}`;
  }
  finally{
    await session.endSession();
    return res.json(ret);
  }
});


app.delete("/api/TR/:id", loginCheck, permissionCheck(Role("manager"),Role("admin")), async function (req, res) {
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

app.post("/api/DailyGoalCheckLog", loginCheck, permissionCheck(Role("manager"),Role("admin")), async (req,res)=>{
  let ret_val=true;
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
    const user_oid=req.session.passport.user.user_oid;
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

    const student_doc= await db.collection("StudentDB").findOne({"ID":studentLegacyID},{session});
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
        {
          $setOnInsert:{
            "textbookID":textbookID,
            "AOSID":AOSID,
            "AOSTextbookID":AOSTextbookID,
            "studentID":student_id,
            "studentName":studentName,
            "description":description,
            "date":date
          },
          $push:{
            "finishedStateList":finishedState,
            "excuseList":excuse,
            "checkedByList":user_oid,
          }
        },
        {"upsert":true,session}
    );

    //lecture assignment인 경우 해당 AssignmentOfStudent document의 finished 상태도 바꾸어준다
    if(AOSID){
      const finishedDate=finishedState?getCurrentKoreaDateYYYYMMDD():"";
      await db.collection("AssignmentOfStudent").updateOne({"_id":AOSID},{"$set":{"finished":finishedState,"finished_date":finishedDate}},{session});
    }

    await session.commitTransaction();
  }
  catch(error){
    await session.abortTransaction();
    console.log(`error ${error}`)
    ret_val=`error ${error}`;
  }
  finally{
    await session.endSession();
    return res.send(ret_val);
  }
})

app.post("/api/DailyGoalCheckLogByDateRange", loginCheck, permissionCheck(Role("manager"),Role("admin")), async (req,res)=>{
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

app.post("/api/Closemeeting/:date", loginCheck, permissionCheck(Role("manager"),Role("admin")), function (req, res) { // deprecated: 동시성 처리 불가 이슈
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

app.post("/api/SaveClosemeetingFeedback", loginCheck, permissionCheck(Role("manager"),Role("admin")), async function (req, res) {
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

app.get("/api/Closemeeting/:date", loginCheck, permissionCheck(Role("manager"),Role("admin")), function (req, res) {
  const paramDate = decodeURIComponent(req.params.date);
  db.collection("Closemeeting").findOne({ 날짜: paramDate }, function (err, result) {
    if (err) {
      return console.log("/api/Closemeeting/:date - findOne Error : ", err);
    }
    return res.json(result);
  });
});

app.put("/api/Closemeeting/:date", loginCheck, permissionCheck(Role("manager"),Role("admin")), function (req, res) {
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

app.delete("/api/Closemeeting/:id", loginCheck, permissionCheck(Role("manager"),Role("admin")), function (req, res) {
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

app.post("/api/Middlemeeting/:date", loginCheck, permissionCheck(Role("manager"),Role("admin")), function (req, res) {
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

app.get("/api/Middlemeeting/:date", loginCheck, permissionCheck(Role("manager"),Role("admin")), function (req, res) {
  const paramDate = decodeURIComponent(req.params.date);
  console.log(`${paramDate} 날짜 중간회의 조회 시도`);
  db.collection("Middlemeeting").findOne({ 날짜: paramDate }, function (err, result) {
    if (err) {
      return console.log("/api/Middlemeeting/find/:date - findOne Error : ", err);
    }
    return res.json(result);
  });
});

app.put("/api/Middlemeeting/:date", loginCheck, permissionCheck(Role("manager"),Role("admin")), function (req, res) {
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

app.delete("/api/Middlemeeting/:id", loginCheck, permissionCheck(Role("manager"),Role("admin")), function (req, res) {
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

app.get("/api/Todolist", loginCheck, permissionCheck(Role("manager"),Role("admin")), function (req, res) {
  db.collection("Todolist")
      .find()
      .toArray((err, result) => {
        if (err) {
          return console.log("api/Todolist - find Error : ", err);
        }
        res.send(result[0]["Todolist"]);
      });
});

app.put("/api/Todolist", loginCheck, permissionCheck(Role("manager"),Role("admin")), function (req, res) {
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

app.get("/api/Textbook", loginCheck, permissionCheck(Role("manager"),Role("admin")), async function (req, res) {
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

app.put("/api/Textbook", loginCheck, permissionCheck(Role("manager"),Role("admin")), function (req, res) {
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

app.post("/api/Textbook", loginCheck, permissionCheck(Role("manager"),Role("admin")), (req, res) => {
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

app.delete("/api/Textbook/:_id", loginCheck, permissionCheck(Role("manager"),Role("admin")), async (req, res) => {
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
app.get(`/api/TextbookInProgressOfStudent/:studentLegacyID`, loginCheck, permissionCheck(Role("manager"),Role("admin")), async(req,res)=>{
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
app.post("/api/getTextbookIDsByTextbookName", loginCheck, permissionCheck(Role("student"),Role("manager"),Role("admin")), async (req,res)=>{
  const nameData= req.body;
  let ret_val;
  let success;
  try{
    const nameList=Array.isArray(nameData['textbookNames'])?nameData["textbookNames"]:[];
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
app.get("/api/SavedDailyGoalCheckLogData/:studentLegacyID/:date", loginCheck, permissionCheck(Role("manager"),Role("admin")), async (req,res)=>{
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
app.get("/api/Lecture", loginCheck, permissionCheck(Role("manager"),Role("admin")), async (req, res) => {
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

app.post("/api/Lecture", loginCheck, permissionCheck(Role("manager"),Role("admin")), async (req, res) => {
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

app.get("/api/Lecture/:lectureid", loginCheck, permissionCheck(Role("manager"),Role("admin")), (req, res) => {
  const paramID = decodeURIComponent(req.params.lectureid);
  db.collection("Lecture").findOne({ lectureID: paramID }, (err, result) => {
    if (err) {
      return res.send(`/api/Lecture/${paramID} - findOne Error : ${err}`);
    }
    return res.json(result);
  });
});

app.put("/api/Lecture", loginCheck, permissionCheck(Role("manager"),Role("admin")), (req, res) => {
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

app.delete("/api/Lecture/:lectureid", loginCheck, permissionCheck(Role("manager"),Role("admin")), (req, res) => {
  const paramID = decodeURIComponent(req.params.lectureid);
  db.collection("Lecture").deleteOne({ lectureID: paramID }, (err, result) => {
    if (err) {
      return res.send(`/api/Lecture/${paramID} - deleteOne Error : ${err}`);
    }
    return res.send(true);
  });
});

app.post("/api/finishLecture",loginCheck, permissionCheck(Role("manager"),Role("admin")), async (req,res)=>{
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
app.get("/api/TextbookOfLecture/:lectureid", loginCheck, permissionCheck(Role("manager"),Role("admin")), async (req, res) => {
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

app.post("/api/TextbookOfLecture", loginCheck, permissionCheck(Role("manager"),Role("admin")), (req, res) => {
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

app.delete("/api/TextbookOfLecture/:lectureID/:textbookID", loginCheck, permissionCheck(Role("manager"),Role("admin")), async (req, res) => {
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
app.get("/api/StudentOfLecture", loginCheck, permissionCheck(Role("manager"),Role("admin")), (req, res) => {
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
app.get("/api/Assignment/:lectureid", loginCheck, permissionCheck(Role("manager"),Role("admin")), (req, res) => {
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

app.put("/api/Assignment", loginCheck, permissionCheck(Role("manager"),Role("admin")), (req, res) => {
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

app.post("/api/Assignment", loginCheck, permissionCheck(Role("manager"),Role("admin")), async (req, res) => {
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
    const lecture_doc= await db.collection("Lecture").findOne({_id:lect_id},{session}); // to check if there is such lecture document in mongodb
    const textbook_doc= await db.collection("TextBook").findOne({_id:textbook_id},{session}); // to check if there is such textbook document in mongodb
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


app.delete("/api/Assignment/:AssignID", loginCheck, permissionCheck(Role("manager"),Role("admin")), async (req,res)=>{
  const assignment=decodeURIComponent(req.params.AssignID);
  // console.log("assignment id:"+JSON.stringify(assignment));
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
app.get("/api/LectureAssignment/:lectureid",loginCheck, permissionCheck(Role("manager"),Role("admin")), async (req,res)=>{
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
app.post(`/api/AssignmentOfStudent/`, loginCheck, permissionCheck(Role("manager"),Role("admin")), async (req,res)=>{
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
app.get("/api/StudentOfLecture/:lectureID", loginCheck, permissionCheck(Role("manager"),Role("admin")), (req, res) => {
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

app.post("/api/StudentOfLecture", loginCheck, permissionCheck(Role("manager"),Role("admin")), (req, res) => {
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

app.delete("/api/StudentOfLecture/:lectureID/:studentID", loginCheck, permissionCheck(Role("manager"),Role("admin")), async (req,res)=>{
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
    const target_assignment_ids= await db.collection('Assignment').find({lectureID:target_lecture["_id"]},{session}).toArray();
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
app.get("/api/TRnow", loginCheck, permissionCheck(Role("manager"),Role("admin")), (req, res) => {
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
app.post("/api/Weeklymeeting/:date", loginCheck, permissionCheck(Role("manager"),Role("admin")), (req, res) => {
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

app.get("/api/Weeklymeeting/:date", loginCheck, permissionCheck(Role("manager"),Role("admin")), (req, res) => {
  const paramDate = decodeURIComponent(req.params.date);
  db.collection("Weeklymeeting").findOne({ 회의일: paramDate }, (err, result) => {
    if (err) {
      return res.send(`/api/Weeklymeeting/${paramDate} - findOne Error : ${err}`);
    }
    return res.json(result);
  });
});

app.put("/api/Weeklymeeting/:date", loginCheck, permissionCheck(Role("manager"),Role("admin")), (req, res) => {
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

app.delete("/api/Weeklymeeting/:date", loginCheck, permissionCheck(Role("manager"),Role("admin")), (req, res) => {
  const paramDate = decodeURIComponent(req.params.date);
  db.collection("Weeklymeeting").deleteOne({ 회의일: paramDate }, (err, result) => {
    if (err) {
      return res.send(`/api/Weeklymeeting/${paramDate} - deleteOne Error : ${err}`);
    }
    return res.send(true);
  });
});

// Weeklystudyfeedback 관련 코드
app.post("/api/Weeklystudyfeedback/:ID/:feedbackDate", loginCheck, permissionCheck(Role("manager"),Role("admin")), (req, res) => {
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

app.get("/api/Weeklystudyfeedback/:ID/:feedbackDate", loginCheck, permissionCheck(Role("manager"),Role("admin")), (req, res) => {
  const paramDate = decodeURIComponent(req.params.feedbackDate);
  const ID = decodeURIComponent(req.params.ID);
  db.collection("WeeklyStudyfeedback").findOne({ 학생ID: ID, 피드백일: paramDate }, (err, result) => {
    if (err) {
      return res.send(`/api/Weeklystudyfeedback/${ID}/${paramDate} - findOne Error : ${err}`);
    }
    return res.json(result);
  });
});

app.put("/api/Weeklystudyfeedback/:ID/:feedbackDate", loginCheck, permissionCheck(Role("manager"),Role("admin")), (req, res) => {
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

app.delete("/api/Weeklystudyfeedback/:ID/:feedbackDate", loginCheck, permissionCheck(Role("manager"),Role("admin")), (req, res) => {
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

app.post("/api/ThisWeekAssignment/", loginCheck, permissionCheck(Role("manager"),Role("admin")), async (req,res)=>{
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

app.post("/api/StudentTodayAssignment/", loginCheck, permissionCheck(Role("manager"),Role("admin")), async (req,res)=>{
  const request_arguments=req.body;
  if(!("studentID" in request_arguments) || !("today_date" in request_arguments)){
    return res.json([]);
  }
  const student_legacy_id=request_arguments["studentID"];
  const today_date=request_arguments["today_date"];
  // console.log(today_date);
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

function userTypeQueryValid(userType,queryAllUserType,username){
  if(!userType) return queryAllUserType || ((typeof username)==="string" && username);
  else return roles.RoleNameValidCheck(userType);
}

const items_per_page=parseInt(process.env.SHOWN_MANAGED_USER_PER_PAGE);
const alarm_items_per_page=parseInt(process.env.SHOWN_ALARM_PER_PAGE);

// get status of user accounts
app.post("/api/searchUserAccountApprovedStatus", loginCheck, permissionCheck(Role("admin")), async (req,res)=>{
  const ret_val={"success":true,"ret":null};
  try{
    ret_val["ret"]={
      pagination:{
        cur_page:1,
        total_page_num:1,
        status_data:[],
        pageInvalid:false,
      },
    };
    let {
      approvedStatus: approved_status,
      suspendedStatus: suspended_status,
      userType:user_type_string,
      queryAllUserType:query_all_user_type,
      username,
      queryPage,
    }= req.body;
    if(!userTypeQueryValid(user_type_string,query_all_user_type,username) || !Number.isInteger(queryPage) || queryPage<1) throw new Error(`invalid query`);
    approved_status=!!approved_status;
    suspended_status=!!suspended_status;
    const user_type_index=roles.roleNameToIndex[user_type_string];    
    const first_match_stage={
      $match:{
        approved:approved_status
      }
    }
    if(username) first_match_stage["$match"]["username"]=username;
    if(suspended_status===true) first_match_stage["$match"]["suspended"]=true;
    
    const second_match_stage={
      $match:{
        // "RoleOfUser_aggregate.activated":approved_status,
        "RoleOfUser_aggregate.activated":!approved_status?false:!suspended_status,
      }
    };
    if(!query_all_user_type && !username) second_match_stage["$match"]["Role_aggregate.role_index"]=user_type_index;

    const third_match_stage={
      $match:{
        "$or":[
          {"GroupOfUser_aggregate.activated":{"$exists":false}},
          // {"GroupOfUser_aggregate.activated":approved_status,}
          {"GroupOfUser_aggregate.activated":!approved_status?false:!suspended_status}
        ],
      }
    };

    let sort_criterion;
    if(!approved_status){
      sort_criterion={
        signUpDate:-1,approvedDate:-1,
      };
    }
    else{
      sort_criterion={
        suspendedChangeDate:-1,signUpDate:-1,
      };
    }

    const result_data= (await db.collection("User").aggregate([
      first_match_stage,
      {
        $lookup: {
          from: "RoleOfUser",
          localField: "_id",
          foreignField: "user_id",
          as: "RoleOfUser_aggregate",
        },
      },
      { 
        $unwind: {
          path:"$RoleOfUser_aggregate",
        }
      },
      {
        $lookup: {
          from: "Role",
          localField: "RoleOfUser_aggregate.role_id",
          foreignField: "_id",
          as: "Role_aggregate",
        },
      },
      { 
        $unwind: {
          path:"$Role_aggregate",
        }
      },
      second_match_stage,
      {
        $lookup: {
          from: "GroupOfUser",
          localField: "_id",
          foreignField: "user_id",
          as: "GroupOfUser_aggregate",
        },
      },
      { 
        $unwind: {
          path:"$GroupOfUser_aggregate",
          preserveNullAndEmptyArrays:true,
        }
      },
      third_match_stage,
      {
        $lookup: {
          from: "Group",
          localField: "GroupOfUser_aggregate.group_id",
          foreignField: "_id",
          as: "Group_aggregate",
        },
      },
      { 
        $unwind: {
          path:"$Group_aggregate",
          preserveNullAndEmptyArrays:true,
        }
      },
      {
        $group: {
          _id: {_id: "$_id"},
          username: {"$first": "$username"},
          nickname: {"$first": "$nickname"},
          userType: {"$first": "$Role_aggregate.role_name"},
          signUpDate: {"$first": "$create_date"},
          approvedDate: {"$first": "$approved_date"},
          suspendedChangeDate: {"$first": "$suspended_change_date"},
          groupOfUser: {"$push":{group_name:"$Group_aggregate.group_name"}},
          approved: {"$first": "$approved"},
          suspended: {"$first": "$suspended"},
        }
      },
      // {
      //   $project: {
      //     _id:0,
      //     username: "$username",
      //     nickname: "$nickname",
      //     userType: "$Role_aggregate.role_name",
      //     signUpDate: "$create_date",
      //     approved: 1,
      //   },
      // },
      {
        $facet:{
          metadata:[{$count:"total_items_num"}],
          data:[{$sort:sort_criterion},{$skip:items_per_page*(queryPage-1)},{$limit:items_per_page}]
        }
      }
    ]).toArray())[0];
    if(result_data.metadata.length===0) return; // no matching data
    const item_count=(result_data.metadata)[0].total_items_num;
    const total_page_num= Math.ceil(item_count/items_per_page);
    ret_val["ret"]["pagination"]["cur_page"]=queryPage;
    ret_val["ret"]["pagination"]["total_page_num"]=total_page_num;
    ret_val["ret"]["pagination"]["status_data"]=result_data.data;
    if(result_data.metadata.total_items_num>1 && result_data.data.length===0){
      ret_val["ret"]["pagination"]["pageInvalid"]=true;
    }
  }
  catch(error){
    console.log(`error: ${error}`);
    ret_val["success"]=false;
    ret_val["ret"]= `네트워크 오류로 데이터를 불러오지 못했습니다`;
  }
  finally{
    return res.json(ret_val);
  }
});

function changeApprovedStatusQueryTypeValid(status_value,userType,relatedDocumentID){
  if(typeof status_value!=='boolean') return false;
  else if(typeof userType!=='string' || !roles.RoleNameValidCheck(userType)) return false;
  else if(relatedDocumentID && typeof relatedDocumentID!=='string' && !(new ObjectId(relatedDocumentID))) return false;
  else return true;
}

async function changeApprovedStatusQueryRelatedDocumentValid(userType,relatedDocumentID,session){
  if(!relatedDocumentID) return true;
  else if(userType==="student"){
    const related_doc=await db.collection('StudentDB').findOne({_id:relatedDocumentID},{session});
    return !!related_doc;
  }
  else return false;
}

async function setUserInfoOfRelatedDocument(userType,relatedDocumentID,user_id,rou_id,session){
  if(userType==="student"){
    await db.collection("StudentDB").updateOne(
      {_id:new ObjectId(relatedDocumentID)},
      {$set:{user_id,rou_id}},
      {session});
  }
}

//this server endpoint used only when user account is approved
app.post("/api/changeUserAccountApprovedStatus",loginCheck, permissionCheck(Role("admin")), async (req,res)=>{
  const ret_val={"success":true,"ret":null};
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
    ret_val["ret"]={
      value:null,
      late:false,
    };
    let {
      value:status_value,
      userType:user_type_string,
      username,
      relatedDocumentID:related_document_id,
    }= req.body;

    const user_oid=req.session.passport.user.user_oid;
    const current_date=getCurrentDate();

    if(!changeApprovedStatusQueryTypeValid(status_value,user_type_string,related_document_id)
      || !changeApprovedStatusQueryRelatedDocumentValid(user_type_string,related_document_id)) throw new Error(`invalid query`);
    const user_type_index=roles.roleNameToIndex[user_type_string];
    status_value=!!status_value;
    if(!status_value) throw new Error(`invalid request:0`);

    const result_data= await db.collection("User").aggregate([
      {
        $match:{
          username:username
        }
      },
      {
        $lookup: {
          from: "RoleOfUser",
          localField: "_id",
          foreignField: "user_id",
          as: "RoleOfUser_aggregate",
        },
      },
      { 
        $unwind: {
          path:"$RoleOfUser_aggregate",
        }
      },
      {
        $lookup: {
          from: "Role",
          localField: "RoleOfUser_aggregate.role_id",
          foreignField: "_id",
          as: "Role_aggregate",
        },
      },
      { 
        $unwind: {
          path:"$Role_aggregate",
        }
      },
      {
        $match:{
          "Role_aggregate.role_index":user_type_index,
        }
      },
      {
        $lookup: {
          from: "GroupOfUser",
          localField: "_id",
          foreignField: "user_id",
          as: "GroupOfUser_aggregate",
        },
      },
      {
        $project: {
          user_id:"$_id",
          username: "$username",
          user_approved: "$approved",
          role_index: "$Role_aggregate.role_index",
          role_of_user_id: "$RoleOfUser_aggregate._id",
          role_of_user_activated: "$RoleOfUser_aggregate.activated",
          group_of_user_list: "$GroupOfUser_aggregate"
        },
      },
    ],{session}).toArray();
    if(result_data.length!==1) throw new Error('invalid request');
    const current_status=result_data[0];
    // if(current_status.user_approved===status_value && current_status.role_of_user_activated===status_value){
    //   ret_val["ret"]["value"]=status_value;
    //   ret_val["ret"]["late"]=true;
    //   return;
    // }
    // else if(current_status.user_approved===status_value || current_status.role_of_user_activated===status_value){
    //   throw new Error(`DB inconsistency error`);
    // }
    if(current_status.user_approved===true && current_status.role_of_user_activated===true){
      ret_val.ret.value=true;
      ret_val.ret.late=true;
      return;
    }

    await db.collection('RoleOfUserLog').insertOne(
      {
        role_of_user_id:current_status.role_of_user_id,
        role_index:current_status.role_index,
        // info_modified_date:cur_time,
        // triggered_by:approving_admin_id,
        info_modified_date:current_date,
        triggered_by:user_oid,
        activated:true,
      },
      {session}
    );

    await db.collection("RoleOfUser").updateOne(
      {_id:current_status.role_of_user_id},
      {$set:{
        // activated:status_value,
        // modify_date:cur_time,
        // modified_by:approving_admin_id,
        activated:true,
        modify_date:current_date,
        modified_by:user_oid,
      }},
      {session}
    );

    await db.collection("User").updateOne(
      {_id:current_status.user_id},
      {$set:{
        // approved:status_value,
        // approved_by:approving_admin_id,
        // approved_date:cur_time,
        approved:true,
        approved_by:user_oid,
        approved_date:current_date,
        suspended_change_date:current_date,
      }},
      {session}
    );

    const group_of_user_list=current_status.group_of_user_list;
    if(group_of_user_list.length>0){
      const group_of_user_logs=group_of_user_list.map((group_of_user,idx)=>{
        return {
          group_of_user_id:group_of_user._id,
          // info_modified_date:cur_time,
          // triggered_by:approving_admin_id,
          info_modified_date:current_date,
          triggered_by:user_oid,
          activated:true,
        };
      });
      const group_of_user_id_list=group_of_user_list.map((group_of_user,idx)=>group_of_user._id);
      const updated_fields={
        activated:true,
        // modify_date:cur_time,
        // modified_by:approving_admin_id,
        modify_date:current_date,
        modified_by:user_oid,
      };
      await db.collection("GroupOfUserLog").insertMany(group_of_user_logs,{ordered:true,session});
      await db.collection("GroupOfUser").updateMany({_id:{"$in":group_of_user_id_list}},{"$set":updated_fields},{session});
    }

    if(related_document_id){
      await setUserInfoOfRelatedDocument(user_type_string,related_document_id,current_status.user_id,current_status.role_of_user_id,session);
    }

    await session.commitTransaction();
  }
  catch(error){
    await session.abortTransaction();
    ret_val["success"]=false;
    ret_val["ret"]= `네트워크 오류로 작업을 완료하지 못했습니다`;
  }
  finally{
    await session.endSession();
    return res.json(ret_val);
  }
});

//only approved users suspended status can be chagned between suspended & not-suspended
app.post("/api/changeUserAccountSuspendedStatus",loginCheck, permissionCheck(Role("admin")), async (req,res)=>{
  const ret_val={"success":true,"ret":null};
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
    ret_val["ret"]={
      value:null,
      late:false,
    };
    let {
      username,
      suspend,
    }= req.body;
    suspend=!!suspend;

    const user_oid=req.session.passport.user.user_oid;
    const current_date=getCurrentDate();

    const user_doc= (await db.collection("User").aggregate([
      {
        $match:{
          username,
        }
      },
      {
        $lookup: {
          from: "RoleOfUser",
          localField: "_id",
          foreignField: "user_id",
          as: "RoleOfUser_aggregate",
        },
      },
      { 
        $unwind: {
          path:"$RoleOfUser_aggregate",
        }
      },
      {
        $lookup: {
          from: "Role",
          localField: "RoleOfUser_aggregate.role_id",
          foreignField: "_id",
          as: "Role_aggregate",
        },
      },
      { 
        $unwind: {
          path:"$Role_aggregate",
        }
      },
      {
        $lookup: {
          from: "GroupOfUser",
          localField: "_id",
          foreignField: "user_id",
          as: "GroupOfUser_aggregate",
        },
      },
      {
        $project: {
          user_id:"$_id",
          username: "$username",
          user_approved: "$approved",
          user_suspended: "$suspended",
          role_index: "$Role_aggregate.role_index",
          rou_id: "$RoleOfUser_aggregate._id",
          rou_activated: "$RoleOfUser_aggregate.activated",
          group_of_user_list: "$GroupOfUser_aggregate",
        },
      },
    ],{session}).toArray())[0];
    if(!user_doc){
      ret_val.ret.late=true;
      return;
    }
    else if(!user_doc.user_approved) throw new Error(`invalid request:2`);
    else if(user_doc.role_index===roles.roleNameToIndex["admin"]) throw new Error(`invalid request:3`);
    else if(user_doc.user_suspended===suspend){
      ret_val.ret.late=true;
      return;
    }
    const role_index=user_doc.role_index;
    const rou_id=user_doc.rou_id;

    await db.collection('RoleOfUserLog').insertOne(
      {
        // role_of_user_id:current_status.role_of_user_id,
        // role_index:current_status.role_index,
        // info_modified_date:cur_time,
        // triggered_by:approving_admin_id,

        role_of_user_id:rou_id,
        role_index:role_index,
        info_modified_date:current_date,
        activated:!suspend,
      },
      {session}
    );

    await db.collection("RoleOfUser").updateOne(
      // {_id:current_status.role_of_user_id},
      {_id:rou_id},
      {$set:{
        // activated:status_value,
        // modify_date:cur_time,
        // modified_by:approving_admin_id,

        activated:!suspend,
        modify_date:current_date,
        modified_by:user_oid,
      }},
      {session}
    );

    await db.collection("User").updateOne(
      // {_id:current_status.user_id},
      {_id:user_doc._id},
      {$set:{
        // approved:status_value,
        // approved_by:approving_admin_id,
        // approved_date:cur_time,

        suspended:suspend,
        suspended_change_date:current_date,
        suspended_by:user_oid,
      }},
      {session}
    );

    const group_of_user_list=user_doc.group_of_user_list;
    if(group_of_user_list.length>0){
      const group_of_user_logs=group_of_user_list.map((group_of_user,idx)=>{
        return {
          group_of_user_id:group_of_user._id,
          // info_modified_date:cur_time,
          // triggered_by:approving_admin_id,

          info_modified_date:current_date,
          triggered_by:user_oid,
          activated:!suspend,
        };
      });
      const group_of_user_id_list=group_of_user_list.map((group_of_user,idx)=>group_of_user._id);
      const updated_fields={
        // activated:true,
        // modify_date:cur_time,
        // modified_by:approving_admin_id,

        activated:!suspend,
        modify_date:current_date,
        modified_by:user_oid,
      };
      await db.collection("GroupOfUserLog").insertMany(group_of_user_logs,{ordered:true,session});
      await db.collection("GroupOfUser").updateMany({_id:{"$in":group_of_user_id_list}},{"$set":updated_fields},{session});
    }

    //lastly, delete all currently logined suspended users' sessions if user now being suspended
    if(suspend){
      const session_username_path="session.passport.user.username";
      const session_filter={};
      session_filter[session_username_path]=username;
      await db.collection(process.env.SESSION_COLLECTION_NAME).deleteMany(session_filter,{session});
    }

    await session.commitTransaction();
  }
  catch(error){
    await session.abortTransaction();
    ret_val["success"]=false;
    ret_val["ret"]= `네트워크 오류로 작업을 완료하지 못했습니다`;
  }
  finally{
    await session.endSession();
    return res.json(ret_val);
  }
});

app.post("/api/deleteWaitingUser",loginCheck, permissionCheck(Role("admin")), async (req,res)=>{
  const ret_val={"success":true,"ret":null};
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
    ret_val["ret"]={
      value:null,
      late:false,
    };
    let {
      username,
    }= req.body;

    const waiting_user_doc= (await db.collection("User").aggregate([
      {
        $match:{
          username:username
        }
      },
      {
        $lookup: {
          from: "RoleOfUser",
          localField: "_id",
          foreignField: "user_id",
          as: "RoleOfUser_aggregate",
        },
      },
      { 
        $unwind: {
          path:"$RoleOfUser_aggregate",
        }
      },
      {
        $lookup: {
          from: "GroupOfUser",
          localField: "_id",
          foreignField: "user_id",
          as: "GroupOfUser_aggregate",
        },
      },
      { 
        $unwind: {
          path:"$GroupOfUser_aggregate",
        }
      },
      {
        $project: {
          user_id:"$_id",
          user_approved:"$approved",
          rou_id:"$RoleOfUser_aggregate._id",
          rou_activated:"$RoleOfUser_aggregate.activated",
          gou_id:"$GroupOfUser_aggregate._id",
          gou_activated:"$RoleOfUser_aggregate.activated",
        },
      },
    ],{session}).toArray())[0];
    if(!waiting_user_doc) {
      ret_val.ret.late=true;
      return;
    }
    else if(waiting_user_doc.user_approved || waiting_user_doc.rou_activated || waiting_user_doc.gou_activated) throw new Error(`invalid request:2`);
    
    await db.collection(`GroupOfUser`).deleteOne({_id:waiting_user_doc.gou_id},{session});
    await db.collection(`RoleOfUser`).deleteOne({_id:waiting_user_doc.rou_id},{session});
    await db.collection(`User`).deleteOne({_id:waiting_user_doc.user_id},{session});

    await session.commitTransaction();
  }
  catch(error){
    await session.abortTransaction();
    ret_val["success"]=false;
    ret_val["ret"]= `네트워크 오류로 작업을 완료하지 못했습니다`;
  }
  finally{
    await session.endSession();
    return res.json(ret_val);
  }
});

// stickynote 관련 코드

app.get("/api/stickynote", loginCheck, permissionCheck(Role("manager"),Role("admin")), (req, res) => {
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

app.post("/api/stickynote", loginCheck, permissionCheck(Role("manager"),Role("admin")), function (req, res) {
  const newStickynote = req.body;
  // console.log(req.body);
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

app.put("/api/stickynote/:id", loginCheck, permissionCheck(Role("manager"),Role("admin")), (req, res) => {
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

app.delete("/api/stickynote/:id", loginCheck, permissionCheck(Role("manager"),Role("admin")), (req, res) => {
  let findID;
  try {
    findID = new ObjectId(req.params.id);
  } catch (err) {
    return res.send(`invalid access`);
  }
  // console.log(findID);
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