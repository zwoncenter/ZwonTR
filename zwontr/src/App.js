import "./App.scss";
import { Form, Button, Card, ListGroup, Table, Modal, Row, Col } from "react-bootstrap";
import { Link, Route, Switch } from "react-router-dom";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect } from "react";
import axios from "axios";

import Loginpage from "./routes/Loginpage";
import StuListpage from "./routes/StuListpage";
import StudentAdd from "./routes/StudentAdd";
import TRwrite from "./routes/TRwrite";
import TRedit from "./routes/TRedit";
import StudentEdit from "./routes/StudentEdit";

function App() {
  let history = useHistory();

  const [studentList, setstudentList] = useState([]);
  const [선택된index, 선택된index변경] = useState(0);

  const [trList, settrList] = useState([]);
  const [선택된TRindex, 선택된TRindex변경] = useState(0);

  return (
    <div className="App">
      <Route exact path="/">
        <Loginpage />
      </Route>
      <Route exact path="/studentAdd">
        <StudentAdd></StudentAdd>
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
        />
      </Route>
      <Route exact path="/TR/:name/write">
        <TRwrite stuDB={studentList[선택된index]}> </TRwrite>
      </Route>
      <Route exact path="/TR/:name/edit/:date">
        <TRedit stuDB={studentList[선택된index]} existTR={trList[선택된TRindex]}></TRedit>
      </Route>
      <Route exact path="/StudentEdit/:name">
        <StudentEdit existstuDB={studentList[선택된index]}></StudentEdit>
      </Route>
    </div>
  );
}

export default App;
