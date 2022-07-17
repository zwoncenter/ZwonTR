import { Form, Button, Card, ListGroup, Table, Modal, Row, Col, Accordion, InputGroup, FormControl } from "react-bootstrap";
import { useHistory, useParams } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import TimePicker from "react-time-picker";
import "./Classpage.css";

function Classpage() {
  let history = useHistory();
  const [managerList, setmanagerList] = useState([]);
  const [stuDBList, setstuDBList] = useState([]);

  // 날짜 관련 코드
  const now = new Date(); // 현재 시간
  const utcNow = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const koreaTimeDiff = 9 * 60 * 60 * 1000;
  const koreaNow = new Date(utcNow + koreaTimeDiff);
  const today = koreaNow.toISOString().split("T")[0];

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
      const newlecture = JSON.parse(JSON.stringify(lecture));
      newlecture["studentList"].push(newname);
      newlecture["students"][newname] = {
        진행중과제: [],
        완료된과제: [],
      };
      setlecture(newlecture);

    //   const stuDB = await axios
    //     .get(`/api/StudentDB/find/${newname}`)
    //     .then((result) => {
    //       if (result.data === "로그인필요") {
    //         window.alert("로그인이 필요합니다.");
    //         return history.push("/");
    //       }
    //       return result["data"];
    //     })
    //     .catch((err) => {
    //       return err;
    //     });
    //   console.log("수강중강의" in stuDB);
    //   if (!("수강중강의" in stuDB)) {
    //     stuDB["수강중강의"] = [];
    //   }
    //   await stuDB["수강중강의"].push(newlecture["lectureID"]);
    //   console.log(stuDB["수강중강의"]);
    //   axios
    //     .put("/api/StudentDB/edit", stuDB)
    //     .then(function (result) {
    //       if (result.data === "로그인필요") {
    //         window.alert("로그인이 필요합니다.");
    //       }
    //     })
    //     .catch(function (err) {
    //       window.alert("저장에 실패했습니다 개발/데이터 팀에게 문의해주세요");
    //     });
    }
  };
  const studentDelete = async (deletename) => {
    if (!deletename.match(/[ㄱ-ㅎ가-힣]+_[0-9]{6}/)) {
      window.alert("입력된 값이 ID 형식이 아닙니다. (이름_생년월일)");
      return;
    }
    if (window.confirm(`${deletename}을 수강생에서 삭제하시겠습니까?`)) {
      if (!lecture["studentList"].includes(deletename)) {
        window.alert(`${deletename}이 수강생으로 등록되어 있지 않습니다.`);
        return;
      }
      const newlecture = JSON.parse(JSON.stringify(lecture));
      newlecture["studentList"].splice(newlecture["studentList"].indexOf(deletename), 1);
      delete newlecture["students"][newname];
      setlecture(newlecture);

      const stuDB = await axios
        .get(`/api/StudentDB/find/${newname}`)
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
      await stuDB["수강중강의"].splice(stuDB["수강중강의"].indexOf(newlecture["lectureID"]), 1);
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
  };

  // 강의 state
  const [lecture, setlecture] = useState({
    lectureID: "",
    lectureName: "",
    teacherName: "",
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

    const newlecture = {
      lectureID: "빠바_220713",
      lectureName: "빠른독해 바른독해",
      teacherName: "유장훈",
      students: {
        윤찬영_070719: {
          진행중과제: [1, 2, 3],
          완료된과제: [4, 5, 6],
        },
        최지우_061108: {
          진행중과제: [1, 2, 3, 4],
          완료된과제: [5, 6],
        },
      },
      studentList: ["윤찬영_070719", "최지우_061108"],
      assignments: {
        1: {
          과제내용: "과제1",
          과제기한: "2022-07-14",
        },
        2: {
          과제내용: "과제2",
          과제기한: "2022-07-15",
        },
        3: {
          과제내용: "과제3",
          과제기한: "2022-07-16",
        },
        4: {
          과제내용: "과제4",
          과제기한: "2022-07-17",
        },
        5: {
          과제내용: "과제5",
          과제기한: "2022-07-18",
        },
        6: {
          과제내용: "과제6",
          과제기한: "2022-07-19",
        },
      },
      assignKey: 7,
    };
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
      {/* <p>강의ID : {lecture["lectureID"]}</p> */}
      <h2>강의명 : {lecture["lectureName"]}</h2>
      <h4>강사 : {lecture["teacherName"]}</h4>

      

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

      <div className="row">
        <div className="col-9">
        <Button
        className="mt-3 mb-3"
        onClick={() => {
          namemodalOpen();
        }}
      >
        학생 추가
      </Button>
          <div className="row">
            {lecture["studentList"].map((student, index) => {
              return (
                <div className="col-4" key={index}>
                  <p>이름 : {student}</p>
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
                                {lecture["assignments"][assign]["과제내용"]} / {lecture["assignments"][assign]["과제기한"]}
                              </p>
                              {/* <p>과제내용 : {lecture["assignments"][assign]["과제내용"]}</p>
                            <p>과제기한 : {lecture["assignments"][assign]["과제기한"]}</p> */}
                            </ul>
                          );
                        })}
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>
                  <Accordion className="mt-3">
                    <Accordion.Item eventKey="0">
                      <Accordion.Header>
                        <p>완료된 과제({lecture["students"][student]["완료된과제"].length})</p>
                      </Accordion.Header>
                      <Accordion.Body>
                        {lecture["students"][student]["완료된과제"].map((assign, idx) => {
                          return (
                            <ul key={idx}>
                              <p>
                                {lecture["assignments"][assign]["과제내용"]} / {lecture["assignments"][assign]["과제기한"]}
                              </p>
                              {/* <p>과제내용 : {lecture["assignments"][assign]["과제내용"]}</p>
                            <p>과제기한 : {lecture["assignments"][assign]["과제기한"]}</p> */}
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
        <div className="col-3">
        <Button className="mt-3">과제 추가</Button>
          {Object.keys(lecture["assignments"]).map((assignID, index) => {
            return (
              <ul>
                <p>
                  {lecture["assignments"][assignID]["과제내용"]} / {lecture["assignments"][assignID]["과제기한"]}{" "}
                </p>
              </ul>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Classpage;
