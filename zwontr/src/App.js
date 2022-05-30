import { Form, Button, Card, ListGroup, Table, Modal, Row, Col } from "react-bootstrap";
import { Link, Route, Switch, useLocation, Redirect } from "react-router-dom";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect } from "react";
import axios from "axios";
import menuarrow from "./next.png";


import StuListpage from "./routes/StuListpage";
import StudentAdd from "./routes/StudentAdd";
import TRwrite from "./routes/TRwrite";
import TRedit from "./routes/TRedit";
import StudentEdit from "./routes/StudentEdit";
import FirstPage from "./routes/FirstPage";
import StuInfoAdd from "./routes/StuInfoAdd";
import StuInfoEdit from "./routes/StuInfoEdit";
import StudyChart from "./routes/StudyChart";
import ClosemeetingWrite from "./routes/ClosemeetingWrite";
import ClosemeetingEdit from "./routes/ClosemeetingEdit";
import Todolist from "./routes/Todolist.js"

function App() {
  let history = useHistory();
  const today = new Date().toISOString().split("T")[0];

  const [studentList, setstudentList] = useState([]); // 학생 DB 리스트
  const [선택된index, 선택된index변경] = useState(0);

  const [trList, settrList] = useState([]); // 선택된 학생의 trList
  const [선택된TRindex, 선택된TRindex변경] = useState(0);

  const [managerList, setmanagerList] = useState([]);

  const { pathname } = useLocation();

  return (
    <div className="App">
      <div className="menu">
        <div className="menu-map">
          <Button
            className="menu-map-btn btn-secondary"
            onClick={() => {
              history.push("/studentList");
            }}
          >
            <h5>
              <strong>학생 관리</strong>
            </h5>
          </Button>
          <Button
            className="menu-map-btn btn-secondary"
            onClick={() => {
              axios
                .get(`/api/Closemeeting/find/${today}`)
                .then((result) => {
                  if (result["data"] === null) {
                      history.push(`/Closemeeting/Write/${today}`);
                  } else {
                      history.push(`/Closemeeting/Edit/${today}`);
                  }
                })
                .catch((err) => {
                  console.log(err);
                });
            }}
          >
            <h5>
              <strong>마감 회의</strong>
            </h5>
          </Button>
          <Button
            className="menu-map-btn btn-secondary"
            onClick={() => {
              history.push("/Todolist");
            }}
          >
            <h5>
              <strong>TO-DO list</strong>
            </h5>
          </Button>
          <Button
            className="menu-map-btn btn-secondary"
            onClick={() => {
              window.alert("준비중입니다!");
            }}
          >
            <h5>
              <strong>대시보드</strong>
            </h5>
          </Button>
        </div>
        <div className="menuArrow">
          <img src={menuarrow} alt="menuarrow" />
        </div>
      </div>
      <Switch>
        <Route exact path="/">
          <FirstPage />
        </Route>
        <Route exact path="/studentList">
          <StuListpage />
        </Route>
        <Route exact path="/studentAdd">
          <StudentAdd />
        </Route>
        <Route exact path="/StudentEdit/:ID">
          <StudentEdit />
        </Route>
        <Route exact path="/TR/:ID/write">
          <TRwrite />
        </Route>
        <Route exact path="/TR/:ID/edit/:date">
          <TRedit />
        </Route>
        <Route exact path="/StuInfoAdd">
          <StuInfoAdd />
        </Route>

        <Route exact path="/StuInfoEdit/:ID">
          <StuInfoEdit />
        </Route>
        <Route exact path="/Chart/:ID">
          <StudyChart />
        </Route>
        <Route exact path="/Closemeeting/Write/:date">
          <ClosemeetingWrite />
        </Route>
        <Route exact path="/Closemeeting/Edit/:date">
          <ClosemeetingEdit />
        </Route>
        <Route exact path="/Todolist">
          <Todolist />
        </Route>
      </Switch>
    </div>
  );
}

export default App;
