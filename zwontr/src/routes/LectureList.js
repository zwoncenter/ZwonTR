import { Button, Card, ListGroup, Modal, Table, InputGroup, Form } from "react-bootstrap";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect } from "react";
import axios from "axios";
import "./Lecture.css";

function LectureList() {
  let history = useHistory();

  // 날짜 관련 코드
  const now = new Date(); // 현재 시간
  const utcNow = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const koreaTimeDiff = 9 * 60 * 60 * 1000;
  const koreaNow = new Date(utcNow + koreaTimeDiff);
  const today = koreaNow.toISOString().split("T")[0];

  // 강의 추가 관련 코드
  const [modal, setmodal] = useState(false);
  const modalOpen = () => setmodal(true);
  const modalClose = () => setmodal(false);
  const createNewLecture = () => {
    if (lecture["lectureName"] === "") {
      window.alert("강의명이 입력되지 않았습니다.");
      return;
    }
    if (lecture["manager"] === "") {
      window.alert("담당 매니저가 입력되지 않았습니다.");
      return;
    }
    if (lecture["startday"] === "") {
      window.alert("강의시작일이 입력되지 않았습니다.");
      return;
    }

    axios
      .post(`/api/Lecture`, lecture)
      .then((result) => {
        if (result.data === true) {
          window.location.replace("/Lecture");
        } else if (result.data === "로그인필요") {
          window.alert("로그인이 필요합니다.");
          return history.push("/");
        } else {
          window.alert(result.data);
        }
      })
      .catch((err) => {
        window.alert(err);
      });
  };

  const [lecture, setlecture] = useState({
    lectureID: "",
    lectureName: "",
    manager: "",
    startday: today,
    lastrevise: today,
    students: {},
    studentList: [],
    assignments: {},
    assignKey: 0,
  });

  // 강의 삭제 관련 코드
  const deleteLecture = async (studentList, lectureID) => {
    if (!window.confirm(`${lectureID} 강의를 삭제하시겠습니까?`)) return;
    for (let student of studentList) {
      const stuDB = await axios
        .get(`/api/StudentDB/find/${student}`)
        .then((result) => {
          if (result.data === "로그인필요") {
            window.alert("로그인이 필요합니다.");
            return history.push("/");
          }
          return result["data"];
        })
        .catch((err) => {
          return err;
        });
      // 학생DB에 수강중강의가 있는지, 수강중강의에 해당 lectureID가 존재하는지부터 확인해야하긴 함.

      await stuDB["수강중강의"].splice(stuDB["수강중강의"].indexOf(lectureID), 1);
      console.log(stuDB["수강중강의"]);
      axios
        .put("/api/StudentDB/edit", stuDB)
        .then(function (result) {
          if (result.data === "로그인필요") {
            window.alert("로그인이 필요합니다.");
          }
        })
        .catch(function (err) {
          window.alert("저장에 실패했습니다 개발/데이터 팀에게 문의해주세요");
        });
    }
    axios
      .delete(`/api/Lecture/${lectureID}`)
      .then((result) => {
        if (result.data === true) {
          window.alert("삭제되었습니다");
          return window.location.replace("/Lecture");
        } else {
          window.alert(result.data);
        }
      })
      .catch((err) => {
        window.alert(`삭제에 실패했습니다. ${err}`);
      });
  };

  // 매니저리스트 관련 코드
  const [managerList, setmanagerList] = useState([]);

  // 강의리스트 관련 코드
  const [lectureList, setlectureList] = useState([]);

  useEffect(async () => {
    const newmanagerList = await axios
      .get("/api/managerList")
      .then((result) => {
        return result["data"];
      })
      .catch((err) => {
        return err;
      });
    setmanagerList(newmanagerList);

    const newlectureList = await axios
      .get("/api/Lecture")
      .then((result) => {
        return result["data"];
      })
      .catch((err) => {
        return window.alert(err);
      });
    setlectureList(newlectureList);
  }, []);

  return (
    <div className="background text-center">
      <h1 className="mt-3 fw-bold">강의 관리</h1>
      <Button
        variant="success"
        onClick={() => {
          modalOpen();
        }}
      >
        강의 추가
      </Button>

      {/* 강의 생성 Modal */}
      <Modal show={modal} onHide={modalClose}>
        <Modal.Header closeButton>
          <Modal.Title>강의 추가</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <InputGroup className="mb-3">
            <InputGroup.Text> 강의명</InputGroup.Text>
            <Form.Control
              placeholder="강의명을 입력해주세요"
              onChange={(e) => {
                const newlecture = JSON.parse(JSON.stringify(lecture));
                newlecture["lectureName"] = e.target.value;
                if (newlecture["lectureName"] !== "" && newlecture["manager"] !== "" && newlecture["startday"] !== "") {
                  newlecture["lectureID"] =
                    newlecture["lectureName"] +
                    "_" +
                    newlecture["manager"] +
                    "_" +
                    newlecture["startday"].slice(2, 4) +
                    newlecture["startday"].slice(5, 7) +
                    newlecture["startday"].slice(8, 10);
                }
                setlecture(newlecture);
              }}
            />
          </InputGroup>

          <InputGroup className="mb-3">
            <InputGroup.Text>매니저(강사)</InputGroup.Text>
            <Form.Select
              onChange={(e) => {
                const newlecture = JSON.parse(JSON.stringify(lecture));
                newlecture["manager"] = e.target.value;
                if (newlecture["lectureName"] !== "" && newlecture["manager"] !== "" && newlecture["startday"] !== "") {
                  newlecture["lectureID"] =
                    newlecture["lectureName"] +
                    "_" +
                    newlecture["manager"] +
                    "_" +
                    newlecture["startday"].slice(2, 4) +
                    newlecture["startday"].slice(5, 7) +
                    newlecture["startday"].slice(8, 10);
                }
                setlecture(newlecture);
              }}
            >
              <option value="">선택</option>
              {managerList.map((manager, idx) => {
                return (
                  <option value={manager} key={idx}>
                    {manager}
                  </option>
                );
              })}
            </Form.Select>
          </InputGroup>

          <InputGroup className="mb-3">
            <InputGroup.Text>강의시작일</InputGroup.Text>
            <Form.Control
              type="date"
              value={lecture["startday"]}
              onChange={(e) => {
                const newlecture = JSON.parse(JSON.stringify(lecture));
                newlecture["startday"] = e.target.value;
                if (newlecture["lectureName"] !== "" && newlecture["manager"] !== "" && newlecture["startday"] !== "") {
                  newlecture["lectureID"] =
                    newlecture["lectureName"] +
                    "_" +
                    newlecture["manager"] +
                    "_" +
                    newlecture["startday"].slice(2, 4) +
                    newlecture["startday"].slice(5, 7) +
                    newlecture["startday"].slice(8, 10);
                }
                setlecture(newlecture);
              }}
            />
          </InputGroup>

          <Button
            variant="success"
            onClick={() => {
              createNewLecture();
            }}
          >
            강의 생성
          </Button>
        </Modal.Body>
      </Modal>
      <div className="row w-50 m-auto">
        {lectureList.map((element, idx) => {
          return (
            <div className="col-3">
              <Card
                className="mt-2 "
                key={idx}
                onClick={() => {
                  history.push(`/Lecture/${element["lectureID"]}`);
                }}
              >
                <Card.Header as="h5">{element["lectureName"]}</Card.Header>
                <Card.Body>
                  <div className="text-start">
                    <Card.Text>강의명 : {element["lectureName"]}</Card.Text>
                    <Card.Text>매니저 : {element["manager"]}</Card.Text>
                    <Card.Text>수강생 : {element["studentList"].length}명</Card.Text>
                  </div>

                  <Button
                    className="btn-del m-auto"
                    variant="danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteLecture(element["studentList"], element["lectureID"]);
                    }}
                  >
                    x
                  </Button>
                </Card.Body>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LectureList;
