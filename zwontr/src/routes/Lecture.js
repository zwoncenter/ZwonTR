import { Form, Button, ListGroup, Modal, Accordion, InputGroup, FormControl } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";
import { useHistory, useParams } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import TimePicker from "react-time-picker";
import "./Lecture.css";
import { FaPencilAlt, FaTimes, FaCheck, FaUndo } from "react-icons/fa";
// import Accordion from 'react-bootstrap/Accordion';
import { useAccordionButton } from "react-bootstrap/AccordionButton";
import Card from "react-bootstrap/Card";

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
      if (!("_id" in lecture)) {
        window.alert("다시 시도해주세요");
        return;
      }
      if (!stuDBList.map((e, i) => e["ID"]).includes(newname)) {
        window.alert("등록되지 않은 학생입니다");
        return;
      }
      axios
        .post(`/api/StudentOfLecture`, { lectureID: lecture["_id"], studentID: stuDBList.filter((e, idx) => e["ID"] === newname)[0]["_id"] })
        .then((result) => {
          if (result.data === true) {
            return window.location.reload();
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
      // if (lecture["studentList"].includes(newname)) {
      //   window.alert(`${newname} 학생은 이미 수강생으로 등록되어 있습니다.`);
      //   setnewname("");
      //   return;
      // }
      // // lecture 수정
      // const newlecture = JSON.parse(JSON.stringify(lecture));
      // newlecture["studentList"].push(newname);
      // newlecture["students"][newname] = {
      //   진행중과제: [],
      //   완료된과제: [],
      // };
      // setlecture(newlecture);
      // updatelecture(newlecture);

      // // stuDB 수정
      // const stuDB = await axios
      //   .get(`/api/StudentDB/${newname}`)
      //   .then((result) => {
      //     if (result.data === "로그인필요") {
      //       window.alert("로그인이 필요합니다.");
      //       return history.push("/");
      //     }
      //     return result["data"];
      //   })
      //   .catch((err) => {
      //     return err;
      //   });
      // // 수강중강의라는 key가 stuDB에 없는 경우, 추가해준다.
      // if (!("수강중강의" in stuDB)) {
      //   stuDB["수강중강의"] = [];
      // }
      // await stuDB["수강중강의"].push(newlecture["lectureID"]);
      // axios
      //   .put("/api/StudentDB", stuDB)
      //   .then(function (result) {
      //     if (result.data === true) {
      //       return window.location.reload();
      //     } else if (result.data === "로그인필요") {
      //       window.alert("로그인이 필요합니다.");
      //       return history.push("/");
      //     } else {
      //       console.log(result.data);
      //       window.alert(result.data);
      //     }
      //   })
      //   .catch(function (err) {
      //     window.alert("저장에 실패했습니다 개발/데이터 팀에게 문의해주세요", err);
      //   });
      // setnewname("");
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
    // if (!lecture["studentList"].includes(deletename)) {
    //   window.alert(`${deletename}이 수강생으로 등록되어 있지 않습니다.`);
    //   return;
    // }
    if (!studentOfLectureList.map((e, idx) => e["studentID"]).includes(deletename)) {
      window.alert(`${deletename}이 수강생으로 등록되어 있지 않습니다.`);
      return;
    }

    axios
      .delete(`/api/StudentOfLecture/${paramID}/${deletename}`)
      .then((result) => {
        if (result.data === true) {
          window.alert("삭제되었습니다");
          return window.location.reload();
        } else {
          window.alert(result.data);
        }
      })
      .catch((err) => {
        window.alert(`삭제에 실패했습니다. ${err}`);
      });

    // const newlecture = JSON.parse(JSON.stringify(lecture));
    // // studentList와 students에서 모두 삭제.
    // newlecture["studentList"].splice(newlecture["studentList"].indexOf(deletename), 1);
    // delete newlecture["students"][newname];
    // setlecture(newlecture);
    // updatelecture(newlecture);

    // const stuDB = await axios
    //   .get(`/api/StudentDB/${newname}`)
    //   .then((result) => {
    //     if (result.data === "로그인필요") {
    //       window.alert("로그인이 필요합니다.");
    //       return history.push("/");
    //     }
    //     return result["data"];
    //   })
    //   .catch((err) => {
    //     return err;
    //   });
    // // 학생DB에 수강중강의가 있고, 수강중강의에 해당 lectureID가 존재하는지부터 확인 후 제거
    // if ("수강중강의" in stuDB && stuDB["수강중강의"].includes(newlecture["lectureID"])) {
    //   await stuDB["수강중강의"].splice(stuDB["수강중강의"].indexOf(newlecture["lectureID"]), 1);
    // }
    // axios
    //   .put("/api/StudentDB", stuDB)
    //   .then(function (result) {
    //     if (result.data === true) {
    //       window.alert("삭제되었습니다.");
    //       return window.location.reload();
    //     } else if (result.data === "로그인필요") {
    //       window.alert("로그인이 필요합니다.");
    //       return history.push("/");
    //     } else {
    //       console.log(result.data);
    //       window.alert(result.data);
    //     }
    //   })
    //   .catch(function (err) {
    //     window.alert("저장에 실패했습니다 개발/데이터 팀에게 문의해주세요");
    //   });
  };

  // 과제 추가 관련 코드
  const [newassign, setnewassign] = useState("");
  const [newassigndate, setnewassigndate] = useState("");
  const [assignmodal, setassignmodal] = useState(false);
  const [assignstudents, setassignstudents] = useState([]);
  const [checkall, setcheckall] = useState(true);
  const [newassignment, setnewassignment] = useState({
    lectureID: null,
    description: "",
    duedate: "",
    pageRangeArray:[["",""]],
    startdate: today,
    textbookID: null,
    studentList: []
  });

  const [studentOfLectureList, setStudentOfLectureList] = useState([]); //강의 수강중인 학생 명단 관련 코드: DB 수정 작업

  const assignmodalOpen = () => {
    setassignmodal(true);
    //setassignstudents(Array.from({ length: lecture["studentList"].length }, () => true));
    setassignstudents(Array.from({ length: studentOfLectureList.length }, () => true));
    setcheckall(true);
  };
  const assignmodalClose = () => {
    setassignmodal(false);
    setnewassign("");
  };

  function assignAdd(){
    let state = true;
    // 학생을 선택하지 않은 경우
    if (!assignstudents.includes(true)) {
      window.alert("과제를 부여할 최소 1명 이상의 학생을 선택해야 합니다.");
      state = false;
    }
    if (newassignment["duedate"]=="") {
      window.alert("과제 마감일을 선택해야 합니다.");
      state = false;
    }
    newassignment["pageRangeArray"].map((Range, idx)=>{
      if (idx==0){
        if (newassignment["textbookID"]==null&&(! Range.includes(""))){
          window.alert("과제 범위의 교재가 선택되지 않았습니다.");
          state = false;
        }
        if((Range[0]==""&&Range[1]!="")||(Range[0]!=""&&Range[1]=="")){
          window.alert("빈 과제범위가 존재합니다. 범위를 작성해주세요.");
          state = false;
        }
      }
      else {
        if(Range[0]==""||Range[1]==""){
          window.alert("빈 과제범위가 존재합니다. 범위를 작성하거나 삭제해주세요.");
          state = false;
        }
      }
      if (Range[0]!="" && Range[1]!="" && (!/^[0-9]+$/.test(Range[0])||!/^[0-9]+$/.test(Range[1]))) {
        window.alert("과제 범위는 숫자만 입력 가능합니다.");
        state = false;
      }
      if (newassignment["description"]=="" && Range[0]=="" && Range[1]=="") {
        window.alert("과제 범위 또는 세부내용 중 최소 하나는 작성되어 있어야 합니다.");
        state = false;
      }
    })
    return state;
  };

  useEffect(()=>{
    var studentGotAssign = studentOfLectureList.filter((stu_id, idx)=>{
      return assignstudents[idx]===true
    }).map((element, index)=>{
      return element["_sid"]
    });
    let newselectedAssign = JSON.parse(JSON.stringify(newassignment));
    newselectedAssign["studentList"] = studentGotAssign;
    setnewassignment(newselectedAssign);
  },[assignstudents])

  // 과제 수정 관련 코드
  const [selectedAssign, setselectedAssign] = useState({});
  const [updateassign, setupdateassign] = useState("");
  const [updateassigndate, setupdateassigndate] = useState("");
  const [assignupdatemodal, setassignupdatemodal] = useState(false);
  const assignupdatemodalOpen = (assignment) => {
    setselectedAssign(assignment);
    setassignupdatemodal(true);
  };
  const assignupdatemodalClose = () => {
    setassignupdatemodal(false);
    setselectedAssign(-1);
    setupdateassign("");
    setupdateassigndate("");
  };

  function assignupdate(){
    let state = true;
    selectedAssign["pageRangeArray"].map((Range, idx)=>{
      if (idx==0){
        if (selectedAssign["textbookID"]==""&&(! Range.includes(""))){
          window.alert("과제 범위의 교재가 선택되지 않았습니다.");
          state = false;
        }
        if((Range[0]==""&&Range[1]!="")||(Range[0]!=""&&Range[1]=="")){
          window.alert("빈 과제범위가 존재합니다. 범위를 작성해주세요.");
          state = false;
        }
      }
      else {
        if(Range[0]==""||Range[1]==""){
          window.alert("빈 과제범위가 존재합니다. 범위를 작성하거나 삭제해주세요.");
          state = false;
        }
      }
      if (Range[0]!="" && Range[1]!="" && (!/^[0-9]+$/.test(Range[0])||!/^[0-9]+$/.test(Range[1]))) {
        window.alert("과제 범위는 숫자만 입력 가능합니다.");
        state = false;
      }
      if (selectedAssign["description"]=="" && Range[0]=="" && Range[1]=="") {
        window.alert("과제 범위 또는 세부내용 중 최소 하나는 작성되어 있어야 합니다.");
        state = false;
      }
    })
    return state;
  };

  useEffect(() => {
    if (selectedAssign in lecture["assignments"]) {
      setupdateassign(lecture["assignments"][selectedAssign]["과제내용"]);
      setupdateassigndate(lecture["assignments"][selectedAssign]["과제기한"]);
    }
  }, [selectedAssign]);

  // 과제 삭제 관련 코드
  const assignDelete = async (assignID) => {
    console.log(assignID);
    if (!window.confirm("선택한 과제를 삭제하시겠습니까?")) {
      return;
    }
    // if (!studentOfLectureList.map((e, idx) => e["studentID"]).includes(deletename)) {
    //   window.alert(`${deletename}이 수강생으로 등록되어 있지 않습니다.`);
    //   return;
    // }
    axios
      .delete(`/api/Assignment/${assignID["assignmentID"]}`)
      .then((result) => {
        if (result.data === true) {
          window.alert("삭제되었습니다");
          return window.location.reload();
        } else {
          window.alert(result.data);
        }
      })
      .catch((err) => {
        window.alert(`삭제에 실패했습니다. ${err}`);
      });
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
    let tmp = JSON.parse(JSON.stringify(newassignment));
    tmp["lectureID"] = newlecture["_id"];
    setnewassignment(tmp);

    //강의 수강중인 학생 명단을 StudentOfLecture를 통해 가져옴
    const newStudentOfLectureList = await axios
      .get(`/api/StudentOfLecture/${paramID}`)
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
    // console.log("sol:"+JSON.stringify(newStudentOfLectureList));
    setStudentOfLectureList(newStudentOfLectureList);
    let newselectedAssign = JSON.parse(JSON.stringify(newassignment));
    newselectedAssign["studentList"] = new Array(newStudentOfLectureList.length).fill(true);
    setnewassignment(newselectedAssign);
  }, []);

  const [assignments, setAssignments] = useState([]);
  //현재 강의의 assignment 가져오기
  useEffect(async () => {
    if (!("_id" in lecture)) return;
    // let tmp = lecture["_id"].toString();
    const existingAssignments = await axios
      .get(`/api/Assignment/${paramID}`)
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
    existingAssignments.map((e)=>{
      const assignment={...e};
      if(assignment["pageRangeArray"].length==0) assignment["pageRangeArray"].push(["",""]);
      return assignment;
    })
    setAssignments(existingAssignments);
    console.log("assignments: ", existingAssignments);
  }, [lecture]);

  const [textbook, settextbook] = useState([]);
  // const [selectedTextbook, setselectedTextbook] = useState(null);
  //매칭되는 textbook의 _id, 이름을 가져오기
  useEffect(async () => {
    if (!("_id" in lecture)) return;
    // let tmp = lecture["_id"].toString();
    const usingTextbook = await axios
      .get(`/api/TextbookOfLecture/${paramID}`)
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
    settextbook(usingTextbook);
    // console.log(usingTextbook);
  }, [lecture]);

  useEffect(() => {
    setfilteredstuDBList(
      stuDBList.filter((studb) => {
        return studb["ID"].includes(newname);
      })
    );
  }, [newname]);

  // 과제 아코디언 UI 관련 코드
  function CustomToggle({ children, eventKey }) {
    const decoratedOnClick = useAccordionButton(eventKey, () => console.log("totally custom!"));

    return (
      <button type="button" style={{ backgroundColor: "pink" }} onClick={decoratedOnClick}>
        {children}
      </button>
    );
  }

  return (
    <div className="background">
      <h3 className="fw-bold">
        {lecture["lectureName"]} ({lecture["manager"]})
      </h3>

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
            <div className="col-3">사용 교재</div>
            <div className="col-9">
              <Form.Select
                type="text"
                value={newassignment["textbookID"]}
                onChange={(e) => {
                  let newselectedAssign = JSON.parse(JSON.stringify(newassignment));
                  newselectedAssign["textbookID"] = e.target.value;
                  setnewassignment(newselectedAssign);
                  // console.log(newselectedAssign);
                }}
              >
                <option value="">선택</option>
                {textbook.map((value, index) => (
                  <option value={value["textbookID"]}>{value["textbookName"]}</option>
                ))}
              </Form.Select>
            </div>
          </div>
          <div className="row mb-2">
            {newassignment["pageRangeArray"]? (
              newassignment["pageRangeArray"].map((assign, idx) => {
                return (
                  <div className="row mb-2">
                    <div className="col-3">과제 범위{idx + 1}</div>
                    <div className="col-2">
                      <input
                        className="w-100"
                        type="text"
                        value={assign[0]}
                        onChange={(e) => {
                          let newselectedAssign = JSON.parse(JSON.stringify(newassignment));
                          newselectedAssign["pageRangeArray"][idx][0] = e.target.value;
                          setnewassignment(newselectedAssign);
                          // console.log(selectedAssign);
                        }}
                      />
                    </div>
                    <div className="col-1">
                      <p>~</p>
                    </div>
                    <div className="col-2">
                      <input
                        className="w-100"
                        type="text"
                        value={assign[1]}
                        onChange={(e) => {
                          let newselectedAssign = JSON.parse(JSON.stringify(newassignment));
                          newselectedAssign["pageRangeArray"][idx][1] = e.target.value;
                          setnewassignment(newselectedAssign);
                          // console.log(selectedAssign);
                        }}
                      />
                    </div>
                    {idx!=0 ? 
                    <div className="col-1">
                    <Button
                      className="assignmentDeleteBtn"
                      variant="secondary"
                      onClick={() => {
                        let newselectedAssign = JSON.parse(JSON.stringify(newassignment));
                        newselectedAssign["pageRangeArray"].splice(idx,1);
                        setnewassignment(newselectedAssign);
                        console.log(newassignment);
                      }}
                    >
                      <p>x</p>
                    </Button>
                  </div>
                  :null
                    }
                  </div>
                );
              })
            ) : null}
            <div className="col-3">
              <Button
                className="btn-edit assignmentEditBtn"
                variant="secondary"
                onClick={() => {
                  let newselectedAssign = JSON.parse(JSON.stringify(newassignment));
                  newselectedAssign["pageRangeArray"] = [...newselectedAssign["pageRangeArray"], ["",""]];
                  setnewassignment(newselectedAssign);
                }}
              >
                범위 추가
              </Button>
            </div>
          </div>
          <div className="row mb-2">
            <div className="col-3">세부 내용</div>
            <div className="col-9">
              <input
                className="w-100"
                type="text"
                value={newassignment["description"]}
                placeholder="기타 세부사항 (필수작성X)"
                onChange={(e) => {
                  let newselectedAssign = JSON.parse(JSON.stringify(newassignment));
                  newselectedAssign["description"] = e.target.value;
                  setnewassignment(newselectedAssign);
                }}
              />
            </div>
          </div>

          <div className="row mb-2">
            <div className="col-3">과제 기한</div>
            <div className="col-9">
              <input
                type="date"
                value={newassignment["duedate"]}
                className="w-100"
                onChange={(e) => {
                  let newselectedAssign = JSON.parse(JSON.stringify(newassignment));
                  newselectedAssign["duedate"] = e.target.value;
                  setnewassignment(newselectedAssign);
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
                  setassignstudents(Array.from({ length: studentOfLectureList.length }, () => true));
                  setcheckall(true);
                } else {
                  setassignstudents(Array.from({ length: studentOfLectureList.length }, () => false));
                  setcheckall(false);
                }
              }}
              
            />
          </div>

          <div className="row">
            {studentOfLectureList.map((student, idx) => {
              return (
                <div className="col-3" key={idx}>
                  <Form.Check
                    type="checkbox"
                    label={student["studentName"]}
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

          <Button className="btn-secondary program-add"
          onClick={() => {
            console.log(newassignment);
            console.log(assignstudents);
            if(assignAdd()&&newassignment["lectureID"]){
              if (window.confirm("해당 학생들에게 과제를 부여하시겠습니까?")) {
                axios
                .post("/api/Assignment", newassignment)
                .then(function (result) {
                  if (result.data === true) {
                    window.alert("저장되었습니다.");
                    window.location.reload();
                  } else if (result.data === "로그인필요") {
                    window.alert("로그인이 필요합니다.");
                    return history.push("/");
                  } else {
                    console.log(result.data);
                    window.alert(result.data);
                  }
                })
                .catch(function (err) {
                  console.log("저장 실패 : ", err);
                  window.alert(err);
                });
            }
            }
          }}
          type="button">
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
            <div className="col-3">사용 교재</div>
            <div className="col-9">
              <Form.Select
                type="text"
                value={
                  textbook.length >= 1 && selectedAssign["textbookID"]
                    ? textbook.filter((book) => {
                        return book["textbookID"] === selectedAssign["textbookID"];
                      })[0]["textbookID"]
                    : ""
                }
                onChange={(e) => {
                  let newselectedAssign = JSON.parse(JSON.stringify(selectedAssign));
                  newselectedAssign["textbookID"] = e.target.value;
                  setselectedAssign(newselectedAssign);
                  // console.log(newselectedAssign);
                }}
              >
                <option value="">선택</option>
                {textbook.map((value, index) => (
                  <option value={value["textbookID"]}>{value["textbookName"]}</option>
                ))}
              </Form.Select>
            </div>
          </div>
          <div className="row mb-2">
            {selectedAssign["pageRangeArray"]? (
              selectedAssign["pageRangeArray"].map((assign, idx) => {
                return (
                  <div className="row mb-2">
                    <div className="col-3">과제 범위{idx + 1}</div>
                    <div className="col-2">
                      <input
                        className="w-100"
                        type="text"
                        value={assign[0]}
                        onChange={(e) => {
                          let newselectedAssign = JSON.parse(JSON.stringify(selectedAssign));
                          newselectedAssign["pageRangeArray"][idx][0] = e.target.value;
                          setselectedAssign(newselectedAssign);
                          // console.log(selectedAssign);
                        }}
                      />
                    </div>
                    <div className="col-1">
                      <p>~</p>
                    </div>
                    <div className="col-2">
                      <input
                        className="w-100"
                        type="text"
                        value={assign[1]}
                        onChange={(e) => {
                          let newselectedAssign = JSON.parse(JSON.stringify(selectedAssign));
                          newselectedAssign["pageRangeArray"][idx][1] = e.target.value;
                          setselectedAssign(newselectedAssign);
                          // console.log(selectedAssign);
                        }}
                      />
                    </div>
                    {idx!=0 ? 
                    <div className="col-1">
                    <Button
                      className="assignmentDeleteBtn"
                      variant="secondary"
                      onClick={() => {
                        let newselectedAssign = JSON.parse(JSON.stringify(selectedAssign));
                        newselectedAssign["pageRangeArray"].splice(idx,1);
                        setselectedAssign(newselectedAssign);
                        console.log(selectedAssign);
                      }}
                    >
                      <p>x</p>
                    </Button>
                  </div>
                  :null
                    }
                  </div>
                );
              })
            ) : null}
            <div className="col-3">
              <Button
                className="btn-edit assignmentEditBtn"
                variant="secondary"
                onClick={() => {
                  let newselectedAssign = JSON.parse(JSON.stringify(selectedAssign));
                  newselectedAssign["pageRangeArray"] = [...newselectedAssign["pageRangeArray"], ["",""]];
                  setselectedAssign(newselectedAssign);
                }}
              >
                범위 추가
              </Button>
            </div>
          </div>
          <div className="row mb-2">
            <div className="col-3">세부 내용</div>
            <div className="col-9">
              <input
                className="w-100"
                type="text"
                value={selectedAssign["description"]}
                placeholder="기타 세부사항 (필수작성X)"
                onChange={(e) => {
                  let newselectedAssign = JSON.parse(JSON.stringify(selectedAssign));
                  newselectedAssign["description"] = e.target.value;
                  setselectedAssign(newselectedAssign);
                  // console.log(selectedAssign);
                }}
              />
            </div>
          </div>

          <div className="row mb-2">
            <div className="col-3">과제 기한</div>
            <div className="col-9">
              <input
                type="date"
                value={selectedAssign["duedate"]}
                className="w-100"
                onChange={(e) => {
                  let newselectedAssign = JSON.parse(JSON.stringify(selectedAssign));
                  newselectedAssign["duedate"] = e.target.value;
                  setselectedAssign(newselectedAssign);
                }}
              />
            </div>
          </div>

          <Button
            className="btn-secondary program-add"
            onClick={() => {
              console.log(selectedAssign);
              if(assignupdate()){
                if (window.confirm("과제정보를 수정하시겠습니까?")) {
                  axios
                  .put("/api/Assignment", selectedAssign)
                  .then(function (result) {
                    if (result.data === true) {
                      window.alert("저장되었습니다.");
                      window.location.reload();
                      // history.push("/studentList");
                    } else if (result.data === "로그인필요") {
                      window.alert("로그인이 필요합니다.");
                      return history.push("/");
                    } else {
                      console.log(result.data);
                      window.alert(result.data);
                    }
                  })
                  .catch(function (err) {
                    console.log("저장 실패 : ", err);
                    window.alert(err);
                  });
              }
              }
            }}
            type="button"
          >
            <strong>
              <FaPencilAlt></FaPencilAlt>
            </strong>
          </Button>
        </Modal.Body>
      </Modal>

      <div className="row">
        <Button
          variant="dark"
          className="btn-edit w-90 m-3"
          onClick={() => {
            namemodalOpen();
          }}
        >
          + 학생 추가 +
        </Button>
        {/* 학생리스트 */}
        <div className="col-md-8">
          <div className="assignmentContainer">
            <h5 className="btn-add">과제 O</h5>
            <div className="assignmentSubContainer">
              {lecture["studentList"]
                .filter((student) => lecture["students"][student]["진행중과제"].length !== 0)
                .map((student, index) => {
                  return (
                    <div className="attendingStudent-card" key={index}>
                      <p className="fs-5">{student.split("_")[0]}</p>
                      <Accordion defaultActiveKey="0">
                        <Card>
                          <Card.Header className="assignmentToggleBtn">
                            <CustomToggle eventKey="0">진행중인 과제 ({lecture["students"][student]["진행중과제"].length})</CustomToggle>
                          </Card.Header>
                          <Accordion.Collapse eventKey="0">
                            <Card.Body>
                              {lecture["students"][student]["진행중과제"].map((assign, idx) => {
                                return (
                                  <div key={idx} className="attendingStudent-card assignment-card w-100">
                                    <p
                                      className={
                                        today < lecture["assignments"][assign]["과제기한"]
                                          ? "after"
                                          : today == lecture["assignments"][assign]["과제기한"]
                                          ? "now"
                                          : "before"
                                      }
                                    >
                                      <strong>{lecture["assignments"][assign]["과제기한"]} 까지</strong>
                                    </p>
                                    <p>{lecture["assignments"][assign]["과제내용"]}</p>
                                    <Button
                                      className="lectureEditingBtn btn-edit w-100"
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
                                      완료처리
                                    </Button>
                                  </div>
                                );
                              })}
                            </Card.Body>
                          </Accordion.Collapse>
                        </Card>
                        <Card>
                          <Card.Header className="assignmentToggleBtn">
                            <CustomToggle eventKey="1">완료된 과제 ({lecture["students"][student]["완료된과제"].length})</CustomToggle>
                          </Card.Header>
                          <Accordion.Collapse eventKey="1">
                            <Card.Body>
                              {lecture["students"][student]["완료된과제"].map((assign, idx) => {
                                return (
                                  <div key={idx} className="attendingStudent-card assignment-card w-100">
                                    <p className={assign[1] <= lecture["assignments"][assign[0]]["과제기한"] ? "after" : "before"}>
                                      <strong>{lecture["assignments"][assign[0]]["과제기한"]} 까지</strong>
                                    </p>{" "}
                                    <p>
                                      <strong>{assign[1]} 완료</strong>
                                    </p>
                                    <p>{lecture["assignments"][assign[0]]["과제내용"]}</p>
                                    <Button
                                      className="lectureEditingBtn btn-cancel w-100"
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
                                      완료해제처리
                                    </Button>
                                  </div>
                                );
                              })}
                            </Card.Body>
                          </Accordion.Collapse>
                        </Card>
                      </Accordion>
                      <div className="text-end rightbelow">
                        <Button
                          onClick={() => {
                            studentDelete(student);
                          }}
                          variant="danger"
                          className="lectureEditingBtn btn-cancel m-auto"
                        >
                          삭제
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
            <h4 className="btn-add">과제 X</h4>
            <div className="assignmentSubContainer">
              {/* {lecture["studentList"]
                .filter((student) => lecture["students"][student]["진행중과제"].length === 0)
                .map((student, index) => {
                  return (
                    <div className="attendingStudent-card" key={index}>
                      <p className="fs-5">{student.split("_")[0]}</p>
                      <Accordion>
                        <Card>
                          <Card.Header className="assignmentToggleBtn">
                            <CustomToggle eventKey="0">완료된 과제 ({lecture["students"][student]["완료된과제"].length})</CustomToggle>
                          </Card.Header>
                          <Accordion.Collapse eventKey="0">
                            <Card.Body>
                              {lecture["students"][student]["완료된과제"].map((assign, idx) => {
                                return (
                                  <div key={idx} className="attendingStudent-card assignment-card w-100">
                                    <p className={assign[1] <= lecture["assignments"][assign[0]]["과제기한"] ? "after" : "before"}>
                                      <strong>{lecture["assignments"][assign[0]]["과제기한"]} 까지</strong>
                                    </p>{" "}
                                    <p>
                                      <strong>{assign[1]} 완료</strong>
                                    </p>
                                    <p>{lecture["assignments"][assign[0]]["과제내용"]}</p>
                                    <Button
                                      className="lectureEditingBtn btn-cancel w-100"
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
                                      완료해제처리
                                    </Button>
                                  </div>
                                );
                              })}
                            </Card.Body>
                          </Accordion.Collapse>
                        </Card>
                      </Accordion>
                      <div className="text-end m-1">
                        <Button
                          onClick={() => {
                            studentDelete(student);
                          }}
                          variant="secondary"
                          className="lectureEditingBtn btn-cancel m-auto rightbelow"
                        >
                          삭제
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {studentOfLectureList.map((student,idx)=>{
                  // console.log(student);
                  return student["studentID"];
                })
                .map((student, index) => {
                  return (
                    <div className="attendingStudent-card" key={index}>
                      <p className="fs-5">{student.split("_")[0]}</p>
                      <Accordion>
                        <Card>
                          
                        </Card>
                      </Accordion>
                      <div className="text-end m-1" >
                        <Button
                          onClick={() => {
                            studentDelete(student);
                          }}
                          variant="secondary"
                          className="lectureEditingBtn btn-cancel m-auto rightbelow"
                        >
                          삭제
                        </Button>
                      </div>
                    </div>
                  );
                })} */}
              {/* {
                  console.log("list:"+JSON.stringify(studentOfLectureList.map((e,idx)=>{
                    return e["studentID"];
                  })))?null:null
                } */}
              {studentOfLectureList
                .map((student, idx) => {
                  // console.log(student);
                  return student["studentID"];
                })
                .map((student, index) => {
                  return (
                    <div className="attendingStudent-card" key={index}>
                      <p className="fs-5">{student.split("_")[0]}</p>
                      <Accordion>
                        <Card></Card>
                      </Accordion>
                      <div className="text-end m-1">
                        <Button
                          onClick={() => {
                            studentDelete(student);
                          }}
                          variant="secondary"
                          className="lectureEditingBtn btn-cancel m-auto rightbelow"
                        >
                          삭제
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* 과제리스트 */}
        <div className="col-md-4">
          <div className="assignmentContainer">
            <Button
              variant="dark"
              className="btn-add w-100 mb-2"
              onClick={() => {
                assignmodalOpen();
              }}
            >
              <strong>+ 과제 추가 +</strong>
            </Button>
            {assignments
              .sort(function (a, b) {
                return +(new Date(a.duedate) < new Date(b.duedate)) - 0.5;
              })
              .map((assignID, index) => {
                return (
                  <ListGroup.Item key={index}>
                    <p>
                      <strong>{assignID["description"]}</strong>
                    </p>
                    <p>{assignID["duedate"]} 까지</p>
                    <div>
                      <Button
                        className="lectureEditingBtn btn-edit me-1"
                        variant="secondary"
                        onClick={() => {
                          console.log(assignments);
                          // setselectedAssign(assignID);
                          // if (selectedAssign&&selectedAssign['pageRangeArray'].length==0){
                          //  let selectedAssign = {...selectedAssign};
                          //  selectedAssign['pageRangeArray'] = [[]];
                          //  setselectedAssign(selectedAssign);
                          // }
                          assignupdatemodalOpen(assignID);
                        }}
                      >
                        <strong>수정</strong>
                      </Button>
                      <Button
                        className="lectureEditingBtn btn-cancel m-auto"
                        variant="secondary"
                        onClick={() => {
                          assignDelete(assignID);
                        }}
                      >
                        <strong>삭제</strong>
                      </Button>
                    </div>
                  </ListGroup.Item>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Lecture;
