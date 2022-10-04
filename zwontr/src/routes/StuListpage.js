import "../App.scss";
import "./StuListpage.scss";
import { Button, Card, ListGroup, Modal, Table } from "react-bootstrap";
import { useHistory, useParams } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect } from "react";
import axios from "axios";
import absent from "./absent.png";
import notcame from "./notcame.png";
import trchecked from "./trchecked.png";
import Draggable from "react-draggable";
import StickyNote from "./StickyNote";

// sticky note 관련 함수를 export


function StuListpage() {
  let history = useHistory();
  // const param = useParams();
  const now = new Date(); // 현재 시간
  const utcNow = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const koreaTimeDiff = 9 * 60 * 60 * 1000;
  const koreaNow = new Date(utcNow + koreaTimeDiff);
  const today = koreaNow.toISOString().split("T")[0];
  const [modalShow, setmodalShow] = useState(false);
  const [TRlistShow, setTRlistShow] = useState(false);
  const [Written, setWritten] = useState([]);
  const [openlist, setopenlist] = useState(false);
  const [buylist, setbuylist] = useState([]);
  let [stuListShow, stuListShowChange] = useState(false);
  useEffect(() => {
    let timer = setTimeout(() => {
      stuListShowChange(true);
    }, 250);
  }, []);
  const modalOpen = () => setmodalShow(true);
  const modalClose = () => {
    setmodalShow(false);
    setTRlistShow(false);
  };

  const [ready, setready] = useState(false);

  const [studentDBlist, setstudentDBlist] = useState([]);
  const [chosenID, setchosenID] = useState("");
  const [todayTRlist, settodayTRlist] = useState([]);
  const [studentTRlist, setstudentTRlist] = useState([]);
  const [stickynoteValue, setstickynoteValue] = useState("");

  const addClick = () => {
    if (window.confirm("학생 신규 등록을 진행하시겠습니까?")) {
      history.push("/StuInfoAdd");
    }
  };
  const [thisweek, setthisweek] = useState(getThisWeek());

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
      month = "" + (d.getMonth() + 1),
      day = "" + (d.getDate() - 1),
      year = d.getFullYear();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    return [year, month, day].join("-");
  }

  // 학생 이름을 클릭 시, 선택된 ID를 바꾸고, 해당 ID의 TR리스트 조회
  async function nameClick(db, index) {
    setchosenID(db["ID"]);
    modalOpen();
    axios
      .get(`/api/TR/${db["ID"]}`)
      .then(async function (result) {
        await result.data.sort(function (a, b) {
          return +(new Date(a.날짜) < new Date(b.날짜)) - 0.5;
        });
        setstudentTRlist(result.data);
      })
      .catch(function (err) {
        console.log("/api/TR/:name fail : ", err);
      });
  }

  // 첫 로딩 시, studentDBlist/todayTRlist/stickymemo 업데이트
  useEffect(async () => {
    const existstickynote = await axios
      .get("/api/stickynote")
      .then((result) => {
        console.log(result.data);
        return result.data;
      })
      .catch((err) => {
        return err;
      });
    setstickynoteValue(existstickynote);

    const newstudentDBlist = await axios
      .get("/api/studentList")
      .then((result) => {
        console.log(result.data);
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
      return +(a.이름 > b.이름) - 0.5;
    });
    setstudentDBlist(newstudentDBlist);
    const newbuylist = [];
    for (const studentDB of newstudentDBlist) {
      let textbooklist = [];
      for (const 교재 of studentDB["진행중교재"]) {
        if (교재["최근진도율"] >= 85) {
          textbooklist.push(교재);
        }
      }
      if (textbooklist.length !== 0) {
        newbuylist.push({
          이름: studentDB["이름"],
          목록: textbooklist,
        });
      }
    }
    setbuylist(newbuylist);

    const newtodayTRlist = await axios
      .get(`/api/TRlist/${today}`)
      .then((result) => {
        return result.data;
      })
      .catch((err) => {
        return err;
      });
    settodayTRlist(newtodayTRlist);
    const newWritten = [];
    for (var i = 0; i < newstudentDBlist.length; i++) {
      var tmp = "미작성";
      for (var j = 0; j < newtodayTRlist.length; j++) {
        if (newstudentDBlist[i]["ID"] == newtodayTRlist[j]["ID"]) {
          if (newtodayTRlist[j]["결석여부"] === false) {
            tmp = "등원";
            if (newtodayTRlist[j]["작성매니저"] && newtodayTRlist[j]["작성매니저"] !== "선택") {
              tmp = "귀가";
            } else if (newtodayTRlist[j]["TR작성여부"] === true) {
              tmp = "TR검사완료";
            }
          } else if (newtodayTRlist[j]["결석여부"] === true) {
            tmp = "미등원";
          } else if (newtodayTRlist[j]["결석여부"] === "등원예정") {
            tmp = "등원예정";
          }
        }
      }
      newWritten.push(tmp);
    }
    setWritten(newWritten);

    if (newtodayTRlist && newtodayTRlist == "로그인필요") {
      window.alert("로그인이 필요합니다.");
      return history.push("/");
    }
  }, []);

  // draggable 메모장 관련
  const [position, setPosition] = useState({ x: 0, y: 0 }); // box의 포지션 값
  // // 업데이트 되는 값을 set 해줌
  const trackPos = (data) => {
    setPosition({ x: data.x, y: data.y });
  };

