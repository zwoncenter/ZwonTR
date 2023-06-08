import "./TRDraft.scss";
import { Form, Button, Card, ListGroup, Table, Modal, Row, Col, Accordion, OverlayTrigger, Popover } from "react-bootstrap";
import { useHistory, useParams } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect, useRef } from "react";
import {FaCheck, FaSistrix, FaTrash, FaTimes} from "react-icons/fa"
import axios from "axios";
import ObjectId from "bson-objectid";
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

  const max_table_element_count=50;

  // 공통 code
  let history = useHistory();
  // let paramID = useParams()["ID"];
  // let paramDate = useParams()["date"];
  let paramID="";
  let paramDate= today;
  const [managerList, setmanagerList] = useState([]);

  function getManagerNicknameByUsername(manager_username){
    for(let i=0; i<managerList.length; i++){
      const manager=managerList[i];
      if(manager.username===manager_username) return manager.nickname;
    }
    return "";
  }
  function checkReviewerUsernameValid(reviewer_username){
    for(let i=0; i<managerList.length; i++){
      const manager=managerList[i];
      if(manager.username===reviewer_username) return true;
    }
    return false;
  }
  const reviewer_array_max_len=20;
  function checkReviewerUsernameArrayValid(reviewer_array){
    if(!Array.isArray(reviewer_array) || reviewer_array.length>reviewer_array_max_len || reviewer_array.length===0) return false;
    for(let i=0; i<reviewer_array.length; i++){
      const reviewer_username=reviewer_array[i];
      if(!checkReviewerUsernameValid(reviewer_username)) return false;
    }
    return true;
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
  const [myTextbookStudyTime,setMyTextbookStudyTime]= useState({});

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
    // console.log(`current books: ${JSON.stringify(current_studying_books)}`);
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

  function getLifeDataFromPrevRequestList(prevRequestList){
    let ret=myLifeData;
    for(let i=0; i<prevRequestList.length; i++){
      const prevRequest=prevRequestList[i];
      if(prevRequest.request_type!==0) continue;
      ret=prevRequest.request_specific_data;
      break;
    }
    return ret;
  }

  function getAOSIDFromRequestElement(requestElement){
    return requestElement.request_specific_data.AOSID;
  }

  function getAssignmentStudyDataMap(prevRequestData){
    const ret={};
    prevRequestData.forEach((e,idx)=>{
      if(e.request_type!==1) return;
      const assignment_request_id=getAOSIDFromRequestElement(e);
      const assignment_request_element=JSON.parse(JSON.stringify(e));
      const study_data_list=assignment_request_element.study_data_list;
      const prev_study_data=study_data_list[study_data_list.length-1];
      const study_data=getAssignmentStudyDataTemplate();
      study_data.excuse=prev_study_data.excuse;
      study_data.finished_state=prev_study_data.finished_state;
      study_data.time_amount=prev_study_data.time_amount;
      ret[assignment_request_id]=study_data;
    });
    return ret;
  }

  //db에 저장된 오늘의 모든 tr draft requests
  const [LATRequestStatusMap,setLATRequestStatusMap]=useState(null);
  function getNewObjectIDString(){
    return (new ObjectId()).toHexString();
  }
  function getNewLATRequestID(){
    return ["element",getNewObjectIDString()].join("#");
  }
  function getLATRequestIDFromRequestElement(requestDataElement){
    const request_specific_data=requestDataElement.request_specific_data;
    if("textbookID" in request_specific_data && request_specific_data.textbookID) return ["textbook",request_specific_data.textbookID].join("#");
    else if("elementID" in request_specific_data && request_specific_data.elementID) return ["element",request_specific_data.elementID].join("#");
  }
  function getStudyDataTemplate(){
    return {
      time_amount:null,
      excuse:"",
      finished_state:true,
    };
  }
  function getLATRequestStatusMap(prevRequestData){
    const ret={};
    prevRequestData.forEach((e,idx)=>{
      if(e.request_type!==2) return;
      const LAT_request_id=getLATRequestIDFromRequestElement(e);
      const LAT_request_element=JSON.parse(JSON.stringify(e));
      const study_data_list=LAT_request_element.study_data_list;
      LAT_request_element["study_data"]=study_data_list.length>0?study_data_list[study_data_list.length-1]:{};
      LAT_request_element["request_new"]=false;
      const request_specific_data=LAT_request_element["request_specific_data"];
      request_specific_data.recent_page=request_specific_data.recent_page.toString(); // keep recent page value on client side as string
      ret[LAT_request_id]=LAT_request_element;
    });
    return ret;
  }
  function getProgramRequestIDFromRequestElement(element){
    return element.request_specific_data.elementID;
  }
  function getProgramRequestStatusMap(prevRequestData){
    const ret={};
    prevRequestData.forEach((e,idx)=>{
      if(e.request_type!==3) return;
      const program_request_id=getProgramRequestIDFromRequestElement(e);
      const program_request_element=JSON.parse(JSON.stringify(e));
      const study_data_list=program_request_element.study_data_list;
      program_request_element["study_data"]=study_data_list.length>0?study_data_list[study_data_list.length-1]:{};
      program_request_element["request_new"]=false;
      ret[program_request_id]=program_request_element;
    });
    return ret;
  }


  function checkLATRequestElementDeleted(LATRequestID){
    if(!(LATRequestID in LATRequestStatusMap)) return false;
    // const request_specific_data=LATRequestStatusMap[LATRequestID].request_specific_data;
    // if(!("deleted" in request_specific_data)) return false;
    // return request_specific_data.deleted;
    const request_element=getLATRequestElementFromLATRequestID(LATRequestStatusMap,LATRequestID);
    return !!request_element.deleted;
  }
  function checkLATRequestElementRecentPageNull(recentPage){
    return !recentPage && typeof recentPage ==="object";
  }
  function getLATRequestElementTemplate(duplicatableName="",duplicatableSubject=""){
    return {
      request_specific_data:{
        textbookID:"",
        elementID:"",
        duplicatable:false,
        duplicatable_name:duplicatableName,
        duplicatable_subject:duplicatableSubject,
        recent_page:null,
        request_new:true,
      },
      deleted:false,
      request_type:2,
      request_status:0,
      study_data:getStudyDataTemplate(),
    };
  }
  function getLATRequestElementFromLATRequestID(LATRequestStatusMapCopy,LATRequestID=""){
    if(LATRequestID in LATRequestStatusMapCopy) return LATRequestStatusMapCopy[LATRequestID];
    const [element_type,element_id]= LATRequestID.split("#");
    const new_request_element=getLATRequestElementTemplate();
    const request_specific_data=new_request_element.request_specific_data;
    if(element_type==="textbook"){
      request_specific_data.textbookID=element_id;
    }
    else if(element_type==="element"){
      request_specific_data.elementID=element_id;
      request_specific_data.duplicatable=true;
      request_specific_data.duplicatable_name=default_LAT_element_name;
      request_specific_data.duplicatable_subject="";
    }
    return new_request_element;
  }
  function deleteLATRequestElement(LATRequestID){
    console.log(`delete element: ${LATRequestID}`);
    setLATRequestStatusMap(prevLATRequestStatusMap=>{
      const [element_type,element_id]= LATRequestID.split("#");
      const newLATRequestStatusMap=JSON.parse(JSON.stringify(prevLATRequestStatusMap));
      if(element_type==="element"){
        delete newLATRequestStatusMap[LATRequestID];
      }
      else if(element_type==="textbook"){
        if(LATRequestID in newLATRequestStatusMap){
          const LAT_request_element=newLATRequestStatusMap[LATRequestID];
          const request_specific_data=LAT_request_element.request_specific_data;
          // request_specific_data.deleted=true;
          LAT_request_element.deleted=true;
          request_specific_data.request_status=0;
        }
        else{
          const LAT_request_element=getLATRequestElementFromLATRequestID(newLATRequestStatusMap);
          const request_specific_data=LAT_request_element.request_specific_data;
          // request_specific_data.deleted=true;
          LAT_request_element.deleted=true;
          newLATRequestStatusMap[LATRequestID]=LAT_request_element;
        }
      }
      return newLATRequestStatusMap;
    });
  }
  function insertLATRequestElement(LATRequestID,updateVal={}){
    setLATRequestStatusMap(prevLATRequestStatusMap=>{
      const [element_type,element_id]= LATRequestID.split("#");
      const newLATRequestStatusMap=JSON.parse(JSON.stringify(prevLATRequestStatusMap));
      const LAT_request_element=getLATRequestElementFromLATRequestID(newLATRequestStatusMap,LATRequestID);
      const LAT_request_element_request_specific_data= LAT_request_element.request_specific_data;
      // LAT_request_element_request_specific_data.deleted=false;
      LAT_request_element.deleted=false;
      Object.keys(updateVal).forEach((field_name,idx)=>{
        let target_object=LAT_request_element;
        const updated_val=updateVal[field_name];
        const field_path=field_name.split(".");
        const field_path_count=field_path.length;
        for(let i=0; i<field_path_count-1; i++){
          target_object=target_object[field_path[i]];
        }
        target_object[field_path[field_path_count-1]]=updated_val;
      });
      newLATRequestStatusMap[LATRequestID]=LAT_request_element;
      return newLATRequestStatusMap;
    });
  }
  function updateLATRequestElementByLATRequestID(LATRequestID,updateVal){
    setLATRequestStatusMap(prevLATRequestStatusMap=>{
      const newLATRequestStatusMap=JSON.parse(JSON.stringify(prevLATRequestStatusMap));
      if(!(LATRequestID in newLATRequestStatusMap)){
        const new_request_element=getLATRequestElementFromLATRequestID({},LATRequestID);
        newLATRequestStatusMap[LATRequestID]=new_request_element;
      }
      const LAT_request_element=getLATRequestElementFromLATRequestID(newLATRequestStatusMap,LATRequestID);
      Object.keys(updateVal).forEach((field_name,idx)=>{
        let target_object=LAT_request_element;
        const updated_val=updateVal[field_name];
        const field_path=field_name.split(".");
        const field_path_count=field_path.length;
        for(let i=0; i<field_path_count-1; i++){
          target_object=target_object[field_path[i]];
        }
        target_object[field_path[field_path_count-1]]=updated_val;
      });
      return newLATRequestStatusMap;
    });
  }
  function updateLATRequestElementIDByOldLATRequestID(LATRequestID){
    setLATRequestStatusMap(prevLATRequestStatusMap=>{
      const newLATRequestStatusMap=JSON.parse(JSON.stringify(prevLATRequestStatusMap));
      const [element_type,element_id]=LATRequestID.split("#");
      if(element_type!=="element" || !(LATRequestID in newLATRequestStatusMap)){
        return newLATRequestStatusMap;
      }
      const LAT_request_element=getLATRequestElementFromLATRequestID(newLATRequestStatusMap,LATRequestID);
      const new_element_id=getNewLATRequestID();
      while(new_element_id in newLATRequestStatusMap) new_element_id=getNewLATRequestID();
      newLATRequestStatusMap[new_element_id]=LAT_request_element;
      return newLATRequestStatusMap;
    });
  }
  function getTextbookStudyDataPayloadTemplate(){
    return {
      "textbookID":"",
      "elementID":"",
      "deleted":false,
      "duplicatable":false,
      "duplicatableName":"",
      "duplicatableSubject":"",
      "recentPage":0,
      "requestNew":true,
      "timeAmount":time_default_string,
      "excuse":"",
      "finishedState":true,
      "reviewedBy":null,
    };
  }
  function getTextbookStudyDataByLATRequestID(LATRequestID,textbookStudyFinished=false){
    // const ret={...assignmentStudyDataPayloadTemplate,AOSID};
    // ret["excuse"]=myAssignmentStudyData[AOSID].excuse;
    // ret["timeAmount"]=myAssignmentStudyData[AOSID].time_amount;
    // ret["finishedState"]=textbookStudyFinished;
    // if(textbookStudyFinished) ret.excuse="";
    // return ret;
    const [element_type,element_id]=LATRequestID.split("#");
    const LAT_request_element=getLATRequestElementFromLATRequestID(LATRequestStatusMap,LATRequestID);
    const request_specific_data=LAT_request_element.request_specific_data;
    const study_data=LAT_request_element.study_data;
    const textbook_info=getTextbookInfoByLATRequestID(LATRequestID);
    const ret={...(getTextbookStudyDataPayloadTemplate())};
    ret["textbookID"]=request_specific_data.duplicatable?"":element_id;
    ret["elementID"]=request_specific_data.duplicatable?element_id:"";
    ret["duplicatable"]=request_specific_data.duplicatable;
    ret["duplicatableName"]=request_specific_data.duplicatable_name;
    ret["duplicatableSubject"]=request_specific_data.duplicatable_subject;
    ret["recentPage"]= !checkLATRequestElementRecentPageNull(request_specific_data.recent_page)?request_specific_data.recent_page:(textbook_info.최근진도).toString();
    ret["requestNew"]=request_specific_data.request_new;
    ret["timeAmount"]=study_data.time_amount;
    ret["excuse"]=study_data.excuse;
    ret["finishedState"]=textbookStudyFinished;
    ret["reviewedBy"]=[requestGoesTo];
    return ret;
  }
  function getTextbookInfoTemplate(){
    return {
      과목:"",
      교재:"",
      총교재량:"",
      교재시작일:"",
      권장종료일:"",
      최근진도:0,
      최근진도율:0,
    };
  }
  function getTextbookInfoByLATRequestID(LATRequestID){
    const [element_type,element_id]= LATRequestID.split("#");
    if(element_type==="element"){
      const ret=getTextbookInfoTemplate();
      const LAT_request_element=getLATRequestElementFromLATRequestID(LATRequestStatusMap,LATRequestID);
      ret.과목=LAT_request_element.request_specific_data.duplicatable_subject;
      ret.교재=LAT_request_element.request_specific_data.duplicatable_name;
      return ret;
    }
    else if(element_type==="textbook"){
      for(let i=0;i<myStudyInfo.진행중교재.length; i++){
        const textbook_info=myStudyInfo.진행중교재[i];
        if(textbookIDMapping[textbook_info.교재]===element_id) return textbook_info;
      }
      return null;
    }
  }
  async function saveLATStudyDataByLATRequestID(LATRequestID,finishedState){
    const textbook_info=getTextbookInfoByLATRequestID(LATRequestID);
    const textbookName=textbook_info.교재;
    const textbookSubject=textbook_info.과목;
    const study_data= getTextbookStudyDataByLATRequestID(LATRequestID,finishedState);
    console.log(`study data payload: ${JSON.stringify(study_data)}`);
    // console.log(`study data: ${JSON.stringify(study_data)}`);

    //check if study data for assingment valid
    const [textbookStudyValid,msg]= isTextbookStudyDataValid(study_data,LATRequestID);
    if(!textbookStudyValid){
      window.alert(`${msg}`);
      return false;
    }
    const [save_successful,reset_object_id]= await axios
      .post("/api/saveLATStudyDataRequest",study_data)
      .then((res)=>{
        const data=res.data;
        if(!data.success) {
          window.alert(`네트워크 오류로 수업 및 일반교재 학습 데이터를 저장하지 못했습니다:0`);
          return [false,false];
        }
        else{
          const ret_info=data.ret;
          if(ret_info && typeof ret_info==="object" && "reset_object_id" in ret_info && ret_info.reset_object_id===true) {
            window.alert(`네트워크 오류로 수업 및 일반교재 학습 데이터를 저장하지 못했습니다:0.5`);
            return [false,true];
          }
        }
        window.alert(`성공적으로 수업 및 일반교재 학습 데이터를 저장했습니다`);
        return [true,false];
      })
      .catch((error)=>{
        console.log(`error: ${error}`);
        return window.alert(`네트워크 오류로 수업 및 일반교재 학습 데이터를 저장하지 못했습니다:1`);
      });
    if(reset_object_id){
      updateLATRequestElementIDByOldLATRequestID(LATRequestID);
      return false;
    }
    if(save_successful){
      updateLATRequestElementByLATRequestID(LATRequestID,{
        "request_specific_data.request_new":false,
      });
    }
    return save_successful;
  }

  useEffect(async ()=>{
    const prevRequestData= await axios
      .get("/api/getMyTodayTRDraftRequestsAll")
      .then((res)=>{
        const data=res.data;
        if(!data.success) {
          window.alert(`네트워크 오류로 데이터를 불러오지 못했습니다:0`);
          window.location.reload();
        }
        return data.ret;
      })
      .catch((error)=>{
        window.alert(`네트워크 오류로 데이터를 불러오지 못했습니다:1`);
        window.location.reload();
      });
    setMyLifeData(getLifeDataFromPrevRequestList(prevRequestData));
    setMyAssignmentStudyData(getAssignmentStudyDataMap(prevRequestData));
    setLATRequestStatusMap(getLATRequestStatusMap(prevRequestData));
    setProgramRequestStatusMap(getProgramRequestStatusMap(prevRequestData));
  },[]);

  // useEffect(()=>{
  //   console.log(`lat request status map: ${JSON.stringify(LATRequestStatusMap)}`);
  // },[LATRequestStatusMap]);

  //생활 데이터 관련 코드
  const [myLifeCycleAndStudyTimeGoals,setMyLifeCycleAndStudyTimeGoals]= useState(life_cycle_and_study_time_goals_template);
  const [myLifeData,setMyLifeData]= useState({
    "신체컨디션":"선택",
    "정서컨디션":"선택",
    "실제취침":null,
    "실제기상":null
  });
  function intBetween(a,left,right){
    return a>=left && a<=right;
  }
  function checkTimeStringValid(time_string){
    if(typeof time_string!=="string") return false;
    const string_splitted=time_string.split(":");
    if(string_splitted.length!==2) return false;
    else if(!intBetween(string_splitted[0].length,1,2) || !intBetween(string_splitted[1].length,1,2)) return false;
    else if(Number.isNaN(parseInt(string_splitted[0])) || Number.isNaN(parseInt(string_splitted[1]))) return false;
    else return true;
  }
  function checkConditionValueValid(condition_val){
    const parsed=parseInt(condition_val);
    if(Number.isNaN(parsed)) return false;
    else return intBetween(parsed,1,5)
  }
  function checkLifeDataValid(){
    return checkConditionValueValid(myLifeData.신체컨디션) && checkConditionValueValid(myLifeData.정서컨디션)
      && checkTimeStringValid(myLifeData.실제취침) && checkTimeStringValid(myLifeData.실제기상);
  }
  const lifeDataPayloadTemplate={
    bodyCondition: null,
    sentimentCondition: null,
    goToBedTime: null,
    wakeUpTime: null,
    reviewedBy: [],
  };
  function getLifeData(){
    const ret={...lifeDataPayloadTemplate,
      bodyCondition: myLifeData.신체컨디션,
      sentimentCondition: myLifeData.정서컨디션,
      goToBedTime: myLifeData.실제취침,
      wakeUpTime: myLifeData.실제기상,
      reviewedBy: [requestGoesTo],
    };
    return ret;
  }
  function isLifeDataValid(lifeData){
    if(!lifeData) return [false,`error occurred`];
    else if(!checkConditionValueValid(lifeData.bodyCondition)) return [false,"올바른 신체 컨디션을 선택해주세요"];
    else if(!checkConditionValueValid(lifeData.sentimentCondition)) return [false,"올바른 정서 컨디션을 선택해주세요"];
    else if(!checkTimeStringValid(lifeData.goToBedTime)) return [false,"올바른 실제 취침 시간을 입력해주세요"];
    else if(!checkTimeStringValid(lifeData.wakeUpTime)) return [false,"올바른 실제 기상 시간을 입력해주세요"];
    else return [true,""];
  }
  async function saveLifeData(){
    const life_data=getLifeData();
    console.log(`life data payload: ${JSON.stringify(life_data)}`);
    const [valid,msg]=isLifeDataValid(life_data);
    if(!valid){
      window.alert(`${msg}`);
      return false;
    }

    const save_success=await axios
      .post("/api/saveLifeDataRequest",life_data)
      .then((res)=>{
        const data=res.data;
        if(!data.success) {
          window.alert(`네트워크 오류로 생활 정보를 저장하지 못했습니다:0`);
          return false;
        }
        window.alert(`성공적으로 생활 정보를 저장했습니다`);
        return true;
      })
      .catch((error)=>{
        window.alert(`네트워크 오류로 생활 정보를 저장하지 못했습니다:1`);
        return false;
      });
    return save_success;
  }

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

  function checkLectureAssignmentExists(){
    return myAssignmentInfo.assignments.length>0;
  }
  function getAssignmentElementByAOSID(AOSID){
    let ret=null;
    for(let i=0; i<myAssignmentInfo.assignments.length; i++){
      const assignment=myAssignmentInfo.assignments[i];
      if(assignment.AOSID===AOSID) return assignment;
    }
    return ret;
  }
  function checkAssignmentElementHasPageRangeElement(assignmentElement){
    const first_page_range_element=(assignmentElement.pageRangeArray)[0];
    return !!first_page_range_element[0];
  }
  function checkAssignmentElementHasDescription(assignmentElement){
    return !!assignmentElement.description;
  }
  function getLectureNameOfAssignmentByAOSID(AOSID){
    let ret="";
    for(let i=0; i<myAssignmentInfo.assignments.length; i++){
      const assignment=myAssignmentInfo.assignments[i];
      if(assignment.AOSID===AOSID) return assignment.lectureName;
    }
    return ret;
  }
  function checkTodayAssignmentIncludeTextbook(textbookName){
    for(let i=0; i<myAssignmentInfo.assignments.length; i++){
      const assignment_textbook_name=myAssignmentInfo.assignments[i].textbookName;
      if(textbookName===assignment_textbook_name) return true;
    }
    return false;
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
    // console.log(`cur assignments: ${JSON.stringify(current_assignments)}`);
    setMyAssignmentInfo({"assignments":current_assignments});
  },[]);

  const [myAssignmentStudyData,setMyAssignmentStudyData]= useState({}); // map for storing study data of assignment(time amount, excuse)
  const time_default_string="00:00";
  const assignmentStudyDataTemplate={
    "time_amount":time_default_string,
    "excuse":"",
    "finished_state":true,
  };
  function getAssignmentStudyDataTemplate(){
    return {...assignmentStudyDataTemplate};
  }
  const assignmentStudyDataPayloadTemplate={
    "AOSID":"",
    "timeAmount":null,
    "excuse":"",
    "finishedState":true,
    "reviewedBy":null,
  };
  function getAssignmentStudyDataByAOSID(AOSID,assignment_finished=false){
    if(!(AOSID in myAssignmentStudyData)) {
      const newAssignmentStudyData=JSON.parse(JSON.stringify(myAssignmentStudyData));
      newAssignmentStudyData[AOSID]={...getStudyDataTemplate(),time_amount:time_default_string};
      setMyAssignmentStudyData(newAssignmentStudyData);
      return {...assignmentStudyDataPayloadTemplate,finishedState:assignment_finished,AOSID};
    }
    const assignment_study_data=myAssignmentStudyData[AOSID];
    const ret={...assignmentStudyDataPayloadTemplate,
      excuse:assignment_study_data.excuse,
      timeAmount:assignment_study_data.time_amount,
      finishedState:assignment_finished,
      reviewedBy:[requestGoesTo],
      AOSID,
    };
    if(assignment_finished) ret.excuse="";
    return ret;
  }
  const excuse_min_len=15;
  const excuse_max_len=200;
  function checkStudyExcuseValid(excuse_val){
    if(!(typeof excuse_val==="string")) return false;
    return excuse_val.length>=excuse_min_len && excuse_val.length<=excuse_max_len;
  }
  function isAssignmentStudyDataValid(assignmentStudyData){
    if(!assignmentStudyData) return [false,`error occurred`];
    else if(!checkTimeStringValid) return [false,"올바른 학습시간을 입력해주세요"];
    else if(assignmentStudyData.finishedState===false && !checkStudyExcuseValid(assignmentStudyData.excuse))
      return [false,"과제 미완료 사유를 15글자 이상 입력해주세요"];
    else if(!checkReviewerUsernameArrayValid(assignmentStudyData["reviewedBy"])) return [false,"지정된 리뷰어가 올바르지 않습니다"];
    else return [true,""];
  }
  async function saveAssignmentStudyDataByAOSID(AOSID,finishedState){
    const assignmnet_element=getAssignmentElementByAOSID(AOSID);
    // if(!window.confirm(`[${assignmnet_element["lectureName"]}]\n"${getDescriptionStringFromAssignment(assignmnet_element)}"\n과제에 대한 확인 요청을 보내시겠습니까?`)) return;
    const study_data=getAssignmentStudyDataByAOSID(AOSID,finishedState);
    console.log(`assignment study data payload: ${JSON.stringify(study_data)}`);
    const [assignmentStudyDataValid,msg]=isAssignmentStudyDataValid(study_data);
    if(!assignmentStudyDataValid){
      window.alert(`${msg}`);
      return false;
    }

    const save_success=await axios
      .post("/api/saveAssignmentStudyDataRequest",study_data)
      .then((res)=>{
        const data=res.data;
        if(!data.success) {
          window.alert(`네트워크 오류로 강의 과제 학습 데이터를 저장하지 못했습니다:0`);
          return false;
        }
        window.alert(`성공적으로 강의 과제 학습 데이터를 저장했습니다`);
        return true;
      })
      .catch((error)=>{
        window.alert(`네트워크 오류로 강의 과제 학습 데이터를 저장하지 못했습니다:1`);
        return false;
      });
    return save_success;
  }

  function checkTextbookStudyRecentPageValid(recentPage){
    const tmp_val=parseInt(recentPage);
    return !isNaN(tmp_val) && intBetween(recentPage,0,100000);
  }
  function isTextbookStudyDataValid(textbookStudyData,LATRequestID){
    if(!textbookStudyData) return [false,`error occurred`];
    else if(!checkTextbookStudyRecentPageValid(textbookStudyData.recentPage)){
      const textbook_info=getTextbookInfoByLATRequestID(LATRequestID);
      updateLATRequestElementByLATRequestID(LATRequestID,{
        "request_specific_data.recent_page":textbook_info.최근진도,
      });
      return [false,"올바른 최근진도를 입력해주세요"];
    }
    else if(!checkTimeStringValid(textbookStudyData.timeAmount)){
      updateLATRequestElementByLATRequestID(LATRequestID,{
        "study_data.time_amount":time_default_string,
      });
      return [false,"올바른 학습시간을 입력해주세요"];
    }
    else if(textbookStudyData.finishedState===false && !checkStudyExcuseValid(textbookStudyData.excuse)){
      return [false,"과제 미완료 사유를 15 글자 이상 입력해주세요"];
    }
    else return [true,""];
  }

  const isInitialMount = useRef(true);

  //교재 이름과 db _id를 매핑해주는 코드
  const [textbookIDMapping,setTextbookIDMapping]= useState({}); //교재 이름과 db _id를 매핑해주는 dictionary
  function checkTextbookIsValid(textbookName){
    return textbookIDMapping[textbookName]?true:false;
  }

  //수업 및 일반교재(type2) 관련 코드
  const [textbookStudyDisplayList,setTextbookStudyDisplayList]= useState([]);
  const default_LAT_element_name="선택";
  const default_LAT_element_id="default";
  const duplicatable_LAT_element_tmp_id="duplicatable";
  const duplicatable_LAT_element_name_list=["모의고사","테스트","기타"];
  const duplicatable_LAT_element_subject_list=["국어","수학","영어","탐구","기타"];
  const textbookStudyDataDeletePayloadTemplate={
    "textbookID":"",
    "elementID":"",
    "duplicatable":false,
    "requestNew":true,
    "duplicatable_name":"",
    "duplicatable_subject":"",
    "recent_page":"",
  };
  function getTextbookStudyDataDeleteRequestPayload(study_data){
    const ret={...textbookStudyDataDeletePayloadTemplate};
    if(study_data["duplicatable"]){
      ret.elementID=study_data.elementID;
      ret.duplicatable=true;
    }
    else{
      ret.textbookID=study_data.textbookID;
      ret.duplicatable=false;
    }
    ret.requestNew=study_data.request_new;
    return ret;
  }
  function isLATTableElementNameDefault(element_name){
    return element_name===default_LAT_element_name;
  }
  function isLATTableElementNameDuplicatable(element_name){
    return duplicatable_LAT_element_name_list.includes(element_name);
  }
  function checkNewLATTableElementNameValid(element_name){
    if(isLATTableElementNameDefault(element_name) || isLATTableElementNameDuplicatable(element_name)) return [true,""];
    //check this textbook name already in table
    for(let i=0; i<textbookStudyDisplayList.length; i++){
      const LAT_request_element_id=textbookStudyDisplayList[i];
      const textbook_info=getTextbookInfoByLATRequestID(LAT_request_element_id);
      const table_element_name=textbook_info.교재;
      if(isLATTableElementNameDefault(element_name) || isLATTableElementNameDuplicatable(element_name)) continue;
      else if(table_element_name===element_name) return [false,"이미 리스트에 포함되어있는 교재입니다"];
    }
    //check this textbook is in today's lecture assignment
    if(checkTodayAssignmentIncludeTextbook(element_name)) return [false,"오늘자 강의 과제에 포함되어있는 교재입니다"];
    return [true,""];
  }
  
  function getLATRequestIDFromTableElement(tableElement){
    if("textbookID" in tableElement && tableElement.textbookID) return ["textbook",tableElement.textbookID].join("#");
    else if("elementID" in tableElement && tableElement.elementID) return ["element",tableElement.elementID].join("#");
    else return ["element",default_LAT_element_id].join("#");
  }
  function getLATTableElementNameFromLATRequestID(LATRequestID){
    if(isLATTableElementNameDefault(LATRequestID)) return default_LAT_element_name;
    const [element_type,element_id]=LATRequestID.split("#");
    if(element_type==="textbook"){
      return textbookIDMapping.reverse[element_id];
    }
    else if(element_type==="element"){
      return LATRequestStatusMap[LATRequestID].request_specific_data.duplicatable_name;
    }
  }
  function getLATRequestIDFromOptionName(optionName,prev_table_element_request_id=""){
    const [prev_element_type,prev_element_id]= prev_table_element_request_id.split("#");
    console.log(`prev element type: ${prev_element_type}, prev element id: ${prev_element_id}`);
    const cur_element_type=isLATTableElementNameDefault(optionName) || isLATTableElementNameDuplicatable(optionName)?"element":"textbook";
    if(cur_element_type==="textbook") return ["textbook",textbookIDMapping[optionName]].join("#");
    else return ["element",prev_element_type==="element"?prev_element_id:getNewObjectIDString()].join("#");
  }
  function isLATTableElementRecentPageChangable(optionName){
    return !(isLATTableElementNameDefault(optionName) || isLATTableElementNameDuplicatable(optionName));
  }
  function isLATTableAppendable(){
    return textbookStudyDisplayList.length<max_table_element_count;
  }
  // function getLATTableElementTemplate(current_studying_book={}){
  //   return {
  //     과목:"",
  //     교재:"",
  //     총교재량:"",
  //     교재시작일:"",
  //     권장종료일:"",
  //     최근진도:0,
  //     최근진도율:0,
  //     ...current_studying_book,
  //     textbookID:"",
  //     elementID:"",
  //     duplicatable:false,
  //     duplicatable_name:"",
  //     duplicatable_subject:"",
  //     recent_page:0,
  //   };
  // }
  // function getLATTableElementFromLATRequestID(LATRequestID){
  //   const [element_type,element_id]=LATRequestID.split("#");
  //   if(element_type==="textbook"){
  //     for(let i=0; i<myStudyInfo.진행중교재.length; i++){
  //       const study_info=myStudyInfo.진행중교재[i];
  //       const textbook_name=study_info.교재;
  //       const textbook_id=textbookIDMapping[textbook_name];
  //       if(textbook_id===element_id){
  //         const ret=getLATTableElementTemplate(study_info);
  //         ret.textbookID=element_id;
  //         return ret;
  //       }
  //     }
  //   }
  //   else if(element_type==="element"){
  //     const ret=getLATTableElementTemplate();
  //     const LAT_request_element=LATRequestStatusMap[LATRequestID];
  //     const request_specific_data=LAT_request_element.request_specific_data;
  //     ret.elementID=element_id;
  //     ret.duplicatable=true;
  //     ret.duplicatable_name=request_specific_data.duplicatable_name;
  //     ret.duplicatable_subject=request_specific_data.duplicatable_subject;
  //     ret.과목=ret.duplicatable_subject;
  //     ret.교재=ret.duplicatable_name;
  //     return ret;
  //   }
  // }
  function getTextbookStudyDisplayListDefault(){
    const ret=JSON.parse(JSON.stringify(myStudyInfo.진행중교재));
    ret.forEach((e,idx)=>{
      e["textbookID"]=textbookIDMapping[e.교재];
      e["duplicatable"]=false;
    });
    return ret;
  }
  function getTextbookStudyDisplayListFromLATRequestStatusMap(){
    const ret_dict={};
    const tmp_LAT_list=myStudyInfo.진행중교재;
    //LAT table textbook elements
    tmp_LAT_list.forEach((e,idx)=>{
      const textbook_name=e.교재;
      const textbook_id=textbookIDMapping[textbook_name];
      const LAT_request_id=["textbook",textbook_id].join("#");
      // marked as deleted or included in today's lecture assignment then cannot be LAT table
      if(checkLATRequestElementDeleted(LAT_request_id) || checkTodayAssignmentIncludeTextbook(textbook_name)) return;
      // const element_copy=getLATTableElementTemplate(e);
      // element_copy.textbookID=textbook_id;
      ret_dict[LAT_request_id]=true;  
    });
    //LAT table duplicatable elements
    Object.keys(LATRequestStatusMap).forEach((LAT_key,idx)=>{
      const [element_type,element_id]=LAT_key.split("#");
      if(element_type==="element") {
        // ret_dict[LAT_key]=getLATTableElementFromLATRequestID(LAT_key);
        ret_dict[LAT_key]=true;
      }
    });

    //sort to display elements in somewhat consistent order
    const ret_dict_keys=Object.keys(ret_dict);
    ret_dict_keys.sort((a,b)=>{ // textbook<duplicatable && element id ascending order
      const [a_element_type,a_element_id]= a.split("#");
      const [b_element_type,b_element_id]= b.split("#");
      if(a_element_type!==b_element_type) return a_element_type==="textbook"?-1:1;
      else return a_element_id<b_element_id?-1:a_element_id>b_element_id?1:0;
    });
    // return ret_dict_keys.map((key,idx)=>ret_dict[key]);
    return ret_dict_keys;
  }

  useEffect(()=>{
    if(Object.keys(textbookIDMapping).length>0 && LATRequestStatusMap){
      // setTextbookStudyDisplayList(getTextbookStudyDisplayListDefault());
      setTextbookStudyDisplayList(getTextbookStudyDisplayListFromLATRequestStatusMap());
    }
  },[textbookIDMapping,LATRequestStatusMap,myAssignmentInfo]);

  //프로그램 이수(type3) 관련 코드
  const [programRequestStatusMap,setProgramRequestStatusMap]=useState(null);
  const default_program_element_name="선택";
  const program_name_list=[
    default_program_element_name,
    "자기인식",
    "진로탐색",
    "헬스",
    "외부활동",
    "독서",
    "외국어"
  ];
  const program_description_min_len=10;
  const program_description_max_len=500;
  function getProgramRequestElementTemplate(){
    return {
      request_specific_data:{
        elementID:"",
        program_name:"",
        program_by:"",
        program_description:"",
        request_new:true,
      },
      deleted:false,
      request_type:3,
      request_status:0,
      study_data:getStudyDataTemplate(),
    };
  }
  function getProgramRequestElementFromProgramRequestID(programRequestStatusMapCopy,programRequestID=""){
    if(programRequestID in programRequestStatusMapCopy) return programRequestStatusMapCopy[programRequestID];
    const new_request_element=getProgramRequestElementTemplate();
    const request_specific_data=new_request_element.request_specific_data;
    request_specific_data.elementID=programRequestID;
    return new_request_element;
  }
  function insertProgramRequestElement(programRequestID,updateVal={}){
    console.log(`insert element: ${programRequestID}`);
    setProgramRequestStatusMap(prevProgramRequestStatusMap=>{
      const newProgramRequestStatusMap=JSON.parse(JSON.stringify(prevProgramRequestStatusMap));
      const program_request_element=getProgramRequestElementFromProgramRequestID(newProgramRequestStatusMap,programRequestID);
      const program_request_element_request_specific_data= program_request_element.request_specific_data;
      // program_request_element_request_specific_data.deleted=false;
      program_request_element.deleted=false;
      Object.keys(updateVal).forEach((field_name,idx)=>{
        let target_object=program_request_element;
        const updated_val=updateVal[field_name];
        const field_path=field_name.split(".");
        const field_path_count=field_path.length;
        for(let i=0; i<field_path_count-1; i++){
          target_object=target_object[field_path[i]];
        }
        target_object[field_path[field_path_count-1]]=updated_val;
      });
      newProgramRequestStatusMap[programRequestID]=program_request_element;
      return newProgramRequestStatusMap;
    });
  }
  function updateProgramRequestElementByProgramRequestID(programRequestID,updateVal){
    setProgramRequestStatusMap(prevProgramRequestStatusMap=>{
      const newProgramRequestStatusMap=JSON.parse(JSON.stringify(prevProgramRequestStatusMap));
      const program_request_element=getProgramRequestElementFromProgramRequestID(newProgramRequestStatusMap,programRequestID);
      Object.keys(updateVal).forEach((field_name,idx)=>{
        let target_object=program_request_element;
        const updated_val=updateVal[field_name];
        const field_path=field_name.split(".");
        const field_path_count=field_path.length;
        for(let i=0; i<field_path_count-1; i++){
          target_object=target_object[field_path[i]];
        }
        target_object[field_path[field_path_count-1]]=updated_val;
      });
      return newProgramRequestStatusMap;
    });
  }
  function updateProgramRequestElementIDByOldProgramRequestID(programRequestID){
    setProgramRequestStatusMap(prevProgramRequestStatusMap=>{
      const newProgramRequestStatusMap=JSON.parse(JSON.stringify(prevProgramRequestStatusMap));
      if(!(programRequestID in newProgramRequestStatusMap)){
        return newProgramRequestStatusMap;
      }
      const program_request_element=getProgramRequestElementFromProgramRequestID(newProgramRequestStatusMap,programRequestID);
      const new_element_id=getNewProgramRequestID();
      while(new_element_id in newProgramRequestStatusMap) new_element_id=getNewProgramRequestID();
      newProgramRequestStatusMap[new_element_id]=program_request_element;
      return newProgramRequestStatusMap;
    });
  }
  function deleteProgramRequestElement(programRequestID){
    setProgramRequestStatusMap(prevProgramRequestStatusMap=>{
      const newProgramRequestStatusMap=JSON.parse(JSON.stringify(prevProgramRequestStatusMap));
      delete newProgramRequestStatusMap[programRequestID];
      return newProgramRequestStatusMap;
    });
  }
  function checkProgramRequestElementDeleted(programRequestID){
    if(!(programRequestID in programRequestStatusMap)) return false;
    // const request_specific_data=LATRequestStatusMap[LATRequestID].request_specific_data;
    // if(!("deleted" in request_specific_data)) return false;
    // return request_specific_data.deleted;
    const request_element=getProgramRequestElementFromProgramRequestID(programRequestStatusMap,programRequestID);
    return !!request_element.deleted;
  }
  function getNewProgramRequestID(){
    return getNewObjectIDString();
  }
  const [programDisplayList,setProgramDisplayList]= useState([]);
  const programDataDeletePayloadTemplate={
    "elementID":"",
    "requestNew":true,
  };
  function getProgramDataDeleteRequestPayload(study_data){
    const ret={...programDataDeletePayloadTemplate};
    ret.elementID=study_data.elementID;
    ret.requestNew=study_data.request_new;
    return ret;
  }
  function isProgramTableAppendable(){
    return programDisplayList.length<max_table_element_count;
  }
  function getProgramDisplayListFromProgramRequestStatusMap(){
    const ret_dict={};
    Object.keys(programRequestStatusMap).forEach((program_key,idx)=>{
      ret_dict[program_key]=true;
    });

    //sort to display elements in somewhat consistent order
    const ret_dict_keys=Object.keys(ret_dict);
    ret_dict_keys.sort((a,b)=>{
      const a_element_id=a;
      const b_element_id=b;
      return a_element_id<b_element_id?-1:a_element_id>b_element_id?1:0;
    });
    // return ret_dict_keys.map((key,idx)=>ret_dict[key]);
    return ret_dict_keys;
  }
  function getProgramDataPayloadTemplate(){
    return {
      "elementID":"",
      "deleted":false,
      "programName":"",
      "programBy":"",
      "programDescription":"",
      "requestNew":true,
      "timeAmount":time_default_string,
      "excuse":"",
      "finishedState":true,
      "reviewedBy":null,
    };
  }
  function getProgramDataByProgramRequestID(programRequestID,programFinished=true){
    // const ret={...assignmentStudyDataPayloadTemplate,AOSID};
    // ret["excuse"]=myAssignmentStudyData[AOSID].excuse;
    // ret["timeAmount"]=myAssignmentStudyData[AOSID].time_amount;
    // ret["finishedState"]=textbookStudyFinished;
    // if(textbookStudyFinished) ret.excuse="";
    // return ret;
    const program_request_element=getProgramRequestElementFromProgramRequestID(programRequestStatusMap,programRequestID);
    const request_specific_data=program_request_element.request_specific_data;
    const study_data=program_request_element.study_data;
    const ret={...(getProgramDataPayloadTemplate())};
    ret["elementID"]=programRequestID;
    ret["programName"]=request_specific_data.program_name;
    ret["programBy"]=request_specific_data.program_by;
    ret["programDescription"]=request_specific_data.program_description;
    ret["requestNew"]=request_specific_data.request_new;
    ret["timeAmount"]=study_data.time_amount;
    ret["finishedState"]=programFinished;
    ret["reviewedBy"]=[requestGoesTo];
    return ret;
  }
  function isProgramNameDefault(programName){
    return programName===default_program_element_name;
  }
  function isProgramByDefault(programBy){
    return programBy===default_program_element_name;
  }
  function isProgramDescriptionValid(programDescription){
    if(typeof programDescription!=="string") return false;
    return intBetween(programDescription.length,program_description_min_len,program_description_max_len);
  }
  function isProgramDataValid(programData,programRequestID){
    if(!programData) return [false,`error occurred`];
    else if(!programData.programName || isProgramNameDefault(programData.programName)){
      return [false,"올바른 프로그램 분류를 선택해주세요"];
    }
    else if(!programData.programBy || isProgramByDefault(programData.programBy)){
      return [false,"올바른 프로그램 진행 매니저를 선택해주세요"];
    }
    else if(!checkTimeStringValid(programData.timeAmount)){
      updateProgramRequestElementByProgramRequestID(programRequestID,{
        "study_data.time_amount":time_default_string,
      });
      return [false,"올바른 프로그램 소요 시간을 입력해주세요"];
    }
    else if(!programData.programDescription || !isProgramDescriptionValid(programData.programDescription)){
      return [false,`프로그램에 대한 설명을 ${program_description_min_len}자 이상 적어주세요`];
    }
    else return [true,""];
  }
  async function saveProgramDataByProgramRequestID(programRequestID,finishedState){
    const program_element_brief=getBriefStringFromProgramRequestID(programRequestID);
    const program_data=getProgramDataByProgramRequestID(programRequestID,true);
    console.log(`program data payload: ${JSON.stringify(program_data)}`);

    //check if study data for assingment valid
    const [programDataValid,msg]= isProgramDataValid(program_data,programRequestID);
    if(!programDataValid){
      window.alert(`${msg}`);
      return;
    }
    const [save_successful,reset_object_id]= await axios
      .post("/api/saveProgramDataRequest",program_data)
      .then((res)=>{
        const data=res.data;
        if(!data.success) {
          window.alert(`네트워크 오류로 프로그램 데이터를 저장하지 못했습니다:0`);
          return [false,false];
        }
        else{
          const ret_info=data.ret;
          if(ret_info && typeof ret_info==="object" && "reset_object_id" in ret_info && ret_info.reset_object_id===true) {
            window.alert(`네트워크 오류로 프로그램 데이터를 저장하지 못했습니다:0.5`);
            return [false,true];
          }
        }
        window.alert(`성공적으로 프로그램 데이터를 저장했습니다`);
        return [true,false];
      })
      .catch((error)=>{
        console.log(`error: ${error}`);
        window.alert(`네트워크 오류로 프로그램 데이터를 저장하지 못했습니다:1`);
        return [false,false];
      });
    if(reset_object_id){
      updateProgramRequestElementIDByOldProgramRequestID(programRequestID);
      return false;
    }
    if(save_successful){
      updateProgramRequestElementByProgramRequestID(programRequestID,{
        "request_specific_data.request_new":false,
      });
    }
    return save_successful;
  }
  function getBriefStringFromProgramRequestID(programRequestID){
    const program_request_element=programRequestStatusMap[programRequestID];
    const request_specific_data=program_request_element.request_specific_data;
    const ret_list=[];
    if(!!request_specific_data.program_name) ret_list.push(request_specific_data.program_name);
    if(!!request_specific_data.program_description){
      if(request_specific_data.program_description.length>20) ret_list.push(request_specific_data.program_description.slice(0,20)+"...");
      else ret_list.push(request_specific_data.program_description);
    }
    return ret_list.join(",");
  }

  useEffect(()=>{
    if(Object.keys(managerList).length>0 && programRequestStatusMap){
      // setTextbookStudyDisplayList(getTextbookStudyDisplayListDefault());
      setProgramDisplayList(getProgramDisplayListFromProgramRequestStatusMap());
    }
  },[managerList,programRequestStatusMap]);  

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
  function getBriefStringFromAssignment(assignment){
    const ret_list=[assignment["lectureName"]];
    if(assignment["textbookName"]){
      ret_list.push(assignment["textbookName"]);
      if("pageRangeArray" in assignment && assignment["pageRangeArray"].length>0){
        for(let i=0; i<assignment["pageRangeArray"].length; i++){
          const range=assignment["pageRangeArray"][i];
          ret_list.push(`${range[0]}~${range[1]}`);
        }
      }
    }
    if(assignment["description"]) ret_list.push(assignment["description"]);
    return ret_list.join(",");
  }
  function getBriefStringFromLATRequestID(LATRequestID){
    const [element_type,element_id]=LATRequestID.split("#");
    const LAT_request_element=LATRequestStatusMap[LATRequestID];
    const request_specific_data=LAT_request_element.request_specific_data;
    const ret_list=[];
    if(request_specific_data.duplicatable===false) ret_list.push(textbookIDMapping.reverse[request_specific_data.textbookID]);
    else{
      ret_list.push(request_specific_data.duplicatable_subject);
      ret_list.push(request_specific_data.duplicatable_name);
    }
    return ret_list.join(",");
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
  
  const [assignmentStudyTime,setAssignmentStudyTime]= useState({}); // 강의 과제의 학습 시간, 미완료 사유를 담는 dictionary
  function getAssignmentStudyTimeElementFromAssignmentData(assignmentData){
    return {
      과목: assignmentData["lectureSubject"],
      교재: assignmentData["textbookName"],
      총교재량: "",
      최근진도: "",
      학습시간: "00:00",
      excuse:"",
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

  const [currentConfirmInfo,setCurrentConfirmInfo]= useState({}); //excuse modal related data
  const [showConfirmModal,setShowConfirmModal]= useState(false); //excuse modal open/close state
  const [confirmType,setConfirmType]= useState(-1);
  const [requestGoesTo,setRequestGoesTo]= useState(null); //user name who will receive current displayed draft element confirm request

  const confirmTypeToIndexMap={
    "default":-1,
    "life":0,
    "assignment":1,
    "lectureAndTextbook":2,
    "programParticipation":3
  }
  function getConfirmModalTitle(){
    if(confirmType===confirmTypeToIndexMap["default"]) return "";
    else if(confirmType===confirmTypeToIndexMap["life"]) return "생활 정보 확인";
    else if(confirmType===confirmTypeToIndexMap["assignment"]) return "수업 과제 학습 확인";
    else if(confirmType===confirmTypeToIndexMap["lectureAndTextbook"]) return "수업 및 일반교재 학습 확인";
    else if(confirmType===confirmTypeToIndexMap["programParticipation"]) return "진행한 프로그램 확인";
  }
  function getConfirmModalBody(){
    if(confirmType===confirmTypeToIndexMap["default"]) return null;
    else if(confirmType===confirmTypeToIndexMap["life"]) return getLifeModalBody();
    else if(confirmType===confirmTypeToIndexMap["assignment"]) return getAssignmentStudyModalBody();
    else if(confirmType===confirmTypeToIndexMap["lectureAndTextbook"]) return getLATStudyModalBody();
    else if(confirmType===confirmTypeToIndexMap["programParticipation"]) return getProgramParticipationModalBody();
  }
  
  const confirm_for_template={
    confirm_for:"assignment",
    extra_data:[],
    description:"",
    finished_state:true,
  }
  const [confirmFor,setConfirmFor]= useState(confirm_for_template); // which study type the excuse for (assignment/textbook)

  const openConfirmModal= (confirm_for,finished_state,description,...extra_data)=>{
    // setCurrentExcuseInfo(newGoalExcuseData);
    setConfirmFor({confirm_for,description,finished_state,extra_data});
    setConfirmType(confirmTypeToIndexMap[confirm_for]);
    setShowConfirmModal(true);
  };
  const closeConfirmModal= ()=>{
    setConfirmType(null); // this state setting should come first because...
    setRequestGoesTo(null);
    // setCurrentExcuseInfo({});
    setConfirmFor(confirm_for_template);
    setShowConfirmModal(false);
  }
  function getLifeModalBody(){
    const life_data=getLifeData();
    const body_condition=life_data.bodyCondition;
    const sentiment_condition=life_data.sentimentCondition;
    const go_to_bed_time=life_data.goToBedTime;
    const wake_up_time=life_data.wakeUpTime;
    return (
      <Modal.Body className="text-center">
        <div className="border-bottom border-secondary border-3 mb-5">
          <div className="row mb-2">
            <div className="col-6">신체 컨디션</div>
            <div className="col-6">{body_condition}</div>
          </div>
          <div className="row mb-2">
            <div className="col-6">정서 컨디션</div>
            <div className="col-6">{sentiment_condition}</div>
          </div>
          <div className="row mb-2">
            <div className="col-6">실제 취침 시간</div>
            <div className="col-6">{go_to_bed_time}</div>
          </div>
          <div className="row mb-2">
            <div className="col-6">실제 기상 시간</div>
            <div className="col-6">{wake_up_time}</div>
          </div>
        </div>

        <div className="row mb-2">
          <div className="col-3">리뷰어 지정</div>
          <div className="col-9">
            <Form.Select
              size="sm"
              className="ModalSelectBox"
              value={requestGoesTo}
              onChange={(e) => {
                const request_goes_to_val=e.target.value;
                setRequestGoesTo(request_goes_to_val);
              }}
            >
              <option value={null}>선택</option>
              {managerList.map(function (manager, idx) {
                const manager_username=manager.username;
                const manager_nickname=manager.nickname;
                return (
                    <option value={manager_username} key={idx}>
                      {manager_nickname}
                    </option>
                );
              })}
            </Form.Select>
          </div>
        </div>
        <Button
            className="btn-secondary"
            onClick={async ()=>{
              if(!checkReviewerUsernameValid(requestGoesTo)){
                window.alert(`확인 요청에 대한 리뷰어가 지정되지 않았습니다`);
                return;
              }
              else if(!window.confirm(`생활 정보의 확인 요청을 '${getManagerNicknameByUsername(requestGoesTo)}' 매니저에게 보내시겠습니까?`)) return;
              const save_success= await saveLifeData();
              if(save_success) closeConfirmModal();
            }}
            type="button">
          <strong>확인 요청</strong>
        </Button>
      </Modal.Body>
    );
  }
  function getAssignmentStudyModalBody(){
    const AOSID=confirmFor.extra_data[0];
    const finished_state=confirmFor.finished_state;
    const assignment_element=getAssignmentElementByAOSID(confirmFor.extra_data[0]);
    const lecture_name=assignment_element.lectureName;
    const lecturer=assignment_element.manager;
    const lecture_subject=assignment_element.lectureSubject;
    const page_range_array=assignment_element.pageRangeArray;
    const description=assignment_element.description;
    const page_range_exists=checkAssignmentElementHasPageRangeElement(assignment_element);
    const description_exists=checkAssignmentElementHasDescription(assignment_element);
    const assignment_study_data=getAssignmentStudyDataByAOSID(AOSID);
    const study_data_time_amount=assignment_study_data.timeAmount;
    const excuse=!finished_state?myAssignmentStudyData[AOSID].excuse:"";
    return (
      <Modal.Body className="text-center">
        <div className="border-bottom border-secondary border-3 mb-5">
          <div className="row mb-2">
            <div className="col-3">강사명</div>
            <div className="col-9">{lecture_name}</div>
          </div>
          <div className="row mb-2">
            <div className="col-3">강의명</div>
            <div className="col-9">{lecturer}</div>
          </div>
          <div className="row mb-2">
            <div className="col-3">과목 구분</div>
            <div className="col-9">{lecture_subject}</div>
          </div>
          {page_range_exists?
            page_range_array.map((page_range,idx)=>{
              const from=page_range[0];
              const to=page_range[1];
              return (
                <div className={idx===page_range_array.length-1?"row mb-2":"row"}>
                  <div className="col-3">{idx===0?"과제 범위":""}</div>
                  <div className="col-9">{`${from} ~ ${to}`}</div>
                </div>
              );
            })
            
          :null}
          {description_exists?
            <div className="row mb-2">
              <div className="col-3">상세 설명</div>
              <div className="col-9">{description}</div>
            </div>
          :null}
        </div>

        <div className="border-bottom border-secondary border-3 mb-5">
          <div className="row mb-2">
            <div className="col-3">소요 시간</div>
            <div className="col-9">{study_data_time_amount}</div>
          </div>
        </div>

        {!finished_state?
          <Form.Control
            as="textarea"
            placeholder="여기에 사유를 입력해주세요(15자 이상)"
            maxLength={excuse_max_len}
            className="mb-3 ModalTextarea"
            value={excuse}
            onChange={(event)=>{
              const changed_excuse=event.target.value;
              const newAssignmentStudyData= JSON.parse(JSON.stringify(myAssignmentStudyData));
              if(!(AOSID in newAssignmentStudyData)) newAssignmentStudyData[AOSID]={...assignmentStudyDataTemplate};
              newAssignmentStudyData[AOSID].excuse=changed_excuse;
              setMyAssignmentStudyData(newAssignmentStudyData);
              return;
            }}
         />
        :null}
        <div className="row mb-2">
          <div className="col-3">리뷰어 지정</div>
          <div className="col-9">
            <Form.Select
              size="sm"
              className="ModalSelectBox"
              value={requestGoesTo}
              onChange={(e) => {
                const request_goes_to_val=e.target.value;
                setRequestGoesTo(request_goes_to_val);
              }}
            >
              <option value={null}>선택</option>
              {managerList.map(function (manager, idx) {
                const manager_username=manager.username;
                const manager_nickname=manager.nickname;
                return (
                    <option value={manager_username} key={idx}>
                      {manager_nickname}
                    </option>
                );
              })}
            </Form.Select>
          </div>
        </div>
        <Button
            className="btn-secondary"
            onClick={async ()=>{
              if(!checkReviewerUsernameValid(requestGoesTo)){
                window.alert(`확인 요청에 대한 리뷰어가 지정되지 않았습니다`);
                return;
              }
              else if(!window.confirm(`해당 과제의 확인 요청을 '${getManagerNicknameByUsername(requestGoesTo)}' 매니저에게 보내시겠습니까?`)) return;
              const save_success= await saveAssignmentStudyDataByAOSID(AOSID,finished_state);
              if(save_success) closeConfirmModal();
            }}
            type="button">
          <strong>확인 요청</strong>
        </Button>
      </Modal.Body>
    );
  }
  function getLATStudyModalBody(){
    const LAT_request_id=confirmFor.extra_data[0];
    const [element_type,element_id]=LAT_request_id.split("#");
    const finished_state=confirmFor.finished_state;
    const LAT_request_element=getLATRequestElementFromLATRequestID(LATRequestStatusMap,LAT_request_id);
    const request_specific_data=LAT_request_element.request_specific_data;
    const element_duplicatable=LAT_request_element.duplicatable;
    
    const textbook_info=getTextbookInfoByLATRequestID(LAT_request_id);
    const LAT_subject=textbook_info["과목"];
    const textbook_name=textbook_info["교재"];
    const textbook_volume=textbook_info["총교재량"];
    const textbook_volume_exists=!element_duplicatable;
    const LAT_today_goal=getTodayGoalByTextbookName(textbook_name);
    const LAT_today_goal_exists=!element_duplicatable && LAT_today_goal;
    const textbook_recent_page=checkLATRequestElementRecentPageNull(request_specific_data.recent_page)?textbook_info.최근진도:request_specific_data.recent_page;
    const textbook_recent_page_exists=!element_duplicatable;

    const study_data=LAT_request_element.study_data;
    const study_data_time_amount=study_data.time_amount;
    const excuse=!finished_state?study_data.excuse:"";
    return (
      <Modal.Body className="text-center">
        <div className="border-bottom border-secondary border-3 mb-5">
          <div className="row mb-2">
            <div className="col-3">과목 구분</div>
            <div className="col-9">{LAT_subject}</div>
          </div>
          <div className="row mb-2">
            <div className="col-3">{element_duplicatable?"학습명":"교재명"}</div>
            <div className="col-9">{textbook_name}</div>
          </div>
          {textbook_volume_exists?
            <div className="row mb-2">
              <div className="col-3">총 교재량</div>
              <div className="col-9">{textbook_volume}</div>
            </div>
          :null}
          {LAT_today_goal_exists?
            <div className="row mb-2">
              <div className="col-3">오늘 목표량</div>
              <div className="col-9">{LAT_today_goal}</div>
            </div>
          :null}
          {textbook_recent_page_exists?
            <div className="row mb-2">
              <div className="col-3">최근 진도</div>
              <div className="col-9">{textbook_recent_page}</div>
            </div>
          :null}
        </div>

        <div className="border-bottom border-secondary border-3 mb-5">
          <div className="row mb-2">
            <div className="col-3">소요 시간</div>
            <div className="col-9">{study_data_time_amount}</div>
          </div>
        </div>

        {!finished_state?
          <Form.Control
            as="textarea"
            placeholder="여기에 사유를 입력해주세요(15자 이상)"
            maxLength={excuse_max_len}
            className="mb-3 ModalTextarea"
            value={excuse}
            onChange={(event)=>{
              const changed_excuse=event.target.value;
              updateLATRequestElementByLATRequestID(LAT_request_id,{
                "study_data.excuse":changed_excuse,
              });
            }}
         />
        :null}
        <div className="row mb-2">
          <div className="col-3">리뷰어 지정</div>
          <div className="col-9">
            <Form.Select
              size="sm"
              className="ModalSelectBox"
              value={requestGoesTo}
              onChange={(e) => {
                const request_goes_to_val=e.target.value;
                setRequestGoesTo(request_goes_to_val);
              }}
            >
              <option value={null}>선택</option>
              {managerList.map(function (manager, idx) {
                const manager_username=manager.username;
                const manager_nickname=manager.nickname;
                return (
                    <option value={manager_username} key={idx}>
                      {manager_nickname}
                    </option>
                );
              })}
            </Form.Select>
          </div>
        </div>
        <Button
            className="btn-secondary"
            onClick={async ()=>{
              if(!checkReviewerUsernameValid(requestGoesTo)){
                window.alert(`확인 요청에 대한 리뷰어가 지정되지 않았습니다`);
                return;
              }
              else if(!window.confirm(`해당 과제의 확인 요청을 '${getManagerNicknameByUsername(requestGoesTo)}' 매니저에게 보내시겠습니까?`)) return;
              const save_success= await saveLATStudyDataByLATRequestID(LAT_request_id,finished_state);
              if(save_success) closeConfirmModal();
            }}
            type="button">
          <strong>확인 요청</strong>
        </Button>
      </Modal.Body>
    );
  }
  function getProgramParticipationModalBody(){
    const program_request_id=confirmFor.extra_data[0];
    const finished_state=confirmFor.finished_state;
    const program_request_element=getProgramRequestElementFromProgramRequestID(programRequestStatusMap,program_request_id);
    const request_specific_data=program_request_element.request_specific_data;
    const program_name=request_specific_data.program_name;
    const program_by=request_specific_data.program_by;
    const program_by_nickname=getManagerNicknameByUsername(program_by);
    const program_description=request_specific_data.program_description;

    const study_data=program_request_element.study_data;
    const study_data_time_amount=study_data.time_amount;
    return (
      <Modal.Body className="text-center">
        <div className="border-bottom border-secondary border-3 mb-5">
          <div className="row mb-2">
            <div className="col-3">구분</div>
            <div className="col-9">{program_name}</div>
          </div>
          <div className="row mb-2">
            <div className="col-3">진행자</div>
            <div className="col-9">{program_by_nickname}</div>
          </div>
          <div className="row mb-2">
            <div className="col-3">설명</div>
            <div className="col-9">{program_description}</div>
          </div>
        </div>

        <div className="border-bottom border-secondary border-3 mb-5">
          <div className="row mb-2">
            <div className="col-3">소요 시간</div>
            <div className="col-9">{study_data_time_amount}</div>
          </div>
        </div>

        <div className="row mb-2">
          <div className="col-3">리뷰어 지정</div>
          <div className="col-9">
            <Form.Select
              size="sm"
              className="ModalSelectBox"
              value={requestGoesTo}
              onChange={(e) => {
                const request_goes_to_val=e.target.value;
                setRequestGoesTo(request_goes_to_val);
              }}
            >
              <option value={null}>선택</option>
              {managerList.map(function (manager, idx) {
                const manager_username=manager.username;
                const manager_nickname=manager.nickname;
                return (
                    <option value={manager_username} key={idx}>
                      {manager_nickname}
                    </option>
                );
              })}
            </Form.Select>
          </div>
        </div>
        <Button
            className="btn-secondary"
            onClick={async ()=>{
              if(!checkReviewerUsernameValid(requestGoesTo)){
                window.alert(`확인 요청에 대한 리뷰어가 지정되지 않았습니다`);
                return;
              }
              else if(!window.confirm(`해당 과제의 확인 요청을 '${getManagerNicknameByUsername(requestGoesTo)}' 매니저에게 보내시겠습니까?`)) return;
              const save_success= await saveProgramDataByProgramRequestID(program_request_id,finished_state);
              if(save_success) closeConfirmModal();
            }}
            type="button">
          <strong>확인 요청</strong>
        </Button>
      </Modal.Body>
    );
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
    return [default_LAT_element_name,...textbook_name_set,...duplicatable_LAT_element_name_list];
  }

  // useEffect(async () => {
  //   const newmanagerList = await axios
  //       .get("/api/managerList")
  //       .then((result) => {
  //         const data=result.data;
  //         if(data.success===true) return data.ret;
  //         else throw new Error(data.ret);
  //         // return result["data"];
  //       })
  //       .catch((err) => {
  //         return err;
  //       });
  //   setmanagerList(newmanagerList);
  //   isInitialMount.current = false;
  // }, []);

  useEffect(async ()=>{
    const manager_list= await axios
      .get("/api/managerListByStudentAccount")
      .then((res)=>{
        const data=res.data;
        if(!data.success) throw new Error('internal database connection error');
        return data.ret;
      })
      .catch((err)=>{
        window.alert(`데이터를 불러오는 중 오류가 발생했습니다.\n페이지를 새로고침 합니다.`);
        window.location.reload();
      });
    setmanagerList(manager_list);
  },[]);

  useEffect(async ()=>{
    if(validTextbookNames.length===0) return;
    const textbook_id_list= await axios
      .post("/api/getTextbookIDsByTextbookName",{textbookNames:validTextbookNames})
      .then((res)=>{
        const data=res.data;
        if(!data.success) throw new Error('internal database connection error');
        return data.ret;
      })
      .catch((err)=>{
        window.alert(`데이터를 불러오는 중 오류가 발생했습니다.\n페이지를 새로고침 합니다.`);
        window.location.reload();
      });
    const textbook_name_to_id_map={reverse:{}};
    textbook_id_list.forEach((e,idx)=>{
      textbook_name_to_id_map[e.교재]=e._id;
      textbook_name_to_id_map.reverse[e._id]=e.교재;
    });
    setTextbookIDMapping(textbook_name_to_id_map);
  },[validTextbookNames]);

  useEffect(()=>{
    if(myStudyInfo.진행중교재.length>0){
      setValidTextbookNames(getValidTextbookNameListForTextbookStudyTable());
    }
  },[myStudyInfo.진행중교재]);

  return (
      <div className="trEdit-background">
        {/*당일 과제 미완료 사유 작성 modal*/}
        <Modal show={showConfirmModal} onHide={closeConfirmModal}>
          <Modal.Header closeButton>
            <Modal.Title>{getConfirmModalTitle(confirmType)}</Modal.Title>
          </Modal.Header>
          {/* <Modal.Body className="text-center">
            <div className="row mb-5">
              <div className="col-3">과제 상세</div>
              <div className="col-9">{confirmFor.description}</div>
            </div>

            <Form.Control
                as="textarea"
                placeholder="여기에 사유를 입력해주세요(15자 이상)"
                maxLength={excuse_max_len}
                className="mb-3 ModalTextarea"
                onChange={(event)=>{
                  const excuse=event.target.value;
                  if(confirmFor.confirm_for==="assignment"){
                    const AOSID=confirmFor.extra_data[0];
                    const newAssignmentStudyData= JSON.parse(JSON.stringify(myAssignmentStudyData));
                    if(!(AOSID in newAssignmentStudyData)) newAssignmentStudyData[AOSID]={...assignmentStudyDataTemplate};
                    newAssignmentStudyData[AOSID].excuse=excuse;
                    setMyAssignmentStudyData(newAssignmentStudyData);
                    return;
                  }
                  else if(confirmFor.confirm_for==="lectureAndTextbook"){
                    updateLATRequestElementByLATRequestID(confirmFor.extra_data[0],{
                      "study_data.excuse":excuse,
                    });
                  }
                  // const newGoalExcuseData= JSON.parse(JSON.stringify(currentExcuseInfo));
                  // newGoalExcuseData["excuse"]=event.target.value;
                  // // console.log("excuse input: "+newGoalExcuseData["excuse"]);
                  // setCurrentExcuseInfo(newGoalExcuseData);
                }}
            />
            <Button
                className="btn-secondary"
                onClick={async ()=>{
                  // if(!window.confirm("과제 미완료 사유를 저장하시겠습니까?")) return;
                  // if(currentExcuseInfo["excuse"].length<15){
                  //   window.alert("사유를 15자 이상 입력해주세요");
                  //   return;
                  // }
                  // // console.log("cei: "+JSON.stringify(currentExcuseInfo));
                  // const goalAttribute= currentExcuseInfo["AOSID"]?goalAttributes.Assignment:goalAttributes.textbookProgress;
                  // const relatedID= currentExcuseInfo["AOSID"]?currentExcuseInfo["AOSID"]:currentExcuseInfo["textbookID"];
                  // updateGoalState(currentExcuseInfo,goalAttribute,relatedID,false);
                  if(confirmFor.confirm_for==="assignment"){
                    const save_success= await saveAssignmentStudyDataByAOSID(confirmFor.extra_data[0],false);
                    if(save_success) closeConfirmModal();
                  }
                  else if(confirmFor.confirm_for==="lectureAndTextbook"){
                    const save_success= await saveLATStudyDataByLATRequestID(confirmFor.extra_data[0],false);
                    if(save_success) closeConfirmModal();
                  }
                }}
                type="button">
              <strong>확인 요청</strong>
            </Button>
          </Modal.Body> */}
          {getConfirmModalBody()}
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
                  <Button
                    variant="secondary"
                    onClick={async ()=>{
                      const life_data= getLifeData();
                      const [valid,msg]= isLifeDataValid(life_data);
                      if(!valid){
                        window.alert(`${msg}`);
                        return;
                      }
                      openConfirmModal("life",true,"");
                    }}
                  >
                    save
                  </Button>
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
                                const AOSID=a.AOSID;
                                const goalState=AOSIDToSavedGoalStateMapping[AOSID];
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
                                            value={myAssignmentStudyData[a.AOSID]?myAssignmentStudyData[a.AOSID]["time_amount"]:null}
                                            openClockOnFocus={false}
                                            clearIcon={null}
                                            clockIcon={null}
                                            onChange={(value) => {
                                              const newAssignmentStudyData= JSON.parse(JSON.stringify(myAssignmentStudyData));
                                              if(!(a.AOSID in newAssignmentStudyData)) newAssignmentStudyData[a.AOSID]={...assignmentStudyDataTemplate};
                                              newAssignmentStudyData[a.AOSID].time_amount=value
                                              // console.log(`assignment study data: ${JSON.stringify(newAssignmentStudyData)}`);
                                              setMyAssignmentStudyData(newAssignmentStudyData);
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
                                              // saveAssignmentStudyDataByAOSID(AOSID,true);
                                              const study_data=getAssignmentStudyDataByAOSID(AOSID,true);
                                              // console.log(`study data: ${JSON.stringify(study_data)}`);
                                              if(!checkTimeStringValid(study_data.timeAmount)){
                                                window.alert(`완료 요청을 보내기 전 해당 과제에 대한 학습 시간을 입력해주세요`);
                                                return;
                                              }
                                              openConfirmModal("assignment",true,getBriefStringFromAssignment(getAssignmentElementByAOSID(a.AOSID)),a.AOSID);
                                            }}
                                        >
                                          <FaCheck></FaCheck>
                                        </button>
                                        <button
                                            className="btn btn-danger btn-opaque"
                                            onClick={async ()=>{
                                              // const assignmentData=a;
                                              // const dailyGoalCheckLogData=getDailyGoalCheckLogDataFromAssignment(assignmentData,false,"");
                                              const study_data=getAssignmentStudyDataByAOSID(AOSID,false);
                                              // console.log(`study data: ${JSON.stringify(study_data)}`);
                                              if(!checkTimeStringValid(study_data.timeAmount)){
                                                window.alert(`미완료 사유를 입력하기 전 해당 과제에 대한 학습 시간을 입력해주세요`);
                                                return;
                                              }
                                              openConfirmModal("assignment",false,getBriefStringFromAssignment(getAssignmentElementByAOSID(a.AOSID)),a.AOSID);
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

                
                {/*일간 TR 내 주간 학습 계획*/}
              </div>
            </div>
          </div>
          <div className="col-xl-6">
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
                {textbookStudyDisplayList.map((LAT_request_element_id, display_element_index)=> {
                  // const subject=a["과목"];
                  // const textbookName=a["교재"];
                  // const textbookID=textbookIDMapping[a["교재"]];
                  // const LAT_request_element_id=getLATRequestIDFromTableElement(a);
                  const [element_type,element_id]= LAT_request_element_id.split("#");
                  const LAT_request_element=getLATRequestElementFromLATRequestID(LATRequestStatusMap,LAT_request_element_id);
                  const request_specific_data=LAT_request_element.request_specific_data;
                  const textbook_info=getTextbookInfoByLATRequestID(LAT_request_element_id);
                  const textbookName=textbook_info.교재;
                  const textbookSubject=textbook_info.과목;
                  const textbookVolumne=textbook_info.총교재량;
                  const textbookTodayGoal=getTodayGoalByTextbookName(textbookName);
                  const textbookRecentPage= checkLATRequestElementRecentPageNull(request_specific_data.recent_page)?textbook_info.최근진도:request_specific_data.recent_page;
                  const textbookStudyTimeAmount=LAT_request_element.study_data.time_amount;
                  const textbookID=textbookIDMapping[textbookName];
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
                      <tr key={display_element_index} className={tableRowClassName}>
                        <td>
                          <button
                              className="btn btn-opaque"
                              onClick={async () => {
                                if(!window.confirm(`"${textbookName}"\n항목을 리스트에서 삭제하시겠습니까?`)) return;
                                const LAT_request_element=getLATRequestElementFromLATRequestID(LATRequestStatusMap,LAT_request_element_id);
                                const request_specific_data=LAT_request_element.request_specific_data;
                                const delete_request_payload=getTextbookStudyDataDeleteRequestPayload(request_specific_data);
                                const delete_success=await axios
                                  .post("/api/setLATStudyElementDeletedOnTrDraft",delete_request_payload)
                                  .then((res)=>{
                                    const data=res.data;
                                    if(!data.success) {
                                      window.alert(`네트워크 오류로 학습 항목 삭제에 실패했습니다:0`);
                                      return false;
                                    }
                                    return true;
                                  })
                                  .catch((error)=>{
                                    window.alert(`네트워크 오류로 학습 항목 삭제에 실패했습니다:1`);
                                    return false;
                                  });
                                if(!delete_success) return;
                                deleteLATRequestElement(LAT_request_element_id);
                              }}
                          >
                            <FaTrash></FaTrash>
                          </button>
                        </td>
                        <td>
                          {!isLATTableElementNameDuplicatable(textbookName)?textbookSubject:
                            <Form.Select
                                size="sm"
                                value={textbookSubject}
                                onChange={(e) => {
                                  const LAT_element_subject=e.target.value;
                                  updateLATRequestElementByLATRequestID(LAT_request_element_id,{
                                    "request_specific_data.duplicatable_subject":LAT_element_subject,
                                  });
                                }}
                            >
                              {
                                duplicatable_LAT_element_subject_list.map((option_name,idx)=>{
                                  return (
                                    <option value={option_name} key={idx}>
                                      {option_name}
                                    </option>
                                  );
                                  })
                              }
                            </Form.Select>
                          }
                        </td>
                        <td>
                          <Form.Select
                              size="sm"
                              value={textbookName}
                              onChange={(e) => {
                                console.log('changed');
                                const new_table_element_name=e.target.value;
                                const [changable,msg]=checkNewLATTableElementNameValid(new_table_element_name);
                                if(!changable){
                                  window.alert(msg);
                                  return;
                                }
                                const LAT_table_element_request_id=LAT_request_element_id;
                                const [prev_element_type,prev_element_id]= LAT_table_element_request_id.split("#");
                                const new_LAT_table_element_request_id=getLATRequestIDFromOptionName(new_table_element_name,LAT_table_element_request_id);
                                const [new_element_type,new_element_id]=new_LAT_table_element_request_id.split("#");
                                if(prev_element_type==="element" && new_element_type==="element"){
                                  updateLATRequestElementByLATRequestID(LAT_table_element_request_id,{
                                    // "request_specific_data.deleted":false,
                                    "deleted":false,
                                    "request_specific_data.duplicatable":true,
                                    "request_specific_data.duplicatable_name":new_table_element_name,
                                    "request_specific_data.duplicatable_subject":isLATTableElementNameDefault(new_table_element_name)?"":duplicatable_LAT_element_subject_list[0],
                                    "study_data.time_amount":null,
                                  });
                                }
                                else{
                                  if(prev_element_type==="element") deleteLATRequestElement(LAT_table_element_request_id);
                                  else if(!isLATTableAppendable()){
                                    window.alert(`작성할 수 있는 테이블 당 최대 항목 수를 넘어섰습니다`);
                                    return;
                                  }
                                  const new_element_duplicatable=new_element_type==="element";
                                  const new_element_duplicatable_name=new_element_duplicatable?new_table_element_name:"";
                                  const new_element_duplicatable_subject=new_element_duplicatable?(isLATTableElementNameDefault(new_table_element_name)?"":duplicatable_LAT_element_subject_list[0]):"";
                                  insertLATRequestElement(new_LAT_table_element_request_id,{
                                    // "request_specific_data.deleted":false,
                                    "deleted":false,
                                    "request_specific_data.duplicatable":new_element_duplicatable,
                                    "request_specific_data.duplicatable_name":new_element_duplicatable_name,
                                    "request_specific_data.duplicatable_subject":new_element_duplicatable_subject,
                                    "study_data.time_amount":null,
                                  });
                                }
                              }}
                          >
                            {/* <option value={getLATRequestIDFromTableElement(a)}>선택</option> */}
                            {/* {stuDB.진행중교재.map(function (book, index) {
                              return (
                                  <option value={book.교재} key={index}>
                                    {book.교재}
                                  </option>
                              );
                            })} */}
                            {
                              validTextbookNames.map((option_name,idx)=>{
                                return (
                                  <option value={option_name} key={idx}>
                                    {option_name}
                                  </option>
                                );
                                })
                            }
                            {/* <option value="모의고사">모의고사</option>
                            <option value="테스트">테스트</option>
                            <option value="기타">기타</option> */}
                          </Form.Select>
                        </td>
                        <td>
                          <p className="fs-13px">{textbookVolumne}</p>
                        </td>
                        <td>
                          <p className="fs-13px">{getTodayGoalByTextbookName(textbookName)}</p>
                        </td>
                        <td>
                          <input
                              type="number"
                              value={textbookRecentPage}
                              disabled={!isLATTableElementRecentPageChangable(textbookName)}
                              maxLength={5}
                              className="inputText"
                              onChange={(e) => {
                                const LAT_table_element_request_id=LAT_request_element_id;
                                const page_val=e.target.value;
                                updateLATRequestElementByLATRequestID(LAT_table_element_request_id,{
                                  "request_specific_data.recent_page":page_val,
                                });
                              }}
                          />
                        </td>
                        <td>
                          <TimePicker
                              className="timepicker"
                              locale="sv-sv"
                              value={textbookStudyTimeAmount}
                              openClockOnFocus={false}
                              clearIcon={null}
                              clockIcon={null}
                              onChange={(value) => {
                                const study_data_time_amount=value;
                                const LAT_table_element_request_id=LAT_request_element_id;
                                updateLATRequestElementByLATRequestID(LAT_table_element_request_id,{
                                  "study_data.time_amount":study_data_time_amount,
                                });
                              }}
                          ></TimePicker>
                        </td>
                        <td>
                          {!isLATTableElementNameDefault(textbookName)?(<>
                            <button
                                className="btn btn-success btn-opaque"
                                onClick={async ()=>{
                                  // if(!window.confirm(`선택한 수업 및 일반교재\n(${textbookSubject})[${textbookName}]\n학습의 확인 요청을 보내시겠습니까?`)) return;
                                  // const study_data= getTextbookStudyDataByLATRequestID(LAT_request_element_id,true);
                                  // console.log(`study data payload: ${JSON.stringify(study_data)}`);
                                  // // console.log(`study data: ${JSON.stringify(study_data)}`);
                                  
                                  // //check if study data for assingment valid
                                  // const [textbookStudyValid,msg]= isTextbookStudyDataValid(study_data,LAT_request_element_id);
                                  // if(!textbookStudyValid){
                                  //   window.alert(`${msg}`);
                                  //   return;
                                  // }
                                  // const reset_object_id= await axios
                                  //   .post("/api/saveLATStudyDataRequest",study_data)
                                  //   .then((res)=>{
                                  //     const data=res.data;
                                  //     if(!data.success) return window.alert(`네트워크 오류로 수업 및 일반교재 학습 데이터를 저장하지 못했습니다:0`);
                                  //     else{
                                  //       const ret_info=data.ret;
                                  //       if(ret_info && typeof ret_info==="object" && "reset_object_id" in ret_info && ret_info.reset_object_id===true) {
                                  //         window.alert(`네트워크 오류로 수업 및 일반교재 학습 데이터를 저장하지 못했습니다:0.5`);
                                  //         return true;
                                  //       }
                                  //     }
                                  //     window.alert(`성공적으로 수업 및 일반교재 학습 데이터를 저장했습니다`);
                                  //     return false;
                                  //   })
                                  //   .catch((error)=>{
                                  //     console.log(`error: ${error}`);
                                  //     return window.alert(`네트워크 오류로 수업 및 일반교재 학습 데이터를 저장하지 못했습니다:1`);
                                  //   });
                                  // if(reset_object_id){
                                  //   updateLATRequestElementIDByOldLATRequestID(LAT_request_element_id);
                                  // }
                                  // saveLATStudyDataByLATRequestID(LAT_request_element_id,true);
                                  const study_data= getTextbookStudyDataByLATRequestID(LAT_request_element_id,true);
                                  console.log(`study data payload: ${JSON.stringify(study_data)}`);
                                  
                                  //check if study data for assingment valid
                                  const [textbookStudyValid,msg]= isTextbookStudyDataValid(study_data,LAT_request_element_id);
                                  if(!textbookStudyValid){
                                    window.alert(`${msg}`);
                                    return;
                                  }

                                  openConfirmModal("lectureAndTextbook",true,getBriefStringFromLATRequestID(LAT_request_element_id),LAT_request_element_id);
                                }}
                            >
                              <FaCheck></FaCheck>
                            </button>
                            <button
                                className="btn btn-danger btn-opaque"
                                onClick={()=>{
                                  const study_data= getTextbookStudyDataByLATRequestID(LAT_request_element_id,true); // finished state checked as true to bypass "excuse" field validity check
                                  console.log(`study data payload: ${JSON.stringify(study_data)}`);
                                  
                                  //check if study data for assingment valid
                                  const [textbookStudyValid,msg]= isTextbookStudyDataValid(study_data,LAT_request_element_id);
                                  if(!textbookStudyValid){
                                    window.alert(`${msg}`);
                                    return;
                                  }

                                  openConfirmModal("lectureAndTextbook",false,getBriefStringFromLATRequestID(LAT_request_element_id),LAT_request_element_id);
                                }}
                            >
                              <FaTimes></FaTimes>
                            </button>
                          </>):null}

                        </td>

                      </tr>
                  );
                })}

                {/* <tr>
                  <td colSpan={5}>목표 학습 - {"TBD"} 시간</td>
                  <td> {"TBD"} 시간</td>
                  <td colSpan={2}>{"TBD"}시간</td>
                </tr> */}
                <tr>
                  <td colSpan={8}>
                    {" "}
                    <button
                        className="btn btn-add program-add"
                        onClick={() => {
                          if(!isLATTableAppendable()){
                            window.alert(`작성할 수 있는 테이블 당 최대 항목 수를 넘어섰습니다`);
                            return;
                          }
                          insertLATRequestElement(getNewLATRequestID());
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
              <h4><strong>진행한 프로그램</strong></h4>
              <Table striped hover size="sm" className="mt-3">
                <thead>
                <tr>
                  <th width="5%"></th>
                  <th width="15%">프로그램</th>
                  <th width="15%">매니저</th>
                  <th width="15%">소요시간</th>
                  <th width="35%">상세내용</th>
                  <th width="10%">확인요청</th>
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
                {
                  programDisplayList.map((program_request_element_id,idx)=>{
                    const program_request_element=getProgramRequestElementFromProgramRequestID(programRequestStatusMap,program_request_element_id);
                    const request_specific_data=program_request_element.request_specific_data;
                    const study_data=program_request_element.study_data;
                    const study_data_time_amount=study_data.time_amount;
                    const program_name=request_specific_data.program_name;
                    const program_by=request_specific_data.program_by;
                    const program_description=request_specific_data.program_description;
                    const table_element_index=idx;                 
                    return (
                      <tr key={idx}>
                        <td>
                          <button
                              className="btn btn-opaque"
                              onClick={async () => {
                                const program_element_brief=getBriefStringFromProgramRequestID(program_request_element_id);
                                const element_brief=program_element_brief.length>0?program_element_brief+"\n":`${table_element_index+1}번째 `;
                                if(!window.confirm(`${element_brief}프로그램 항목을 리스트에서 삭제하시겠습니까?`)) return;
                                const program_request_element=getProgramRequestElementFromProgramRequestID(programRequestStatusMap,program_request_element_id);
                                const request_specific_data=program_request_element.request_specific_data;
                                const delete_request_payload=getProgramDataDeleteRequestPayload(request_specific_data);
                                console.log(`program delete payload: ${JSON.stringify(delete_request_payload)}`);
                                const delete_success=await axios
                                  .post("/api/setProgramElementDeletedOnTrDraft",delete_request_payload)
                                  .then((res)=>{
                                    const data=res.data;
                                    if(!data.success) {
                                      window.alert(`네트워크 오류로 학습 항목 삭제에 실패했습니다:0`);
                                      return false;
                                    }
                                    return true;
                                  })
                                  .catch((error)=>{
                                    window.alert(`네트워크 오류로 학습 항목 삭제에 실패했습니다:1`);
                                    return false;
                                  });
                                if(!delete_success) return;
                                deleteProgramRequestElement(program_request_element_id);
                              }}
                          >
                            <strong><FaTrash></FaTrash></strong>
                          </button>
                        </td>
                        <td>
                          <Form.Select
                              size="sm"
                              value={program_name}
                              onChange={(e) => {
                                const program_name_val=e.target.value;
                                updateProgramRequestElementByProgramRequestID(program_request_element_id,{
                                  "request_specific_data.program_name":program_name_val,
                                });
                              }}
                          >
                            {/* {stuDB.프로그램분류.map(function (p, j) {
                              return (
                                  <option value={p} key={j}>
                                    {p}
                                  </option>
                              );
                            })} */}
                            {
                              program_name_list.map((name,name_idx)=>{
                                return (
                                  <option value={name} key={name_idx}>
                                    {name}
                                  </option>
                                );
                              })
                            }
                          </Form.Select>
                        </td>
                        <td>
                          <Form.Select
                              size="sm"
                              value={program_by}
                              onChange={(e) => {
                                const program_by_val=e.target.value;
                                updateProgramRequestElementByProgramRequestID(program_request_element_id,{
                                  "request_specific_data.program_by":program_by_val,
                                });
                              }}
                          >
                            <option value={null}>선택</option>
                            {managerList.map(function (manager, idx) {
                              const manager_username=manager.username;
                              const manager_nickname=manager.nickname;
                              return (
                                  <option value={manager_username} key={idx}>
                                    {manager_nickname}
                                  </option>
                              );
                            })}
                          </Form.Select>
                        </td>
                        <td>
                          <TimePicker
                              className="timepicker"
                              locale="sv-sv"
                              value={study_data_time_amount}
                              openClockOnFocus={false}
                              clearIcon={null}
                              clockIcon={null}
                              onChange={(value) => {
                                const study_data_time_amount=value;
                                updateProgramRequestElementByProgramRequestID(program_request_element_id,{
                                  "study_data.time_amount":study_data_time_amount,
                                });
                              }}
                          ></TimePicker>
                        </td>
                        <td>
                          <textarea
                              className="textArea"
                              name=""
                              id=""
                              rows="3"
                              maxLength={program_description_max_len}
                              placeholder="프로그램 상세내용/특이사항 입력"
                              value={program_description}
                              onChange={(e) => {
                                const program_description_val=e.target.value;
                                updateProgramRequestElementByProgramRequestID(program_request_element_id,{
                                  "request_specific_data.program_description":program_description_val,
                                });
                              }}
                          ></textarea>
                        </td>
                        <td>
                          <button
                              className="btn btn-success btn-opaque"
                              onClick={async ()=>{
                                const program_data=getProgramDataByProgramRequestID(program_request_element_id,true);
                                console.log(`program data payload: ${JSON.stringify(program_data)}`);

                                //check if study data for assingment valid
                                const [programDataValid,msg]= isProgramDataValid(program_data,program_request_element_id);
                                if(!programDataValid){
                                  window.alert(`${msg}`);
                                  return;
                                }
                                openConfirmModal("programParticipation",true,getBriefStringFromProgramRequestID(program_request_element_id),program_request_element_id);
                              }}
                          >
                            <FaCheck></FaCheck>
                          </button>
                        </td>
                      </tr>
                  );
                  })
                }

                {/* <tr>
                  <td colSpan={6}>프로그램 진행 시간 : {"TBD"}시간</td>
                </tr> */}
                <tr>
                  <td colSpan={5}>
                    {" "}
                    <button
                        className="btn btn-add program-add"
                        onClick={() => {
                          if(!isProgramTableAppendable()){
                            window.alert(`작성할 수 있는 테이블 당 최대 항목 수를 넘어섰습니다`);
                            return;
                          }
                          insertProgramRequestElement(getNewProgramRequestID());
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
        </div>
      </div>
  );
}

export default TRDraft;