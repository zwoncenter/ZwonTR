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

  //
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
    <div>
      <h1>Zwon 학생 리스트</h1>
      <Card className="stuCard">
        <Button variant="secondary" onClick={addClick}>
          +
        </Button>
        <ListGroup variant="flush">
          {ready
            ? props.studentList.map(function (db, index) {
                return (
                  <ListGroup.Item
                    className="pt-3 pb-3"
                    key={index}
                    onClick={() => {
                      nameClick(db, index);
                    }}
                  >
                    <p>{db.이름}</p>
                  </ListGroup.Item>
                );
              })
            : null}
        </ListGroup>
      </Card>

      <Modal show={modalShow} onHide={modalClose}>
        <Modal.Header closeButton>
          <Modal.Title>{ready ? props.studentList[props.선택된index].이름 : ""}</Modal.Title>
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
              setTRlistShow(!TRlistShow);
            }}
          >
            TR(일간하루)
          </button>
        </Modal.Body>
        {TRlistShow === true ? (
          <div className="text-center mb-3">
            <Button
              className="btn-secondary"
              onClick={() => {
                history.push(`/TR/${props.studentList[props.선택된index].이름}/write`);
              }}
            >
              + 새 TR 작성 +
            </Button>

            <ListGroup variant="flush">
              {props.trList.map(function (tr, index) {
                return (
                  <ListGroup.Item
                    className="pt-3"
                    key={index}
                    onClick={async () => {
                      await props.선택된TRindex변경(index);
                      history.push(`TR/${tr.이름}/edit/${tr.날짜}`);
                    }}
                  >
                    <p>{tr.날짜}</p>
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
