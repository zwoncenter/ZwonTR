import "../App.scss";
import "./StuListpage.scss";
import { Button, Card, ListGroup, Modal } from "react-bootstrap";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect } from "react";
import axios from "axios";

function StuListpage(props) {
  let history = useHistory();

  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const [이름, 이름변경] = useState("");
  const [날짜, 날짜변경] = useState(new Date().toISOString().split("T")[0]);
  const [TR조회, TR조회변경] = useState(false);

  useEffect(async () => {
    const result = await axios.get("/api/studentList");
    console.log("/api/studentList result length :", result.data.length);
    props.setstudentList(result.data);
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
                  이름변경(a.이름);
                  handleShow();
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
          <Modal.Title>{이름}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <button className="btn btn-primary me-3">학생DB조회/변경</button>
          <button
            className="btn btn-primary me-3"
            onClick={() => {
              history.push(`/TR/${이름}/${날짜}`);
            }}
          >
            TR작성
          </button>
          <button
            className="btn btn-primary me-3"
            onClick={() => {
              TR조회변경(!TR조회);
            }}
          >
            TR조회/수정
          </button>
        </Modal.Body>
        {TR조회 === true ? (
          <>
            <div className="container text-center">
              <input
                type="date"
                onChange={(e) => {
                  날짜변경(e.target.value);
                }}
              />
            </div>
            <Modal.Footer>
              <Button
                variant="success"
                onClick={() => {
                  history.push(`/TR/${이름}/${날짜}`);
                }}
              >
                조회하기
              </Button>
            </Modal.Footer>
          </>
        ) : null}
      </Modal>
    </div>
  );
}

export default StuListpage;
