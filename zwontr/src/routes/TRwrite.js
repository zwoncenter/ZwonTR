import "./TRWriteEdit.scss";
import { Form, Button, Card, ListGroup, Table, Modal, Row, Col, Accordion, OverlayTrigger, Popover } from "react-bootstrap";
import { useHistory, useParams } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect, useRef } from "react";
import {FaCheck, FaSistrix, FaTrash, FaTimes} from "react-icons/fa"
import axios from "axios";
import TimePicker from "react-time-picker";
// import { FaPencilAlt, FaTrash, FaCheck, FaUndo } from "react-icons/fa";
// import { CgMailForward } from "react-icons/cg";
import { BsFillChatSquareFill } from "react-icons/bs";

function TRwrite() {
  // 공통 code
  let history = useHistory();
  let paramID = useParams()["ID"];

  // 당일학습목표 관련 코드
  const [todayGoal, settodayGoal] = useState([]);
  function getThisWeek(inputDate) {
    var inputDate = new Date(inputDate);
    inputDate.setHours(0, 0, 0, 0);
    var day = inputDate.getDay();
    var diff = inputDate.getDate() - day + (day == 0 ? -6 : 1);
    inputDate = new Date(inputDate.setDate(diff));
    var startdate = new Date(inputDate.setDate(inputDate.getDate()));
    var enddate = new Date(inputDate.setDate(inputDate.getDate() + 7));
    return [startdate, enddate];
  }
  function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + (d.getDate()-1),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}

  // 날짜 관련 코드
  function getCurrentKoreaDateYYYYMMDD(){ // get current server date in yyyy-mm-dd format
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
  const now = new Date(); // 현재 시간
  const utcNow = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const koreaTimeDiff = 9 * 60 * 60 * 1000;
  const koreaNow = new Date(utcNow + koreaTimeDiff);
  // const today = koreaNow.toISOString().split("T")[0];
  const today = getCurrentKoreaDateYYYYMMDD();

  const [managerList, setmanagerList] = useState([]);

  const [stuDB, setstuDB] = useState({
    ID: "",
    이름: "",
    생년월일: "",
    연락처: "",
    프로그램시작일: "",
    부연락처: "",
    모연락처: "",
    주소: "",
    혈액형: "",
    최종학력: "",

    부직업: "",
    모직업: "",
    학생과더친한분: "",
    학생과사이가더나쁜분: "",
    형제자매및관계: "",
    조부모와의관계: "",
    재산: "",
    부모성향_부: "",
    부모성향_모: "",
    부모감정_부: "",
    부모감정_모: "",
    부모수용수준_부: "",
    부모수용수준_모: "",
    부모님고민_생활: "",
    부모님고민_목표및동기: "",
    부모님고민_학습: "",
    부모님고민_인성: "",
    부모님고민_현재폰기종: "",
    부모님고민_현재1주용돈: "",
    부모님고민_불법행위여부: "",

    키: "",
    몸무게: "",
    체지방률: "",
    BMI: "",
    운동량: "",
    평균수면시간: "",
    식습관: "",
    정신건강: "",
    과거병력: "",

    연인: "",
    친구: "",
    친구들_성향: "",
    매니저와의_관계: "",
    가장_친한_매니저: "",
    센터내_가장_친한_학생: "",

    MBTI: "",
    애니어그램: "",
    별자리: "",
    IQ: "",

    히스토리: [],

    작성매니저: "",
    작성일자: "",
    이름: "",
    생년월일: "",
    연락처: "",
    생활학습목표: {
      평일취침: "00:00",
      평일기상: "08:00",
      평일등원: "10:00",
      평일귀가: "19:00",
      평일학습: 0,
      일요일취침: "00:00",
      일요일기상: "08:00",
      일요일등원: "10:00",
      일요일귀가: "19:00",
      일요일학습: 0,
    },
    큐브책: [],

    매니징목표: [],
    약속구조: [],
    용돈구조: [],
    매니징방법: [],

    진행중교재: [],
    완료된교재: [],
    프로그램분류: ["자기인식", "진로탐색", "헬스", "외부활동", "독서", "외국어"],

    수강중강의: [],
  });
  const [cuberaito, setCuberatio] = useState(0);
  const [failCnt, setFailCnt] = useState(0);
  const [TR, setTR] = useState({
    ID: paramID,
    이름: paramID.split("_")[0],
    // 날짜: new Date().toISOString().split("T")[0],
    날짜: today,
    TR작성여부: false,
    요일: "",
    작성매니저: "",

    결석여부: false,
    결석사유: "",
    결석상세내용: "",

    신체컨디션: "",
    정서컨디션: "",

    목표취침: "",
    실제취침: "",
    목표기상: "",
    실제기상: "",
    목표등원: "",
    실제등원: "",
    목표귀가: "",
    실제귀가: "",
    목표학습: "",
    실제학습: 0,

    취침차이: 0,
    기상차이: 0,
    등원차이: 0,
    귀가차이: 0,
    학습차이: 0,
    밤샘여부: false,

    학습: [],
    강의과제학습: {}, // 강의 과제 학습 시간 기록

    // 문제행동: [
    //   { 분류: "자해", 문제여부: false },
    //   { 분류: "자기비하", 문제여부: false },
    //   { 분류: "감정기복", 문제여부: false },
    //   { 분류: "메타인지 부족", 문제여부: false },
    //   { 분류: "중도포기 / 탈주", 문제여부: false },
    //   { 분류: "TR작성 미흡", 문제여부: false },
    //   { 분류: "불법행위", 문제여부: false },
    //   { 분류: "거짓말/핑계/변명", 문제여부: false },
    //   { 분류: "위생문제", 문제여부: false },
    //   { 분류: "지각", 문제여부: false },
    //   { 분류: "괴롭힘/싸움", 문제여부: false },
    //   { 분류: "부모님께 무례", 문제여부: false },
    //   { 분류: "연락무시/잠수", 문제여부: false },
    //   { 분류: "자리정리 안함", 문제여부: false },
    // ],

    프로그램시간: 0,

    센터내시간: 0,
    센터활용률: 0,
    센터학습활용률: 0,

    프로그램: [],
    중간매니저: "",
    중간피드백: "",
    매니저피드백: "",
    큐브책: [],
  });

  // 수강중강의 관련 코드
  const [lectureList, setlectureList] = useState([]);
  const [lecturemodalshow, setlecturemodalshow] = useState(false);
  const lecturemodalOpen = () => setlecturemodalshow(true);
  const lecturemodalClose = () => setlecturemodalshow(false);

  const updatelecture = async (newlecture) => {
    const existlecture = await axios
      .get(`/api/Lecture/${newlecture["lectureID"]}`)
      .then((result) => {
        if (result.data === "로그인필요") {
          window.alert("로그인이 필요합니다.");
          return window.push("/");
        }
        return result["data"];
      })
      .catch((err) => {
        return window.alert(err);
      });
    if (existlecture["version"] !== newlecture["version"]) {
      window.alert("강의가 업데이트 되었습니다. 다시 시도해주세요.");
      const newlectureList = [];
      for (let lectureID of stuDB["수강중강의"]) {
        let newlecture = await axios
          .get(`/api/Lecture/${lectureID}`)
          .then((result) => {
            if (result.data === "로그인필요") {
              window.alert("로그인이 필요합니다.");
              return window.push("/");
            }
            return result["data"];
          })
          .catch((err) => {
            return window.alert(err);
          });
        newlectureList.push(newlecture);
      }
      setlectureList(newlectureList);
      return;
    }
    newlecture["lastrevise"] = today;
    newlecture["version"] += 1;
    axios
      .put(`/api/Lecture`, newlecture)
      .then(function (result) {
        if (result.data === "로그인필요") {
          window.alert("로그인이 필요합니다.");
        }
      })
      .catch(function (err) {
        window.alert("저장에 실패했습니다. 개발/데이터 팀에게 문의해주세요", err);
      });
  };

  function 입력확인() {
    if (!TR.날짜) {
      window.alert("일간하루 날짜가 입력되지 않았습니다.");
      return false;
    }
    if (!TR.중간매니저 && !TR.작성매니저) {
      window.alert("중간 혹은 귀가 작성매니저 중 하나는 선택되어야합니다.");
      return false;
    }
    if (TR.중간피드백 && !TR.중간매니저) {
      window.alert("중간피드백 작성매니저가 선택되지 않았습니다.");
      return false;
    }
    if (TR.매니저피드백 && !TR.작성매니저) {
      window.alert("귀가피드백 작성매니저가 선택되지 않았습니다.");
      return false;
    }

    if (TR.결석여부 !== false) {
      if (TR.결석여부 === true && TR.결석사유.length === 0) {
        window.alert("미등원 사유가 선택되지 않았습니다.");
        return false;
      }
      return true;
    }

    if (TR.작성매니저 && !TR.신체컨디션) {
      window.alert("신체컨디션이 선택되지 않았습니다.");
      return false;
    }

    if (TR.작성매니저 && !TR.정서컨디션) {
      window.alert("정서컨디션이 선택되지 않았습니다.");
      return false;
    }

    if (TR.작성매니저 && TR.학습) {
      let validStudyCount=0;
      for (let i = 0; i < TR.학습.length; i++) {
        if(checkTextBookOfAssignment(TR.학습[i].교재)) continue;
        validStudyCount++;
        if (TR.학습[i].과목 == "선택") {
          // window.alert(`${i + 1}번째 학습의 과목이 선택되지 않았습니다.`);
          window.alert(`${validStudyCount}번째 학습의 과목이 선택되지 않았습니다.`);
          return false;
        }
        if (TR.학습[i].교재 == "선택") {
          // window.alert(`${i + 1}번째 학습의 교재가 선택되지 않았습니다.`);
          window.alert(`${validStudyCount}번째 학습의 교재가 선택되지 않았습니다.`);
          return false;
        }
        if (!TR.학습[i].학습시간 || TR.학습[i].학습시간 === "00:00") {
          // window.alert(
          //   `${
          //     i + 1
          //   }번째 학습의 학습시간이 입력되지 않았습니다. \n학습이 진행되지 않은 경우, 해당 항목을 삭제해주세요. \n귀가 매니저가 입력된 경우, 귀가검사를 진행한 것으로 파악하고 학습시간을 입력하도록 강제해두었습니다. \n중간 저장인 경우 귀가 매니저를 선택하지 않아야 경고문이 뜨지 않습니다`
          // );
          window.alert(
            `${
              validStudyCount
            }번째 학습의 학습시간이 입력되지 않았습니다. \n학습이 진행되지 않은 경우, 해당 항목을 삭제해주세요. \n귀가 매니저가 입력된 경우, 귀가검사를 진행한 것으로 파악하고 학습시간을 입력하도록 강제해두었습니다. \n중간 저장인 경우 귀가 매니저를 선택하지 않아야 경고문이 뜨지 않습니다`
          );
          return false;
        }
        // if (TR.학습[i].최근진도 >= parseInt(newstuDB["진행중교재"][i]["총교재량"].match(/\d+/))) {
        //   window.alert("")
        //   return false;
        // }
      }
    }
    if (isNaN(TR.실제학습)) {
      window.alert("학습 시간의 값이 NaN입니다. 수정 후 다시시도해 주세요.");
      return false;
    }

    if (isNaN(TR.프로그램시간)) {
      window.alert("프로그램 시간의 값이 NaN입니다. 수정 후 다시시도해 주세요.");
      return false;
    }

    if ("수강중강의" in stuDB) {
      for (let lecture of lectureList) {
        for (let assignID of lecture["students"][paramID]["진행중과제"]) {
          if (today === lecture["assignments"][assignID]["과제기한"]) {
            if (window.confirm(`${lecture["assignments"][assignID]["과제내용"]}(이)가 오늘까지 입니다. 저장을 진행하시겠습니까?`) === false) return false
          }
        }
      }
    }
    
    if (TR.작성매니저 && TR.매니저피드백.length < 40) {
      window.alert("귀가 피드백은 최소 40자 이상 입력되어야 합니다.")
      return false;
    }

    if(TR.작성매니저 && TR.매니저피드백){ // 마감피드백 저장 전에
      // 완료처리 하였으나 학습시간 입력 안한 강의과제 있는지 확인
      if(!checkStudyTimeOfFinishedLectureAssignment()){
        console.log("breakpoint");
        window.alert("완료 처리 되었으나 학습 시간이 입력되지 않은 강의 과제가 있습니다");
        return false;
      }
      // 오늘 강의과제, 진도교재 모두 확인 완료했는지 확인
      if(!(isLectureAssignmentChecked() && isTextbookAssignmentChecked())){
        window.alert("마감 피드백 작성 전 완료/사유작성 되지 않은 과제가 있습니다");
        return false;
      }
    }

    return true;
  }

  function 차이계산(목표, 실제, 종류) {
    if (!목표 || !실제) {
      return NaN;
    }
    let [목표시간, 목표분] = 목표.split(":");
    let [실제시간, 실제분] = 실제.split(":");
    let diff = parseInt(목표시간) - parseInt(실제시간) + (parseInt(목표분) - parseInt(실제분)) / 60;
    if (diff < -15) {
      diff += 24;
    } else if (diff > 15) {
      diff -= 24;
    }

    return Math.round(diff * 10) / 10;
  }

  function 차이출력(stayup, diff, 종류) {
    if (stayup == true && (종류 == "취침" || 종류 == "기상")) {
      return "밤샘";
    }

    if (diff < 0) {
      diff = -diff;
      return Math.round(diff * 10) / 10 + "시간 늦게 " + 종류;
    } else if (diff > 0) {
      return Math.round(diff * 10) / 10 + "시간 일찍 " + 종류;
    } else {
      return "정시 " + 종류;
    }
  }

  function change_depth_one(category, data) {
    const newTR = JSON.parse(JSON.stringify(TR));
    newTR[category] = data;
    setTR(newTR);
  }

  function change_depth_two(category1, category2, data) {
    const newTR = JSON.parse(JSON.stringify(TR));
    newTR[category1][category2] = data;
    setTR(newTR);
  }

  function change_depth_three(category1, category2, category3, data) {
    const newTR = JSON.parse(JSON.stringify(TR));
    newTR[category1][category2][category3] = data;
    setTR(newTR);
  }

  function delete_depth_one(category, index) {
    if (window.confirm("삭제하시겠습니까?")) {
      const newTR = JSON.parse(JSON.stringify(TR));
      newTR[category].splice(index, 1);
      setTR(newTR);
    }
  }

  function push_depth_one(category, content) {
    const newTR = JSON.parse(JSON.stringify(TR));
    newTR[category].push(content);
    setTR(newTR);
  }

  // Write code
  const isInitialMount = useRef(true);

  useEffect(async () => {
    const newstuDB = await axios
      .get(`/api/StudentDB/${paramID}`)
      .then((result) => {
        if (result.data === "로그인필요") {
          window.alert("로그인이 필요합니다.");
          return history.push("/");
        }
        return result["data"];
      })
      .catch((err) => {
        return err;
      });
    setstuDB(newstuDB);

    if ("수강중강의" in newstuDB) { //this is too slow: should be fixed later
      const newlectureList = [];
      for (let lectureID of newstuDB["수강중강의"]) {
        let newlecture = await axios
          .get(`/api/Lecture/${lectureID}`)
          .then((result) => {
            if (result.data === "로그인필요") {
              window.alert("로그인이 필요합니다.");
              return window.push("/");
            }
            return result["data"];
          })
          .catch((err) => {
            return window.alert(err);
          });
        newlectureList.push(newlecture);
      }
      setlectureList(newlectureList);
    }

    const newmanagerList = await axios
      .get("/api/managerList")
      .then((result) => {
        return result["data"];
      })
      .catch((err) => {
        return err;
      });
    setmanagerList(newmanagerList);

    const newTR = JSON.parse(JSON.stringify(TR));
    newstuDB.진행중교재.map(function (a, i) {
      newTR.학습.push({
        과목: a.과목,
        교재: a.교재,
        총교재량: a.총교재량,
        최근진도: a.최근진도, // 수정지점
        학습시간: "00:00",
      });
    });
    newstuDB.큐브책.map(function (a, i) {
      newTR.큐브책.push({
        구분: a.구분,
        할일: a.내용,
        완료여부: false,
      });
    });

    const date = new Date(newTR.날짜);

    const ls = ["일", "월", "화", "수", "목", "금", "토"];
    newTR["요일"] = ls[date.getDay()] + "요일";

    if (date.getDay() === 0) {
      newTR["목표취침"] = newstuDB.생활학습목표.일요일취침;
      newTR["실제취침"] = newstuDB.생활학습목표.일요일취침;
      newTR["목표기상"] = newstuDB.생활학습목표.일요일기상;
      newTR["실제기상"] = newstuDB.생활학습목표.일요일기상;
      newTR["목표등원"] = newstuDB.생활학습목표.일요일등원;
      newTR["실제등원"] = newstuDB.생활학습목표.일요일등원;
      newTR["목표귀가"] = newstuDB.생활학습목표.일요일귀가;
      newTR["실제귀가"] = newstuDB.생활학습목표.일요일귀가;
      newTR["목표학습"] = newstuDB.생활학습목표.일요일학습;
    } else {
      newTR["목표취침"] = newstuDB.생활학습목표.평일취침;
      newTR["실제취침"] = newstuDB.생활학습목표.평일취침;
      newTR["목표기상"] = newstuDB.생활학습목표.평일기상;
      newTR["실제기상"] = newstuDB.생활학습목표.평일기상;
      newTR["목표등원"] = newstuDB.생활학습목표.평일등원;
      newTR["실제등원"] = newstuDB.생활학습목표.평일등원;
      newTR["목표귀가"] = newstuDB.생활학습목표.평일귀가;
      newTR["실제귀가"] = newstuDB.생활학습목표.평일귀가;
      newTR["목표학습"] = newstuDB.생활학습목표.평일학습;
    }

    ["취침", "기상", "등원", "귀가"].forEach((a) => {
      newTR[`${a}차이`] = 차이계산(newTR[`목표${a}`], newTR[`실제${a}`]);
    });

    await setTR(newTR);

    isInitialMount.current = false;
  }, []);

  //교재 이름과 db _id를 매핑해주는 코드
  const [textbookIDMapping,setTextbookIDMapping]= useState({}); //교재 이름과 db _id를 매핑해주는 dictionary
  function checkTextbookIsValid(textbookName){
    return textbookIDMapping[textbookName]?true:false;
  }
  useEffect(async ()=>{
    const nameToIDArray= await axios.get(`/api/TextbookInProgressOfStudent/${paramID}`)
      .then((result) => {
        if (result.data === "로그인필요") {
          window.alert("로그인이 필요합니다.");
          return window.push("/");
        } else if (result["data"] !== null) {
          if(result["data"]["success"])
            return result["data"]["ret"];
          else{
            console.log("error: "+result["data"]["ret"]);
            return [];
          }
        }
        else{
          return [];
        }
      })
      .catch((err) => {
        console.log(err);
      });
    const nameToIDMapping= {};
    nameToIDArray.forEach((e,idx)=>{
      nameToIDMapping[e["교재"]]=e["_id"];
    });
    // console.log("data fnc:"+JSON.stringify(nameToIDArray));
    setTextbookIDMapping(nameToIDMapping);
    // console.log("name id mapping:"+JSON.stringify(nameToIDMapping));
  },[]);

  //과제 완료 여부 관련 코드
  const dailyGoalCheckLogDataTemplate={
    "textbookID":"",
    "AOSID":"",
    "AOSTextbookID":"",
    "studentLegacyID":paramID,
    "date":TR.날짜,
    "finishedState":"",
    "excuse":"",
    "description":""
  };

  //강의 과제 관련 코드
  const [thisWeekAssignments, setThisWeekAssignments] = useState([]);

  function processThisWeekAssignmentData(thisWeekAssignmentData){ //post request로 받아온 데이터 전처리
    const ret=JSON.parse(JSON.stringify(thisWeekAssignmentData));
    ret.forEach((e,idx)=>{
      e["textbookName"]=e["textbookName"].length>0?e["textbookName"][0]:"";
      e["AOSTextbookID"]=e["AOSTextbookID"].length>0?e["AOSTextbookID"][0]:"";
    });
    return ret;
  }
  function getDescriptionStringFromAssignment(assignment){
    let ret=assignment["description"];
    try{
      if(assignment["textbookName"]){
        ret+=" "+assignment["textbookName"];
        for(let i=0; i<assignment["pageRangeArray"].length; i++){
          let range=assignment["pageRangeArray"][i];
          ret+=` ${range[0]}~${range[1]},`
        }
      }
    }
    catch(error){

    }
    return ret;
  }
  function getDailyGoalCheckLogDataFromAssignment(assignmentData,finished_flag,excuse){
    const ret=JSON.parse(JSON.stringify(dailyGoalCheckLogDataTemplate));
    ret["AOSID"]=assignmentData["AOSID"];
    ret["AOSTextbookID"]=assignmentData["AOSTextbookID"];
    ret["finishedState"]=finished_flag;
    ret["excuse"]=excuse;
    ret["description"]=getDescriptionStringFromAssignment(assignmentData);
    return ret;
  }
  function getDailyGoalCheckLogDataFromTextbookName(textbookName,finished_flag,excuse){
    const ret=JSON.parse(JSON.stringify(dailyGoalCheckLogDataTemplate));
    ret["textbookID"]=textbookIDMapping[textbookName];
    ret["finishedState"]=finished_flag;
    ret["excuse"]=excuse;
    ret["description"]=textbookName;
    return ret;
  }
  const [textbookOfAssignment,setTextbookOfAssignment]=useState({}); // 강의 과제의 교재와 자체 진도 교재가 겹치지 않으므로 강의에서 사용되는 교재 저장
  function checkTextBookOfAssignment(textbookName){
    return textbookName in textbookOfAssignment;
  }
  function getTextbookOfAssignmentFromThisWeekAssignments(thisWeekAssignmentData){
    const ret={};
    for(let i=0; i<thisWeekAssignmentData.length; i++){
      const assignment=thisWeekAssignmentData[i];
      if(assignment["textbookName"] === "") continue;
      ret[assignment["textbookName"]]=true;
    }
    return ret;
  }
  const [assignmentStudyTime,setAssignmentStudyTime]= useState({}); // 강의 과제의 학습 시간을 담는 dictionary
  function getAssignmentStudyTimeElementFromAssignmentData(assignmentData){
    return {
      과목: assignmentData["lectureSubject"],
      교재: assignmentData["textbookName"],
      총교재량: "",
      최근진도: "",
      학습시간: "00:00",
    };
  }

  // daily goal check log(강의 과제, 진도 교재 완료 여부) 관련 코드
  const [savedDailyGoalCheckLogData,setSavedDailyGoalCheckLogData]= useState([]); //goal check log data in db
  const [AOSIDToSavedGoalStateMapping,setAOSIDToSavedGoalStateMapping]=useState({}); // aosid to state goal state mapping
  function makeAOSIDToSavedGoalStateMapping(savedDailyGoalCheckLogData){
    const newMapping={};
    savedDailyGoalCheckLogData.forEach((e,idx)=>{
      if(!e["AOSID"]) return;
      newMapping[e["AOSID"]]={"finishedState":e["finishedStateList"][0],"excuse":e["excuseList"][0]};
    });
    return newMapping;
  }
  const [textbookIDToSavedGoalStateMapping,setTextbookIDToSavedGoalStateMapping]= useState({});
  function makeTextbookIDToSavedGoalStateMapping(savedDailyGoalCheckLogData){ // textbook id to goal state mapping
    const newMapping={};
    savedDailyGoalCheckLogData.forEach((e,idx)=>{
      if(!e["textbookID"]) return;
      newMapping[e["textbookID"]]={"finishedState":e["finishedStateList"][0],"excuse":e["excuseList"][0]};
    });
    return newMapping;
  }

  const goalAttributes={Assignment:0,textbookProgress:1};
  async function updateGoalState(goalCheckData,goalAttribute,relatedID,finishedState){
    //db update
    let dbUpdateSuccess=false;
    await axios
    .post(`/api/DailyGoalCheckLog/`, goalCheckData)
    .then((result) => {
      if (result.data === true) {
        window.alert("저장되었습니다.");
        dbUpdateSuccess=true;
        // history.push("/studentList");
      } else if (result.data === "로그인필요") {
        window.alert("로그인이 필요합니다.");
        return history.push("/");
      } else {
        console.log(result.data);
        window.alert(result.data);
      }
    })
    .catch((err) => {
      console.log(err);
    });

    //page state update
    if(dbUpdateSuccess){
      if(goalAttribute===goalAttributes.Assignment){
        const tmp_goalStateMapping=JSON.parse(JSON.stringify(AOSIDToSavedGoalStateMapping));
        if(finishedState===true) tmp_goalStateMapping[relatedID]={"finishedState":true,"excuse":""};
        else tmp_goalStateMapping[relatedID]={"finishedState":false,"excuse":goalCheckData["excuse"]};
        setAOSIDToSavedGoalStateMapping(tmp_goalStateMapping);
        if(relatedID in highlightedLectureAssignments){ // 완료/사유작성 안되어서 생긴 강조처리 삭제
          const newHighlightedLectureAssignments= JSON.parse(JSON.stringify(highlightedLectureAssignments));
          delete newHighlightedLectureAssignments[relatedID];
          setHighlightedLectureAssignments(newHighlightedLectureAssignments);
        }
      }
      else if(goalAttribute===goalAttributes.textbookProgress){
        const tmp_goalStateMapping=JSON.parse(JSON.stringify(textbookIDToSavedGoalStateMapping));
        if(finishedState===true) tmp_goalStateMapping[relatedID]={"finishedState":true,"excuse":""};
        else tmp_goalStateMapping[relatedID]={"finishedState":false,"excuse":goalCheckData["excuse"]};
        setTextbookIDToSavedGoalStateMapping(tmp_goalStateMapping);
        if(relatedID in highlightedTextbookAssignments){ // 완료/사유작성 안되어서 생긴 강조처리 삭제
          const newHighlightedTextbookAssignments= JSON.parse(JSON.stringify(highlightedTextbookAssignments));
          delete newHighlightedTextbookAssignments[relatedID];
          setHighlightedTextbookAssignments(newHighlightedTextbookAssignments);
        }
      }
    }
  }
  const [highlightedLectureAssignments,setHighlightedLectureAssignments]= useState({});
  const [highlightedTextbookAssignments,setHighlightedTextbookAssignments]= useState({});
  function checkStudyTimeOfFinishedLectureAssignment(){ // 완료된 과제에 학습시간이 입력되었는지 확인
    for(let i=0; i<thisWeekAssignments.length; i++) {
      const assignment= thisWeekAssignments[i];
      const AOSID=assignment["AOSID"];
      if(!(AOSID in AOSIDToSavedGoalStateMapping)) continue;
      if(AOSIDToSavedGoalStateMapping[AOSID]["finishedState"]===true){
        if(!(AOSID in assignmentStudyTime) || assignmentStudyTime[AOSID]["학습시간"]==="0:00" || assignmentStudyTime[AOSID]["학습시간"]==="00:00") {
          console.log("study time: "+assignmentStudyTime[AOSID]);
          const newHighlightedLectureAssignments= JSON.parse(JSON.stringify(highlightedLectureAssignments));
          newHighlightedLectureAssignments[assignment["AOSID"]]=true;
          setHighlightedLectureAssignments(newHighlightedLectureAssignments);
          return false;
        }
      }
    }
    return true;
  }
  function isLectureAssignmentChecked(){ // 강의 과제 완료여부 확인
    for(let i=0; i<thisWeekAssignments.length; i++) {
      const assignment= thisWeekAssignments[i];
      if(!(assignment["AOSID"] in AOSIDToSavedGoalStateMapping)) {
        const newHighlightedLectureAssignments= JSON.parse(JSON.stringify(highlightedLectureAssignments));
        newHighlightedLectureAssignments[assignment["AOSID"]]=true;
        setHighlightedLectureAssignments(newHighlightedLectureAssignments);
        return false;// goal state 자체가 없으면 완료/사유작성 안된 것
      }
    };
    return true;
  }
  function isTextbookAssignmentChecked(){ // 진도 교재 완료여부 확인
    for(let i=0; i<TR.학습.length; i++){
      const textbookName=TR.학습[i]["교재"];
      const textbookID=textbookIDMapping[textbookName];
      if(!textbookID) continue; // db에 등록되지 않은 교재인 경우 건너뜀
      if(checkTextBookOfAssignment(textbookName)) continue; // 강의 과제에 사용된 교재인 경우 확인 건너뜀
      if(!(textbookID in textbookIDToSavedGoalStateMapping)){
        const newHighlightedTextbookAssignments= JSON.parse(JSON.stringify(highlightedTextbookAssignments));
        newHighlightedTextbookAssignments[textbookID]=true;
        setHighlightedTextbookAssignments(newHighlightedTextbookAssignments);
        return false; // goal state 자체가 없으면 완료/사유작성 안된 것
      }
    }
    console.log("textbook assignment done");
    return true;
  }

  const [currentExcuseInfo,setCurrentExcuseInfo]= useState({}); //excuse modal related data
  const [showExcuseModal,setShowExcuseModal]= useState(false); //excuse modal open/close state
  const openExcuseModal= (newGoalExcuseData)=>{
    setCurrentExcuseInfo(newGoalExcuseData);
    setShowExcuseModal(true);
  };
  const closeExcusemodal= ()=>{
    setCurrentExcuseInfo({});
    setShowExcuseModal(false);
  }

  useEffect(async()=>{
    // console.log(formatDate(getThisWeek(today)[1]));
    const newtodayGoal = await axios
    .get(`/api/Weeklystudyfeedback/${paramID}/${formatDate(getThisWeek(TR.날짜)[1])}`)
    .then((result) => {
      if (result["data"] !== null) {
        return result["data"]["thisweekGoal"][TR["요일"].split("요일")[0]];
      }
    })
    .catch((err) => {
      return err;
    });
    await settodayGoal(newtodayGoal);

    // 오늘 마감인 해당 학생의 강의 과제를 가져온다 (post 방식 사용)
    const requestArgument = { studentID: paramID, today_date: TR.날짜 };
    let thisWeekAssignmentData = await axios
      .post(`/api/StudentTodayAssignment/`, requestArgument)
      .then((result) => {
        if (result.data === "로그인필요") {
          window.alert("로그인이 필요합니다.");
          return window.push("/");
        } else if (result["data"] !== null) {
          return result["data"];
        }
      })
      .catch((err) => {
        console.log(err);
      });
    thisWeekAssignmentData = processThisWeekAssignmentData(thisWeekAssignmentData);
    setThisWeekAssignments(thisWeekAssignmentData);
    // console.log("check: ", thisWeekAssignmentData);

    //자체 진도 교재 중 강의에서 사용중인 교재를 걸러내기 위한 state
    setTextbookOfAssignment(getTextbookOfAssignmentFromThisWeekAssignments(thisWeekAssignmentData));

    //강의 과제 학습 시간도 TR.실제학습시간에 반영하기 위한 state
    const newAssignmentStudyTime= {};
    thisWeekAssignmentData.map((assignment,idx)=>{
      newAssignmentStudyTime[assignment["AOSID"]]=getAssignmentStudyTimeElementFromAssignmentData(assignment);
    });
    setAssignmentStudyTime(newAssignmentStudyTime);
    // console.log("ast: "+JSON.stringify(newAssignmentStudyTime));
    // console.log("tr.날짜:"+JSON.stringify(TR.날짜));
  },[TR.날짜]);

  useEffect(async()=>{
    const newSavedDailyGoalCheckLogData = await axios.get(`/api/SavedDailyGoalCheckLogData/${paramID}/${TR.날짜}`)
    .then((result) => {
      if (result.data === "로그인필요") {
        window.alert("로그인이 필요합니다.");
        return window.push("/");
      } else if (result["data"] !== null) {
        if(result["data"]["success"])
          return result["data"]["ret"];
        else{
          console.log("error: "+result["data"]["ret"]);
          return [];
        }
      }
      else{
        return [];
      }
    })
    .catch((err) => {
      console.log(err);
    });
    // console.log("sdgcld:"+JSON.stringify(newSavedDailyGoalCheckLogData));
    setSavedDailyGoalCheckLogData(newSavedDailyGoalCheckLogData);
    setAOSIDToSavedGoalStateMapping(makeAOSIDToSavedGoalStateMapping(newSavedDailyGoalCheckLogData));
    setTextbookIDToSavedGoalStateMapping(makeTextbookIDToSavedGoalStateMapping(newSavedDailyGoalCheckLogData));
    // console.log("mapping: "+JSON.stringify(AOSIDToSavedGoalStateMapping));
    // console.log("mapping2: "+JSON.stringify(textbookIDToSavedGoalStateMapping));
  },[TR.날짜]);
  
  useEffect(async() => {
    if (!isInitialMount.current) {
      const newTR = JSON.parse(JSON.stringify(TR));
      const trDate = new Date(TR.날짜);
      const ls = ["일", "월", "화", "수", "목", "금", "토"];
      newTR["요일"] = ls[trDate.getDay()] + "요일";

      if (trDate.getDay() === 0) {
        newTR["목표취침"] = stuDB.생활학습목표.일요일취침;
        newTR["실제취침"] = stuDB.생활학습목표.일요일취침;
        newTR["목표기상"] = stuDB.생활학습목표.일요일기상;
        newTR["실제기상"] = stuDB.생활학습목표.일요일기상;
        newTR["목표등원"] = stuDB.생활학습목표.일요일등원;
        newTR["실제등원"] = stuDB.생활학습목표.일요일등원;
        newTR["목표귀가"] = stuDB.생활학습목표.일요일귀가;
        newTR["실제귀가"] = stuDB.생활학습목표.일요일귀가;
        newTR["목표학습"] = stuDB.생활학습목표.일요일학습;
      } else {
        newTR["목표취침"] = stuDB.생활학습목표.평일취침;
        newTR["실제취침"] = stuDB.생활학습목표.평일취침;
        newTR["목표기상"] = stuDB.생활학습목표.평일기상;
        newTR["실제기상"] = stuDB.생활학습목표.평일기상;
        newTR["목표등원"] = stuDB.생활학습목표.평일등원;
        newTR["실제등원"] = stuDB.생활학습목표.평일등원;
        newTR["목표귀가"] = stuDB.생활학습목표.평일귀가;
        newTR["실제귀가"] = stuDB.생활학습목표.평일귀가;
        newTR["목표학습"] = stuDB.생활학습목표.평일학습;
      }
      setTR(newTR);
    }
  }, [TR.날짜]);

  useEffect(() => {
    if (!isInitialMount.current) {
      const newTR = JSON.parse(JSON.stringify(TR));
      ["취침", "기상", "등원", "귀가"].forEach((a) => {
        newTR[`${a}차이`] = 차이계산(newTR[`목표${a}`], newTR[`실제${a}`]);
      });
      newTR.학습차이 = Math.round((TR.실제학습 - TR.목표학습) * 10) / 10;
      newTR.센터내시간 = 차이계산(newTR.실제귀가, newTR.실제등원);
      newTR.센터활용률 = Math.round(((newTR.프로그램시간 + newTR.실제학습) / TR.센터내시간) * 1000) / 10;
      newTR.센터학습활용률 = Math.round((newTR.실제학습 / newTR.센터내시간) * 1000) / 10;
      setTR(newTR);
    }
  }, [
    TR.밤샘여부,
    TR.목표취침,
    TR.실제취침,
    TR.목표기상,
    TR.실제기상,
    TR.목표등원,
    TR.실제등원,
    TR.목표귀가,
    TR.실제귀가,
    TR.목표학습,
    TR.실제학습,
    TR.프로그램시간,
    TR.센터내시간,
  ]);

  useEffect(() => {
    if (!isInitialMount.current) {
      let cnt = 0;
      let fail = 0;
      for (const cube of TR["큐브책"]) {
        if (cube["완료여부"] === true) {
          cnt += 1;
        } else {
          fail += 1;
        }
      }
      setFailCnt(fail);
      setCuberatio(Math.round((cnt / TR["큐브책"].length) * 1000) / 10);
    }
  }, [TR.큐브책]);

  return (
    <div className="trEdit-background">
      <Modal show={showExcuseModal} onHide={closeExcusemodal}>
        <Modal.Header closeButton>
          <Modal.Title>과제 미완료 사유 작성</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <div className="row mb-5">
            <div className="col-3">과제 상세</div>
            <div className="col-9">{currentExcuseInfo["description"]}</div>
          </div>

          <Form.Control
            as="textarea"
            placeholder="여기에 사유를 입력해주세요(15자 이상)"
            className="mb-3 ModalTextarea"
            onChange={(event)=>{
              const newGoalExcuseData= JSON.parse(JSON.stringify(currentExcuseInfo));
              newGoalExcuseData["excuse"]=event.target.value;
              // console.log("excuse input: "+newGoalExcuseData["excuse"]);
              setCurrentExcuseInfo(newGoalExcuseData);
            }}
          />
          <Button
            className="btn-secondary"
            onClick={async ()=>{
              if(!window.confirm("과제 미완료 사유를 저장하시겠습니까?")) return;
              if(currentExcuseInfo["excuse"].length<15){
                window.alert("사유를 15자 이상 입력해주세요");
                return;
              }
              // console.log("cei: "+JSON.stringify(currentExcuseInfo));
              const goalAttribute= currentExcuseInfo["AOSID"]?goalAttributes.Assignment:goalAttributes.textbookProgress;
              const relatedID= currentExcuseInfo["AOSID"]?currentExcuseInfo["AOSID"]:currentExcuseInfo["textbookID"];
              updateGoalState(currentExcuseInfo,goalAttribute,relatedID,false);
              closeExcusemodal();
            }}
            type="button">
            <strong>입력 완료</strong>
          </Button>
        </Modal.Body>
      </Modal>
      <div className="row">
        <div className="col-xl-6 trCol">
          <div>
            <div className="row m-0 trCard">
              <div className="col-2">
                <p className="fw-bold">[ 이름 ]</p>
                <p>{TR.이름}</p>
              </div>
              <div className="col-2">
                <p className="fw-bold">[ 날짜 ]</p>
                <input
                  type="date"
                  value={TR.날짜}
                  className="w-100"
                  onChange={(e) => {
                    change_depth_one("날짜", e.target.value);
                  }}
                />
              </div>
              <div className="col-2 p-0">
                <Button
                  variant="secondary"
                  className="btn-commit btn-attend"
                  onClick={() => {
                    console.log(TR);
                    change_depth_one("결석여부", false);
                  }}
                >
                  <strong>등원</strong>
                </Button>
              </div>
              <div className="col-2 p-0">
                <Button
                  variant="secondary"
                  className="btn-commit btn-comeyet"
                  onClick={() => {
                    console.log(TR);
                    change_depth_one("결석여부", "등원예정");
                  }}
                >
                  <strong>등원예정</strong>
                </Button>
              </div>
              <div className="col-2 p-0">
                <Button
                  variant="secondary"
                  className="btn-commit btn-absent"
                  onClick={() => {
                    if (window.confirm("미등원으로 전환하시겠습니까?")) {
                      console.log(TR);
                      change_depth_one("결석여부", true);
                    }
                  }}
                >
                  <strong>미등원</strong>
                </Button>
              </div>

              <div className="col-2 p-0">
                <Form.Check
                  className="TRWriteCheck"
                  type="checkbox"
                  label="* TR작성 검사완료"
                  checked={TR["TR작성여부"]}
                  onChange={(e) => {
                    var newTR = JSON.parse(JSON.stringify(TR));
                    newTR["TR작성여부"] = e.target.checked;
                    setTR(newTR);
                  }}
                />
              </div>
            </div>

            {TR.결석여부 === false ? (
              <div className="mt-3">
                <div className="trCard">
                  <Form.Group as={Row}>
                    <Form.Label column sm="2">
                      <strong>[ 신체 컨디션 ]</strong>
                    </Form.Label>
                    <Col sm="10">
                      <Form.Select
                        size="sm"
                        value={TR.신체컨디션}
                        onChange={(e) => {
                          change_depth_one("신체컨디션", parseInt(e.target.value));
                        }}
                      >
                        <option value="">선택</option>
                        <option value={5}>매우 좋음</option>
                        <option value={4}> 좋음</option>
                        <option value={3}>보통</option>
                        <option value={2}> 안좋음</option>
                        <option value={1}>매우 안좋음</option>
                      </Form.Select>
                    </Col>
                  </Form.Group>
                  <Form.Group as={Row} className="mb-3">
                    <Form.Label column sm="2">
                      <strong>[ 정서 컨디션 ]</strong>
                    </Form.Label>
                    <Col sm="10">
                      <Form.Select
                        size="sm"
                        value={TR.정서컨디션}
                        onChange={(e) => {
                          change_depth_one("정서컨디션", parseInt(e.target.value));
                        }}
                      >
                        <option value="선택">선택</option>
                        <option value={5}>매우 좋음</option>
                        <option value={4}> 좋음</option>
                        <option value={3}>보통</option>
                        <option value={2}> 안좋음</option>
                        <option value={1}>매우 안좋음</option>
                      </Form.Select>
                    </Col>
                  </Form.Group>
                  <Table striped hover size="sm" className="mt-3">
                    <thead>
                      <tr>
                        <th width="15%">생활</th>
                        <th width="25%">목표</th>
                        <th width="25%">실제</th>
                        <th>차이</th>
                      </tr>
                    </thead>
                    <tbody>
                      {["취침", "기상", "등원", "귀가"].map(function (a, i) {
                        return (
                          <tr key={i}>
                            <td>{a}</td>
                            <td>
                              <TimePicker
                                locale="sv-sv"
                                value={TR[`목표${a}`]}
                                openClockOnFocus={false}
                                clearIcon={null}
                                clockIcon={null}
                                onChange={(value) => {
                                  change_depth_one(`목표${a}`, value);
                                }}
                              ></TimePicker>
                            </td>

                            <td>
                              <TimePicker
                                className="timepicker"
                                locale="sv-sv"
                                value={TR[`실제${a}`]}
                                openClockOnFocus={false}
                                clearIcon={null}
                                clockIcon={null}
                                onChange={(value) => {
                                  change_depth_one(`실제${a}`, value);
                                }}
                              ></TimePicker>
                            </td>
                            <td>{차이출력(TR["밤샘여부"], TR[`${a}차이`], a)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                  <Form.Check
                    className="stayUpCheck"
                    type="checkbox"
                    label="* 학생 밤샘 시 체크해주세요."
                    checked={TR["밤샘여부"]}
                    onChange={(e) => {
                      var newTR = JSON.parse(JSON.stringify(TR));
                      newTR["밤샘여부"] = e.target.checked;
                      if (e.target.checked == true) {
                        let 목표기상시간 = newTR["목표기상"];
                        newTR["실제취침"] = 목표기상시간;
                        newTR["실제기상"] = 목표기상시간;
                      }
                      setTR(newTR);
                    }}
                  />
                  <p style={{ fontSize: "17px" }} className="mt-2 btn-add program-add">
                    센터내시간 : {TR.센터내시간}시간 / 센터활용률 : {TR.센터활용률}% / 센터학습활용률: {TR.센터학습활용률}%
                  </p>
                </div>

                <div className="trCard">
                <Table striped hover size="sm" className="mt-3">
                  <thead>
                      <tr>
                        <th width="7%">과목</th>
                        <th width="7%">강사</th>
                        <th width="18%">강의명</th>
                        <th width="23%">교재</th>
                        <th width="15%">과제범위</th>
                        <th width="10%">세부사항</th>
                        <th width="10%">학습시간</th>
                        <th width="10%">완료여부<br/>/사유작성</th>
                      </tr>
                    </thead>
                    <tbody>
                      {thisWeekAssignments.map((a, i)=> {
                        let tableRowClassName="";
                        const goalState=AOSIDToSavedGoalStateMapping[a["AOSID"]];
                        if(a["AOSID"] in highlightedLectureAssignments){
                          tableRowClassName="AssignmentHighlighted";
                        }
                        else{
                          if(goalState){
                            if(goalState["finishedState"]===true) tableRowClassName="AssignmentChecked";
                            else tableRowClassName="AssignmentNotFinished";
                          }
                          else tableRowClassName="";
                        }
                        return (
                          <tr key={i} className={tableRowClassName}>
                            <td>
                              <p>{a["lectureSubject"]}</p>
                            </td>
                            <td>
                              <p>{a["manager"]}</p>
                            </td>
                            <td>
                              <p>{a["lectureName"]}</p>
                            </td>
                            <td>
                              <p>{a["textbookName"]}</p>
                            </td>
                            <td>
                              <p className="fs-13px">
                                {a["pageRangeArray"].map((page, idx) => {
                                  if (page[0]!=""){
                                    return(<p>{page[0]} 부터 {page[1]} 까지</p>);
                                  }
                                })}
                              </p>
                            </td>
                            <td>
                              {a["description"] != "" ? (
                                <OverlayTrigger
                                  trigger="click"
                                  placement="right"
                                  overlay={
                                    <Popover id="popover-basic">
                                      <Popover.Body>{a["description"]}</Popover.Body>
                                    </Popover>
                                  }
                                >
                                  <Button>
                                    <BsFillChatSquareFill></BsFillChatSquareFill>
                                  </Button>
                                </OverlayTrigger>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td>
                              <TimePicker
                                className="timepicker"
                                locale="sv-sv"
                                value={a["AOSID"] in assignmentStudyTime?assignmentStudyTime[a["AOSID"]]["학습시간"]:""}
                                openClockOnFocus={false}
                                clearIcon={null}
                                clockIcon={null}
                                onChange={(value) => {
                                  if(!value) value="0:00"
                                  const newAST=JSON.parse(JSON.stringify(assignmentStudyTime));
                                  if(!(a["AOSID"] in newAST)) newAST[a["AOSID"]]=getAssignmentStudyTimeElementFromAssignmentData(a);
                                  newAST[a["AOSID"]]["학습시간"]=value;
                                  setAssignmentStudyTime(newAST);

                                  //전체 학습시간 업데이트
                                  const newTR = JSON.parse(JSON.stringify(TR));
                                  let 실제학습시간 = 0;
                                  let 실제학습분 = 0;
                                  const astKeys= Object.keys(newAST);
                                  for(let i=0; i<astKeys.length; i++){
                                    const studyTime=newAST[astKeys[i]];
                                    실제학습시간 += parseInt(studyTime["학습시간"].split(":")[0]);
                                    실제학습분 += parseInt(studyTime["학습시간"].split(":")[1]);
                                  }
                                  newTR.학습.map(function (b, j) {
                                    if (b.학습시간) {
                                      실제학습시간 += parseInt(b.학습시간.split(":")[0]);
                                      실제학습분 += parseInt(b.학습시간.split(":")[1]);
                                    }
                                  });
                                  newTR.실제학습 = Math.round((실제학습시간 + 실제학습분 / 60) * 10) / 10;
                                  setTR(newTR);
                                }}
                              ></TimePicker>
                            </td>
                            <td>
                              {/* {<Form.Check
                                className="AssignmentCheck"
                                type="checkbox"
                                checked={a['finished']}
                                onChange={(e) => {
                                  // api 변경
                                }}
                              />} */}
                              <button
                                className="btn btn-success btn-opaque"
                                onClick={async ()=>{
                                  if(!window.confirm(`선택한 강의 과제를 완료 처리 하시겠습니까?`)) return;
                                  const assignmentData=a;
                                  const dailyGoalCheckLogData=getDailyGoalCheckLogDataFromAssignment(assignmentData,true,"");
                                  //db & page state update
                                  await updateGoalState(dailyGoalCheckLogData,goalAttributes.Assignment,a["AOSID"], true);
                                }}
                              >
                                <FaCheck></FaCheck>
                              </button>
                              <button
                                className="btn btn-danger btn-opaque"
                                onClick={async ()=>{
                                  const assignmentData=a;
                                  const dailyGoalCheckLogData=getDailyGoalCheckLogDataFromAssignment(assignmentData,false,"");
                                  openExcuseModal(dailyGoalCheckLogData);
                                }}
                              >
                                <FaTimes></FaTimes>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    </Table>
                  <Table striped hover size="sm" className="mt-3">
                    <thead>
                      <tr>
                        <th width="5%"></th>
                        <th width="10%">학습</th>
                        <th width="15%">교재</th>
                        <th width="10%">총교재량</th>
                        <th width="10%">오늘목표량</th>
                        <th width="10%">최근진도</th>
                        <th width="10%">학습시간</th>
                        <th width="10%">완료여부<br/>/사유작성</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TR.학습.map(function (a, i) {
                        const textbookName=a["교재"];
                        const textbookID=textbookIDMapping[a["교재"]];
                        if(checkTextBookOfAssignment(textbookName)) return null;
                        let tableRowClassName="";
                        if(textbookID){
                          if(textbookID in highlightedTextbookAssignments){
                            tableRowClassName="AssignmentHighlighted";
                          }
                          else{
                            const goalState=textbookIDToSavedGoalStateMapping[textbookID];
                          if(goalState){
                            if(goalState["finishedState"]===true) tableRowClassName="AssignmentChecked";
                            else tableRowClassName="AssignmentNotFinished";
                          }
                          else tableRowClassName="";
                          }
                        }
                        return (
                          <tr key={i} className={tableRowClassName}>
                            <td>
                              <button
                                className="btn btn-opaque"
                                onClick={() => {
                                  if (i > -1) {
                                    if (window.confirm("삭제하시겠습니까?")) {
                                      var newTR = JSON.parse(JSON.stringify(TR));
                                      newTR.학습.splice(i, 1);
                                      let 실제학습시간 = 0;
                                      let 실제학습분 = 0;
                                      newTR.학습.map(function (b, j) {
                                        if (b.학습시간) {
                                          실제학습시간 += parseInt(b.학습시간.split(":")[0]);
                                          실제학습분 += parseInt(b.학습시간.split(":")[1]);
                                        }
                                      });
                                      newTR.실제학습 = Math.round((실제학습시간 + 실제학습분 / 60) * 10) / 10;
                                      setTR(newTR);
                                    }
                                  }
                                }}
                              >
                                <strong><FaTrash></FaTrash></strong>
                              </button>
                            </td>
                            <td>
                              <Form.Select
                                size="sm"
                                value={a.과목}
                                onChange={(e) => {
                                  change_depth_three("학습", i, "과목", e.target.value);
                                }}
                              >
                                <option value="">선택</option>
                                <option value="국어">국어</option>
                                <option value="수학">수학</option>
                                <option value="영어">영어</option>
                                <option value="탐구">탐구</option>
                                <option value="강의">강의</option>
                                <option value="기타">기타</option>
                              </Form.Select>
                            </td>
                            <td>
                              <Form.Select
                                size="sm"
                                value={a.교재}
                                onChange={(e) => {
                                  change_depth_three("학습", i, "교재", e.target.value);
                                }}
                              >
                                <option value="선택">선택</option>
                                {stuDB.진행중교재.map(function (book, index) {
                                  return (
                                    <option value={book.교재} key={index}>
                                      {book.교재}
                                    </option>
                                  );
                                })}
                                <option value="모의고사">모의고사</option>
                                <option value="테스트">테스트</option>
                                <option value="기타">기타</option>
                              </Form.Select>
                            </td>
                            <td>
                              <p className="fs-13px">{a.총교재량}</p>
                            </td>
                            <td>
                            {todayGoal ? todayGoal[a.교재]
                              : null}
                            </td>
                            <td>
                              <input
                                type="number"
                                value={a.최근진도}
                                className="inputText"
                                onChange={(e) => {
                                  change_depth_three("학습", i, "최근진도", parseInt(e.target.value));
                                }}
                              />
                            </td>
                            <td>
                              <TimePicker
                                className="timepicker"
                                locale="sv-sv"
                                value={a.학습시간}
                                openClockOnFocus={false}
                                clearIcon={null}
                                clockIcon={null}
                                onChange={(value) => {
                                  if(!value) value="0:00"
                                  var newTR = JSON.parse(JSON.stringify(TR));
                                  newTR.학습[i].학습시간 = value;
                                  let 실제학습시간 = 0;
                                  let 실제학습분 = 0;
                                  const astKeys= Object.keys(assignmentStudyTime);
                                  for(let i=0; i<astKeys.length; i++){
                                    const studyTime=assignmentStudyTime[astKeys[i]];
                                    실제학습시간 += parseInt(studyTime["학습시간"].split(":")[0]);
                                    실제학습분 += parseInt(studyTime["학습시간"].split(":")[1]);
                                  }
                                  newTR.학습.map(function (b, j) {
                                    if (b.학습시간) {
                                      실제학습시간 += parseInt(b.학습시간.split(":")[0]);
                                      실제학습분 += parseInt(b.학습시간.split(":")[1]);
                                    }
                                  });
                                  newTR.실제학습 = Math.round((실제학습시간 + 실제학습분 / 60) * 10) / 10;
                                  setTR(newTR);
                                }}
                              ></TimePicker>
                            </td>
                            <td>
                              {checkTextbookIsValid(a["교재"])?(<>
                                <button
                                  className="btn btn-success btn-opaque"
                                  onClick={async ()=>{
                                    if(!window.confirm(`선택한 진도 교재를 완료 처리 하시겠습니까?`)) return;
                                    const textbookName=a["교재"];
                                    // console.log("textbookname: ",textbookName);
                                    const dailyGoalCheckLogData=getDailyGoalCheckLogDataFromTextbookName(textbookName,true,"");
                                    // console.log("dgcld:"+JSON.stringify(dailyGoalCheckLogData));
                                    //db & page state update
                                    await updateGoalState(dailyGoalCheckLogData,goalAttributes.textbookProgress,textbookIDMapping[a["교재"]], true);
                                  }}
                                >
                                  <FaCheck></FaCheck>
                                </button>
                                <button
                                  className="btn btn-danger btn-opaque"
                                  onClick={()=>{
                                    const textbookName=a["교재"];
                                    const dailyGoalCheckLogData=getDailyGoalCheckLogDataFromTextbookName(textbookName,false,"");
                                    openExcuseModal(dailyGoalCheckLogData);
                                  }}
                                >
                                  <FaTimes></FaTimes>
                                </button>
                              </>):null}
                            </td>
                          </tr>
                        );
                      })}

                      <tr>
                        <td colSpan={5}>목표 학습 - {TR.목표학습} 시간</td>
                        <td> {TR.실제학습} 시간</td>
                        <td colSpan={2}>{TR.학습차이}시간</td>
                      </tr>
                      <tr>
                        <td colSpan={8}>
                          {" "}
                          <button
                            className="btn btn-add program-add"
                            onClick={() => {
                              push_depth_one("학습", {
                                과목: "선택",
                                교재: "선택",
                                총교재량: "---",
                                최근진도: 0,
                                학습시간: "00:00",
                              });
                            }}
                          >
                            <strong>+</strong>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </div>

                <div className="trCard">
                  <Table striped hover size="sm" className="mt-3">
                    <thead>
                      <tr>
                        <th width="5%"></th>
                        <th width="20%">프로그램</th>
                        <th width="20%">매니저</th>
                        <th width="15%">소요시간</th>
                        <th width="35%">상세내용</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TR.프로그램.map(function (a, i) {
                        return (
                          <tr key={i}>
                            <td>
                              <button
                                className="btn btn-opaque"
                                onClick={() => {
                                  if (i > -1) {
                                    if (window.confirm("삭제하시겠습니까?")) {
                                      var newTR = JSON.parse(JSON.stringify(TR));
                                      newTR.프로그램.splice(i, 1);
                                      let 실제시간 = 0;
                                      let 실제분 = 0;
                                      newTR.프로그램.map(function (c, k) {
                                        if (c.소요시간) {
                                          실제시간 += parseInt(c.소요시간.split(":")[0]);
                                          실제분 += parseInt(c.소요시간.split(":")[1]);
                                        }
                                      });
                                      newTR.프로그램시간 = Math.round((실제시간 + 실제분 / 60) * 10) / 10;
                                      setTR(newTR);
                                    }
                                  }
                                }}
                              >
                                <strong><FaTrash></FaTrash></strong>
                              </button>
                            </td>
                            <td>
                              <Form.Select
                                size="sm"
                                value={a.프로그램분류}
                                onChange={(e) => {
                                  change_depth_three("프로그램", i, "프로그램분류", e.target.value);
                                }}
                              >
                                <option value="선택">선택</option>
                                {stuDB.프로그램분류.map(function (p, j) {
                                  return (
                                    <option value={p} key={j}>
                                      {p}
                                    </option>
                                  );
                                })}
                              </Form.Select>
                            </td>
                            <td>
                              <Form.Select
                                size="sm"
                                value={a.매니저}
                                onChange={(e) => {
                                  change_depth_three("프로그램", i, "매니저", e.target.value);
                                }}
                              >
                                <option value="선택">선택</option>
                                {managerList.map(function (b, j) {
                                  return (
                                    <option value={b} key={j}>
                                      {b}
                                    </option>
                                  );
                                })}
                              </Form.Select>
                            </td>
                            <td>
                              <TimePicker
                                className="timepicker"
                                locale="sv-sv"
                                value={a.소요시간}
                                openClockOnFocus={false}
                                clearIcon={null}
                                clockIcon={null}
                                onChange={(value) => {
                                  var newTR = JSON.parse(JSON.stringify(TR));
                                  newTR.프로그램[i].소요시간 = value;
                                  let 실제시간 = 0;
                                  let 실제분 = 0;
                                  newTR.프로그램.map(function (c, k) {
                                    if (c.소요시간) {
                                      실제시간 += parseInt(c.소요시간.split(":")[0]);
                                      실제분 += parseInt(c.소요시간.split(":")[1]);
                                    }
                                  });
                                  newTR.프로그램시간 = Math.round((실제시간 + 실제분 / 60) * 10) / 10;
                                  setTR(newTR);
                                }}
                              ></TimePicker>
                            </td>
                            <td>
                              <textarea
                                className="textArea"
                                name=""
                                id=""
                                rows="3"
                                placeholder="프로그램 상세내용/특이사항 입력"
                                value={a.상세내용}
                                onChange={(e) => {
                                  change_depth_three("프로그램", i, "상세내용", e.target.value);
                                }}
                              ></textarea>
                            </td>
                          </tr>
                        );
                      })}

                      <tr>
                        <td colSpan={5}>프로그램 진행 시간 : {TR.프로그램시간}시간</td>
                      </tr>
                      <tr>
                        <td colSpan={5}>
                          {" "}
                          <button
                            className="btn btn-add program-add"
                            onClick={() => {
                              push_depth_one("프로그램", {
                                프로그램분류: "선택",
                                매니저: "선택",
                                소요시간: "00:00",
                                상세내용: "",
                              });
                            }}
                          >
                            <strong>+</strong>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              </div>
            ) : TR.결석여부 === "등원예정" ? (
              <></>
            ) : (
              <div className="trCard mt-3">
                <Form.Select
                  size="sm"
                  value={TR.결석사유}
                  onChange={(e) => {
                    change_depth_one("결석사유", e.target.value);
                  }}
                >
                  <option value="">미등원사유 선택</option>
                  <option value="등원일 아님">등원일 아님</option>
                  <option value="외부프로그램">외부프로그램</option>
                  <option value="병가">병가</option>
                  <option value="무단">무단</option>
                  <option value="휴가">휴가</option>
                  <option value="구조적용중">"구조적용중"</option>
                  <option value="기타">기타</option>
                </Form.Select>
                <textarea
                  className="textArea mt-3"
                  placeholder="미등원 사유를 입력"
                  value={TR.결석상세내용}
                  onChange={(e) => {
                    change_depth_one("결석상세내용", e.target.value);
                  }}
                ></textarea>
              </div>
            )}
          </div>
        </div>

        {/* <div className="col-xl-2 trCol">
          <div className="trCard">
            <h5 className="fw-bold mt-3 mb-3">
              <strong>[ 문제행동 ]</strong>
            </h5>
            {TR.문제행동.map((prob, i) => (
              <div key={`study-${prob.분류}`} className="mb-1 mt-1 checkBox">
                <Form.Check
                  checked={prob.문제여부}
                  className="border-bottom"
                  type="checkbox"
                  id={`study-${prob.분류}`}
                  label={`${prob.분류}`}
                  onChange={(e) => {
                    change_depth_three("문제행동", i, "문제여부", e.target.checked);
                  }}
                />
              </div>
            ))}
          </div>
        </div> */}

        <div className="col-xl-6 trCol">
          <div className="trCard">
            <div className="d-flex mt-3 mb-3 justify-content-center">
              <div className="feedback-sub">
                <h5 className="fw-bold">
                  <strong>[ 중간 피드백 ]</strong>
                </h5>
              </div>
              <div>
                <Form.Select
                  size="sm"
                  className="feedback-sub"
                  value={TR.중간매니저}
                  onChange={(e) => {
                    change_depth_one("중간매니저", e.target.value);
                  }}
                >
                  <option value="선택">선택</option>
                  {managerList
                    ? managerList.map((manager, index) => {
                        return (
                          <option value={manager} key={index}>
                            {manager}
                          </option>
                        );
                      })
                    : null}
                </Form.Select>
              </div>
            </div>
            <Accordion>
              <Accordion.Item eventKey="0">
                <Accordion.Header>
                  <p>작성하려면 누르세요.</p>
                </Accordion.Header>
                <Accordion.Body>
                  <textarea
                    rows="10"
                    className="textArea"
                    value={TR.중간피드백}
                    onChange={(e) => {
                      change_depth_one("중간피드백", e.target.value);
                    }}
                  ></textarea>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>

            <div className="d-flex mt-3 mb-3 justify-content-center">
              <div className="feedback-sub">
                <h5 className="fw-bold">
                  <strong>[ 귀가 피드백 ]</strong>
                </h5>
              </div>
              <div>
                <Form.Select
                  size="sm"
                  className="feedback-sub"
                  value={TR.작성매니저}
                  onChange={(e) => {
                    change_depth_one("작성매니저", e.target.value);
                  }}
                >
                  <option value="">선택</option>
                  {managerList
                    ? managerList.map((manager, index) => {
                        return (
                          <option value={manager} key={index}>
                            {manager}
                          </option>
                        );
                      })
                    : null}
                </Form.Select>
              </div>
            </div>
            <Accordion>
              <Accordion.Item eventKey="0">
                <Accordion.Header>
                  <p>작성하려면 누르세요.</p>
                </Accordion.Header>
                <Accordion.Body>
                  <textarea
                    rows="10"
                    className="textArea"
                    value={TR.매니저피드백}
                    onChange={(e) => {
                      change_depth_one("매니저피드백", e.target.value);
                    }}
                  ></textarea>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </div>
          <Button
            variant="secondary"
            className="btn-commit btn-edit"
            onClick={async () => {
              console.log(TR);
              if (입력확인()) {
                if (window.confirm(`${TR.이름}학생의 ${TR.날짜} 일간하루를 저장하시겠습니까?`)) {
                  if (TR.결석여부 === false) {
                    const newstuDB = JSON.parse(JSON.stringify(stuDB));
                    for (let i = 0; i < stuDB["진행중교재"].length; i++) {
                      for (let j = 0; j < TR["학습"].length; j++) {
                        if (stuDB["진행중교재"][i]["과목"] == TR["학습"][j]["과목"] && stuDB["진행중교재"][i]["교재"] == TR["학습"][j]["교재"]) {
                          newstuDB["진행중교재"][i]["최근진도"] = Math.max(newstuDB["진행중교재"][i]["최근진도"], TR["학습"][j]["최근진도"]);
                          newstuDB["진행중교재"][i]["최근진도율"] = newstuDB["진행중교재"][i]["총교재량"]
                            ? Math.round((newstuDB["진행중교재"][i]["최근진도"] / parseInt(newstuDB["진행중교재"][i]["총교재량"].match(/\d+/))) * 100)
                            : 0;
                        }
                      }
                    }
                    await axios
                      .put("/api/StudentDB", newstuDB)
                      .then(function (result) {
                        if (result.data === "로그인필요") {
                          window.alert("로그인이 필요합니다.");
                          return history.push("/");
                        }
                        if (result.data !== true) {
                          console.log(result.data);
                          window.alert(result.data);
                        }
                      })
                      .catch(function (err) {
                        window.alert("저장에 실패했습니다 개발/데이터 팀에게 문의해주세요");
                      });
                  }

                  const postedTR=JSON.parse(JSON.stringify(TR));
                  postedTR["강의과제학습"]=assignmentStudyTime; //TR 객체의 강의 과제 학습 시간 관련 state를 새로 추가하여 post: 더 나은 방법 찾아봐야

                  axios
                    .post("/api/TR", postedTR)
                    .then(function (result) {
                      if (result.data === true) {
                        window.alert("저장되었습니다.");
                        history.push("/studentList");
                      } else if (result.data === "로그인필요") {
                        window.alert("로그인이 필요합니다.");
                        return history.push("/");
                      } else {
                        console.log(result.data);
                        window.alert(result.data);
                      }
                    })
                    .catch(function (err) {
                      console.log("저장 실패 : ", err);
                      window.alert(err);
                    });
                }
              }
            }}
          >
            <strong>일간하루 저장</strong>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default TRwrite;
