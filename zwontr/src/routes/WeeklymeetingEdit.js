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
  OverlayTrigger,
  Popover
} from "react-bootstrap";
import {
  useHistory,
  useParams,
} from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect, useRef } from "react";
import axios from "axios";

function WeeklymeetingEdit() {
  let paramDate = useParams()["thisMonday"];
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
  const [selectedDate, setselectedDate] = useState("");
  const [thisweekData, setthisweekData] = useState({});
  const [lastweekData, setlastweekData] = useState({});

  useEffect(async () => {
    const newstudentDBlist = await axios
      .get("/api/studentList")
      .then((result) => {
        if (result.data === "로그인필요") {
          window.alert("로그인이 필요합니다.");
          return history.push("/");
        }
        return result.data;
      })
      .catch((err) => {
        return err;
      });

    newstudentDBlist.sort(function (a, b) {
      if (classList.indexOf(a.분류) > classList.indexOf(b.분류)) return 1;
      if (classList.indexOf(a.분류) < classList.indexOf(b.분류)) return -1;
      if (a.이름 > b.이름) return 1;
      if (a.이름 < b.이름) return -1;
    });
    setstuDBList(newstudentDBlist);

    const newmanagerList = await axios
      .get("/api/managerList")
      .then((result) => {
        return result["data"];
      })
      .catch((err) => {
        return err;
      });
    setmanagerList(newmanagerList);

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
      setTRlist(foundTRlist);
      isInitialMount.current = false;

  }, [paramDate]);


useEffect(async()=>{
  const newlastweekData = await axios
      .get(`/api/Weeklymeeting/${getLastMonFromMon(paramDate)}`)
      .then((result) => {
        if (result["data"] !== null) {
          return result["data"];
        }
      })
      .catch((err) => {
        return err;
      });
      setlastweekData(newlastweekData);

  
  const newthisweekData = await axios
      .get(`/api/Weeklymeeting/${paramDate}`)
      .then((result) => {
        if (result["data"] !== null) {
          return result["data"]["thisweekData"];
        }
      })
      .catch((err) => {
        return err;
      });
      setthisweekData(newthisweekData);

}, [TRlist]);


  useEffect(async () => {
    if (isInitialMount.current === false) {
      setthisweek(getThisWeek());
      setlastweek(getLastWeek());
      setlastmonth(getLastMonth());
    }
  }, [paramDate]);



  useEffect(async () => {
    if (isInitialMount.current === false) {
      const temporal = stuDBList.map((element, i) => {
        return {
          ID: element["ID"],
          분류: element["분류"],
          이름: element["이름"],
          // 등교: false,
          지각: TRlist.filter((i) => {
            return (
              i["ID"] == element["ID"] &&
              i["목표등원"] != null &&
              i["목표등원"] < i["실제등원"] &&
              i["결석여부"] != true &&
              new Date(i.날짜) >= thisweek[0] &&
              new Date(i.날짜) < thisweek[1]
            );
          }).length,
          미등원: TRlist.filter((i) => {
            return (
              i["ID"] == element["ID"] &&
              i["결석여부"] === true &&
              new Date(i.날짜) >= thisweek[0] &&
              new Date(i.날짜) < thisweek[1]
            );
          }).length,
          이번주평균학습:
            Math.round(
              (TRlist.filter((i) => {
                return (
                  i["ID"] == element["ID"] &&
                  new Date(i.날짜) >= thisweek[0] &&
                  new Date(i.날짜) < thisweek[1] &&
                  i["결석여부"] != true &&
                  i["요일"] != "일요일"
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
                    i["ID"] == element["ID"] &&
                    new Date(i.날짜) >= thisweek[0] &&
                    new Date(i.날짜) < thisweek[1] &&
                    i["결석여부"] != true &&
                    i["요일"] != "일요일"
                  );
                }).length) *
                10
            ) / 10,
          전주평균학습:
            Math.round(
              (TRlist.filter((i) => {
                return (
                  i["ID"] == element["ID"] &&
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
                    i["ID"] == element["ID"] &&
                    new Date(i.날짜) >= lastweek[0] &&
                    new Date(i.날짜) < lastweek[1]
                  );
                }).length) *
                10
            ) / 10,
          전월평균학습:
            Math.round(
              (TRlist.filter((i) => {
                return (
                  i["ID"] == element["ID"] &&
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
                    i["ID"] == element["ID"] &&
                    new Date(i.날짜) >= lastmonth[0] &&
                    new Date(i.날짜) < lastmonth[1]
                  );
                }).length) *
                10
            ) / 10,
          약속: element["약속구조"],
        };
      });
      setmanufacturedData(temporal);

    }
  }, [TRlist]);

  function getNextMon(inputDate) {
    var tmpDate = new Date(inputDate);
    var day = tmpDate.getDay();
    var diff = tmpDate.getDate() - day + ((day == 0 ? 1 : 8) + 0);
    tmpDate = new Date(tmpDate.setDate(diff));
    var output = tmpDate.toISOString().split("T")[0];
    return output;
  }

  function getLastMonFromMon(inputDate) {
    var tmpDate = new Date(inputDate);
    tmpDate = new Date(tmpDate.setDate(tmpDate.getDate()-7));
    var output = tmpDate.toISOString().split("T")[0];
    return output;
  }

  function getThisWeek() {
    var inputDate = new Date(paramDate);
    inputDate.setHours(0, 0, 0, 0);
    var day = inputDate.getDay();
    var diff = inputDate.getDate() - day + (day == 0 ? -6 : 1);
    inputDate = new Date(inputDate.setDate(diff));
    var enddate = new Date(inputDate.setDate(inputDate.getDate()));
    var startdate = new Date(inputDate.setDate(inputDate.getDate() - 7));
    return [startdate, enddate];
  }

  function getLastWeek() {
    const thisweek = getThisWeek();
    thisweek[0].setDate(thisweek[0].getDate() - 7);
    thisweek[1].setDate(thisweek[1].getDate() - 7);
    return thisweek;
  }

  function getLastMonth() {
    var inputDate = new Date(paramDate);
    inputDate.setHours(0, 0, 0, 0);
    inputDate.setDate(1);
    var enddate = new Date(inputDate);
    var startdate = new Date(inputDate.setMonth(inputDate.getMonth() - 1));
    return [startdate, enddate];
  }

  function getPageName(){
    var mm = (thisweek[0].getMonth()+1).toString();
    var dd = thisweek[0].getDate().toString();
    if(dd<10){dd='0'+dd} if(mm<10){mm='0'+mm}
    const starting = thisweek[0].getFullYear().toString()+'-'+mm+'-'+dd;
    const ending = thisweek[1].toISOString().split("T")[0];
    return [starting, ending];
  }

  return (
    <div className="Weeklymeeting-background">
      <h2>
        <strong>주간결산 ({getPageName()[0]} ~ {getPageName()[1]})</strong>
      </h2>
      <Button
          className="btn-commit btn-save"
          onClick={() => {
            console.log(thisweekData);
            if (window.confirm("주간결산 내용을 수정하시겠습니까?")) {
              axios
                .put(`/api/Weeklymeeting/${paramDate}`, {
                  회의일: paramDate,
                  thisweekData: thisweekData,
                })
                .then(function (result) {
                  if (result.data === true) {
                    window.alert("수정되었습니다.");
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
          주간결산 저장
        </Button>

        <Button
          variant="secondary"
          className="btn-commit btn-load loadButton"
          onClick={() => {
            if (selectedDate !== "") {
              axios
                .get(`/api/Weeklymeeting/${getNextMon(selectedDate)}`)
                .then((result) => {
                  if (result["data"] === null) {
                    if (window.confirm("해당 날짜의 주간결산이 존재하지 않습니다. 새로 작성하시겠습니까?")) {
                      history.push(`/Weeklymeeting/Write/${getNextMon(selectedDate)}`);
                    }
                  } else {
                    if (window.confirm(`${selectedDate}의 주간결산으로 이동하시겠습니까?`)) {
                      history.push(`/Weeklymeeting/Edit/${getNextMon(selectedDate)}`);
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
                      checked={thisweekData[tr["ID"]]["등교"]}
                      onChange={() => {
                        const newthisweekData = {...thisweekData};
                        newthisweekData[tr["ID"]]["등교"] =
                          !newthisweekData[tr["ID"]]["등교"];
                        setthisweekData(newthisweekData);
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
                    <p
                      className={
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
                    >
                      {tr["전월평균학습"]}시간
                    </p>
                  </td>
                  <td>
                    <p>{lastweekData ? lastweekData['thisweekData'][tr["ID"]]['이번주문제사항']
                    : ""}</p>
                  </td>
                  <td>
                    <p>{lastweekData && lastweekData["thisweekData"][tr["ID"]]["담당자"] ? "담당매니저: "+lastweekData['thisweekData'][tr["ID"]]['담당자']
                    : ""}</p>
                    <p>
                      {lastweekData ? lastweekData['thisweekData'][tr["ID"]]['이번주조치계획']
                    : ""}</p>
                    <p>{lastweekData ? lastweekData['thisweekData'][tr["ID"]]['조치내용']
                    : ""}</p>
                  </td>
                  <td>
                    <textarea
                      className="textArea"
                      value={thisweekData ? thisweekData[tr['ID']]["이번주문제사항"]
                    : ""}
                      onChange={(e) => {
                        const newthisweekData = JSON.parse(JSON.stringify(thisweekData));
                        newthisweekData[tr['ID']]["이번주문제사항"] =
                          e.target.value;
                        setthisweekData(newthisweekData);
                      }}
                    ></textarea>
                  </td>
                  <td>
                    <textarea
                      className="textArea"
                      value={thisweekData? thisweekData[tr['ID']]["이번주조치계획"]
                    : ""}
                      onChange={(e) => {
                        const newthisweekData = JSON.parse(JSON.stringify(thisweekData));
                        newthisweekData[tr['ID']]["이번주조치계획"] =
                          e.target.value;
                        setthisweekData(newthisweekData);
                      }}
                    ></textarea>
                  </td>
                  <td>
                    <textarea
                      className="textArea"
                      value={thisweekData? thisweekData[tr['ID']]["조치내용"]
                    : ""}
                      onChange={(e) => {
                        const newthisweekData = JSON.parse(JSON.stringify(thisweekData));
                        newthisweekData[tr['ID']]["조치내용"] =
                          e.target.value;
                        setthisweekData(newthisweekData);
                      }}
                    ></textarea>
                  </td>
                  <td>
                    <Form.Select
                      size="sm"
                      value={thisweekData? thisweekData[tr['ID']]["담당자"]:
                    ""}
                      onChange={(e) => {
                        const newthisweekData = JSON.parse(JSON.stringify(thisweekData));
                        newthisweekData[tr['ID']]["담당자"] =
                          e.target.value;
                        setthisweekData(newthisweekData);
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
                    </Form.Select>
                  </td>
                  <td>
                    {tr["약속"].map((k, indice) => {
                      return (
                          <OverlayTrigger
                            trigger="click"
                            placement="left"
                            overlay={<Popover id="popover-basic">
                            <Popover.Header as="h3">
                              {k["설정매니저"]}
                            </Popover.Header>
                            <Popover.Body>
                              {k["약속"]}
                            </Popover.Body>
                          </Popover>}
                          >
                            <div className="promiseBox"><p>
                              <strong>{k["설정일"]}</strong>
                            </p></div>
                          </OverlayTrigger>
                      );
                    })}
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

export default WeeklymeetingEdit;
