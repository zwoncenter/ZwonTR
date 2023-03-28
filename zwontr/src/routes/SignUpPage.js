import "./SignUpPage.scss";
import { Form, Button, ProgressBar, Accordion, FormCheck, FormControl} from "react-bootstrap";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect } from "react";
import Loginpage from "./LoginModal";
import { TbBulb, TbBuilding } from "react-icons/tb";
import { RiParentLine } from "react-icons/ri";
import { MdNavigateBefore, MdNavigateNext } from "react-icons/md";
import privateInfoTerm from "../terms/privateInfoAgree";
import identifyingInfoTerm from "../terms/identifyingInfoAgree";
import sensitiveInfoTerm from "../terms/sensitiveInfoAgree";

const versionInfo = "1.6";

function SignUpPage() {
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
            const curAgreeState=[...agreeState];
            curAgreeState[0]=!curAgreeState[0];
            setAgreeState(curAgreeState);
          }}
        />
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
            const curAgreeState=[...agreeState];
            curAgreeState[1]=!curAgreeState[1];
            setAgreeState(curAgreeState);
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
            const curAgreeState=[...agreeState];
            curAgreeState[2]=!curAgreeState[2];
            setAgreeState(curAgreeState);
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
          label={"지원센터 웹서비스의 이용 약관에 모두 동의합니다"}
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
  function getCurrentPage(){
    if(pageNum==0) return UserTypePage();
    else if(pageNum==1) return termsPage();
    else return null;
  }

  function getCurrentPrompt(){
    if(pageNum==0) return "사용자 유형을 선택해주세요";
    else if(pageNum==1) return "서비스 약관을 읽고 동의해주세요";
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

  function okToProceed(){
    if(pageNum==1){
      if(!isAllAgreed()){
        window.alert('동의하지 않은 약관이 있습니다');
        return false;
      }
      return true;
    }
    else return true;
  }

  const [loginModal, loginModalChange] = useState(false);
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
              onClick={()=>{
                if(okToProceed()) setPageNum(before=>before+1)
              }}
            >
              <MdNavigateNext size={30}></MdNavigateNext>
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
