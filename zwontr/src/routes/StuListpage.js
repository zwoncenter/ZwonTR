import "../App.scss";
import "./StuListpage.scss";
import { Button, Card, ListGroup, Modal } from "react-bootstrap";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect } from "react";
import axios from "axios";

function StuListpage() {
  let history = useHistory();
  const today = new Date().toISOString().split("T")[0];
  const [modalShow, setmodalShow] = useState(false);
  const [TRlistShow, setTRlistShow] = useState(false);
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
    if (newtodayTRlist && newtodayTRlist == "로그인필요") {
      window.alert("로그인이 필요합니다.");
      return history.push("/");
    }
    settodayTRlist(newtodayTRlist);
  }, []);

  return (
    <div className="stuList-background">
      <div className={stuListShow === true ? "stuListShow stuListShowActive text-center" : "stuListShow text-center"}>
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
                        onClick={() => {
                          nameClick(db, index);
                        }}
                      >
                        <p>{db.이름}</p>
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
              <Modal.Title>{chosenID ? chosenID.split("_")[0] : ""}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center">
              <div className="stumap">
                <Button
                  variant="secondary"
                  className="m-1 stuButton"
                  onClick={() => {
                    history.push(`/StuInfoEdit/${chosenID}`);
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
                            history.push(`TR/${chosenID}/edit/${tr.날짜}`);
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
      </div>
    </div>
  );
}

export default StuListpage;