//   const addNote = () => {
//     setstickyNoteList([...stickyNoteList, <StickyNote x={0} y={0} addNote={addNote}/>]);
//     console.log(stickyNoteList);
// };
//   const [stickyNoteList, setstickyNoteList] = useState([<StickyNote x={0} y={0} addNote={addNote}/>]);
  

  
  return (
    <div className="stuList-background">
      <div className={stuListShow === true ? "stuListShow stuListShowActive text-center" : "stuListShow text-center"}>
        {/* {stickyNoteList} */}
        <Draggable onDrag={(e, data) => trackPos(data)}>
          <div className="stickynote">
            <Button className="stuAddbtn"
            onclick={()=>{
              // addNote();
            }}>+</Button>
            <strong>
              <p className="m-0">업무공유사항</p>
            </strong>
            <textarea
              placeholder="여기에 입력하세요"
              value={stickynoteValue["note"]}
              onChange={(e) => {
                const newstickynote = JSON.parse(JSON.stringify(stickynoteValue));
                newstickynote["note"] = e.target.value;
                setstickynoteValue(newstickynote);
              }}
              onBlur={() => {
                console.log(stickynoteValue);
                axios
                  .put("/api/stickynote", stickynoteValue)
                  .then(function (result) {
                    if (result.data === true) {
                      history.push("/studentList");
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
              }}
            ></textarea>
            <p>* 작성/수정 후 메모장 바깥을 눌러야 저장됩니다.</p>
          </div>
        </Draggable>
        <div className="statesBox">
          <p>활동중: {Written.filter((element) => "등원" === element).length}</p>
          <p>귀가: {Written.filter((element) => "귀가" === element).length}</p>
          <p>미등원: {Written.filter((element) => "미등원" === element).length}</p>
          <p>등원예정: {Written.filter((element) => "등원예정" === element).length}</p>
          <p className="mt-3">
            <strong>총 {studentDBlist.length} 명</strong>
          </p>
        </div>
        <h2>
          <strong>지원센터 학생 목록</strong>
        </h2>
        {buylist.length !== 0 ? (
          <Card className={openlist ? "TextbookCard openlist" : "TextbookCard"}>
            <div className="row">
              <div className="col-1">
                <Button
                  variant="secondary"
                  className="leftButton"
                  onClick={() => {
                    setopenlist(!openlist);
                  }}
                >
                  {openlist ? ">" : "<"}
                </Button>
              </div>
              <div className="col-11 listbox">
                <Table striped hover className="mt-3">
                  <thead>
                    <tr>
                      <th width="60px">이름</th>
                      <th width="">교재명</th>
                      <th width="120px">총교재량</th>
                      <th width="120px">최근진도</th>
                    </tr>
                  </thead>
                  {buylist.map((obj, index) => {
                    return (
                      <tbody key={index}>
                        {obj["목록"].map(function (a, i) {
                          return (
                            <tr key={i}>
                              <td>
                                <p>{obj["이름"]}</p>
                              </td>
                              <td>
                                <p>{a.교재}</p>
                              </td>
                              <td>
                                <p>{a.총교재량}</p>
                              </td>
                              <td>
                                <p>
                                  {a.최근진도} {a.총교재량 ? "(" + a.최근진도율 + "%)" : null}
                                </p>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    );
                  })}
                </Table>
              </div>
            </div>
          </Card>
        ) : null}

        <Card className="stuCard">
          <Button variant="secondary" className="stuAddbtn" onClick={addClick}>
            <strong>+</strong>
          </Button>
          <div className="row stuCardstuList">
            {studentDBlist
              ? studentDBlist.map(function (db, index) {
                  return (
                    <div className="col-sm-6 col-md-4 stuListItem" key={index}>
                      <ListGroup.Item
                        className={
                          Written[index] === "TR검사완료"
                            ? "TRChecked"
                            : Written[index] === "귀가"
                            ? "WentHome"
                            : Written[index] === "등원"
                            ? "AtHere"
                            : Written[index] === "등원예정"
                            ? "NotCame"
                            : Written[index] === "미등원"
                            ? "Absent"
                            : "NotWritten"
                        }
                        onClick={() => {
                          nameClick(db, index);
                        }}
                      >
                        <p className="d-inline">{db.이름}</p>
                        {Written[index] === "미등원" && <img src={absent} alt="absent" className="absent-sign" />}
                        {Written[index] === "등원예정" && <img src={notcame} alt="notcame" className="absent-sign" />}
                        {Written[index] === "TR검사완료" && <img src={trchecked} alt="trchecked" className="absent-sign" />}
                      </ListGroup.Item>
                    </div>
                  );
                })
              : null}
          </div>
        </Card>

        {modalShow === true ? (
          <Modal show={modalShow} onHide={modalClose} className="TRModal" dialogClassName="modal-35w">
            <Modal.Header closeButton>
              <Modal.Title>{chosenID ? chosenID.split("_")[0] : ""}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center">
              <div className="stumap">
                <Button
                  variant="secondary"
                  className="m-1 stuButton"
                  onClick={() => {
                    if (window.confirm("학생의 개인정보를 열람합니다. 유출되지 않도록 주의하십시오. \n진행하시겠습니까?")) {
                      history.push(`/StuInfoEdit/${chosenID}`);
                    }
                  }}
                >
                  학생기본정보
                </Button>
                <Button
                  variant="secondary"
                  className="m-1 stuButton"
                  onClick={() => {
                    history.push(`/StudentEdit/${chosenID}`);
                  }}
                >
                  학생DB조회/변경
                </Button>

                <Button
                  variant="secondary"
                  className="m-1 stuButton"
                  onClick={() => {
                    setTRlistShow(!TRlistShow);
                  }}
                >
                  TR(일간하루)
                </Button>

                <Button
                  variant="secondary"
                  className="m-1 stuButton"
                  onClick={() => {
                    axios
                      .get(`/api/Weeklystudyfeedback/${chosenID}/${formatDate(thisweek[1])}`)
                      .then((result) => {
                        if (result["data"] === null) {
                          history.push(`/WeeklystudyfeedbackWrite/${chosenID}/${formatDate(thisweek[1])}`);
                        } else {
                          history.push(`/WeeklystudyfeedbackEdit/${chosenID}/${formatDate(thisweek[1])}`);
                        }
                      })
                      .catch((err) => {
                        console.log(err);
                      });
                  }}
                >
                  주간학습목표 스케줄링
                </Button>
              </div>
            </Modal.Body>
            {TRlistShow === true ? (
              <div className="text-center mb-3">
                <Button
                  variant="secondary"
                  className="createTRButton"
                  onClick={() => {
                    history.push(`/TR/${chosenID}/write`);
                  }}
                >
                  + 새 TR 작성 +
                </Button>
                <p className="mb-0 mt-1">
                  <strong>[ 기존 TR ]</strong>
                </p>
                <ListGroup variant="flush" className="dateContainer">
                  {studentTRlist.map(function (tr, index) {
                    return (
                      <div key={index}>
                        <ListGroup.Item
                          className="stuTRItem"
                          onClick={async () => {
                            history.push(`/TR/${chosenID}/edit/${tr.날짜}`);
                          }}
                        >
                          <p>{tr.날짜}</p>
                        </ListGroup.Item>
                      </div>
                    );
                  })}
                </ListGroup>
              </div>
            ) : null}
          </Modal>
        ) : null}
        <div className="stulistComment">
          <div className="mt-1 commentcontainer">
            <div>
              <div className="commentbox">
                <div className="colorcomment colorcomment-lightgrey"></div>
                <p>
                  <strong>중간 피드백 작성 완료</strong>
                </p>
              </div>
              <div className="commentbox">
                <div className="colorcomment colorcomment-darkgrey"></div>
                <p>
                  <strong>마감 피드백 작성 완료</strong>
                </p>
              </div>
            </div>
            <div className="w-3 ms-2 me-2"></div>
            <div>
              <div className="commentbox">
                <div className="absentcomment-sign">
                  <img src={absent} alt="absent" />
                </div>
                <p>
                  <strong>미등원 시 표시됩니다.</strong>
                </p>
              </div>
              <div className="commentbox">
                <div className="absentcomment-sign">
                  <img src={notcame} alt="notcame" />
                </div>
                <p>
                  <strong>등원예정 시 표시됩니다.</strong>
                </p>
              </div>
            </div>
            <div className="w-3 ms-2 me-2"></div>
            <div>
              <div className="commentbox">
                <div className="absentcomment-sign">
                  <img src={trchecked} alt="trchecked" />
                </div>
                <p>
                  <strong>TR작성 시 표시됩니다.</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StuListpage;
