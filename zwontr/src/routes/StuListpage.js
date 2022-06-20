import "../App.scss";
import "./StuListpage.scss";
import { Button, Card, ListGroup, Modal } from "react-bootstrap";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect } from "react";
import axios from "axios";
import menuarrow from "../next.png";
import absent from "./absent.png";
import notcame from "./notcame.png";

function StuListpage() {
  let history = useHistory();
  const now = new Date(); // 현재 시간
  const utcNow = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const koreaTimeDiff = 9 * 60 * 60 * 1000;
  const koreaNow = new Date(utcNow + koreaTimeDiff);
  const today = koreaNow.toISOString().split("T")[0];
  const [modalShow, setmodalShow] = useState(false);
  const [TRlistShow, setTRlistShow] = useState(false);
  const [Written, setWritten] = useState([]);
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

  const addClick = () => {
    if (window.confirm("학생 신규 등록을 진행하시겠습니까?")) {
      history.push("/StuInfoAdd");
    }
  };

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

  // 첫 로딩 시, studentDBlist/todayTRlist 업데이트
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
      return +(a.이름 > b.이름) - 0.5;
    });
    setstudentDBlist(newstudentDBlist);

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
          } else if (newtodayTRlist[j]["결석여부"] === true) {
            tmp = "미등원"
          } else if (newtodayTRlist[j]["결석여부"] === "등원예정") {
            tmp = "등원예정"
          }
          else if (
            newtodayTRlist[j]["작성매니저"] &&
            newtodayTRlist[j]["작성매니저"] !== "선택"
          ) {
            tmp = "귀가";
          }
          break;
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

  return (
    <div className="stuList-background">
      <div
        className={
          stuListShow === true
            ? "stuListShow stuListShowActive text-center"
            : "stuListShow text-center"
        }
      >
        <div className="statesBox">
          <p>활동중: {Written.filter(element => '등원' === element).length}</p>
          <p>귀가: {Written.filter(element => '귀가' === element).length}</p>
          <p>미등원: {Written.filter(element => '미등원' === element).length}</p>
          <p>등원예정: {Written.filter(element => '등원예정'=== element).length}</p>
          <p className="mt-3"><strong>총  {studentDBlist.length} 명</strong></p>
        </div>
        <h2>
          <strong>지원센터 학생 목록</strong>
        </h2>
        <Card className="stuCard">
          <Button variant="secondary" className="stuAddbtn" onClick={addClick}>
            <strong>+</strong>
          </Button>
          <ListGroup variant="flush" className="stuCardstuList">
            {studentDBlist
              ? studentDBlist.map(function (db, index) {
                  return (
                    <div className="stuListItem" key={index}>
                      <ListGroup.Item
                        className={
                          Written[index] === "귀가"
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
                        <p>{db.이름}</p>
                        {Written[index] === "미등원" && (
                          <img
                            src={absent}
                            alt="absent"
                            className="absent-sign"
                          />
                        )}
                        {Written[index] === "등원예정" && (
                          <img
                            src={notcame}
                            alt="notcame"
                            className="absent-sign"
                          />
                        )}
                      </ListGroup.Item>
                    </div>
                  );
                })
              : null}
          </ListGroup>
        </Card>
        {modalShow === true ? (
          <Modal show={modalShow} onHide={modalClose} className="TRModal">
            <Modal.Header closeButton>
              <Modal.Title>
                {chosenID ? chosenID.split("_")[0] : ""}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center">
              <div className="stumap">
                <Button
                  variant="secondary"
                  className="m-1 stuButton"
                  onClick={() => {
                    if (
                      window.confirm(
                        "학생의 개인정보를 열람합니다. 유출되지 않도록 주의하십시오. \n진행하시겠습니까?"
                      )
                    ) {
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
                    history.push(`/Chart/${chosenID}`);
                  }}
                >
                  차트{" "}
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
            <div className="w-3 ms-2"></div>
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default StuListpage;
