import "./Middlemeeting.css";
import { Form, Button, Card, ListGroup, Table, Modal, Row, Col } from "react-bootstrap";
import { useHistory, useParams } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import TimePicker from "react-time-picker";
import menuarrow from "../next.png";

function MiddlemeetingWrite() {
  let history = useHistory();
  let paramDate = useParams()["date"];
  
  const [todayTRlist, settodayTRlist] = useState([]);
  const [closeFeedback, setcloseFeedback] = useState({});
  const [middleFeedback, setmiddleFeedback] = useState({});
  const [selectedDate, setselectedDate] = useState("");
  const [objectid, setobjectid] = useState("");

  useEffect(async () => {
    const newtodayTRlist = await axios
      .get(`/api/TRlist/${paramDate}`)
      .then((result) => {
        if (result.data === "로그인필요") {
          window.alert("로그인이 필요합니다");
          return history.push("/");
        }
        return result.data;
      })
      .catch((err) => {
        return err;
      });

    newtodayTRlist.sort(function (a, b) {
      return +(a.이름 > b.이름) - 0.5;
    });
    settodayTRlist(newtodayTRlist);

    const paramToday = new Date(parseInt(paramDate.split("-")[0]), parseInt(paramDate.split("-")[1])-1, parseInt(paramDate.split("-")[2]));
    const koreaTimeDiff = 9 * 60 * 60 * 1000;

    let paramYesterday = new Date(paramToday.getTime() - 86400000 + koreaTimeDiff)
    if (paramYesterday.getDay() === 6) {
        paramYesterday = new Date(paramToday.getTime() - (86400000 * 2) + koreaTimeDiff);
    }
    const yesterday = paramYesterday.toISOString().split("T")[0];
    const newcloseFeedback = await axios
    .get(`/api/Closemeeting/find/${yesterday}`)
    .then((result) => {
      if (result.data === "로그인필요") {
        window.alert("로그인이 필요합니다");
        return history.push("/");
      }
      return result.data;
    })
    .catch((err) => {
      return err;
    });

    setcloseFeedback(newcloseFeedback["closeFeedback"]);
    const document = await axios
      .get(`/api/Middlemeeting/find/${paramDate}`)
      .then((result) => {
        if (result.data === "로그인필요") {
          window.alert("로그인이 필요합니다");
          return history.push("/");
        }
        return result.data;
      })
      .catch((err) => {
        return err;
      });
    setobjectid(document["_id"]);
    setmiddleFeedback(document["middleFeedback"]);
  }, [paramDate]);

  return (
    <div>
      <div className="trEdit-background">
        <h3>{paramDate} 중간 회의</h3>
        <Button
          className="btn-commit btn-save"
          onClick={() => {
            if (window.confirm("중간회의 내용을 저장하시겠습니까?")) {
              axios
                .put(`/api/Middlemeeting/edit/${paramDate}`, {
                  _id: objectid,
                  날짜: paramDate,
                  middleFeedback: middleFeedback,
                })
                .then(function (result) {
                  if (result.data === true) {
                    window.alert("저장되었습니다.");
                    return window.location.reload();
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
          중간회의 저장
        </Button>

        <Button
          variant="secondary"
          className="btn-commit btn-load loadButton"
          onClick={() => {
            if (selectedDate !== "") {
              axios
                .get(`/api/Middlemeeting/find/${selectedDate}`)
                .then((result) => {
                  if (result["data"] === null) {
                    if (window.confirm("해당 날짜의 중간회의가 존재하지 않습니다. 새로 작성하시겠습니까?")) {
                      history.push(`/Middlemeeting/Write/${selectedDate}`);
                    }
                  } else {
                    if (window.confirm(`${selectedDate}의 중간회의로 이동하시겠습니까?`)) {
                      history.push(`/Middlemeeting/Edit/${selectedDate}`);
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
              <strong>다른 일자 작성/조회</strong>
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

        <Table striped hover size="sm" className="mt-3">
          <thead>
            <tr>
              <th width="4%">이름</th>
              <th width="4%">취침</th>
              <th width="4%">기상</th>
              <th width="4%">등원</th>
              <th width="4%">귀가</th>
              <th width="15%">전날 피드백</th>
              <th width="15%">금일 피드백</th>
              <th width="23%">회의 내용</th>
            </tr>
          </thead>
          <tbody>
            {todayTRlist.map(function (tr, index) {
              return (
                <tr key={index}>
                  <td>
                    <p>{tr["이름"]}</p>
                  </td>
                  {tr["결석여부"] !== false? (
                    <>
                      <td colSpan={4}>
                        {" "}
                        <p className="abscent">
                        {tr["결석여부"] === true ? <>미등원 - {tr["결석사유"]} : {tr["결석상세내용"]} </> :  <>등원예정</> }   
                        </p>
                      </td>
                      <td>
                        <p>{closeFeedback[tr["이름"]]}</p>
                      </td>
                      <td>
                          {tr["중간피드백"] ? (
                            <>
                              <p>
                                (중간) {tr["중간매니저"]} : {tr["중간피드백"]}
                              </p>
                              <br />
                            </>
                          ) : null}
                          {tr["매니저피드백"] ? (
                            <>
                              <p>
                                {tr["작성매니저"]} : {tr["매니저피드백"]}
                              </p>
                            </>
                          ) : null}
                      </td>
                    </>
                  ) : (
                    <>
                      <td>
                        <p className={tr["취침차이"] >= 0 ? "green" : "red"}>{tr["실제취침"]}</p>
                      </td>
                      <td>
                        <p className={tr["기상차이"] >= 0 ? "green" : "red"}>{tr["실제기상"]}</p>
                      </td>
                      <td>
                        <p className={tr["등원차이"] >= -0.17 ? "green" : tr["등원차이"] >= -1 ? "yellow" : "red"}>{tr["실제등원"]}</p>
                        <p className="targetattend">{tr["목표등원"]}</p>
                      </td>
                      <td>
                        <p>{tr["매니저피드백"] ? tr["실제귀가"] : "귀가 전"}</p>
                      </td>
                      <td>
                        <p>{closeFeedback[tr["이름"]]}</p>
                      </td>
                      <td>
                          {tr["중간피드백"] ? (
                            <>
                              <p>
                                (중간) {tr["중간매니저"]} : {tr["중간피드백"]}
                              </p>
                              <br />
                            </>
                          ) : null}
                          {tr["매니저피드백"] ? (
                            <>
                              <p>
                                (귀가) {tr["작성매니저"]} : {tr["매니저피드백"]}
                              </p>
                            </>
                          ) : null}
                      </td>

                    </>
                  )}
                  <td>
                    <textarea
                      className="textArea"
                      rows="3"
                      value={middleFeedback[tr["이름"]]}
                      onChange={(e) => {
                        const newmiddleFeedback = JSON.parse(JSON.stringify(middleFeedback));
                        newmiddleFeedback[tr["이름"]] = e.target.value;
                        setmiddleFeedback(newmiddleFeedback);
                      }}
                    ></textarea>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    </div>
  );
}

export default MiddlemeetingWrite;
