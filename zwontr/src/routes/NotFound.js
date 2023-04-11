import "./NotFound.scss";
import { Form, Button, ProgressBar, Accordion, FormCheck, FormControl, Row, Table} from "react-bootstrap";
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

function NotFound() {
  return (
    <div className="main-background text-center">
      <div className="headerBox">
        <h1>
          <strong>Not Found</strong>
        </h1>
        
      </div>
      <div className="NotFoundBox">
        <div className="NotFoundBoxHeader row">
          <h3><strong>없는 페이지이거나 해당 페이지에 접근 권한이 설정되어있지 않습니다</strong></h3>
        </div>
        <div className="NotFoundBoxFooter">
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
export default NotFound;
