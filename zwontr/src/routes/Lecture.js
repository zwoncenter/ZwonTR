import { Form, Button, Card, ListGroup, Table, Modal, Row, Col, Accordion, InputGroup, FormControl } from "react-bootstrap";
import { useHistory, useParams } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import TimePicker from "react-time-picker";
import "./Lecture.css";
import { FaPencilAlt, FaTimes, FaCheck, FaUndo } from "react-icons/fa";

function Lecture() {
  let history = useHistory();
  const paramID = useParams()["lectureID"];
  const [managerList, setmanagerList] = useState([]);
  const [stuDBList, setstuDBList] = useState([]);

  // 날짜 관련 코드
  const now = new Date(); // 현재 시간
  const utcNow = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const koreaTimeDiff = 9 * 60 * 60 * 1000;
  const koreaNow = new Date(utcNow + koreaTimeDiff);
  const today = koreaNow.toISOString().split("T")[0];

  // lecture 수정 관련 코드
  const updatelecture = async (newlecture) => {
    // 기존 lecture Load
    const existlecture = await axios
      .get(`/api/Lecture/${newlecture["lectureID"]}`)
      .then((result) => {
        if (result.data === "로그인필요") {
          window.alert("로그인이 필요합니다.");
          return window.push("/");
        }
        return result["data"];
      })
      .catch((err) => {
        return window.alert(err);
      });

    // 둘의 version이 다를 경우, 강제로 새로고침
    if (existlecture["version"] !== newlecture["version"]) {
      window.alert("업데이트 사항이 있어 새로고침 합니다.");
      return window.location.replace(`/Lecture/${newlecture["lectureID"]}`);
    }

    // 최근수정일과 version 변경
    newlecture["lastrevise"] = today;
    newlecture["version"] += 1;

    // lecture document 수정
    axios
      .put(`/api/Lecture`, newlecture)
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
        window.alert("저장에 실패했습니다. 개발/데이터 팀에게 문의해주세요", err);
      });
  };

  // 학생 추가 관련 코드
  const [newname, setnewname] = useState("");
  const [namemodal, setnamemodal] = useState(false);
  const [filteredstuDBList, setfilteredstuDBList] = useState([]);

  const namemodalOpen = () => setnamemodal(true);
  const namemodalClose = () => {
    setnamemodal(false);
    setnewname("");
  };

  const studentAdd = async () => {
    if (!newname.match(/[ㄱ-ㅎ가-힣]+_[0-9]{6}/)) {
      window.alert("입력된 값이 ID 형식이 아닙니다. (이름_생년월일)");
      return;
    }
    if (window.confirm(`${newname}을 수강생으로 등록하시겠습니까?`)) {
      if (lecture["studentList"].includes(newname)) {
        window.alert(`${newname} 학생은 이미 수강생으로 등록되어 있습니다.`);
        setnewname("");
        return;
      }
      // lecture 수정
      const newlecture = JSON.parse(JSON.stringify(lecture));
      newlecture["studentList"].push(newname);
      newlecture["students"][newname] = {
        진행중과제: [],
        완료된과제: [],
      };
      setlecture(newlecture);
      updatelecture(newlecture);

      // stuDB 수정
      const stuDB = await axios
        .get(`/api/StudentDB/${newname}`)
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
      // 수강중강의라는 key가 stuDB에 없는 경우, 추가해준다.
      if (!("수강중강의" in stuDB)) {
        stuDB["수강중강의"] = [];
      }
      await stuDB["수강중강의"].push(newlecture["lectureID"]);
      axios
        .put("/api/StudentDB", stuDB)
        .then(function (result) {
          if (result.data === true) {
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
          window.alert("저장에 실패했습니다 개발/데이터 팀에게 문의해주세요", err);
        });
      setnewname("");
    }
  };

  // 학생 삭제 관련 코드
  const studentDelete = async (deletename) => {
    if (!deletename.match(/[ㄱ-ㅎ가-힣]+_[0-9]{6}/)) {
      window.alert("입력된 값이 ID 형식이 아닙니다. (이름_생년월일)");
      return;
    }
    if (!window.confirm(`${deletename}을 수강생에서 삭제하시겠습니까? \n해당 학생의 진행중과제/완료된과제가 전부 삭제됩니다.`)) {
      return;
    }
    if (!lecture["studentList"].includes(deletename)) {
      window.alert(`${deletename}이 수강생으로 등록되어 있지 않습니다.`);
      return;
    }
    const newlecture = JSON.parse(JSON.stringify(lecture));
    // studentList와 students에서 모두 삭제.
    newlecture["studentList"].splice(newlecture["studentList"].indexOf(deletename), 1);
    delete newlecture["students"][newname];
    setlecture(newlecture);
    updatelecture(newlecture);

    const stuDB = await axios
      .get(`/api/StudentDB/${newname}`)
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
    // 학생DB에 수강중강의가 있고, 수강중강의에 해당 lectureID가 존재하는지부터 확인 후 제거
    if ("수강중강의" in stuDB && stuDB["수강중강의"].includes(newlecture["lectureID"])) {
      await stuDB["수강중강의"].splice(stuDB["수강중강의"].indexOf(newlecture["lectureID"]), 1);
    }
    axios
      .put("/api/StudentDB", stuDB)
      .then(function (result) {
        if (result.data === true) {
          window.alert("삭제되었습니다.");
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
        window.alert("저장에 실패했습니다 개발/데이터 팀에게 문의해주세요");
      });
  };

  // 과제 추가 관련 코드
  const [newassign, setnewassign] = useState("");
  const [newassigndate, setnewassigndate] = useState("");
  const [assignmodal, setassignmodal] = useState(false);
  const [assignstudents, setassignstudents] = useState([]);
  const [checkall, setcheckall] = useState(true);
  const assignmodalOpen = () => {
    setassignmodal(true);
    setassignstudents(Array.from({ length: lecture["studentList"].length }, () => true));
    setcheckall(true);
  };
  const assignmodalClose = () => {
    setassignmodal(false);
    setnewassign("");
  };

  const assignAdd = () => {
    // 학생을 선택하지 않은 경우
    if (!assignstudents.includes(true)) {
      window.alert("과제를 부여할 최소 1명 이상의 학생을 선택해야 합니다.");
      return;
    }
    if (!newassign) {
      window.alert("과제 내용을 작성해야 합니다.");
      return;
    }
    if (!newassigndate) {
      window.alert("과제 마감일을 선택해야 합니다.");
      return;
    }
    if (!window.confirm("선택한 학생들에게 과제를 부여하시겠습니까?")) {
      return;
    }

    const newlecture = JSON.parse(JSON.stringify(lecture));
    newlecture["assignments"][newlecture["assignKey"]] = {
      과제내용: newassign,
      과제기한: newassigndate,
    };
    for (let i = 0; i < newlecture["studentList"].length; i++) {
      if (assignstudents[i]) {
        const tmpstudent = newlecture["studentList"][i];
        newlecture["students"][tmpstudent]["진행중과제"].push(newlecture["assignKey"]);
        newlecture["students"][tmpstudent]["진행중과제"].sort((a, b) => {
          return +(newlecture["assignments"][a]["과제기한"] > newlecture["assignments"][b]["과제기한"]) - 0.5;
        });
      }
    }
    newlecture["assignKey"] = newlecture["assignKey"] + 1;
    setlecture(newlecture);
    updatelecture(newlecture);
    setnewassign("");
    setnewassigndate("");
  };

  // 과제 수정 관련 코드
  const [selectedAssign, setselectedAssign] = useState(-1);
  const [updateassign, setupdateassign] = useState("");
  const [updateassigndate, setupdateassigndate] = useState("");
  const [assignupdatemodal, setassignupdatemodal] = useState(false);
  const assignupdatemodalOpen = () => {
    setassignupdatemodal(true);
  };
  const assignupdatemodalClose = () => {
    setassignupdatemodal(false);
    setselectedAssign(-1);
    setupdateassign("");
    setupdateassigndate("");
  };

  const assignupdate = () => {
    if (!window.confirm(`기존 과제(${lecture["assignments"][selectedAssign]["과제내용"]})를 변경하시겠습니까?`)) return;
    const newlecture = JSON.parse(JSON.stringify(lecture));
    newlecture["assignments"][selectedAssign]["과제내용"] = updateassign;
    newlecture["assignments"][selectedAssign]["과제기한"] = updateassigndate;
    setlecture(newlecture);
    updatelecture(newlecture);
    assignupdatemodalClose();
  };

  useEffect(() => {
    if (selectedAssign in lecture["assignments"]) {
      setupdateassign(lecture["assignments"][selectedAssign]["과제내용"]);
      setupdateassigndate(lecture["assignments"][selectedAssign]["과제기한"]);
    }
  }, [selectedAssign]);

  // 과제 삭제 관련 코드
  const assignDelete = (assignID) => {
    if (!window.confirm("선택한 과제를 삭제하시겠습니까?")) {
      return;
    }
    const tmplist = [];
    const newlecture = JSON.parse(JSON.stringify(lecture));
    delete newlecture["assignments"][assignID];
    for (const student in newlecture["students"]) {
      // 진행중과제에 있는 경우에는, indexOf로 찾아서 삭제
      if (newlecture["students"][student]["진행중과제"].includes(parseInt(assignID))) {
        newlecture["students"][student]["진행중과제"].splice(newlecture["students"][student]["진행중과제"].indexOf(parseInt(assignID)), 1);
      } // 완료된과제에 있는 경우에는, indexOf로 찾을 수 없으므로, 반복문을 통해서 찾아낸 후 삭제
      else {
        for (let i = 0; i < newlecture["students"][student]["완료된과제"].length; i++) {
          if (newlecture["students"][student]["완료된과제"][i][0] === parseInt(assignID)) {
            newlecture["students"][student]["완료된과제"].splice(i, 1);
            break;
          }
        }
      }
    }
    setlecture(newlecture);
    updatelecture(newlecture);
  };

  // 강의 state
  const [lecture, setlecture] = useState({
    lectureID: "",
    lectureName: "",
    manager: "",
    startday: "",
    lastrevise: "",
    students: {},
    studentList: [],
    assignments: {},
    assignKey: 0,
  });

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
    setstuDBList(newstudentDBlist);

    const newlecture = await axios
      .get(`/api/Lecture/${paramID}`)
      .then((result) => {
        if (result.data === "로그인필요") {
          window.alert("로그인이 필요합니다.");
          return window.push("/");
        }
        return result["data"];
      })
      .catch((err) => {
        return window.alert(err);
      });
    setlecture(newlecture);
  }, []);

  useEffect(() => {
    setfilteredstuDBList(
      stuDBList.filter((studb) => {
        return studb["ID"].includes(newname);
      })
    );
  }, [newname]);

  return (
    <div className="background">
      <h1 className="fw-bold">강의명 : {lecture["lectureName"]}</h1>
      <h4 className="fw-bold">강사 : {lecture["manager"]}</h4>

      <Modal show={namemodal} onHide={namemodalClose}>
        <Modal.Header closeButton>
          <Modal.Title>학생 추가</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <InputGroup className="mt-3 mb-3" style={{ maxWidth: "500px", margin: "auto" }}>
            <FormControl
              value={newname}
              placeholder="학생의 이름을 입력"
              onChange={(e) => {
                setnewname(e.target.value);
              }}
            />
            <Button className="btn-secondary program-add" onClick={studentAdd} type="button">
              <strong>+</strong>
            </Button>
          </InputGroup>

          {newname.length >= 10
            ? null
            : newname.length >= 1
            ? filteredstuDBList.map(function (db, index) {
                return (
                  <ListGroup.Item
                    // className="stuList"
                    onClick={() => {
                      setnewname(db.ID);
                    }}
                    key={index}
                  >
                    <p className="p-0 m-0">{db.ID}</p>
                  </ListGroup.Item>
                );
              })
            : null}
        </Modal.Body>
      </Modal>

      <Modal show={assignmodal} onHide={assignmodalClose}>
        <Modal.Header closeButton>
          <Modal.Title>과제 추가</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <div className="row mb-2">
            <div className="col-3">과제 내용</div>
            <div className="col-9">
              <input
                className="w-100"
                type="text"
                value={newassign}
                placeholder="과제 내용을 입력"
                onChange={(e) => {
                  setnewassign(e.target.value);
                }}
              />
            </div>
          </div>

          <div className="row mb-2">
            <div className="col-3">과제 기한</div>
            <div className="col-9">
              <input
                type="date"
                value={newassigndate}
                className="w-100"
                onChange={(e) => {
                  setnewassigndate(e.target.value);
                }}
              />
            </div>
          </div>
          <div className="check-all w-100 mb-3">
            <Form.Check
              className="w-50"
              type="checkbox"
              label="전체선택"
              checked={checkall}
              onChange={() => {
                if (checkall === false) {
                  setassignstudents(Array.from({ length: lecture["studentList"].length }, () => true));
                  setcheckall(true);
                } else {
                  setassignstudents(Array.from({ length: lecture["studentList"].length }, () => false));
                  setcheckall(false);
                }
              }}
            />
          </div>

          <div className="row">
            {lecture["studentList"].map((name, idx) => {
              return (
                <div className="col-3" key={idx}>
                  <Form.Check
                    type="checkbox"
                    label={name}
                    checked={assignstudents[idx]}
                    onChange={() => {
                      const newls = [...assignstudents];
                      newls[idx] = !newls[idx];
                      setassignstudents(newls);
                      if (newls.includes(false)) {
                        setcheckall(false);
                      } else {
                        setcheckall(true);
                      }
                    }}
                  />
                </div>
              );
            })}
          </div>

          <Button className="btn-secondary program-add" onClick={assignAdd} type="button">
            <strong>+</strong>
          </Button>
        </Modal.Body>
      </Modal>

      <Modal show={assignupdatemodal} onHide={assignupdatemodalClose}>
        <Modal.Header closeButton>
          <Modal.Title>과제 수정</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <div className="row mb-2">
            <div className="col-3">과제 내용</div>
            <div className="col-9">
              <input
                className="w-100"
                type="text"
                value={updateassign}
                placeholder="과제 내용을 입력"
                onChange={(e) => {
                  setupdateassign(e.target.value);
                }}
              />
            </div>
          </div>

          <div className="row mb-2">
            <div className="col-3">과제 기한</div>
            <div className="col-9">
              <input
                type="date"
                value={updateassigndate}
                className="w-100"
                onChange={(e) => {
                  setupdateassigndate(e.target.value);
                }}
              />
            </div>
          </div>

          <Button className="btn-secondary program-add" onClick={assignupdate} type="button">
            <strong>
              <FaPencilAlt></FaPencilAlt>
            </strong>
          </Button>
        </Modal.Body>
      </Modal>

      <div className="row">
        {/* 학생리스트 */}
        <div className="col-md-9">
          <Button
            variant="dark"
            className="mt-3 mb-3"
            onClick={() => {
              namemodalOpen();
            }}
          >
            학생 추가
          </Button>
          <div className="row">
              <h4 className="text-light bg-dark">과제 O</h4>
                {lecture["studentList"]
                  .filter((student) => lecture["students"][student]["진행중과제"].length !== 0)
                  .map((student, index) => {
                    return (
                      <div className="col-md-3" key={index}>
                        <p className="fs-5">
                          이름 : {student}
                          <Button
                            onClick={() => {
                              studentDelete(student);
                            }}
                            variant="danger"
                            className="btn-sm ms-2"
                          >
                            <FaTimes />
                          </Button>
                        </p>
                        <Accordion defaultActiveKey="0">
                          <Accordion.Item eventKey="0">
                            <Accordion.Header>
                              <p>진행중 과제({lecture["students"][student]["진행중과제"].length})</p>
                            </Accordion.Header>
                            <Accordion.Body>
                              {lecture["students"][student]["진행중과제"].map((assign, idx) => {
                                return (
                                  <ul key={idx}>
                                    <p>
                                      {lecture["assignments"][assign]["과제내용"]} /
                                      <p
                                        className={
                                          today < lecture["assignments"][assign]["과제기한"]
                                            ? "after"
                                            : today == lecture["assignments"][assign]["과제기한"]
                                            ? "now"
                                            : "before"
                                        }
                                      >
                                        {lecture["assignments"][assign]["과제기한"]}
                                      </p>
                                      <Button
                                        className="ms-2 btn-sm"
                                        onClick={() => {
                                          if (!window.confirm("과제를 완료 처리하시겠습니까?")) {
                                            return;
                                          }
                                          const newlecture = JSON.parse(JSON.stringify(lecture));
                                          newlecture["students"][student]["진행중과제"].splice(idx, 1);
                                          newlecture["students"][student]["완료된과제"].push([assign, today]);
                                          setlecture(newlecture);
                                          updatelecture(newlecture);
                                        }}
                                      >
                                        <FaCheck></FaCheck>
                                      </Button>
                                    </p>
                                  </ul>
                                );
                              })}
                            </Accordion.Body>
                          </Accordion.Item>
                          <Accordion.Item eventKey="1">
                            <Accordion.Header>
                              <p>완료된 과제({lecture["students"][student]["완료된과제"].length})</p>
                            </Accordion.Header>
                            <Accordion.Body>
                              {lecture["students"][student]["완료된과제"].map((assign, idx) => {
                                return (
                                  <ul key={idx}>
                                    <p>
                                      {lecture["assignments"][assign[0]]["과제내용"]} /
                                      <p className={assign[1] <= lecture["assignments"][assign[0]]["과제기한"] ? "after" : "before"}>
                                        {lecture["assignments"][assign[0]]["과제기한"]}
                                      </p>{" "}
                                      / {assign[1]}
                                      <Button
                                        className="ms-2 btn-sm"
                                        onClick={() => {
                                          if (!window.confirm("과제를 완료해제 처리하시겠습니까? \n기록된 완료날짜가 삭제됩니다.")) {
                                            return;
                                          }
                                          const newlecture = JSON.parse(JSON.stringify(lecture));
                                          newlecture["students"][student]["완료된과제"].splice(idx, 1);
                                          newlecture["students"][student]["진행중과제"].push(assign[0]);
                                          newlecture["students"][student]["진행중과제"].sort((a, b) => {
                                            return +(newlecture["assignments"][a]["과제기한"] > newlecture["assignments"][b]["과제기한"]) - 0.5;
                                          });
                                          setlecture(newlecture);
                                          updatelecture(newlecture);
                                        }}
                                      >
                                        <FaUndo></FaUndo>
                                      </Button>
                                    </p>
                                  </ul>
                                );
                              })}
                            </Accordion.Body>
                          </Accordion.Item>
                        </Accordion>
                      </div>
                    );
                  })}
              <h4 className="text-light bg-dark mt-4">과제 X</h4>
            {lecture["studentList"]
              .filter((student) => lecture["students"][student]["진행중과제"].length === 0)
              .map((student, index) => {
                return (
                  <div className="col-md-3" key={index}>
                    <p className="fs-5">
                      이름 : {student}
                      <Button
                        onClick={() => {
                          studentDelete(student);
                        }}
                        variant="danger"
                        className="btn-sm ms-2"
                      >
                        <FaTimes />
                      </Button>
                    </p>
                    <Accordion>
                      <Accordion.Item eventKey="0">
                        <Accordion.Header>
                          <p>진행중 과제({lecture["students"][student]["진행중과제"].length})</p>
                        </Accordion.Header>
                        <Accordion.Body>
                          {lecture["students"][student]["진행중과제"].map((assign, idx) => {
                            return (
                              <ul key={idx}>
                                <p>
                                  {lecture["assignments"][assign]["과제내용"]} /
                                  <p
                                    className={
                                      today < lecture["assignments"][assign]["과제기한"]
                                        ? "after"
                                        : today == lecture["assignments"][assign]["과제기한"]
                                        ? "now"
                                        : "before"
                                    }
                                  >
                                    {lecture["assignments"][assign]["과제기한"]}
                                  </p>
                                  <Button
                                    className="ms-2 btn-sm"
                                    onClick={() => {
                                      if (!window.confirm("과제를 완료 처리하시겠습니까?")) {
                                        return;
                                      }
                                      const newlecture = JSON.parse(JSON.stringify(lecture));
                                      newlecture["students"][student]["진행중과제"].splice(idx, 1);
                                      newlecture["students"][student]["완료된과제"].push([assign, today]);
                                      setlecture(newlecture);
                                      updatelecture(newlecture);
                                    }}
                                  >
                                    <FaCheck></FaCheck>
                                  </Button>
                                </p>
                              </ul>
                            );
                          })}
                        </Accordion.Body>
                      </Accordion.Item>
                      <Accordion.Item eventKey="1">
                        <Accordion.Header>
                          <p>완료된 과제({lecture["students"][student]["완료된과제"].length})</p>
                        </Accordion.Header>
                        <Accordion.Body>
                          {lecture["students"][student]["완료된과제"].map((assign, idx) => {
                            return (
                              <ul key={idx}>
                                <p>
                                  {lecture["assignments"][assign[0]]["과제내용"]} /
                                  <p className={assign[1] <= lecture["assignments"][assign[0]]["과제기한"] ? "after" : "before"}>
                                    {lecture["assignments"][assign[0]]["과제기한"]}
                                  </p>{" "}
                                  / {assign[1]}
                                  <Button
                                    className="ms-2 btn-sm"
                                    onClick={() => {
                                      if (!window.confirm("과제를 완료해제 처리하시겠습니까? \n기록된 완료날짜가 삭제됩니다.")) {
                                        return;
                                      }
                                      const newlecture = JSON.parse(JSON.stringify(lecture));
                                      newlecture["students"][student]["완료된과제"].splice(idx, 1);
                                      newlecture["students"][student]["진행중과제"].push(assign[0]);
                                      newlecture["students"][student]["진행중과제"].sort((a, b) => {
                                        return +(newlecture["assignments"][a]["과제기한"] > newlecture["assignments"][b]["과제기한"]) - 0.5;
                                      });
                                      setlecture(newlecture);
                                      updatelecture(newlecture);
                                    }}
                                  >
                                    <FaUndo></FaUndo>
                                  </Button>
                                </p>
                              </ul>
                            );
                          })}
                        </Accordion.Body>
                      </Accordion.Item>
                    </Accordion>
                  </div>
                );
              })}
          </div>
        </div>

        {/* 과제리스트 */}
        <div className="col-md-3">
          <Button
            variant="dark"
            className="mt-3 mb-3"
            onClick={() => {
              assignmodalOpen();
            }}
          >
            과제 추가
          </Button>
          <ListGroup></ListGroup>
          {Object.keys(lecture["assignments"])
            .reverse()
            .map((assignID, index) => {
              return (
                <ListGroup.Item key={index}>
                  <p>
                    {lecture["assignments"][assignID]["과제내용"]} / {lecture["assignments"][assignID]["과제기한"]}{" "}
                    <Button
                      className="btn-sm ms-1"
                      variant="secondary"
                      onClick={() => {
                        setselectedAssign(assignID);
                        assignupdatemodalOpen();
                      }}
                    >
                      <FaPencilAlt></FaPencilAlt>
                    </Button>
                    <Button
                      className="btn-sm ms-1"
                      variant="danger"
                      onClick={() => {
                        assignDelete(assignID);
                      }}
                    >
                      <FaTimes></FaTimes>
                    </Button>
                  </p>
                </ListGroup.Item>
              );
            })}
        </div>
      </div>
    </div>
  );
}

export default Lecture;
