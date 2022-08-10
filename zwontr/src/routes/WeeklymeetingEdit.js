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
  Popover,
} from "react-bootstrap";
import {
  useHistory,
  useParams,
} from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import createPlotlyComponent from "react-plotly.js/factory";
import {
  PieChart,
  Pie,
  Legend,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ReferenceLine,
  RadialBarChart,
  RadialBar,
  AreaChart,
  Area,
} from "recharts";

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
  const average = (arr) => arr.reduce((p, c) => p + c, 0) / arr.length;
  const [selfDevel, setselfDevel] = useState(false);
  const [modalShow, setmodalShow] = useState(false);
  const modalOpen = () => setmodalShow(true);
  const modalClose = () => {
    setmodalShow(false);
  };
  const [studyGraphData, setstudyGraphData] = useState([{날짜: 0, 학습시간: 0}]);


  async function nameClick(dateRange, index) {
    if (dateRange==="이번주학습"){
      setstudyGraphData(manufacturedData[index]["이번주학습"]);
    }
    else if (dateRange==="전주학습"){
      setstudyGraphData(manufacturedData[index]["전주학습"]);
    }
    if (dateRange==="전월학습"){
      setstudyGraphData(manufacturedData[index]["전월학습"]);
    }
    modalOpen();
  }

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

  useEffect(async () => {
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
          지각정도: TRlist.filter((i) => {
            return (
              i["ID"] == element["ID"] &&
              i["결석여부"] !== true &&
              new Date(i.날짜) >= thisweek[0] &&
              new Date(i.날짜) < thisweek[1]
            );
          })
          .map((j, index)=>{
            return j["등원차이"] < 0 ? j["등원차이"] : null;
          }).filter((k, index) => k !== null),
          미등원: TRlist.filter((i) => {
            return (
              i["ID"] == element["ID"] &&
              i["결석여부"] === true &&
              new Date(i.날짜) >= thisweek[0] &&
              new Date(i.날짜) < thisweek[1]
            );
          }).length,

          이번주학습: TRlist.filter((i) => {
            return (
              i["ID"] == element["ID"] &&
              new Date(i.날짜) >= thisweek[0] &&
              new Date(i.날짜) < thisweek[1] &&
              i["결석여부"] != true &&
              i["요일"] != "일요일"
            );
          })
            .map((j, index) => {
              return {날짜: j["날짜"], 학습시간: selfDevel === true ? j["실제학습"] + j["프로그램시간"] : j["실제학습"]};
            }),

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
                .map((j, index) => {
                  return(
                    selfDevel === true ? j["실제학습"] + j["프로그램시간"] : j["실제학습"]
                  );
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
            전주학습: TRlist.filter((i) => {
              return (
                i["ID"] == element["ID"] &&
                new Date(i.날짜) >= lastweek[0] &&
                new Date(i.날짜) < lastweek[1] &&
                i["결석여부"] != true &&
                i["요일"] != "일요일"
              );
            })
              .map((j, index) => {
                return {날짜: j["날짜"], 학습시간: selfDevel === true ? j["실제학습"] + j["프로그램시간"] : j["실제학습"]};
              }),

          전주평균학습:
            Math.round(
              (TRlist.filter((i) => {
                return (
                  i["ID"] == element["ID"] &&
                  new Date(i.날짜) >= lastweek[0] &&
                  new Date(i.날짜) < lastweek[1] &&
                  i["결석여부"] != true &&
                  i["요일"] != "일요일"
                );
              })
                .map((j, index) => {
                  return(
                    selfDevel === true ? j["실제학습"] + j["프로그램시간"] : j["실제학습"]
                  );
                })
                .reduce((a, b) => {
                  return a + b;
                }, 0) /
                TRlist.filter((i) => {
                  return (
                    i["ID"] == element["ID"] &&
                    new Date(i.날짜) >= lastweek[0] &&
                    new Date(i.날짜) < lastweek[1] &&
                    i["결석여부"] != true &&
                    i["요일"] != "일요일"
                  );
                }).length) *
                10
            ) / 10,
            전월학습: TRlist.filter((i) => {
              return (
                i["ID"] == element["ID"] &&
                new Date(i.날짜) >= lastmonth[0] &&
                new Date(i.날짜) < lastmonth[1] &&
                i["결석여부"] != true &&
                i["요일"] != "일요일"
              );
            })
              .map((j, index) => {
                return {날짜: j["날짜"], 학습시간: selfDevel === true ? j["실제학습"] + j["프로그램시간"] : j["실제학습"]};
              }),

          전월평균학습:
            Math.round(
              (TRlist.filter((i) => {
                return (
                  i["ID"] == element["ID"] &&
                  new Date(i.날짜) >= lastmonth[0] &&
                  new Date(i.날짜) < lastmonth[1] &&
                  i["결석여부"] != true &&
                  i["요일"] != "일요일"
                );
              })
                .map((j, index) => {
                  return(
                    selfDevel === true ? j["실제학습"] + j["프로그램시간"] : j["실제학습"]
                  );
                })
                .reduce((a, b) => {
                  return a + b;
                }, 0) /
                TRlist.filter((i) => {
                  return (
                    i["ID"] == element["ID"] &&
                    new Date(i.날짜) >= lastmonth[0] &&
                    new Date(i.날짜) < lastmonth[1] &&
                    i["결석여부"] != true &&
                    i["요일"] != "일요일"
                  );
                }).length) *
                10
            ) / 10,
          약속: element["약속구조"],
        };
      });
      setmanufacturedData(temporal);
    }
  }, [TRlist, selfDevel]);

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
    tmpDate = new Date(tmpDate.setDate(tmpDate.getDate() - 7));
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

  return (
    <div className="Weeklymeeting-background">
      <h2>
        <strong>
          주간결산 ({getPageName()[0]} ~ {getPageName()[1]})
        </strong>
      </h2>
      <Button
        className="btn-commit btn-save"
        onClick={() => {
          console.log(studyGraphData);
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
        <strong>주간결산 수정</strong>
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
                  if (
                    window.confirm(
                      "해당 날짜의 주간결산이 존재하지 않습니다. 새로 작성하시겠습니까?"
                    )
                  ) {
                    history.push(
                      `/Weeklymeeting/Write/${getNextMon(selectedDate)}`
                    );
                  }
                } else {
                  if (
                    window.confirm(
                      `${selectedDate}의 주간결산으로 이동하시겠습니까?`
                    )
                  ) {
                    history.push(
                      `/Weeklymeeting/Edit/${getNextMon(selectedDate)}`
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
        {modalShow === true ? (
          <Modal show={modalShow} onHide={modalClose} className="studyModal"
          dialogClassName="modal-90w">
            <Modal.Body className="text-center">
              <p>
                <strong>[ 학습시간 추이 ]</strong>
              </p>
                <AreaChart className="graph" width={1000} height={500} data={studyGraphData}>
                  <Area type="monotone" dataKey="학습시간" stroke="#FFBB28" fill="#FFBB28" />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <XAxis dataKey="날짜" />
                  <YAxis />
                  {/* <ReferenceLine y={aver} label={`Average : ${aver}`} stroke="#0088FE" strokeDasharray="3 3" /> */}
                </AreaChart>
            </Modal.Body>
          </Modal>
        ) : null}
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
      <Form.Check
                className="ms-3 mb-2 text-start"
                type="checkbox"
                label="학습시간 계산에 자기계발 포함"
                checked={selfDevel}
                onChange={(e) => {
                  setselfDevel(!selfDevel);
                }}
              />
      <div className="Weeklymeeting-container">
        <Table striped hover size="sm" className="Weeklymeeting-table">
          <thead>
            <tr>
              <th colSpan={3} width="4%">
                <strong>정보</strong>
              </th>
              <OverlayTrigger
                trigger={["hover", "focus"]}
                placement="top"
                overlay={
                  <Popover id="popover-basic">
                    <Popover.Body>
                      <p><strong>이번 주 학생 지각일입니다.</strong></p>
                      <div className="commentbox">
                        <div className="colorcomment red"></div>
                        <p>
                          <strong>3회 이상 지각</strong>
                        </p>
                        </div>
                        <div className="commentbox">
                        <div className="colorcomment yellow"></div>
                        <p>
                          <strong>1~2회 지각</strong>
                        </p>
                        </div>
                        <div className="commentbox">
                        <div className="colorcomment green"></div>
                        <p>
                          <strong>매일 정시등원</strong>
                        </p>
                        </div>
                      </Popover.Body>
                  </Popover>
                }
              >
                <th rowSpan={2} width="1.5%">
                  <strong>지각</strong>
                </th>
              </OverlayTrigger>
              <th rowSpan={2} width="1.5%">
                <strong>미등원</strong>
              </th>
              <th colSpan={3} width="6%">
              <OverlayTrigger
                trigger={["hover", "focus"]}
                placement="top"
                overlay={
                  <Popover id="popover-basic">
                    <Popover.Body>
                      <p>
                        <strong>학생의 기간별 평균 학습시간입니다.</strong>
                      </p>
                      <div className="commentbox">
                        <p className="me-2">
                          <strong>(고): </strong>
                        </p>
                        <div className="colorcomment red"></div>
                        <p>
                          <strong>~5시간,</strong>
                        </p>
                        <div className="colorcomment yellow"></div>
                        <p>
                          <strong>5~6시간,</strong>
                        </p>
                        <div className="colorcomment green"></div>
                        <p>
                          <strong>6시간~</strong>
                        </p>
                      </div>
                      <div className="commentbox">
                        <p className="me-2">
                          <strong>(중): </strong>
                        </p>
                        <div className="colorcomment red"></div>
                        <p>
                          <strong>~3시간,</strong>
                        </p>
                        <div className="colorcomment yellow"></div>
                        <p>
                          <strong>3~4시간,</strong>
                        </p>
                        <div className="colorcomment green"></div>
                        <p>
                          <strong>4시간~</strong>
                        </p>
                      </div>
                      <div className="commentbox">
                        <p className="me-2">
                          <strong>(OT, 대표관리): </strong>
                        </p>
                        <div className="colorcomment black"></div>
                      </div>
                    </Popover.Body>
                  </Popover>
                }
              > 
                  <strong>평균 학습시간 (일요일 제외)</strong>
                
              </OverlayTrigger>
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
              <OverlayTrigger
                trigger={["hover", "focus"]}
                placement="top"
                overlay={
                  <Popover id="popover-basic">
                    <Popover.Body>
                      <p><strong>학생 등교여부 확인을 위한 란입니다.</strong></p>
                      <p><strong>학교에 등교하는 학생에 체크해주세요.</strong></p>
                      <p><strong>방학 중에는 체크를 해제해주세요.</strong></p>
                      </Popover.Body>
                  </Popover>
                }
              >
                <th>
                <strong>등교</strong>
              </th>
              </OverlayTrigger>
              
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
                  <td className="fixedColumn">
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
                        const newthisweekData = { ...thisweekData };
                        newthisweekData[tr["ID"]]["등교"] =
                          !newthisweekData[tr["ID"]]["등교"];
                        setthisweekData(newthisweekData);
                      }}
                    />
                  </td>
                  <td>
                  <OverlayTrigger
                trigger={["hover", "focus"]}
                placement="right"
                overlay={
                  <Popover id="popover-basic">
                    <Popover.Body>
                      <p>
                        <strong>평균 {tr["지각정도"].length === 0 ? 0 : Math.round(Math.abs(average(tr["지각정도"])) * 10) / 10}시간 지각했습니다.</strong>
                      </p>
                      <p>
                        <strong>(최소 {tr["지각정도"].length === 0 ? 0 : Math.round(Math.abs(Math.max(...tr["지각정도"])) * 10) / 10}시간, 최대 {tr["지각정도"].length === 0 ? 0 : Math.round(Math.abs(Math.min(...tr["지각정도"])) * 10) / 10}시간)</strong>
                      </p>
                    </Popover.Body>
                  </Popover>
                }
              >
                    <p
                      className={
                        tr["지각"] >= 3
                          ? "red"
                          : tr["지각"] == 0
                          ? "green"
                          : "yellow"
                      }
                    >
                      <strong>{tr["지각"]}회</strong>
                    </p>
                  
              </OverlayTrigger>
              </td>
                  <td>
                    <p>
                      <strong>{tr["미등원"]}일</strong>
                    </p>
                  </td>
                  <td onClick={() => {
                          nameClick("이번주학습", index);
                        }}>
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
                      <strong>
                        {isNaN(tr["이번주평균학습"]) === false
                          ? `${tr["이번주평균학습"]}시간`
                          : "-"}
                      </strong>
                    </p>
                  </td>
                  <td onClick={() => {
                          nameClick("전주학습", index);
                        }}>
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
                      <strong>
                        {isNaN(tr["전주평균학습"]) === false
                          ? `${tr["전주평균학습"]}시간`
                          : "-"}
                      </strong>
                    </p>
                  </td>
                  <td onClick={() => {
                          nameClick("전월학습", index);
                        }}>
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
                      <strong>
                        {isNaN(tr["전월평균학습"]) === false
                          ? `${tr["전월평균학습"]}시간`
                          : "-"}
                      </strong>
                    </p>
                  </td>
                  <td>
                    <p>
                      {lastweekData
                        ? lastweekData["thisweekData"][tr["ID"]][
                            "이번주문제사항"
                          ]
                        : ""}
                    </p>
                  </td>
                  <td>
                    <p>
                      {lastweekData &&
                      lastweekData["thisweekData"][tr["ID"]]["담당자"]
                        ? "담당매니저: " +
                          lastweekData["thisweekData"][tr["ID"]]["담당자"]
                        : ""}
                    </p>
                    <p>
                      {lastweekData
                        ? lastweekData["thisweekData"][tr["ID"]][
                            "이번주조치계획"
                          ]
                        : ""}
                    </p>
                    <p>
                      {lastweekData
                        ? lastweekData["thisweekData"][tr["ID"]]["조치내용"]
                        : ""}
                    </p>
                  </td>
                  <td>
                    <textarea
                      className="textArea"
                      value={
                        thisweekData
                          ? thisweekData[tr["ID"]]["이번주문제사항"]
                          : ""
                      }
                      onChange={(e) => {
                        const newthisweekData = JSON.parse(
                          JSON.stringify(thisweekData)
                        );
                        newthisweekData[tr["ID"]]["이번주문제사항"] =
                          e.target.value;
                        setthisweekData(newthisweekData);
                      }}
                    ></textarea>
                  </td>
                  <td>
                    <textarea
                      className="textArea"
                      value={
                        thisweekData
                          ? thisweekData[tr["ID"]]["이번주조치계획"]
                          : ""
                      }
                      onChange={(e) => {
                        const newthisweekData = JSON.parse(
                          JSON.stringify(thisweekData)
                        );
                        newthisweekData[tr["ID"]]["이번주조치계획"] =
                          e.target.value;
                        setthisweekData(newthisweekData);
                      }}
                    ></textarea>
                  </td>
                  <td>
                    <textarea
                      className="textArea"
                      value={
                        thisweekData ? thisweekData[tr["ID"]]["조치내용"] : ""
                      }
                      onChange={(e) => {
                        const newthisweekData = JSON.parse(
                          JSON.stringify(thisweekData)
                        );
                        newthisweekData[tr["ID"]]["조치내용"] = e.target.value;
                        setthisweekData(newthisweekData);
                      }}
                    ></textarea>
                  </td>
                  <td>
                    <Form.Select
                      size="sm"
                      value={
                        thisweekData ? thisweekData[tr["ID"]]["담당자"] : ""
                      }
                      onChange={(e) => {
                        const newthisweekData = JSON.parse(
                          JSON.stringify(thisweekData)
                        );
                        newthisweekData[tr["ID"]]["담당자"] = e.target.value;
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
                          overlay={
                            <Popover id="popover-basic">
                              <Popover.Header as="h3">
                                {k["설정매니저"]}
                              </Popover.Header>
                              <Popover.Body>{k["약속"]}</Popover.Body>
                            </Popover>
                          }
                        >
                          <div className="promiseBox">
                            <p>
                              <strong>{k["설정일"]}</strong>
                            </p>
                          </div>
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
