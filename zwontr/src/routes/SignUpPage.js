import "./SignUpPage.scss";
import { Form, Button, ProgressBar, Accordion, FormCheck, FormControl, Row} from "react-bootstrap";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect } from "react";
import axios from "axios";
import Loginpage from "./LoginModal";
import { TbBulb, TbBuilding } from "react-icons/tb";
import { RiParentLine } from "react-icons/ri";
import { MdNavigateBefore, MdNavigateNext } from "react-icons/md";
import privateInfoTerm from "../terms/privateInfoAgree";
import identifyingInfoTerm from "../terms/identifyingInfoAgree";
import sensitiveInfoTerm from "../terms/sensitiveInfoAgree";

const versionInfo = "1.6";

function SignUpPage() {
  let history= useHistory();
  function UserTypePage(){
    return (
      <Form>
        <Button
          variant="secondary"
          className="userTypeButton"
          onClick={()=>{
            setUserType("student");
          }}
          >
          <div>
            <strong>
              <TbBulb className="userTypeIcon"></TbBulb><br/>
              <span className="userTypeText">학생</span>
            </strong>
          </div>
        </Button>
        <Button
          variant="secondary"
          className="userTypeButton"
          onClick={()=>{
            setUserType("parent");
          }}
        >
          <div>
            <strong>
              <RiParentLine className="userTypeIcon"></RiParentLine><br/>
              <span className="userTypeText">학부모</span>
            </strong>
          </div>
        </Button>
        <Button
          variant="secondary"
          className="userTypeButton"
          onClick={()=>{
            setUserType("manager");
          }}
        >
          <div>
            <strong>
              <TbBuilding className="userTypeIcon"></TbBuilding><br/>
              <span className="userTypeText">직원</span>
            </strong>
          </div>
        </Button>
        <br/>
        <div className="promptText">
          {userType?<span>{userTypeToPrompt[userType]}(을)를 선택하셨습니다</span>:null}
        </div>
              </Form>
    );
  }
  const toggleAgreeStateAt= (index)=>{
    const curAgreeState=[...agreeState];
    curAgreeState[index]=!curAgreeState[index];
    setAgreeState(curAgreeState);
    if(!curAgreeState[index]) setAllAgreeState(false);
    else if(curAgreeState.reduce((anded,cur)=>anded&&cur,true)) setAllAgreeState(true);
  };
  function termsPage(){
    return (
      // <div>
      //   <Accordion>
      //     <Accordion.Item eventKey="0">
      //       <Accordion.Header>지원센터 이용약관 동의(필수)</Accordion.Header>
      //       <Accordion.Body>TBD</Accordion.Body>
      //     </Accordion.Item>
      //     <Accordion.Item eventKey="1">
      //       <Accordion.Header>개인정보 수집 및 이용 동의(필수)</Accordion.Header>
      //       <Accordion.Body>TBD</Accordion.Body>
      //     </Accordion.Item>
      //   </Accordion>
      // </div>
      <Form>    
        <Form.Check
          type="checkbox"
          id="private-info"
          label={"개인정보 처리 약관 동의(필수)"}
          checked={agreeState[0]}
          onClick={()=>{
            toggleAgreeStateAt(0);
          }}
        >
          {/* <span><strong>개인정보 처리 약관 동의(필수)</strong></span> */}
        </Form.Check>
        <textarea
          className="termTextBox"
          rows="4"
          value={privateInfoTerm}
          disabled={true}
        />

        <Form.Check
          type="checkbox"
          id="identifying-info"
          label={"고유식별정보 처리 약관 동의(필수)"}
          checked={agreeState[1]}
          onClick={()=>{
            toggleAgreeStateAt(1);
          }}
        />
        <textarea
          className="termTextBox"
          rows="4"
          value={identifyingInfoTerm}
          disabled={true}
        />

        <Form.Check
          type="checkbox"
          id="sensitive-info"
          label={"민감정보 처리 약관 동의(필수)"}
          checked={agreeState[2]}
          onClick={()=>{
            toggleAgreeStateAt(2);
          }}
        />
        <textarea
          className="termTextBox"
          rows="4"
          value={sensitiveInfoTerm}
          disabled={true}
        />

        <Form.Check
          type="checkbox"
          id="select-all"
          label={"지원인스티튜트 웹서비스의 이용 약관에 모두 동의합니다"}
          checked={allAgreeState}
          onClick={()=>{
            const allAgree=!allAgreeState;
            setAllAgreeState((val)=>!val);
            setAgreeState(agreeState.map((val)=>allAgree));
          }}
        />
      </Form>
    );
  }

  const [userInfoCheckedMap,setUserInfoCheckedMap]= useState({
    username:false,
    password:false,
    password_confirm:false,
    nickname:false,
    birth_date:false,
    sex:false,
    phone_number:false,
    email:false,
    address:false,
    school_attending_info:false
  });

  const [userInfoValidMap,setUserInfoValidMap]= useState({
    username:false,
    password:false,
    password_confirm:false,
    nickname:false,
    birth_date_year:false,
    birth_date_month:false,
    birth_date_date:false,
    sex:false,
    phone_number:false,
    email:false,
    address:false,
    school_attending_info_school:false,
    school_attending_info_status:false,
    school_attending_info_department:false,
    school_attending_info_major:false,
  });

  const [userInfo,setUserInfo]= useState({
    username:"",
    password:"",
    password_confirm:"",
    nickname:"",
    birth_date_year:(new Date()).getFullYear(),
    birth_date_month:(new Date()).getMonth()+1,
    birth_date_date:"",
    gender:"",
    phone_number:"",
    email:"",
    address:"",
    school_attending_info_school:"고등학교",
    school_attending_info_status:"졸업(검정고시 포함)",
    school_attending_info_department:"인문계열",
    school_attending_info_major:"",
  });
  const [usernameDuplicationChecked,setUsernameDuplicationChecked]=useState(false);
  const [termAgreedDate,setTremAgreedDate]=useState(null);
  function getUserBirthDate(){
    const d=new Date();
    d.setUTCFullYear(parseInt(userInfo.birth_date_year));
    d.setUTCMonth(parseInt(userInfo.birth_date_month)-1);
    d.setUTCDate(parseInt(userInfo.birth_date_date));
    return d.toJSON();
  }
  function getUserSchoolAttendingStatusObject(){
    return {
      school:userInfo.school_attending_info_school,
      status:userInfo.school_attending_info_status,
      department:userInfo.school_attending_info_department,
      major:userInfo.school_attending_info_major,
    };
  }
  function getUserRegisterInfo(){
    return {
      userType:userType,
      termAgreedDate:termAgreedDate,
      username:userInfo.username,
      password:userInfo.password,
      nickname:userInfo.nickname,
      birthDate:getUserBirthDate(),
      gender:userInfo.gender,
      phoneNumber:userInfo.phone_number,
      address:userInfo.address,
      schoolAttendingStatus:getUserSchoolAttendingStatusObject(),
      email:userInfo.email,
    };
  }

  function isFieldCheckedAndValid(field_name){
    return userInfoCheckedMap[field_name] && userInfoValidMap[field_name];
  }
  function isFieldInvalid(field_name){
    return userInfoCheckedMap[field_name] && !userInfoValidMap[field_name];
  }
  function isUsernameValid(username){
    const matched=username.match(/[a-z\d]{5,20}/);
    if(matched){
      return username.length===matched[0].length;
    }
    else return false;
  }
  function isUsernameDuplicationChecked(username){
    return usernameDuplicationChecked;
  }
  function isPasswordValid(password){
    const matched=password.match(/^(?=.*[a-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,10}$/);
    if(matched){
      return password.length===matched[0].length;
    }
    else return false;
  }
  function isPasswordConfirmed(password_confirm){
    return userInfo.password===password_confirm;
  }
  function isNicknameValid(nickname){
    const matched=nickname.match(/[가-힣]{2,10}/);
    if(matched){
      return nickname.length===matched[0].length;
    }
    else return false;
  }
  function isGenderValid(gender){
    return gender==="남자" || gender==="여자";
  }
  function isBirthDateValid(birth_date_date){
    const matched=birth_date_date.match(/[1-9]{1}[\d]{0,1}/);
    if(!matched || matched[0]!==birth_date_date) return false;
    const date_num=parseInt(birth_date_date);
    const d=new Date(userInfo.birth_date_year, userInfo.birth_date_month, 0);
    if(date_num>d.getDate() || 0>=date_num) return false;
    return true;
  }
  function isPhoneNumberValid(phone_number){
    const matched=phone_number.match(/[\d]{11}/);
    if(matched){
      return phone_number.length===matched[0].length && phone_number.slice(0,3)==="010";
    }
    else return false;
  }
  function isEmailValid(email){
    const matched=email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/);
    if(matched){
      return email.length==matched[0].length;
    }
    else return false;
  }
  function isAddressValid(address){
    return address.length>10;
  }
  function isMajorValid(major){
    return major.length>2;
  }
  function MajorInfoNeeded(){
    return userType==="manager" && userInfo.school_attending_info_school==="대학교";
  }
  const updateUserInfoByFieldName=(field_name,field_value,validity_check_function,...additional_info)=>{
    const infoCheckedMap={...userInfoCheckedMap};
    infoCheckedMap[field_name]=true;
    if(additional_info.length>0){
      const additional_field_name=additional_info[0];
      infoCheckedMap[additional_field_name]=true;
    }
    setUserInfoCheckedMap(infoCheckedMap);
    const infoValidMap={...userInfoValidMap};
    infoValidMap[field_name]=validity_check_function(field_value);
    if(additional_info.length>0){
      const additional_field_name=additional_info[0];
      const additional_field_value=additional_info[1];
      const additional_validity_check_function=additional_info[2];
      infoValidMap[additional_field_name]=additional_validity_check_function(additional_field_value);
    }
    setUserInfoValidMap(infoValidMap);
    const info={...userInfo};
    info[field_name]=field_value;
    if(additional_info.length>0){
      const additional_field_name=additional_info[0];
      const additional_field_value=additional_info[1];
      info[additional_field_name]=additional_field_value;
    }
    setUserInfo(info);
  }
  const getRowByFieldName=(field_name,field_prompt,invalid_feedback,validity_check_function,input_type,placeholder,maxlength)=>(
    <Row className="mb-3 userInfoRow">
      <label for={field_name} className="userInfoInputLabel">
        <strong>{field_prompt}</strong>
        {isFieldCheckedAndValid(field_name)?<span className="userInfoInputValidMark"> ✔</span>:null}
      </label>
      <input
        type={input_type}
        id={field_name}
        className="userInfoInputBox mb-1"
        value={userInfo[field_name]}
        placeholder={placeholder}
        maxlength={maxlength}
        onChange={(e)=>{
          updateUserInfoByFieldName(field_name,e.target.value,validity_check_function);
        }}
      />
      {isFieldInvalid(field_name)?
      <span className="userInfoFeedbackInvalid">
        {invalid_feedback}
      </span>:null}
    </Row>
  );
  const years=[];
  for(let i=1930; i<=(new Date()).getFullYear(); i++) years.push(i);
  const months=[];
  for(let i=1; i<=12; i++) months.push(i);
  const genders=["","남자","여자"];
  const schools=[
    "대학교","고등학교","중학교","초등학교"
  ];
  function getAttendingStatusesBySchoolType(school_type){
    if(school_type==="대학교") return ["졸업","졸업예정","재학","휴학","중퇴"];
    else if(school_type==="고등학교") return ["졸업(검정고시 포함)","재학","중퇴"];
    else if(school_type==="중학교") return ["졸업(검정고시 포함)","재학","중퇴"];
    else return ["졸업","재학"];

  }
  const departments=[
    "인문계열",
    "사회계열(경상계열)",
    "사회계열(법학계열)",
    "사회계열(사회과학계열)",
    "교육계열",
    "공학계열",
    "자연계열",
    "의약계열(의학)",
    "의약계열(약학)",
    "의약계열(간호, 치료보건)",
    "예체능계열",
    "기타",
  ];
  function userInfoPage1(){
    return (
      <Form>
        {/* {getRowByFieldName("username","아이디","5~20자의 영문 소문자, 숫자와 특수기호(_),(-)만 사용 가능합니다.",isUsernameValid,"text","",20)} */}
        <Row className="mb-3 userInfoRow">
          <label for={"username"} className="userInfoInputLabel">
            <strong>{"아이디"}</strong>
            {isFieldCheckedAndValid("username") && isUsernameDuplicationChecked()?<span className="userInfoInputValidMark"> ✔</span>:null}
          </label>
          <input
            type={"text"}
            id={"username"}
            className="userInfoInputBox-half mb-1"
            value={userInfo["username"]}
            placeholder={""}
            maxlength={20}
            onChange={(e)=>{
              updateUserInfoByFieldName("username",e.target.value,isUsernameValid);
              setUsernameDuplicationChecked(false);
            }}
          />
          <Button
            variant="success"
            className="button-fit-content ms-1"
            disabled={!isUsernameValid(userInfo.username)}
            onClick={async ()=>{
              if(!isUsernameValid(userInfo.username)){
                window.alert("올바른 아이디 형식이 아닙니다");
                return;
              }
              const available_check= await axios
                .post("/api/checkUsernameAvailable",{username:userInfo.username})
                .then((res)=>{
                  const data=res.data;
                  if(!data.success) throw new Error(data.ret);
                  else if(data.ret.available){
                    window.alert("사용 가능한 아이디입니다");
                    return true;
                  }
                  else{
                    window.alert("이미 사용중인 아이디입니다");
                    return false;
                  }
                })
                .catch((err)=>{
                  window.alert("아이디 중복 여부 검사 중 오류가 발생했습니다");
                  return false;
                });
              setUsernameDuplicationChecked(available_check);
            }}
          >
              중복확인
          </Button>
          <br/>
          {isFieldInvalid("username")?
          <span className="userInfoFeedbackInvalid">
            {"5~20자의 영문 소문자, 숫자와 특수기호(_),(-)만 사용 가능합니다."}
          </span>:null}
          {isFieldCheckedAndValid("username") && !isUsernameDuplicationChecked()?
          <span className="userInfoFeedbackInvalid">
            {"아이디 중복 여부를 확인해주세요."}
          </span>:null}
        </Row>
        {getRowByFieldName("password","비밀번호","8~16자이며 영문 소문자, 숫자가 하나 이상 포함되어야 합니다.",isPasswordValid,"password","",16)}
        {getRowByFieldName("password_confirm","비밀번호 재확인","비밀번호가 일치하지 않습니다.",isPasswordConfirmed,"password","",16)}
        {getRowByFieldName("nickname","이름","2~10자의 한글만 입력해주세요.",isNicknameValid,"text","",10)}
        <Row className="mb-3 userInfoRow">
          <label for="birth_date_year" className="userInfoInputLabel">
            <strong>생년월일</strong>
            {isFieldCheckedAndValid("birth_date_date")?<span className="userInfoInputValidMark"> ✔</span>:null}
          </label>
          <select
            id="birth_date_year"
            className="userInfoInputBox-third mb-1 me-3"
            value={userInfo.birth_date_year}
            onChange={(e)=>{
              updateUserInfoByFieldName("birth_date_year",e.target.value,()=>true);
            }}
          >
            {years.map((year)=><option value={year}>{year}</option>)}
          </select>
          <select
            id="birth_date_month"
            className="userInfoInputBox-third mb-1 me-3"
            value={userInfo.birth_date_month}
            onChange={(e)=>{
              updateUserInfoByFieldName("birth_date_month",e.target.value,()=>true);
            }}
          >
            {months.map((month)=><option value={month}>{month}</option>)}
          </select>
          <input
            type="text"
            id="birth_date_date"
            className="userInfoInputBox-third mb-1 me-3"
            maxlength="2"
            value={userInfo.birth_date_date}
            onChange={(e)=>{
              updateUserInfoByFieldName("birth_date_date",e.target.value,isBirthDateValid);
            }}
          />
          {isFieldInvalid("birth_date_date")?
          <span className="userInfoFeedbackInvalid">
            올바른 생년월일을 입력해주세요.
          </span>:null}
        </Row>
      </Form>
    );
  }
  function userInfoPage1OkToProceed(){
    let ret=false;
    if(!isUsernameValid(userInfo.username)) window.alert("올바른 아이디가 아닙니다");
    else if(!isUsernameDuplicationChecked()) window.alert("아이디 중복 여부가 확인되지 않았습니다");
    else if(!isPasswordValid(userInfo.password)) window.alert("올바른 비밀번호가 아닙니다");
    else if(!isPasswordConfirmed(userInfo.password_confirm)) window.alert("재입력한 비밀번호가 일치하지 않습니다");
    else if(!isNicknameValid(userInfo.nickname)) window.alert("올바른 이름이 아닙니다");
    else if(!isBirthDateValid(userInfo.birth_date_date)) window.alert("올바른 생년월일이 아닙니다");
    else ret=true;
    return ret;
  }
  function userInfoPage2(){
    return (
      <Form>
        <Row className="mb-3 userInfoRow">
          <label for="gender" className="userInfoInputLabel">
            <strong>성별</strong>
            {isFieldCheckedAndValid("gender")?<span className="userInfoInputValidMark"> ✔</span>:null}
          </label>
          <select
            id="gender"
            className="userInfoInputBox-third mb-1"
            value={userInfo.gender}
            onChange={(e)=>{
              updateUserInfoByFieldName("gender",e.target.value,isGenderValid);
            }}
          >
            {genders.map((gender)=><option value={gender}>{gender}</option>)}
          </select>
          {isFieldInvalid("gender")?
          <span className="userInfoFeedbackInvalid">
            성별을 선택해주세요.
          </span>:null}
        </Row>
        {getRowByFieldName("phone_number","휴대전화","올바른 전화번호를 입력해주세요.",isPhoneNumberValid,"text","- 없이 입력",11)}
        {getRowByFieldName("address","주소","주소를 10자 이상 입력해주세요",isAddressValid,"text","10자 이상 입력",40)}
        <Row className="mb-3 userInfoRow">
          <label for="school_attending_info_school" className="userInfoInputLabel">
            <strong>재학정보</strong>
            {true?<span className="userInfoInputValidMark"> ✔</span>:null}
          </label>
          <select
            id="school_attending_info_school"
            className="userInfoInputBox-third mb-1 me-3"
            value={userInfo.school_attending_info_school}
            onChange={(e)=>{
              const school_type=e.target.value;
              const proper_attending_statuses=getAttendingStatusesBySchoolType(school_type);
              updateUserInfoByFieldName("school_attending_info_school",school_type,()=>true,"school_attending_info_status",proper_attending_statuses[0],()=>true);
            }}
          >
            {schools.map((school)=><option value={school}>{school}</option>)}
          </select>
          <select
            id="school_attending_info_status"
            className="userInfoInputBox-40 mb-1 me-3"
            value={userInfo.school_attending_info_status}
            onChange={(e)=>{
              updateUserInfoByFieldName("school_attending_info_status",e.target.value,()=>true);
            }}
          >
            {getAttendingStatusesBySchoolType(userInfo.school_attending_info_school).map((status)=><option value={status}>{status}</option>)}
          </select>
        </Row>
        {MajorInfoNeeded()?
          <>
          <Row className="mb-1 userInfoRow">
            <label for="school_attending_info_department" className="userInfoInputLabel">
              <strong>전공계열</strong>
              {true?<span className="userInfoInputValidMark"> ✔</span>:null}
            </label>
            <select
              id="school_attending_info_department"
              className="userInfoInputBox-half mb-1 margin-right-auto"
              value={userInfo.school_attending_info_department}
              onChange={(e)=>{
                updateUserInfoByFieldName("school_attending_info_department",e.target.value,()=>true);
              }}
            >
                {departments.map((department)=><option value={department}>{department}</option>)}
            </select>
          </Row>
          {getRowByFieldName("school_attending_info_major","학과명","학과명을 3자 이상 입력해주세요",isMajorValid,"text","3자 이상 입력",30)}
        </>:null}

        {getRowByFieldName("email","이메일 (선택)","올바른 이메일 주소를 입력해주세요.",isEmailValid,"text","",40)}
      </Form>
    );
  }
  function userInfoPage2OkToProceed(){
    let ret=false;
    if(!isGenderValid(userInfo.gender)) window.alert("올바른 성별이 아닙니다");
    else if(!isPhoneNumberValid(userInfo.phone_number)) window.alert("올바른 휴대전화 번호가 아닙니다");
    else if(!isAddressValid(userInfo.address)) window.alert("올바른 주소가 아닙니다");
    else if(MajorInfoNeeded() && !isMajorValid(userInfo.school_attending_info_major)) window.alert("올바른 학과명이 아닙니다");
    else if(userInfo.email!=="" && !isEmailValid(userInfo.email)) window.alert("올바른 이메일 주소가 아닙니다");
    else ret=true;
    return ret;
  }
  function getCurrentPage(){
    if(pageNum==0) return UserTypePage();
    else if(pageNum==1) return termsPage();
    else return null;
  }

  function getCurrentPrompt(){
    if(pageNum==0) return "사용자 유형을 선택해주세요";
    else if(pageNum==1) return "서비스 약관을 읽고 동의해주세요";
    else if(pageNum==2) return "가입 정보를 입력해주세요";
    else if(pageNum==3) return "가입 정보를 입력해주세요";
    else return "";
  }

  function getCurrentProgressRate(){
    return pageNum/4*100;
  }

  function isAllAgreed(){
    for(let i=0; i<agreeState.length; i++){
      if(!agreeState[i]) return false;
    }
    return true;
  }

  async function okToProceed(){
    if(pageNum==0){
      if(!userType){
        window.alert("사용자 유형을 선택해주세요");
        return false;
      }
      return true;
    }
    else if(pageNum==1){
      if(!isAllAgreed()){
        window.alert('동의하지 않은 약관이 있습니다');
        return false;
      }
      setTremAgreedDate((new Date()).toJSON());
      return true;
    }
    else if(pageNum==2){
      if(!userInfoPage1OkToProceed()){
        return false;
      }
      return true;
    }
    else if(pageNum==3){
      if(!userInfoPage2OkToProceed()){
        return false;
      }
      await axios
        .post("/api/registerUser",getUserRegisterInfo())
        .then((res)=>{
          const data=res.data;
          if(!data.success) window.alert(data.ret);
          else if(!data.ret.registered) window.alert(`회원가입에 실패했습니다: ${data.ret.excuse}`);
          else{
            window.alert("회원가입이 완료되었습니다");
            history.push("/");
          }
        })
        .catch((err)=>{
          window.alert("회원가입 중 네트워크 오류가 발생했습니다");
        });
      return false;
    }
    else return true;
  }

  const [pageNum, setPageNum]= useState(0);
  // const [registerProgress, setRegisterProgress] = useState(0);
  const [userType, setUserType]= useState(null);
  const userTypeToPrompt={'student':"학생",'parent':'학부모','manager':'직원'};
  const [allAgreeState,setAllAgreeState]=useState(false);
  const [agreeState,setAgreeState]=useState([false,false,false]);
  
  return (
    <div className="main-background text-center">
      <div className="headerBox">
        <h1>
          <strong>{getCurrentPrompt()}</strong>
        </h1>
        
      </div>
      <div className="registerInfoBox">
        <div className="progressBarBox">
          <ProgressBar striped variant="success" now={getCurrentProgressRate()}></ProgressBar>
        </div>
        {getCurrentPage()}
        <div className="registerInfoBoxFooter">
          {
            pageNum>0?
            <Button
              variant="success"
              onClick={()=>{
                setPageNum(before=>before-1)
              }}
            >
              <MdNavigateBefore size={30}></MdNavigateBefore>
            </Button>:null
          }
          <Button
              variant="success"
              className="nextButton"
              onClick={async ()=>{
                if(await okToProceed()) setPageNum(before=>before+1)
              }}
            >
              {pageNum<3?<MdNavigateNext size={30}></MdNavigateNext>:"가입"}
          </Button>
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
export default SignUpPage;
