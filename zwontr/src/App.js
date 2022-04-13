import { Form, Button, Card, ListGroup, Table, Modal, Row, Col } from "react-bootstrap";
import { Link, Route, Switch } from "react-router-dom";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect } from "react";
import axios from "axios";

import StuListpage from "./routes/StuListpage";
import StudentAdd from "./routes/StudentAdd";
import TRwrite from "./routes/TRwrite";
import TRedit from "./routes/TRedit";
import StudentEdit from "./routes/StudentEdit";
import FirstPage from "./routes/FirstPage";
import StuInfoAdd from "./routes/StuInfoAdd";
import StudyChart from "./routes/StudyChart";

function App() {
  let history = useHistory();

  const [studentList, setstudentList] = useState([]); // 학생 DB 리스트
  const [선택된index, 선택된index변경] = useState(0);

  const [trList, settrList] = useState([]); // 선택된 학생의 trList
  const [선택된TRindex, 선택된TRindex변경] = useState(0);

  const [managerList, setmanagerList] = useState([]);

  return (
    <div className="App">
      <Route exact path="/">
        <FirstPage />
      </Route>
      <Route exact path="/studentList">
        <StuListpage
          trList={trList}
          settrList={settrList}
          선택된TRindex={선택된TRindex}
          선택된TRindex변경={선택된TRindex변경}
          studentList={studentList}
          setstudentList={setstudentList}
          선택된index={선택된index}
          선택된index변경={선택된index변경}
          managerList={managerList}
          setmanagerList={setmanagerList}
        />
      </Route>
      <Route exact path="/studentAdd">
        <StudentAdd managerList={managerList}></StudentAdd>
      </Route>
      <Route exact path="/StudentEdit/:name">
        <StudentEdit managerList={managerList} existstuDB={studentList[선택된index]}></StudentEdit>
      </Route>
      <Route exact path="/TR/:name/write">
        <TRwrite stuDB={studentList[선택된index]} managerList={managerList}></TRwrite>
      </Route>
      <Route exact path="/TR/:name/edit/:date">
        <TRedit stuDB={studentList[선택된index]} existTR={trList[선택된TRindex]} managerList={managerList}></TRedit>
      </Route>
      <Route exact path="/StuInfoAdd">
        <StuInfoAdd managerList={managerList}></StuInfoAdd>
      </Route>

      <Route exact path="/Chart/:name">
        <StudyChart stuDB={studentList[선택된index]} trList={trList} />
      </Route>
    </div>
  );
}

export default App;
