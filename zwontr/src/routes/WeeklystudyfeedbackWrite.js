import "./Weeklystudyfeedback.css";
import { Form, Button, Card, ListGroup, Table, Modal, Row, Col, Input, OverlayTrigger, Popover } from "react-bootstrap";
import { useHistory, useParams } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect, useRef } from "react";
import axios from "axios";

function WeeklystudyfeedbackWrite() {

  let history = useHistory();
  const param = useParams();
  const now = new Date(); // 현재 시간
  const utcNow = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const koreaTimeDiff = 9 * 60 * 60 * 1000;
  const koreaNow = new Date(utcNow + koreaTimeDiff);
  const [textbookList, settextbookList] = useState([]);
  const [thisweekGoal, setthisweekGoal] = useState({
    월: {},
    화: {},
    수: {},
    목: {},
    금: {},
    일: {},
    마감일: {}
});
  const [thisweek, setthisweek] = useState(getThisWeek());
  const [manufacturedData, setmanufacturedData] = useState([]);
  const isInitialMount = useRef(true);
  const [entireData, setentireData] = useState([]);

  function getThisWeek() {
    var inputDate = new Date();
    inputDate.setHours(0, 0, 0, 0);
    var day = inputDate.getDay();
    var diff = inputDate.getDate() - day + (day == 0 ? -6 : 1);
    inputDate = new Date(inputDate.setDate(diff));
    var startdate = new Date(inputDate.setDate(inputDate.getDate()));
    var enddate = new Date(inputDate.setDate(inputDate.getDate() + 7));
    return [startdate, enddate];
  }

  function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + (d.getDate()-1),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}

  useEffect(async () => {
    const existstuInfo = await axios
      .get(`/api/StudentDB/${param["ID"]}`)
      .then((result) => {
        if (result.data === "로그인필요") {
          window.alert("로그인이 필요합니다.");
          return history.push("/");
        }
        return result["data"]["진행중교재"];
      })
      .catch((err) => {
        return err;
      });
    settextbookList(existstuInfo);

    const studentTRlist = await axios
      .get(`/api/TR/${param["ID"]}`)
      .then(async function (result) {
        await result.data.sort(function (a, b) {
          return +(new Date(a.날짜) > new Date(b.날짜)) - 0.5;
        });
        // console.log(result.data);
        return result.data;
      })
      .catch(function (err) {
        console.log("/api/TR/:name fail : ", err);
      });
    setentireData(studentTRlist);

    isInitialMount.current = false;
  }, []);

  useEffect(async () => {
    const temporal = entireData
      .filter((tr) => {
        return new Date(tr.날짜) >= thisweek[0] && new Date(tr.날짜) < thisweek[1];
      })
      .map((tr, index) => {
        const study = tr["학습"].map((study_element, i) => {
          const newstudy_element = JSON.parse(JSON.stringify(study_element));
          newstudy_element["요일"] = tr["요일"];
          return newstudy_element;
        });
        return study;
      });
    var newmanufacturedData = [].concat.apply([], temporal);
    setmanufacturedData(newmanufacturedData);

    const newthisweekGoal = JSON.parse(
        JSON.stringify(thisweekGoal)
      );
      textbookList.map((book,i)=>{
        newthisweekGoal["마감일"][book["교재"]] = formatDate(thisweek[1]);
      })
      setthisweekGoal(newthisweekGoal);
  }, [entireData]);

  return (
    <div className="Weeklystudyfeedback-background">
      <h2>
        <strong>주간학습피드백</strong>
      </h2>
      <Button
        className="btn-commit btn-save"
        onClick={() => {
          console.log(thisweekGoal);
          if (window.confirm("주간결산 내용을 저장하시겠습니까?")) {
            axios
              .post(`/api/Weeklystudyfeedback/${param["ID"]}/${param["feedbackDate"]}`, {
                학생ID: param["ID"],
                피드백일: param["feedbackDate"],
                thisweekGoal: thisweekGoal,
              })
              .then(function (result) {
                if (result.data === true) {
                  window.alert("저장되었습니다.");
                  history.push(`/WeeklystudyfeedbackEdit/${param["ID"]}/${param["feedbackDate"]}`);
                } else if (result.data === "로그인필요") {
                  window.alert("로그인이 필요합니다.");
                  return history.push("/");
                } else {
                  console.log(result.data);
                  window.alert(result.data);
                }
              })
              .catch(function (err) {
                console.log("저장 실패 : ", err);
                window.alert(err);
              });
          }
        }}
      >
        <strong>주간학습피드백 저장</strong>
      </Button>
      {isInitialMount.current === false ? (
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
                    <p m-0="true">
                      <strong>
                        {book["교재"]} {book["총교재량"] ? `(총 ${book["총교재량"]})` : null}
                      </strong>
                    </p>
                  </td>
                  <td>
                    <div className="studyPercentageBox">
                      <p>
                        <strong>
                          {manufacturedData
                            .filter((study_element, i) => {
                              return study_element["요일"] === "월요일" && study_element["교재"] == book["교재"];
                            })
                            .map((study_element, i) => {
                              return study_element["최근진도"];
                            })}
                        </strong>
                      </p>
                      <p>
                        <strong>/</strong>
                      </p>
                      <Form.Control type="text" className="studyMagnitude me-1 ms-1"
                      value={
                        thisweekGoal["월"]
                          ? thisweekGoal["월"][book["교재"]]
                          : ""
                      }
                      onChange={(e) => {
                        const newthisweekGoal = JSON.parse(
                          JSON.stringify(thisweekGoal)
                        );
                        newthisweekGoal["월"][book["교재"]] =
                        e.target.value;
                        setthisweekGoal(newthisweekGoal);
                      }}
                       />
                    </div>
                  </td>
                  <td>
                    <div className="studyPercentageBox">
                      <p>
                        <strong>
                          {manufacturedData
                            .filter((study_element, i) => {
                              return study_element["요일"] === "화요일" && study_element["교재"] == book["교재"];
                            })
                            .map((study_element, i) => {
                              return study_element["최근진도"];
                            })}
                        </strong>
                      </p>
                      <p>
                        <strong>/</strong>
                      </p>
                      <Form.Control type="text" className="studyMagnitude me-1 ms-1"
                      value={
                        thisweekGoal["화"]
                          ? thisweekGoal["화"][book["교재"]]
                          : ""
                      }
                      onChange={(e) => {
                        const newthisweekGoal = JSON.parse(
                          JSON.stringify(thisweekGoal)
                        );
                        newthisweekGoal["화"][book["교재"]] =
                        e.target.value;
                        setthisweekGoal(newthisweekGoal);
                      }} />
                    </div>
                  </td>
                  <td>
                    <div className="studyPercentageBox">
                      <p>
                        <strong>
                          {manufacturedData
                            .filter((study_element, i) => {
                              return study_element["요일"] === "수요일" && study_element["교재"] == book["교재"];
                            })
                            .map((study_element, i) => {
                              return study_element["최근진도"];
                            })}
                        </strong>
                      </p>
                      <p>
                        <strong>/</strong>
                      </p>
                      <Form.Control type="text" className="studyMagnitude me-1 ms-1"
                      value={
                        thisweekGoal["수"]
                          ? thisweekGoal["수"][book["교재"]]
                          : ""
                      }
                      onChange={(e) => {
                        const newthisweekGoal = JSON.parse(
                          JSON.stringify(thisweekGoal)
                        );
                        newthisweekGoal["수"][book["교재"]] =
                        e.target.value;
                        setthisweekGoal(newthisweekGoal);
                      }} />
                    </div>
                  </td>
                  <td>
                    <div className="studyPercentageBox">
                      <p>
                        <strong>
                          {manufacturedData
                            .filter((study_element, i) => {
                              return study_element["요일"] === "목요일" && study_element["교재"] == book["교재"];
                            })
                            .map((study_element, i) => {
                              return study_element["최근진도"];
                            })}
                        </strong>
                      </p>
                      <p>
                        <strong>/</strong>
                      </p>
                      <Form.Control type="text" className="studyMagnitude me-1 ms-1"
                      value={
                        thisweekGoal["목"]
                          ? thisweekGoal["목"][book["교재"]]
                          : ""
                      }
                      onChange={(e) => {
                        const newthisweekGoal = JSON.parse(
                          JSON.stringify(thisweekGoal)
                        );
                        newthisweekGoal["목"][book["교재"]] =
                        e.target.value;
                        setthisweekGoal(newthisweekGoal);
                      }} />
                    </div>
                  </td>
                  <td>
                    <div className="studyPercentageBox">
                      <p>
                        <strong>
                          {manufacturedData
                            .filter((study_element, i) => {
                              return study_element["요일"] === "금요일" && study_element["교재"] == book["교재"];
                            })
                            .map((study_element, i) => {
                              return study_element["최근진도"];
                            })}
                        </strong>
                      </p>
                      <p>
                        <strong>/</strong>
                      </p>
                      <Form.Control type="text" className="studyMagnitude me-1 ms-1"
                      value={
                        thisweekGoal["금"]
                          ? thisweekGoal["금"][book["교재"]]
                          : ""
                      }
                      onChange={(e) => {
                        const newthisweekGoal = JSON.parse(
                          JSON.stringify(thisweekGoal)
                        );
                        newthisweekGoal["금"][book["교재"]] =
                        e.target.value;
                        setthisweekGoal(newthisweekGoal);
                      }} />
                    </div>
                  </td>
                  <td>
                    <div className="studyPercentageBox">
                      <p>
                        <strong>
                          {manufacturedData
                            .filter((study_element, i) => {
                              return study_element["요일"] === "일요일" && study_element["교재"] == book["교재"];
                            })
                            .map((study_element, i) => {
                              return study_element["최근진도"];
                            })}
                        </strong>
                      </p>
                      <p>
                        <strong>/</strong>
                      </p>
                      <Form.Control type="text" className="studyMagnitude me-1 ms-1"
                      value={
                        thisweekGoal["일"]
                          ? thisweekGoal["일"][book["교재"]]
                          : ""
                      }
                      onChange={(e) => {
                        const newthisweekGoal = JSON.parse(
                          JSON.stringify(thisweekGoal)
                        );
                        newthisweekGoal["일"][book["교재"]] =
                        e.target.value;
                        setthisweekGoal(newthisweekGoal);
                      }} />
                    </div>
                  </td>
                  <td>
                    <div className="studyPercentageBox">
                      <input
                        type="date"
                        className="w-100"
                        value={thisweekGoal["마감일"][book["교재"]]}
                        onChange={(e) => {
                          const newthisweekGoal = JSON.parse(
                            JSON.stringify(thisweekGoal)
                          );
                          newthisweekGoal["마감일"][book["교재"]] =
                          e.target.value;
                          setthisweekGoal(newthisweekGoal);
                        }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      ) : null}
    </div>
  );
}

export default WeeklystudyfeedbackWrite;
