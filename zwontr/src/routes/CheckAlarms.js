import "./CheckAlarms.scss";
import { Form, Button, ProgressBar, Accordion, FormCheck, FormControl, Row, Table, Modal} from "react-bootstrap";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect } from "react";
import axios from "axios";
import Loginpage from "./LoginModal";
import { TbBulb, TbBuilding } from "react-icons/tb";
import { RiParentLine } from "react-icons/ri";
import { MdNavigateBefore, MdNavigateNext } from "react-icons/md";
import {FaCheck, FaSistrix, FaSleigh, FaTrash} from "react-icons/fa"

const versionInfo = "1.6";

function CheckAlarms({
  setNowLoading,
  setNowNotLoading,
}) {
  let history= useHistory();
  const alarm_pagination_template={
    cur_page:1,
    total_page_num:1,
    alarms_data:[]
  };
  const request_type_name_to_index={
    "생활 정보":0,
    "강의 과제":1,
    "수업 및 일반교재":2,
    "프로그램 참여":3,
  };
  const index_to_request_type_name={
      0:"생활 정보",
      1:"강의 과제",
      2:"수업 및 일반교재",
      3:"프로그램 참여",
  };
  const review_status_to_index={
    "not_reviewed":0,
    "accepted":1,
    "declined":2,
    "passed":3,
  };
  const index_to_review_status_prompt={
    0:"아직 검토되지 않음",
    1:"승인",
    2:"반려",
    3:"읽음처리 됨",
  };
  const [pagination,setPagination]=useState(alarm_pagination_template);
  function getAlarmsPaginationTemplate(){
    return {...alarm_pagination_template};
  }
  function updatePagination(reviewStatus,reviewMsg,datum_index){
    setPagination((prevPagination)=>{
      const new_pagination=JSON.parse(JSON.stringify(prevPagination));
      const alarm_data=(new_pagination.alarms_data)[datum_index];
      alarm_data.review_status=reviewStatus;
      alarm_data.review_msg=reviewMsg;
      if(reviewStatus!==review_status_to_index["not_reviewed"]) alarm_data.review_timestamp=(new Date()).toISOString();
      return new_pagination;
    });
    sortPagination();
  }
  function deletePaginationElementByTDRRID(TDRRID){
    setPagination((prevPagination)=>{
      const new_pagination=JSON.parse(JSON.stringify(prevPagination));
      const alarms_data=new_pagination.alarms_data;
      for(let i=0; i<alarms_data.length; i++){
        const alarm_datum=alarms_data[i];
        const cur_TDRR_ID=alarm_datum.tdrr_id;
        if(cur_TDRR_ID===TDRRID){
          alarms_data.splice(i,1);
          break;
        }
      }
      return new_pagination;
    });
  }
  function sortPagination(){
    setPagination((prevPagination)=>{
      const new_pagination=JSON.parse(JSON.stringify(prevPagination));
      const alarms_data=new_pagination.alarms_data;
      alarms_data.sort((a,b)=>{
        const a_reviewed=!checkRequestReviewNeeded(a.review_status);
        const b_reviewed=!checkRequestReviewNeeded(b.review_status);
        if(a_reviewed!==b_reviewed) return (a_reviewed && !b_reviewed)?1:-1;
        return a.study_data.timestamp>b.study_data.timestamp?-1:a.study_data.timestamp<b.study_data.timestamp?1:0;
      });
      return new_pagination;
    });
  }

  async function getRequestAlarms(queryPage=1){
    const query= {
      queryPage,
    }
    setNowLoading();
    const alarm_data_pagination=await axios
      .post("/api/getMyAlarms",query)
      .then((res)=>{
        const data=res.data;
        if(!data.success) return getAlarmsPaginationTemplate();
        return data.ret.pagination;
      })
      .catch((err)=>{
        window.alert(`네트워크 오류로 사용자 데이터를 불러오지 못했습니다`);
        return getAlarmsPaginationTemplate();
      });
    //here pagenation data should be extracted
    const alarms_data=alarm_data_pagination.alarms_data;
    // if(alarms_data.length>0) alarms_data.sort((a,b)=>{
    //   return a.study_data.timestamp>b.study_data.timestamp?-1:a.study_data.timestamp<b.study_data.timestamp?1:0;
    // });
    // console.log(`alarms data : ${JSON.stringify(alarms_data)}`);
    setPagination(alarm_data_pagination);
    sortPagination();
    setNowNotLoading();
  }

  useEffect(async ()=>{
    await getRequestAlarms();
  },[]);

  function isThisPageEmpty(){
    return pagination.alarms_data.length===0;
  }
  function getNoDataPrompt(){
    return (
      <div className="NoDataPromptBox mt-5">
        <h4><strong>알람이 없습니다</strong></h4>
      </div>
    );
  }
  function isoDateStringToLocalDateString(date_string){
    const d=new Date(date_string);
    return [d.toLocaleDateString(),d.toLocaleTimeString()].join(' ');
  }
  const today=new Date();
  function checkIsDateToday(date){
    return today.getFullYear()===date.getFullYear() && today.getMonth()===date.getMonth() && today.getDate()===date.getDate();
  }
  function getRequestDateString(dateString){
    const date=new Date(dateString);
    if(checkIsDateToday(date)) return date.toLocaleTimeString();
    else return date.toLocaleDateString();
  }
  function getRequestTypeNameString(request_type_index){
    return index_to_request_type_name[request_type_index];
  }
  function checkRequestReviewNeeded(review_status){
    return review_status===review_status_to_index["not_reviewed"];
  }
  function getNewRequestPromptString(isNewRequest){
    return isNewRequest?"NEW":"";
  }
  function getRequestDetailStringFromAlarmDatum(alarmDatum){
    const detail_length_limit=30;
    const request_type=alarmDatum.request_type;
    const request_specific_data=alarmDatum.request_specific_data;
    const request_type_tag=`[${getRequestTypeNameString(alarmDatum.request_type)}]`;
    let ret="";
    let element_detail="";
    if(request_type===request_type_name_to_index["생활 정보"]) ret=request_type_tag;
    else if(request_type===request_type_name_to_index["강의 과제"]){
      const lecture_name=alarmDatum.lecture_name;
      if("assignment_textbook_name" in alarmDatum){
        const assignment_textbook_name=alarmDatum.assignment_textbook_name;
        element_detail=`${assignment_textbook_name} / ${lecture_name}`;
      }
      else{
        element_detail=`${lecture_name}`;
      }
      ret=`${request_type_tag} ${element_detail}`;
    }
    else if(request_type===request_type_name_to_index["수업 및 일반교재"]){
      if("textbook_name" in alarmDatum){
        const textbook_name=alarmDatum.textbook_name;
        const textbook_subject=alarmDatum.textbook_subject;
        element_detail=`${textbook_name}(${textbook_subject})`;
      }
      else{
        const duplicatable_name=request_specific_data.duplicatable_name;
        const duplicatable_subject=request_specific_data.duplicatable_subject;
        element_detail=`${duplicatable_name} (${duplicatable_subject})`;
      }
      ret=`${request_type_tag} ${element_detail}`;
    }
    else if(request_type===request_type_name_to_index["프로그램 참여"]){
      element_detail= request_specific_data.program_name;
      ret=`${request_type_tag} ${element_detail}`;
    }
    // return ret.slice(0,30);
    return (
      <span>
        <strong>{request_type_tag}</strong>
        {element_detail?
          <span>
            <br/>
              {element_detail}
          </span>:null
        }
      </span>
    )
  }
  function getTableRowFromRequestAlarmDatum(alarm_datum,idx){
    const review_needed=checkRequestReviewNeeded(alarm_datum.review_status);
    const new_request_prompt_string=getNewRequestPromptString(review_needed);
    const student_username=alarm_datum.student_username;
    const student_DB_name=alarm_datum.student_DB_name;
    const request_timestamp_string=getRequestDateString(alarm_datum.study_data.timestamp);
    // const request_type_name=`[${getRequestTypeNameString(alarm_datum.request_type)}]`
    const request_detail=getRequestDetailStringFromAlarmDatum(alarm_datum);

    const modal_button_prompt=review_needed?"내용 확인":"지난 응답";
    const modal_button_variant_name=review_needed?"success":"secondary";
    return(
      <tr key={idx} className="td-cell-vertical-middle">
        <td>
          <p className="NewRequestPromptBox">
            <span>{new_request_prompt_string}</span>
          </p>
        </td>
        <td><p><span>{student_username}</span></p></td>
        <td><p><span>{student_DB_name}</span></p></td>
        <td><p><span>{request_timestamp_string}</span></p></td>
        <td><p><span>{request_detail}</span></p></td>
        <td>
          <Button
            variant={modal_button_variant_name}
            className="button-fit-content"
            // disabled={!review_needed}
            onClick={async ()=>{
              openModal(modal_type_name_to_index["request_review"],idx);
            }}
          >
            <strong>{modal_button_prompt}</strong>
          </Button>
        </td>
      </tr>
    );
  }
  function getAlarmSearchPageNav(){
    function isPageNavBoxDisabled(){
      return pagination.cur_page==1 && pagination.total_page_num==1;
    }
    return (
      <div className="pageNavBox">
        {pagination.cur_page>1?
          <div className="pageNavBoxElement">
            <Button
              variant="success"
              className="button-fixed-size"
              onClick={()=>{
                getRequestAlarms(pagination.cur_page-1);
              }}
            >
              <strong><MdNavigateBefore/></strong>
            </Button>
          </div>:null
        }
        <div className="pageNavBoxElement">
          <FormControl
            className="pageNavBoxForm"
            value={pagination.cur_page}
            // disabled={isPageNavBoxDisabled()}
            disabled={true}
            onChange={(e) => {
              // setinputQuery(e.target.value);
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                // textbookSearch();
              }
            }}
          />
        </div>
        <div className="pageNavBoxElement">
          <p className="TotalPageBox"> / <strong>{pagination.total_page_num}</strong></p>
        </div>
        {pagination.cur_page<pagination.total_page_num?
          <div className="pageNavBoxElement">
            <Button
              variant="success"
              className="button-fixed-size"
              onClick={async ()=>{
                getRequestAlarms(pagination.cur_page+1);
              }}
            >
              <strong><MdNavigateNext/></strong>
            </Button>
          </div>:null
        }
      </div>
    )
  }
  
  const[modalShowStatus,setModalShowStatus]=useState(false);
  const modal_type_name_to_index={
    "default":0,
    "request_review":1,
  };
  const modal_for_template={
    modal_type:0,
    extra_data:[],
  }
  const [modalFor,setModalFor]= useState(modal_for_template); // which study type the excuse for (assignment/textbook)
  const openModal= (modal_type_index,...extra_data)=>{
    setModalFor({modal_type:modal_type_index,extra_data});
    if(modal_type_index===modal_type_name_to_index["request_review"]){
      const datum_pagination_index=extra_data[0];
      const request_alarm_datum=pagination.alarms_data[datum_pagination_index];
      const review_status=request_alarm_datum.review_status;
      if(checkRequestReviewNeeded(review_status)){
        setReviewResult(getReviewResultTemplate());
      }
      else{
        const review_msg=request_alarm_datum.review_msg;
        const review_result=getReviewResultTemplate();
        review_result.review_status=review_status;
        review_result.review_msg=review_msg;
        setReviewResult(review_result);
      }
    }
    setModalShowStatus(true);
  };
  const closeModal= ()=>{
    setModalShowStatus(false);
    if(modalFor.modal_type===modal_type_name_to_index["request_review"]){
      setReviewResult(getReviewResultTemplate());
    }
    setModalFor(modal_for_template);
  }
  function getModalTitle(){
    if(modalFor.modal_type===modal_type_name_to_index["default"]) return null;
    else if(modalFor.modal_type===modal_type_name_to_index["request_review"]) return "요청 내용 확인 및 승인/반려";
    else return null;
  }
  function getModalBody(){
    if(modalFor.modal_type===modal_type_name_to_index["default"]) return null;
    else if(modalFor.modal_type===modal_type_name_to_index["request_review"]) return getRequestReviewModalBody();
    else return null;
  }

  // 알람 내용 확인 및 승인/반려 관련 코드
  const review_result_template={
    review_status:review_status_to_index["declined"],
    review_msg:"",
  };
  function getReviewResultTemplate(){
    return {...review_result_template};
  }
  const [reviewResult,setReviewResult]=useState(getReviewResultTemplate());
  const review_msg_min_len=10;
  const review_msg_max_len=200;
  function updateReviewResultStatus(newStatus){
    setReviewResult((prevReviewResult)=>{
      const new_review_result=JSON.parse(JSON.stringify(prevReviewResult));
      new_review_result.review_status=newStatus;
      return new_review_result;
    });
  }
  function updateReviewResultMsg(newMsg){
    setReviewResult((prevReviewResult)=>{
      const new_review_result=JSON.parse(JSON.stringify(prevReviewResult));
      new_review_result.review_msg=newMsg;
      return new_review_result;
    });
  }
  const review_result_payload_template={
    reviewStatus:review_status_to_index["declined"],
    reviewMsg:"",
    TDRRID:null,
  };
  function getReviewResultPayloadTemplate(){
    return {...review_result_payload_template};
  }
  function getReviewResultPayload(requestAlarmDatum){
    const ret=getReviewResultPayloadTemplate();
    ret.reviewStatus=reviewResult.review_status;
    ret.reviewMsg=review_status_to_index["declined"]?reviewResult.review_msg:"";
    ret.TDRRID=requestAlarmDatum.tdrr_id;
    return ret;
  }
  function intBetween(target,left,right){
    return typeof target==="number" && target>=left && target<=right;
  }
  function checkReviewStatusValid(status){
    return status===review_status_to_index["accepted"] || status===review_status_to_index["declined"];
  }
  function checkReviewMsgValid(msg){
    return typeof msg === "string" && intBetween(msg.length,review_msg_min_len,review_msg_max_len);
  }
  function checkTDRRIDValid(TDRRID){
    return !!TDRRID;
  }
  function checkReviewResultPayloadValid(payload){
    const status=payload.reviewStatus;
    const msg=payload.reviewMsg;
    const TDRRID=payload.TDRRID;
    if(!checkReviewStatusValid(status)) return [false,"승인 및 반려 상태가 올바르지 않습니다.\n새로고침 후 다시 시도해주세요"];
    else if(status===review_status_to_index["declined"] && !checkReviewMsgValid(msg)) return [false,"요청 반려 사유를 10자 이상 입력해주세요"];
    else if(!checkTDRRIDValid(TDRRID)) return [false,"예기치 못한 오류가 발생했습니다\n새로고침 후 다시 시도해주세요"];
    else return [true,""];
  }
  function getRequestReviewModalReviewStatusRow(request_alarm_datum){
    const review_status=request_alarm_datum.review_status;
    const review_needed=checkRequestReviewNeeded(review_status);
    if(review_needed) return null;
    const review_timestamp=request_alarm_datum.review_timestamp;
    const review_timestamp_date=new Date(review_timestamp);
    const review_timestamp_locale_string=review_timestamp_date.toLocaleString();
    const review_accepted=review_status===review_status_to_index["accepted"];
    const review_result_string=review_accepted?"승인됨":"반려됨";
    const review_msg=request_alarm_datum.review_msg;
    return (
      <div className="border-bottom border-secondary border-3 mb-3">
        <div className="row mb-2">
          <div className="col-12"><strong>이전에 검토된 요청입니다</strong></div>        
        </div>
        <div className="row mb-2">
          <div className="col-3">검토 시각</div>
          <div className="col-9">{review_timestamp_locale_string}</div>
        </div>
        <div className="row mb-2">
          <div className="col-3">검토 결과</div>
          <div className="col-9">{review_result_string}</div>
        </div>
        {!review_accepted?
          <div className="row mb-2">
            <div className="col-3">반려 사유</div>
            <div className="col-9">{review_msg}</div>
          </div>:null
        }
      </div>
    );
  }
  function getRequestTypeRow(request_alarm_datum){
    const request_type_string=index_to_request_type_name[request_alarm_datum.request_type];
    return (
      <div className="border-bottom border-secondary border-3 mb-3">
        <div className="row mb-2">
          <div className="col-3">요청 유형</div>
          <div className="col-9">{request_type_string}</div>
        </div>
      </div>
    );
  }

  const condition_index_to_name={
    5:"매우좋음",
    4:"좋음",
    3:"보통",
    2:"나쁨",
    1:"매우나쁨",
  }
  function getLifeDataRow(request_alarm_datum){
    const request_specific_data=request_alarm_datum.request_specific_data;
    const body_condition=request_specific_data.신체컨디션;
    const body_condition_string=condition_index_to_name[body_condition];
    const sentiment_condition=request_specific_data.정서컨디션;
    const sentiment_condition_string=condition_index_to_name[sentiment_condition];
    const go_to_bed_time=request_specific_data.실제취침;
    const wake_up_time=request_specific_data.실제기상;
    const come_to_center_time=request_specific_data.실제등원;
    return (
      <div className="border-bottom border-secondary border-3 mb-3">
        <div className="row mb-2">
          <div className="col-3">신체 컨디션</div>
          <div className="col-9">{body_condition_string}</div>
        </div>
        <div className="row mb-2">
          <div className="col-3">정서 컨디션</div>
          <div className="col-9">{sentiment_condition_string}</div>
        </div>
        <div className="row mb-2">
          <div className="col-3">취침 시간</div>
          <div className="col-9">{go_to_bed_time}</div>
        </div>
        <div className="row mb-2">
          <div className="col-3">기상 시간</div>
          <div className="col-9">{wake_up_time}</div>
        </div>
        <div className="row mb-2">
          <div className="col-3">등원 시간</div>
          <div className="col-9">{come_to_center_time}</div>
        </div>
      </div>
    );
  }

  function checkAssignmentTextbookNameValid(textbook_name){
    return !!textbook_name;
  }
  function checkAssignmentPageRangeArrayValid(pageRangeArray){
    return !!pageRangeArray[0][0];
  }
  function checkAssignmentDescriptionValid(description){
    return !!description;
  }

  function getAssignmentInfoRow(request_alarm_datum){
    const request_specific_data=request_alarm_datum.request_specific_data;
    const lecture_name=request_alarm_datum.lecture_name;
    const lecturer=request_alarm_datum.lecturer;
    const textbook_name=request_alarm_datum.assignment_textbook_name;
    const textbook_name_valid=checkAssignmentTextbookNameValid(textbook_name);
    const page_range_array=request_alarm_datum.assignment_page_range_array;
    const page_range_array_valid=checkAssignmentPageRangeArrayValid(page_range_array);
    const description=request_alarm_datum.assignment_description;
    const description_valid=checkAssignmentDescriptionValid(description);
    
    return (
      <div className="border-bottom border-secondary border-3 mb-3">
        <div className="row mb-2">
          <div className="col-3">강사명</div>
          <div className="col-9">{lecturer}</div>
        </div>
        <div className="row mb-2">
          <div className="col-3">강의명</div>
          <div className="col-9">{lecture_name}</div>
        </div>
        {textbook_name_valid?
          <div className="row mb-2">
            <div className="col-3">교재명</div>
            <div className="col-9">{textbook_name}</div>
          </div>:null
        }
        {page_range_array_valid?
          page_range_array.map((page_range,idx)=>{
            const from=page_range[0];
            const to=page_range[1];
            return (
              <div className={idx===page_range_array.length-1?"row mb-2":"row"}>
                <div className="col-3">{idx===0?"과제 범위":""}</div>
                <div className="col-9">{`${from} ~ ${to}`}</div>
              </div>
            );
          }):null
        }
        {description_valid?
          <div className="row mb-2">
            <div className="col-3">과제 상세</div>
            <div className="col-9">{description}</div>
          </div>:null
        }
      </div>
    );
  }
  function getLATInfoRow(request_alarm_datum){
    const request_specific_data=request_alarm_datum.request_specific_data;
    const LAT_element_duplicatable=request_specific_data.duplicatable;
    const textbook_name=request_alarm_datum.textbook_name;
    const textbook_subject=request_alarm_datum.textbook_subject;
    const recent_page=request_specific_data.recent_page;
    const duplicatable_name=request_specific_data.duplicatable_name;
    const duplicatable_subject=request_specific_data.duplicatable_subject;
    const subject_string=textbook_subject || duplicatable_subject;
    return (
      <div className="border-bottom border-secondary border-3 mb-3">
        <div className="row mb-2">
          <div className="col-3">과목</div>
          <div className="col-9">{subject_string}</div>
        </div>
        {!LAT_element_duplicatable?
          <div className="row mb-2">
            <div className="col-3">교재명</div>
            <div className="col-9">{textbook_name}</div>
          </div>:null
        }
        {!LAT_element_duplicatable?
          <div className="row mb-2">
            <div className="col-3">완료 진도<br/>(~까지)</div>
            <div className="col-9">{recent_page}</div>
          </div>:null
        }
        {LAT_element_duplicatable?
          <div className="row mb-2">
            <div className="col-3">학습 구분</div>
            <div className="col-9">{duplicatable_name}</div>
          </div>:null
        }
      </div>
    );
  }
  function getProgramInfoRow(request_alarm_datum){
    const request_specific_data=request_alarm_datum.request_specific_data;
    const program_name=request_specific_data.program_name;
    const program_leader_username=request_alarm_datum.program_leader_username;
    const program_leader_nickname=request_alarm_datum.program_leader_nickname;
    const program_description=request_specific_data.program_description;
    
    return (
      <div className="border-bottom border-secondary border-3 mb-3">
        <div className="row mb-2">
          <div className="col-3">구분</div>
          <div className="col-9">{program_name}</div>
        </div>
        <div className="row mb-2">
          <div className="col-3">진행자</div>
          <div className="col-9">{program_leader_nickname}</div>
        </div>
        <div className="row mb-2">
          <div className="col-3">상세</div>
          <div className="col-9">{program_description}</div>
        </div>
      </div>
    );
  }

  function getRequestContentRow(request_alarm_datum){
    const request_type=request_alarm_datum.request_type;
    if(request_type===request_type_name_to_index["생활 정보"]) return getLifeDataRow(request_alarm_datum);
    else if(request_type===request_type_name_to_index["강의 과제"]) return getAssignmentInfoRow(request_alarm_datum);
    else if(request_type===request_type_name_to_index["수업 및 일반교재"]) return getLATInfoRow(request_alarm_datum);
    else if(request_type===request_type_name_to_index["프로그램 참여"]) return getProgramInfoRow(request_alarm_datum);
    else return null;
  }

  function getAssignmentStudyDataRow(request_alarm_datum){
    const study_data=request_alarm_datum.study_data;
    const time_amount=study_data.time_amount;
    const finished_state=study_data.finished_state;
    const finished_state_string=finished_state?"완료":"미완료";
    const excuse=study_data.excuse;
    return(
      <div className="border-bottom border-secondary border-3 mb-3">
        <div className="row mb-2">
          <div className="col-3">소요 시간</div>
          <div className="col-9">{time_amount}</div>
        </div>
        <div className="row mb-2">
          <div className="col-3">완료 여부</div>
          <div className="col-9">{finished_state_string}</div>
        </div>
        {!finished_state?
          <div className="row mb-2">
            <div className="col-3">미완료 사유</div>
            <div className="col-9">{excuse}</div>
          </div>:null
        }
      </div>
    );
  }
  function getLATStudyDataRow(request_alarm_datum){
    const study_data=request_alarm_datum.study_data;
    const time_amount=study_data.time_amount;
    const finished_state=study_data.finished_state;
    const finished_state_string=finished_state?"완료":"미완료";
    const excuse=study_data.excuse;
    return(
      <div className="border-bottom border-secondary border-3 mb-3">
        <div className="row mb-2">
          <div className="col-3">소요 시간</div>
          <div className="col-9">{time_amount}</div>
        </div>
        <div className="row mb-2">
          <div className="col-3">완료 여부</div>
          <div className="col-9">{finished_state_string}</div>
        </div>
        {!finished_state?
          <div className="row mb-2">
            <div className="col-3">미완료 사유</div>
            <div className="col-9">{excuse}</div>
          </div>:null
        }
      </div>
    );
  }
  function getProgramParticipationStudyDataRow(request_alarm_datum){
    const study_data=request_alarm_datum.study_data;
    const time_amount=study_data.time_amount;
    return(
      <div className="border-bottom border-secondary border-3 mb-3">
        <div className="row mb-2">
          <div className="col-3">소요 시간</div>
          <div className="col-9">{time_amount}</div>
        </div>
      </div>
    );
  }

  function getStudyDataRow(request_alarm_datum){
    const request_type=request_alarm_datum.request_type;
    if(request_type===request_type_name_to_index["생활 정보"]) return null;
    else if(request_type===request_type_name_to_index["강의 과제"]) return getAssignmentStudyDataRow(request_alarm_datum);
    else if(request_type===request_type_name_to_index["수업 및 일반교재"]) return getLATStudyDataRow(request_alarm_datum);
    else if(request_type===request_type_name_to_index["프로그램 참여"]) return getProgramParticipationStudyDataRow(request_alarm_datum);
    else return null;
  }

  function getStudentInfoRow(request_alarm_datum){
    const student_DB_name=request_alarm_datum.student_DB_name;
    const request_timestamp=(new Date(request_alarm_datum.study_data.timestamp)).toLocaleString();
    return (
      <div className="border-bottom border-secondary border-3 mb-3">
        <div className="row mb-2">
          <div className="col-3">학생 이름</div>
          <div className="col-9">{student_DB_name}</div>
        </div>
        <div className="row mb-2">
          <div className="col-3">요청 시각</div>
          <div className="col-9">{request_timestamp}</div>
        </div>
      </div>
    );
  }
  function getPrevReviewResultRow(request_alarm_datum){
    const review_status=request_alarm_datum.review_status;
    const review_status_string=index_to_review_status_prompt[review_status];
    const review_msg_needed=review_status===review_status_to_index["declined"];
    const review_msg=request_alarm_datum.review_msg;
    return (
      <div className="border-bottom border-secondary border-3 mb-3">
        <div className="row mb-2">
          <div className="col-3">승인 결과</div>
          <div className="col-9">{review_status_string}</div>
        </div>
        {review_msg_needed?
          <div className="row mb-2">
            <div className="col-3">반려 사유</div>
            <div className="col-9">{review_msg}</div>
          </div>:null
        }
      </div>
    );
  }

  async function saveReviewResult(reviewResultPayload,datum_pagination_index){
    //here goes a http request
    const [payload_valid,alert_msg]=checkReviewResultPayloadValid(reviewResultPayload);
    if(!payload_valid){
      window.alert(alert_msg);
      return false;
    }
    setNowLoading();
    const [save_success,reviewer_reassigned]=await axios
      .post("/api/saveTRDraftRequestReview",reviewResultPayload)
      .then((result)=>{
        const data=result.data;
        const error_prompt=data.ret;
        const reviewer_reassigned=data.reviewer_reassigned;
        if(!data.success) {
          if(reviewer_reassigned){
            window.alert(`${error_prompt}`);
            return [false,true];
          }
          else throw new Error('error');
        }
        //here success of save would be checked
        const saved=data.ret.saved;
        if(!saved){
          window.alert(data.ret.msg);
          return [false,false];
        }
        return [true,false];
      })
      .catch((err)=>{
        window.alert(`네크워크 오류로 저장하지 못했습니다`)
        return [false,false];
      });
    if(!save_success) {
      let ret;
      if(reviewer_reassigned){
        const TDRR_ID=reviewResultPayload.TDRRID;
        deletePaginationElementByTDRRID(TDRR_ID);
        ret=[false,true];
      }
      else ret=[false,false];
      setNowNotLoading();
      return ret;
    }
    //here goes a state update
    const status=reviewResultPayload.reviewStatus;
    const msg=reviewResultPayload.reviewMsg;
    updatePagination(status,msg,datum_pagination_index);
    setNowNotLoading();
    return [true,false];
  }
  function checkReviewForCreateElement(request_alarm_datum){
    const request_type=request_alarm_datum.request_type;
    const request_for_duplicatable=request_alarm_datum.request_specific_data.duplicatable;
    return request_type===request_type_name_to_index["프로그램 참여"] || 
      (request_type===request_type_name_to_index["수업 및 일반교재"] && request_for_duplicatable);
  }

  function getRequestReviewModalBody(){
    if(pagination.alarms_data.length===0) return null;
    const datum_pagination_index=modalFor.extra_data[0];
    const request_alarm_datum=pagination.alarms_data[datum_pagination_index];
    const review_status=request_alarm_datum.review_status;
    const review_needed=checkRequestReviewNeeded(review_status);
    const cur_review_result_status=reviewResult.review_status;
    const cur_review_result_msg=reviewResult.review_msg;
    return (
      <Modal.Body className="text-center">
        {getRequestReviewModalReviewStatusRow(request_alarm_datum)}
        {getStudentInfoRow(request_alarm_datum)}
        {getRequestTypeRow(request_alarm_datum)}
        {getStudyDataRow(request_alarm_datum)}
        {getRequestContentRow(request_alarm_datum)}
        

        {/* rows when review needed */}
        {review_needed?
          <div className="border-top border-dark border-3 mb-3">
            <div className="row mb-2">
              <div className="col-4"><h5>반려</h5></div>
              <div className="col-4">
                <FormCheck
                  type="switch"
                  onClick={async ()=>{
                    const prev_review_status=cur_review_result_status;
                    const new_review_status=prev_review_status===review_status_to_index["accepted"]?review_status_to_index["declined"]:review_status_to_index["accepted"];
                    updateReviewResultStatus(new_review_status);
                  }}
                />
              </div>
              <div className="col-4"><h5>승인</h5></div>
            </div>
          </div>:null
        }

        {review_needed && cur_review_result_status===review_status_to_index["declined"]?
          <Form.Control
            as="textarea"
            placeholder="여기에 요청 반려 사유를 입력해주세요(10자 이상)"
            maxLength={review_msg_max_len}
            className="mb-3 ModalTextarea"
            value={cur_review_result_msg}
            onChange={(event)=>{
              const changed_review_msg=event.target.value;
              updateReviewResultMsg(changed_review_msg);
            }}
         />
        :null}
        
        {review_needed?
          <Button
              className="btn-secondary"
              onClick={async ()=>{
                if(!review_needed){
                  closeModal();
                  return;
                }
                if(checkReviewForCreateElement(request_alarm_datum) &&
                  cur_review_result_status===review_status_to_index["accepted"] &&
                  !window.confirm(`해당 요청을 승인하는 경우\n요청 날짜에 해당하는 학생 TR에 새롭게 항목에 추가됩니다\n승인하시겠습니까?`)) return;
                const review_result_payload=getReviewResultPayload(request_alarm_datum);
                // console.log(`payload: ${JSON.stringify(review_result_payload)}`);
                const [payload_valid,msg]=checkReviewResultPayloadValid(review_result_payload);
                if(!payload_valid){
                  window.alert(msg);
                  return;
                }
                const [save_success,reviewer_reassigned]=await saveReviewResult(review_result_payload,datum_pagination_index);
                if(!save_success){
                  // window.alert("저장중 오류가 발생했습니다\n다시 시도해주세요");
                  if(reviewer_reassigned) closeModal();
                  return;
                }
                window.alert(`요청 확인이 성공적으로 반영되었습니다`);
                closeModal();
              }}
              type="button">
            <strong>요청 확인</strong>
          </Button>:null
        }

        {/* rows when review not needed */}
        {!review_needed?getPrevReviewResultRow(request_alarm_datum):null}

      </Modal.Body>
    );
  }
  return (
    <div className="main-background text-center">
      <Modal show={modalShowStatus} onHide={closeModal}>
          <Modal.Header closeButton>
            <Modal.Title>{getModalTitle()}</Modal.Title>
          </Modal.Header>
          {getModalBody()}
      </Modal>
      <div className="headerBox">
        <h1>
          <strong>알람 확인</strong>
        </h1>
        
      </div>
      <div className="UserInfoSearchBox">
        {/* <div className="UserInfoBoxHeader row">
          <div className="col-sm-3 mb-2">
            <Form.Select
              value={approvedStatusCategory}
              onChange={(e) => {
                setApprovedStatusCategory(e.target.value);
              }}
            >
              {
                approved_status_categories.map((category,idx)=>{
                  return (
                    <option value={category} key={idx}>
                      {category}
                    </option>
                  );
                })
              }
            </Form.Select>
          </div>
          <div className="col-sm-2 mb-2">
            <Form.Select
              value={userTypeCategory}
              onChange={(e) => {
                const new_val=e.target.value;
                setUserTypeCategory(new_val);
                if(new_val!=="아이디로 검색") setQueryUsername("");
              }}
            >
              {
                user_type_categories.map((category,idx)=>{
                  return (
                    <option value={category} key={idx}>
                      {category}
                    </option>
                  );
                })
              }
            </Form.Select>
          </div>
          <div className="col-sm-5 mb-2">
            <FormControl
              disabled={isUsernameFormControlDisabled()}
              placeholder={isUsernameFormControlDisabled()?"":"조회할 사용자 아이디를 입력해주세요"}
              value={queryUsername}
              maxLength={25}
              onChange={(e) => {
                setQueryUsername(e.target.value);
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  getUserAccountApprovedStatus();
                }
              }}
            />
          </div>
          <div className="col-sm-1 mb-2">
            <Button
              className=""
              onClick={async ()=>{
                getUserAccountApprovedStatus();
              }}
            >
              <strong>
                <FaSistrix />
              </strong>
            </Button>
          </div>
        </div> */}
        <div className="UserInfoBoxBody">
          {!isThisPageEmpty()?
            (<Table striped hover className="mt-3">
            <thead>
              <tr>
                <th width="5%"></th>
                <th width="20%">아이디</th>
                <th width="10%">이름</th>
                <th width="20%">요청 시각</th>
                <th width="30%">요청 상세</th>
                <th width="15%">내용 확인 및<br/>승인/반려</th>
              </tr>
            </thead>
            <tbody>
              {pagination.alarms_data.map((item,idx)=>getTableRowFromRequestAlarmDatum(item,idx))}
            </tbody>
            </Table>):
            getNoDataPrompt()
          }
        </div>
        <div className="UserInfoBoxFooter">
          {!isThisPageEmpty()?getAlarmSearchPageNav():null}
        </div>
      </div>
      <div className="versionInfo">
        <p>
          <strong>ver. {versionInfo}</strong>
        </p>
      </div>
    </div>
  );
}
export default CheckAlarms;
