import "../App.scss";
import "./StuListpage.scss";
import { Button, Card, ListGroup, Modal } from "react-bootstrap";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect } from "react";
import axios from "axios";

function StuListpage(props) {
  let history = useHistory();

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

  const addClick = () => {
    if (window.confirm("학생 신규 DB 등록을 진행하시겠습니까?")) {
      history.push("/studentAdd");
    }
  };

  async function nameClick(db, index) {
    await props.선택된index변경(index);
    modalOpen();
    axios
      .get(`/api/TR/${db.이름}`)
      .then(async function (result) {
        await result.data.sort(function (a, b) {
          return +(new Date(a.날짜) < new Date(b.날짜)) - 0.5;
        });
        props.settrList(result.data);
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
    await props.선택된index변경(0);
    await props.setstudentList(result.data);
    setready(true);

    const managerList = await axios
      .get("/api/managerList")
      .then((result) => {
        return result;
      })
      .catch((err) => {
        return err;
      });
    props.setmanagerList(managerList.data);
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
            {ready
              ? props.studentList.map(function (db, index) {
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
              <Modal.Title>{ready ? props.studentList[props.선택된index].이름 : ""}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center">
              {/* <Button
                variant="secondary"
                className="me-3 stuButton"
                onClick={() => {
                  history.push(`/StuInfo/${props.studentList[props.선택된index].이름}`);
                }}
              >
                학생기본정보
              </Button> */}

              <Button
                variant="secondary"
                className="me-3 stuButton"
                onClick={() => {
                  history.push(`/StudentEdit/${props.studentList[props.선택된index].이름}`);
                }}
              >
                학생DB조회/변경
              </Button>

              <Button
                variant="secondary"
                className="me-3 stuButton"
                onClick={() => {
                  history.push(`/Chart/${props.studentList[props.선택된index].이름}`);
                }}
              >
                차트{" "}
              </Button>

              <Button
                variant="secondary"
                className="me-3 stuButton"
                onClick={() => {
                  setTRlistShow(!TRlistShow);
                }}
              >
                TR(일간하루)
              </Button>
            </Modal.Body>
            {TRlistShow === true ? (
              <div className="text-center mb-3">
                <Button
                  variant="secondary"
                  className="createTRButton"
                  onClick={() => {
                    history.push(`/TR/${props.studentList[props.선택된index].이름}/write`);
                  }}
                >
                  + 새 TR 작성 +
                </Button>
                <p className="mb-0 mt-1">
                  <strong>[ 기존 TR ]</strong>
                </p>
                <ListGroup variant="flush" className="dateContainer">
                  {props.trList.map(function (tr, index) {
                    return (
                      <div key={index}>
                        <ListGroup.Item
                          className="stuTRItem"
                          onClick={async () => {
                            await props.선택된TRindex변경(index);
                            history.push(`TR/${tr.이름}/edit/${tr.날짜}`);
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
