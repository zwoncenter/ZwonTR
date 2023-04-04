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

function ManageUser() {
  let history= useHistory();

  function getCurrentPage(){
    if(pageNum==0) return null;
    else return null;
  }

  function getCurrentPrompt(){
    if(pageNum==0) return "사용자 관리";
    else return "";
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
        {getCurrentPage()}
        <div className="registerInfoBoxFooter">
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
