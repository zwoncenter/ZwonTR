import "./ManageUser.scss";
import { Form, Button, ProgressBar, Accordion, FormCheck, FormControl, Row, Table, Modal} from "react-bootstrap";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect } from "react";
import axios from "axios";
import Loginpage from "./LoginModal";
import { TbBulb, TbBuilding } from "react-icons/tb";
import { RiParentLine } from "react-icons/ri";
import { MdNavigateBefore, MdNavigateNext } from "react-icons/md";
import {FaCheck, FaSistrix, FaTrash} from "react-icons/fa"
import privateInfoTerm from "../terms/privateInfoAgree";
import identifyingInfoTerm from "../terms/identifyingInfoAgree";
import sensitiveInfoTerm from "../terms/sensitiveInfoAgree";

const versionInfo = "1.6";

function ManageUser({
  setNowLoading,
  setNowNotLoading,
}) {
  let history= useHistory();
  const approved_status_categories=[
    "미승인된 사용자",
    "승인된 사용자",
  ];
  const approved_status_map={
    "미승인된 사용자":false,
    "승인된 사용자":true,
  }
  const user_type_categories=[
    "전체",
    "학생",
    "학부모",
    "직원",
    "관리자",
    "아이디로 검색",
  ];
  const user_prompt_to_user_type_map={
    "전체":null,
    "학생":"student",
    "학부모":"parent",
    "직원":"manager",
    "관리자":"admin",
    "아이디로 검색":null,
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
        else if(data.ret.late) window.alert("이미 변경사항이 반영된 변경사항입니다");
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
  function getSignUpDateString(dateString){
    const date=new Date(dateString);
    if(checkIsDateToday(date)) return date.toLocaleTimeString();
    else return date.toLocaleDateString();
  }
  function getTableRowFromUserInfoDatum(user_info_datum,idx){
    const action_able=!user_info_datum.approved;
    return(
      <tr key={idx}>
        <td></td>
        <td><p>{user_info_datum.username}</p></td>
        <td><p>{user_info_datum.nickname}</p></td>
        <td><p>{user_type_to_user_type_prompt_map[ user_info_datum.userType]}</p></td>
        <td><p>{getGroupString(user_info_datum.groupOfUser)}</p></td>
        <td><p>{getSignUpDateString(user_info_datum.signUpDate)}</p></td>
        <td>
          {action_able?
            <Button
              variant="success"
              className="button-fit-content"
              disabled={user_info_datum.approved}
              onClick={async ()=>{
                const username=user_info_datum.username;
                const nickname=user_info_datum.nickname;
                const user_type_prompt=user_type_to_user_type_prompt_map[user_info_datum.userType];
                if(user_info_datum.userType==="student"){
                  showRelatedStudentModal(user_info_datum,idx);
                  return;
                }
                if(!window.confirm(`${nickname}(${username}) 사용자의 [${user_type_prompt}] 권한을 활성화 하시겠습니까?`)) return;
                await changeUserAccountApprovedStatus(user_info_datum,true,idx);
              }}
            >
              <strong>승인</strong>
            </Button>:null
          }
          {action_able?
            <Button
              variant="warning"
              className="button-fit-content"
              disabled={user_info_datum.approved}
              onClick={async ()=>{
                const username=user_info_datum.username;
                const nickname=user_info_datum.nickname;
                if(!window.confirm(`${nickname}(${username}) 계정의 가입을 반려하시겠습니까?\n(해당 계정의 모든 정보가 사라집니다)`)) return;
                await deleteWaitingUser(username,idx);
              }}
            >
              <strong>반려</strong>
            </Button>:null
          }
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
  function checkSearchQueryValid(query){
    //check if username is not empty
    return !isQueryUsingUsername() || !!query.username;
  }
  async function getUserAccountApprovedStatus(queryPage=1){
    const query= {
      approvedStatus:approved_status_map[approvedStatusCategory],
      userType:user_prompt_to_user_type_map[userTypeCategory],
      queryAllUserType:userTypeCategory==="전체",
      username:isQueryUsingUsername()?queryUsername:null,
      queryPage:queryPage
    }
    if(!checkSearchQueryValid(query)){
      window.alert(`검색할 사용자 아이디를 입력해주세요`);
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
    //here pagenation data should be extracted
    const status_data=status_data_pagination.status_data;
    if(status_data.length>0) status_data.sort((a,b)=>{
      if(a.signUpDate!==b.signUpDate) return a.signUpDate>b.signUpDate?-1:1;
      if(a.userType!==b.userType) return a.userType<b.userType?-1:1;
      if(a.nickname!==b.nickname) return a.nickname<b.nickname?-1:1;
      return a.username<b.username?-1:a.usernmae>b.username?1:0;
    });
    setPagination(status_data_pagination);
    setNowNotLoading();
  }
  
  // 기존 학생 정보와 계정 연동 관련 코드
  const [relatedStudentModal,setRelatedStudentModal]= useState(false);
  const [studentInfoMap, setStudentInfoMap]= useState({});
  const [studentInfoMapLoaded,setStudentInfoMapLoaded]= useState(false);
  const [selectedRelatedStudentID,setSelectedRelatedStudentID]= useState({});
  const [candidateStudentUserInfo,setCandidateStudentUserInfo]= useState({});
  const [candidateStudentUserInfoTableIndex,setCandidateStudentUserInfoTableIndex]= useState(null);

  function getStudentFingerprintFromStudentInfo(student_info_datum){
    return [student_info_datum.이름, student_info_datum.생년월일, student_info_datum.연락처].join(" / ");
  }

  const showRelatedStudentModal= async(user_info_datum,user_table_index)=>{
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
    setRelatedStudentModal(true);
    setCandidateStudentUserInfo(user_info_datum);
    setCandidateStudentUserInfoTableIndex(user_table_index);
  };
  const hideRelatedStudentModal= async()=>{
    setRelatedStudentModal(false);
  }

  useEffect(async ()=>{
    const active_student_list=await axios
      .get("/api/ActiveStudentList")
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
        info_map[e._id]=e;
      })
      setStudentInfoMap(info_map);
      setSelectedRelatedStudentID(active_student_list[0]._id);
      setStudentInfoMapLoaded(true);
    }
  },[]);
  
  return (
    <div className="main-background text-center">
      <Modal show={relatedStudentModal} onHide={hideRelatedStudentModal}>
          <Modal.Header closeButton>
            <Modal.Title className="RelatedStudentInfoBoxTitle">계정과 연결될 기존 학생 정보를<br/>선택해주세요</Modal.Title>
          </Modal.Header>
          {studentInfoMapLoaded?<Modal.Body className="text-center RelatedStudentInfoBox">
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
                    Object.keys(studentInfoMap).map((student_id,sidx)=>{
                      return(
                        <option value={student_id} key={sidx}>
                          {getStudentFingerprintFromStudentInfo(studentInfoMap[student_id])}
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
                  let confirm_message=`${nickname}(${username}) 사용자의 [${user_type_prompt}] 권한을 활성화하고\n`;
                  confirm_message+=`해당 계정을 [${getStudentFingerprintFromStudentInfo(studentInfoMap[selectedRelatedStudentID])}]\n학생 정보와 연동하시겠습니까?`
                  if(!window.confirm(confirm_message)) return;
                  await changeUserAccountApprovedStatus(candidateStudentUserInfo,true,candidateStudentUserInfoTableIndex,selectedRelatedStudentID);
                  hideRelatedStudentModal();
                }}
                type="button">
              <strong>정보 연동 및 계정 승인</strong>
            </Button>
            <br/>
            <Button
                className="btn-secondary"
                onClick={async ()=>{
                  hideRelatedStudentModal();
                }}
                type="button">
              <strong>취소</strong>
            </Button>
          </Modal.Body>:null}
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
                <th width="20%">회원가입 날짜</th>
                <th width="20%">사용 승인</th>
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
