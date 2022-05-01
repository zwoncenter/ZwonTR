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
  const [TRlist, setTRlist] = useState([]);
  const [studentTRlist, setstudentTRlist] = useState([]);

  const addClick = () => {
    if (window.confirm("학생 신규 등록을 진행하시겠습니까?")) {
      history.push("/StuInfoAdd");
    }
  };

  async function nameClick(db, index) {
    setchosenID(db["ID"]);

    modalOpen();
    axios
      .get(`/api/TR/${db["ID"]}`)
      .then(async function (result) {
        await result.data.sort(function (a, b) {
          return +(new Date(a.날짜) < new Date(b.날짜)) - 0.5;
        });
        console.log(result);
        setstudentTRlist(result.data);
      })
      .catch(function (err) {
        console.log("/api/TR/:name fail : ", err);
      });
  }

  useEffect(async () => {
    const result = await axios
      .get("/api/studentList")
      .then((result) => {
        return result;
      })
      .catch((err) => {
        return err;
      });

    if (result.data && result.data == "로그인필요") {
      window.alert("로그인이 필요합니다.");
      return history.push("/");
    }
    result.data.sort(function (a, b) {
      return +(a.이름 > b.이름) - 0.5;
    });
    setstudentDBlist(result.data);
    setready(true);

    const result2 = await axios
      .get(`/api/TRlist/${today}`)
      .then((result) => {
        return result;
      })
      .catch((err) => {
        return err;
      });
    
    const newWritten = [];
    for (var i =0; i<result.data.length; i++){
      var tmp = false;
      for (var j=0; j<result2.data.length; j++){
        if (result.data[i]["ID"] == result2.data[j]["ID"]){
          tmp = true;
          break;
        }
      }
      newWritten.push(tmp);
    }
    setWritten(newWritten);

    console.log(result2);
    if (result2.data && result2.data == "로그인필요") {
      window.alert("로그인이 필요합니다.");
      return history.push("/");
    }
    setstudentTRlist(result2.data);
  }, []);

  return (
    <div className="stuList-background">
      <div className={stuListShow === true ? "stuListShow stuListShowActive text-center" : "stuListShow text-center"}>
        <h2>
          <strong>지원센터 학생 목록</strong>
        </h2>
        <Button
          onClick={() => {
            // console.log(studentTRlist);
            console.log(studentDBlist);
            console.log(Written);
          }}
        >
          studentTRlist 확인
        </Button>
        <Card className="stuCard">
          <Button variant="secondary" className="stuAddbtn" onClick={addClick}>
            <strong>+</strong>
          </Button>
          <ListGroup variant="flush" className="stuCardstuList">
            {ready
              ? studentDBlist.map(function (db, index) {
                  return (
                    <div className="stuListItem" key={index}>
                      <ListGroup.Item
                        className={Written[index]==true ? "IsWritten" : "NotWritten"}
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
              <Modal.Title>{ready ? chosenID.split("_")[0] : ""}</Modal.Title>
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
