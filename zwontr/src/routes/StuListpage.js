import "../App.scss";
import "./StuListpage.scss";
import { Button, Card, ListGroup, Modal } from "react-bootstrap";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect } from "react";
import axios from "axios";

function StuListpage(props) {
  let history = useHistory();

  // 모달창 관련 state 및 함수
  const [show, setShow] = useState(false);
  const handleClose = () => {
    setShow(false);
    TR리스트보임변경(false);
  };
  const handleShow = () => setShow(true);

  // const [날짜, 날짜변경] = useState(new Date().toISOString().split("T")[0]);
  const [TR리스트보임, TR리스트보임변경] = useState(false);

  useEffect(() => {
    axios
      .get("/api/studentList")
      .then(function (result) {
        console.log("/api/studentList result length :", result.data.length);
        props.setstudentList(result.data);
      })
      .catch(function (err) {
        console.log("/api/studentList fail :", err);
      });
  }, []);

  return (
    <div>
      <h1>Zwon 학생 리스트</h1>

      <Card className="stuCard">
        <Button
          variant="secondary"
          onClick={() => {
            if (window.confirm("학생 신규 DB 등록을 진행하시겠습니까?")) {
              history.push("/studentAdd");
            }
          }}
        >
          +
        </Button>
        <ListGroup variant="flush">
          {props.studentList.map(function (a, i) {
            return (
              <ListGroup.Item
                className="pt-3 pb-3"
                key={i}
                onClick={() => {
                  props.선택된index변경(i);
                  handleShow();
                  axios
                    .get(`/api/TR/${a.이름}`)
                    .then(function (result) {
                      result.data.sort(function (a, b) {
                        return +(new Date(a.날짜) < new Date(b.날짜)) - 0.5;
                      });
                      props.settrList(result.data);
                    })
                    .catch(function (err) {
                      console.log("/api/TR/:name fail : ", err);
                    });
                }}
              >
                <p>{a.이름}</p>
              </ListGroup.Item>
            );
          })}
        </ListGroup>
      </Card>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{props.studentList.length !== 0 ? props.studentList[props.선택된index].이름 : ""}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <button
            className="btn btn-primary me-3"
            onClick={() => {
              history.push(`/StudentEdit/${props.studentList[props.선택된index].이름}`);
            }}
          >
            학생DB조회/변경
          </button>
          <button
            className="btn btn-primary me-3"
            onClick={() => {
              TR리스트보임변경(!TR리스트보임);
            }}
          >
            TR(일간하루)
          </button>
        </Modal.Body>
        {TR리스트보임 === true ? (
          <div className="text-center">
            <Button
              className="btn-secondary"
              onClick={() => {
                history.push(`/TR/${props.studentList[props.선택된index].이름}/write`);
              }}
            >
              + 새 TR 작성 +
            </Button>

            <ListGroup variant="flush">
              {props.trList.map(function (a, i) {
                return (
                  <ListGroup.Item
                    className="pt-3 pb-3"
                    key={i}
                    onClick={() => {
                      props.선택된TRindex변경(i);
                      history.push(`TR/${a.이름}/edit/${a.날짜}`);
                    }}
                  >
                    <p>{a.날짜}</p>
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export default StuListpage;
