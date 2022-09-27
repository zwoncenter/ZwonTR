import "./Weeklystudyfeedback.css";
import { Form, Button, Card, ListGroup, Table, Modal, Row, Col, Input, OverlayTrigger, Popover } from "react-bootstrap";
import { useHistory, useParams } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect, useRef } from "react";
import axios from "axios";

function WeeklystudyfeedbackEdit() {

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
  const [thisweek, setthisweek] = useState(getThisWeek(param["feedbackDate"]));
  const [manufacturedData, setmanufacturedData] = useState([]);
  const isInitialMount = useRef(true);
  const [entireData, setentireData] = useState([]);
  const [selectedDate, setselectedDate] = useState("");


  function getThisWeek(inputDate) {
    var inputDate = new Date(inputDate);
    inputDate.setHours(0, 0, 0, 0);
    var day = inputDate.getDay();
    var diff = inputDate.getDate() - day + (day == 0 ? -6 : 1);
    inputDate = new Date(inputDate.setDate(diff));
    var startdate = new Date(inputDate.setDate(inputDate.getDate()));
    var enddate = new Date(inputDate.setDate(inputDate.getDate() + 7));
    return [startdate, enddate];
  }

  function getPageName() {
    var mm = (thisweek[0].getMonth() + 1).toString();
    var dd = thisweek[0].getDate().toString();
    if (dd < 10) {
      dd = "0" + dd;
    }
    if (mm < 10) {
      mm = "0" + mm;
    }
    const starting = thisweek[0].getFullYear().toString() + "-" + mm + "-" + dd;
    const ending = thisweek[1].toISOString().split("T")[0];
    return [starting, ending];
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
  if (isInitialMount.current === false) {
    setthisweek(getThisWeek(param["feedbackDate"]));
  }
}, [param]);

  useEffect(async () => {
    const existstuInfo = await axios
      .get(`/api/StudentDB/${param["ID"]}`)
      .then((result) => {
        if (result.data === "로그인필요") {
          window.alert("로그인이 필요합니다.");
          return history.push("/");
        }
        console.log(result.data);
        return result["data"]["진행중교재"];
      })
      .catch((err) => {
        return err;
      });
    settextbookList(existstuInfo);

    const existGoal = await axios
    .get(`/api/Weeklystudyfeedback/${param["ID"]}/${param["feedbackDate"]}`)
    .then((result) => {
      if (result["data"] !== null) {
        console.log(result.data);
        return result["data"]["thisweekGoal"];
      }
    })
    .catch((err) => {
      console.log(err);
    });
    setthisweekGoal(existGoal);

    const studentTRlist = await axios
      .get(`/api/TR/${param["ID"]}`)
      .then(async function (result) {
        await result.data.sort(function (a, b) {
          return +(new Date(a.날짜) > new Date(b.날짜)) - 0.5;
        });
        return result.data;
      })
      .catch(function (err) {
        console.log("/api/TR/:name fail : ", err);
      });
    setentireData(studentTRlist);
    // console.log(thisweekGoal);

    isInitialMount.current = false;
  }, [thisweek]);

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
  }, [entireData]);

  const weekDays=['월','화','수','목','금','일'];

  return (
    <div className="Weeklystudyfeedback-background">
      <h2>
      <strong>{getPageName()[0]} ~ {getPageName()[1]}</strong>
      </h2>
      <h2>
        <strong>{param["ID"].split("_")[0]} 주간학습목표 스케줄링</strong>
      </h2>
      <Button
        className="btn-commit btn-save"
        onClick={() => {
          console.log(thisweekGoal);
          if (window.confirm("주간학습목표 스케줄링 내용을 수정하시겠습니까?")) {
            axios
              .put(`/api/Weeklystudyfeedback/${param["ID"]}/${param["feedbackDate"]}`, {
                학생ID: param["ID"],
                피드백일: param["feedbackDate"],
                thisweekGoal: thisweekGoal,
              })
              .then(function (result) {
                if (result.data === true) {
                  window.alert("수정되었습니다.");
                  history.push(`/Weeklystudyfeedback/${param["ID"]}/${param["feedbackDate"]}`);
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
        <strong>주간학습목표 저장</strong>
      </Button>
      <Button
        variant="secondary"
        className="btn-commit btn-load loadButton"
        onClick={() => {
          if (selectedDate !== "") {
            axios
              .get(`/api/Weeklystudyfeedback/${param["ID"]}/${formatDate(getThisWeek(selectedDate)[1])}`)
              .then((result) => {
                if (result["data"] === null) {
                  if (
                    window.confirm(
                      "해당 날짜의 주간학습목표 스케줄이 존재하지 않습니다. 새로 작성하시겠습니까?"
                    )
                  ) {
                    history.push(
                      `/WeeklystudyfeedbackWrite/${param["ID"]}/${formatDate(getThisWeek(selectedDate)[1])}`
                    );
                  }
                } else {
                  if (
                    window.confirm(
                      `${selectedDate}의 주간학습목표 스케줄로 이동하시겠습니까?`
                    )
                  ) {
                    history.push(
                      `/WeeklystudyfeedbackEdit/${param["ID"]}/${formatDate(getThisWeek(selectedDate)[1])}`
                    );
                  }
                }
              })
              .catch((err) => {
                console.log(err);
              });
          }
        }}
      >
        <div className="row m-0">
          <div className="col-xl-7">
            <strong>다른 주차 작성/조회</strong>
          </div>
          <div className="col-xl-5">
            <input
              type="date"
              className="w-100"
              value={selectedDate}
              onClick={(e) => {
                e.stopPropagation();
              }}
              onChange={(e) => {
                e.stopPropagation();
                setselectedDate(e.target.value);
              }}
            />
          </div>
        </div>
      </Button>
      {isInitialMount.current === false ? (
        <div className="Weeklystudyfeedback-container">
        <Table striped hover size="sm" className="Weeklystudyfeedback-table">
          <thead>
            <tr>
              <th width="25%">
                <strong>교재명</strong>
              </th>
              <>
                {
                  weekDays.map((day,index)=>{
                    return (
                      <th key={index}>
                        <strong>{day}</strong>
                      </th>
                    )
                  })
                }
              </>
            </tr>
          </thead>
          <tbody>
            {
              thisweekGoal?
              thisweekGoal["교재캡쳐"].map((book,bookIndex)=>{
                return(
                  <tr key={bookIndex}>
                    <td>
                      <p m-0="true">
                        <strong>
                          {book["교재"]} {book["총교재량"] ? `(총 ${book["총교재량"]})` : null}
                        </strong>
                      </p>
                    </td>
                    <>
                      {
                        weekDays.map((day,dayIndex)=>{
                          return (
                            <td key={dayIndex}>
                              <div className="studyPercentageBox">
                                <p>
                                  <strong>
                                    {manufacturedData
                                      .filter((study_element, i) => {
                                        return study_element["요일"] === (day+"요일") && study_element["교재"] == book["교재"];
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
                                  thisweekGoal
                                    ? thisweekGoal[day][book["교재"]]
                                    : ""
                                }
                                onChange={(e) => {
                                  const newthisweekGoal = JSON.parse(
                                    JSON.stringify(thisweekGoal)
                                  );
                                  newthisweekGoal[day][book["교재"]] =
                                  e.target.value;
                                  setthisweekGoal(newthisweekGoal);
                                }}
                                />
                              </div>
                            </td>
                          );
                        })
                      }
                      <td>
                        <div className="studyPercentageBox">
                          <input
                            type="date"
                            className="w-100"
                            value={thisweekGoal? 
                              thisweekGoal["마감일"][book["교재"]]
                            : ""}
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
                    </>
                  </tr>
                );
              }) : null
            }
          </tbody>
        </Table>
        </div>
      ) : null}
    </div>
  );
}

export default WeeklystudyfeedbackEdit;
