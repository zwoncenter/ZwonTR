import "./TRDraft.scss";
import { Form, Button, Card, ListGroup, Table, Modal, Row, Col, Accordion, OverlayTrigger, Popover } from "react-bootstrap";
import { useHistory, useParams } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect, useRef } from "react";
import {FaCheck, FaSistrix, FaTrash, FaTimes} from "react-icons/fa"
import axios from "axios";
import TimePicker from "react-time-picker";
// import { FaPencilAlt, FaTrash, FaCheck, FaUndo } from "react-icons/fa";
// import { CgMailForward } from "react-icons/cg";
import { BsFillChatSquareFill } from "react-icons/bs";

function TRDraft() {
  const now = new Date(); // 현재 시간
  const utcNow = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const koreaTimeDiff = 9 * 60 * 60 * 1000;
  const koreaNow = new Date(utcNow + koreaTimeDiff);
  // const today = koreaNow.toISOString().split("T")[0];
  const today = getCurrentKoreaDateYYYYMMDD();
  // const today = "2023-04-11"; // for testing

  // 공통 code
  let history = useHistory();
  // let paramID = useParams()["ID"];
  // let paramDate = useParams()["date"];
  let paramID="";
  let paramDate= today;
  const [managerList, setmanagerList] = useState([]);

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

  //StudentDB에 연결된 계정에 한한 학습 정보 가져오는 코드
  const [myStudyInfo,setMyStudyInfo]=useState({
    "진행중교재":[],
  });

  useEffect(async ()=>{
    const current_studying_books=await axios
      .get("/api/getMyCurrentStudyingBooks")
      .then((res)=>{
        const data=res.data;
        if(!data.success) return [];
        else return data.ret;
      })
      .catch((err)=>{
        return [];
      });
    setMyStudyInfo({"진행중교재":current_studying_books});
  },[]);

  const day_category=["평일","일요일"];
  const life_cycle_category=["취침","기상","등원","귀가","학습"];
  const life_cycle_and_study_time_goals_template={};
  day_category.forEach((day,didx)=>{
    life_cycle_category.forEach((life_cycle,lcidx)=>{
      life_cycle_and_study_time_goals_template[day+life_cycle]="";
    });
  });

  function getTodayDayCategory(){
    const d=new Date()
    const [year,month,date]= today.split("-").map((e)=>parseInt(e));
    d.setFullYear(year); d.setMonth(month-1); d.setDate(date);
    return d.getDay()===0? day_category[1]:day_category[0]; 
  }

  //생활 데이터 관련 코드
  const [myLifeCycleAndStudyTimeGoals,setMyLifeCycleAndStudyTimeGoals]= useState(life_cycle_and_study_time_goals_template);
  const [myLifeData,setMyLifeData]= useState({
    "신체컨디션":"선택",
    "정서컨디션":"선택",
    "실제취침":null,
    "실제기상":null
  });

  useEffect(async ()=>{
    const life_cycle_and_study_time_goals=await axios
      .get("/api/getMyLifeCycleAndStudyTimeGoals")
      .then((res)=>{
        const data=res.data;
        if(!data.success) return [];
        else return data.ret;
      })
      .catch((err)=>{
        return [];
      });
    setMyLifeCycleAndStudyTimeGoals(life_cycle_and_study_time_goals);
  },[]);

  //이번주 주간 학습 계획 가져오는 코드
  const [myStudyGoalInfo,setMyStudyGoalInfo]= useState({
    "todayGoal":[]
  });

  function getTodayDayString(){
    const tmp_map={
      1:'월',
      2:'화',
      3:'수',
      4:'목',
      5:'금',
      6:'토',
      0:'일'
    };
    const d=new Date()
    const [year,month,date]= today.split("-").map((e)=>parseInt(e));
    d.setFullYear(year); d.setMonth(month-1); d.setDate(date);
    return tmp_map[d.getDay()];
  }

  function getTodayGoalByTextbookName(textbookName){
    if(textbookName in myStudyGoalInfo.todayGoal) return myStudyGoalInfo.todayGoal[textbookName];
    return "";
  }

  useEffect(async ()=>{
    const this_week_goals=await axios
      .get("/api/getThisWeekStudyGoals")
      .then((res)=>{
        const data=res.data;
        if(!data.success) return [];
        else return data.ret;
      })
      .catch((err)=>{
        return [];
      });
    const today_goal=this_week_goals.thisweekGoal[getTodayDayString()];
    setMyStudyGoalInfo({"todayGoal":today_goal});
  },[]);

  //학생 해당 날짜의 과제 가져오는 코드
  const [myAssignmentInfo,setMyAssignmentInfo]= useState({
    "assignments":[]
  });
  const [myAssignmentStudyTime,setMyAssingmentStudyTime]= useState({});

  function checkLectureAssignmentExists(){
    return myAssignmentInfo.assignments.length>0;
  }

  useEffect(async ()=>{
    const current_assignments=await axios
      .get("/api/getMyCurrentAssignments")
      .then((res)=>{
        const data=res.data;
        if(!data.success) return [];
        else return data.ret;
      })
      .catch((err)=>{
        return [];
      });
    setMyAssignmentInfo({"assignments":current_assignments});
  },[]);

  const isInitialMount = useRef(true);

  //교재 이름과 db _id를 매핑해주는 코드
  const [textbookIDMapping,setTextbookIDMapping]= useState({}); //교재 이름과 db _id를 매핑해주는 dictionary
  function checkTextbookIsValid(textbookName){
    return textbookIDMapping[textbookName]?true:false;
  }

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
  function getTextbookOfAssignmentFromTodayAssignments(todayAssignmentData){
    const ret={};
    for(let i=0; i<todayAssignmentData.length; i++){
      const assignment=todayAssignmentData[i];
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
    // for(let i=0; i<TR.학습.length; i++) {
    //   const textbookName= TR.학습[i].교재;
    //   if(!(textbookName in textbookIDMapping)) continue;
    //   const textbookID= textbookIDMapping[textbookName];
    //   if(!(textbookID in textbookIDToSavedGoalStateMapping)) continue;
    //   // 만약 daily goal check log가 tr귀가검사 전에 생기고
    //   // 그 다음에 같은 교재로 강의과제가 생기는 경우(자동으로 숨겨지게 돼있으므로) 학습시간 검사 안함
    //   if(checkTextBookOfAssignment(textbookName)) continue; 
    //   if(textbookIDToSavedGoalStateMapping[textbookID]["finishedState"]===true){
    //     const textbookStudyTime= TR.학습[i].학습시간;
    //     if(textbookStudyTime==="0:00" || textbookStudyTime==="00:00") {
    //       const newHighlightedTextbookAssignments= JSON.parse(JSON.stringify(highlightedTextbookAssignments));
    //       newHighlightedTextbookAssignments[textbookID]=true;
    //       setHighlightedTextbookAssignments(newHighlightedTextbookAssignments);
    //       return false;
    //     }
    //   }
    // }
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
    // for(let i=0; i<TR.학습.length; i++){
    //   const textbookName=TR.학습[i]["교재"];
    //   const textbookID=textbookIDMapping[textbookName];
    //   if(!textbookID) continue; // db에 등록되지 않은 교재인 경우 건너뜀
    //   if(checkTextBookOfAssignment(textbookName)) continue; // 강의 과제에 사용된 교재인 경우 확인 건너뜀
    //   if(!(textbookID in textbookIDToSavedGoalStateMapping)){
    //     const newHighlightedTextbookAssignments= JSON.parse(JSON.stringify(highlightedTextbookAssignments));
    //     newHighlightedTextbookAssignments[textbookID]=true;
    //     setHighlightedTextbookAssignments(newHighlightedTextbookAssignments);
    //     return false; // goal state 자체가 없으면 완료/사유작성 안된 것
    //   }
    // }
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

  //수업 및 일반교재 학습 기입 관련 코드
  function getTextbookVolumeFromTextbookName(textbookName){
    let ret=""
    // for(let i=0; i<stuDB.진행중교재.length; i++){
    //   const book=stuDB.진행중교재[i];
    //   if(book["교재"]===textbookName){
    //     ret=book["총교재량"];
    //     break;
    //   }
    // }
    return ret;
  }
  function getRecentPageFromTextbookName(textbookName){
    let ret=0;
    // for(let i=0; i<stuDB.진행중교재.length; i++){
    //   const book=stuDB.진행중교재[i];
    //   if(book["교재"]===textbookName){
    //     ret=book["최근진도"];
    //     break;
    //   }
    // }
    return ret;
  }
  const [validTextbookNames,setValidTextbookNames]=useState([]);
  function getValidTextbookNameListForTextbookStudyTable(){
    const textbook_name_set=new Set();
    myStudyInfo.진행중교재.forEach((book,idx)=>{
      textbook_name_set.add(book["교재"]);
    });
    return [...textbook_name_set];
  }

  useEffect(async () => {
    const newmanagerList = await axios
        .get("/api/managerList")
        .then((result) => {
          const data=result.data;
          if(data.success===true) return data.ret;
          else throw new Error(data.ret);
          // return result["data"];
        })
        .catch((err) => {
          return err;
        });
    setmanagerList(newmanagerList);
    isInitialMount.current = false;
  }, [paramDate]);

  useEffect(()=>{
    if(myStudyInfo.진행중교재.length>0){
      setValidTextbookNames(getValidTextbookNameListForTextbookStudyTable());
    }
  },[myStudyInfo.진행중교재]);

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
              <div className="mt-3">
                <div className="trCard">
                  <Form.Group as={Row}>
                    <Form.Label column sm="2">
                      <strong>[ 신체 컨디션 ]</strong>
                    </Form.Label>
                    <Col sm="10">
                      <Form.Select
                          size="sm"
                          value={myLifeData.신체컨디션}
                          onChange={(e) => {
                            const newLifeData={...myLifeData};
                            newLifeData.신체컨디션=e.target.value;
                            setMyLifeData(newLifeData);
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
                          value={myLifeData.정서컨디션}
                          onChange={(e) => {
                            const newLifeData={...myLifeData};
                            newLifeData.정서컨디션=e.target.value;
                            setMyLifeData(newLifeData);
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
                    </tr>
                    </thead>
                    <tbody>
                    {["취침", "기상"].map(function (a, i) {
                      return (
                          <tr key={i}>
                            <td>{a}</td>
                            <td>
                              <TimePicker
                                  locale="sv-sv"
                                  value={myLifeCycleAndStudyTimeGoals[getTodayDayCategory()+a]}
                                  openClockOnFocus={false}
                                  clearIcon={null}
                                  clockIcon={null}
                                  disabled={true}
                              ></TimePicker>
                            </td>

                            <td>
                              <TimePicker
                                  className="timepicker"
                                  locale="sv-sv"
                                  value={myLifeData["실제"+a]}
                                  openClockOnFocus={false}
                                  clearIcon={null}
                                  clockIcon={null}
                                  onChange={(value) => {
                                    const newLifeData={...myLifeData};
                                    newLifeData["실제"+a]=value;
                                    setMyLifeData(newLifeData);
                                  }}
                              ></TimePicker>
                            </td>
                          </tr>
                      );
                    })}
                    </tbody>
                  </Table>
                </div>

                <div className="trCard">
                  <h4><strong>수업 과제</strong></h4>
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
                              {myAssignmentInfo.assignments.map(function (a, i) {
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
                                            value={myAssignmentStudyTime[a.AOSID]}
                                            openClockOnFocus={false}
                                            clearIcon={null}
                                            clockIcon={null}
                                            onChange={(value) => {
                                              const newAssignmentStudyTime= {...myAssignmentStudyTime};
                                              newAssignmentStudyTime[a.AOSID]=value;
                                              console.log(`a study time: ${JSON.stringify(newAssignmentStudyTime)}`);
                                              setMyAssingmentStudyTime(newAssignmentStudyTime);
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
                    {myStudyInfo.진행중교재.map((a, i)=> {
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
                                        // var newTR = JSON.parse(JSON.stringify(TR));
                                        // newTR.학습.splice(i, 1);
                                        // let 실제학습시간 = 0;
                                        // let 실제학습분 = 0;
                                        // const astKeys= Object.keys(assignmentStudyTime);
                                        // for(let i=0; i<astKeys.length; i++){
                                        //   const studyTime=assignmentStudyTime[astKeys[i]];
                                        //   실제학습시간 += parseInt(studyTime["학습시간"].split(":")[0]);
                                        //   실제학습분 += parseInt(studyTime["학습시간"].split(":")[1]);
                                        // }
                                        // newTR.학습.map(function (b, j) {
                                        //   if (b.학습시간) {
                                        //     실제학습시간 += parseInt(b.학습시간.split(":")[0]);
                                        //     실제학습분 += parseInt(b.학습시간.split(":")[1]);
                                        //   }
                                        // });
                                        // newTR.실제학습 = Math.round((실제학습시간 + 실제학습분 / 60) * 10) / 10;
                                        // setTR(newTR);
                                      }
                                    }
                                  }}
                              >
                                <FaTrash></FaTrash>
                              </button>
                            </td>
                            <td>
                              {a.과목}
                            </td>
                            <td>
                              <Form.Select
                                  size="sm"
                                  value={a.교재}
                                  onChange={(e) => {
                                    // const textbook_name=e.target.value;
                                    // const textbook_volume=getTextbookVolumeFromTextbookName(textbook_name);
                                    // const textbook_recent_page=getRecentPageFromTextbookName(textbook_name);
                                    // const newTR=JSON.parse(JSON.stringify(TR));
                                    // newTR.학습[i].교재=textbook_name;
                                    // newTR.학습[i].총교재량=textbook_volume;
                                    // newTR.학습[i].최근진도=textbook_recent_page;
                                    // setTR(newTR);
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
                              <p className="fs-13px">{getTodayGoalByTextbookName(a.교재)}</p>
                            </td>
                            <td>
                              <input
                                  type="number"
                                  value={a.최근진도}
                                  className="inputText"
                                  onChange={(e) => {
                                    // change_depth_three("학습", i, "최근진도", parseInt(e.target.value));
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
                                    // if(!value) value="0:00";
                                    // var newTR = JSON.parse(JSON.stringify(TR));
                                    // newTR.학습[i].학습시간 = value;
                                    // let 실제학습시간 = 0;
                                    // let 실제학습분 = 0;
                                    // const astKeys= Object.keys(assignmentStudyTime);
                                    // for(let i=0; i<astKeys.length; i++){
                                    //   const studyTime=assignmentStudyTime[astKeys[i]];
                                    //   실제학습시간 += parseInt(studyTime["학습시간"].split(":")[0]);
                                    //   실제학습분 += parseInt(studyTime["학습시간"].split(":")[1]);
                                    // }
                                    // newTR.학습.map(function (b, j) {
                                    //   if (b.학습시간) {
                                    //     실제학습시간 += parseInt(b.학습시간.split(":")[0]);
                                    //     실제학습분 += parseInt(b.학습시간.split(":")[1]);
                                    //   }
                                    // });
                                    // newTR.실제학습 = Math.round((실제학습시간 + 실제학습분 / 60) * 10) / 10;
                                    // setTR(newTR);
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
                      <td colSpan={5}>목표 학습 - {"TBD"} 시간</td>
                      <td> {"TBD"} 시간</td>
                      <td colSpan={2}>{"TBD"}시간</td>
                    </tr>
                    <tr>
                      <td colSpan={8}>
                        {" "}
                        <button
                            className="btn btn-add program-add"
                            onClick={() => {
                              // push_depth_one("학습", {
                              //   과목: "선택",
                              //   교재: "선택",
                              //   총교재량: "---",
                              //   최근진도: 0,
                              //   학습시간: "00:00",
                              // });
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
                    {/* {TR.프로그램.map(function (a, i) {
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
                                    // change_depth_three("프로그램", i, "프로그램분류", e.target.value);
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
                                    // change_depth_three("프로그램", i, "매니저", e.target.value);
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
                                    // var newTR = JSON.parse(JSON.stringify(TR));
                                    // newTR.프로그램[i].소요시간 = value;
                                    // let 실제시간 = 0;
                                    // let 실제분 = 0;
                                    // newTR.프로그램.map(function (c, k) {
                                    //   if (c.소요시간) {
                                    //     실제시간 += parseInt(c.소요시간.split(":")[0]);
                                    //     실제분 += parseInt(c.소요시간.split(":")[1]);
                                    //   }
                                    // });
                                    // newTR.프로그램시간 = Math.round((실제시간 + 실제분 / 60) * 10) / 10;
                                    // setTR(newTR);
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
                                // change_depth_three("프로그램", i, "상세내용", e.target.value);
                              }}
                          ></textarea>
                            </td>
                          </tr>
                      );
                    })} */}

                    <tr>
                      <td colSpan={5}>프로그램 진행 시간 : {"TBD"}시간</td>
                    </tr>
                    <tr>
                      <td colSpan={5}>
                        {" "}
                        <button
                            className="btn btn-add program-add"
                            onClick={() => {
                              // push_depth_one("프로그램", {
                              //   프로그램분류: "선택",
                              //   매니저: "선택",
                              //   소요시간: "00:00",
                              //   상세내용: "",
                              // });
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
            </div>
          </div>
        </div>
      </div>
  );
}

export default TRDraft;