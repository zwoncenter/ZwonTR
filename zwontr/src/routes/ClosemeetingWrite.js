import "./Closemeeting.css";
import { Form, Button, Card, ListGroup, Table, Modal, Row, Col } from "react-bootstrap";
import { useHistory, useParams } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import TimePicker from "react-time-picker";
import menuarrow from "../next.png";


// this file is deprecated! not to use! 
// this file is deprecated! not to use!
// this file is deprecated! not to use!


function ClosemeetingWrite() {
  let history = useHistory();
  let paramDate = useParams()["date"];
  let date = new Date(paramDate);

  const days = ["일", "월", "화", "수", "목", "금", "토"];

  const [todayTRlist, settodayTRlist] = useState([]);
  const [closeFeedback, setcloseFeedback] = useState({});
  const [selectedDate, setselectedDate] = useState("");

  // 일일결산 피드백 작성 매니저 관련 코드
  const [managerList, setmanagerList] = useState([]);

  useEffect(async () => {
    const newtodayTRlist = await axios
      .get(`/api/TRlist/${paramDate}`)
      .then((result) => {
        const data=result.data;
        if (result.data === "로그인필요") {
          window.alert("로그인이 필요합니다");
          return history.push("/");
        }
        else if(data.success===true) return data.ret;
        else throw new Error(data.ret);
        // return result.data;
      })
      .catch((err) => {
        return err;
      });

    newtodayTRlist.sort(function (a, b) {
      return +(a.이름 > b.이름) - 0.5;
    });
    settodayTRlist(newtodayTRlist);
  }, [paramDate]);

  useEffect(async ()=>{
    const newmanagerList = await axios
        .get("/api/managerList")
        .then((result) => {
          const data=result.data;
          if(data.success===true) return data.ret;
          else throw new Error(data.ret);
          // return result["data"];
        })
        .catch((err) => {
          return err;
        });
    // console.log("manager list:"+JSON.stringify(managerList));
    setmanagerList(newmanagerList);
  },[]);

  return (
    <div>
      <div className="trEdit-background">
        <h3>
          {paramDate} ({days[date.getDay()]}) 일일 결산
        </h3>

        <Button
          className="btn-commit btn-save"
          onClick={() => {
            if (window.confirm("일일결산 내용을 저장하시겠습니까?")) {
              axios
                .post(`/api/Closemeeting/${paramDate}`, {
                  날짜: paramDate,
                  closeFeedback: closeFeedback,
                })
                .then(function (result) {
                  if (result.data === true) {
                    window.alert("저장되었습니다.");
                    return history.push(`/Closemeeting/Edit/${paramDate}`);
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
          일일결산 저장
        </Button>

        <Button
          variant="secondary"
          className="btn-commit btn-load loadButton"
          onClick={() => {
            if (selectedDate !== "") {
              axios
                .get(`/api/Closemeeting/${selectedDate}`)
                .then((result) => {
                  if (result["data"] === null) {
                    if (window.confirm("해당 날짜의 일일결산이 존재하지 않습니다. 새로 작성하시겠습니까?")) {
                      history.push(`/Closemeeting/Write/${selectedDate}`);
                    }
                  } else {
                    if (window.confirm(`${selectedDate}의 일일결산으로 이동하시겠습니까?`)) {
                      history.push(`/Closemeeting/Edit/${selectedDate}`);
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
              <th width="4%">학습</th>
              <th width="4%">자기계발</th>
              <th width="23%">매니저 피드백</th>
              <th>일일결산 피드백</th>
            </tr>
          </thead>
          <tbody>
            {todayTRlist.map(function (tr, index) {
              return (
                <tr key={index}>
                  <td>
                    <p>{tr["이름"]}</p>
                  </td>
                  {tr["결석여부"] ? (
                    <td colSpan={6}>
                      {" "}
                      <p className="abscent">
                        {" "}
                        {tr["결석여부"] === true ? (
                          <>
                            미등원 - {tr["결석사유"]} : {tr["결석상세내용"]}{" "}
                          </>
                        ) : (
                          <>등원예정</>
                        )}{" "}
                      </p>
                    </td>
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
                        <p>{tr["작성매니저"] ? tr["실제귀가"] : "귀가 전"}</p>
                      </td>
                      <td>
                        <p className={tr["학습차이"] >= 0 ? "green" : "red"}>{tr["실제학습"]}</p>
                      </td>
                      <td>
                        <p>{tr["프로그램시간"]}</p>
                      </td>
                    </>
                  )}

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
                  <td>
                    {/* <Form.Select
                        size="sm"
                        className="feedback-sub"
                        value={TR.중간매니저}
                        onChange={(e) => {
                          change_depth_one("중간매니저", e.target.value);
                        }}
                    >
                      <option value="선택">선택</option>
                      {managerList
                          ? managerList.map((manager, index) => {
                            return (
                                <option value={manager} key={index}>
                                  {manager}
                                </option>
                            );
                          })
                          : null}
                    </Form.Select> */}
                    <textarea
                      className="textArea"
                      rows="3"
                      value={tr["이름"] in closeFeedback ? closeFeedback[tr["이름"]] : ""}
                      onChange={(e) => {
                        const newcloseFeedback = JSON.parse(JSON.stringify(closeFeedback));
                        newcloseFeedback[tr["이름"]] = e.target.value;
                        setcloseFeedback(newcloseFeedback);
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

export default ClosemeetingWrite;
