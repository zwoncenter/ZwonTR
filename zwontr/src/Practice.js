import "./Practice.scss";
import { Form, Button } from "react-bootstrap";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect } from "react";
import Loginpage from "./routes/Loginpage";

function Practice() {
  const [loginModal, loginModalChange] = useState(false);
  return (
    <div className="main-background text-center">
      <div className={loginModal === true ? "box box-active" : "box"}>
        <h1>
          <strong>Zwon Center Manager</strong>
        </h1>
        {loginModal === true ? <Loginpage/> : null}
      </div>
      {loginModal === false
      ? <Button variant="dark" size="lg"
        id="main-button"
        className="m-3"
        onClick={() => {
          loginModalChange(true);
        }}
      >
        <strong>시작하기</strong>
      </Button>
      : null}
      
    </div>
  );
}
export default Practice;
