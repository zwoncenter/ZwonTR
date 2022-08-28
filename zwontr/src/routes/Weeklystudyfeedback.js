import "./Weeklystudyfeedback.css";
import {
  Form,
  Button,
  Card,
  ListGroup,
  Table,
  Modal,
  Row,
  Col,
  Input,
  OverlayTrigger,
  Popover,
} from "react-bootstrap";
import {
  useHistory,
  useParams,
} from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect, useRef } from "react";
import axios from "axios";

function Weeklystudyfeedback() {
  const param = useParams();
  const [textbookList, settextbookList] = useState([]);
  const [thisweekTRList, setthisweekTRList] = useState([]);

  function getThisWeek() {
    var inputDate = new Date();
    inputDate.setHours(0, 0, 0, 0);
    var day = inputDate.getDay();
    var diff = inputDate.getDate() - day + (day == 0 ? -6 : 1);
    inputDate = new Date(inputDate.setDate(diff));
    var enddate = new Date(inputDate.setDate(inputDate.getDate()));
    var startdate = new Date(inputDate.setDate(inputDate.getDate() - 7));
    return [startdate, enddate];
    console.log(startdate, enddate);
  }

  useEffect(async () => {
    const existstuInfo = await axios
      .get(`/api/StudentDB/${param["ID"]}`)
      .then((result) => {
        if (result.data === "로그인필요") {
          window.alert("로그인이 필요합니다.");
        }
        return result["data"];
      })
      .catch((err) => {
        return err;
      });
    settextbookList(existstuInfo["진행중교재"]);

    const studentTRlist = await axios
      .get(`/api/TR/${param["ID"]}`)
      .then(async function (result) {
        await result.data.sort(function (a, b) {
          return +(new Date(a.날짜) < new Date(b.날짜)) - 0.5;
        });
        // console.log(result.data);
        return result.data;
      })
      .catch(function (err) {
        console.log("/api/TR/:name fail : ", err);
      });

      
  });

  return (
    <div className="Weeklystudyfeedback-background">
      <h2>
        <strong>주간학습피드백</strong>
      </h2>
      <Table striped hover size="sm" className="Weeklystudyfeedback-table">
        <thead>
          <tr>
            <th width="25%">
              <strong>교재명</strong>
            </th>
            <th>
              <strong>월</strong>
            </th>
            <th>
              <strong>화</strong>
            </th>
            <th>
              <strong>수</strong>
            </th>
            <th>
              <strong>목</strong>
            </th>
            <th>
              <strong>금</strong>
            </th>
            <th>
              <strong>일</strong>
            </th>
            <th>
              <strong>마감일</strong>
            </th>
          </tr>
        </thead>
        <tbody>
          {textbookList.map(function (book, index) {
            return (
              <tr key={index}>
                <td>
                  <p m-0>
                    <strong>{book["교재"]}</strong>
                  </p>
                </td>
                <td>
                  <div className="studyPercentageBox">
                    <Form.Control type="text" className="studyMagnitude me-1 ms-1" />
                    <p>
                      <strong>/</strong>
                    </p>
                    <Form.Control type="text" className="studyMagnitude me-1 ms-1" />
                  </div>
                </td>
                <td>
                  <div className="studyPercentageBox">
                    <Form.Control type="text" className="studyMagnitude me-1 ms-1" />
                    <p>
                      <strong>/</strong>
                    </p>
                    <Form.Control type="text" className="studyMagnitude me-1 ms-1" />
                  </div>
                </td>
                <td>
                  <div className="studyPercentageBox">
                    <Form.Control type="text" className="studyMagnitude me-1 ms-1" />
                    <p>
                      <strong>/</strong>
                    </p>
                    <Form.Control type="text" className="studyMagnitude me-1 ms-1" />
                  </div>
                </td>
                <td>
                  <div className="studyPercentageBox">
                    <Form.Control type="text" className="studyMagnitude me-1 ms-1" />
                    <p>
                      <strong>/</strong>
                    </p>
                    <Form.Control type="text" className="studyMagnitude me-1 ms-1" />
                  </div>
                </td>
                <td>
                  <div className="studyPercentageBox">
                    <Form.Control type="text" className="studyMagnitude me-1 ms-1" />
                    <p>
                      <strong>/</strong>
                    </p>
                    <Form.Control type="text" className="studyMagnitude me-1 ms-1" />
                  </div>
                </td>
                <td>
                  <div className="studyPercentageBox">
                    <Form.Control type="text" className="studyMagnitude me-1 ms-1" />
                    <p>
                      <strong>/</strong>
                    </p>
                    <Form.Control type="text" className="studyMagnitude me-1 ms-1" />
                  </div>
                </td>
                <td>
                  <div className="studyPercentageBox">
                    <Form.Control type="text" className="studyMagnitude me-1 ms-1" />
                    <p>
                      <strong>/</strong>
                    </p>
                    <Form.Control type="text" className="studyMagnitude me-1 ms-1" />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}

export default Weeklystudyfeedback;
