import "./TRWriteEdit.scss";
import { Form, Button, Card, ListGroup, Table, Modal, Row, Col, Accordion, OverlayTrigger, Popover } from "react-bootstrap";
import { useHistory, useParams } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect, useRef } from "react";
import {FaCheck, FaSistrix, FaTrash, FaTimes, FaSearch, FaSleigh} from "react-icons/fa"
import axios from "axios";
import TimePicker from "react-time-picker";
// import { FaPencilAlt, FaTrash, FaCheck, FaUndo } from "react-icons/fa";
// import { CgMailForward } from "react-icons/cg";
import { BsFillChatSquareFill } from "react-icons/bs";
import { TbBrandPython, TbUserExclamation } from "react-icons/tb";
import { min } from "moment";

function TRedit() {
  const now = new Date(); // 현재 시간
  const utcNow = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const koreaTimeDiff = 9 * 60 * 60 * 1000;
  const koreaNow = new Date(utcNow + koreaTimeDiff);
  // const today = koreaNow.toISOString().split("T")[0];
  const today = getCurrentKoreaDateYYYYMMDD();

  // 공통 code
  let history = useHistory();
  let paramID = useParams()["ID"];
  let paramDate = useParams()["date"];
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
    // TR작성여부: false,
    "등교" : false,
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

  function checkTRAssignmentStudyTimeEmpty(){
    return Object.keys(TR.강의과제학습).length==0;
  }

  // 당일학습목표, 주간학습목표 관련 코드
  const weekDays = ["월", "화", "수", "목", "금", "일"];
  function getDayStringFromDateObject(date) {
    const day = date.getDay() == 0 ? 6 : date.getDay() - 1;
    return weekDays[day];
  }
  function getDayString(){
    const date=new Date(paramDate);
    let day = (date.getDay()+6) %7;
    if(day==6) day-=1;
    return weekDays[day];
  }
  function dateToString(date) {
    let ret = [String(date.getFullYear()), String(date.getMonth() + 1), String(date.getDate())];
    for (let i = 1; i < 3; i++) {
      if (ret[i].length < 2) {
        ret[i] = "0" + ret[i];
      }
    }
    return ret.join("-");
  }

  const [todayGoal, settodayGoal] = useState([]); // 오늘의 학습 계획(weeklystudyfeedback document에서 가져옴)
  const [thisweekGoal, setthisweekGoal] = useState({ // 주간 학습 계획(weeklystudyfeedback document에서 가져옴)
    월: {},
    화: {},
    수: {},
    목: {},
    금: {},
    일: {},
    마감일: {},
  });

  //일요일에 한주간의 학습 진행 상황 및 학습 목표 정리하는 table 표시하기 위한 코드
  const [thisWeekProgress, setThisWeekProgress] = useState([]); // TR document에서 가져온 이번주 교재별 최근 진도(TR.학습.진행중교재.최근진도)
  const [thisweek, setthisweek] = useState(getThisWeek(paramDate)); // :[저번주일요일 date string, 이번주 일요일 date string]
  const [bookVolumeDictionary,setbookVolumeDictionary]= useState({}); // key: 교재명, value: 총 교재량
  const [bookNamesList,setBookNamesList]= useState([]); // thisweekgoal,thisweekprogress에 저장된 교재들의 이름을 담는 list
  // let bookVolumeDictionary = {};
  // let bookNamesList = [];
  //
  //state "thisweekGoal"에 valid element가 있는지 검사
  function checkThisWeekGoalHasValidElement() {
    if (!thisweekGoal) return false;
    for (let i = 0; i < weekDays.length; i++) {
      let tmpDay = weekDays[i];
      let tmpGoal = thisweekGoal[tmpDay];
      if (Object.keys(tmpGoal).length > 0) return true;
    }
    return false;
  }
  //paramdate가 일요일인지 검사
  function checkTodayIsSunday() {
    return new Date(paramDate).getDay() == 0;
  }
  // state "thisWeekProgress"에 valid element가 있는지 검사
  function checkThisWeekProgressHasValidElement() {
    if (!thisWeekProgress || thisWeekProgress.length == 0) return false;
    for (let i = 0; i < thisWeekProgress.length; i++) {
      if (thisWeekProgress[i] != null && thisWeekProgress != undefined && thisWeekProgress[i].hasOwnProperty("학습")) return true;
    }
    return false;
  }
  // this week goal, this week progress 로부터 책 이름과 해당 책의 총 분량을 state "bookNamesList", "bookVolumeDictionary"에 저장
  function collectBookNamesFromProgressAndGoal() {
    const newbookVolumeDictionary={};
    if (thisweekGoal && thisweekGoal.hasOwnProperty("교재캡쳐")) {
      let booklist = thisweekGoal["교재캡쳐"];
      for (let i = 0; i < booklist.length; i++) {
        let bookName = booklist[i]["교재"];
        if (!newbookVolumeDictionary.hasOwnProperty(bookName)) {
          newbookVolumeDictionary[bookName] = booklist[i].hasOwnProperty("총교재량") ? booklist[i]["총교재량"] : null;
        }
      }
    }
    if (thisWeekProgress && thisWeekProgress.length > 0) {
      for (let i = 0; i < thisWeekProgress.length; i++) {
        let dayElement = thisWeekProgress[i];
        if (!(dayElement && dayElement.hasOwnProperty("학습"))) continue;
        for (let j = 0; j < dayElement["학습"].length; j++) {
          let bookElement = dayElement["학습"][j];
          if (!bookElement.hasOwnProperty("교재")) continue;
          let bookName = bookElement["교재"];
          if (!newbookVolumeDictionary.hasOwnProperty(bookName)) {
            newbookVolumeDictionary[bookName] = bookElement.hasOwnProperty("총교재량") ? bookElement["총교재량"] : null;
          }
        }
      }
    }
    // let newBookNamesList = Object.keys(newbookVolumeDictionary);
    setbookVolumeDictionary(newbookVolumeDictionary);
    //console.log("book names dict: "+JSON.stringify(newbookVolumeDictionary));
    // bookNamesList = Object.keys(newbookVolumeDictionary);
    setBookNamesList(Object.keys(newbookVolumeDictionary));
    //console.log("book names list: "+JSON.stringify(bookNamesList));
    //setbookVolumeDictionary(newbookVolumeDictionary);
    //setBookNamesList(newBookNamesList);
  }
  // collectBookNamesFromProgressAndGoal();
  // 주간 학습 진행상황을 보여주는 표(숫자가 table cell에 표시되는 표)를 보여줄 수 있는지 검사
  function checkWeekProgressTableNeeded() {
    return checkThisWeekProgressHasValidElement() || checkThisWeekGoalHasValidElement();
  }
  function getGoalFromDayAndBook(day, bookName) {
    if (!thisweekGoal || !thisweekGoal.hasOwnProperty(day) || !thisweekGoal[day].hasOwnProperty(bookName)) return null;
    return thisweekGoal[day][bookName];
  }
  function getProgressFromDayAndBook(day, bookName) {
    if (!thisWeekProgress || thisWeekProgress.length == 0) return null;
    let dplist = thisWeekProgress.filter((dayProgress, dpInex) => {
      if (!dayProgress || !dayProgress.hasOwnProperty("요일")) return false;
      return day === dayProgress["요일"];
    });
    //console.log("breakpoint0");
    if (dplist.length == 0 || !dplist[0].hasOwnProperty("학습")) {
      //console.log("return condition satisfied, dplist: "+JSON.stringify(dplist));
      return null;
    }
    let bookinfo = dplist[0]["학습"].filter((studyingBook, sbIndex) => {
      return studyingBook["교재"] === bookName;
    });
    if (bookinfo.length == 0) {
      //console.log("return condition satisfied, bookinfo: "+JSON.stringify(bookinfo));
      return null;
    }
    //console.log("breakpoint");
    return !bookinfo[0]["최근진도"] ? null : bookinfo[0]["최근진도"];
  }
  function getThisWeek(inputDate) { //return two dates: sunday to sunday; parameter: date string
    //console.log(inputDate);
    var inputDate = new Date(inputDate);
    //console.log(inputDate);
    inputDate.setHours(0, 0, 0, 0);
    var day = inputDate.getDay();
    var diff = inputDate.getDate() - day + (day == 0 ? -6 : 1);
    inputDate = new Date(inputDate.setDate(diff));
    var startdate = new Date(inputDate.setDate(inputDate.getDate()));
    var enddate = new Date(inputDate.setDate(inputDate.getDate() + 7));
    return [startdate, enddate];
  }
  function getThisWeekStrings(dateString){ //return two date strings: sunday to sunday; parameter: date string
    const day_in_milliseconds= 24*3600*1000;
    const date= new Date(dateString);
    const date_day= date.getDay();
    let start_date;
    if(date_day===0) start_date= new Date(date.getTime()-day_in_milliseconds*7);
    else start_date= new Date(date.getTime() - date_day*day_in_milliseconds);
    const start_date_string= start_date.toISOString().split("T")[0];
    const end_date= new Date(start_date.getTime() + 7*day_in_milliseconds);
    const end_date_string= end_date.toISOString().split("T")[0];
    return [start_date_string,end_date_string];
  }
  function getDateStringByDayIndex(day){ // return date string of day(0:monday, 6:sunday) of the week which includes the date 'paramDate'
    const last_sunday_date=new Date(getThisWeekStrings(paramDate)[0]);
    const day_in_milliseconds= 3600*24*1000;
    const date= new Date(last_sunday_date.getTime()+day_in_milliseconds*(day+1));
    return date.toISOString().split("T")[0];
  }

  //이번주에 해당하는 weeklystudyfeedback documnent를 가져와서 state "thisweekGoal","todayGoal"에 저장하는 함수
  async function getGoals(){
    const newthisweekGoal = await axios
        .get(`/api/Weeklystudyfeedback/${paramID}/${getThisWeekStrings(paramDate)[1]}`)
        .then((result) => {
          if (result["data"] !== null) {
            // console.log(result["data"]["thisweekGoal"]);
            return result["data"]["thisweekGoal"];
          }
          return null;
        })
        .catch((err) => {
          return err;
        });
    if(newthisweekGoal) {
      // console.log("twg: "+JSON.stringify(newthisweekGoal));
      await setthisweekGoal(newthisweekGoal);
      await settodayGoal(newthisweekGoal[getDayString()]);
    }
  }

  //이번 주 날짜에 해당하는 TR document에서 진행중 교재에 해당하는 최근 진도를 가져와서 state "thisWeekProgress"에 저장하는 함수
  async function getThisWeekProgress() {
    // let ret = [];
    // for (let i = 0; i < 7; i++) {
    //   let tmpdate = new Date(thisweek[0]);
    //   tmpdate.setDate(tmpdate.getDate() + i);
    //   ret.push(
    //     await axios
    //       .get(`/api/TR/${paramID}/${dateToString(tmpdate)}`)
    //       .then((result) => {
    //         //console.log('paramdate: '+dateToString(tmpdate)+" "+i+"요일 "+"data:"+JSON.stringify(result["data"]));
    //         return result["data"];
    //       })
    //       .catch((err) => {
    //         return err;
    //       })
    //   );
    // }
    //console.log('get~ ret val: '+JSON.stringify(ret));
    // setThisWeekProgress(ret);

    const thisWeekDateString=getThisWeekStrings(paramDate);
    const payload={studentLegacyID:paramID,fromDate:thisWeekDateString[0],toDate:thisWeekDateString[1]};
    const tr_list=await axios
        .post(`/api/TRByDateRange`,payload)
        .then((result) => {
          //console.log('paramdate: '+dateToString(tmpdate)+" "+i+"요일 "+"data:"+JSON.stringify(result["data"]));
          const res=result["data"];
          if(res["success"]) return res["ret"];
          else return [];
        })
        .catch((err) => {
          return err;
        })
    const proj_data= tr_list.map((e,idx)=>{
      return {
        ID:e["ID"],
        요일:e["요일"],
        날짜:e["날짜"],
        학습:e["학습"]
      }
    })
    const proj_data_dictionary={} //key: date, value: proj_data_element
    proj_data.forEach((e,idx)=>{
      // console.log("date:"+e["date"]);
      proj_data_dictionary[e["날짜"]]=e;
    });

    const newThisWeekProgress=[];
    const day_in_milliseconds=3600*24*1000;
    const thisweek_sunday_date=new Date(getThisWeekStrings(paramDate)[0]);
    for(let i=1; i<=7; i++){
      const date=new Date(thisweek_sunday_date.getTime()+i*day_in_milliseconds);
      const date_string=date.toISOString().split("T")[0];
      newThisWeekProgress.push(proj_data_dictionary[date_string]);
    }
    // newThisWeekProgress.forEach((e,idx)=>{
    //   console.log(idx,JSON.stringify(e));
    // });
    setThisWeekProgress(newThisWeekProgress);
  }

  // 하루 전 날짜를 문자열로 반환
  function formatDate(date) {
    var d = new Date(date),
        month = "" + (d.getMonth() + 1),
        day = "" + (d.getDate() - 1),
        year = d.getFullYear();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    return [year, month, day].join("-");
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
        // 귀가 검사 시 종이 TR과 웹TR을 대조하는 전제 하에 이 조건을 삭제
        // if (!TR.학습[i].학습시간 || TR.학습[i].학습시간 === "00:00") {
        //   // window.alert(
        //   //   `${
        //   //     i + 1
        //   //   }번째 학습의 학습시간이 입력되지 않았습니다. \n학습이 진행되지 않은 경우, 해당 항목을 삭제해주세요. \n귀가 매니저가 입력된 경우, 귀가검사를 진행한 것으로 파악하고 학습시간을 입력하도록 강제해두었습니다. \n중간 저장인 경우 귀가 매니저를 선택하지 않아야 경고문이 뜨지 않습니다`
        //   // );
        //   window.alert(
        //     `${
        //       validStudyCount
        //     }번째 학습의 학습시간이 입력되지 않았습니다. \n학습이 진행되지 않은 경우, 해당 항목을 삭제해주세요. \n귀가 매니저가 입력된 경우, 귀가검사를 진행한 것으로 파악하고 학습시간을 입력하도록 강제해두었습니다. \n중간 저장인 경우 귀가 매니저를 선택하지 않아야 경고문이 뜨지 않습니다`
        //   );
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
            if (window.confirm(`${lecture["assignments"][assignID]["과제내용"]}(이)가 오늘까지 입니다. 저장을 진행하시겠습니까?`) === false) return false;
          }
        }
      }
    }

    if (TR.작성매니저 && TR.매니저피드백.length < 40) {
      window.alert("귀가 피드백은 최소 40자 이상 입력되어야 합니다.");
      return false;
    }

    if(TR.작성매니저 && TR.매니저피드백){ // 마감피드백 저장 전에
      if(!checkStudyTimeOfFinishedLectureAssignment()){// 완료처리 하였으나 학습시간 입력 안한 강의과제 있는지 확인
        window.alert("완료 처리 되었으나 학습 시간이 입력되지 않은 강의 과제가 있습니다");
        return false;
      }
      if(!checkStudyTimeOfFinishedTextbookAssignment()){// 완료처리 하였으나 학습시간 입력 안한 자체진도교재 있는지 확인
        window.alert("완료 처리 되었으나 학습 시간이 입력되지 않은 자체 진도 교재가 있습니다");
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

  function 차이계산(목표, 실제) {
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
  function recalculateStudyAndProgramTime(){
    setTR((prevData)=>{
      const newTR=JSON.parse(JSON.stringify(prevData));
      //study time recal goes here
      let study_time_hour=0;
      let study_time_minute=0;
      newTR.학습.forEach((e,idx)=>{
        let [hour,minute]= e.학습시간.split(":");
        study_time_hour+=parseInt(hour);
        study_time_minute+=parseInt(minute);
      })
      Object.keys(newTR.강의과제학습).forEach((e,idx)=>{
        let [hour,minute]= newTR.강의과제학습[e].학습시간.split(":");
        study_time_hour+=parseInt(hour);
        study_time_minute+=parseInt(minute);
      });
      newTR.실제학습= Math.round((study_time_hour + study_time_minute / 60) * 10) / 10;
      //program time recal goes here
      let pp_hour=0;
      let pp_minute=0;
      newTR.프로그램.forEach((e,idx)=>{
        let [hour,minute]= e.소요시간.split(":");
        pp_hour+=parseInt(hour);
        pp_minute+=parseInt(minute);
      });
      newTR.프로그램시간= Math.round((pp_hour + pp_minute / 60) * 10) / 10;
      return newTR;
    });
  }
  /**  **/
  function centerTimeDiff(backHome,centerArrival){
    // backHome = 귀가 시간 | centerArrival = 등원 시간
    if(!backHome||!centerArrival){
      return NaN;
    }
    let [backHomeHour, backHomeMin] = backHome.split(":");
    let [centerArrivalHour, centerArrivalMin] = centerArrival.split(":");

    let backHomeTime = (parseInt(backHomeHour) * 60) + parseInt(backHomeMin);
    let centerArrivalTime = (parseInt(centerArrivalHour) * 60) + parseInt(centerArrivalMin);
    let diff = backHomeTime - centerArrivalTime;

    let result = (diff/60) + ((diff%60)/60)

    return Math.round(result * 10) /10;


  }

  function centerTimeDiff(backHome,centerArrival){
    // backHome = 귀가 시간 | centerArrival = 등원 시간
    if(!backHome||!centerArrival){
      return NaN;
    }
    let [backHomeHour, backHomeMin] = backHome.split(":");
    let [centerArrivalHour, centerArrivalMin] = centerArrival.split(":");

    let backHomeTime = (parseInt(backHomeHour) * 60) + parseInt(backHomeMin);
    let centerArrivalTime = (parseInt(centerArrivalHour) * 60) + parseInt(centerArrivalMin);
    let diff = backHomeTime - centerArrivalTime;

    let result = (diff/60)

    return Math.round(result * 10) /10;


  }

  function centerTimeDiff(backHome,centerArrival){
    // backHome = 귀가 시간 | centerArrival = 등원 시간
    if(!backHome||!centerArrival){
      return NaN;
    }
    let [backHomeHour, backHomeMin] = backHome.split(":");
    let [centerArrivalHour, centerArrivalMin] = centerArrival.split(":");

    let backHomeTime = (parseInt(backHomeHour) * 60) + parseInt(backHomeMin);
    let centerArrivalTime = (parseInt(centerArrivalHour) * 60) + parseInt(centerArrivalMin);
    let diff = backHomeTime - centerArrivalTime;

    let result = (diff/60)

    return Math.round(result * 10) /10;


  }

  function 차이출력(stayup, diff, 종류) {
    if (stayup == true && (종류 == "취침" || 종류 == "기상")) {
      return "밤샘";
    } else {
      if (diff < 0) {
        diff = -diff;
        return Math.round(diff * 10) / 10 + "시간 늦게 " + 종류;
      } else if (diff > 0) {
        return Math.round(diff * 10) / 10 + "시간 일찍 " + 종류;
      } else {
        return "정시 " + 종류;
      }
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

  // Edit code
  const [modalShow, setmodalShow] = useState(false);
  const [selectedDate, setselectedDate] = useState(paramDate);
  const isInitialMount = useRef(true);

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
              throw new Error(`error while getting textbookinprogress data:internal server error`);
              return [];
            }
          }
          else{
            throw new Error(`error while getting textbookinprogress data:external error`);
            return [];
          }
        })
        .catch((err) => {
          console.log(err);
          window.alert(`네트워크 오류로 데이터를 가져오는데 실패했습니다:1`);
          window.location.reload();
          return [];
        });
    const nameToIDMapping= {reverse:{}};
    nameToIDArray.forEach((e,idx)=>{
      nameToIDMapping[e["교재"]]=e["_id"];
      nameToIDMapping.reverse[e["_id"]]={...e};
    });
    setTextbookIDMapping(nameToIDMapping);
    updateDraftOverwriteReady("textbook",true);
    // console.log("name id mapping:"+JSON.stringify(nameToIDMapping));
  },[]);

  //과제 완료 여부 관련 코드
  const dailyGoalCheckLogDataTemplate={
    "textbookID":"",
    "AOSID":"",
    "AOSTextbookID":"",
    "studentLegacyID":paramID,
    "date":paramDate,
    "finishedState":"",
    "excuse":"",
    "description":""
  };

  //강의 과제 관련 코드
  const [todayAssignments, setTodayAssignments] = useState([]);
  function processTodayAssignmentData(todayAssignmentData){ //post request로 받아온 데이터 전처리
    const raw_data_copy=JSON.parse(JSON.stringify(todayAssignmentData));
    const ret=[];
    raw_data_copy.forEach((e,idx)=>{
      e["textbookName"]=e["textbookName"].length>0?e["textbookName"][0]:"";
      e["AOSTextbookID"]=e["AOSTextbookID"].length>0?e["AOSTextbookID"][0]:"";
      if(!e["hiddenOnTRPage"]) ret.push(e);
    });
    return ret;
  }
  function getAssignmentInfoByAOSID(AOSID){
    for(let i=0; i<todayAssignments.length; i++){
      const assignment_element=todayAssignments[i];
      if(AOSID===assignment_element.AOSID) return assignment_element;
    }
    return null;
  }
  function getDescriptionStringFromAssignment(assignment){
    let ret=assignment["description"];
    try{
      if(assignment["textbookName"]){
        ret+=" "+assignment["textbookName"];
        for(let i=0; i<assignment["pageRangeArray"].length; i++){
          let range=assignment["pageRangeArray"][i];
          ret+=` ${range[0]}~${range[1]}`
          if(i<assignment["pageRangeArray"].length-1) ret+=`,`
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
  function getDGCLExcuseFromAOSID(AOSID){
    const goal_state=AOSIDToSavedGoalStateMapping[AOSID];
    return goal_state?goal_state.excuse:"";
  }
  function getDailyGoalCheckLogDataFromTextbookName(textbookName,finished_flag,excuse){
    const ret=JSON.parse(JSON.stringify(dailyGoalCheckLogDataTemplate));
    ret["textbookID"]=textbookIDMapping[textbookName];
    ret["finishedState"]=finished_flag;
    ret["excuse"]=excuse;
    ret["description"]=textbookName;
    return ret;
  }
  function getDGCLExcuseFromTextbookID(textbookID){
    const goal_state=textbookIDToSavedGoalStateMapping[textbookID];
    return goal_state?goal_state.excuse:"";
  }
  const [textbookOfAssignment,setTextbookOfAssignment]=useState({}); // 강의 과제의 교재와 자체 진도 교재가 겹치지 않으므로 강의에서 사용되는 교재 저장
  function checkTextBookOfAssignment(textbookName){
    return textbookName in textbookOfAssignment;
  }
  function getTextbookOfAssignmentFromTodayAssignments(todayAssignmentData){
    const ret={};
    for(let i=0; i<todayAssignmentData.length; i++){
      const assignment=todayAssignmentData[i];
      if(assignment["textbookName"] === "") continue;
      ret[assignment["textbookName"]]=true;
    }
    return ret;
  }
  function checkLectureAssignmentExists(){
    return todayAssignments.length>0;
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
  function updateAssignmentStudyTime(AOSID,studyTime){
    setAssignmentStudyTime((prevData)=>{
      const newAST=JSON.parse(JSON.stringify(prevData));
      if(!(AOSID in newAST)) {
        const assignment_info=getAssignmentInfoByAOSID(AOSID);
        newAST[AOSID]=getAssignmentStudyTimeElementFromAssignmentData(assignment_info);
      }
      newAST[AOSID].학습시간=studyTime;
      return newAST;
    });
  }
  function updateAssignmentStudyTimeInTR(AOSID,studyTime){
    setTR((prevData)=>{
      const newData=JSON.parse(JSON.stringify(prevData));
      const newAST= newData.강의과제학습;
      if(!(AOSID in newAST)) {
        const assignment_info=getAssignmentInfoByAOSID(AOSID);
        newAST[AOSID]=getAssignmentStudyTimeElementFromAssignmentData(assignment_info);
      }
      newAST[AOSID].학습시간=studyTime;
      return newData;
    });
  }
  function getStudyElementTemplateInTR(){
    return {
      과목: "선택",
      교재: "선택",
      총교재량: "",
      최근진도: 0,
      학습시간: "00:00",
    };
  }
  function getStudyElementTemplateByTextbookID(textbookID){
    const ret_tmp=textbookIDMapping.reverse[textbookID];
    return {...ret_tmp};
  }
  function updateLATStudyTimeInTR(request_specific_data,studyTime){
    const duplicatable=request_specific_data.duplicatable;
    const textbookID=request_specific_data.textbookID;
    const duplicatable_name=request_specific_data.duplicatable_name;
    const duplicatable_subject=request_specific_data.duplicatable_subject;
    const recent_page=request_specific_data.recent_page;
    setTR((prevData)=>{
      const newData=JSON.parse(JSON.stringify(prevData));
      const study_list=newData.학습;
      if(duplicatable){
        const study_element=getStudyElementTemplateInTR();
        study_element.과목=duplicatable_subject;
        study_element.교재=duplicatable_name;
        study_element.학습시간=studyTime;
        study_list.push(study_element);
      }
      else{
        let study_element=getStudyElementTemplateByTextbookID(textbookID);
        let new_study_element=true;
        for(let i=0; i<study_list.length; i++){
          const cur_study_element=study_list[i];
          const cur_textbook_name=cur_study_element.교재;
          if(textbookID===textbookIDMapping[cur_textbook_name]){
            study_element=cur_study_element;
            new_study_element=false;
            break;
          }
        }
        if((Object.keys(study_element)).length===0) return newData;
        study_element.최근진도=recent_page;
        study_element.학습시간=studyTime;
        if(new_study_element) {
          study_list.push(study_element);
        }
      }
      return newData;
    });
  }
  function getProgramElementTemplateInTR(){
    return {
      프로그램분류:"",
      매니저:"",
      소요시간:"00:00",
      상세내용:"",
    }
  }
  function updateProgramParticipationTimeInTR(request_specific_data,timeAmount){
    const program_by=request_specific_data.program_by;
    const program_by_user_nickname=usernameToUserNickname[program_by];
    const program_description=request_specific_data.program_description;
    const program_name=request_specific_data.program_name;
    setTR((prevData)=>{
      const newData=JSON.parse(JSON.stringify(prevData));
      if(!program_by_user_nickname) return newData;
      const program_list=newData.프로그램;
      const program_element=getProgramElementTemplateInTR();
      program_element.매니저=program_by_user_nickname;
      program_element.상세내용=program_description;
      program_element.프로그램분류=program_name;
      program_element.소요시간=timeAmount;
      program_list.push(program_element);
      return newData;
    });
  }

  // daily goal check log(강의 과제, 진도 교재 완료 여부) 관련 코드
  const [savedDailyGoalCheckLogData,setSavedDailyGoalCheckLogData]= useState([]); //goal check log data in db
  const [AOSIDToSavedGoalStateMapping,setAOSIDToSavedGoalStateMapping]=useState({}); // aosid to state goal state mapping
  const goal_state_template={
    finishedState:true,
    excuse:"",
  }
  function makeAOSIDToSavedGoalStateMapping(savedDailyGoalCheckLogData){
    const newMapping={};
    savedDailyGoalCheckLogData.forEach((e,idx)=>{
      if(!e["AOSID"]) return;
      newMapping[e["AOSID"]]={"finishedState":e["finishedStateList"][0],"excuse":e["excuseList"][0]};
    });
    return newMapping;
  }
  function updateAOSIDToSavedGoalStateMapping(AOSID,finishedState,excuse){
    setAOSIDToSavedGoalStateMapping((prevData)=>{
      const newData= JSON.parse(JSON.stringify(prevData));
      if(!(AOSID in newData)) newData[AOSID]={...goal_state_template};
      const goal_state=newData[AOSID];
      goal_state.finishedState=finishedState;
      goal_state.excuse=excuse;
      return newData;
    });
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
  function updateTextbookIDToSavedGoalStateMapping(TextbookID,finishedState,excuse){
    setTextbookIDToSavedGoalStateMapping((prevData)=>{
      const newData= JSON.parse(JSON.stringify(prevData));
      if(!(TextbookID in newData)) newData[TextbookID]={...goal_state_template};
      const goal_state=newData[TextbookID];
      goal_state.finishedState=finishedState;
      goal_state.excuse=excuse;
      return newData;
    });
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
  function checkStudyTimeOfFinishedLectureAssignment(){ // 완료된 강의 과제에 학습시간이 입력되었는지 확인
    for(let i=0; i<todayAssignments.length; i++) {
      const assignment= todayAssignments[i];
      const AOSID=assignment["AOSID"];
      if(!(AOSID in AOSIDToSavedGoalStateMapping)) continue;
      if(AOSIDToSavedGoalStateMapping[AOSID]["finishedState"]===true){
        if(!(AOSID in assignmentStudyTime) || assignmentStudyTime[AOSID]["학습시간"]==="0:00" || assignmentStudyTime[AOSID]["학습시간"]==="00:00") {
          const newHighlightedLectureAssignments= JSON.parse(JSON.stringify(highlightedLectureAssignments));
          newHighlightedLectureAssignments[assignment["AOSID"]]=true;
          setHighlightedLectureAssignments(newHighlightedLectureAssignments);
          return false;
        }
      }
    }
    return true;
  }
  function checkStudyTimeOfFinishedTextbookAssignment(){ // 완료된 자체 진도 교재에 학습시간이 입력되었는지 확인
    for(let i=0; i<TR.학습.length; i++) {
      const textbookName= TR.학습[i].교재;
      if(!(textbookName in textbookIDMapping)) continue;
      const textbookID= textbookIDMapping[textbookName];
      if(!(textbookID in textbookIDToSavedGoalStateMapping)) continue;
      // 만약 daily goal check log가 tr귀가검사 전에 생기고
      // 그 다음에 같은 교재로 강의과제가 생기는 경우(자동으로 숨겨지게 돼있으므로) 학습시간 검사 안함
      if(checkTextBookOfAssignment(textbookName)) continue; 
      if(textbookIDToSavedGoalStateMapping[textbookID]["finishedState"]===true){
        const textbookStudyTime= TR.학습[i].학습시간;
        if(textbookStudyTime==="0:00" || textbookStudyTime==="00:00") {
          const newHighlightedTextbookAssignments= JSON.parse(JSON.stringify(highlightedTextbookAssignments));
          newHighlightedTextbookAssignments[textbookID]=true;
          setHighlightedTextbookAssignments(newHighlightedTextbookAssignments);
          return false;
        }
      }
    }
    return true;
  }
  function isLectureAssignmentChecked(){ // 강의 과제 완료여부 확인
    for(let i=0; i<todayAssignments.length; i++) {
      const assignment= todayAssignments[i];
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

  //일요일에 그 주 (월~금) daily goal check log 모아 볼 수 있게 하는 코드
  const [thisWeekGoalCheckLog,setThisWeekGoalCheckLog] = useState({}); // key: 강의 과제 이름(교재 있는 경우 교재명, 교재 없는 경우 강의명), value: {0~5(dayindex):[](list of lecture assignments of the day)}
  // dayindex 0~4:monday~friday, 5:sunday
  // const dayIndexArray=[0,1,2,3,4,5,6]; //0:monday, 6:sunday: legacy
  const dayArray=['월','화','수','목','금','일'];
  function processThisWeekGoalCheckLogData(thisWeekGoalCheckLogData){
    const data_copy=JSON.parse(JSON.stringify(thisWeekGoalCheckLogData));
    const ret={};
    const assignmentInfoTemplate={
      isKeyLectureName:false,
    };
    for(let i=0; i<6; i++) assignmentInfoTemplate[i]={
      list:[],
      total_count:0,
      finished_count:0,
    };
    data_copy.forEach((element)=>{
      let log_day = (new Date(element["date"])).getDay();
      log_day= log_day===0? 5: log_day-1;
      element["dayIndex"]= log_day;
      let is_key_lecture_name=false; // assignmentKey값이 강의 이름인지 저장하는 flag
      if(element["textbookName"]){ // textbookName 필드가 있으면 자체 진도 교재 과제, 아닌 경우 강의 과제
        element["assignmentKey"]=element["textbookName"];
      }
      else if(element["AOSTextbookName"]){ // 강의 과제라도 교재를 사용한 경우 key를 교재명으로 한다
        element["assignmentKey"]=element["AOSTextbookName"];
      }
      else{ // 교재를 사용하지 않은 강의 과제인 경우 강의 명을 key로 한다
        element["assignmentKey"]=element["lectureName"];
        is_key_lecture_name=true;
      }

      const assignmentKey= element["assignmentKey"];
      if(!(assignmentKey in ret)) {
        ret[assignmentKey]=JSON.parse(JSON.stringify(assignmentInfoTemplate));
        ret[assignmentKey]["isKeyLectureName"]=is_key_lecture_name;
      }
      const assignmentInfo= ret[assignmentKey];
      const day_index=element["dayIndex"]
      assignmentInfo[day_index]["list"].push(element);
      assignmentInfo[day_index]["total_count"]+=1;
      if(element["finishedState"]===true) assignmentInfo[day_index]["finished_count"]+=1;
    })
    return ret;
  }
  function checkThisWeekGoalCheckLogTableNeeded(){
    return Object.keys(thisWeekGoalCheckLog).length>0;
  }

  //한 주의 학습 요약 표에서 셀 클릭 시 과제 상세를 보여주는 modal 관련 코드
  const [assignmentDescriptionModal,setAssignmentDescriptionModal]= useState(false);
  const displayedAssignmentInfoTemplate={
    date:"", //date string
    day:"", //day string in korean
    assignmentKey:"",
    isKeyLectureName:false,
    assignmentList:[],
    total_assignment_count:0,
    finished_assignment_Count:0,
  };
  const [displayedAssignmentInfo,setDisplayedAssignmentInfo] = useState(displayedAssignmentInfoTemplate);
  const assignmentDescriptionModalOpen= (targetAssignmentInfo)=>{
    setAssignmentDescriptionModal(true);
    setDisplayedAssignmentInfo(targetAssignmentInfo);
  };
  const assignmentDescriptionModalClose= ()=>{
    setAssignmentDescriptionModal(false);
    setDisplayedAssignmentInfo(displayedAssignmentInfoTemplate);
  };
  function getPercentage(dividend,divisor){
    return (Math.round(dividend/divisor*1000))/10;
  }

  //수업 및 일반교재 학습 기입 관련 코드
  function getTextbookVolumeFromTextbookName(textbookName){
    let ret=""
    for(let i=0; i<stuDB.진행중교재.length; i++){
      const book=stuDB.진행중교재[i];
      if(book["교재"]===textbookName){
        ret=book["총교재량"];
        break;
      }
    }
    return ret;
  }
  function getRecentPageFromTextbookName(textbookName){
    let ret=0;
    for(let i=0; i<stuDB.진행중교재.length; i++){
      const book=stuDB.진행중교재[i];
      if(book["교재"]===textbookName){
        ret=book["최근진도"];
        break;
      }
    }
    return ret;
  }
  const [validTextbookNames,setValidTextbookNames]=useState([]);
  function getValidTextbookNameListForTextbookStudyTable(){
    const textbook_name_set=new Set();
    stuDB.진행중교재.forEach((book,idx)=>{
      textbook_name_set.add(book["교재"]);
    });
    TR.학습.forEach((element,idx)=>{
      textbook_name_set.add(element["교재"]);
    })
    return [...textbook_name_set];
  }

  //TR Draft request 관련 코드
  const draft_request_type_name_to_index={
    "lifeData":0,
    "AssignmentStudyData":1,
    "LectureAndTextbookStudyData":2,
    "ProgramParticipationData":3,
  }
  const draft_request_status_to_index={
    "created":0,
    "review_needed":1,
    "confirmed":2,
    "expired":3,
  };
  const draft_written_to_TR_status_to_index={
    "not_written":0,
    "written":1,
    "passed":2
  };
  const [draftRequestData,setDraftRequestData]=useState([]);
  const [draftOverwriteReady,setDraftOverwriteReady]=useState({
    "textbook":false,
    "assignment":false,
    "assignmentStudyTime":false,
    "dailyGoalCheckLog":false,
    "TR":false,
    "managerList":false,
    "draftRequest":false,
  });
  const [draftOverwritingDone,setDraftOverwritingDone]=useState(false);
  const [draftWritten,setDraftWritten]= useState({});
  const [usernameToUserNickname,setUsernameToUserNickname]= useState({});
  function updateDraftOverwriteReady(fieldName,value){
    setDraftOverwriteReady((prevData)=>{
      const newDraftOverwriteReady={...prevData};
      newDraftOverwriteReady[fieldName]=value;
      return newDraftOverwriteReady;
    });
  }
  function checkDraftOverwriteAllReady(){
    const field_names=Object.keys(draftOverwriteReady);
    for(let i=0; i<field_names.length; i++){
      const field_name=field_names[i];
      if(!draftOverwriteReady[field_name]) return false;
    }
    return true;
  }
  function updateDraftWritten(TDRR_id){
    setDraftWritten((prevData)=>{
      const newDraftWrittenData={...prevData};
      newDraftWrittenData[TDRR_id]=true;
      return newDraftWrittenData;
    });
  }
  function getWrittenTDRIDList(){
    return Object.keys(draftWritten).filter((TDR_id)=>draftWritten[TDR_id]);
  }

  //get draft request data approved but not written to TR document
  useEffect(async ()=>{
    if(today!==paramDate) return;
    const not_written_request_data=await axios
      .post("/api/getNotWrittenTRDraftRequests",{studentLegacyID:paramID,date:paramDate})
      .then((result)=>{
        const data=result.data;
        if(!data.success) throw new Error(`네트워크 에러`);
        return data.ret;
      })
      .catch((err)=>{
        console.log(`err while getting not written: ${err}`);
        window.alert(`네트워크 오류로 데이터를 불러오지 못했습니다:1`);
        window.location.reload();
        return [];
      });
    // console.log(`not written request data: ${JSON.stringify(not_written_request_data)}`);
    setDraftRequestData(not_written_request_data);
    updateDraftOverwriteReady("draftRequest",true);
  },[paramDate]);

  //check data needed for overwriting study data w.r.t. draft request data is ready and do overwrite
  useEffect(async ()=>{
    // console.log(`draft overwrite ready flag: ${JSON.stringify(draftOverwriteReady)}`);
    if(!checkDraftOverwriteAllReady() || draftOverwritingDone) return;
    // console.log(`draft overwrite all ready!`);
    //do overwrite here
    //type0
    for(let i=0; i<draftRequestData.length; i++){
      const draft_request=draftRequestData[i];
      const TDRR_id=draft_request._id;
      const draft_confirmed=draft_request.request_status===draft_request_status_to_index["confirmed"];
      if(draft_request.request_type!==draft_request_type_name_to_index["lifeData"] || !draft_confirmed) continue;
      const request_specific_data=draft_request.request_specific_data;
      const body_condition=request_specific_data.신체컨디션;
      const sentiment_condition=request_specific_data.정서컨디션;
      const wake_up_time=request_specific_data.실제기상;
      const go_to_bed_time=request_specific_data.실제취침;
      const come_to_center_time=request_specific_data.실제등원;
      setTR((prevData)=>{
        const newTR=JSON.parse(JSON.stringify(TR));
        newTR.신체컨디션=body_condition;
        newTR.정서컨디션=sentiment_condition;
        newTR.실제기상=wake_up_time;
        newTR.실제취침=go_to_bed_time;
        newTR.실제등원=come_to_center_time;
        return newTR;
      });
      updateDraftWritten(TDRR_id);
    }
    //type1
    for(let i=0; i<draftRequestData.length; i++){
      const draft_request=draftRequestData[i];
      const TDRR_id=draft_request._id;
      const draft_confirmed=draft_request.request_status===draft_request_status_to_index["confirmed"];
      if(draft_request.request_type!==draft_request_type_name_to_index["AssignmentStudyData"] || !draft_confirmed) continue;
      const request_specific_data=draft_request.request_specific_data;
      const study_data=draft_request.study_data;
      const finished_state=study_data.finished_state;
      const study_time=study_data.time_amount;
      const excuse=study_data.excuse;
      const AOSID=request_specific_data.AOSID;
      
      //study data
      updateAssignmentStudyTime(AOSID,study_time);
      updateAssignmentStudyTimeInTR(AOSID,study_time);
      //finished state
      updateAOSIDToSavedGoalStateMapping(AOSID,finished_state,excuse);
      updateDraftWritten(TDRR_id);
    }

    //type2
    for(let i=0; i<draftRequestData.length; i++){
      const draft_request=draftRequestData[i];
      const TDRR_id=draft_request._id;
      const draft_confirmed=draft_request.request_status===draft_request_status_to_index["confirmed"];
      if(draft_request.request_type!==draft_request_type_name_to_index["LectureAndTextbookStudyData"] || !draft_confirmed) continue;
      const request_specific_data=draft_request.request_specific_data;
      const duplicatable=request_specific_data.duplicatable;
      const textbookID=request_specific_data.textbookID;
      const study_data=draft_request.study_data;
      const finished_state=study_data.finished_state;
      const study_time=study_data.time_amount;
      const excuse=study_data.excuse;
      
      //study data
      updateLATStudyTimeInTR(request_specific_data,study_time);
      //finished state
      if(!duplicatable) updateTextbookIDToSavedGoalStateMapping(textbookID,finished_state,excuse);
      updateDraftWritten(TDRR_id);
    }
    
    //type3
    for(let i=0; i<draftRequestData.length; i++){
      const draft_request=draftRequestData[i];
      const TDRR_id=draft_request._id;
      const draft_confirmed=draft_request.request_status===draft_request_status_to_index["confirmed"];
      if(draft_request.request_type!==draft_request_type_name_to_index["ProgramParticipationData"] || !draft_confirmed) continue;
      const request_specific_data=draft_request.request_specific_data;
      const study_data=draft_request.study_data;
      const study_time=study_data.time_amount;
      
      //program participation data
      updateProgramParticipationTimeInTR(request_specific_data,study_time);
      updateDraftWritten(TDRR_id);
    }

    recalculateStudyAndProgramTime();
    setDraftOverwritingDone(true);
  },[draftOverwriteReady]);

  // useEffect(()=>{
  //   console.log(`ast: ${JSON.stringify(assignmentStudyTime)}`);
  // },[assignmentStudyTime]);

  // useEffect(()=>{
  //   console.log(`draft written: ${JSON.stringify(draftWritten)}`);
  // },[draftWritten])

  useEffect(async () => {
    // 오늘 마감인 해당 학생의 강의 과제를 가져온다 (post 방식 사용)
    const requestArgument = { studentID: paramID, today_date: paramDate };
    let todayAssignmentData = await axios
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
    todayAssignmentData = processTodayAssignmentData(todayAssignmentData);
    // console.log("twad:"+JSON.stringify(todayAssignmentData));
    setTodayAssignments(todayAssignmentData);
    updateDraftOverwriteReady("assignment",true);
    // console.log("created description:"+getDescriptionStringFromAssignment(todayAssignmentData[0]));
    // console.log("check: ", todayAssignmentData);

    //자체 진도 교재 중 강의에서 사용중인 교재를 걸러내기 위한 state
    setTextbookOfAssignment(getTextbookOfAssignmentFromTodayAssignments(todayAssignmentData));

    const newstuDB = await axios
        .get(`/api/StudentDB/${paramID}`)
        .then((result) => {
          const data=result.data;
          if (result.data === "로그인필요") {
            window.alert("로그인이 필요합니다.");
            return history.push("/");
          }
          else if(data.success===true) return data.ret;
          else throw new Error(data.ret);
        // return result["data"];
        })
        .catch((err) => {
          return err;
        });
    setstuDB(newstuDB);

    const newTR = await axios
        .get(`/api/TR/${paramID}/${paramDate}`)
        .then((result) => {
          const data=result.data;
          if(data.success===true) return data.ret;
          else throw new Error(data.ret);
          // return result["data"];
        })
        .catch((err) => {
          console.log(`error while getting prev TR data: ${err}`);
          window.alert(`네트워크 오류로 데이터를 불러오는데 실패했습니다:1`);
          window.location.reload();
          return err;
        });
    await setTR(newTR);
    updateDraftOverwriteReady("TR",true);
    if(checkTRAssignmentStudyTimeEmpty()) {
      // console.log(`no ast breakpoint`);
      updateDraftOverwriteReady("assignmentStudyTime",true);
    }

    if ("수강중강의" in newstuDB) {
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

    isInitialMount.current = false;
  }, [paramDate]);

  //get manager in same group with student legacy ID
  useEffect(async ()=>{
    const id_to_nickname_list= await axios
      .post("/api/managerListByStudentLegacyID",{studentLegacyID:paramID})
      .then((result)=>{
        const data=result.data;
        if(!data.success) throw new Error(`error while getting manager list:0`);
        return data.ret;
      })
      .catch((err)=>{
        console.log(`err: ${err}`);
        window.alert(`네트워크 오류로 데이터를 불러오지 못했습니다:1`);
        window.location.reload();
      });
    const itn_map={reverse:{}};
    id_to_nickname_list.forEach((e,idx)=>{
      itn_map[e.username]=e.nickname;
      itn_map.reverse[e.nickname]=e.username;
    });
    setUsernameToUserNickname(itn_map);
    setmanagerList(id_to_nickname_list.map(e=>e.nickname));
    updateDraftOverwriteReady("managerList",true);
  },[]);

  //하나의 변수(paramDate)를 지켜보면서 load 해오는 데이터 코드가 너무 많아서 useEffect 하나 더 만듦(thread사용 등의 이유로 속도 올리기 위함)
  useEffect(async()=>{
    const newSavedDailyGoalCheckLogData = await axios.get(`/api/SavedDailyGoalCheckLogData/${paramID}/${paramDate}`)
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
    // console.log(`aosid to ~ ${JSON.stringify(makeAOSIDToSavedGoalStateMapping(newSavedDailyGoalCheckLogData))}`);
    setTextbookIDToSavedGoalStateMapping(makeTextbookIDToSavedGoalStateMapping(newSavedDailyGoalCheckLogData));
    updateDraftOverwriteReady("dailyGoalCheckLog",true);
    // console.log("mapping: "+JSON.stringify(makeAOSIDToSavedGoalStateMapping(newSavedDailyGoalCheckLogData)));
    // console.log("mapping2: "+JSON.stringify(makeTextbookIDToSavedGoalStateMapping(newSavedDailyGoalCheckLogData)));
  },[paramDate]);

  useEffect(()=>{ //TREdit에서는 TRWrite과 다르게 이전에 작성되어있는 TR.강의과제학습 을 받아쓰기 위해 사용한 useEffect
    //강의 과제 학습 시간도 TR.실제학습시간에 반영하기 위한 state
    const newAssignmentStudyTime= "강의과제학습" in TR? JSON.parse(JSON.stringify(TR.강의과제학습)) : {};
    todayAssignments.map((assignment,idx)=>{
      if(assignment["AOSID"] in newAssignmentStudyTime) return;
      newAssignmentStudyTime[assignment["AOSID"]]= getAssignmentStudyTimeElementFromAssignmentData(assignment);
    });
    setAssignmentStudyTime(newAssignmentStudyTime);
    if(draftOverwriteReady.TR && !draftOverwriteReady.assignmentStudyTime) updateDraftOverwriteReady("assignmentStudyTime",true);
    // console.log("ast: "+JSON.stringify(newAssignmentStudyTime));
  },[TR.강의과제학습]);

  //deprecated: 이번주에 해당하는 weeklystudyfeedback documnent, 그리고 "TR.진행중교재.최근진도"를 가져와서 state "thisweekGoal", "thisWeekProgress"에 저장하는 함수
  async function setGoalsAndGetProgress() {
    const newthisweekGoal = await axios
        .get(`/api/Weeklystudyfeedback/${paramID}/${formatDate(getThisWeek(formatDate(paramDate))[1])}`)
        .then((result) => {
          if (result["data"] !== null) {
            // console.log(result["data"]["thisweekGoal"]);
            return result["data"]["thisweekGoal"];
          }
          return null;
        })
        .catch((err) => {
          return err;
        });
    if(newthisweekGoal) {
      // console.log("twg: "+JSON.stringify(newthisweekGoal));
      await setthisweekGoal(newthisweekGoal);
      await settodayGoal(newthisweekGoal[getDayString()]);
    }
    // if (newthisweekGoal && newthisweekGoal.hasOwnProperty(TR["요일"][0])) {
    //   await settodayGoal(newthisweekGoal[getDayString()]);
    // }
    /*let newThisWeekProgress=await getThisWeekProgress();
    console.log('before set this~: '+JSON.stringify(newThisWeekProgress));
    await setThisWeekProgress(newThisWeekProgress);
    console.log('after set this~: '+JSON.stringify(thisWeekProgress));*/
    await getThisWeekProgress();
    //collectBookNamesFromProgressAndGoal();
  }

  useEffect(async () => {
    if (!isInitialMount.current) {
      const newTR = JSON.parse(JSON.stringify(TR));
      const trDate = new Date(TR.날짜);
      const ls = ["일", "월", "화", "수", "목", "금", "토"];
      newTR["요일"] = ls[trDate.getDay()] + "요일";
      await setTR(newTR);
    }

    const newthisweek = getThisWeek(TR.날짜);
    let sameweek = true;
    for (let i = 0; i < newthisweek.length; i++) {
      if (newthisweek[i].getTime() != thisweek[i].getTime()) {
        sameweek = false;
        break;
      }
    }
    if (!sameweek) {
      await setthisweek(newthisweek);
    }
  }, [TR.날짜]);

  // useEffect(async () => {
  //   await setGoalsAndGetProgress();
  // }, [thisweek]);

  useEffect(async()=>{
    const date=new Date(paramDate);
    getGoals();
    if(checkTodayIsSunday()){
      getThisWeekProgress();
      //이번주 각 과제에 대한 완료 확인 로그를 가져온다
      const this_week_strings=getThisWeekStrings(paramDate);
      const log_query_payload= {fromDate:this_week_strings[0], toDate:this_week_strings[1], studentLegacyID:paramID};
      const thisWeekGoalCheckLogData= await axios.post("/api/DailyGoalCheckLogByDateRange",log_query_payload)
          .then((result) => {
            const find_result= result["data"];
            if(find_result["success"]) return find_result["ret"];
            else return [];
          })
          .catch((err) => {
            console.log(err);
          });
      setThisWeekGoalCheckLog(processThisWeekGoalCheckLogData(thisWeekGoalCheckLogData));
    }
  },[paramDate]);

  useEffect(()=>{ // this week goal, this week progress state로부터 교재명, 교재 분량 모으는 effect
    collectBookNamesFromProgressAndGoal();
  },[thisweekGoal,thisWeekProgress]);

  useEffect(() => {
    setTR((prevData)=>{
      const newTR=JSON.parse(JSON.stringify(prevData));
      ["취침", "기상", "등원", "귀가"].forEach((a) => {
        newTR[`${a}차이`] = 차이계산(newTR[`목표${a}`], newTR[`실제${a}`]);
      });
      newTR.학습차이 = Math.round((TR.실제학습 - TR.목표학습) * 10) / 10;
      newTR.센터활용률 = Math.round(((newTR.프로그램시간 + newTR.실제학습) / newTR.센터내시간) * 1000) / 10;
      newTR.센터학습활용률 = Math.round((newTR.실제학습 / newTR.센터내시간) * 1000) / 10;
      return newTR
    });
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
    setTR((prevData)=>{
      const newTR=JSON.parse(JSON.stringify(prevData));
      newTR.센터내시간 = centerTimeDiff(newTR.실제귀가, newTR.실제등원);
      return newTR
    });
  }, [
    TR.실제등원,
    TR.실제귀가,
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

  useEffect(()=>{
    if("진행중교재" in stuDB && "학습" in TR){
      setValidTextbookNames(getValidTextbookNameListForTextbookStudyTable());
    }
  },[stuDB.진행중교재,TR.학습]);

  //귀가 피드백 textarea placeholder string
  const gohome_feedback_placeholder="학생과 대화하며 자신의 하루를 돌아보고\n"+
      "어떻게 하면 더 성장할 수 있을지\n"+
      "잠시라도 고민할 수 있게 한다면 좋은 귀가 피드백입니다.\n"+
      "\n"+
      "- 오늘 스스로를 칭찬해 볼만한 것은?\n"+
      "- 오늘 배운 점이 있다면?\n"+
      "- 오늘 목표를 지키지 못했다면 어떤 점이 부족했을까?\n"+
      "- 내일 꼭 개선해야 된다고 생각하는 부분은?\n"+
      "등 학생이 스스로에 대해 돌아볼 수 있는 질문을 많이 던져 주시고, 기록해 주시면 됩니다.\n";

  return (
      <div className="trEdit-background">
        {/*당일 과제 미완료 사유 작성 modal*/}
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
                value={currentExcuseInfo.excuse}
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

        {/*한 주 학습 요약 표에서 특정 셀 정보 보여주는 modal*/}
        <Modal show={assignmentDescriptionModal} onHide={assignmentDescriptionModalClose} scrollable={true}>
          <Modal.Header closeButton>
            <Modal.Title>과제 상세</Modal.Title>


          </Modal.Header>
          <Modal.Body className="text-center">
            <div className="square border-bottom border-dark border-3 mb-3">
              <div className="row mb-2">
                <div className="col-3">{displayedAssignmentInfo["isKeyLectureName"]?"강의명":"교재명"}</div>
                <div className="col-9">{displayedAssignmentInfo["assignmentKey"]}</div>
              </div>
              <div className="row mb-2">
                <div className="col-3">날짜</div>
                <div className="col-9">{displayedAssignmentInfo["date"]} ({displayedAssignmentInfo["day"]})</div>
              </div>
              <div className="row mb-2">
                <div className="col-3">과제 완료율</div>
                <div className="col-9">{displayedAssignmentInfo["finished_assignment_count"]} / {displayedAssignmentInfo["total_assignment_count"]}
                  &nbsp;&nbsp;({getPercentage(displayedAssignmentInfo["finished_assignment_count"],displayedAssignmentInfo["total_assignment_count"])} %)</div>
              </div>
            </div>
            {
              displayedAssignmentInfo["assignmentList"].map((displayedAssignment,idx)=>{
                return (
                    <div className={"square border-bottom border-3 mb-3" + " " + (displayedAssignment["finishedState"]===true?"AssignmentChecked":"AssignmentNotFinished")}>
                      <div className="row mb-2">
                        <div className="col-3">과제 구분</div>
                        {/* {<div className="col-9">{displayedAssignment?displayedAssignment["lectureName"]:null}</div>} */}
                        <div className="col-9">{("textbookName" in displayedAssignment)?"자체 진도 교재":"강의 과제"}</div>
                      </div>

                      {("lectureName" in displayedAssignment)?(
                          <div className="row mb-2">
                            <div className="col-3">강사명</div>
                            {/* {<div className="col-9">{displayedAssignment?displayedAssignment["lectureName"]:null}</div>} */}
                            <div className="col-9">{displayedAssignment["lectureManager"]}</div>
                          </div>
                      ):null}

                      {("lectureName" in displayedAssignment)?(
                          <div className="row mb-2">
                            <div className="col-3">강의명</div>
                            {/* {<div className="col-9">{displayedAssignment?displayedAssignment["lectureName"]:null}</div>} */}
                            <div className="col-9">{displayedAssignment["lectureName"]}</div>
                          </div>
                      ):null}

                      <div className="row mb-2">
                        <div className="col-3">완료여부</div>
                        {/* {<div className="col-9">{displayedAssignment?displayedAssignment["duedate"]:null}</div>} */}
                        <div className="col-9">{(displayedAssignment["finishedState"]===true)?"완료":"미완료"}</div>
                      </div>

                      {/*자체 진도 교재의 범위(~까지)를 보여준다*/}
                      {/* {console.log("reading undefined:"+JSON.stringify(thisweekGoal[displayedAssignmentInfo["day"]]))?null:null} */}
                      {/* {console.log("twg in modal:"+JSON.stringify(thisweekGoal))?null:null} */}
                      {("textbookName" in displayedAssignment) && (displayedAssignment["textbookName"] in thisweekGoal[displayedAssignmentInfo["day"]]) &&
                      (thisweekGoal[displayedAssignmentInfo["day"]][displayedAssignment["textbookName"]])?
                          (
                              <div className="row mb-2">
                                <div className="col-3">범위(~까지)</div>
                                {/* {<div className="col-9">{displayedAssignment?displayedAssignment["lectureName"]:null}</div>} */}
                                <div className="col-9">{thisweekGoal[displayedAssignmentInfo["day"]][displayedAssignment["textbookName"]]}</div>
                              </div>
                          ):null
                      }

                      {/*페이지 범위 있는 강의 과제의 페이지 범위를 보여준다*/}
                      {("pageRangeArray" in displayedAssignment) && displayedAssignment["pageRangeArray"][0][0]?
                          (<>
                            {displayedAssignment["pageRangeArray"].map((range,idx)=>{
                              if(idx>0){
                                return (<div className="row mb-2">
                                      <div className="col-3">-</div>
                                      <div className="col-9">{displayedAssignment["pageRangeArray"][idx][0]} ~ {displayedAssignment["pageRangeArray"][idx][1]}</div>
                                    </div>
                                );
                              }
                              else{
                                return (
                                    <div className="row mb-2" key={idx}>
                                      <div className="col-3">과제 범위</div>
                                      <div className="col-9" key={idx}>{displayedAssignment["pageRangeArray"][idx][0]} ~ {displayedAssignment["pageRangeArray"][idx][1]}</div>
                                    </div>
                                );
                              }
                            })}
                          </>):null
                      }

                      {/*강의 과제 세부사항이 있는 경우 세부사항을 보여준다*/}
                      {("assignmentDescription" in displayedAssignment) && displayedAssignment["assignmentDescription"]?(
                          <div className="row mb-2">
                            <div className="col-3">과제 세부 사항</div>
                            {/* {<div className="col-9">{displayedAssignment?displayedAssignment["lectureName"]:null}</div>} */}
                            <div className="col-9">{displayedAssignment["assignmentDescription"]}</div>
                          </div>
                      ):null
                      }

                      {displayedAssignment["finishedState"]===false?(<div className="row mb-2">
                        <div className="col-3">미완료 사유</div>
                        {/* {<div className="col-9">{displayedAssignment?displayedAssignment["description"]:null}</div>} */}
                        <div className="col-9">{displayedAssignment["excuse"]}</div>
                      </div>):null}

                      {/* {{displayedAssignment["textbookName"]?
                  (<div className="row mb-2">
                    <div className="col-3">사용 교재</div>
                    <div className="col-9">{displayedAssignment["textbookName"]}</div>
                  </div>)
                  :
                  null}

                  {displayedAssignment["pageRangeArray"][0][0]?
                  (<>
                    {displayedAssignment["pageRangeArray"].map((range,idx)=>{
                      if(idx>0){
                        return (<div className="row mb-2">
                          <div className="col-3">-</div>
                          <div className="col-9">{displayedAssignment["pageRangeArray"][idx][0]} ~ {displayedAssignment["pageRangeArray"][idx][1]}</div>
                          </div>
                        );
                      }
                      else{
                        return (
                          <div className="row mb-2" key={idx}>
                            <div className="col-3">과제 범위</div>
                            <div className="col-9" key={idx}>{displayedAssignment["pageRangeArray"][idx][0]} ~ {displayedAssignment["pageRangeArray"][idx][1]}</div>
                          </div>
                        );
                      }
                    })}

                  </>)
                  :
                  null}} */}
                    </div>
                )
              })
            }

          </Modal.Body>
        </Modal>

        <div className="row">
          <div className="col-xl-6 trCol">
            <div>
              <div className="row m-0 trCard">
                <div className="col-2">
                  <p className="fw-bold mt-1">[ 이름 ]</p>
                  <p>{TR.이름}</p>
                </div>
                <div className="col-2">
                  <p className="fw-bold mt-1">[ 날짜 ]</p>
                  <input
                      type="date"
                      value={TR.날짜}
                      className="w-100"
                      onChange={(e) => {
                        change_depth_one("날짜", e.target.value);
                      }}
                  />
                </div>
                <div className="col-2 pe-0">
                  <Button
                      variant="secondary"
                      className="btn-commit btn-attend"
                      onClick={() => {
                        change_depth_one("결석여부", false);
                        // console.log(TR);
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
                        change_depth_one("결석여부", "등원예정");
                        // console.log(TR);
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
                          change_depth_one("결석여부", true);
                          // console.log(TR);
                        }
                      }}
                  >
                    <strong>미등원</strong>
                  </Button>
                </div>

                <div className="col-2 p-0 borderline">
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
                  <Form.Check
                      className="schoolAttendingCheck"
                      type="checkbox"
                      label="학생 등교 시 체크"
                      checked={TR["등교"]}
                      onChange={(e) => {
                        let newTR = JSON.parse(JSON.stringify(TR));
                        newTR["등교"] = e.target.checked;
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
                            <option value="선택">선택</option>
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
                                <td align="center">
                                  {/* <TimePicker
                                      locale="sv-sv"
                                      value={TR[`목표${a}`]}
                                      openClockOnFocus={false}
                                      clearIcon={null}
                                      clockIcon={null}
                                      onChange={(value) => {
                                        change_depth_one(`목표${a}`, value);
                                      }}
                                  ></TimePicker> */}
                                  <Form.Control
                                    type="time"
                                    className="TimePicker-box"
                                    value={TR[`목표${a}`]}
                                    disabled={true}
                                    onChange={(value) => {
                                      change_depth_one(`목표${a}`, value);
                                    }}
                                  />
                                </td>

                                <td>
                                  {/* <TimePicker
                                      className="timepicker"
                                      locale="sv-sv"
                                      value={TR[`실제${a}`]}
                                      openClockOnFocus={false}
                                      clearIcon={null}
                                      clockIcon={null}
                                      onChange={(value) => {
                                        change_depth_one(`실제${a}`, value);
                                      }}
                                  ></TimePicker> */}
                                  <Form.Control
                                    type="time"
                                    className="TimePicker-box"
                                    value={TR[`실제${a}`]}
                                    onChange={(e) => {
                                      const value=e.target.value;
                                      change_depth_one(`실제${a}`, value);
                                    }}
                                  />
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
                      <h4><strong>강의 과제</strong></h4>
                      {
                        checkLectureAssignmentExists()?
                            (
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
                                  {todayAssignments.map(function (a, i) {
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
                                                    placement="auto-start"
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
                                                  // console.log("timepicker value: "+value);
                                                  if(!value) value="0:00";
                                                  const newAST=JSON.parse(JSON.stringify(assignmentStudyTime));
                                                  if(!(a["AOSID"] in newAST)) newAST[a["AOSID"]]=getAssignmentStudyTimeElementFromAssignmentData(a);
                                                  newAST[a["AOSID"]]["학습시간"]=value;
                                                  // console.log("newAST: "+JSON.stringify(newAST));
                                                  setAssignmentStudyTime(newAST);

                                                  //전체 학습시간 업데이트
                                                  const newTR = JSON.parse(JSON.stringify(TR));
                                                  let 실제학습시간 = 0;
                                                  let 실제학습분 = 0;
                                                  const astKeys= Object.keys(newAST);
                                                  for(let i=0; i<astKeys.length; i++){
                                                    const studyTime=newAST[astKeys[i]];
                                                    // console.log("studytime: "+JSON.stringify(studyTime));
                                                    실제학습시간 += parseInt(studyTime["학습시간"].split(":")[0]);
                                                    실제학습분 += parseInt(studyTime["학습시간"].split(":")[1]);
                                                  }
                                                  // console.log("breakpoint");
                                                  newTR.학습.map(function (b, j) {
                                                    if (b.학습시간) {
                                                      // console.log("b: "+JSON.stringify(b));
                                                      실제학습시간 += parseInt(b.학습시간.split(":")[0]);
                                                      실제학습분 += parseInt(b.학습시간.split(":")[1]);
                                                    }
                                                  });
                                                  // console.log("hour:"+실제학습시간);
                                                  // console.log("minute:"+실제학습분);
                                                  newTR.실제학습 = Math.round((실제학습시간 + 실제학습분 / 60) * 10) / 10;
                                                  newTR["강의과제학습"]=newAST; // this line is necessary!: only needed in TREdit file
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
                                                  const prev_excuse=getDGCLExcuseFromAOSID(assignmentData.AOSID);
                                                  console.log(`prev excuse: ${prev_excuse}`);
                                                  const dailyGoalCheckLogData=getDailyGoalCheckLogDataFromAssignment(assignmentData,false,prev_excuse);
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
                            ) :
                            (
                                <p>
                                  <strong>오늘 마감인 수업 과제가 없습니다</strong>
                                </p>
                            )
                      }
                    </div>

                    <div className="trCard">
                      <h4><strong>수업 및 일반교재</strong></h4>
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
                        {TR.학습.map((a, i)=> {
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
                                          }
                                        }
                                      }}
                                  >
                                    <FaTrash></FaTrash>
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
                                        const textbook_name=e.target.value;
                                        const textbook_volume=getTextbookVolumeFromTextbookName(textbook_name);
                                        const textbook_recent_page=getRecentPageFromTextbookName(textbook_name);
                                        const newTR=JSON.parse(JSON.stringify(TR));
                                        newTR.학습[i].교재=textbook_name;
                                        newTR.학습[i].총교재량=textbook_volume;
                                        newTR.학습[i].최근진도=textbook_recent_page;
                                        setTR(newTR);
                                        // change_depth_three("학습", i, "교재", textbook_name);
                                      }}
                                  >
                                    <option value="선택">선택</option>
                                    {/* {stuDB.진행중교재.map(function (book, index) {
                                      return (
                                          <option value={book.교재} key={index}>
                                            {book.교재}
                                          </option>
                                      );
                                    })} */}
                                    {
                                      validTextbookNames.map((textbook_name,idx)=>{
                                        return (
                                          <option value={textbook_name} key={idx}>
                                            {textbook_name}
                                          </option>
                                        );
                                        })
                                    }
                                    <option value="모의고사">모의고사</option>
                                    <option value="테스트">테스트</option>
                                    <option value="기타">기타</option>
                                  </Form.Select>
                                </td>
                                <td>
                                  <p className="fs-13px">{a.총교재량}</p>
                                </td>
                                <td>
                                  <p className="fs-13px">{todayGoal ? todayGoal[a.교재] : null}</p>
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
                                        if(!value) value="0:00";
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
                                          const prev_excuse=getDGCLExcuseFromTextbookID(textbookID);
                                          const dailyGoalCheckLogData=getDailyGoalCheckLogDataFromTextbookName(textbookName,false,prev_excuse);
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
                    {/*일간 TR 내 주간 학습 계획*/}
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
              {checkTodayIsSunday() ? (
                  <div mt-3>
                    <div className="trCard">
                      {checkWeekProgressTableNeeded() ? (
                          <Table striped hover size="sm" className="mt-3">
                            <thead>
                            <th width="30%">교재명</th>
                            {weekDays.map((day, dayIndex) => {
                              return (
                                  <th key={dayIndex} width="10%">
                                    {day}
                                  </th>
                              );
                            })}
                            </thead>
                            <tbody>
                            {bookNamesList.map((bookName, bookNameIndex) => {
                              return (
                                  <tr key={bookNameIndex}>
                                    <td>
                                      <p m-0="true">
                                        <strong>
                                          {bookName} {bookVolumeDictionary[bookName] ? `(총 ${bookVolumeDictionary[bookName]})` : null}
                                        </strong>
                                      </p>
                                    </td>
                                    {weekDays.map((day, dayIndex) => {
                                      return (
                                          <td key={dayIndex}>
                                            <div className="studyPercentageBox">
                                              <p>
                                                <strong>
                                                  {getProgressFromDayAndBook(day + "요일", bookName) ? getProgressFromDayAndBook(day + "요일", bookName) : "-"}
                                                </strong>
                                                /{thisweekGoal && getGoalFromDayAndBook(day, bookName) ? getGoalFromDayAndBook(day, bookName) : "-"}
                                              </p>
                                            </div>
                                          </td>
                                      );
                                    })}
                                  </tr>
                              );
                            })}
                            </tbody>
                          </Table>
                      ) : (
                          <p>
                            <strong>이번 주 학습 목표, 학습 진행 상황이 없습니다</strong>
                          </p>
                      )}
                    </div>
                  </div>
              ) : null}

              {checkTodayIsSunday() ? (
                  <div mt-3>
                    <div className="trCard">
                      {checkThisWeekGoalCheckLogTableNeeded() ? (
                          <>
                            <h4><strong>이번 주 학습 요약</strong></h4>
                            <Table striped hover size="sm" className="mt-3">
                              <thead>
                              <th width="30%">교재명/강의명</th>
                              {dayArray.map((day, dayIndex) => {
                                if(day==="일") return null; // 현재는 일요일을 표시하지 않음
                                return (
                                    <th key={dayIndex} width="10%">
                                      {day}
                                    </th>
                                );
                              })}
                              </thead>
                              <tbody>
                              {Object.keys(thisWeekGoalCheckLog).map((assignmentKey, aidx) => {
                                return (
                                    <tr key={aidx}>
                                      <td>
                                        <p m-0="true">
                                          <strong>
                                            {assignmentKey}
                                          </strong>
                                        </p>
                                      </td>
                                      {dayArray.map((day, day_idx) => {
                                        if(day==="일") return null; // 현재는 일요일을 표시하지 않음
                                        const assignments_list= thisWeekGoalCheckLog[assignmentKey][day_idx]["list"];
                                        if(assignments_list.length===0){
                                          return (
                                              <td key={day_idx} className="NoGoal">
                                                <div className="studyPercentageBox">
                                                  <p>
                                                  </p>
                                                </div>
                                              </td>
                                          );
                                        }
                                        let td_base_class_name= "onHoverHighlighted";
                                        let td_class_name= "";

                                        const assignment_count=thisWeekGoalCheckLog[assignmentKey][day_idx]["total_count"];
                                        const finished_count=thisWeekGoalCheckLog[assignmentKey][day_idx]["finished_count"];
                                        if(finished_count===assignment_count) td_class_name="GoalFinished";
                                        else if(finished_count===0) td_class_name="GoalNotFinished";
                                        else{
                                          const over_five_fraction= Math.floor(Math.round(finished_count/assignment_count*10)/2);
                                          td_class_name=`GoalFinished_${over_five_fraction}_of_5`;
                                        }
                                        td_class_name+=" "+td_base_class_name;
                                        // console.log("something: "+JSON.stringify(thisWeekGoalCheckLog[assignmentKey]));
                                        return (
                                            <td
                                                key={day_idx}
                                                className={td_class_name}
                                                onClick={()=>{
                                                  const assignmentInfo= JSON.parse(JSON.stringify(displayedAssignmentInfoTemplate));
                                                  assignmentInfo["day"]=day;
                                                  assignmentInfo["date"]=getDateStringByDayIndex(day_idx);
                                                  assignmentInfo["assignmentKey"]=assignmentKey;
                                                  assignmentInfo["isKeyLectureName"]=thisWeekGoalCheckLog[assignmentKey]["isKeyLectureName"];
                                                  assignmentInfo["assignmentList"]=assignments_list;
                                                  assignmentInfo["total_assignment_count"]=assignment_count;
                                                  assignmentInfo["finished_assignment_count"]=finished_count;

                                                  assignmentDescriptionModalOpen(assignmentInfo);
                                                }}
                                            >
                                              <div className="studyPercentageBox">
                                                <p>
                                                </p>
                                              </div>
                                            </td>
                                        );
                                      })}
                                    </tr>
                                );
                              })}
                              </tbody>
                            </Table>
                          </>
                      ) : (
                          <p>
                            <strong>이번 주 학습 목표, 학습 진행 상황이 없습니다</strong>
                          </p>
                      )}
                    </div>
                  </div>
              ) : null}
            </div>
          </div>
          {/* <div className="col-xl-2 trCol">
          <div className="trCard">
            <p className="fw-bold mt-3 mb-3">
              <strong>[ 문제행동 ]</strong>
            </p>
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
                      placeholder={gohome_feedback_placeholder}
                      value={TR.매니저피드백}
                      onChange={(e) => {
                        change_depth_one("매니저피드백", e.target.value);
                      }}
                  ></textarea>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </div>

            <div className="row">
              <Button
                  variant="secondary"
                  className="btn-commit btn-load"
                  onClick={(e) => {
                    if (selectedDate !== "") {
                      if (window.confirm(`${selectedDate}의 일간하루로 이동하시겠습니까?`)) {
                        axios
                            .get(`/api/TR/${paramID}/${selectedDate}`)
                            .then((result) => {
                              // if (result["data"] === null) {
                              //   window.alert("해당 날짜의 TR이 존재하지 않습니다.");
                              // } else {
                              //   history.push(`/TR/${paramID}/edit/${selectedDate}`);
                              // }
                              const data=result.data;
                              if(data.success===true){
                                history.push(`/TR/${paramID}/edit/${selectedDate}`);
                              }
                              else{
                                window.alert("해당 날짜의 TR이 존재하지 않습니다.");
                              }
                            })
                            .catch((err) => {
                              console.log(err);
                            });
                      }
                    }
                  }}
              >
                <div className="row m-0">
                  <div className="col-xl-7">
                    <strong>다른 날 불러오기</strong>
                  </div>
                  <div className="col-xl-5">
                    <input
                        type="date"
                        className="w-100"
                        value={selectedDate}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        onChange={(e) => {
                          e.stopPropagation();
                          setselectedDate(e.target.value);
                        }}
                    />
                  </div>
                </div>
              </Button>
            </div>

            <div className="row">
              <div className="col-xl-6 m-0 p-0">
                <Button
                    variant="secondary"
                    className="btn-commit btn-edit"
                    onClick={async () => {
                      // console.log(TR);
                      // console.log(todayGoal);
                      if (입력확인()) {
                        if (window.confirm("등교 여부를 체크하셨습니까?")) {
                          if (window.confirm(`수정된 ${TR.이름}학생의 ${TR.날짜} 일간하루를 저장하시겠습니까?`)) {
                            const newstuDB = JSON.parse(JSON.stringify(stuDB));
                            for (let i = 0; i < stuDB["진행중교재"].length; i++) {
                              for (let j = 0; j < TR["학습"].length; j++) {
                                if (stuDB["진행중교재"][i]["과목"] == TR["학습"][j]["과목"] && stuDB["진행중교재"][i]["교재"] == TR["학습"][j]["교재"]) {
                                  newstuDB["진행중교재"][i]["최근진도"] = TR["학습"][j]["최근진도"];
                                  newstuDB["진행중교재"][i]["최근진도율"] = newstuDB["진행중교재"][i]["총교재량"]
                                      ? Math.round((newstuDB["진행중교재"][i]["최근진도"] / parseInt(newstuDB["진행중교재"][i]["총교재량"].match(/\d+/))) * 100)
                                      : 0;
                                }
                              }
                            }
                            let fail_flag = false; // midpoint check if first request failed or not

                            await axios
                                .put("/api/StudentDB", newstuDB)
                                .then(function (result) {
                                  if (result.data === "로그인필요") {
                                    window.alert("로그인이 필요합니다.");
                                    return history.push("/");
                                  }
                                  if (result.data.success === true) {
                                    // console.log(result.data);
                                    // window.alert(result.data);
                                  } else {
                                    fail_flag = true;
                                    // console.log(result.data);
                                    window.alert("저장에 실패했습니다 개발/데이터 팀에게 문의해주세요, 0");
                                  }
                                })
                                .catch(function (err) {
                                  window.alert("저장에 실패했습니다 개발/데이터 팀에게 문의해주세요, 1");
                                });

                            if (fail_flag) return;

                            const postedTR = JSON.parse(JSON.stringify(TR));
                            postedTR["강의과제학습"] = assignmentStudyTime; //TR 객체의 강의 과제 학습 시간 관련 state를 state로부터 업데이트하여 post: 더 나은 방법 찾아봐야: react state update queue 써야
                            postedTR["TDRIDList"] = getWrittenTDRIDList();

                            await axios
                                .put("/api/TR", postedTR)
                                .then(function (result) {
                                  const data=result.data;
                                  // if (result.data === true) {
                                  //   window.alert("저장되었습니다");
                                  //   history.push("/studentList");
                                  // } else
                                  if (result.data === "로그인필요") {
                                    window.alert("로그인이 필요합니다.");
                                    return history.push("/");
                                  }
                                  else if(data.success===true){
                                    window.alert("저장되었습니다");
                                    history.push("/studentList");
                                  }
                                  else {
                                    // console.log(result.data);
                                    // window.alert("수정 실패");
                                    window.alert(data.ret);
                                  }
                                })
                                .catch(function (err) {
                                  console.log("수정 실패 : ", err);
                                  window.alert(err);
                                });
                          }
                        }
                      }
                    }}
                >
                  <strong>일간하루 수정</strong>
                </Button>
              </div>
              <div className="col-xl-6 m-0 p-0">
                <Button
                    variant="secondary"
                    className="btn-commit btn-cancel"
                    onClick={() => {
                      if (window.confirm(`현재 작성중인 일간하루를 정말 삭제하시겠습니까?`)) {
                        axios
                            .delete(`/api/TR/${TR._id}`)
                            .then(function (result) {
                              const data=result.data;
                              // if (result.data === true) {
                              //   window.alert("수정되었습니다.");
                              //   return history.push("/studentList");
                              // } else
                              if (result.data === "로그인필요") {
                                window.alert("로그인이 필요합니다.");
                                return history.push("/");
                              }
                              else if(data.success===true){
                                window.alert("삭제되었습니다.");
                                return history.push("/studentList");
                              }
                              else {
                                // console.log(result.data);
                                // window.alert(result.data);
                                window.alert(data.ret);
                              }
                            })
                            .catch(function (err) {
                              window.alert(err, "삭제에 실패했습니다 개발/데이터 팀에게 문의해주세요");
                            });
                      }
                    }}
                >
                  <strong>일간하루 삭제</strong>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

export default TRedit;