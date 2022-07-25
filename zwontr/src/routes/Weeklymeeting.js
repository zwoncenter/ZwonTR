import "./Weeklymeeting.css";
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
} from "react-bootstrap";
import {
  useHistory,
  useParams,
} from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect, useRef } from "react";
import axios from "axios";

function Weeklymeeting() {
  let history = useHistory();
  const isInitialMount = useRef(true);
  const [stuDBList, setstuDBList] = useState([]);
  const [TRlist, setTRlist] = useState([]);
  const [thisweek, setthisweek] = useState(getThisWeek());
  const [lastweek, setlastweek] = useState(getLastWeek());
  const [lastmonth, setlastmonth] = useState(getLastMonth());
  const [manufacturedData, setmanufacturedData] = useState([]);
  const [managerList, setmanagerList] = useState([]);
  const [dengyo, setdengyo] = useState({});
  var classList = ["고1", "고2", "고3", "중1", "중2", "중3", "OT"];

  useEffect(async () => {
    const newstudentDBlist = await axios
      .get("/api/studentList")
      .then((result) => {
        return result.data;
      })
      .catch((err) => {
        return err;
      });

    if (newstudentDBlist && newstudentDBlist == "로그인필요") {
      window.alert("로그인이 필요합니다.");
      return history.push("/");
    }
    newstudentDBlist.sort(function (a, b) {
      if (classList.indexOf(a.분류)>classList.indexOf(b.분류)) return 1;
      if (classList.indexOf(a.분류)<classList.indexOf(b.분류)) return -1;
      if (a.이름>b.이름) return 1;
      if (a.이름<b.이름) return -1;});
    setstuDBList(newstudentDBlist);
    isInitialMount.current = false;

    const newmanagerList = await axios
      .get("/api/managerList")
      .then((result) => {
        return result["data"];
      })
      .catch((err) => {
        return err;
      });
    setmanagerList(newmanagerList);
  }, []);

  useEffect(async () => {
    if (isInitialMount.current === false) {
      

      const foundTRlist = await axios
      .get(`/api/TRnow`)
      .then((result) => {
        if (result.data === "로그인필요") {
          window.alert("로그인이 필요합니다.");
          return history.push("/");
        }
        return result.data;
      })
      .catch(function (err) {
        console.log("/api/TR/:ID fail : ", err);
      });
      var newdata = foundTRlist.filter((data) => {
          return (
            new Date(data.날짜) >= lastmonth[0] &&
            new Date(data.날짜) <= thisweek[1]
          );
        });
      console.log(newdata.length);
      setTRlist(newdata);
    }
  }, [stuDBList]);

  useEffect(async () => {
    if (isInitialMount.current === false) {
      const temporal = stuDBList.map((element, i) => {
        return {
          분류: element["분류"],
          이름: element["이름"],
          등교: false,
          지각: TRlist.filter((i) => {
            return (
              i["이름"] == element["이름"] &&
              i["목표등원"] != null &&
              i["목표등원"] < i["실제등원"] &&
              i["결석여부"] != true &&
              new Date(i.날짜) >= thisweek[0] &&
              new Date(i.날짜) < thisweek[1]
            );
          }).length,
          미등원: TRlist.filter((i) => {
            return (
              i["이름"] == element["이름"] &&
              i["결석여부"] === true &&
              new Date(i.날짜) >= thisweek[0] &&
              new Date(i.날짜) < thisweek[1]
            );
          }).length,
          이번주평균학습:
            Math.round(
              (TRlist.filter((i) => {
                return (
                  i["이름"] == element["이름"] &&
                  new Date(i.날짜) >= thisweek[0] &&
                  new Date(i.날짜) < thisweek[1] &&
                  i["결석여부"] != true &&
                  i["요일"]!= "일요일"
                );
              })
                .map((j) => {
                  return j["실제학습"];
                })
                .reduce((a, b) => {
                  return a + b;
                }, 0) /
                TRlist.filter((i) => {
                  return (
                    i["이름"] == element["이름"] &&
                    new Date(i.날짜) >= thisweek[0] &&
                    new Date(i.날짜) < thisweek[1] &&
                    i["결석여부"] != true &&
                    i["요일"]!= "일요일"
                  );
                }).length) *
                10
            ) / 10,
          전주평균학습:
            Math.round(
              (TRlist.filter((i) => {
                return (
                  i["이름"] == element["이름"] &&
                  new Date(i.날짜) >= lastweek[0] &&
                  new Date(i.날짜) < lastweek[1]
                );
              })
                .map((j) => {
                  return j["실제학습"];
                })
                .reduce((a, b) => {
                  return a + b;
                }, 0) /
                TRlist.filter((i) => {
                  return (
                    i["이름"] == element["이름"] &&
                    new Date(i.날짜) >= lastweek[0] &&
                    new Date(i.날짜) < lastweek[1]
                  );
                }).length) *
                10
            ) / 10,
          전월평균학습: Math.round(
            (TRlist.filter((i) => {
              return (
                i["이름"] == element["이름"] &&
                new Date(i.날짜) >= lastmonth[0] &&
                new Date(i.날짜) < lastmonth[1]
              );
            })
              .map((j) => {
                return j["실제학습"];
              })
              .reduce((a, b) => {
                return a + b;
              }, 0) /
              TRlist.filter((i) => {
                return (
                  i["이름"] == element["이름"] &&
                  new Date(i.날짜) >= lastmonth[0] &&
                  new Date(i.날짜) < lastmonth[1]
                );
              }).length) *
              10
          ) / 10,
          전주문제사항: "",
          전주조치결과: "",
          이번주문제사항: "",
          이번주조치계획: "",
          조치내용: "",
          담당자: "",
          약속: "",
          약속매니저: ""
        };
      });
      setmanufacturedData(temporal);
    }
  }, [TRlist]);

  function getThisWeek() {
    var paramDate = new Date();
    paramDate.setHours(0, 0, 0, 0);
    var day = paramDate.getDay();
    var diff = paramDate.getDate() - day + (day == 0 ? -6 : 1);
    paramDate = new Date(paramDate.setDate(diff));
    var enddate = new Date(paramDate.setDate(paramDate.getDate()));
    var startdate = new Date(paramDate.setDate(paramDate.getDate() - 7));
    return [startdate, enddate];
  }

  function getLastWeek() {
    const thisweek = getThisWeek();
    thisweek[0].setDate(thisweek[0].getDate() - 7);
    thisweek[1].setDate(thisweek[1].getDate() - 7);
    return thisweek;
  }

  function getLastMonth() {
    var paramDate = new Date();
    paramDate.setHours(0, 0, 0, 0);
    paramDate.setDate(1);
    var enddate = new Date(paramDate);
    var startdate = new Date(paramDate.setMonth(paramDate.getMonth()-1));
    return [startdate, enddate];
  }

  return (
    <div className="Weeklymeeting-background">
      <h2>
        <strong>{thisweek[0].toISOString().split("T")[0]} ~ {thisweek[1].toISOString().split("T")[0]}</strong>
      </h2>
      <h2><strong>주간회의</strong></h2>
      {/* <Button
        onClick={() => {
          console.log(TRlist.length);
        }}
      >
        확인
      </Button> */}
      <div className="Weeklymeeting-container">
        <Table striped bordered hover size="sm" className="Weeklymeeting-table">
          <thead>
            <tr>
              <th colSpan={3} width="4%">
                <strong>정보</strong>
              </th>
              <th rowSpan={2} width="1.5%">
                <strong>지각</strong>
              </th>
              <th rowSpan={2} width="1.5%">
                <strong>미등원</strong>
              </th>
              <th colSpan={3} width="6%">
                <strong>평균 학습시간</strong>
              </th>
              <th colSpan={2} width="15%">
                <strong>전 주 조치 보고</strong>
              </th>
              <th colSpan={3} width="20%">
                <strong>이번 주 조치</strong>
              </th>
              <th rowSpan={2} width="2%">
                <strong>담당자</strong>
              </th>
              <th rowSpan={2} width="3%">
                <strong>약속/구조</strong>
              </th>
              <th rowSpan={2} width="2%">
                <strong>구조매니저</strong>
              </th>
            </tr>
            <tr>
              <th>
                <strong>학년</strong>
              </th>
              <th>
                <strong>이름</strong>
              </th>
              <th>
                <strong>등교</strong>
              </th>
              <th>
                <strong>이번 주</strong>
              </th>
              <th>
                <strong>전 주</strong>
              </th>
              <th>
                <strong>전 월</strong>
              </th>
              <th>
                <strong>문제사항</strong>
              </th>
              <th>
                <strong>조치결과</strong>
              </th>
              <th>
                <strong>문제사항</strong>
              </th>
              <th>
                <strong>조치계획</strong>
              </th>
              <th>
                <strong>조치내용</strong>
              </th>
            </tr>
          </thead>
          <tbody>
            {manufacturedData.map(function (tr, index) {
              return (
                <tr key={index}>
                  <td>
                    <p>
                      <strong>{tr["분류"]}</strong>
                    </p>
                  </td>
                  <td>
                    <p>
                      <strong>{tr["이름"]}</strong>
                    </p>
                  </td>
                  <td>
                  <Form.Check
                className="mb-2"
                type="checkbox"
                checked={tr['등교']}
                onChange={() => {
                  const newmanufacturedData = [...manufacturedData];
                  newmanufacturedData[index]["등교"] = !newmanufacturedData[index]["등교"];
                  setmanufacturedData(newmanufacturedData);
                }}
              />
                  </td>
                  <td>
                    <p
                      className={
                        tr["지각"] >= 3
                          ? "red"
                          : tr["지각"] == 0
                          ? "green"
                          : "yellow"
                      }
                    >
                      <strong>{tr["지각"]}일</strong>
                    </p>
                  </td>
                  <td>
                  <p>
                      <strong>{tr["미등원"]}일</strong>
                    </p>
                  </td>
                  <td>
                    <p
                      className={
                        ["고1", "고2", "고3"].includes(tr["분류"]) === true &&
                        tr["이번주평균학습"] >= 6
                          ? "green"
                          : ["중1", "중2", "중3"].includes(tr["분류"]) ===
                              true && tr["이번주평균학습"] >= 4
                          ? "green"
                          : ["고1", "고2", "고3"].includes(tr["분류"]) ===
                              true &&
                            tr["이번주평균학습"] < 6 &&
                            tr["이번주평균학습"] >= 5
                          ? "yellow"
                          : ["중1", "중2", "중3"].includes(tr["분류"]) ===
                              true &&
                            tr["이번주평균학습"] < 4 &&
                            tr["이번주평균학습"] >= 3
                          ? "yellow"
                          : ["고1", "고2", "고3"].includes(tr["분류"]) ===
                              true && tr["이번주평균학습"] < 5
                          ? "red"
                          : ["중1", "중2", "중3"].includes(tr["분류"]) ===
                              true && tr["이번주평균학습"] < 3
                          ? "red"
                          : "black"
                      }
                    >
                      <strong>{tr["이번주평균학습"]}시간</strong>
                    </p>
                  </td>
                  <td>
                    <p
                      className={
                        ["고1", "고2", "고3"].includes(tr["분류"]) === true &&
                        tr["전주평균학습"] >= 6
                          ? "green"
                          : ["중1", "중2", "중3"].includes(tr["분류"]) ===
                              true && tr["전주평균학습"] >= 4
                          ? "green"
                          : ["고1", "고2", "고3"].includes(tr["분류"]) ===
                              true &&
                            tr["전주평균학습"] < 6 &&
                            tr["전주평균학습"] >= 5
                          ? "yellow"
                          : ["중1", "중2", "중3"].includes(tr["분류"]) ===
                              true &&
                            tr["전주평균학습"] < 4 &&
                            tr["전주평균학습"] >= 3
                          ? "yellow"
                          : ["고1", "고2", "고3"].includes(tr["분류"]) ===
                              true && tr["전주평균학습"] < 5
                          ? "red"
                          : ["중1", "중2", "중3"].includes(tr["분류"]) ===
                              true && tr["전주평균학습"] < 3
                          ? "red"
                          : "black"
                      }
                    >
                      <strong>{tr["전주평균학습"]}시간</strong>
                    </p>
                  </td>
                  <td>
                    <p className={
                        ["고1", "고2", "고3"].includes(tr["분류"]) === true &&
                        tr["전월평균학습"] >= 6
                          ? "green"
                          : ["중1", "중2", "중3"].includes(tr["분류"]) ===
                              true && tr["전월평균학습"] >= 4
                          ? "green"
                          : ["고1", "고2", "고3"].includes(tr["분류"]) ===
                              true &&
                            tr["전월평균학습"] < 6 &&
                            tr["전월평균학습"] >= 5
                          ? "yellow"
                          : ["중1", "중2", "중3"].includes(tr["분류"]) ===
                              true &&
                            tr["전월평균학습"] < 4 &&
                            tr["전월평균학습"] >= 3
                          ? "yellow"
                          : ["고1", "고2", "고3"].includes(tr["분류"]) ===
                              true && tr["전월평균학습"] < 5
                          ? "red"
                          : ["중1", "중2", "중3"].includes(tr["분류"]) ===
                              true && tr["전월평균학습"] < 3
                          ? "red"
                          : "black"
                      }
                      >{tr["전월평균학습"]}시간</p>
                  </td>
                  <td>
                    <p>{tr["전주문제사항"]}</p>
                  </td>
                  <td>
                    <p>{tr["전주조치결과"]}</p>
                  </td>
                  <td>
                    <textarea
                      className="textArea"
                      value={tr["이번주문제사항"]}
                      onChange={(e) => {
                        const newmanufacturedData = [...manufacturedData];
                        newmanufacturedData[index]["이번주문제사항"] = e.target.value;
                        setmanufacturedData(newmanufacturedData);
                      }}
                    ></textarea>
                  </td>
                  <td>
                    <textarea
                      className="textArea"
                      value={tr["이번주조치계획"]}
                      onChange={(e) => {
                        const newmanufacturedData = [...manufacturedData];
                        newmanufacturedData[index]["이번주조치계획"] = e.target.value;
                        setmanufacturedData(newmanufacturedData);
                      }}
                    ></textarea>
                  </td>
                  <td>
                    <textarea
                      className="textArea"
                      value={tr["조치내용"]}
                      onChange={(e) => {
                        const newmanufacturedData = [...manufacturedData];
                        newmanufacturedData[index]["조치내용"] = e.target.value;
                        setmanufacturedData(newmanufacturedData);
                      }}
                    ></textarea>
                  </td>
                  <td>
                    <Form.Select size="sm" value={tr["담당자"]}
                    onChange={(e) => {
                      const newmanufacturedData = [...manufacturedData];
                        newmanufacturedData[index]["담당자"] = e.target.value;
                        setmanufacturedData(newmanufacturedData);
                    }}>
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
                    </Form.Select>
                  </td>
                  <td>
                    
                  </td>
                  <td>
                    <Form.Select size="sm" value={tr["약속매니저"]}
                    onChange={(e)=>{
                      const newmanufacturedData = [...manufacturedData];
                        newmanufacturedData[index]["담당자"] = e.target.value;
                        setmanufacturedData(newmanufacturedData);
                    }}>
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
                    </Form.Select>
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

export default Weeklymeeting;
