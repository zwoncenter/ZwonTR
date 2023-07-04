import "./ManageUser.scss";
import { Form, Button, ProgressBar, Accordion, FormCheck, FormControl, Row, Table, Modal} from "react-bootstrap";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect } from "react";
import axios from "axios";
import Loginpage from "./LoginModal";
import { TbBulb, TbBuilding } from "react-icons/tb";
import { RiParentLine } from "react-icons/ri";
import { MdNavigateBefore, MdNavigateNext } from "react-icons/md";
import {FaCheck, FaSistrix, FaSleigh, FaTrash} from "react-icons/fa"
import { BsGearFill } from "react-icons/bs"
import privateInfoTerm from "../terms/privateInfoAgree";
import identifyingInfoTerm from "../terms/identifyingInfoAgree";
import sensitiveInfoTerm from "../terms/sensitiveInfoAgree";
import { getgroups } from "process";

const versionInfo = "1.6";

function ManageUser({
  setNowLoading,
  setNowNotLoading,
}) {
  let history= useHistory();
  const approved_status_categories=[
    "미승인된 사용자",
    "승인된 사용자",
    "사용 중지된 사용자",
  ];
  const approved_status_map={
    "미승인된 사용자":false,
    "승인된 사용자":true,
    "사용 중지된 사용자":true,
  }
  const suspended_status_map={
    "미승인된 사용자":false,
    "승인된 사용자":false,
    "사용 중지된 사용자":true,
  };
  const user_type_categories=[
    "전체",
    "학생",
    "학부모",
    "직원",
    "관리자",
    "아이디로 검색",
    "소속으로 검색",
  ];
  const user_prompt_to_user_type_map={
    "전체":null,
    "학생":"student",
    "학부모":"parent",
    "직원":"manager",
    "관리자":"admin",
    "아이디로 검색":null,
    "소속으로 검색":null,
  };
  const user_type_to_user_type_prompt_map={
    "student":"학생",
    "parent":"학부모",
    "manager":"직원",
    "admin":"관리자"
  }
  function isQueryUsingUsername(){
    return userTypeCategory==="아이디로 검색";
  }
  function isQueryUsingGroupName(){
    return userTypeCategory==="소속으로 검색";
  }
  const [approvedStatusCategory,setApprovedStatusCategory]= useState(approved_status_categories[0]);
  const [userTypeCategory,setUserTypeCategory]= useState(user_type_categories[0]);
  const [queryUsername,setQueryUsername]=useState("");
  const dummy_data=[];
  for(let i=0; i<30; i++){
    dummy_data.push({
      username:i.toString()+'a',
      nickname:i.toString()+'b',
      userType:'student',
      signUpDate:'2023-04-06',
      approved:false,
    });
  }
  const [pagination,setPagination]=useState({
    cur_page:1,
    total_page_num:1,
    status_data:[],
  });
  function updatePaginationElement(paginationElementIndex,field_name,value){
    setPagination((prevData)=>{
      const newData=JSON.parse(JSON.stringify(prevData));
      const status_data=newData.status_data;
      (status_data[paginationElementIndex])[field_name]=value;
      return newData;
    });
  }
  function deletePaginationElement(paginationElementIndex){
    setPagination((prevData)=>{
      const newData=JSON.parse(JSON.stringify(prevData));
      const status_data=newData.status_data;
      status_data.splice(paginationElementIndex,1);
      return newData;
    });
  }

  useEffect(()=>{
    getUserAccountApprovedStatus();
  },[]);

  function isThisPageEmpty(){
    return pagination.status_data.length===0;
  }
  function isUsernameFormControlDisabled(){
    return userTypeCategory!=="아이디로 검색";
  }
  function isGroupNameFormControlDisabled(){
    return userTypeCategory!=="소속으로 검색";
  }
  function isSearchBoxDisabled(){
    return isUsernameFormControlDisabled() && isGroupNameFormControlDisabled();
  }
  function getSearchBoxPlaceHolder(){
    if(userTypeCategory==="아이디로 검색") return "조회할 사용자 아이디를 입력해주세요";
    else if(userTypeCategory==="소속으로 검색") return "조회할 소속명을 입력해주세요";
    else return "";
  }
  function getNoDataPrompt(){
    return (
      <div className="NoDataPromptBox mt-5">
        <h4><strong>검색 조건과 일치하는 사용자가 없습니다</strong></h4>
      </div>
    );
  }
  function isoDateStringToLocalDateString(date_string){
    const d=new Date(date_string);
    return [d.toLocaleDateString(),d.toLocaleTimeString()].join(' ');
  }
  async function changeUserAccountApprovedStatus(user_info,status_value,pagination_idx,relatedDocumentID=null){
    const query={
      username:user_info.username,
      userType:user_info.userType,
      value:status_value,
    };
    if(relatedDocumentID) query["relatedDocumentID"]=relatedDocumentID;
    setNowLoading();
    const change_success=await axios
      .post("/api/changeUserAccountApprovedStatus",query)
      .then((res)=>{
        const data=res.data;
        if(!data.success) throw new Error();
        else if(data.ret.late) window.alert("이미 반영된 변경사항입니다");
        window.alert("권한 변경사항이 저장되었습니다");
        return true;
      })
      .catch((error)=>{
        window.alert(`네트워크 오류로 사용자 데이터를 불러오지 못했습니다`);
        return false
      });
    if(change_success){
      // const updated_status=JSON.parse(JSON.stringify(pagination));
      // updated_status.status_data[pagination_idx].approved=status_value; // this should be changed
      // setPagination(updated_status);
      updatePaginationElement(pagination_idx,"approved",status_value);
      updatePaginationElement(pagination_idx,"suspendedChangeDate",getCurrentDateString());
    }
    setNowNotLoading();
  }
  async function changeUserAccountSuspendedStatus(user_info,suspend,pagination_idx){
    const query={
      username:user_info.username,
      suspend,
    }
    setNowLoading();
    const change_success=await axios
      .post("/api/changeUserAccountSuspendedStatus",query)
      .then((res)=>{
        const data=res.data;
        if(!data.success) throw new Error();
        else if(data.ret.late) window.alert("이미 반영된 변경사항입니다");
        window.alert("사용 권한 변경사항이 저장되었습니다");
        return true;
      })
      .catch((error)=>{
        console.log(`error: ${error}`);
        window.alert(`네트워크 오류로 사용자 데이터를 불러오지 못했습니다`);
        return false
      });
    if(change_success){
      updatePaginationElement(pagination_idx,"suspended",suspend);
      // updatePaginationElement(pagination_idx,"suspendedChangeDate",getCurrentDateString());
    }
    setNowNotLoading();
  }
  async function deleteWaitingUser(username,pagination_idx){
    const query={
      username,
    };
    setNowLoading();
    const change_success=await axios
      .post("/api/deleteWaitingUser",query)
      .then((res)=>{
        const data=res.data;
        if(!data.success) throw new Error();
        else if(data.ret.late) {
          window.alert("이미 삭제된 계정 정보입니다");
          return true;
        }
        window.alert("계정 정보가 삭제되었습니다");
        return true;
      })
      .catch((error)=>{
        window.alert(`네트워크 오류로 사용자 데이터를 불러오지 못했습니다`);
        return false;
      });
    if(change_success){
      deletePaginationElement(pagination_idx);
    }
    setNowNotLoading();
  }
  function getGroupString(groupArray){
    if(!groupArray || Object.keys(groupArray[0]).length===0) return "";
    return groupArray.map((e,idx)=>e.group_name).join(", ");
  }
  const today=new Date();
  function checkIsDateToday(date){
    return today.getFullYear()===date.getFullYear() && today.getMonth()===date.getMonth() && today.getDate()===date.getDate();
  }
  function getCurrentDateString(){
    const date=new Date();
    return date.toISOString();
  }
  function getDateString(dateString){
    const date=new Date(dateString);
    if(checkIsDateToday(date)) return date.toLocaleTimeString();
    // else return date.toLocaleDateString();
    else return date.toLocaleString();
  }
  function getTableRowDateString(user_info_datum){
    const approved=user_info_datum.approved;
    const sign_up_date=user_info_datum.signUpDate;
    const suspended_change_date=user_info_datum.suspendedChangeDate;
    if(!approved) return getDateString(sign_up_date);
    else return getDateString(suspended_change_date);
  }
  function getAccountPermissionButton(user_info_datum,idx){
    // console.log(`user info datum: ${JSON.stringify(user_info_datum)}`);
    const username=user_info_datum.username;
    const nickname=user_info_datum.nickname;
    const approved_status=user_info_datum.approved;
    const suspended_status=user_info_datum.suspended;
    const user_type=user_info_datum.userType;
    const group_name=getGroupString(user_info_datum.groupOfUser);
    const student_info_map=studentInfoMap[group_name]?studentInfoMap[group_name]:{};
    const student_id_list=Object.keys(student_info_map);
    // console.log(`student info map: ${JSON.stringify(student_info_map)}`);
    if(!approved_status){
      return (
        <p>
          <Button
            variant="success"
            className="button-fit-content"
            disabled={approved_status}
            onClick={async ()=>{
              const user_type_prompt=user_type_to_user_type_prompt_map[user_info_datum.userType];
              if(user_info_datum.userType==="student"){
                prepareDataForStudentRegisterModal(user_info_datum,idx);
                setCurrentStudentInfoMap(student_info_map);
                setSelectedRelatedStudentID(student_id_list[0]);
                openModal("student_register");
                return;
              }
              if(!window.confirm(`${nickname}(${username}) 사용자의 [${user_type_prompt}] 권한을 활성화 하시겠습니까?`)) return;
              await changeUserAccountApprovedStatus(user_info_datum,true,idx);
            }}
          >
            <strong>승인</strong>
          </Button>
          <Button
            variant="warning"
            className="button-fit-content"
            disabled={approved_status}
            onClick={async ()=>{
              if(!window.confirm(`${nickname}(${username}) 계정의 가입을 반려하시겠습니까?\n(해당 계정의 모든 정보가 사라집니다)`)) return;
              await deleteWaitingUser(username,idx);
            }}
          >
            <strong>반려</strong>
          </Button>
        </p>
      );
    }
    else if(approved_status && !suspended_status){
      if(user_type==="admin") return null; //if user is admin no user suspend button
      return (
        <p>
          <Button
            variant="danger"
            className="button-fit-content"
            disabled={suspended_status}
            onClick={async ()=>{
              if(!window.confirm(`${nickname}(${username}) 사용자의 서비스 사용을 중지 하시겠습니까?`)) return;
              // await changeUserAccountApprovedStatus(user_info_datum,true,idx);
              await changeUserAccountSuspendedStatus(user_info_datum,true,idx);
            }}
          >
            <strong>사용 중지</strong>
          </Button>
          <Button
            variant="secondary"
            className="button-fit-content"
            disabled={suspended_status}
            onClick={async ()=>{
              openModal("tmp_password");
              setTmpPasswordUserTableIndex(idx);
            }}
          >
            <BsGearFill/>
          </Button>
        </p>
      );
    }
    else if(approved_status && suspended_status){
      return (
        <p>
          <Button
            variant="success"
            className="button-fit-content"
            disabled={!suspended_status}
            onClick={async ()=>{
              if(!window.confirm(`${nickname}(${username}) 사용자의 서비스 사용을 재승인 하시겠습니까?`)) return;
              // await changeUserAccountApprovedStatus(user_info_datum,true,idx);
              await changeUserAccountSuspendedStatus(user_info_datum,false,idx);
            }}
          >
            <strong>사용 재승인</strong>
          </Button>
        </p>
      );
    }
  }
  function getTableRowFromUserInfoDatum(user_info_datum,idx){
    const approved_status=user_info_datum.approved;
    const suspended_status=user_info_datum.suspended;
    const username=user_info_datum.username;
    const nickname=user_info_datum.nickname;
    const group_name=getGroupString(user_info_datum.groupOfUser);
    // console.log(`group name: ${group_name}`);
    return(
      <tr key={idx}>
        <td></td>
        <td><p>{username}</p></td>
        <td><p>{nickname}</p></td>
        <td><p>{user_type_to_user_type_prompt_map[user_info_datum.userType]}</p></td>
        <td><p>{group_name}</p></td>
        <td><p>{getTableRowDateString(user_info_datum)}</p></td>
        <td>
          {getAccountPermissionButton(user_info_datum,idx)}
        </td>
      </tr>
    );
  }
  function getUserInfoSearchPageNav(){
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
                getUserAccountApprovedStatus(pagination.cur_page-1);
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
                getUserAccountApprovedStatus(pagination.cur_page+1);
              }}
            >
              <strong><MdNavigateNext/></strong>
            </Button>
          </div>:null
        }
      </div>
    )
  }
  const [tableDateColumnPrompt,setTableDateColumnPrompt]=useState(getTableDateColumnPrompt());
  const [tableActionColumnPrompt,setTableActionColumnPrompt]=useState(getTableActionColumnPrompt());
  function updateTableColumnNames(){
    setTableDateColumnPrompt(getTableDateColumnPrompt());
    setTableActionColumnPrompt(getTableActionColumnPrompt());
  }
  function getTableDateColumnPrompt(){
    if(approvedStatusCategory===approved_status_categories[0]){ //not approved users
      return "회원가입 날짜";
    }
    else if(approvedStatusCategory===approved_status_categories[1]){ // approved users
      return <span>사용승인(재개)<br/>날짜</span>
    }
    else if(approvedStatusCategory===approved_status_categories[2]){ // suspended users
      return "사용중지 날짜"
    } 
  }
  function getTableActionColumnPrompt(){
    if(approvedStatusCategory===approved_status_categories[0]){ //not approved users
      return "사용 승인";
    }
    else if(approvedStatusCategory===approved_status_categories[1]){ // approved users
      return "사용 중지"
    }
    else if(approvedStatusCategory===approved_status_categories[2]){ // suspended users
      return "사용 재개"
    } 
  }
  function checkSearchQueryValid(query){
    //check if username is not empty
    if(userTypeCategory==="아이디로 검색") {
      const valid= !isQueryUsingUsername() || !!query.username;
      const msg=`검색할 아이디를 입력해주세요`;
      return [valid,msg];
    }
    else if(userTypeCategory==="소속으로 검색") {
      const valid=!isQueryUsingGroupName() || !!query.groupName;
      const msg=`검색할 소속명을 입력해주세요`;
      return [valid,msg];
    }
    else return [true,``];
  }
  function getUserAccountApprovedStatusSortFunction(){
    if(approvedStatusCategory===approved_status_categories[0]){
      return (a,b)=>{
        if(a.signUpDate!==b.signUpDate) return a.signUpDate>b.signUpDate?-1:1;
        if(a.userType!==b.userType) return a.userType<b.userType?-1:1;
        if(a.nickname!==b.nickname) return a.nickname<b.nickname?-1:1;
        return a.username<b.username?-1:a.usernmae>b.username?1:0;
      };
    }
    else if(approvedStatusCategory===approved_status_categories[1] ||
      approvedStatusCategory===approved_status_categories[2]){
      return (a,b)=>{
        if(a.suspendedChangeDate!==b.suspendedChangeDate) return a.suspendedChangeDate>b.suspendedChangeDate?-1:1;
        if(a.userType!==b.userType) return a.userType<b.userType?-1:1;
        if(a.nickname!==b.nickname) return a.nickname<b.nickname?-1:1;
        return a.username<b.username?-1:a.usernmae>b.username?1:0;
      };
    }
  }
  async function getUserAccountApprovedStatus(queryPage=1){
    const query= {
      approvedStatus:approved_status_map[approvedStatusCategory],
      suspendedStatus:suspended_status_map[approvedStatusCategory],
      userType:user_prompt_to_user_type_map[userTypeCategory],
      queryAllUserType:userTypeCategory==="전체",
      username:isQueryUsingUsername()?queryUsername:null,
      groupName:isQueryUsingGroupName()?queryUsername:null,
      queryPage:queryPage,
    }
    const [valid,msg]= checkSearchQueryValid(query);
    if(!valid){
      window.alert(`${msg}`);
      return;
    }
    setNowLoading();
    const status_data_pagination=await axios
      .post("/api/searchUserAccountApprovedStatus",query)
      .then((res)=>{
        const data=res.data;
        if(!data.success) throw new Error();
        return data.ret.pagination;
      })
      .catch((err)=>{
        window.alert(`네트워크 오류로 사용자 데이터를 불러오지 못했습니다`);
        return {
          cur_page:1,
          total_page_num:1,
          status_data:[]
        };
      })
    //here pagination data should be extracted
    const status_data=status_data_pagination.status_data;
    // if(status_data.length>0) status_data.sort((a,b)=>{
    //   if(a.signUpDate!==b.signUpDate) return a.signUpDate>b.signUpDate?-1:1;
    //   if(a.userType!==b.userType) return a.userType<b.userType?-1:1;
    //   if(a.nickname!==b.nickname) return a.nickname<b.nickname?-1:1;
    //   return a.username<b.username?-1:a.usernmae>b.username?1:0;
    // });
    const sort_function=getUserAccountApprovedStatusSortFunction();
    status_data.sort(sort_function);
    setPagination(status_data_pagination);
    updateTableColumnNames();
    setNowNotLoading();
  }

  //modal of this page
  const modal_status_template={
    show:false,
    for:null,
  };
  function getModalStatusTemplate(){
    return {...modal_status_template};
  }

  const [modalStatus,setModalStatus]=useState(getModalStatusTemplate());
  function updateModalStatus(fieldName,value){
    setModalStatus((prevData)=>{
      const newData={...prevData};
      newData[fieldName]=value;
      return newData;
    });
  }
  const openModal=(modalFor)=>{
    updateModalStatus("show",true);
    updateModalStatus("for",modalFor);
  }
  const closeModal=()=>{
    destroyModalData();
    setModalStatus(getModalStatusTemplate());
  }
  function destroyModalData(){
    if(modalStatus.for==="student_register") hideRelatedStudentModal();
    else if(modalStatus.for==="tmp_password") destroyTmpPasswordData();
    else return;
  }
  function getStudentRegisterModalTitle(){
    return (
      <span>
        계정과 연결될 기존 학생 정보를<br/>선택해주세요
      </span>
    );
  }
  function getTmpPasswordModalTitle(){
    return (
      <span>
        임시비밀번호 발급
      </span>
    );
  }
  function getModalTitle(){
    if(modalStatus.for==="student_register") return getStudentRegisterModalTitle();
    else if(modalStatus.for==="tmp_password") return getTmpPasswordModalTitle();
    else return null;
  }

  function getStudentRegisterModalBody(){
    if(!studentInfoMapLoaded) return null;
    return (
      <Modal.Body className="text-center RelatedStudentInfoBox">
        <div className="row mb-5 CandidateStudentUserBox border-3 border-bottom">
          <strong>계정 정보</strong><br/>
          <p className="mb-1">
            아이디: {candidateStudentUserInfo.username}<br/>
            이름: {candidateStudentUserInfo.nickname}
          </p>
        </div>
        <div className="row mb-5 CandidateStudentUserBox border-3 border-bottom">
          <Form className="mb-2">
            <Form.Label htmlFor="RelatedStudentSelection"><strong>계정 연관 학생</strong></Form.Label>
            <Form.Select
              id="RelatedStudentSelection mb-2"
              value={selectedRelatedStudentID}
              onChange={(e)=>{
                setSelectedRelatedStudentID(e.target.value);
              }}
            >
              {
                Object.keys(currentStudentInfoMap).map((student_id,sidx)=>{
                  return(
                    <option value={student_id} key={sidx}>
                      {getStudentFingerprintFromStudentInfo(currentStudentInfoMap[student_id])}
                    </option>
                  );
                })
              }
            </Form.Select>
          </Form>
        </div>
        <Button
            className="btn-success mb-3"
            onClick={async ()=>{
              const username=candidateStudentUserInfo.username;
              const nickname=candidateStudentUserInfo.nickname;
              const user_type_prompt=user_type_to_user_type_prompt_map[candidateStudentUserInfo.userType];
              if(!selectedRelatedStudentID){
                window.alert(`계정과 연동할 학생을 선택해주세요`);
                return;
              }
              let confirm_message=`${nickname}(${username}) 사용자의 [${user_type_prompt}] 권한을 활성화하고\n`;
              confirm_message+=`해당 계정을 [${getStudentFingerprintFromStudentInfo(currentStudentInfoMap[selectedRelatedStudentID])}]\n학생 정보와 연동하시겠습니까?`
              if(!window.confirm(confirm_message)) return;
              await changeUserAccountApprovedStatus(candidateStudentUserInfo,true,candidateStudentUserInfoTableIndex,selectedRelatedStudentID);
              // hideRelatedStudentModal();
              closeModal();
            }}
            type="button">
          <strong>정보 연동 및 계정 승인</strong>
        </Button>
        <br/>
        <Button
            className="btn-secondary"
            onClick={async ()=>{
              // hideRelatedStudentModal();
              closeModal();
            }}
            type="button">
          <strong>취소</strong>
        </Button>
      </Modal.Body>
    );
  }
  function getLocaleDateString(dateString){
    const date=new Date(dateString);
    return date.toLocaleString();
  }
  function checkTmpPasswordExpired(dateString){
    const expiration_date=new Date(dateString);
    const now= new Date();
    return expiration_date<now;
  }
  function getTmpPasswordModalBody(){
    const user_info_datum=pagination.status_data[tmpPasswordUserTableIndex];
    
    if(!user_info_datum) return null;
    const username=user_info_datum.username;
    const nickname=user_info_datum.nickname;
    const user_type=user_info_datum.userType;
    const user_type_prompt=user_type_to_user_type_prompt_map[user_type];
    const tmp_password=user_info_datum.tmp_password;
    return (
      <Modal.Body className="text-center RelatedStudentInfoBox">
        <div className="border-bottom border-secondary border-3 mb-2">
          <div className="row mb-2">
            <div className="col-4">
              아이디
            </div>
            <div className="col-8">
              {username}
            </div>
          </div>
        </div>
        <div className="border-bottom border-secondary border-3 mb-2">
          <div className="row mb-2">
            <div className="col-4">
              이름
            </div>
            <div className="col-8">
              {nickname}
            </div>
          </div>
        </div>
        <div className="border-bottom border-secondary border-3 mb-2">
          <div className="row mb-2">
            <div className="col-4">
              사용자 유형
            </div>
            <div className="col-8">
              {user_type_prompt}
            </div>
          </div>
        </div>
        <Button
            className="btn-success mb-3"
            onClick={async ()=>{
              if(!window.confirm(`${nickname}(${username}) 사용자의 임시비밀번호를 발급하시겠습니까?`)) return;
              await getTmpPassword(user_info_datum,tmpPasswordUserTableIndex);
            }}
            type="button">
          <strong>새 임시 비밀번호 발급</strong>
        </Button>
        <p>{tmp_password}</p>
        <br/>
        <Button
            className="btn-secondary"
            onClick={async ()=>{
              closeModal();
            }}
            type="button">
          <strong>취소</strong>
        </Button>
      </Modal.Body>
    );
  }
  function getModalBody(){
    if(modalStatus.for==="student_register") return getStudentRegisterModalBody();
    else if(modalStatus.for==="tmp_password") return getTmpPasswordModalBody();
    else return null;
  }
  
  // 기존 학생 정보와 계정 연동 관련 코드
  const [relatedStudentModal,setRelatedStudentModal]= useState(false);
  const [studentInfoMap, setStudentInfoMap]= useState({});
  const [currentStudentInfoMap,setCurrentStudentInfoMap]=useState({});
  const [studentInfoMapLoaded,setStudentInfoMapLoaded]= useState(false);
  const [selectedRelatedStudentID,setSelectedRelatedStudentID]= useState({});
  const [candidateStudentUserInfo,setCandidateStudentUserInfo]= useState({});
  const [candidateStudentUserInfoTableIndex,setCandidateStudentUserInfoTableIndex]= useState(null);

  function getStudentFingerprintFromStudentInfo(student_info_datum){
    return [student_info_datum.이름, student_info_datum.생년월일, student_info_datum.연락처].join(" / ");
  }

  const prepareDataForStudentRegisterModal= async(user_info_datum,user_table_index)=>{
    if(!studentInfoMapLoaded){
      window.alert("아직 학생 정보가 로드되지 않았습니다.\n같은 문제가 지속될 경우 새로고침 후 다시 시도해주세요.");
      return;
    }
    //choose one student info datum whose nickname datum is equal to selected user's nickname
    const target_student_name= user_info_datum.nickname;
    const student_id_list=Object.keys(studentInfoMap);
    let recommended_student_info=studentInfoMap[student_id_list[0]];
    for(let i=0; i<student_id_list.length; i++){
      const student_id=student_id_list[i];
      const student_info_datum=studentInfoMap[student_id];
      if(student_info_datum.이름===target_student_name){
        recommended_student_info=student_info_datum;
        break;
      }
    }
    setSelectedRelatedStudentID(recommended_student_info._id);
    // setRelatedStudentModal(true);
    setCandidateStudentUserInfo(user_info_datum);
    setCandidateStudentUserInfoTableIndex(user_table_index);
  };
  const hideRelatedStudentModal= async()=>{
    setRelatedStudentModal(false);
    setCurrentStudentInfoMap({});
  }

  useEffect(async ()=>{
    const active_student_list=await axios
      .get("/api/ActiveStudentListFromAllGroup")
      .then((res)=>{
        const data=res.data;
        if(!data.success) return [];
        else return data.ret;
      })
      .catch((err)=>{
        return [];
      });
    if(active_student_list.length>0){
      const info_map={};
      active_student_list.forEach((e,idx)=>{
        const group_name=e.groupName;
        if(!info_map[group_name]) info_map[group_name]={};
        info_map[group_name][e._id]=e;
      });
      setStudentInfoMap(info_map);
      setSelectedRelatedStudentID(null);
      setStudentInfoMapLoaded(true);
    }
  },[]);

  // 임시 비밀번호 발급 관련 코드
  const [tmpPasswordUserTableIndex,setTmpPasswordUserTableIndex]=useState(0);
  function destroyTmpPasswordData(){
    return;
  }
  async function makeTmpPasswordExpired(user_info_datum,idx){
    const payload={
      username:user_info_datum.username,
    };
    setNowLoading();
    const success= await axios
      .post("/api/makeTmpPasswordExpired",payload)
      .then((res)=>{
        const data=res.data;
        const success=data.success;
        const err_prompt=data.ret;
        if(!success){
          window.alert(`${err_prompt}`);
          return false;
        }
        return true;
      })
      .catch((err)=>{
        window.alert(`네트워크 오류로 임시비밀번호를 만료시키는 데 실패했습니다`);
        return false;
      });
    if(success){
      //update pagination info goes here
      const default_expiration_date_string=(new Date('1970-01-01')).toISOString();
      updatePaginationElement(idx,"tmpPasswordExpiration",default_expiration_date_string);
    }
    setNowNotLoading();
  }

  async function getTmpPassword(user_info_datum,idx){
    const payload={
      username:user_info_datum.username,
    }
    setNowLoading();
    const [success,tmp_password]= await axios
      .post("/api/getTmpPassword",payload)
      .then((res)=>{
        const data=res.data;
        const success=data.success;
        const err_prompt=data.ret;
        if(!success){
          window.alert(`${err_prompt}`);
          return [false,""];
        }
        return [true,data.ret];
      })
      .catch((err)=>{
        window.alert(`네트워크 오류로 임시비밀번호를 만드는 데 실패했습니다`);
        return [false,""];
      });
    if(success){
      //update pagination info goes here
      updatePaginationElement(idx,"tmp_password",tmp_password);
    }
    setNowNotLoading();
  }
  
  return (
    <div className="main-background text-center">
      <Modal show={modalStatus.show} onHide={closeModal}>
          <Modal.Header closeButton>
            <Modal.Title className="RelatedStudentInfoBoxTitle">{getModalTitle()}</Modal.Title>
          </Modal.Header>
          {getModalBody()}
      </Modal>
      <div className="headerBox">
        <h1>
          <strong>사용자 관리</strong>
        </h1>
        
      </div>
      <div className="UserInfoSearchBox">
        <div className="UserInfoBoxHeader row">
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
              disabled={isSearchBoxDisabled()}
              placeholder={getSearchBoxPlaceHolder()}
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
        </div>
        <div className="UserInfoBoxBody">
          {!isThisPageEmpty()?
            (<Table striped hover className="mt-3">
            <thead>
              <tr>
                <th width="5%"></th>
                <th width="15%">아이디</th>
                <th width="15%">이름</th>
                <th width="10%">사용자<br/>유형</th>
                <th width="15%">소속</th>
                <th width="20%">{tableDateColumnPrompt}</th>
                <th width="20%">{tableActionColumnPrompt}</th>
              </tr>
            </thead>
            <tbody>
              {pagination.status_data.map((item,idx)=>getTableRowFromUserInfoDatum(item,idx))}
            </tbody>
            </Table>):
            getNoDataPrompt()
          }
          </div>
        <div className="UserInfoBoxFooter">
          {!isThisPageEmpty()?getUserInfoSearchPageNav():null}
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
export default ManageUser;
