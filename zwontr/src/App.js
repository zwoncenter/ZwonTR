import "./App.scss";
import { Form, Button, Card, ListGroup, Table, Modal, Row, Col } from "react-bootstrap";
import { Link, Route, Switch } from "react-router-dom";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect } from "react";
import axios from "axios";

import Loginpage from "./routes/Loginpage";
import StuListpage from "./routes/StuListpage";
import StudentAdd from "./routes/StudentAdd";
import TRpage from "./routes/TRpage";

function App() {
  let history = useHistory();

  const [studentList, setstudentList] = useState([]);

  return (
    <div className="App">
      <Route exact path="/">
        <Loginpage />
      </Route>
      <Route exact path="/studentAdd">
        <StudentAdd></StudentAdd>
      </Route>
      <Route exact path="/studentList">
        <StuListpage studentList={studentList} setstudentList={setstudentList} />
      </Route>
      <Route exact path="/TR/:name/:date">
        <TRpage> </TRpage>
      </Route>
    </div>
  );
}

export default App;
